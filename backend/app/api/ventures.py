from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.database import get_db
from app.models.models import Venture, User, UserRole, Connection, ConnectionStatus, VerificationStatus
from app.schemas.schemas import (
    VentureCardResponse,
    VentureDetailResponse,
    VentureCreateRequest,
    VentureUpdateRequest,
    AddImageRequest,
)
from app.api.auth import get_current_user

router = APIRouter(prefix="/ventures", tags=["ventures"])


def build_card_response(v: Venture, current_user: Optional[User], db: Session) -> VentureCardResponse:
    conn_status = None
    conn_id = None

    if current_user and current_user.role == UserRole.INVESTOR:
        conn = (
            db.query(Connection)
            .filter(Connection.venture_id == v.id, Connection.investor_id == current_user.id)
            .first()
        )
        if conn:
            conn_status = conn.status
            conn_id = conn.id

    founder_name = v.founder.full_name if v.founder else "Founder"
    founder_title = v.founder.title if v.founder else "Co-founder & CEO"

    return VentureCardResponse(
        id=v.id,
        founder_id=v.founder_id,
        founder_name=founder_name,
        founder_title=founder_title,
        company_name=v.company_name,
        tag_line=v.tag_line,
        business_context=v.business_context,
        sector=v.sector,
        location=v.location,
        stage=v.stage,
        capital_target=v.capital_target,
        ticket_min=v.ticket_min,
        ticket_max=v.ticket_max,
        currency=v.currency,
        capital_structures=v.capital_structures or [],
        verification_status=v.verification_status,
        traction_metrics=v.traction_metrics or [],
        created_at=v.created_at,
        connection_status=conn_status,
        connection_id=conn_id,
        hero_image_url=v.hero_image_url,
        gallery_urls=v.gallery_urls or [],
        proposed_arrangement=v.proposed_arrangement or "LOAN",
        arrangement_details=v.arrangement_details or {},
        operating_track_record=v.operating_track_record or {},
        growth_plan=v.growth_plan or {},
        continuity_plan=v.continuity_plan or {},
        due_diligence_findings=v.due_diligence_findings or {},
        missing_information=v.missing_information or [],
        venture_story=v.venture_story or {},
    )


@router.get("", response_model=List[VentureCardResponse])
def list_ventures(
    sector: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    min_ticket: Optional[float] = Query(None),
    max_ticket: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Venture)

    if sector and sector.lower() != "all":
        query = query.filter(Venture.sector.ilike(f"%{sector}%"))
    if stage and stage.lower() != "all":
        query = query.filter(Venture.stage == stage)
    if min_ticket is not None:
        query = query.filter(Venture.ticket_min >= min_ticket)
    if max_ticket is not None:
        query = query.filter(Venture.ticket_max <= max_ticket)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Venture.company_name.ilike(search_filter))
            | (Venture.tag_line.ilike(search_filter))
            | (Venture.business_context.ilike(search_filter))
            | (Venture.sector.ilike(search_filter))
            | (Venture.location.ilike(search_filter))
        )

    ventures = query.order_by(Venture.created_at.desc()).all()
    return [build_card_response(v, current_user, db) for v in ventures]


@router.get("/me/current", response_model=VentureDetailResponse)
def get_my_venture(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.FOUNDER:
        raise HTTPException(status_code=403, detail="Only founders have an active venture showcase.")

    v = db.query(Venture).filter(Venture.founder_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="No venture profile created yet.")

    card = build_card_response(v, current_user, db)
    return VentureDetailResponse(
        **card.model_dump(),
        pitch_deck_url=v.pitch_deck_url,
        video_url=v.video_url,
        diligence_brief=v.diligence_brief or {},
        custom_answers=v.custom_answers or {},
        version=v.version,
    )


@router.get("/{id}", response_model=VentureDetailResponse)
def get_venture_detail(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    v = db.query(Venture).filter(Venture.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Venture not found.")

    card = build_card_response(v, current_user, db)
    return VentureDetailResponse(
        **card.model_dump(),
        pitch_deck_url=v.pitch_deck_url,
        video_url=v.video_url,
        diligence_brief=v.diligence_brief or {},
        custom_answers=v.custom_answers or {},
        version=v.version,
    )


@router.post("", response_model=VentureDetailResponse, status_code=status.HTTP_201_CREATED)
def create_venture(
    payload: VentureCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.FOUNDER:
        raise HTTPException(status_code=403, detail="Only founders can create a venture showcase.")

    existing = db.query(Venture).filter(Venture.founder_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active venture profile.")

    v = Venture(
        founder_id=current_user.id,
        company_name=payload.company_name,
        tag_line=payload.tag_line,
        business_context=payload.business_context,
        sector=payload.sector,
        location=payload.location,
        stage=payload.stage,
        capital_target=payload.capital_target,
        ticket_min=payload.ticket_min,
        ticket_max=payload.ticket_max,
        currency=payload.currency,
        capital_structures=payload.capital_structures,
        pitch_deck_url=payload.pitch_deck_url,
        video_url=payload.video_url,
        hero_image_url=payload.hero_image_url,
        gallery_urls=payload.gallery_urls or [],
        custom_answers=payload.custom_answers,
        verification_status=VerificationStatus.UNDER_REVIEW,
    )
    db.add(v)
    db.commit()
    db.refresh(v)

    card = build_card_response(v, current_user, db)
    return VentureDetailResponse(
        **card.model_dump(),
        pitch_deck_url=v.pitch_deck_url,
        video_url=v.video_url,
        diligence_brief=v.diligence_brief or {},
        custom_answers=v.custom_answers or {},
        version=v.version,
    )


@router.patch("/{id}", response_model=VentureDetailResponse)
def update_venture(
    id: str,
    payload: VentureUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    v = db.query(Venture).filter(Venture.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Venture not found.")

    if current_user.role != UserRole.REVIEWER and v.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only modify your own venture showcase.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(v, field, value)

    v.version += 1
    db.commit()
    db.refresh(v)

    card = build_card_response(v, current_user, db)
    return VentureDetailResponse(
        **card.model_dump(),
        pitch_deck_url=v.pitch_deck_url,
        video_url=v.video_url,
        diligence_brief=v.diligence_brief or {},
        custom_answers=v.custom_answers or {},
        version=v.version,
    )


@router.post("/{id}/images", response_model=VentureDetailResponse)
def add_venture_image(
    id: str,
    payload: AddImageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    v = db.query(Venture).filter(Venture.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Venture not found.")

    urls = list(v.gallery_urls or [])
    if payload.image_url not in urls:
        urls.append(payload.image_url)
    v.gallery_urls = urls

    if payload.set_as_hero or not v.hero_image_url:
        v.hero_image_url = payload.image_url

    v.version += 1
    db.commit()
    db.refresh(v)

    card = build_card_response(v, current_user, db)
    return VentureDetailResponse(
        **card.model_dump(),
        pitch_deck_url=v.pitch_deck_url,
        video_url=v.video_url,
        diligence_brief=v.diligence_brief or {},
        custom_answers=v.custom_answers or {},
        version=v.version,
    )
