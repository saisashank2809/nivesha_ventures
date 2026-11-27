import { VentureDetail, MatchCase, InvestorMandate } from '../../../shared/types';
import { formatINR } from '../../../shared/formatters';

export interface FilmSpendItem {
  label: string;
  amount: string;
  pct: number;
  purpose: string;
  imageUrl: string;
}

export interface FilmCreditOption {
  units: number;
  amountINR: number;
  amountLabel: string;
  tierName: string;
  perks: string;
}

export interface FilmRevenueChannel {
  id: string;
  title: string;
  detail: string;
  statusLabel: string;
  statusTone: 'neutral' | 'partial' | 'risk' | 'verified';
}

export interface FilmEvidenceCheck {
  key: string;
  label: string;
  statusRaw: string;
  statusLabel: string;
  tone: 'verified' | 'partial' | 'risk' | 'neutral';
  details: string;
}

export interface FilmMilestoneNode {
  id: string;
  label: string;
  detail: string;
  kind: 'done' | 'current' | 'target' | 'gap';
}

/** Future AI-native slot interface — optionally injected when Evidence-Grounded Copilot is active. */
export interface FilmVentureAIContext {
  personalizedEmphasis?: string;
  matchExplanation?: string;
  evidenceSummary?: string;
  contradictionHighlights?: string[];
  suggestedQuestions?: Array<{ short: string; sub: string; question: string }>;
}

export interface FilmVentureViewModel {
  venture: VentureDetail;
  matchCase: MatchCase | null;
  mandate: InvestorMandate | null;
  aiContext?: FilmVentureAIContext | null;
  cleanEnumText: (text: string) => string;

  // Opportunity
  conciseSummary: string;
  gallery: string[];
  hasUploadedGallery: boolean;
  heroVerificationLabel: string;
  heroVerificationTone: 'verified' | 'partial' | 'risk' | 'neutral';

  // Funding & Spend
  projectBudget: number | null;
  capitalSought: number;
  promoterShare: number;
  raisePctOfBudget: number | null;
  promoterPctOfBudget: number | null;
  perUnit: number | null;
  totalUnits: number | null;
  spendItems: FilmSpendItem[];

  // Participation Tickets (Global Synced Truth)
  ticketOptions: FilmCreditOption[];
  selectedUnits: number;
  selectedCapital: number | null;
  raiseSharePct: number | null;
  budgetSharePct: number | null;
  activeTier: FilmCreditOption | null;

  // Journey & Conflicting Terms
  hasRepaymentConflict: boolean;
  conflictSummary: string;
  waterfallOrderText: string | null;

  // Revenue Ecosystem
  revenueChannels: FilmRevenueChannel[];
  signedChannelCount: number;

  // Producer Portfolio
  producerName: string;
  producerTitle: string;
  producerFirm: string;
  producerAvatarUrl: string | null;
  pastProjectsText: string | null;
  pastProjectsStatusLabel: string;
  pastProjectsStatusTone: 'verified' | 'partial' | 'risk' | 'neutral';
  pastProjectsHasGrossMetric: boolean;
  priorReleaseCount: number;
  historicalBenchmarkText: string | null;

  // Readiness & Evidence & Risks
  milestones: FilmMilestoneNode[];
  evidenceChecks: FilmEvidenceCheck[];
  missingDocuments: string[];
  materialRisks: Array<{ title: string; summary: string }>;
  tenSections: Array<{ num: string; title: string; content: string; source: string }>;

  // Decision Assistant Questions
  clarificationItems: Array<{ short: string; sub: string; question: string }>;
  defaultEnquiryNote: (units: number, questionIdx: number) => string;
}

export const statusMeta = (raw?: string): { tone: 'verified' | 'partial' | 'risk' | 'neutral'; label: string } => {
  const s = (raw || 'DECLARED').toUpperCase();
  if (s === 'VERIFIED') return { tone: 'verified', label: 'Verified' };
  if (s === 'SUPPORTED') return { tone: 'verified', label: 'Supported' };
  if (s === 'PARTLY_VERIFIED' || s === 'PARTIALLY_VERIFIED') return { tone: 'partial', label: 'Partly Verified' };
  if (s === 'UNRESOLVED_CHECK' || s === 'UNRESOLVED' || s === 'OPEN_QUESTION') return { tone: 'risk', label: 'Unresolved' };
  return { tone: 'neutral', label: 'Declared' };
};

export const cleanEnumText = (text: string): string =>
  text
    .replace(/FRACTIONAL_EQUITY_UNITS/g, 'Fractional Equity Units')
    .replace(/SECURED_COLLATERAL_DEBT/g, 'Secured Collateral Debt')
    .replace(/GROWTH_EQUITY_WITH_REV_SHARE/g, 'Growth Equity with Rev-Share')
    .replace(/PROJECT_DEVELOPMENT_FINANCING/g, 'Project Development Financing')
    .replace(/EARLY_STAGE_EQUITY/g, 'Early Stage Equity')
    .replace(/ACTIVE_ADVISORY/g, 'Active Advisory')
    .replace(/MONTHLY_CHECK_IN/g, 'Monthly Check-In')
    .replace(/1_TO_3_YEARS/g, '1–3 Years')
    .replace(/_/g, ' ');

const parseAmountToINR = (raw: string): number => {
  const n = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
  if (/cr/i.test(raw)) return n * 10000000;
  if (/l/i.test(raw)) return n * 100000;
  return n;
};

export function buildFilmVentureModel(
  venture: VentureDetail,
  matchCase: MatchCase | null,
  mandate: InvestorMandate | null,
  selectedUnits: number,
  aiContext?: FilmVentureAIContext | null
): FilmVentureViewModel {
  const story = (venture.venture_story || {}) as Record<string, any>;
  const arrD = (venture.arrangement_details || {}) as Record<string, any>;
  const findings = (venture.due_diligence_findings || {}) as Record<string, any>;
  const track = (venture.operating_track_record || {}) as Record<string, any>;
  const growth = (venture.growth_plan || {}) as Record<string, any>;

  const hasUploadedGallery = Boolean(venture.gallery_urls && venture.gallery_urls.length > 0);
  const gallery = hasUploadedGallery
    ? (venture.gallery_urls as string[])
    : venture.hero_image_url
    ? [venture.hero_image_url]
    : [];

  const heroVerification = statusMeta(venture.verification_status);

  // Deduplicated concise summary omitting redundant figures already shown in hero metrics
  const rawOverview = [story.venture_overview, story.current_position]
    .filter(Boolean)
    .join(' ')
    .replace(/₹[\d.,]+\s*(?:Cr(?:ores?)?|L(?:akhs?)?)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const words = (rawOverview || venture.tag_line || venture.business_context || '').split(/\s+/).filter(Boolean);
  const conciseSummary = words.length > 34 ? `${words.slice(0, 32).join(' ').replace(/[.,;:]$/, '')}.` : words.join(' ');

  const projectBudget: number | null = arrD.total_budget || arrD.total_project_budget || null;
  const capitalSought = arrD.capital_sought || venture.capital_target;
  const perUnit: number | null = arrD.unit_price || venture.ticket_min || null;
  const totalUnits: number | null = arrD.total_units || (perUnit && capitalSought ? Math.round(capitalSought / perUnit) : null);
  const promoterShare = projectBudget && projectBudget > capitalSought ? projectBudget - capitalSought : 0;
  const raisePctOfBudget = projectBudget && projectBudget > 0 ? Math.round((capitalSought / projectBudget) * 100) : null;
  const promoterPctOfBudget = raisePctOfBudget !== null ? 100 - raisePctOfBudget : null;

  // Parse expenditure breakdown strictly from backend venture_story.use_of_capital
  const spendText = String(story.use_of_capital || '');
  const rawMatches = Array.from(spendText.matchAll(/([^,;()]+?)\s*\((₹[^)]+)\)/g));
  const totalNumericSpend = rawMatches.reduce((acc, m) => acc + parseAmountToINR(m[2]), 0);
  const spendItems: FilmSpendItem[] = rawMatches.map((m, idx) => {
    const rawLabel = m[1].replace(/^and\s+/i, '').trim();
    const numVal = parseAmountToINR(m[2]);
    const pct = totalNumericSpend > 0 ? Math.round((numVal / totalNumericSpend) * 1000) / 10 : Math.round(100 / rawMatches.length);
    const label = /shooting/i.test(rawLabel)
      ? 'Principal Shoot & Sets'
      : /vfx|cgi/i.test(rawLabel)
      ? 'VFX & CGI Pipeline'
      : /sound|post/i.test(rawLabel)
      ? 'Sound, Score & Post-Production'
      : rawLabel;
    const purpose = /shooting/i.test(rawLabel)
      ? 'Filming schedule, production sets, cinematography crew & cast dates.'
      : /vfx|cgi/i.test(rawLabel)
      ? 'Visual effects & CGI action sequence pipeline.'
      : /sound|post/i.test(rawLabel)
      ? 'Original background score, sound mixing & post-production mastering.'
      : `${rawLabel} production line item.`;
    const imgIdx = Math.min(idx, Math.max(0, gallery.length - 1));
    return {
      label,
      amount: m[2].trim(),
      pct,
      purpose,
      imageUrl: gallery[imgIdx] || '',
    };
  });

  // Participation tiers dynamically derived from arrangement_details.credit_tiers or unit counts
  const rawTiers: Array<any> = Array.isArray(arrD.credit_tiers) ? arrD.credit_tiers : [];
  const parsedTiers: FilmCreditOption[] = rawTiers
    .map((ct, idx) => {
      const m = String(ct.min_investment || '').match(/(\d+)\s*Unit/i);
      const units = m ? parseInt(m[1], 10) : [1, 2, 4, 8][idx] || idx + 1;
      const amt = perUnit ? units * perUnit : 0;
      return {
        units,
        amountINR: amt,
        amountLabel: amt ? formatINR(amt) : `${units} Unit${units > 1 ? 's' : ''}`,
        tierName: ct.tier || `Tier ${units}`,
        perks: ct.perks || 'Producer credit attribution per final agreement',
      };
    })
    .filter((t) => !totalUnits || t.units <= totalUnits);

  const ticketOptions: FilmCreditOption[] =
    parsedTiers.length > 0
      ? parsedTiers
      : perUnit
      ? [1, 2, 4, 8]
          .filter((u) => !totalUnits || u <= totalUnits)
          .map((u) => ({
            units: u,
            amountINR: u * perUnit,
            amountLabel: formatINR(u * perUnit),
            tierName: 'Co-Producer Participation',
            perks: 'Contracted participation terms per final agreement',
          }))
      : [];

  const activeTier =
    ticketOptions.reduce<FilmCreditOption | null>((best, opt) => (selectedUnits >= opt.units ? opt : best), null) ||
    ticketOptions[0] ||
    null;
  const selectedCapital = perUnit ? selectedUnits * perUnit : activeTier?.amountINR || null;
  const raiseSharePct = totalUnits ? Math.round((selectedUnits / totalUnits) * 1000) / 10 : null;
  const budgetSharePct =
    selectedCapital && projectBudget && projectBudget > 0 ? Math.round((selectedCapital / projectBudget) * 1000) / 10 : null;

  // Dynamic waterfall / repayment contradiction check
  const waterfallOrderText = arrD.waterfall_recovery_order ? String(arrD.waterfall_recovery_order) : null;
  const calcNote = String(arrD.calculation_note || '');
  const propText = String(story.investment_proposal || '');
  const mentionsPAFirst = /P&A/i.test(waterfallOrderText || '');
  const mentions60Pool = /60%/i.test(calcNote);
  const mentions100FirstDollar = /100% first-dollar/i.test(propText);
  const hasRepaymentConflict = Boolean(mentionsPAFirst && (mentions60Pool || mentions100FirstDollar));
  const conflictSummary = hasRepaymentConflict
    ? 'Waterfall deducts uncapped marketing costs (P&A) first; arrangement notes cite a 60% investor pool until payback while the narrative cites 100% first-dollar OTT payback.'
    : waterfallOrderText || 'Exact payout waterfall priority & marketing cap require confirmation in final signed contracts.';

  // Missing documents strictly from venture & matchCase
  const missingDocuments = Array.from(
    new Set([...(venture.missing_information || []), ...(matchCase?.missing_information || [])])
  );

  // Revenue channels strictly preserving unknown vs unconfirmed vs planned (Requirement 7: missing doc != proof zero signed exists)
  const revenueChannels: FilmRevenueChannel[] = [
    ...(growth.theatrical_release_window
      ? [
          {
            id: 'cinema',
            title: 'Cinema Box Office',
            detail: `Planned window: ${growth.theatrical_release_window}`,
            statusLabel: 'Planned Window',
            statusTone: 'neutral' as const,
          },
        ]
      : []),
    ...(growth.satellite_ott_strategy
      ? [
          {
            id: 'ott',
            title: 'OTT Digital Streaming',
            detail: String(growth.satellite_ott_strategy),
            statusLabel: 'Early Talks · Unconfirmed',
            statusTone: 'partial' as const,
          },
        ]
      : []),
    ...(growth.music_rights_valuation
      ? [
          {
            id: 'music',
            title: 'Audio & Music Rights',
            detail: String(growth.music_rights_valuation),
            statusLabel: 'Projected Value',
            statusTone: 'neutral' as const,
          },
        ]
      : []),
    ...(track.distribution_loi
      ? [
          {
            id: 'regional',
            title: 'Regional Distribution LOI',
            detail: String(track.distribution_loi),
            statusLabel: 'Non-Binding LOI',
            statusTone: 'partial' as const,
          },
        ]
      : []),
    ...(missingDocuments.some((m) => /satellite|dubbing|ott/i.test(m))
      ? [
          {
            id: 'satellite',
            title: 'Hindi Dubbing & Satellite',
            detail: 'Final binding Long-Form Agreement not provided on file (binding status unconfirmed).',
            statusLabel: 'Doc Not On File',
            statusTone: 'risk' as const,
          },
        ]
      : []),
  ];

  const signedChannelCount = 0; // Only count signed if verified agreement entries explicitly appear

  // Finding entries & friendly labels
  const friendlyNames: Record<string, string> = {
    crew_credentials: 'Lead Crew Contracts',
    script_ip_copyright: 'Script IP & Copyright',
    budget_breakdown: 'Production Budget Schedule',
    comparable_multipliers: 'Peer Box-Office Comparisons',
    talent_binding: 'Lead Cast Dates',
    operational_reality: 'Operations Check',
    track_record: 'Historical Track Record',
  };

  const evidenceChecks: FilmEvidenceCheck[] = Object.entries(findings).map(([key, val]: [string, any]) => {
    const meta = statusMeta(val?.status);
    return {
      key,
      label: friendlyNames[key] || cleanEnumText(key),
      statusRaw: String(val?.status || 'DECLARED'),
      statusLabel: meta.label,
      tone: meta.tone,
      details: String(val?.finding || val?.details || 'Details pending verification.'),
    };
  });

  const pastMeta = findings.track_record?.status ? statusMeta(findings.track_record.status) : { tone: 'neutral' as const, label: 'Declared' };
  const pastProjectsText = track.past_projects ? String(track.past_projects) : null;
  const pastProjectsHasGrossMetric = Boolean(pastProjectsText && /gross|₹/i.test(pastProjectsText));
  const releaseMatch = pastProjectsText?.match(/(\d+)\s*Feature\s*Film/i);
  const priorReleaseCount = releaseMatch ? parseInt(releaseMatch[1], 10) : 0;

  // Production Readiness Milestones strictly from venture fields
  const verifiedDone = evidenceChecks.filter((e) => e.tone === 'verified' && /script|crew/i.test(e.key)).length > 0;
  const milestones: FilmMilestoneNode[] = [
    {
      id: 'script-crew',
      label: 'Script & Crew Foundation',
      detail: verifiedDone ? 'Script & key crew contracts verified on file' : 'Initial creative documentation submitted',
      kind: verifiedDone ? 'done' : 'target',
    },
    {
      id: 'current-stage',
      label: venture.stage || 'Current Production Stage',
      detail: story.current_position ? String(story.current_position).split(',')[0] : 'Stage reported by founder',
      kind: 'current',
    },
    {
      id: 'release-window',
      label: 'Release Target Window',
      detail: growth.theatrical_release_window ? `${growth.theatrical_release_window} (Target only)` : 'Release window not scheduled',
      kind: 'target',
    },
    {
      id: 'safeguards',
      label: 'Contract Safeguards',
      detail: missingDocuments.length > 0 ? `${missingDocuments.length} missing doc item(s) · no escrow verified` : 'Pending final agreements',
      kind: 'gap',
    },
  ];

  // Material Risks (Always visible, never hidden)
  const materialRisks: Array<{ title: string; summary: string }> = [
    {
      title: 'Repayment Order & P&A Cap',
      summary: hasRepaymentConflict
        ? 'P&A expenses deduct first with no spending ceiling; 60% investor pool conflicts with 100% OTT first-out narrative.'
        : 'Distributable payout priority & release-cost ceiling are not yet fixed in a binding contract.',
    },
    {
      title: 'Unconfirmed Revenue Contracts',
      summary: `${revenueChannels.length} planned channels shown; binding Long-Form Agreements are not verified on file.`,
    },
    ...(missingDocuments.length > 0
      ? [{ title: 'Missing Safeguard Documents', summary: missingDocuments.join(' · ') }]
      : []),
    ...(story.risks_and_dependencies
      ? [{ title: 'Production & Release Dependencies', summary: String(story.risks_and_dependencies) }]
      : []),
  ];

  // 10-Section Reference Dossier
  const customSections: Array<{ num?: string; title: string; content: string; source?: string }> =
    (story.custom_sections as any[]) || ((arrD as any)?.custom_sections as any[]) || [];
  const tenSections = [
    { num: '01', title: 'Business Summary', content: story.venture_overview || venture.business_context, source: 'FOUNDER' },
    { num: '02', title: 'Current Operations', content: story.current_position || 'Reported stage: ' + venture.stage, source: 'RECORDS' },
    { num: '03', title: 'Market Demand', content: story.opportunity || venture.tag_line, source: 'MARKET' },
    { num: '04', title: 'Money Needed', content: story.capital_requirement || `Target capital: ${formatINR(capitalSought)}.`, source: 'PLAN' },
    { num: '05', title: 'Where Money Goes', content: story.use_of_capital || arrD.itemized_budget || 'Allocated across production schedule.', source: 'SPEND' },
    { num: '06', title: 'How Investors Earn', content: story.investment_proposal || cleanEnumText(venture.proposed_arrangement || 'Direct deal'), source: 'TERMS' },
    { num: '07', title: 'Team Experience', content: story.execution_capability || 'Promoter execution background on file.', source: 'TEAM' },
    { num: '08', title: 'Key Risks', content: story.risks_and_dependencies || 'Subject to execution & release risks.', source: 'RISKS' },
    { num: '09', title: 'Investor Rights & Updates', content: story.investor_participation || 'Periodic updates & agreed oversight.', source: 'RIGHTS' },
    { num: '10', title: 'Checked Documents', content: story.evidence_and_next_steps || 'Reviewed by platform desk.', source: 'CHECKS' },
    ...customSections.map((cs, i) => ({
      num: cs.num || String(11 + i).padStart(2, '0'),
      title: cs.title,
      content: cs.content,
      source: cs.source || 'ADDITIONAL',
    })),
  ];

  // Contextual clarification prompts dynamically adapted to MatchCase & Missing Docs (with optional future AI slot)
  const structureMismatchExists = Boolean(matchCase?.mandatory_mismatches?.length);
  const clarificationItems = aiContext?.suggestedQuestions || [
    {
      short: 'Payout Priority',
      sub: hasRepaymentConflict ? 'Resolve 60% pool vs OTT priority' : 'Confirm recoupment schedule',
      question: hasRepaymentConflict
        ? 'Will incoming receipts follow a signed first-out recoupment schedule or the proposed 60% profit pool until payback?'
        : 'Can you share the signed recoupment waterfall priority order before commitment?',
    },
    {
      short: 'P&A Spend Cap',
      sub: 'Limit marketing deductions',
      question: 'What maximum cap applies to release and marketing expenses (P&A) before investor capital begins returning?',
    },
    {
      short: 'Escrow & Contracts',
      sub: 'OTT, Hindi LFA & collection account',
      question: `Will collections flow through a dedicated escrow account, and what is the expected timeline for binding revenue contracts (${missingDocuments[0] || 'distribution agreements'})?`,
    },
    {
      short: structureMismatchExists ? 'Structure & Mandate Fit' : 'Completion Safeguards',
      sub: structureMismatchExists ? 'Address structure mismatch' : 'Insurance & overrun cover',
      question: structureMismatchExists
        ? `Since ${cleanEnumText(venture.proposed_arrangement || 'this structure')} differs from my saved mandate preferences, can escrow protections or milestone triggers be added?`
        : 'What completion guarantee, insurance, or overrun protection covers filming and post-production delays?',
    },
  ];

  const defaultEnquiryNote = (units: number, questionIdx: number): string => {
    const cap = perUnit ? units * perUnit : capitalSought;
    const shareStr = totalUnits ? ` (${units} unit${units > 1 ? 's' : ''}, ${Math.round((units / totalUnits) * 1000) / 10}% of the ${formatINR(capitalSought)} raise)` : '';
    const q = clarificationItems[questionIdx]?.question || clarificationItems[0]?.question || '';
    return `Hi ${venture.founder_name}, I am evaluating a proposed ${formatINR(cap)}${shareStr} participation in ${venture.company_name}. Could you clarify: ${q}`;
  };

  return {
    venture,
    matchCase,
    mandate,
    aiContext,
    cleanEnumText,
    conciseSummary,
    gallery,
    hasUploadedGallery,
    heroVerificationLabel: heroVerification.label,
    heroVerificationTone: heroVerification.tone,
    projectBudget,
    capitalSought,
    promoterShare,
    raisePctOfBudget,
    promoterPctOfBudget,
    perUnit,
    totalUnits,
    spendItems,
    ticketOptions,
    selectedUnits,
    selectedCapital,
    raiseSharePct,
    budgetSharePct,
    activeTier,
    hasRepaymentConflict,
    conflictSummary,
    waterfallOrderText,
    revenueChannels,
    signedChannelCount,
    producerName: venture.founder_name,
    producerTitle: venture.founder_title || 'Producer',
    producerFirm: venture.company_name,
    producerAvatarUrl: null, // Explicitly null unless backend VentureCard provides a real founder photo URL
    pastProjectsText,
    pastProjectsStatusLabel: pastMeta.label,
    pastProjectsStatusTone: pastMeta.tone,
    pastProjectsHasGrossMetric,
    priorReleaseCount,
    historicalBenchmarkText: track.declared_box_office_multipliers ? String(track.declared_box_office_multipliers) : null,
    milestones,
    evidenceChecks,
    missingDocuments,
    materialRisks,
    tenSections,
    clarificationItems,
    defaultEnquiryNote,
  };
}
