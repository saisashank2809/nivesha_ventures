export type UserRole = 'INVESTOR' | 'FOUNDER' | 'REVIEWER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  firm_or_company?: string | null;
  title?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

export type VerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNDER_REVIEW'
  | 'DRAFT';

export type ConnectionStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'CONNECTED'
  | 'DECLINED';

export type MatchOutcome =
  | 'POTENTIALLY_SUITABLE'
  | 'UNSUITABLE'
  | 'NEEDS_MORE_INFORMATION';

export type ReviewStage =
  | 'DRAFT'
  | 'AWAITING_REVIEW'
  | 'APPROVED_FOR_FACILITATION'
  | 'APPOINTMENT_REQUESTED'
  | 'APPOINTMENT_SCHEDULED'
  | 'CLOSED';

export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED_SIMULATED'
  | 'DECLINED';

export interface TractionMetric {
  label: string;
  value: string;
  period?: string | null;
  status: 'VERIFIED' | 'PARTLY_VERIFIED' | 'OPEN_QUESTION' | 'CHECKED_AGAINST_SOURCE' | 'WORKING_ASSUMPTION' | string;
}

export interface DiligenceFinding {
  title: string;
  description: string;
  status: 'VERIFIED' | 'PARTLY_VERIFIED' | 'OPEN_QUESTION' | 'CHECKED_AGAINST_SOURCE' | 'REVIEW_PENDING' | 'EVIDENCE_SUPPLIED' | 'DISCREPANCY_IDENTIFIED' | string;
  source?: string;
}

export interface DiligenceBrief {
  financials?: DiligenceFinding;
  legal_compliance?: DiligenceFinding;
  founders_team?: DiligenceFinding;
  market_customers?: DiligenceFinding;
  business_model?: DiligenceFinding;
  questions_for_founder?: string[];
}

export interface TenSections {
  venture_overview: string;
  current_position: string;
  opportunity: string;
  capital_requirement: string;
  use_of_capital: string;
  investment_proposal: string;
  execution_capability: string;
  risks_and_dependencies: string;
  investor_participation: string;
  evidence_and_next_steps: string;
}

export interface VentureCard {
  id: string;
  founder_id: string;
  founder_name: string;
  founder_title?: string | null;
  company_name: string;
  tag_line: string;
  business_context: string;
  sector: string;
  location: string;
  stage: string;
  capital_target: number;
  ticket_min?: number | null;
  ticket_max?: number | null;
  currency: string;
  capital_structures: string[];
  verification_status: VerificationStatus;
  traction_metrics: TractionMetric[];
  created_at: string;
  connection_status?: ConnectionStatus | null;
  connection_id?: string | null;
  hero_image_url?: string | null;
  gallery_urls?: string[];

  // Extended capital facilitation fields
  proposed_arrangement?: string;
  arrangement_details?: Record<string, any>;
  operating_track_record?: Record<string, any>;
  growth_plan?: Record<string, any>;
  continuity_plan?: Record<string, any>;
  due_diligence_findings?: Record<string, any>;
  missing_information?: string[];
  venture_story?: Partial<TenSections> | Record<string, any>;
}

export interface VentureDetail extends VentureCard {
  pitch_deck_url?: string | null;
  video_url?: string | null;
  diligence_brief: DiligenceBrief;
  custom_answers: Record<string, any>;
  version: number;
}

export interface InvestorMandate {
  id: string;
  investor_id: string;
  firm_name: string;
  target_sectors: string[];
  target_stages: string[];
  locations: string[];
  ticket_min?: number | null;
  ticket_max?: number | null;
  currency: string;
  acceptable_structures: string[];
  thesis_summary?: string | null;
  preferences: Record<string, any>;

  // Extended fields
  accepted_arrangements?: string[];
  time_horizon?: string;
  desired_involvement?: string;
  willing_to_follow_up?: string;
  mandatory_sectors?: string[];
  mandatory_arrangements?: string[];
  flexible_preferences?: Record<string, any>;
  version?: number;
}

export interface MatchRuleResult {
  rule: string;
  dimension: string;
  result: 'PASS' | 'FAIL' | 'UNKNOWN' | 'TRADE_OFF';
  reason: string;
  is_mandatory?: boolean;
}

export interface MatchCase {
  id: string;
  venture_id: string;
  mandate_id: string;
  venture_name?: string;
  investor_name?: string;
  venture_version: number;
  mandate_version: number;
  outcome: MatchOutcome;
  compatibility_reasons: string[];
  mandatory_mismatches: string[];
  trade_offs: string[];
  missing_information: string[];
  rule_results: MatchRuleResult[];
  review_stage: ReviewStage;
  created_at: string;
  updated_at: string;
}

export interface AppointmentRequest {
  id: string;
  match_case_id?: string | null;
  venture_id: string;
  venture_name?: string;
  investor_id: string;
  investor_name?: string;
  investor_firm?: string | null;
  founder_id: string;
  founder_name?: string;
  requested_by: UserRole;
  meeting_purpose: string;
  sharing_scope: string;
  preferred_times: string[];
  status: AppointmentStatus;
  notes?: string | null;
  created_at: string;
}

export interface Connection {
  id: string;
  venture_id: string;
  company_name: string;
  investor_id: string;
  investor_name: string;
  investor_firm?: string | null;
  status: ConnectionStatus;
  requested_by: UserRole;
  investor_consent: boolean;
  founder_consent: boolean;
  request_note?: string | null;
  created_at: string;
  connected_at?: string | null;
}

export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  recipient_id: string;
  content: string;
  is_read: boolean;
  timestamp: string;
}

export interface OnboardingOption {
  value: string;
  label: string;
  hint?: string;
}

export interface OnboardingQuestion {
  id: string;
  section: string;
  stage: 'founder_discovery' | 'venture_story' | string;
  category: 'background' | 'experience' | 'vision' | 'funding_intent' | 'expectations' | string;
  ui_control_type:
    | 'tap_cards'
    | 'multi_tap_cards'
    | 'ab_binary'
    | 'numeric_presets'
    | 'conditional_collateral_slider'
    | string;
  is_v1_essential: boolean;
  question_key: string;
  label: string;
  description?: string | null;
  question_type: string;
  options?: Array<OnboardingOption | string> | null;
  placeholder?: string | null;
  is_mandatory: boolean;
  order: number;
}

export interface FounderProfile {
  id: string;
  founder_id: string;
  full_name?: string | null;
  email?: string | null;
  title?: string | null;
  firm_or_company?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  role_archetype?: string | null;
  experience_years?: string | null;
  core_expertise: string[];
  continuity_backup_plan?: string | null;
  past_resilience_verified: boolean;
  three_year_goal?: string | null;
  biggest_bottleneck?: string | null;
  investor_involvement_pref?: string | null;
  update_cadence?: string | null;
  ai_summary?: string | null;
  raw_discovery_answers: Record<string, any>;
}

export interface OnboardingAnalysisResult {
  founder_summary: string;
  ticket_guardrail?: {
    triggered: boolean;
    min_amount: number;
    entered_amount: number;
    title: string;
    message: string;
  } | null;
  value_discovery_tips: string[];
  reality_check_chips: string[];
  detected_conflicts: string[];
  prefilled_story_blocks: {
    capital_target?: number;
    proposed_arrangement?: string;
    use_of_funds_summary?: string;
    founder_bio_summary?: string;
    continuity_note?: string;
    collateral_type?: string;
    offered_return_rate?: number;
    investor_involvement?: string;
    update_cadence?: string;
    three_year_goal?: string;
  };
}

export interface InvestorProfile {
  id: string;
  investor_id: string;
  full_name?: string | null;
  email?: string | null;
  title?: string | null;
  firm_or_company?: string | null;
  bio?: string | null;
  investor_type?: string | null;
  investing_capacity_type?: string | null;
  professional_background: string[];
  past_private_investments?: boolean | null;
  experience_level?: string | null;
  prior_structures_used: string[];
  evaluation_priorities: string[];
  primary_objective?: string | null;
  risk_tolerance_level?: string | null;
  risk_clarifications: Record<string, any>;
  expected_evidence: string[];
  onboarding_completed: boolean;
  ai_summary?: string | null;
  raw_discovery_answers: Record<string, any>;
}

export interface InvestorAnalysisResult {
  investor_summary: string;
  extracted_preferences: Record<string, any>;
  detected_conflicts: string[];
  follow_up_questions: string[];
  terminology_notes: string[];
  proposed_mandate: {
    target_sectors?: string[];
    mandatory_sectors?: string[];
    target_stages?: string[];
    locations?: string[];
    ticket_min?: number;
    ticket_max?: number;
    accepted_arrangements?: string[];
    mandatory_arrangements?: string[];
    time_horizon?: string;
    desired_involvement?: string;
    willing_to_follow_up?: string;
    thesis_summary?: string;
  };
  suitability_disclaimer: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatResponse {
  reply: string;
  recommended_venture_ids: string[];
  suggested_actions: string[];
}

export interface PlatformConfig {
  platform_name: string;
  tagline: string;
  min_opportunity_amount: number;
  min_opportunity_display: string;
  commercial_fee_status: string;
  commercial_fee_note: string;
  legal_status_note: string;
  disclaimer: string;
}
