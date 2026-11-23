from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import User
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.api.auth import get_current_user
from app.services.ai_service import AIAssistantService

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_model=AIChatResponse)
def chat_with_assistant(
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = AIAssistantService.generate_response(
        db=db,
        user=current_user,
        message=payload.message,
        context_type=payload.context or current_user.role.value,
        venture_id=payload.venture_id,
        history=[h.model_dump() for h in payload.history],
    )
    return AIChatResponse(
        reply=result["reply"],
        recommended_venture_ids=result.get("recommended_venture_ids", []),
        suggested_actions=result.get("suggested_actions", []),
    )
