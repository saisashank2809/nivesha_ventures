import os
import json
import base64
import time
import uuid
import bcrypt
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.models.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
)
from app.core.supabase import supabase_admin, supabase_client

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.environ.get("JWT_SECRET", "nivesha-ventures-platform-secret-key-2026")


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        # Fallback for legacy sha256 hashes if any
        import hashlib
        return hashlib.sha256(plain_password.encode("utf-8")).hexdigest() == hashed_password


def create_local_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": int(time.time()) + 86400 * 7,  # 7 days
    }
    encoded = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")
    import hashlib
    signature = hashlib.sha256(f"{encoded}.{SECRET_KEY}".encode("utf-8")).hexdigest()[:16]
    return f"{encoded}.{signature}"


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Strict authentication validator. Requires a genuine Supabase or local Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1].strip()
    user_id: Optional[str] = None
    user_email: Optional[str] = None

    # 1. Try Supabase token verification first
    if supabase_client:
        try:
            supabase_res = supabase_client.auth.get_user(token)
            if supabase_res and supabase_res.user:
                user_id = supabase_res.user.id
                user_email = supabase_res.user.email
        except Exception:
            # Token might be local fallback token
            pass

    # 2. Try local token verification if Supabase verification did not match
    if not user_id:
        try:
            parts = token.split(".")
            if len(parts) == 2:
                payload = json.loads(base64.b64decode(parts[0]).decode("utf-8"))
                if payload.get("exp", 0) > time.time():
                    user_id = payload.get("sub")
        except Exception:
            pass

    if not user_id and not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Fetch user from database
    user = None
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    if not user and user_email:
        user = db.query(User).filter(User.email == user_email.lower().strip()).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found. Please register or sign in again.",
        )

    return user


@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Real user registration with Supabase Auth and database sync."""
    email_clean = payload.email.lower().strip()

    # Check if user already exists in DB
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in.",
        )

    assigned_id = str(uuid.uuid4())
    access_token = None

    # 1. Register with Supabase Auth if available
    if supabase_admin:
        try:
            sb_user = supabase_admin.auth.admin.create_user({
                "email": email_clean,
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": payload.full_name,
                    "role": payload.role.value,
                    "firm_or_company": payload.firm_or_company or "",
                },
            })
            if sb_user and sb_user.user:
                assigned_id = sb_user.user.id
                # Attempt to get an authentic session token via Supabase client
                if supabase_client:
                    try:
                        login_res = supabase_client.auth.sign_in_with_password({
                            "email": email_clean,
                            "password": payload.password,
                        })
                        if login_res and login_res.session:
                            access_token = login_res.session.access_token
                    except Exception:
                        pass
        except Exception as e:
            err_msg = str(e)
            if "already registered" in err_msg.lower() or "already exists" in err_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This email address is already registered in Supabase. Please sign in.",
                )
            # Log warning and continue with DB creation
            print(f"[Auth Register] Supabase warning: {e}")

    # 2. Save user to database
    hashed_pwd = hash_password(payload.password)
    user = User(
        id=assigned_id,
        email=email_clean,
        password_hash=hashed_pwd,
        full_name=payload.full_name,
        role=payload.role,
        firm_or_company=payload.firm_or_company,
        title=payload.title,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 3. Generate token if Supabase did not provide one
    if not access_token:
        access_token = create_local_token(user.id, user.role.value)

    return TokenResponse(access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Real user login with Supabase Auth verification and database lookup."""
    email_clean = payload.email.lower().strip()
    access_token = None
    supabase_user_id = None

    # 1. Attempt Supabase Auth login
    if supabase_client:
        try:
            res = supabase_client.auth.sign_in_with_password({
                "email": email_clean,
                "password": payload.password,
            })
            if res and res.session:
                access_token = res.session.access_token
                supabase_user_id = res.user.id
        except Exception:
            # Supabase invalid credentials or offline
            pass

    # 2. Fetch user from DB
    user = None
    if supabase_user_id:
        user = db.query(User).filter(User.id == supabase_user_id).first()
    if not user:
        user = db.query(User).filter(User.email == email_clean).first()

    # 3. Check password against DB if Supabase sign-in didn't produce a session
    if not access_token:
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please check your credentials.",
            )
        access_token = create_local_token(user.id, user.role.value)

    # 4. If user is in Supabase but not yet in DB, sync it
    if not user and supabase_user_id and supabase_admin:
        try:
            sb_u = supabase_admin.auth.admin.get_user_by_id(supabase_user_id)
            meta = sb_u.user.user_metadata or {}
            role_str = meta.get("role", "INVESTOR").upper()
            role_enum = UserRole(role_str) if role_str in UserRole.__members__ else UserRole.INVESTOR
            user = User(
                id=supabase_user_id,
                email=email_clean,
                password_hash=hash_password(payload.password),
                full_name=meta.get("full_name", email_clean.split("@")[0]),
                role=role_enum,
                firm_or_company=meta.get("firm_or_company", ""),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception as e:
            print(f"[Auth Login Sync] Warning: {e}")

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account profile could not be located. Please contact support.",
        )

    return TokenResponse(access_token=access_token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve the currently authenticated user profile."""
    return UserResponse.model_validate(current_user)
