from fastapi import APIRouter
from app.core import config
from app.schemas.schemas import PlatformConfigResponse

router = APIRouter(prefix="/config", tags=["config"])


@router.get("", response_model=PlatformConfigResponse)
def get_platform_config():
    return PlatformConfigResponse(
        platform_name=config.PLATFORM_NAME,
        tagline=config.PLATFORM_TAGLINE,
        min_opportunity_amount=config.MIN_OPPORTUNITY_AMOUNT,
        min_opportunity_display=config.MIN_OPPORTUNITY_DISPLAY,
        commercial_fee_status=config.COMMERCIAL_FEE_STATUS,
        commercial_fee_note=config.COMMERCIAL_FEE_NOTE,
        legal_status_note=config.LEGAL_STATUS_NOTE,
        disclaimer=config.DISCLAIMER_TEXT,
    )
