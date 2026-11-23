import hashlib
import json
import base64
import time
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
    SwitchUserRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = "nivesha-ventures-platform-secret-key-2026"


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": int(time.time()) + 86400 * 7,  # 7 days
    }
    encoded = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")
    signature = hashlib.sha256(f"{encoded}.{SECRET_KEY}".encode("utf-8")).hexdigest()[:16]
    return f"{encoded}.{signature}"


def get_current_user(
    authorization: Optional[str] = Header(None),
    x_demo_user_id: Optional[str] = Header(None, alias="X-Demo-User-Id"),
    x_demo_role: Optional[str] = Header(None, alias="X-Demo-Role"),
    db: Session = Depends(get_db),
) -> User:
    # 1. Check for quick demo header override
    if x_demo_user_id:
        user = db.query(User).filter(User.id == x_demo_user_id).first()
        if user:
            return user

    if x_demo_role:
        user = db.query(User).filter(User.role == x_demo_role.upper()).first()
        if user:
            return user

    # 2. Check Authorization Bearer token
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            parts = token.split(".")
            if len(parts) == 2:
                payload = json.loads(base64.b64decode(parts[0]).decode("utf-8"))
                user_id = payload.get("sub")
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    return user
        except Exception:
            pass

    # Default to first reviewer user if available
    default_user = db.query(User).filter(User.role == UserRole.REVIEWER).first()
    if not default_user:
        default_user = db.query(User).first()
    if not default_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    return default_user


@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    user = User(
        email=payload.email.lower().strip(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        firm_or_company=payload.firm_or_company,
        title=payload.title,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or user.password_hash != hash_password(payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/switch-demo", response_model=TokenResponse)
def switch_demo(payload: SwitchUserRequest, db: Session = Depends(get_db)):
    """Fast persona switch between seeded demo accounts for frictionless testing."""
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
    else:
        user = db.query(User).filter(User.role == payload.role).first()

    if not user:
        raise HTTPException(status_code=404, detail="Demo persona not found.")

    token = create_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
