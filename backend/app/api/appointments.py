from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.models.database import get_db
from app.models.models import (
    AppointmentRequest,
    AppointmentStatus,
    Venture,
    User,
    UserRole,
    MatchCase,
    ReviewStage,
)
from app.schemas.schemas import AppointmentRequestCreate, AppointmentRequestResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/appointments", tags=["appointments"])


def format_appointment(appt: AppointmentRequest) -> AppointmentRequestResponse:
    v_name = appt.venture.company_name if appt.venture else "Venture"
    inv_name = appt.investor.full_name if appt.investor else "Investor"
    inv_firm = appt.investor.firm_or_company if appt.investor else None
    fnd_name = appt.founder.full_name if appt.founder else "Founder"

    return AppointmentRequestResponse(
        id=appt.id,
        match_case_id=appt.match_case_id,
        venture_id=appt.venture_id,
        venture_name=v_name,
        investor_id=appt.investor_id,
        investor_name=inv_name,
        investor_firm=inv_firm,
        founder_id=appt.founder_id,
        founder_name=fnd_name,
        requested_by=appt.requested_by,
        meeting_purpose=appt.meeting_purpose,
        sharing_scope=appt.sharing_scope,
        preferred_times=appt.preferred_times or [],
        status=appt.status,
        notes=appt.notes,
        created_at=appt.created_at,
    )


@router.post("", response_model=AppointmentRequestResponse)
def create_appointment(
    payload: AppointmentRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    venture = db.query(Venture).filter(Venture.id == payload.venture_id).first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found.")

    if current_user.role == UserRole.INVESTOR:
        investor_id = current_user.id
        founder_id = venture.founder_id
        requested_by = UserRole.INVESTOR
    elif current_user.role == UserRole.FOUNDER:
        founder_id = current_user.id
        # Default or assigned investor
        investor = db.query(User).filter(User.role == UserRole.INVESTOR).first()
        investor_id = investor.id if investor else current_user.id
        requested_by = UserRole.FOUNDER
    else:
        # Reviewer creating on behalf of an investor
        investor = db.query(User).filter(User.role == UserRole.INVESTOR).first()
        investor_id = investor.id if investor else current_user.id
        founder_id = venture.founder_id
        requested_by = UserRole.REVIEWER

    appt = AppointmentRequest(
        match_case_id=payload.match_case_id,
        venture_id=venture.id,
        investor_id=investor_id,
        founder_id=founder_id,
        requested_by=requested_by,
        meeting_purpose=payload.meeting_purpose,
        sharing_scope=payload.sharing_scope or "Declared sales breakdown and expansion assumptions",
        preferred_times=payload.preferred_times or ["Thursday 3:00 PM IST", "Friday 11:00 AM IST"],
        status=AppointmentStatus.REQUESTED,
        notes=payload.notes,
    )
    db.add(appt)

    # If linked to a MatchCase, advance review stage to APPOINTMENT_REQUESTED
    if payload.match_case_id:
        mc = db.query(MatchCase).filter(MatchCase.id == payload.match_case_id).first()
        if mc:
            mc.review_stage = ReviewStage.APPOINTMENT_REQUESTED
            mc.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(appt)
    return format_appointment(appt)


@router.get("", response_model=List[AppointmentRequestResponse])
def list_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.INVESTOR:
        appts = db.query(AppointmentRequest).filter(AppointmentRequest.investor_id == current_user.id).order_by(AppointmentRequest.created_at.desc()).all()
    elif current_user.role == UserRole.FOUNDER:
        appts = db.query(AppointmentRequest).filter(AppointmentRequest.founder_id == current_user.id).order_by(AppointmentRequest.created_at.desc()).all()
    else:
        appts = db.query(AppointmentRequest).order_by(AppointmentRequest.created_at.desc()).all()

    return [format_appointment(a) for a in appts]


@router.patch("/{id}/status", response_model=AppointmentRequestResponse)
def update_appointment_status(
    id: str,
    status: AppointmentStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = db.query(AppointmentRequest).filter(AppointmentRequest.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment request not found.")

    appt.status = status
    appt.updated_at = datetime.now(timezone.utc)

    if appt.match_case_id:
        mc = db.query(MatchCase).filter(MatchCase.id == appt.match_case_id).first()
        if mc and status == AppointmentStatus.CONFIRMED_SIMULATED:
            mc.review_stage = ReviewStage.APPOINTMENT_SCHEDULED
            mc.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(appt)
    return format_appointment(appt)
