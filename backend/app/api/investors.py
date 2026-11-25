from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.models.database import get_db
from app.models.models import InvestorMandate, InvestorProfile, User, UserRole
from app.schemas.schemas import (
    InvestorMandateResponse,
    InvestorMandateRequest,
    InvestorProfileResponse,
    InvestorProfileUpdateRequest,
    InvestorAnalyzeRequest,
    InvestorAnalyzeResponse,
    InvestorOnboardingSubmitRequest,
)
from app.services.ai_service import AIAssistantService
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


def _serialize_investor_profile(user: User, profile: InvestorProfile) -> InvestorProfileResponse:
    return InvestorProfileResponse(
        id=profile.id,
        investor_id=profile.investor_id,
        full_name=user.full_name,
        email=user.email,
        title=user.title,
        firm_or_company=user.firm_or_company,
        bio=user.bio,
        investor_type=profile.investor_type,
        investing_capacity_type=profile.investing_capacity_type,
        professional_background=profile.professional_background or [],
        past_private_investments=profile.past_private_investments,
        experience_level=profile.experience_level,
        prior_structures_used=profile.prior_structures_used or [],
        evaluation_priorities=profile.evaluation_priorities or [],
        primary_objective=profile.primary_objective,
        risk_tolerance_level=profile.risk_tolerance_level,
        risk_clarifications=profile.risk_clarifications or {},
        expected_evidence=profile.expected_evidence or [],
        onboarding_completed=profile.onboarding_completed,
        ai_summary=profile.ai_summary,
        raw_discovery_answers=profile.raw_discovery_answers or {},
    )


@router.post("/onboarding/analyze", response_model=InvestorAnalyzeResponse)
def analyze_investor_onboarding(payload: InvestorAnalyzeRequest):
    result = AIAssistantService.analyze_investor_onboarding(
        payload.answers,
        payload.natural_language_note,
    )
    return InvestorAnalyzeResponse(**result)


@router.get("/investor-profile", response_model=InvestorProfileResponse)
def get_my_investor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.INVESTOR:
        raise HTTPException(status_code=403, detail="Only investors have an investor profile.")
    profile = db.query(InvestorProfile).filter(InvestorProfile.investor_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Investor profile not completed yet.")
    return _serialize_investor_profile(current_user, profile)


@router.patch("/investor-profile", response_model=InvestorProfileResponse)
def update_my_investor_profile(
    payload: InvestorProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.INVESTOR:
        raise HTTPException(status_code=403, detail="Only investors can update an investor profile.")

    if payload.full_name is not None and payload.full_name.strip():
        current_user.full_name = payload.full_name.strip()
    if payload.title is not None:
        current_user.title = payload.title.strip() or None
    if payload.firm_or_company is not None:
        current_user.firm_or_company = payload.firm_or_company.strip() or None
    if payload.bio is not None:
        current_user.bio = payload.bio.strip() or None

    profile = db.query(InvestorProfile).filter(InvestorProfile.investor_id == current_user.id).first()
    if not profile:
        profile = InvestorProfile(investor_id=current_user.id)
        db.add(profile)

    raw = dict(profile.raw_discovery_answers or {})
    for field in [
        "investor_type",
        "investing_capacity_type",
        "professional_background",
        "past_private_investments",
        "experience_level",
        "prior_structures_used",
        "evaluation_priorities",
        "primary_objective",
        "risk_tolerance_level",
        "expected_evidence",
    ]:
        val = getattr(payload, field)
        if val is not None:
            setattr(profile, field, val)
            raw[field] = val

    if payload.ai_summary is not None:
        profile.ai_summary = payload.ai_summary.strip() or None

    profile.raw_discovery_answers = raw
    db.commit()
    db.refresh(current_user)
    db.refresh(profile)
    return _serialize_investor_profile(current_user, profile)


@router.post("/onboarding/submit")
def submit_investor_onboarding(
    payload: InvestorOnboardingSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.INVESTOR:
        raise HTTPException(status_code=403, detail="Only investors can submit investor onboarding.")

    answers = payload.answers
    analysis = AIAssistantService.analyze_investor_onboarding(answers)
    proposed = analysis["proposed_mandate"]
    confirmed = {**proposed, **(payload.confirmed_mandate or {})}

    # 1. Upsert InvestorProfile (background & risk separate from matching mandate)
    profile = db.query(InvestorProfile).filter(InvestorProfile.investor_id == current_user.id).first()
    if not profile:
        profile = InvestorProfile(investor_id=current_user.id)
        db.add(profile)

    def _as_list(val):
        if isinstance(val, list):
            return val
        if isinstance(val, str) and val.strip():
            return [val.strip()]
        return []

    profile.investor_type = answers.get("investor_type")
    profile.investing_capacity_type = answers.get("investing_capacity_type")
    profile.professional_background = _as_list(answers.get("professional_background"))
    past_val = answers.get("past_private_investments")
    if isinstance(past_val, bool):
        profile.past_private_investments = past_val
    elif isinstance(past_val, str):
        profile.past_private_investments = past_val.lower() == "yes"
    profile.experience_level = answers.get("experience_level")
    profile.prior_structures_used = _as_list(answers.get("prior_structures_used"))
    profile.evaluation_priorities = _as_list(answers.get("evaluation_priorities"))
    profile.primary_objective = answers.get("primary_objective")
    profile.risk_tolerance_level = answers.get("risk_tolerance_level")
    profile.risk_clarifications = answers.get("risk_clarifications") or {}
    profile.expected_evidence = _as_list(answers.get("expected_evidence"))
    profile.onboarding_completed = True
    profile.ai_summary = payload.ai_summary or analysis["investor_summary"]
    profile.raw_discovery_answers = answers

    # 2. Upsert confirmed InvestorMandate (authoritative for 7-point Matching Engine)
    mandate = db.query(InvestorMandate).filter(InvestorMandate.investor_id == current_user.id).first()
    if not mandate:
        mandate = InvestorMandate(
            investor_id=current_user.id,
            firm_name=current_user.firm_or_company or f"{current_user.full_name} Capital",
        )
        db.add(mandate)
    else:
        mandate.version += 1

    mandate.target_sectors = _as_list(confirmed.get("target_sectors"))
    mandate.mandatory_sectors = _as_list(confirmed.get("mandatory_sectors"))
    mandate.target_stages = _as_list(confirmed.get("target_stages"))
    mandate.locations = _as_list(confirmed.get("locations")) or ["India"]
    mandate.ticket_min = float(confirmed.get("ticket_min") or 1000000.0)
    mandate.ticket_max = float(confirmed.get("ticket_max") or max(mandate.ticket_min, 5000000.0))
    arrs = _as_list(confirmed.get("accepted_arrangements"))
    mandate.accepted_arrangements = arrs
    mandate.acceptable_structures = arrs
    mandate.mandatory_arrangements = _as_list(confirmed.get("mandatory_arrangements"))
    mandate.time_horizon = str(confirmed.get("time_horizon") or "3_TO_5_YEARS")
    mandate.desired_involvement = str(confirmed.get("desired_involvement") or "MONTHLY_ADVISORY")
    mandate.willing_to_follow_up = str(confirmed.get("willing_to_follow_up") or "MONTHLY_OPERATIONAL_REVIEWS")
    mandate.thesis_summary = confirmed.get("thesis_summary") or profile.ai_summary
    mandate.flexible_preferences = {
        **(mandate.flexible_preferences or {}),
        "expected_evidence": profile.expected_evidence,
        "evaluation_priorities": profile.evaluation_priorities,
    }

    db.commit()
    db.refresh(profile)
    db.refresh(mandate)

    return {
        "status": "SUCCESS",
        "investor_profile": _serialize_investor_profile(current_user, profile),
        "mandate": InvestorMandateResponse.model_validate(mandate),
    }
