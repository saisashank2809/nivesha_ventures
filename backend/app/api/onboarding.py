from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.models import OnboardingQuestion, Venture, User, UserRole
from app.schemas.schemas import OnboardingQuestionResponse, OnboardingAnswerSubmission
from app.api.auth import get_current_user

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("/questions", response_model=List[OnboardingQuestionResponse])
def get_onboarding_questions(db: Session = Depends(get_db)):
    questions = db.query(OnboardingQuestion).order_by(OnboardingQuestion.order.asc()).all()
    return [OnboardingQuestionResponse.model_validate(q) for q in questions]


@router.post("/submit")
def submit_onboarding_answers(
    payload: OnboardingAnswerSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.FOUNDER:
        raise HTTPException(status_code=403, detail="Only founders can submit onboarding responses.")

    venture = db.query(Venture).filter(Venture.founder_id == current_user.id).first()
    answers = payload.answers

    # If venture doesn't exist yet, initialize it
    if not venture:
        venture = Venture(
            founder_id=current_user.id,
            company_name=answers.get("company_name", f"{current_user.full_name}'s Venture"),
            tag_line=answers.get("tag_line", "Innovative Indian Venture"),
            business_context=answers.get("business_context", ""),
            sector=answers.get("sector", "Technology"),
            location=answers.get("location", "India"),
            stage=answers.get("stage", "Seed"),
            capital_target=float(answers.get("capital_target", 20000000.0)),
            ticket_min=float(answers.get("ticket_min", 2000000.0)),
            ticket_max=float(answers.get("ticket_max", 5000000.0)),
            currency="INR",
            capital_structures=answers.get("capital_structures", ["EQUITY", "SAFE"]),
            custom_answers=answers,
        )
        db.add(venture)
    else:
        # Update existing answers and sync key fields
        venture.custom_answers = {**(venture.custom_answers or {}), **answers}
        if "company_name" in answers:
            venture.company_name = answers["company_name"]
        if "tag_line" in answers:
            venture.tag_line = answers["tag_line"]
        if "business_context" in answers:
            venture.business_context = answers["business_context"]
        if "sector" in answers:
            venture.sector = answers["sector"]
        if "location" in answers:
            venture.location = answers["location"]
        if "stage" in answers:
            venture.stage = answers["stage"]
        if "capital_target" in answers:
            try:
                venture.capital_target = float(answers["capital_target"])
            except (ValueError, TypeError):
                pass
        if "ticket_min" in answers:
            try:
                venture.ticket_min = float(answers["ticket_min"])
            except (ValueError, TypeError):
                pass
        if "ticket_max" in answers:
            try:
                venture.ticket_max = float(answers["ticket_max"])
            except (ValueError, TypeError):
                pass
        venture.version += 1

    db.commit()
    db.refresh(venture)

    return {
        "status": "SUCCESS",
        "message": "Onboarding answers saved successfully. Your showcase has been updated.",
        "venture_id": venture.id,
    }
