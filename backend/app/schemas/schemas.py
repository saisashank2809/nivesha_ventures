from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.models import (
    UserRole,
    ConnectionStatus,
    VerificationStatus,
    MatchOutcome,
    ReviewStage,
    AppointmentStatus,
)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: UserRole
    firm_or_company: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime


class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole
    firm_or_company: Optional[str] = None
    title: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class SwitchUserRequest(BaseModel):
    role: UserRole
    user_id: Optional[str] = None


# --- Venture Schemas ---

class TractionMetric(BaseModel):
    label: str
    value: str
    period: Optional[str] = None
    status: str = "VERIFIED"  # VERIFIED, PARTLY_VERIFIED, OPEN_QUESTION


class DiligenceFinding(BaseModel):
    title: str
    description: str
    status: str = "VERIFIED"  # VERIFIED, PARTLY_VERIFIED, OPEN_QUESTION


class DiligenceBrief(BaseModel):
    financials: Optional[DiligenceFinding] = None
    legal_compliance: Optional[DiligenceFinding] = None
    founders_team: Optional[DiligenceFinding] = None
    market_customers: Optional[DiligenceFinding] = None
    business_model: Optional[DiligenceFinding] = None
    questions_for_founder: List[str] = Field(default_factory=list)


class VentureCardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    founder_id: str
    founder_name: str
    founder_title: Optional[str] = None
    company_name: str
    tag_line: str
    business_context: str
    sector: str
    location: str
    stage: str
    capital_target: float
    ticket_min: Optional[float] = None
    ticket_max: Optional[float] = None
    currency: str = "INR"
    capital_structures: List[str] = Field(default_factory=list)
    verification_status: VerificationStatus
    traction_metrics: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    connection_status: Optional[ConnectionStatus] = None
    connection_id: Optional[str] = None
    hero_image_url: Optional[str] = None
    gallery_urls: List[str] = Field(default_factory=list)

    # Extended capital facilitation fields
    proposed_arrangement: str = "LOAN"
    arrangement_details: Dict[str, Any] = Field(default_factory=dict)
    operating_track_record: Dict[str, Any] = Field(default_factory=dict)
    growth_plan: Dict[str, Any] = Field(default_factory=dict)
    continuity_plan: Dict[str, Any] = Field(default_factory=dict)
    due_diligence_findings: Dict[str, Any] = Field(default_factory=dict)
    missing_information: List[str] = Field(default_factory=list)
    venture_story: Dict[str, Any] = Field(default_factory=dict)


class VentureDetailResponse(VentureCardResponse):
    pitch_deck_url: Optional[str] = None
    video_url: Optional[str] = None
    diligence_brief: Dict[str, Any] = Field(default_factory=dict)
    custom_answers: Dict[str, Any] = Field(default_factory=dict)
    version: int = 1


class VentureCreateRequest(BaseModel):
    company_name: str
    tag_line: str
    business_context: str
    sector: str
    location: str
    stage: str
    capital_target: float
    ticket_min: Optional[float] = None
    ticket_max: Optional[float] = None
    currency: str = "INR"
    capital_structures: List[str] = Field(default_factory=list)
    pitch_deck_url: Optional[str] = None
    video_url: Optional[str] = None
    hero_image_url: Optional[str] = None
    gallery_urls: Optional[List[str]] = None
    custom_answers: Dict[str, Any] = Field(default_factory=dict)
    proposed_arrangement: Optional[str] = "LOAN"
    arrangement_details: Optional[Dict[str, Any]] = None
    operating_track_record: Optional[Dict[str, Any]] = None
    growth_plan: Optional[Dict[str, Any]] = None
    continuity_plan: Optional[Dict[str, Any]] = None
    due_diligence_findings: Optional[Dict[str, Any]] = None
    missing_information: Optional[List[str]] = None
    venture_story: Optional[Dict[str, Any]] = None


class VentureUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    tag_line: Optional[str] = None
    business_context: Optional[str] = None
    sector: Optional[str] = None
    location: Optional[str] = None
    stage: Optional[str] = None
    capital_target: Optional[float] = None
    ticket_min: Optional[float] = None
    ticket_max: Optional[float] = None
    capital_structures: Optional[List[str]] = None
    pitch_deck_url: Optional[str] = None
    video_url: Optional[str] = None
    hero_image_url: Optional[str] = None
    gallery_urls: Optional[List[str]] = None
    traction_metrics: Optional[List[Dict[str, Any]]] = None
    custom_answers: Optional[Dict[str, Any]] = None
    proposed_arrangement: Optional[str] = None
    arrangement_details: Optional[Dict[str, Any]] = None
    operating_track_record: Optional[Dict[str, Any]] = None
    growth_plan: Optional[Dict[str, Any]] = None
    continuity_plan: Optional[Dict[str, Any]] = None
    due_diligence_findings: Optional[Dict[str, Any]] = None
    missing_information: Optional[List[str]] = None
    venture_story: Optional[Dict[str, Any]] = None


class AddImageRequest(BaseModel):
    image_url: str
    caption: Optional[str] = None
    set_as_hero: bool = False


# --- Investor Mandate Schemas ---

class InvestorMandateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investor_id: str
    firm_name: str
    target_sectors: List[str]
    target_stages: List[str]
    locations: List[str]
    ticket_min: Optional[float] = None
    ticket_max: Optional[float] = None
    currency: str = "INR"
    acceptable_structures: List[str] = Field(default_factory=list)
    thesis_summary: Optional[str] = None
    preferences: Dict[str, Any] = Field(default_factory=dict)

    # Extended fields
    accepted_arrangements: List[str] = Field(default_factory=list)
    time_horizon: str = "3_TO_5_YEARS"
    desired_involvement: str = "PASSIVE"
    willing_to_follow_up: str = "PERIODIC_CHECK_IN"
    mandatory_sectors: List[str] = Field(default_factory=list)
    mandatory_arrangements: List[str] = Field(default_factory=list)
    flexible_preferences: Dict[str, Any] = Field(default_factory=dict)
    version: int = 1


class InvestorMandateRequest(BaseModel):
    firm_name: str
    target_sectors: List[str] = Field(default_factory=list)
    target_stages: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    ticket_min: Optional[float] = None
    ticket_max: Optional[float] = None
    currency: str = "INR"
    acceptable_structures: List[str] = Field(default_factory=list)
    thesis_summary: Optional[str] = None
    preferences: Dict[str, Any] = Field(default_factory=dict)
    accepted_arrangements: Optional[List[str]] = None
    time_horizon: Optional[str] = None
    desired_involvement: Optional[str] = None
    willing_to_follow_up: Optional[str] = None
    mandatory_sectors: Optional[List[str]] = None
    mandatory_arrangements: Optional[List[str]] = None
    flexible_preferences: Optional[Dict[str, Any]] = None


# --- Match Case Schemas ---

class RuleEvaluationResult(BaseModel):
    rule: str
    dimension: str
    result: str  # PASS, FAIL, UNKNOWN, TRADE_OFF
    reason: str
    is_mandatory: bool = False


class MatchCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    venture_id: str
    mandate_id: str
    venture_name: Optional[str] = None
    investor_name: Optional[str] = None
    venture_version: int
    mandate_version: int
    outcome: MatchOutcome
    compatibility_reasons: List[str] = Field(default_factory=list)
    mandatory_mismatches: List[str] = Field(default_factory=list)
    trade_offs: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    rule_results: List[Dict[str, Any]] = Field(default_factory=list)
    review_stage: ReviewStage = ReviewStage.DRAFT
    created_at: datetime
    updated_at: datetime


class MatchRunRequest(BaseModel):
    venture_id: str
    mandate_id: Optional[str] = None  # If omitted, uses current user's mandate


# --- Appointment Request Schemas ---

class AppointmentRequestCreate(BaseModel):
    venture_id: str
    match_case_id: Optional[str] = None
    meeting_purpose: str
    sharing_scope: Optional[str] = "Declared revenue breakdown, unit economics, and expansion lease terms"
    preferred_times: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class AppointmentRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    match_case_id: Optional[str] = None
    venture_id: str
    venture_name: Optional[str] = None
    investor_id: str
    investor_name: Optional[str] = None
    investor_firm: Optional[str] = None
    founder_id: str
    founder_name: Optional[str] = None
    requested_by: UserRole
    meeting_purpose: str
    sharing_scope: str
    preferred_times: List[str] = Field(default_factory=list)
    status: AppointmentStatus
    notes: Optional[str] = None
    created_at: datetime


# --- Connection & Message Schemas ---

class ConnectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    venture_id: str
    company_name: str
    investor_id: str
    investor_name: str
    investor_firm: Optional[str] = None
    status: ConnectionStatus
    requested_by: UserRole
    investor_consent: bool
    founder_consent: bool
    request_note: Optional[str] = None
    created_at: datetime
    connected_at: Optional[datetime] = None


class ConnectionRequestPayload(BaseModel):
    venture_id: str
    note: Optional[str] = None


class ConnectionConsentPayload(BaseModel):
    consent: bool


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    connection_id: str
    sender_id: str
    sender_name: str
    sender_role: UserRole
    recipient_id: str
    content: str
    is_read: bool
    timestamp: datetime


class MessageSendPayload(BaseModel):
    content: str


# --- Onboarding Question Schemas ---

class OnboardingQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    section: str
    question_key: str
    label: str
    description: Optional[str] = None
    question_type: str
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None
    is_mandatory: bool
    order: int


class OnboardingAnswerSubmission(BaseModel):
    answers: Dict[str, Any]


# --- AI Chat Assistant Schemas ---

class AIChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class AIChatRequest(BaseModel):
    message: str
    context: Optional[str] = "INVESTOR"  # "INVESTOR" or "FOUNDER"
    venture_id: Optional[str] = None
    history: List[AIChatMessage] = Field(default_factory=list)


class AIChatResponse(BaseModel):
    reply: str
    recommended_venture_ids: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)


# --- Platform Config Schema ---

class PlatformConfigResponse(BaseModel):
    platform_name: str
    tagline: str
    min_opportunity_amount: float
    min_opportunity_display: str
    commercial_fee_status: str
    commercial_fee_note: str
    legal_status_note: str
    disclaimer: str
