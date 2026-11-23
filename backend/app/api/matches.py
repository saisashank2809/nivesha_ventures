from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.models.database import get_db
from app.models.models import MatchCase, Venture, InvestorMandate, User, UserRole, ReviewStage
from app.schemas.schemas import MatchCaseResponse, MatchRunRequest
from app.services.matching_service import evaluate_match
from app.api.auth import get_current_user

router = APIRouter(prefix="/matches", tags=["matches"])


def format_match_case(mc: MatchCase) -> MatchCaseResponse:
    v_name = mc.venture.company_name if mc.venture else "Venture"
    inv_name = mc.mandate.investor.full_name if mc.mandate and mc.mandate.investor else "Investor"

    return MatchCaseResponse(
        id=mc.id,
        venture_id=mc.venture_id,
        mandate_id=mc.mandate_id,
        venture_name=v_name,
        investor_name=inv_name,
        venture_version=mc.venture_version,
        mandate_version=mc.mandate_version,
        outcome=mc.outcome,
        compatibility_reasons=mc.compatibility_reasons or [],
        mandatory_mismatches=mc.mandatory_mismatches or [],
        trade_offs=mc.trade_offs or [],
        missing_information=mc.missing_information or [],
        rule_results=mc.rule_results or [],
        review_stage=mc.review_stage,
        created_at=mc.created_at,
        updated_at=mc.updated_at,
    )


@router.post("/run", response_model=MatchCaseResponse)
def run_match_assessment(
    payload: MatchRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    venture = db.query(Venture).filter(Venture.id == payload.venture_id).first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found.")

    if payload.mandate_id:
        mandate = db.query(InvestorMandate).filter(InvestorMandate.id == payload.mandate_id).first()
    elif current_user.role == UserRole.INVESTOR:
        mandate = db.query(InvestorMandate).filter(InvestorMandate.investor_id == current_user.id).first()
    else:
        mandate = db.query(InvestorMandate).first()

    if not mandate:
        raise HTTPException(status_code=404, detail="Investor mandate not found.")

    # Evaluate using shared deterministic matching engine
    eval_result = evaluate_match(venture, mandate)

    # Find existing or create new MatchCase
    mc = (
        db.query(MatchCase)
        .filter(MatchCase.venture_id == venture.id, MatchCase.mandate_id == mandate.id)
        .first()
    )

    if not mc:
        mc = MatchCase(
            venture_id=venture.id,
            mandate_id=mandate.id,
            venture_version=venture.version,
            mandate_version=mandate.version,
            outcome=eval_result["outcome"],
            compatibility_reasons=eval_result["compatibility_reasons"],
            mandatory_mismatches=eval_result["mandatory_mismatches"],
            trade_offs=eval_result["trade_offs"],
            missing_information=eval_result["missing_information"],
            rule_results=eval_result["rule_results"],
            review_stage=ReviewStage.DRAFT,
        )
        db.add(mc)
    else:
        mc.venture_version = venture.version
        mc.mandate_version = mandate.version
        mc.outcome = eval_result["outcome"]
        mc.compatibility_reasons = eval_result["compatibility_reasons"]
        mc.mandatory_mismatches = eval_result["mandatory_mismatches"]
        mc.trade_offs = eval_result["trade_offs"]
        mc.missing_information = eval_result["missing_information"]
        mc.rule_results = eval_result["rule_results"]
        mc.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(mc)
    return format_match_case(mc)


@router.get("", response_model=List[MatchCaseResponse])
def list_match_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.INVESTOR:
        cases = (
            db.query(MatchCase)
            .join(InvestorMandate, MatchCase.mandate_id == InvestorMandate.id)
            .filter(InvestorMandate.investor_id == current_user.id)
            .order_by(MatchCase.created_at.desc())
            .all()
        )
    elif current_user.role == UserRole.FOUNDER:
        cases = (
            db.query(MatchCase)
            .join(Venture, MatchCase.venture_id == Venture.id)
            .filter(Venture.founder_id == current_user.id)
            .order_by(MatchCase.created_at.desc())
            .all()
        )
    else:
        cases = db.query(MatchCase).order_by(MatchCase.created_at.desc()).all()

    return [format_match_case(c) for c in cases]


@router.get("/{id}", response_model=MatchCaseResponse)
def get_match_case(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mc = db.query(MatchCase).filter(MatchCase.id == id).first()
    if not mc:
        raise HTTPException(status_code=404, detail="Match case not found.")
    return format_match_case(mc)


@router.patch("/{id}/review", response_model=MatchCaseResponse)
def update_review_stage(
    id: str,
    stage: ReviewStage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mc = db.query(MatchCase).filter(MatchCase.id == id).first()
    if not mc:
        raise HTTPException(status_code=404, detail="Match case not found.")

    mc.review_stage = stage
    mc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(mc)
    return format_match_case(mc)
