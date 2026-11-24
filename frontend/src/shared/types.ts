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

export interface OnboardingQuestion {
  id: string;
  section: string;
  question_key: string;
  label: string;
  description?: string | null;
  question_type: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'SELECT' | 'MULTISELECT' | 'CURRENCY' | string;
  options?: string[] | null;
  placeholder?: string | null;
  is_mandatory: boolean;
  order: number;
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
