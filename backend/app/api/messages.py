from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.models import Connection, ConnectionStatus, Message, User, UserRole
from app.schemas.schemas import MessageResponse, MessageSendPayload
from app.api.auth import get_current_user

router = APIRouter(prefix="/connections/{connection_id}/messages", tags=["messages"])


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


@router.get("", response_model=List[MessageResponse])
def get_messages(
    connection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found.")

    is_founder = conn.venture and conn.venture.founder_id == current_user.id
    is_investor = conn.investor_id == current_user.id

    if not (is_founder or is_investor or current_user.role == UserRole.REVIEWER):
        raise HTTPException(status_code=403, detail="You are not authorized to view messages in this conversation.")

    # Mark unread messages as read
    db.query(Message).filter(
        Message.connection_id == connection_id,
        Message.recipient_id == current_user.id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.commit()

    messages = (
        db.query(Message)
        .filter(Message.connection_id == connection_id)
        .order_by(Message.timestamp.asc())
        .all()
    )
    return [format_message(m) for m in messages]


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    connection_id: str,
    payload: MessageSendPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found.")

    if conn.status != ConnectionStatus.CONNECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Direct messaging is only unlocked after mutual connection consent.",
        )

    is_founder = conn.venture and conn.venture.founder_id == current_user.id
    is_investor = conn.investor_id == current_user.id

    if not (is_founder or is_investor):
        raise HTTPException(status_code=403, detail="Only connected parties can exchange messages.")

    recipient_id = conn.investor_id if is_founder else conn.venture.founder_id

    msg = Message(
        connection_id=connection_id,
        sender_id=current_user.id,
        recipient_id=recipient_id,
        content=payload.content.strip(),
        is_read=False,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return format_message(msg)
