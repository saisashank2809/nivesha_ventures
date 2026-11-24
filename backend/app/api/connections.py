from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.models.database import get_db
from app.models.models import Connection, ConnectionStatus, Venture, User, UserRole, Message
from app.schemas.schemas import ConnectionResponse, ConnectionRequestPayload, ConnectionConsentPayload, MessageResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/connections", tags=["connections"])


def format_connection(conn: Connection) -> ConnectionResponse:
    venture_name = conn.venture.company_name if conn.venture else "Venture"
    investor_name = conn.investor.full_name if conn.investor else "Investor"
    investor_firm = conn.investor.firm_or_company if conn.investor else None

    return ConnectionResponse(
        id=conn.id,
        venture_id=conn.venture_id,
        company_name=venture_name,
        investor_id=conn.investor_id,
        investor_name=investor_name,
        investor_firm=investor_firm,
        status=conn.status,
        requested_by=conn.requested_by,
        investor_consent=conn.investor_consent,
        founder_consent=conn.founder_consent,
        request_note=conn.request_note,
        created_at=conn.created_at,
        connected_at=conn.connected_at,
    )


@router.get("", response_model=List[ConnectionResponse])
def list_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.INVESTOR:
        connections = db.query(Connection).filter(Connection.investor_id == current_user.id).order_by(Connection.created_at.desc()).all()
    elif current_user.role == UserRole.FOUNDER:
        connections = (
            db.query(Connection)
            .join(Venture, Connection.venture_id == Venture.id)
            .filter(Venture.founder_id == current_user.id)
            .order_by(Connection.created_at.desc())
            .all()
        )
    else:
        connections = db.query(Connection).order_by(Connection.created_at.desc()).all()

    return [format_connection(c) for c in connections]


def format_message(m: Message) -> MessageResponse:
    sender_name = m.sender.full_name if m.sender else "User"
    sender_role = m.sender.role if m.sender else UserRole.FOUNDER

    return MessageResponse(
        id=m.id,
        connection_id=m.connection_id,
        sender_id=m.sender_id,
        sender_name=sender_name,
        sender_role=sender_role,
        recipient_id=m.recipient_id,
        content=m.content,
        is_read=m.is_read,
        timestamp=m.timestamp,
    )


@router.get("/messages/unread", response_model=List[MessageResponse])
def get_unread_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unread = (
        db.query(Message)
        .filter(Message.recipient_id == current_user.id, Message.is_read == False)
        .order_by(Message.timestamp.desc())
        .all()
    )
    return [format_message(m) for m in unread]


@router.post("/request", response_model=ConnectionResponse)
def request_connection(
    payload: ConnectionRequestPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.INVESTOR:
        raise HTTPException(status_code=403, detail="Only investors can initiate connection requests with ventures.")

    venture = db.query(Venture).filter(Venture.id == payload.venture_id).first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found.")

    # Check if connection already exists
    existing = (
        db.query(Connection)
        .filter(Connection.venture_id == venture.id, Connection.investor_id == current_user.id)
        .first()
    )
    if existing:
        # Upgrade to connected so parties can direct message immediately
        if existing.status != ConnectionStatus.CONNECTED:
            existing.status = ConnectionStatus.CONNECTED
            existing.founder_consent = True
            existing.investor_consent = True
            existing.connected_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing)

        # If note provided, send it as direct message
        if payload.note and payload.note.strip():
            msg = Message(
                connection_id=existing.id,
                sender_id=current_user.id,
                recipient_id=venture.founder_id,
                content=payload.note.strip(),
                is_read=False,
            )
            db.add(msg)
            db.commit()

        return format_connection(existing)

    # Create new instantly connected direct DM channel
    conn = Connection(
        venture_id=venture.id,
        investor_id=current_user.id,
        status=ConnectionStatus.CONNECTED,
        requested_by=UserRole.INVESTOR,
        investor_consent=True,
        founder_consent=True,
        reviewer_approved=True,
        request_note=payload.note,
        connected_at=datetime.now(timezone.utc),
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)

    # Post introductory message if note provided, or default welcome greeting
    msg_content = payload.note.strip() if (payload.note and payload.note.strip()) else f"Hello {venture.company_name}! I have reviewed your venture dossier on Nivesha and would like to connect directly."
    first_msg = Message(
        connection_id=conn.id,
        sender_id=current_user.id,
        recipient_id=venture.founder_id,
        content=msg_content,
        is_read=False,
    )
    db.add(first_msg)
    db.commit()

    return format_connection(conn)


@router.post("/{id}/consent", response_model=ConnectionResponse)
def submit_consent(
    id: str,
    payload: ConnectionConsentPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = db.query(Connection).filter(Connection.id == id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection record not found.")

    is_founder = conn.venture and conn.venture.founder_id == current_user.id
    is_investor = conn.investor_id == current_user.id

    if not (is_founder or is_investor or current_user.role == UserRole.REVIEWER):
        raise HTTPException(status_code=403, detail="You do not have permission to consent for this connection.")

    if is_founder:
        conn.founder_consent = payload.consent
    if is_investor:
        conn.investor_consent = payload.consent

    if not payload.consent:
        conn.status = ConnectionStatus.DECLINED
    elif conn.founder_consent and conn.investor_consent:
        conn.status = ConnectionStatus.CONNECTED
        conn.connected_at = datetime.now(timezone.utc)

        # Seed introductory welcome message in chat
        welcome_msg = Message(
            connection_id=conn.id,
            sender_id=conn.venture.founder_id,
            recipient_id=conn.investor_id,
            content=f"Hello! Thank you for connecting with {conn.venture.company_name}. We look forward to discussing our round and sharing any additional diligence materials you may need.",
        )
        db.add(welcome_msg)

    db.commit()
    db.refresh(conn)

    return format_connection(conn)
