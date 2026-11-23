import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
import enum

from .database import Base


class UserRole(str, enum.Enum):
    INVESTOR = "INVESTOR"
    FOUNDER = "FOUNDER"
    REVIEWER = "REVIEWER"


class ConnectionStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    CONNECTED = "CONNECTED"
    DECLINED = "DECLINED"


class VerificationStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    UNDER_REVIEW = "UNDER_REVIEW"
    DRAFT = "DRAFT"


class MatchOutcome(str, enum.Enum):
    POTENTIALLY_SUITABLE = "POTENTIALLY_SUITABLE"
    UNSUITABLE = "UNSUITABLE"
    NEEDS_MORE_INFORMATION = "NEEDS_MORE_INFORMATION"


class ReviewStage(str, enum.Enum):
    DRAFT = "DRAFT"
    AWAITING_REVIEW = "AWAITING_REVIEW"
    APPROVED_FOR_FACILITATION = "APPROVED_FOR_FACILITATION"
    APPOINTMENT_REQUESTED = "APPOINTMENT_REQUESTED"
    APPOINTMENT_SCHEDULED = "APPOINTMENT_SCHEDULED"
    CLOSED = "CLOSED"


class AppointmentStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    CONFIRMED_SIMULATED = "CONFIRMED_SIMULATED"
    DECLINED = "DECLINED"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(128), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.FOUNDER)
    firm_or_company = Column(String(128), nullable=True)
    title = Column(String(128), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    ventures = relationship("Venture", back_populates="founder", cascade="all, delete-orphan")
    mandate = relationship("InvestorMandate", back_populates="investor", uselist=False, cascade="all, delete-orphan")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.recipient_id", back_populates="recipient")


class Venture(Base):
    __tablename__ = "ventures"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    founder_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    company_name = Column(String(128), nullable=False)
    tag_line = Column(String(256), nullable=False, default="")
    business_context = Column(Text, nullable=False, default="")
    sector = Column(String(64), nullable=False)
    location = Column(String(64), nullable=False)
    stage = Column(String(64), nullable=False)

    # Capital targets in INR (default ₹10 Lakh working assumption)
    capital_target = Column(Float, nullable=False, default=1000000.0)
    ticket_min = Column(Float, nullable=True)
    ticket_max = Column(Float, nullable=True)
    currency = Column(String(8), nullable=False, default="INR")
    capital_structures = Column(JSON, nullable=False, default=list)

    pitch_deck_url = Column(String(256), nullable=True)
    video_url = Column(String(256), nullable=True)
    verification_status = Column(SQLEnum(VerificationStatus), nullable=False, default=VerificationStatus.UNDER_REVIEW)

    # Key verified traction stats (e.g., ARR, GMV, Growth)
    traction_metrics = Column(JSON, nullable=False, default=list)

    # Diligence Brief for investors (Financials, Legal, Team, Market, Model, Questions)
    diligence_brief = Column(JSON, nullable=False, default=dict)

    # Custom answers from extensible onboarding questions
    custom_answers = Column(JSON, nullable=False, default=dict)

    # Extended capital facilitation fields
    proposed_arrangement = Column(String(64), nullable=False, default="LOAN")
    arrangement_details = Column(JSON, nullable=False, default=dict)
    operating_track_record = Column(JSON, nullable=False, default=dict)
    growth_plan = Column(JSON, nullable=False, default=dict)
    continuity_plan = Column(JSON, nullable=False, default=dict)
    due_diligence_findings = Column(JSON, nullable=False, default=dict)
    missing_information = Column(JSON, nullable=False, default=list)
    venture_story = Column(JSON, nullable=False, default=dict)

    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    founder = relationship("User", back_populates="ventures")
    connections = relationship("Connection", back_populates="venture", cascade="all, delete-orphan")
    match_cases = relationship("MatchCase", back_populates="venture", cascade="all, delete-orphan")
    appointments = relationship("AppointmentRequest", back_populates="venture", cascade="all, delete-orphan")


class InvestorMandate(Base):
    __tablename__ = "investor_mandates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investor_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    firm_name = Column(String(128), nullable=False)
    target_sectors = Column(JSON, nullable=False, default=list)
    target_stages = Column(JSON, nullable=False, default=list)
    locations = Column(JSON, nullable=False, default=list)

    ticket_min = Column(Float, nullable=True)
    ticket_max = Column(Float, nullable=True)
    currency = Column(String(8), nullable=False, default="INR")
    acceptable_structures = Column(JSON, nullable=False, default=list)

    thesis_summary = Column(Text, nullable=True)
    preferences = Column(JSON, nullable=False, default=dict)

    # Extended mandate fields
    accepted_arrangements = Column(JSON, nullable=False, default=list)
    time_horizon = Column(String(64), nullable=False, default="3_TO_5_YEARS")
    desired_involvement = Column(String(64), nullable=False, default="PASSIVE")
    willing_to_follow_up = Column(String(64), nullable=False, default="PERIODIC_CHECK_IN")
    mandatory_sectors = Column(JSON, nullable=False, default=list)
    mandatory_arrangements = Column(JSON, nullable=False, default=list)
    flexible_preferences = Column(JSON, nullable=False, default=dict)

    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    investor = relationship("User", back_populates="mandate")
    match_cases = relationship("MatchCase", back_populates="mandate", cascade="all, delete-orphan")


class MatchCase(Base):
    __tablename__ = "match_cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    venture_id = Column(String(36), ForeignKey("ventures.id"), nullable=False, index=True)
    mandate_id = Column(String(36), ForeignKey("investor_mandates.id"), nullable=False, index=True)
    venture_version = Column(Integer, nullable=False, default=1)
    mandate_version = Column(Integer, nullable=False, default=1)

    outcome = Column(SQLEnum(MatchOutcome), nullable=False, default=MatchOutcome.NEEDS_MORE_INFORMATION)
    compatibility_reasons = Column(JSON, nullable=False, default=list)
    mandatory_mismatches = Column(JSON, nullable=False, default=list)
    trade_offs = Column(JSON, nullable=False, default=list)
    missing_information = Column(JSON, nullable=False, default=list)
    rule_results = Column(JSON, nullable=False, default=list)
    review_stage = Column(SQLEnum(ReviewStage), nullable=False, default=ReviewStage.DRAFT)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    venture = relationship("Venture", back_populates="match_cases")
    mandate = relationship("InvestorMandate", back_populates="match_cases")
    appointments = relationship("AppointmentRequest", back_populates="match_case", cascade="all, delete-orphan")


class AppointmentRequest(Base):
    __tablename__ = "appointment_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    match_case_id = Column(String(36), ForeignKey("match_cases.id"), nullable=True, index=True)
    venture_id = Column(String(36), ForeignKey("ventures.id"), nullable=False, index=True)
    investor_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    founder_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    requested_by = Column(SQLEnum(UserRole), nullable=False, default=UserRole.INVESTOR)
    meeting_purpose = Column(String(256), nullable=False)
    sharing_scope = Column(String(256), nullable=False)
    preferred_times = Column(JSON, nullable=False, default=list)
    status = Column(SQLEnum(AppointmentStatus), nullable=False, default=AppointmentStatus.REQUESTED)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    match_case = relationship("MatchCase", back_populates="appointments")
    venture = relationship("Venture", back_populates="appointments")
    investor = relationship("User", foreign_keys=[investor_id])
    founder = relationship("User", foreign_keys=[founder_id])


class Connection(Base):
    __tablename__ = "connections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    venture_id = Column(String(36), ForeignKey("ventures.id"), nullable=False, index=True)
    investor_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    status = Column(SQLEnum(ConnectionStatus), nullable=False, default=ConnectionStatus.REQUESTED)
    requested_by = Column(SQLEnum(UserRole), nullable=False, default=UserRole.INVESTOR)

    investor_consent = Column(Boolean, nullable=False, default=False)
    founder_consent = Column(Boolean, nullable=False, default=False)
    reviewer_approved = Column(Boolean, nullable=False, default=True)

    request_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    connected_at = Column(DateTime, nullable=True)

    venture = relationship("Venture", back_populates="connections")
    investor = relationship("User", foreign_keys=[investor_id])
    messages = relationship("Message", back_populates="connection", cascade="all, delete-orphan", order_by="Message.timestamp")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    connection_id = Column(String(36), ForeignKey("connections.id"), nullable=False, index=True)
    sender_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    content = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    connection = relationship("Connection", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_messages")


class OnboardingQuestion(Base):
    __tablename__ = "onboarding_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    section = Column(String(64), nullable=False)  # e.g., "BASICS", "ARRANGEMENT", "TRACK_RECORD", "EXPANSION", "RISKS"
    question_key = Column(String(64), unique=True, nullable=False)
    label = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    question_type = Column(String(32), nullable=False)  # TEXT, TEXTAREA, NUMBER, SELECT, MULTISELECT, CURRENCY
    options = Column(JSON, nullable=True, default=list)
    placeholder = Column(String(128), nullable=True)
    is_mandatory = Column(Boolean, nullable=False, default=True)
    order = Column(Integer, nullable=False, default=1)
