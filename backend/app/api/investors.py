from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.models.database import get_db
from app.models.models import InvestorMandate, User, UserRole
from app.schemas.schemas import InvestorMandateResponse, InvestorMandateRequest
from app.api.auth import get_current_user

router = APIRouter(prefix="/mandates", tags=["mandates"])


@router.get("", response_model=List[InvestorMandateResponse])
def list_all_mandates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allows reviewers or investors to list active investor mandates."""
    mandates = db.query(InvestorMandate).order_by(InvestorMandate.created_at.desc()).all()
    return [InvestorMandateResponse.model_validate(m) for m in mandates]


@router.get("/me", response_model=InvestorMandateResponse)
def get_my_mandate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.INVESTOR:
        raise HTTPException(status_code=403, detail="Only investors have an investment mandate.")

    mandate = db.query(InvestorMandate).filter(InvestorMandate.investor_id == current_user.id).first()
    if not mandate:
        # Create a default mandate for the investor
        mandate = InvestorMandate(
            investor_id=current_user.id,
            firm_name=current_user.firm_or_company or f"{current_user.full_name} Capital",
            target_sectors=["Food & Beverage", "Retail & Hospitality", "FinTech", "Enterprise SaaS"],
            target_stages=["Expansion", "Post-Revenue", "Seed"],
            locations=["Bengaluru", "Karnataka", "India"],
            ticket_min=1000000.0,
            ticket_max=2500000.0,
            currency="INR",
            acceptable_structures=["LOAN", "EQUITY", "REVENUE_SHARE"],
            thesis_summary="Investing in capital-efficient Indian expansion ventures with verified unit economics and collateral.",
            accepted_arrangements=["LOAN", "REVENUE_SHARE", "EQUITY"],
            time_horizon="1_TO_3_YEARS",
            desired_involvement="MONTHLY_ADVISORY",
            willing_to_follow_up="MONTHLY_OPERATIONAL_REVIEWS",
            mandatory_sectors=[],
            mandatory_arrangements=[],
            flexible_preferences={"co_lead_preferred": True},
        )
        db.add(mandate)
        db.commit()
        db.refresh(mandate)

    return InvestorMandateResponse.model_validate(mandate)


@router.patch("/me", response_model=InvestorMandateResponse)
def update_my_mandate(
    payload: InvestorMandateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.INVESTOR:
        raise HTTPException(status_code=403, detail="Only investors can modify mandate parameters.")

    mandate = db.query(InvestorMandate).filter(InvestorMandate.investor_id == current_user.id).first()
    update_data = payload.model_dump(exclude_unset=True)

    if not mandate:
        mandate = InvestorMandate(investor_id=current_user.id, **update_data)
        db.add(mandate)
    else:
        for field, value in update_data.items():
            setattr(mandate, field, value)
        mandate.version += 1
        mandate.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(mandate)
    return InvestorMandateResponse.model_validate(mandate)
