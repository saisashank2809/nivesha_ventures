from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.database import get_db
from app.models.models import OnboardingQuestion, FounderProfile, Venture, User, UserRole
from app.schemas.schemas import (
    OnboardingQuestionResponse,
    OnboardingAnswerSubmission,
    OnboardingAnalyzeRequest,
    OnboardingAnalyzeResponse,
    FounderProfileResponse,
    FounderProfileUpdateRequest,
)
from app.services.ai_service import AIAssistantService
from app.api.auth import get_current_user

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("/questions", response_model=List[OnboardingQuestionResponse])
def get_onboarding_questions(
    v1_only: bool = Query(default=False),
    stage: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(OnboardingQuestion)
    if v1_only:
        query = query.filter(OnboardingQuestion.is_v1_essential == True)
    if stage:
        query = query.filter(OnboardingQuestion.stage == stage)
    questions = query.order_by(OnboardingQuestion.order.asc()).all()
    return [OnboardingQuestionResponse.model_validate(q) for q in questions]


def _serialize_founder_profile(user: User, profile: FounderProfile) -> FounderProfileResponse:
    return FounderProfileResponse(
        id=profile.id,
        founder_id=profile.founder_id,
        full_name=user.full_name,
        email=user.email,
        title=user.title,
        firm_or_company=user.firm_or_company,
        bio=user.bio,
        avatar_url=user.avatar_url,
        role_archetype=profile.role_archetype,
        experience_years=profile.experience_years,
        core_expertise=profile.core_expertise or [],
        continuity_backup_plan=profile.continuity_backup_plan,
        past_resilience_verified=profile.past_resilience_verified,
        three_year_goal=profile.three_year_goal,
        biggest_bottleneck=profile.biggest_bottleneck,
        investor_involvement_pref=profile.investor_involvement_pref,
        update_cadence=profile.update_cadence,
        ai_summary=profile.ai_summary,
        raw_discovery_answers=profile.raw_discovery_answers or {},
    )


@router.get("/founder-profile", response_model=FounderProfileResponse)
def get_my_founder_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.FOUNDER:
        raise HTTPException(status_code=403, detail="Only founders have a founder profile.")
    profile = db.query(FounderProfile).filter(FounderProfile.founder_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Founder profile not completed yet.")
    return _serialize_founder_profile(current_user, profile)


@router.patch("/founder-profile", response_model=FounderProfileResponse)
def update_my_founder_profile(
    payload: FounderProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.FOUNDER:
        raise HTTPException(status_code=403, detail="Only founders can update a founder profile.")

    # 1. Update editable User identity fields (email, role remain immutable)
    if payload.full_name is not None and payload.full_name.strip():
        current_user.full_name = payload.full_name.strip()
    if payload.title is not None:
        current_user.title = payload.title.strip() or None
    if payload.firm_or_company is not None:
        current_user.firm_or_company = payload.firm_or_company.strip() or None
    if payload.bio is not None:
        current_user.bio = payload.bio.strip() or None
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url.strip() or None

    # 2. Upsert FounderProfile fields (past_resilience_verified remains platform-controlled)
    profile = db.query(FounderProfile).filter(FounderProfile.founder_id == current_user.id).first()
    if not profile:
        profile = FounderProfile(founder_id=current_user.id)
        db.add(profile)

    raw = dict(profile.raw_discovery_answers or {})
    discovery_fields = [
        "role_archetype",
        "experience_years",
        "core_expertise",
        "continuity_backup_plan",
        "three_year_goal",
        "biggest_bottleneck",
        "investor_involvement_pref",
        "update_cadence",
    ]
    for field in discovery_fields:
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
    return _serialize_founder_profile(current_user, profile)


@router.post("/analyze", response_model=OnboardingAnalyzeResponse)
def analyze_onboarding_answers(
    payload: OnboardingAnalyzeRequest,
):
    result = AIAssistantService.analyze_founder_onboarding(payload.answers)
    return OnboardingAnalyzeResponse(**result)


@router.post("/submit")
def submit_onboarding_answers(
    payload: OnboardingAnswerSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.FOUNDER:
        raise HTTPException(status_code=403, detail="Only founders can submit onboarding responses.")

    answers = payload.answers
    analysis = AIAssistantService.analyze_founder_onboarding(answers)
    prefilled = analysis["prefilled_story_blocks"]

    # 1. Upsert Founder-level profile (reused across ventures)
    profile = db.query(FounderProfile).filter(FounderProfile.founder_id == current_user.id).first()
    expertise = answers.get("core_expertise") or []
    if isinstance(expertise, str):
        expertise = [expertise]

    if not profile:
        profile = FounderProfile(
            founder_id=current_user.id,
            role_archetype=answers.get("role_archetype"),
            experience_years=answers.get("experience_years"),
            core_expertise=expertise,
            continuity_backup_plan=answers.get("continuity_backup_plan"),
            past_resilience_verified=answers.get("experience_years") in ("3-5 yrs", "6-10 yrs", "10+ yrs"),
            three_year_goal=answers.get("three_year_goal"),
            biggest_bottleneck=answers.get("biggest_bottleneck"),
            investor_involvement_pref=answers.get("investor_involvement_pref"),
            update_cadence=answers.get("update_cadence"),
            ai_summary=payload.ai_summary or analysis["founder_summary"],
            raw_discovery_answers=answers,
        )
        db.add(profile)
    else:
        profile.role_archetype = answers.get("role_archetype", profile.role_archetype)
        profile.experience_years = answers.get("experience_years", profile.experience_years)
        profile.core_expertise = expertise or profile.core_expertise
        profile.continuity_backup_plan = answers.get("continuity_backup_plan", profile.continuity_backup_plan)
        profile.past_resilience_verified = answers.get("experience_years") in ("3-5 yrs", "6-10 yrs", "10+ yrs")
        profile.three_year_goal = answers.get("three_year_goal", profile.three_year_goal)
        profile.biggest_bottleneck = answers.get("biggest_bottleneck", profile.biggest_bottleneck)
        profile.investor_involvement_pref = answers.get("investor_involvement_pref", profile.investor_involvement_pref)
        profile.update_cadence = answers.get("update_cadence", profile.update_cadence)
        profile.ai_summary = payload.ai_summary or analysis["founder_summary"]
        profile.raw_discovery_answers = {**(profile.raw_discovery_answers or {}), **answers}

    # 2. Upsert Venture-level deal attributes
    venture = db.query(Venture).filter(Venture.founder_id == current_user.id).first()
    capital_target = float(prefilled.get("capital_target") or 1000000.0)
    proposed_arrangement = prefilled.get("proposed_arrangement") or "LOAN"
    arrangement_details = {
        "collateral_type": answers.get("collateral_type", "Unsecured"),
        "offered_return_rate": answers.get("offered_return_rate", 14),
        "preferred_label": answers.get("proposed_arrangement", "Secured Loan"),
        "update_cadence": answers.get("update_cadence", "Quarterly"),
    }
    continuity_plan = {
        "backup_operator": answers.get("continuity_backup_plan", "No backup yet"),
        "note": prefilled.get("continuity_note", ""),
    }
    growth_plan = {
        "three_year_goal": answers.get("three_year_goal", ""),
        "biggest_bottleneck": answers.get("biggest_bottleneck", ""),
        "use_of_funds": answers.get("capital_use", []),
    }

    if not venture:
        venture = Venture(
            founder_id=current_user.id,
            company_name=answers.get("company_name", current_user.firm_or_company or f"{current_user.full_name}'s Venture"),
            tag_line=answers.get("tag_line", prefilled.get("use_of_funds_summary", "High-conviction Indian Venture")),
            business_context=answers.get("business_context", analysis["founder_summary"]),
            sector=answers.get("sector", "General / Operating Business"),
            location=answers.get("location", "India"),
            stage=answers.get("stage", "Growth / Expansion"),
            capital_target=capital_target,
            ticket_min=max(1000000.0, capital_target * 0.25),
            ticket_max=capital_target,
            currency="INR",
            capital_structures=[answers.get("proposed_arrangement", "Secured Loan")],
            proposed_arrangement=proposed_arrangement,
            arrangement_details=arrangement_details,
            continuity_plan=continuity_plan,
            growth_plan=growth_plan,
            custom_answers=answers,
        )
        db.add(venture)
    else:
        venture.custom_answers = {**(venture.custom_answers or {}), **answers}
        venture.capital_target = capital_target
        venture.proposed_arrangement = proposed_arrangement
        venture.arrangement_details = {**(venture.arrangement_details or {}), **arrangement_details}
        venture.continuity_plan = {**(venture.continuity_plan or {}), **continuity_plan}
        venture.growth_plan = {**(venture.growth_plan or {}), **growth_plan}
        venture.version += 1

    db.commit()
    db.refresh(profile)
    db.refresh(venture)

    return {
        "status": "SUCCESS",
        "message": "Founder profile and venture discovery saved.",
        "founder_profile_id": profile.id,
        "venture_id": venture.id,
        "analysis": analysis,
    }
