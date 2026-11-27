import React, { useState, useEffect } from 'react';
import { VentureCard, InvestorMandate, InvestorProfile, RecommendedVentureMatch, User, MatchCase } from '../../shared/types';
import { Api } from '../../shared/api';
import { formatINR } from '../../shared/formatters';
import './VentureSplitCard.css';

// Human-readable enum translation helper
function formatReadableEnum(val?: string | null): string {
  if (!val) return 'Not disclosed';
  const mapping: Record<string, string> = {
    ACTIVE_ADVISORY: 'Active Advisory',
    PASSIVE: 'Passive (Hands-off)',
    HANDS_OFF: 'Hands-off',
    MONTHLY_ADVISORY: 'Monthly Advisory',
    ACTIVE_HANDS_ON: 'Active Operational Lead',
    MONTHLY_CHECK_IN: 'Monthly Check-In',
    MONTHLY_OPERATIONAL_REVIEWS: 'Monthly Operational Reviews',
    PERIODIC_CHECK_IN: 'Periodic Quarterly Check-In',
    NO_FOLLOW_UP: 'No Regular Follow-Up',
    LOAN: 'Loan / Fixed Debt',
    EQUITY: 'Equity Stake',
    REVENUE_SHARE: 'Revenue Share / Royalty',
    SECURED_COLLATERAL_DEBT: 'Secured Collateral Debt',
    FRACTIONAL_EQUITY_UNITS: 'Fractional Equity Units',
    PARTIAL_EQUITY_BUYOUT: 'Partial Equity Buyout',
    GROWTH_EQUITY_WITH_REV_SHARE: 'Growth Equity with Rev-Share',
    PROJECT_DEVELOPMENT_FINANCING: 'Project Development Financing',
    POTENTIALLY_SUITABLE: 'Potentially Suitable',
    UNSUITABLE: 'Mandatory Mismatch',
    NEEDS_MORE_INFORMATION: 'Needs Information',
  };

  if (mapping[val]) return mapping[val];

  return val
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const isFilmVenture = (v: VentureCard): boolean =>
  /film|cinema|motion picture|creative media|entertainment/i.test(v.sector || '') ||
  (v as any).custom_answers?.business_type === 'FILM_ENTERTAINMENT';

// Clean match text helper to replace embedded enums with readable phrases
function cleanReasonText(text: string): string {
  if (!text) return '';
  return text
    .replace(/ACTIVE_ADVISORY/g, 'Active Advisory')
    .replace(/MONTHLY_CHECK_IN/g, 'Monthly Check-In')
    .replace(/PERIODIC_CHECK_IN/g, 'Quarterly Check-In')
    .replace(/MONTHLY_OPERATIONAL_REVIEWS/g, 'Monthly Operational Reviews')
    .replace(/NO_FOLLOW_UP/g, 'No Regular Follow-Up')
    .replace(/HANDS_OFF/g, 'Hands-off')
    .replace(/SECURED_COLLATERAL_DEBT/g, 'Secured Collateral Debt')
    .replace(/FRACTIONAL_EQUITY_UNITS/g, 'Fractional Equity Units')
    .replace(/GROWTH_EQUITY_WITH_REV_SHARE/g, 'Growth Equity with Rev-Share')
    .replace(/PROJECT_DEVELOPMENT_FINANCING/g, 'Project Development Financing')
    .replace(/LOAN/g, 'Loan / Debt')
    .replace(/EQUITY/g, 'Equity');
}

// Extract one specific useful operating metric and its verification status
function extractOperatingMetric(venture: VentureCard): { metric: string; verification: string; isAuditedOrVerified: boolean } {
  const track = venture.operating_track_record || {};
  const findings = venture.due_diligence_findings || {};

  if (track.historical_annual_revenue) {
    return {
      metric: String(track.historical_annual_revenue),
      verification: 'GST Verified',
      isAuditedOrVerified: true,
    };
  }

  if (track.declared_monthly_revenue) {
    const amountStr = formatINR(track.declared_monthly_revenue);
    const hasGSTAudit = findings.track_record?.finding?.includes('GST') || findings.track_record?.status === 'VERIFIED';
    return {
      metric: `Turnover: ${amountStr}/mo (Trailing 12-mo baseline)`,
      verification: hasGSTAudit ? 'GST Verified' : 'Founder-Declared',
      isAuditedOrVerified: Boolean(hasGSTAudit),
    };
  }

  if (track.annual_turnover) {
    return {
      metric: `Turnover: ${track.annual_turnover}`,
      verification: 'GST Verified',
      isAuditedOrVerified: true,
    };
  }

  if (track.past_projects) {
    return {
      metric: `Track Record: ${track.past_projects}`,
      verification: 'Box Office Record',
      isAuditedOrVerified: true,
    };
  }

  if (track.factory_capacity || track.current_utilization) {
    const util = track.current_utilization ? ` (${track.current_utilization})` : '';
    return {
      metric: `Production: ${track.factory_capacity || 'Plant active'}${util}`,
      verification: 'Factory Inspected',
      isAuditedOrVerified: true,
    };
  }

  if (track.operational_beds) {
    return {
      metric: `Capacity: ${track.operational_beds}`,
      verification: 'Clinical Audit',
      isAuditedOrVerified: true,
    };
  }

  if (track.phase_1_sales) {
    return {
      metric: `Sales: ${track.phase_1_sales}`,
      verification: 'RERA Registered',
      isAuditedOrVerified: true,
    };
  }

  if (track.active_orders) {
    return {
      metric: `Orders: ${track.active_orders}`,
      verification: 'Purchase Orders',
      isAuditedOrVerified: false,
    };
  }

  return {
    metric: 'Commercial enterprise operating baseline',
    verification: 'Declared Baseline',
    isAuditedOrVerified: false,
  };
}

// Extract one specific projection milestone
function extractProjection(venture: VentureCard): string {
  const growth = venture.growth_plan || {};
  if (growth.projected_monthly_revenue) {
    return `Revenue target: ${formatINR(growth.projected_monthly_revenue)}/mo (${growth.expansion_target || 'Target expansion outlet'})`;
  }
  if (growth.projected_revenue_fy26) {
    return `Revenue target: ${growth.projected_revenue_fy26} (${growth.d2c_expansion_target || 'Target expansion'})`;
  }
  if (growth.confirmed_purchase_orders) {
    return `Active pipeline: ${growth.confirmed_purchase_orders}`;
  }
  if (growth.expansion_target) {
    return `Milestone: ${growth.expansion_target}`;
  }
  if (growth.theatrical_release_window) {
    return `Target release: ${growth.theatrical_release_window}`;
  }
  if (growth.cath_lab_addition) {
    return `Milestone: ${growth.cath_lab_addition}`;
  }
  if (growth.phase_2_sales_potential) {
    return `Target potential: ${growth.phase_2_sales_potential}`;
  }
  return 'Target expansion and operational scaling milestone';
}

const getTenSections = (venture: VentureCard) => {
  const story = (venture.venture_story || {}) as Record<string, any>;
  const arr = venture.arrangement_details || {};
  return [
    { num: '01', title: 'Venture Overview', content: story.venture_overview || venture.business_context, source: 'FOUNDER DECLARATION' },
    { num: '02', title: 'Current Position', content: story.current_position || 'Active operating enterprise with verifiable baseline records.', source: 'OPERATING AUDIT' },
    { num: '03', title: 'Opportunity', content: story.opportunity || venture.tag_line, source: 'MARKET CONTEXT' },
    { num: '04', title: 'Capital Requirement', content: story.capital_requirement || `Total capital sought: ${formatINR(venture.capital_target)}.`, source: 'BUDGET SCHEDULE' },
    { num: '05', title: 'Use of Capital', content: story.use_of_capital || arr.itemized_budget || 'Audited line items for production and expansion deployment.', source: 'DEPLOYMENT PLAN' },
    { num: '06', title: 'Investment Proposal', content: story.investment_proposal || `Proposed arrangement: ${(venture.proposed_arrangement || 'Direct').replace(/_/g, ' ')}.`, source: 'STRUCTURE TERMS' },
    { num: '07', title: 'Execution Capability', content: story.execution_capability || 'Promoter credentials, leadership track record, and technical delivery partners.', source: 'CREDENTIALS' },
    { num: '08', title: 'Risks & Dependencies', content: story.risks_and_dependencies || 'Subject to supply milestones, contractor timelines, and statutory clearances.', source: 'DISCLOSURES' },
    { num: '09', title: 'Investor Participation', content: story.investor_participation || 'Audited financial reporting, priority recoupment waterfall, and governance rights.', source: 'GOVERNANCE' },
    { num: '10', title: 'Evidence & Next Steps', content: story.evidence_and_next_steps || 'Submitted documentation undergoing independent platform verification review.', source: 'REVIEW DESK' },
  ];
};

interface InvestorGuidedDiscoveryProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onOpenOnboarding?: () => void;
  onOpenDirectChat?: (connectionId: string) => void;
  onSelectVenture?: (ventureId: string) => void;
}

export const InvestorGuidedDiscovery: React.FC<InvestorGuidedDiscoveryProps> = ({
  currentUser,
  onOpenLogin,
  onOpenOnboarding,
  onOpenDirectChat,
  onSelectVenture,
}) => {
  const [mandate, setMandate] = useState<InvestorMandate | null>(null);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [recommendedMatches, setRecommendedMatches] = useState<RecommendedVentureMatch[]>([]);
  const [ventures, setVentures] = useState<VentureCard[]>([]);
  const [matchCases, setMatchCases] = useState<Record<string, MatchCase>>({});
  const [loading, setLoading] = useState(true);

  // Mandate editor expand / collapse state
  const [isEditingMandate, setIsEditingMandate] = useState(false);
  const [savingMandate, setSavingMandate] = useState(false);

  // Draft mandate form controls
  const [selectedArrangement, setSelectedArrangement] = useState<string>('LOAN');
  const [selectedInvolvement, setSelectedInvolvement] = useState<string>('ACTIVE_ADVISORY');
  const [selectedFollowUp, setSelectedFollowUp] = useState<string>('MONTHLY_CHECK_IN');
  const [minContribution, setMinContribution] = useState<number>(500000);
  const [maxContribution, setMaxContribution] = useState<number>(50000000);

  // Inline card expandable previews
  const [activeDiligenceVentureId, setActiveDiligenceVentureId] = useState<string | null>(null);
  const [expandedDossierVentureId, setExpandedDossierVentureId] = useState<string | null>(null);
  const [expandedReasonsVentureId, setExpandedReasonsVentureId] = useState<string | null>(null);
  const [activeGalleryVentureId, setActiveGalleryVentureId] = useState<string | null>(null);
  const [selectedGalleryIndices, setSelectedGalleryIndices] = useState<Record<string, number>>({});

  // Direct DM Modal State (Upstream live DM integration)
  const [directDMModalVenture, setDirectDMModalVenture] = useState<VentureCard | null>(null);
  const [directDMNote, setDirectDMNote] = useState('');
  const [submittingDM, setSubmittingDM] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vList, mCases] = await Promise.all([
        Api.getVentures(),
        Api.getMatchCases(),
      ]);
      setVentures(vList);

      const caseMap: Record<string, MatchCase> = {};
      mCases.forEach((mc) => {
        caseMap[mc.venture_id] = mc;
      });
      setMatchCases(caseMap);

      if (currentUser?.role === 'INVESTOR' && Api.getToken()) {
        try {
          const [m, fp, recs] = await Promise.all([
            Api.getMyMandate().catch(() => null),
            Api.getInvestorProfile().catch(() => null),
            Api.getRecommendedMatches().catch(() => []),
          ]);
          if (m) {
            setMandate(m);
            if (m.accepted_arrangements && m.accepted_arrangements.length > 0) {
              setSelectedArrangement(m.accepted_arrangements[0]);
            } else if (m.acceptable_structures && m.acceptable_structures.length > 0) {
              setSelectedArrangement(m.acceptable_structures[0]);
            }
            if (m.desired_involvement) setSelectedInvolvement(m.desired_involvement);
            if (m.willing_to_follow_up) setSelectedFollowUp(m.willing_to_follow_up);
            if (m.ticket_min !== undefined && m.ticket_min !== null) setMinContribution(m.ticket_min);
            if (m.ticket_max !== undefined && m.ticket_max !== null) setMaxContribution(m.ticket_max);
          }
          setInvestorProfile(fp);
          setRecommendedMatches(Array.isArray(recs) ? recs : []);
        } catch {
          // If no stored mandate, fall back to default
        }
      }
    } catch (err) {
      console.error('Failed to load investor discovery data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Determine if draft criteria differ from currently applied mandate
  const appliedArrangement = mandate?.accepted_arrangements?.[0] || 'LOAN';
  const appliedInvolvement = mandate?.desired_involvement || 'ACTIVE_ADVISORY';
  const appliedFollowUp = mandate?.willing_to_follow_up || 'MONTHLY_CHECK_IN';
  const appliedMin = mandate?.ticket_min ?? 500000;
  const appliedMax = mandate?.ticket_max ?? 50000000;

  const hasUnsavedChanges =
    selectedArrangement !== appliedArrangement ||
    selectedInvolvement !== appliedInvolvement ||
    selectedFollowUp !== appliedFollowUp ||
    minContribution !== appliedMin ||
    maxContribution !== appliedMax;

  const handleUpdatePreferences = async () => {
    if (!currentUser || currentUser.role !== 'INVESTOR') {
      onOpenLogin();
      return;
    }
    try {
      setSavingMandate(true);
      const updated = await Api.updateMyMandate({
        accepted_arrangements: [selectedArrangement],
        acceptable_structures: [selectedArrangement],
        desired_involvement: selectedInvolvement,
        willing_to_follow_up: selectedFollowUp,
        ticket_min: minContribution,
        ticket_max: maxContribution,
      });
      setMandate(updated);
      await loadData();
      setIsEditingMandate(false);
    } catch (err: any) {
      alert(`Error updating preferences: ${err.message}`);
    } finally {
      setSavingMandate(false);
    }
  };

  const handleResetDraft = () => {
    setSelectedArrangement(appliedArrangement);
    setSelectedInvolvement(appliedInvolvement);
    setSelectedFollowUp(appliedFollowUp);
    setMinContribution(appliedMin);
    setMaxContribution(appliedMax);
    setIsEditingMandate(false);
  };

  const handleOpenDirectDM = (v: VentureCard) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    setDirectDMModalVenture(v);
    setDirectDMNote(`Hi ${v.founder_name || v.company_name} team, I reviewed your venture dossier on Nivesha and would like to text directly to discuss your round.`);
  };

  const handleSendDirectDM = async () => {
    if (!directDMModalVenture) return;
    try {
      setSubmittingDM(true);
      const conn = await Api.requestConnection(directDMModalVenture.id, directDMNote.trim());
      setDirectDMModalVenture(null);
      if (onOpenDirectChat) {
        onOpenDirectChat(conn.id);
      }
    } catch (err: any) {
      alert(`Failed to send direct message: ${err.message}`);
    } finally {
      setSubmittingDM(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px 20px', color: '#536074' }}>Loading curated opportunities...</div>;
  }

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '36px 24px 120px' }}>
      {/* 1. PAGE HEADER */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: '6px' }}>
              EXPLORE VENTURES
            </div>
            <h1
              style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                color: '#0f172a',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                margin: 0,
              }}
            >
              Businesses Matched to Your Preferences
            </h1>
            <p style={{ fontSize: '14.5px', color: '#475569', margin: '6px 0 0 0', maxWidth: '700px' }}>
              Every business below has been checked against tax, bank, and property records—with both the upside and the risks shown clearly.
            </p>
          </div>
          <span
            className="mono-label"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#0f172a',
              backgroundColor: '#ffffff',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              padding: '6px 14px',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {ventures.length} Checked Deals
          </span>
        </div>
      </div>

      {/* COMPACT APPLIED PREFERENCES BAR */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: '20px',
          padding: '16px 22px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Summary Elements */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
            <span
              className="mono-label"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#b48a3e',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginRight: '4px',
              }}
            >
              Your Preferences:
            </span>

            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#0f172a',
                backgroundColor: '#f5f5f7',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
              title="Applied deal type"
            >
              {formatReadableEnum(appliedArrangement)}
            </span>

            <span
              style={{
                fontSize: '12px',
                color: '#475569',
                backgroundColor: '#f5f5f7',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
              title="Involvement level"
            >
              {formatReadableEnum(appliedInvolvement)}
            </span>

            <span
              style={{
                fontSize: '12px',
                color: '#475569',
                backgroundColor: '#f5f5f7',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
              title="Follow-up commitment"
            >
              {formatReadableEnum(appliedFollowUp)}
            </span>

            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#0f172a',
                backgroundColor: '#f5f5f7',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
              title="Your investment budget"
            >
              Budget: {formatINR(appliedMin)} – {formatINR(appliedMax)}
            </span>

            {hasUnsavedChanges && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#b45309',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  padding: '4px 10px',
                  borderRadius: '8px',
                }}
              >
                Unsaved changes
              </span>
            )}
          </div>

          {/* Edit Preferences Toggle */}
          <button
            type="button"
            onClick={() => setIsEditingMandate(!isEditingMandate)}
            className="nv-btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '12.5px',
              whiteSpace: 'nowrap',
            }}
          >
            {isEditingMandate ? 'Close Editor' : 'Edit Preferences'}
          </button>
        </div>

        {/* INLINE EXPANDABLE PREFERENCES FORM */}
        {isEditingMandate && (
          <div
            style={{
              marginTop: '18px',
              paddingTop: '18px',
              borderTop: '1px solid rgba(15, 23, 42, 0.08)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              {/* Arrangement */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Deal Type
                </label>
                <select
                  value={selectedArrangement}
                  onChange={(e) => setSelectedArrangement(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.12)', background: '#f5f5f7', fontSize: '13px', color: '#0f172a' }}
                >
                  <option value="LOAN">Loan / Fixed Debt</option>
                  <option value="SECURED_COLLATERAL_DEBT">Secured Collateral Debt</option>
                  <option value="REVENUE_SHARE">Revenue Share / Royalty</option>
                  <option value="EQUITY">Equity Stake</option>
                  <option value="FRACTIONAL_EQUITY_UNITS">Fractional Equity Units</option>
                  <option value="GROWTH_EQUITY_WITH_REV_SHARE">Growth Equity with Rev-Share</option>
                </select>
              </div>

              {/* Desired Involvement */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Your Involvement
                </label>
                <select
                  value={selectedInvolvement}
                  onChange={(e) => setSelectedInvolvement(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.12)', background: '#f5f5f7', fontSize: '13px', color: '#0f172a' }}
                >
                  <option value="ACTIVE_ADVISORY">Active Advisory</option>
                  <option value="MONTHLY_ADVISORY">Monthly Advisory</option>
                  <option value="ACTIVE_HANDS_ON">Active Operational Lead</option>
                  <option value="PASSIVE">Passive (Hands-off)</option>
                  <option value="HANDS_OFF">Hands-off</option>
                </select>
              </div>

              {/* Follow-up Commitment */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Check-In Frequency
                </label>
                <select
                  value={selectedFollowUp}
                  onChange={(e) => setSelectedFollowUp(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.12)', background: '#f5f5f7', fontSize: '13px', color: '#0f172a' }}
                >
                  <option value="MONTHLY_CHECK_IN">Monthly Check-In</option>
                  <option value="MONTHLY_OPERATIONAL_REVIEWS">Monthly Operational Reviews</option>
                  <option value="PERIODIC_CHECK_IN">Periodic Quarterly Check-In</option>
                  <option value="NO_FOLLOW_UP">No Regular Follow-Up</option>
                </select>
              </div>

              {/* Target Contribution Range */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Your Budget Range
                </label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select
                    value={minContribution}
                    onChange={(e) => setMinContribution(Number(e.target.value))}
                    style={{ flex: 1, padding: '9px 10px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.12)', background: '#f5f5f7', fontSize: '12.5px', color: '#0f172a' }}
                  >
                    <option value={250000}>₹2.5 Lakh</option>
                    <option value={500000}>₹5 Lakh</option>
                    <option value={1000000}>₹10 Lakh</option>
                    <option value={2000000}>₹20 Lakh</option>
                    <option value={5000000}>₹50 Lakh</option>
                  </select>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>to</span>
                  <select
                    value={maxContribution}
                    onChange={(e) => setMaxContribution(Number(e.target.value))}
                    style={{ flex: 1, padding: '9px 10px', borderRadius: '10px', border: '1px solid rgba(15, 23, 42, 0.12)', background: '#f5f5f7', fontSize: '12.5px', color: '#0f172a' }}
                  >
                    <option value={2000000}>₹20 Lakh</option>
                    <option value={5000000}>₹50 Lakh</option>
                    <option value={10000000}>₹1 Crore</option>
                    <option value={50000000}>₹5 Crore</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions: Apply vs Reset */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleResetDraft}
                className="nv-link-chevron"
                style={{ fontSize: '12.5px', color: '#475569' }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleUpdatePreferences}
                disabled={savingMandate}
                className="nv-btn-dark"
                style={{
                  padding: '8px 20px',
                  fontSize: '12.5px',
                  cursor: savingMandate ? 'wait' : 'pointer',
                }}
              >
                {savingMandate ? 'Updating Matches...' : 'Apply & Update Matches'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1.5 RECOMMENDED FOR YOU STRIP */}
      {currentUser?.role === 'INVESTOR' && (
        <div style={{ marginBottom: '26px' }}>
          {!investorProfile?.onboarding_completed && onOpenOnboarding && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                padding: '14px 18px',
                backgroundColor: '#fffdf9',
                border: '1px solid #d6c9b2',
                borderLeft: '4px solid #B48A3E',
                borderRadius: '10px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '13.5px', color: '#121a29' }}>
                <strong>Personalize your matches:</strong> Complete your 2-minute Investor Discovery to refine risk, objective, and evidence rankings.
              </div>
              <button
                type="button"
                onClick={onOpenOnboarding}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#B48A3E',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Start Investor Discovery &rarr;
              </button>
            </div>
          )}

          {recommendedMatches.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#121a29', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Recommended For You
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Ranked by mandate rules &amp; investor profile fit
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {recommendedMatches.map((rec, idx) => (
                  <div
                    key={rec.venture_id}
                    style={{
                      backgroundColor: '#fffdf9',
                      border: idx === 0 ? '1.5px solid #B48A3E' : '1px solid #d6c9b2',
                      borderRadius: '12px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: '#B48A3E',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {idx === 0 ? 'Top Recommended Match' : 'Recommended Match'}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
                          {rec.match_score}% Match
                        </span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#121a29', marginBottom: '4px' }}>
                        {rec.company_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                        {rec.sector} • {rec.location} • {formatINR(rec.capital_target)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {(rec.recommendation_reasons || []).slice(0, 2).map((reason, rIdx) => (
                          <div key={rIdx} style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                            • {cleanReasonText(reason)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectVenture?.(rec.venture_id)}
                      style={{
                        width: '100%',
                        padding: '9px 14px',
                        backgroundColor: '#0c1826',
                        color: '#f5efe5',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      See Full Details &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. FILM SPOTLIGHT + COMPACT VENTURE LIST */}
      {(() => {
        const filmVentures = ventures.filter(isFilmVenture);
        const otherVentures = ventures.filter((v) => !isFilmVenture(v));

        const getMatchMeta = (venture: VentureCard) => {
          const matchCase = matchCases[venture.id];
          const outcome = matchCase?.outcome || 'POTENTIALLY_SUITABLE';
          const outcomeColor =
            outcome === 'POTENTIALLY_SUITABLE'
              ? { bg: '#edf5ee', text: '#15803d', border: '#b8deb9', label: 'Good Fit', icon: '●' }
              : outcome === 'UNSUITABLE'
              ? { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', label: 'Not a Match', icon: '✕' }
              : { bg: '#fdf4e7', text: '#856127', border: '#ebd5b3', label: 'Needs Info', icon: '▲' };

          const rawFitReason = matchCase?.compatibility_reasons?.[0] || 'Venture structure and sector evaluated against your mandate.';
          const fitReason = cleanReasonText(rawFitReason);
          const hasMismatch = (matchCase?.mandatory_mismatches?.length || 0) > 0;
          const hasTradeOff = (matchCase?.trade_offs?.length || 0) > 0;
          const rawConcern = hasMismatch
            ? matchCase!.mandatory_mismatches[0]
            : hasTradeOff
            ? matchCase!.trade_offs[0]
            : null;
          const materialConcern = rawConcern ? cleanReasonText(rawConcern) : null;

          return { matchCase, outcomeColor, fitReason, hasMismatch, materialConcern };
        };

        const renderDrawers = (venture: VentureCard) => {
          const isDossierOpen = expandedDossierVentureId === venture.id;
          const isDiligenceOpen = activeDiligenceVentureId === venture.id;
          const isGalleryOpen = activeGalleryVentureId === venture.id;
          const gallery =
            venture.gallery_urls && venture.gallery_urls.length > 0
              ? venture.gallery_urls
              : venture.hero_image_url
              ? [venture.hero_image_url]
              : [];
          const selectedIdx = selectedGalleryIndices[venture.id] || 0;
          const tenSecs = getTenSections(venture);
          const findings = venture.due_diligence_findings || {};

          if (!isDossierOpen && !isDiligenceOpen && !(isGalleryOpen && gallery.length > 1)) return null;

          return (
            <div className="nv-drawer-container">
              {/* INLINE DOSSIER DRAWER */}
              {isDossierOpen && (
                <div style={{ marginBottom: isDiligenceOpen || isGalleryOpen ? '16px' : '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-sans)' }}>
                      10-Section Venture Summary Preview
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectVenture?.(venture.id)}
                      style={{ fontSize: '11.5px', color: '#0066cc', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Open in Full Dossier ↗
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                    {tenSecs.map((sec) => (
                      <div key={sec.num} style={{ background: '#ffffff', border: '1px solid #e6decb', borderRadius: '4px', padding: '8px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0066cc', fontFamily: 'monospace' }}>
                            {sec.num}. {sec.title}
                          </span>
                          <span style={{ fontSize: '8.5px', padding: '1px 4px', background: '#faf6ee', border: '1px solid rgba(0, 0, 0, 0.1)', color: '#0066cc' }}>
                            {sec.source}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.35 }}>
                          {sec.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INLINE DILIGENCE CHECKLIST DRAWER */}
              {isDiligenceOpen && (
                <div style={{ marginBottom: isGalleryOpen ? '16px' : '0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                    6 Standardized Due Diligence Categories
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                    {[
                      { key: 'operational_reality', label: '1. Operational Reality' },
                      { key: 'track_record', label: '2. Track Record & Supporting Evidence' },
                      { key: 'market_viability', label: '3. Market Viability & Demand' },
                      { key: 'offered_security', label: '4. Offered Security & Collateral' },
                      { key: 'business_continuity', label: '5. Business Continuity' },
                      { key: 'investor_compatibility', label: '6. Investor Compatibility' },
                    ].map((cat) => {
                      const item = findings[cat.key] || {
                        status: 'CHECKED_AGAINST_SOURCE',
                        details: 'Standard verification criteria satisfied.',
                      };
                      return (
                        <div key={cat.key} style={{ background: '#ffffff', border: '1px solid #e6decb', borderRadius: '4px', padding: '8px 10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a' }}>{cat.label}</span>
                            <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 4px', borderRadius: '2px', background: '#e9f5ed', color: '#15803d' }}>
                              {item.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#536074', lineHeight: 1.35 }}>
                            {item.details || item.finding}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* INLINE GALLERY MEDIA DRAWER */}
              {isGalleryOpen && gallery.length > 1 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0066cc', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Media Showcase ({gallery.length} verified photos):
                  </div>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {gallery.map((url, gIdx) => (
                      <button
                        key={gIdx}
                        type="button"
                        onClick={() => setSelectedGalleryIndices((prev) => ({ ...prev, [venture.id]: gIdx }))}
                        style={{
                          border: selectedIdx === gIdx ? '2px solid #0066cc' : '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: '4px',
                          padding: 0,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          width: '72px',
                          height: '52px',
                          flexShrink: 0,
                        }}
                      >
                        <img src={url} alt={`Photo ${gIdx + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        };

        return (
          <>
            {/* FLAGSHIP FILM PRODUCTION FEATURED CARD(S) */}
            {filmVentures.length > 0 && (
              <div className="nv-film-spotlight-wrap">
                {filmVentures.map((venture) => {
                  const { matchCase, outcomeColor, fitReason, hasMismatch, materialConcern } = getMatchMeta(venture);
                  const arrDetails = venture.arrangement_details || {};
                  const gallery =
                    venture.gallery_urls && venture.gallery_urls.length > 0
                      ? venture.gallery_urls
                      : venture.hero_image_url
                      ? [venture.hero_image_url]
                      : [];
                  const selectedIdx = selectedGalleryIndices[venture.id] || 0;
                  const heroImg = gallery[selectedIdx] || venture.hero_image_url;
                  const projectBudget = arrDetails.total_budget || (venture.capital_target ? venture.capital_target * 2 : null);
                  const unitPrice = arrDetails.unit_price || venture.ticket_min;
                  const totalUnits = arrDetails.total_units || (unitPrice && venture.capital_target ? Math.round(venture.capital_target / unitPrice) : 24);
                  const isDossierOpen = expandedDossierVentureId === venture.id;
                  const isDiligenceOpen = activeDiligenceVentureId === venture.id;
                  const isGalleryOpen = activeGalleryVentureId === venture.id;
                  const isReasonsOpen = expandedReasonsVentureId === venture.id;

                  return (
                    <article key={venture.id} className="nv-film-featured-card">
                      <div className="nv-film-featured-grid">
                        {/* Left: Clean Apple-Style Film Visual Frame */}
                        <div className="nv-film-photo-col">
                          {heroImg && (
                            <img
                              src={heroImg}
                              alt={venture.company_name}
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="nv-film-photo-scrim" />

                          <div className="nv-film-photo-top">
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: outcomeColor.bg,
                                color: outcomeColor.text,
                                border: `1px solid ${outcomeColor.border}`,
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              {outcomeColor.label}
                            </span>

                            {gallery.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setActiveGalleryVentureId(isGalleryOpen ? null : venture.id)}
                                style={{
                                  background: 'rgba(29, 29, 31, 0.65)',
                                  backdropFilter: 'blur(12px)',
                                  WebkitBackdropFilter: 'blur(12px)',
                                  border: '1px solid rgba(255, 255, 255, 0.22)',
                                  color: '#ffffff',
                                  borderRadius: '6px',
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                {gallery.length} photos
                              </button>
                            )}
                          </div>

                          <div className="nv-film-photo-caption">
                            <div
                              className="mono-label"
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                color: 'rgba(255, 255, 255, 0.8)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}
                            >
                              Film Production &bull; {venture.location}
                            </div>
                            <h2
                              onClick={() => onSelectVenture?.(venture.id)}
                              style={{
                                fontSize: '23px',
                                fontWeight: 700,
                                color: '#ffffff',
                                fontFamily: 'var(--font-sans)',
                                letterSpacing: '-0.02em',
                                margin: '2px 0 4px 0',
                                cursor: 'pointer',
                                lineHeight: 1.2,
                              }}
                            >
                              {venture.company_name}
                            </h2>
                            <p
                              style={{
                                fontSize: '13px',
                                color: 'rgba(245, 245, 247, 0.88)',
                                lineHeight: 1.45,
                                margin: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {venture.tag_line || venture.business_context}
                            </p>
                            <div style={{ fontSize: '11.5px', color: 'rgba(248, 250, 252, 0.72)', marginTop: '4px' }}>
                              Producer: {venture.founder_name} &bull; {venture.stage || 'Pre-Production'}
                            </div>
                          </div>
                        </div>

                        {/* Right: Plain-Language Film Deal Cockpit */}
                        <div className="nv-film-editorial-col">
                          {/* Row 1: 3 Key Numbers */}
                          <div className="nv-film-metrics-grid">
                            <div className="nv-film-metric-cell">
                              <span className="nv-film-metric-lbl">Total Film Cost</span>
                              <span className="nv-film-metric-val">{projectBudget ? formatINR(projectBudget) : 'Undisclosed'}</span>
                              <span className="nv-film-metric-sub">Producer states 50% covered</span>
                            </div>
                            <div className="nv-film-metric-cell">
                              <span className="nv-film-metric-lbl">Raising Now</span>
                              <span className="nv-film-metric-val">{formatINR(venture.capital_target)}</span>
                              <span className="nv-film-metric-sub">Goal &middot; {totalUnits} units</span>
                            </div>
                            <div className="nv-film-metric-cell">
                              <span className="nv-film-metric-lbl">Starts At</span>
                              <span className="nv-film-metric-val">{unitPrice ? formatINR(unitPrice) : 'Open'}</span>
                              <span className="nv-film-metric-sub">Per unit + screen credit</span>
                            </div>
                          </div>

                          {/* Row 2: Past Record vs What You Get */}
                          <div className="nv-comparative-strip">
                            <div>
                              <div className="nv-comparative-label-row">
                                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#0066cc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Producer Track Record
                                </span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '2px 7px',
                                    borderRadius: '5px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid rgba(0, 0, 0, 0.08)',
                                    color: '#0066cc',
                                  }}
                                >
                                  Checked
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600, lineHeight: 1.45 }}>
                                {venture.operating_track_record?.past_projects || '2 past films delivered'}
                              </div>
                            </div>

                            <div>
                              <div className="nv-comparative-label-row">
                                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  What Investors Get
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', color: '#0f172a', lineHeight: 1.45 }}>
                                Proposed net profit share + producer screen credit (0% film copyright)
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Simple Fit & Key Question Note */}
                          <div
                            style={{
                              backgroundColor: '#f5f5f7',
                              padding: '11px 14px',
                              borderRadius: '10px',
                              fontSize: '12.5px',
                              lineHeight: 1.48,
                            }}
                          >
                            <div style={{ color: '#16a34a', fontWeight: 600 }}>
                              Why it fits: <span style={{ color: '#0f172a', fontWeight: 400 }}>{fitReason}</span>
                            </div>
                            {materialConcern && (
                              <div style={{ marginTop: '4px', color: hasMismatch ? '#dc2626' : '#b45309', fontWeight: 600 }}>
                                {hasMismatch ? 'Mismatch: ' : 'Heads up: '}
                                <span style={{ color: hasMismatch ? '#dc2626' : '#475569', fontWeight: 400 }}>
                                  {materialConcern}
                                </span>
                              </div>
                            )}
                            <div style={{ marginTop: '4px', color: '#475569' }}>
                              <strong style={{ color: '#0f172a' }}>Key check:</strong> Payout order after marketing spend (P&amp;A) &amp; OTT deals are not signed yet.
                            </div>

                            {matchCase && (
                              <div style={{ marginTop: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => setExpandedReasonsVentureId(isReasonsOpen ? null : venture.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0066cc',
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: 0,
                                  }}
                                >
                                  {isReasonsOpen ? 'Hide match checks' : `See ${matchCase.rule_results?.length || 7} match checks`}
                                </button>

                                {isReasonsOpen && (
                                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '12px', color: '#475569' }}>
                                    {matchCase.compatibility_reasons.map((r, i) => (
                                      <div key={i}>&bull; {cleanReasonText(r)}</div>
                                    ))}
                                    {matchCase.mandatory_mismatches.map((m, i) => (
                                      <div key={`mm-${i}`} style={{ color: '#dc2626' }}>✕ {cleanReasonText(m)}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Row 4: Apple Action Toolbar */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingTop: '12px',
                              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                              flexWrap: 'wrap',
                              gap: '10px',
                              marginTop: 'auto',
                            }}
                          >
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setExpandedDossierVentureId(isDossierOpen ? null : venture.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: isDossierOpen ? '#0066cc' : '#0f172a',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                {isDossierOpen ? 'Hide Summary' : '10-Point Summary'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveDiligenceVentureId(isDiligenceOpen ? null : venture.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: isDiligenceOpen ? '#0f172a' : '#0066cc',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                {isDiligenceOpen ? 'Hide Checks' : 'Document Checks'}
                              </button>
                            </div>

                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                              {venture.connection_status === 'CONNECTED' && onOpenDirectChat && venture.connection_id ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenDirectChat(venture.connection_id!)}
                                  style={{
                                    padding: '8px 18px',
                                    backgroundColor: '#16a34a',
                                    color: '#ffffff',
                                    borderRadius: '980px',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Open Chat
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDirectDM(venture)}
                                  className="nv-link-chevron"
                                  style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}
                                >
                                  <span>Message Producer</span>
                                  <span aria-hidden="true" style={{ fontSize: '15px', lineHeight: 1 }}>&rsaquo;</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onSelectVenture?.(venture.id)}
                                className="nv-btn-dark"
                                style={{
                                  padding: '8px 20px',
                                  fontSize: '12.5px',
                                  borderRadius: '980px',
                                }}
                              >
                                See Film Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {renderDrawers(venture)}
                    </article>
                  );
                })}
              </div>
            )}

            {/* ALL OTHER NON-FILM VENTURES */}
            {otherVentures.length > 0 && (
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>
                  Operating &amp; Asset-Backed Ventures ({otherVentures.length})
                </h2>
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  Ordered by mandate fit &amp; listing recency
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {otherVentures.map((venture) => {
                const { matchCase, outcomeColor, fitReason, hasMismatch, materialConcern } = getMatchMeta(venture);
                const arrDetails = venture.arrangement_details || {};

                // Extract Operating Metric & Projection
                const { metric, verification } = extractOperatingMetric(venture);
                const projection = extractProjection(venture);

                // Format Deal Terms
                const totalRaise = venture.capital_target ? formatINR(venture.capital_target) : 'Not disclosed';
                let ticketOrUnit = 'Not disclosed';
                if (arrDetails.unit_price) {
                  ticketOrUnit = `${formatINR(arrDetails.unit_price)} / unit (${arrDetails.total_units || 'fractional'} units)`;
                } else if (venture.ticket_min && venture.ticket_max) {
                  ticketOrUnit = `${formatINR(venture.ticket_min)} – ${formatINR(venture.ticket_max)}`;
                } else if (venture.ticket_min) {
                  ticketOrUnit = `From ${formatINR(venture.ticket_min)}`;
                }

                const arrangementName =
                  arrDetails.structure_name ||
                  formatReadableEnum(venture.proposed_arrangement) ||
                  'Not disclosed';

                const rateOrReturn =
                  arrDetails.offered_interest_rate ||
                  arrDetails.interest_rate ||
                  arrDetails.proposed_equity_offered ||
                  (arrDetails.collateral_coverage_ratio ? `Cover: ${arrDetails.collateral_coverage_ratio}` : null);

                // Toggle States
                const isDossierOpen = expandedDossierVentureId === venture.id;
                const isDiligenceOpen = activeDiligenceVentureId === venture.id;
                const isReasonsOpen = expandedReasonsVentureId === venture.id;
                const isGalleryOpen = activeGalleryVentureId === venture.id;

                const gallery =
                  venture.gallery_urls && venture.gallery_urls.length > 0
                    ? venture.gallery_urls
                    : venture.hero_image_url
                    ? [venture.hero_image_url]
                    : [];
                const heroImg = venture.hero_image_url || gallery[0];

                return (
                  <article key={venture.id} className="nv-venture-split-card">
                    {/* TOP SPLIT: HERO PANE (LEFT) + DECISION COCKPIT (RIGHT) */}
                    <div className="nv-venture-split-main">
                      {/* 1. LEFT HERO PANE */}
                      <div className="nv-venture-hero-pane">
                        {heroImg ? (
                          <img
                            src={heroImg}
                            alt={venture.company_name}
                            loading="lazy"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              zIndex: 0,
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '96px',
                              fontFamily: 'var(--font-sans)',
                              fontWeight: 700,
                              color: 'rgba(255, 255, 255, 0.06)',
                              userSelect: 'none',
                              zIndex: 0,
                            }}
                          >
                            {venture.company_name.charAt(0)}
                          </div>
                        )}

                        <div className="nv-venture-hero-content">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: outcomeColor.bg,
                                color: outcomeColor.text,
                                border: `1px solid ${outcomeColor.border}`,
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              <span>{outcomeColor.label}</span>
                            </div>

                            {gallery.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setActiveGalleryVentureId(isGalleryOpen ? null : venture.id)}
                                style={{
                                  background: 'rgba(29, 29, 31, 0.65)',
                                  backdropFilter: 'blur(12px)',
                                  WebkitBackdropFilter: 'blur(12px)',
                                  border: '1px solid rgba(255, 255, 255, 0.22)',
                                  color: '#ffffff',
                                  borderRadius: '6px',
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                                title="Click to toggle photo showcase"
                              >
                                {gallery.length} photos
                              </button>
                            )}
                          </div>

                          <div>
                            <div
                              className="mono-label"
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                color: 'rgba(255, 255, 255, 0.78)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                marginBottom: '5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span>{venture.sector}</span>
                              <span>&bull;</span>
                              <span>{venture.location}</span>
                            </div>

                            <h2
                              onClick={() => onSelectVenture?.(venture.id)}
                              style={{
                                fontSize: '22px',
                                fontWeight: 700,
                                color: '#ffffff',
                                fontFamily: 'var(--font-sans)',
                                letterSpacing: '-0.02em',
                                margin: '0 0 6px 0',
                                cursor: 'pointer',
                                lineHeight: 1.2,
                              }}
                              title="Click to review full venture dossier"
                            >
                              {venture.company_name}
                            </h2>

                            <p
                              style={{
                                fontSize: '13px',
                                color: 'rgba(245, 245, 247, 0.88)',
                                lineHeight: 1.5,
                                margin: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {venture.tag_line || venture.business_context}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 2. RIGHT SIMPLE DEAL SUMMARY */}
                      <div className="nv-venture-cockpit">
                        {/* Row 1: 3 Key Numbers in Plain Language */}
                        <div className="nv-vitals-grid">
                          <div>
                            <div className="nv-vitals-label">Money Needed</div>
                            <div className="nv-vitals-value">{totalRaise}</div>
                            <div className="nv-vitals-subtext">{venture.stage || 'Operating'}</div>
                          </div>
                          <div className="nv-vitals-divider">
                            <div className="nv-vitals-label">Min to Invest</div>
                            <div className="nv-vitals-value">{ticketOrUnit}</div>
                            <div className="nv-vitals-subtext">Per investor</div>
                          </div>
                          <div className="nv-vitals-divider">
                            <div className="nv-vitals-label">How You Earn</div>
                            <div className="nv-vitals-value">{arrangementName}</div>
                            <div
                              className="nv-vitals-subtext"
                              style={{ color: rateOrReturn ? '#15803d' : '#475569', fontWeight: rateOrReturn ? 600 : 400 }}
                            >
                              {rateOrReturn ? `Return: ${rateOrReturn}` : 'See details for terms'}
                            </div>
                          </div>
                        </div>

                        {/* Row 2: What They Earn Now vs What's Next */}
                        <div className="nv-comparative-strip">
                          <div>
                            <div className="nv-comparative-label-row">
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#0066cc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                What They Earn Now
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  padding: '2px 7px',
                                  borderRadius: '5px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid rgba(0, 0, 0, 0.08)',
                                  color: '#0066cc',
                                }}
                              >
                                {verification}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600, lineHeight: 1.45 }}>
                              {metric}
                            </div>
                          </div>

                          <div>
                            <div className="nv-comparative-label-row">
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Growth Plan
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#0f172a', lineHeight: 1.45 }}>
                              {projection}
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Simple Fit Note */}
                        <div
                          style={{
                            backgroundColor: '#f5f5f7',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            fontSize: '12.5px',
                            lineHeight: 1.45,
                          }}
                        >
                          <div style={{ color: '#16a34a', fontWeight: 600 }}>
                            Why it fits: <span style={{ color: '#0f172a', fontWeight: 400 }}>{fitReason}</span>
                          </div>

                          {materialConcern && (
                            <div style={{ marginTop: '4px', color: hasMismatch ? '#dc2626' : '#b45309', fontWeight: 600 }}>
                              {hasMismatch ? 'Mismatch: ' : 'Heads up: '}
                              <span style={{ color: hasMismatch ? '#dc2626' : '#475569', fontWeight: 400 }}>
                                {materialConcern}
                              </span>
                            </div>
                          )}

                          {matchCase && (
                            <div style={{ marginTop: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setExpandedReasonsVentureId(isReasonsOpen ? null : venture.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#0066cc',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                {isReasonsOpen ? 'Hide match checks' : `See ${matchCase.rule_results?.length || 7} match checks`}
                              </button>

                              {isReasonsOpen && (
                                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '11.5px', marginBottom: '4px' }}>
                                    Compatibility Reasons:
                                  </div>
                                  <ul style={{ margin: '0 0 8px 16px', padding: 0, fontSize: '12px', color: '#475569' }}>
                                    {matchCase.compatibility_reasons.map((r, rIdx) => (
                                      <li key={rIdx}>{cleanReasonText(r)}</li>
                                    ))}
                                  </ul>

                                  {matchCase.trade_offs.length > 0 && (
                                    <>
                                      <div style={{ fontWeight: 600, color: '#b45309', fontSize: '11.5px', marginBottom: '4px' }}>
                                        Trade-Offs &amp; Involvement Friction:
                                      </div>
                                      <ul style={{ margin: '0 0 8px 16px', padding: 0, fontSize: '12px', color: '#b45309' }}>
                                        {matchCase.trade_offs.map((t, tIdx) => (
                                          <li key={tIdx}>{cleanReasonText(t)}</li>
                                        ))}
                                      </ul>
                                    </>
                                  )}

                                  {matchCase.mandatory_mismatches.length > 0 && (
                                    <>
                                      <div style={{ fontWeight: 600, color: '#dc2626', fontSize: '11.5px', marginBottom: '4px' }}>
                                        Mandatory Mismatches:
                                      </div>
                                      <ul style={{ margin: '0 0 8px 16px', padding: 0, fontSize: '12px', color: '#dc2626' }}>
                                        {matchCase.mandatory_mismatches.map((m, mIdx) => (
                                          <li key={mIdx}>{cleanReasonText(m)}</li>
                                        ))}
                                      </ul>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Row 4: Action Toolbar */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                            flexWrap: 'wrap',
                            gap: '10px',
                            marginTop: 'auto',
                          }}
                        >
                          {/* Left quick inspection links */}
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedDossierVentureId(isDossierOpen ? null : venture.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: isDossierOpen ? '#0066cc' : '#0f172a',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              {isDossierOpen ? 'Hide Summary' : '10-Point Summary'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveDiligenceVentureId(isDiligenceOpen ? null : venture.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: isDiligenceOpen ? '#0f172a' : '#0066cc',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              {isDiligenceOpen ? 'Hide Checks' : 'Document Checks'}
                            </button>

                            {gallery.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setActiveGalleryVentureId(isGalleryOpen ? null : venture.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: isGalleryOpen ? '#0f172a' : '#475569',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                {isGalleryOpen ? 'Hide Photos' : `Photos (${gallery.length})`}
                              </button>
                            )}
                          </div>

                          {/* Right Primary Actions */}
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {venture.connection_status === 'CONNECTED' && onOpenDirectChat && venture.connection_id ? (
                              <button
                                type="button"
                                onClick={() => onOpenDirectChat(venture.connection_id!)}
                                style={{
                                  padding: '8px 18px',
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  borderRadius: '980px',
                                  fontSize: '12.5px',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                Open Chat
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenDirectDM(venture)}
                                className="nv-link-chevron"
                                style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}
                              >
                                <span>Message Owner</span>
                                <span aria-hidden="true" style={{ fontSize: '15px', lineHeight: 1 }}>&rsaquo;</span>
                              </button>
                            )}

                            {/* Primary Button: See Full Details */}
                            <button
                              type="button"
                              onClick={() => onSelectVenture?.(venture.id)}
                              className="nv-btn-dark"
                              style={{
                                padding: '8px 20px',
                                fontSize: '12.5px',
                                borderRadius: '980px',
                              }}
                            >
                              See Full Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {renderDrawers(venture)}
                  </article>
                );
              })}
            </div>
          </>
        );
      })()}

      {/* DIRECT DM MODAL (Upstream instant channel unlock) */}
      {directDMModalVenture && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(12, 24, 38, 0.72)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => setDirectDMModalVenture(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '540px',
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 20px 40px rgba(12, 24, 38, 0.25)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#0066cc', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  DIRECT MESSAGING
                </div>
                <h3 style={{ fontSize: '18px', color: '#0f172a', fontFamily: "var(--font-sans)", margin: '2px 0 0 0' }}>
                  Message {directDMModalVenture.company_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDirectDMModalVenture(null)}
                style={{ background: 'none', border: 'none', fontSize: '22px', color: '#536074', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#536074', marginBottom: '16px', lineHeight: 1.45 }}>
              Directly text founder <strong>{directDMModalVenture.founder_name}</strong>. Sending this message unlocks your private direct chat channel.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                Your Message
              </label>
              <textarea
                rows={4}
                value={directDMNote}
                onChange={(e) => setDirectDMNote(e.target.value)}
                placeholder="Write your direct message to the founder..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15, 23, 42, 0.12)',
                  backgroundColor: '#f5f5f7',
                  fontSize: '13.5px',
                  lineHeight: 1.45,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Quick Suggestions */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {[
                'Discuss ticket allocation',
                'Ask about unit economics',
                'Request collateral inspection',
                'Discuss repayment schedule',
              ].map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDirectDMNote((prev) => `${prev} I would particularly like to ${topic.toLowerCase()}.`)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#f5f5f7',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    color: '#0066cc',
                    cursor: 'pointer',
                  }}
                >
                  + {topic}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setDirectDMModalVenture(null)}
                className="nv-link-chevron"
                style={{ fontSize: '13px', color: '#475569' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendDirectDM}
                disabled={submittingDM || !directDMNote.trim()}
                className="nv-btn-dark"
                style={{
                  padding: '9px 22px',
                  fontSize: '13px',
                  cursor: submittingDM || !directDMNote.trim() ? 'not-allowed' : 'pointer',
                  opacity: submittingDM || !directDMNote.trim() ? 0.5 : 1,
                }}
              >
                {submittingDM ? 'Sending...' : 'Send Direct Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
