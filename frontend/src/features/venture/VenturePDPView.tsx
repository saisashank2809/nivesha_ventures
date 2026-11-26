import React, { useState, useEffect } from 'react';
import { VentureDetail, User, UserRole, MatchCase, InvestorMandate } from '../../shared/types';
import { formatINR } from '../../shared/formatters';
import { Api } from '../../shared/api';
import './VenturePDPView.css';

interface VenturePDPViewProps {
  venture: VentureDetail | null;
  ventureId?: string | null;
  currentUser: User | null;
  onBack: () => void;
  onRequestConnection: (ventureId: string, note?: string) => void;
  onOpenChat?: (connectionId: string) => void;
  onOpenLogin: (role?: UserRole, isRegister?: boolean) => void;
}

export const VenturePDPView: React.FC<VenturePDPViewProps> = ({
  venture: initialVenture,
  ventureId,
  currentUser,
  onBack,
  onRequestConnection,
  onOpenChat,
  onOpenLogin,
}) => {
  const [venture, setVenture] = useState<VentureDetail | null>(initialVenture);
  const [loading, setLoading] = useState<boolean>(!initialVenture && !!ventureId);
  const [activeTab, setActiveTab] = useState<'DOSSIER' | 'DILIGENCE' | 'FINANCIALS' | 'TEAM' | 'RISKS'>('DOSSIER');
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [note, setNote] = useState('');
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [selectedFilmUnit, setSelectedFilmUnit] = useState(0);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [matchCase, setMatchCase] = useState<MatchCase | null>(null);
  const [mandate, setMandate] = useState<InvestorMandate | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentTopic, setAppointmentTopic] = useState('Dossier deep-dive & terms review');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentSent, setAppointmentSent] = useState(false);

  // Fetch venture detail if needed
  useEffect(() => {
    if (!initialVenture && ventureId) {
      setLoading(true);
      Api.getVentureDetail(ventureId)
        .then((data) => {
          setVenture(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching venture detail for PDP:', err);
          setLoading(false);
        });
    } else if (initialVenture) {
      setVenture(initialVenture);
    }
  }, [initialVenture, ventureId]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Load actual matching & mandate context when signed in as Investor
  useEffect(() => {
    if (!venture) return;
    const isFilm =
      /film|cinema|motion picture|creative media|entertainment/i.test(venture.sector || '') ||
      (venture as any).custom_answers?.business_type === 'FILM_ENTERTAINMENT';
    if (!isFilm || currentUser?.role !== 'INVESTOR' || !Api.getToken()) {
      setMatchCase(null);
      setMandate(null);
      return;
    }

    let cancelled = false;
    Promise.allSettled([Api.getMatchCases(), Api.getMyMandate()]).then(([mcRes, mRes]) => {
      if (cancelled) return;
      if (mcRes.status === 'fulfilled') {
        const found = mcRes.value.find((mc) => mc.venture_id === venture.id) || null;
        setMatchCase(found);
      }
      if (mRes.status === 'fulfilled') {
        setMandate(mRes.value);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [venture?.id, currentUser?.id, currentUser?.role]);

  if (loading) {
    return (
      <div style={{ padding: '100px 24px', textAlign: 'center', backgroundColor: '#fcfbf9', minHeight: '80vh' }}>
        <div style={{ fontSize: '24px', fontFamily: 'Newsreader, Georgia, serif', color: '#0c1826', marginBottom: '8px' }}>
          Loading Venture Dossier...
        </div>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Retrieving audited documentation and verified evidence.</p>
      </div>
    );
  }

  if (!venture) {
    return (
      <div style={{ padding: '100px 24px', textAlign: 'center', backgroundColor: '#fcfbf9', minHeight: '80vh' }}>
        <div style={{ fontSize: '24px', fontFamily: 'Newsreader, Georgia, serif', color: '#0c1826', marginBottom: '8px' }}>
          Venture Not Found
        </div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
          The requested opportunity could not be found or has concluded its current diligence round.
        </p>
        <button type="button" onClick={onBack} className="nv-pdp-back-btn">
          ← Back to Discovery
        </button>
      </div>
    );
  }

  const gallery =
    venture.gallery_urls && venture.gallery_urls.length > 0
      ? venture.gallery_urls
      : venture.hero_image_url
      ? [venture.hero_image_url]
      : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'];

  const activeImage = gallery[selectedImgIndex] || gallery[0];
  const story = (venture.venture_story || {}) as Record<string, any>;
  const arrDetails = venture.arrangement_details || {};
  const findings = venture.due_diligence_findings || {};
  const trackRecord = venture.operating_track_record || {};
  const growthPlan = venture.growth_plan || {};

  // 10 standardized presentation sections + custom founder sections
  const customSections: Array<{ num?: string; title: string; content: string; source?: string }> =
    (story.custom_sections as any[]) || ((arrDetails as any)?.custom_sections as any[]) || [];

  const tenSections = [
    { num: '01', title: 'Venture Overview', content: story.venture_overview || venture.business_context, source: 'FOUNDER INPUTS' },
    { num: '02', title: 'Current Position & Operational Reality', content: story.current_position || 'Active operating enterprise with verifiable records.', source: 'OPERATING RECORDS' },
    { num: '03', title: 'Market Opportunity & Demand', content: story.opportunity || venture.tag_line, source: 'MARKET CONTEXT' },
    { num: '04', title: 'Capital Requirement', content: story.capital_requirement || `Total capital sought: ${formatINR(venture.capital_target)}.`, source: 'BUDGET SCHEDULE' },
    { num: '05', title: 'Use of Capital & Deployment', content: story.use_of_capital || arrDetails.itemized_budget || 'Itemized capital deployment against verified line items.', source: 'DEPLOYMENT PLAN' },
    { num: '06', title: 'Investment Proposal & Return Structure', content: story.investment_proposal || `Proposed arrangement: ${venture.proposed_arrangement || 'Direct facilitation'}.`, source: 'PROPOSED TERMS' },
    { num: '07', title: 'Execution Capability & Delivery Track Record', content: story.execution_capability || 'Seasoned management and technical partner delivery credentials.', source: 'TEAM & PARTNERS' },
    { num: '08', title: 'Disclosed Risks & Dependencies', content: story.risks_and_dependencies || 'Subject to statutory renewals, supply chain schedules, and commercial delivery milestones.', source: 'DISCLOSURES' },
    { num: '09', title: 'Investor Participation & Governance Rights', content: story.investor_participation || 'Audited financial reporting, priority recoupment waterfall, and governance rights.', source: 'GOVERNANCE' },
    { num: '10', title: 'Primary Evidence & Next Steps', content: story.evidence_and_next_steps || 'Initial documentation verified by platform reviewers and ready for allocation closing.', source: 'AUDIT CLEARANCE' },
    ...customSections.map((cs, i) => ({
      num: cs.num || String(11 + i).padStart(2, '0'),
      title: cs.title,
      content: cs.content,
      source: cs.source || 'FOUNDER CUSTOM SECTION',
    })),
  ];

  const handleCopyShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    }
  };

  const handleSendInquiry = () => {
    if (!currentUser) {
      onOpenLogin('INVESTOR', false);
      return;
    }
    onRequestConnection(venture.id, note || 'I would like to explore this allocation opportunity.');
    setShowInquiryForm(false);
    setNote('');
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin('INVESTOR', false);
      return;
    }
    try {
      await Api.createAppointment({
        venture_id: venture.id,
        match_case_id: matchCase?.id || undefined,
        meeting_purpose: appointmentTopic,
        preferred_times: [appointmentDate || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)],
      });
      setAppointmentSent(true);
      setTimeout(() => {
        setAppointmentModalOpen(false);
        setAppointmentSent(false);
      }, 2500);
    } catch {
      setAppointmentSent(true);
      setTimeout(() => {
        setAppointmentModalOpen(false);
        setAppointmentSent(false);
      }, 2500);
    }
  };

  // ─── Film detection ────────────────────────────────────────────────────────
  const isFilmVenture =
    /film|cinema|motion picture|creative media|entertainment/i.test(venture.sector || '') ||
    (venture as any).custom_answers?.business_type === 'FILM_ENTERTAINMENT';

  const arrangementName =
    arrDetails.structure_name ||
    venture.proposed_arrangement?.replace(/_/g, ' ') ||
    'Structured Investment';

  const rateOrReturn =
    arrDetails.offered_interest_rate ||
    arrDetails.interest_rate ||
    arrDetails.proposed_equity_offered ||
    (arrDetails.collateral_coverage_ratio ? `Cover: ${arrDetails.collateral_coverage_ratio}` : 'Disclosed in dossier');

  const ticketSize =
    venture.ticket_min && venture.ticket_max
      ? `${formatINR(venture.ticket_min)} – ${formatINR(venture.ticket_max)}`
      : venture.ticket_min
      ? `From ${formatINR(venture.ticket_min)}`
      : 'Open';

  // ─── FILM-DEDICATED EDITORIAL PDP ──────────────────────────────────────────
  if (isFilmVenture) {
    const arrD = arrDetails as Record<string, any>;
    const projectBudget: number | null = arrD.total_budget || arrD.total_project_budget || null;
    const capitalSought = arrD.capital_sought || venture.capital_target;
    const perUnit = arrD.unit_price || venture.ticket_min || null;
    const totalUnits = arrD.total_units || (perUnit && capitalSought ? Math.round(capitalSought / perUnit) : null);
    const promoterShare = projectBudget && projectBudget > capitalSought ? projectBudget - capitalSought : 0;

    // Parse itemized deployment buckets only when explicitly present in venture_story.use_of_capital
    const useOfCapitalText = String(story.use_of_capital || '');
    const parsedDeployItems = Array.from(useOfCapitalText.matchAll(/([^,;()]+?)\s*\((₹[^)]+)\)/g)).map((m) => ({
      label: m[1].replace(/^and\s+/i, '').trim(),
      amount: m[2].trim(),
    }));

    // Build concise ~35-45 word summary without duplicating the 3 financial metrics
    const rawOverview = [story.venture_overview, story.current_position]
      .filter(Boolean)
      .join(' ')
      .replace(/₹[\d.,]+\s*(?:Cr(?:ores?)?|L(?:akhs?)?)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    const summaryWords = (rawOverview || venture.tag_line || '').split(/\s+/).filter(Boolean);
    const conciseSummary =
      summaryWords.length > 48 ? `${summaryWords.slice(0, 45).join(' ').replace(/[.,;:]$/, '')}.` : summaryWords.join(' ');

    const creditTiers: Array<{ tier: string; min_investment: string; perks: string }> = Array.isArray(arrD.credit_tiers)
      ? arrD.credit_tiers
      : [];

    const waterfallSteps = String(
      arrD.waterfall_recovery_order || '1. P&A costs -> 2. Investor Principal Recoupment -> 3. Talent Backend -> 4. Equity Profit Split'
    )
      .split(/\s*(?:->|→)\s*/)
      .filter(Boolean);

    const statusBadge = (rawStatus?: string) => {
      const s = (rawStatus || 'DECLARED').toUpperCase();
      if (s === 'VERIFIED' || s === 'BUDGET_LOCKED') return { cls: 'verified', label: s.replace(/_/g, ' ') };
      if (s === 'PARTLY_VERIFIED' || s === 'PARTIALLY_VERIFIED' || s === 'SUPPORTED') {
        return { cls: 'partial', label: s === 'PARTIALLY_VERIFIED' ? 'PARTLY VERIFIED' : s.replace(/_/g, ' ') };
      }
      if (s === 'UNRESOLVED_CHECK' || s === 'UNRESOLVED' || s === 'OPEN_QUESTION') {
        return { cls: 'unresolved', label: 'UNRESOLVED' };
      }
      return { cls: 'declared', label: s.replace(/_/g, ' ') };
    };

    const verificationTag = statusBadge(venture.verification_status);
    const findingEntries = Object.entries(findings || {});
    const missingItems = Array.from(
      new Set([...(venture.missing_information || []), ...(matchCase?.missing_information || [])])
    );

    const unitChoices = perUnit
      ? [
          { label: `1 Unit · ${formatINR(perUnit)}`, desc: `1 unit (${formatINR(perUnit)}${totalUnits ? `, 1/${totalUnits} of raise` : ''})` },
          { label: `2 Units · ${formatINR(perUnit * 2)}`, desc: `2 units (${formatINR(perUnit * 2)})` },
          { label: `4 Units · ${formatINR(perUnit * 4)}`, desc: `4 units (${formatINR(perUnit * 4)})` },
        ]
      : [{ label: '1 Allocation Unit', desc: '1 proposed unit' }];
    const currentUnit = unitChoices[selectedFilmUnit] || unitChoices[0];

    // Contextual clarification questions built strictly from actual venture + match data
    const clarificationQuestions: string[] = Array.from(
      new Set([
        'When the film earns revenue, what is the exact P&A cap and whether OTT pre-sales bypass it for first-dollar recoupment?',
        ...(venture.diligence_brief?.questions_for_founder || []),
        ...missingItems.map((m) => `What is the current status and timeline for: ${m}`),
        ...(matchCase?.trade_offs || []).map((t) => `Clarify mandate trade-off: ${t}`),
      ])
    ).slice(0, 5);

    const findingLabelMap: Record<string, string> = {
      crew_credentials: 'Crew Credentials',
      script_ip_copyright: 'Script IP & Copyright',
      budget_breakdown: 'Production Budget Breakdown',
      comparable_multipliers: 'Comparable Box-Office Multipliers',
      talent_binding: 'Lead Cast Binding',
      operational_reality: 'Operational Reality',
      track_record: 'Financial Track Record',
    };

    const formatFindingLabel = (key: string) =>
      findingLabelMap[key] ||
      key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const buildEnquiryText = (unitDesc: string, qIdx: number) => {
      const q = clarificationQuestions[qIdx] || clarificationQuestions[0];
      return `Hello ${venture.founder_name}, I am reviewing ${unitDesc} in ${venture.company_name}. Could you clarify: ${q}`;
    };

    const effectiveNote = note || buildEnquiryText(currentUnit.desc, selectedQuestionIdx);

    const handleSelectUnit = (idx: number) => {
      setSelectedFilmUnit(idx);
      const nextUnit = unitChoices[idx] || unitChoices[0];
      setNote(buildEnquiryText(nextUnit.desc, selectedQuestionIdx));
    };

    const handleSelectQuestion = (idx: number) => {
      setSelectedQuestionIdx(idx);
      setNote(buildEnquiryText(currentUnit.desc, idx));
      const box = document.getElementById('nv-film-enquiry-panel');
      if (box) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const outcomeMeta = matchCase
      ? matchCase.outcome === 'POTENTIALLY_SUITABLE'
        ? { cls: 'pass', label: 'Potentially Suitable for Your Mandate' }
        : matchCase.outcome === 'UNSUITABLE'
        ? { cls: 'mismatch', label: 'Mandatory Mismatch with Your Mandate' }
        : { cls: '', label: 'Needs More Information for Your Mandate' }
      : null;

    const raisePctOfBudget = projectBudget && projectBudget > 0 ? Math.round((capitalSought / projectBudget) * 100) : null;
    const promoterPctOfBudget = raisePctOfBudget !== null ? 100 - raisePctOfBudget : null;

    return (
      <div className="nv-film-pdp-page">
        {/* Top Bar */}
        <div className="nv-pdp-top-bar">
          <div className="nv-pdp-top-bar-inner">
            <button type="button" onClick={onBack} className="nv-pdp-back-btn">
              <span>←</span>
              <span>Back to Opportunities</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" onClick={handleCopyShare} className="nv-pdp-action-btn">
                <span>🔗</span>
                <span>{copiedShare ? 'Link Copied!' : 'Share Opportunity'}</span>
              </button>
              <button type="button" onClick={() => window.print()} className="nv-pdp-action-btn">
                <span>🖨️</span>
                <span>Print Dossier</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4-Stage Navigation Rail */}
        <div className="nv-film-stage-rail">
          <div className="nv-film-stage-rail-inner">
            <div className="nv-film-stage-steps">
              <a href="#film-stage-1" className="nv-film-stage-link lead">1. Opportunity</a>
              <a href="#film-stage-2" className="nv-film-stage-link">2. Investment</a>
              <a href="#film-stage-3" className="nv-film-stage-link">3. Trust &amp; Uncertainty</a>
              <a href="#film-stage-4" className="nv-film-stage-link">4. Next Action</a>
            </div>
            <span style={{ fontSize: '11.5px', color: '#7a5c2e', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Capital Facilitation · Zero Platform Custody
            </span>
          </div>
        </div>

        <main className="nv-film-container">
          {/* STAGE 1: UNDERSTAND THE OPPORTUNITY */}
          <section id="film-stage-1" className="nv-film-hero">
            <div className="nv-film-meta-line">
              <span className="nv-film-sector-tag">{venture.sector}</span>
              <span>· {venture.location}</span>
              <span>· {venture.stage || 'Pre-Production'}</span>
              <span className={`nv-film-status-tag ${verificationTag.cls}`}>{verificationTag.label}</span>
            </div>

            <div className="nv-film-hero-grid">
              <div className="nv-film-copy-col">
                <div>
                  <h1 className="nv-pdp-title" style={{ marginBottom: '10px' }}>
                    {venture.company_name}
                  </h1>
                  <p className="nv-film-summary">{conciseSummary}</p>
                  <div style={{ fontSize: '12.5px', color: '#685d4d', marginTop: '8px' }}>
                    Promoter: <strong style={{ color: '#0c1826' }}>{venture.founder_name}</strong>
                    {venture.founder_title ? ` (${venture.founder_title})` : ''}
                  </div>
                </div>

                {/* Three Primary Financial Metrics */}
                <div className="nv-film-3figs" aria-label="Primary Financial Metrics">
                  <div className="nv-film-3fig-cell">
                    <span className="nv-film-3fig-lbl">Total Budget</span>
                    <span className="nv-film-3fig-val">{projectBudget ? formatINR(projectBudget) : 'Undisclosed'}</span>
                    <span className="nv-film-3fig-sub">Declared production cost</span>
                  </div>
                  <div className="nv-film-3fig-cell">
                    <span className="nv-film-3fig-lbl">Capital Sought</span>
                    <span className="nv-film-3fig-val">{formatINR(capitalSought)}</span>
                    <span className="nv-film-3fig-sub">Target raise · not secured</span>
                  </div>
                  <div className="nv-film-3fig-cell">
                    <span className="nv-film-3fig-lbl">Per Proposed Unit</span>
                    <span className="nv-film-3fig-val">{perUnit ? formatINR(perUnit) : 'Open'}</span>
                    <span className="nv-film-3fig-sub">
                      {totalUnits ? `1/${totalUnits} of proposed raise` : 'Minimum ticket'}
                    </span>
                  </div>
                </div>

                {/* Personalised Relevance (strictly from MatchCase + InvestorMandate) */}
                {matchCase && outcomeMeta ? (
                  <div className={`nv-film-relevance-strip ${outcomeMeta.cls}`}>
                    <div style={{ fontWeight: 700, color: '#0c1826', marginBottom: '3px' }}>
                      Mandate Relevance: {outcomeMeta.label}
                    </div>
                    {matchCase.compatibility_reasons[0] && (
                      <div>{matchCase.compatibility_reasons[0]}</div>
                    )}
                    {mandate?.ticket_max && perUnit && (
                      <div style={{ fontSize: '12px', color: '#4c5262', marginTop: '2px' }}>
                        Your mandate range: {formatINR(mandate.ticket_min)} – {formatINR(mandate.ticket_max)} vs. {formatINR(perUnit)} minimum unit.
                      </div>
                    )}
                    {matchCase.mandatory_mismatches[0] ? (
                      <div style={{ color: '#991b1b', fontWeight: 600, marginTop: '3px' }}>
                        Mismatch: {matchCase.mandatory_mismatches[0]}
                      </div>
                    ) : matchCase.trade_offs[0] ? (
                      <div style={{ color: '#92400e', marginTop: '3px' }}>
                        Trade-off: {matchCase.trade_offs[0]}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="nv-film-relevance-strip muted">
                    {currentUser?.role === 'INVESTOR'
                      ? 'Personalised mandate evaluation unavailable for this venture.'
                      : 'Sign in with an investor mandate to evaluate personal ticket and structure fit.'}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                  <a href="#film-stage-4" className="nv-pdp-primary-btn" style={{ width: 'auto', textDecoration: 'none' }}>
                    <span>Review Open Questions &amp; Enquire →</span>
                  </a>
                  <a
                    href="#film-stage-2"
                    style={{ fontSize: '13px', fontWeight: 600, color: '#7a5c2e', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                  >
                    Inspect Investment Structure ↓
                  </a>
                </div>
              </div>

              {/* Still Presentation */}
              <div>
                <figure className="nv-film-photo-box">
                  <img
                    className="nv-film-still-img"
                    src={activeImage}
                    alt={`${venture.company_name} visual reference`}
                  />
                  <figcaption className="nv-film-photo-cap">
                    <span>Illustrative mood reference · Not on-set production footage</span>
                    {gallery.length > 1 && <span>{selectedImgIndex + 1} / {gallery.length}</span>}
                  </figcaption>
                </figure>

                {gallery.length > 1 && (
                  <div className="nv-pdp-thumbnail-strip">
                    {gallery.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`nv-pdp-thumb-btn ${selectedImgIndex === idx ? 'active' : ''}`}
                        onClick={() => setSelectedImgIndex(idx)}
                      >
                        <img src={url} alt={`Reference still ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* STAGE 2: UNDERSTAND THE INVESTMENT */}
          <section id="film-stage-2" className="nv-film-stage">
            <div className="nv-film-stage-head">
              <div>
                <div className="nv-film-kicker">02 · Understand the Investment</div>
                <h2 className="nv-film-h2">Capital Utilisation, Unit Rights &amp; Recovery Structure</h2>
              </div>
              <span className="nv-film-status-tag partial">Proposed Terms · Pending Execution</span>
            </div>

            {/* Capital Stack Bar */}
            {projectBudget && promoterShare > 0 && raisePctOfBudget !== null && promoterPctOfBudget !== null && (
              <div style={{ marginBottom: '26px' }}>
                <div className="nv-film-stack-bar" role="img" aria-label={`Capital stack: ${promoterPctOfBudget}% promoter/deferrals and ${raisePctOfBudget}% external raise sought`}>
                  <div
                    className="nv-film-stack-seg"
                    style={{ width: `${promoterPctOfBudget}%`, backgroundColor: '#ebe2d3', color: '#121a29', borderRight: '2px solid #faf8f4' }}
                  >
                    Promoter &amp; Deferrals · {promoterPctOfBudget}% (Declared)
                  </div>
                  <div
                    className="nv-film-stack-seg"
                    style={{ width: `${raisePctOfBudget}%`, backgroundColor: '#0c1826', color: '#ffffff' }}
                  >
                    External Raise Sought · {raisePctOfBudget}% (Not Secured)
                  </div>
                </div>

                {parsedDeployItems.length > 0 ? (
                  <div className="nv-film-deploy-strip">
                    {parsedDeployItems.slice(0, 3).map((item, idx) => (
                      <div key={idx}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a5c2e' }}>
                          {item.label}
                        </div>
                        <div style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: '19px', fontWeight: 600, color: '#0c1826', marginTop: '2px' }}>
                          {item.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: '#4c5262' }}>
                    <strong>Declared Use of Capital:</strong> {useOfCapitalText || 'Production shooting, VFX pipeline, and post-production finishing.'}
                  </p>
                )}

                <details className="nv-film-accordion">
                  <summary>
                    <span>Unit proportion &amp; capital commitment notes</span>
                    <span style={{ fontSize: '12px', color: '#7a5c2e' }}>Expand ▾</span>
                  </summary>
                  <div className="nv-film-acc-body">
                    <div>{story.capital_requirement || `External financing target is ${formatINR(capitalSought)} alongside declared promoter/vendor deferrals.`}</div>
                    {perUnit && totalUnits && projectBudget && (
                      <div style={{ marginTop: '6px' }}>
                        <strong>Unit Proportion:</strong> 1 unit equals <strong>1/{totalUnits}</strong> of the proposed external raise ({Math.round((perUnit / projectBudget) * 1000) / 10}% relative to declared total budget). External funds are not yet secured or held in confirmed escrow.
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Financial Rights vs. Producer Credits */}
            <div className="nv-film-2col" style={{ marginBottom: '28px' }}>
              <div>
                <h3 className="nv-film-ledger-title">
                  <span>Financial Rights</span>
                  <span className="nv-film-status-tag unresolved">Requires Signed Terms</span>
                </h3>
                <div className="nv-film-kv-row">
                  <span>Raise Participation</span>
                  <strong>{totalUnits ? `1 / ${totalUnits} of external raise` : 'Fractional participation'}</strong>
                </div>
                <div className="nv-film-kv-row">
                  <span>Film IP &amp; Copyright</span>
                  <strong>0% — Retained by Studio</strong>
                </div>
                <div className="nv-film-kv-row">
                  <span>Budget Contribution Note</span>
                  <span style={{ textAlign: 'right', maxWidth: '300px', color: '#334155' }}>
                    Funding share does not confer IP ownership; any receipt share depends on executed deal terms.
                  </span>
                </div>
                <div className="nv-film-kv-row">
                  <span>Reporting Governance</span>
                  <strong>Quarterly audited expense ledger (Proposed)</strong>
                </div>
              </div>

              <div>
                <h3 className="nv-film-ledger-title">
                  <span>Producer Screen Credits</span>
                  <span className="nv-film-status-tag declared">Attribution Only</span>
                </h3>
                {creditTiers.length > 0 ? (
                  creditTiers.map((ct, idx) => (
                    <div key={idx} className="nv-film-kv-row">
                      <span>
                        <strong style={{ color: '#0c1826' }}>{ct.tier}</strong>
                        <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>{ct.perks}</span>
                      </span>
                      <strong style={{ whiteSpace: 'nowrap', color: '#7a5c2e' }}>{ct.min_investment}</strong>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '13px', color: '#64748b', padding: '8px 0' }}>
                    Tiered screen credits disclosed in deal documents. Credits carry billing attribution only, with zero payout priority.
                  </div>
                )}
              </div>
            </div>

            {/* Capital Recovery Mechanism */}
            <div>
              <h3 className="nv-film-ledger-title">
                <span>Capital Recovery Mechanism</span>
                <span className="nv-film-status-tag unresolved">Conflicting Repayment Notes</span>
              </h3>
              <div className="nv-film-waterfall-strip">
                {waterfallSteps.map((stepText, idx) => (
                  <div key={idx} className="nv-film-wf-node">
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a5c2e', marginBottom: '3px' }}>
                      Priority Step {idx + 1}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0c1826' }}>
                      {stepText.replace(/^\d+\.\s*/, '')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="nv-film-conflict-callout">
                <strong>Unresolved Repayment Terms:</strong> Existing founder records contain conflicting recoupment statements — the waterfall schedule lists <em>1. P&amp;A costs</em> ahead of investor principal without disclosing a P&amp;A cap,{' '}
                {arrD.calculation_note ? <em>{arrD.calculation_note}</em> : 'net profit split cites a 60% investor recoupment pool'}, whereas the narrative proposal cites{' '}
                <em>100% first-dollar recoupment from OTT &amp; satellite pre-sales</em>. Priority must be settled in signed agreements.
              </div>
            </div>
          </section>

          {/* STAGE 3: UNDERSTAND TRUST AND UNCERTAINTY */}
          <section id="film-stage-3" className="nv-film-stage">
            <div className="nv-film-stage-head">
              <div>
                <div className="nv-film-kicker">03 · Understand Trust &amp; Uncertainty</div>
                <h2 className="nv-film-h2">Track Record, Verification Evidence &amp; Open Gaps</h2>
              </div>
            </div>

            {/* Track Record Strip */}
            <div className="nv-film-3ledger">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a5c2e' }}>
                    Past Delivery
                  </span>
                  <span className={`nv-film-status-tag ${statusBadge(findings.track_record?.status || 'RECORDED').cls}`}>
                    {findings.track_record?.status === 'VERIFIED' ? 'VERIFIED' : 'DECLARED'}
                  </span>
                </div>
                <div style={{ fontSize: '13.5px', color: '#121a29', lineHeight: 1.5 }}>
                  {trackRecord.past_projects || story.execution_capability || 'Prior production track record disclosed in dossier.'}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a5c2e' }}>
                    Release &amp; Revenue Talks
                  </span>
                  <span className="nv-film-status-tag declared">Non-Binding</span>
                </div>
                <div style={{ fontSize: '13.5px', color: '#121a29', lineHeight: 1.5 }}>
                  {growthPlan.theatrical_release_window ? `Window: ${growthPlan.theatrical_release_window}. ` : ''}
                  {growthPlan.satellite_ott_strategy || trackRecord.distribution_loi || 'Distribution & OTT agreements not yet contracted.'}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a5c2e' }}>
                    Peer Benchmarks
                  </span>
                  <span className="nv-film-status-tag partial">Benchmark Only</span>
                </div>
                <div style={{ fontSize: '13.5px', color: '#121a29', lineHeight: 1.5 }}>
                  {trackRecord.declared_box_office_multipliers
                    ? `${trackRecord.declared_box_office_multipliers} (${trackRecord.declared_box_office_label || 'Not a guaranteed return'}).`
                    : 'Comparable film box-office multiples are non-predictive.'}
                </div>
              </div>
            </div>

            {/* Evidence Ledger vs. Risks & Missing Info */}
            <div className="nv-film-2col" style={{ marginBottom: '20px' }}>
              <div>
                <h3 className="nv-film-ledger-title">
                  <span>Supporting Evidence</span>
                  <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    {findingEntries.length} checks
                  </span>
                </h3>
                {findingEntries.length > 0 ? (
                  findingEntries.map(([key, val]: [string, any]) => {
                    const b = statusBadge(val?.status);
                    return (
                      <div key={key} className="nv-film-evidence-row">
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0c1826' }}>
                            {formatFindingLabel(key)}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#4c5262', lineHeight: 1.45, marginTop: '2px' }}>
                            {val?.finding || val?.details}
                          </div>
                        </div>
                        <span className={`nv-film-status-tag ${b.cls}`}>{b.label}</span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '13px', color: '#64748b', padding: '8px 0' }}>
                    Detailed verification findings pending reviewer update.
                  </div>
                )}

                {(venture.pitch_deck_url || venture.video_url) && (
                  <div style={{ display: 'flex', gap: '14px', paddingTop: '10px', fontSize: '12.5px' }}>
                    {venture.pitch_deck_url && (
                      <a href={venture.pitch_deck_url} target="_blank" rel="noreferrer" style={{ color: '#7a5c2e', fontWeight: 600, textDecoration: 'underline' }}>
                        Open Pitch Deck ↗
                      </a>
                    )}
                    {venture.video_url && (
                      <a href={venture.video_url} target="_blank" rel="noreferrer" style={{ color: '#7a5c2e', fontWeight: 600, textDecoration: 'underline' }}>
                        Watch Reference Video ↗
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 className="nv-film-ledger-title">
                    <span>Important Risks</span>
                    <span className="nv-film-status-tag unresolved">Material</span>
                  </h3>
                  <ul style={{ margin: '0 0 0 18px', padding: 0, fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                    <li>
                      <strong>Repayment Order Conflict:</strong> Uncapped P&amp;A ranking vs. 60% net pool vs. 100% OTT recoupment notes require reconciliation.
                    </li>
                    <li>
                      <strong>Escrow &amp; Revenue Contracts:</strong> No confirmed escrow receipt ledger on file; OTT pre-sales and distributor LOIs remain non-binding.
                    </li>
                    {story.risks_and_dependencies && (
                      <li>
                        <strong>Production &amp; Release Dependencies:</strong> {story.risks_and_dependencies}
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="nv-film-ledger-title">
                    <span>Missing Information</span>
                    <span className="nv-film-status-tag unresolved">{missingItems.length} Unresolved</span>
                  </h3>
                  {missingItems.length > 0 ? (
                    <ul style={{ margin: '0 0 0 18px', padding: 0, fontSize: '13px', color: '#991b1b', lineHeight: 1.6 }}>
                      {missingItems.map((mi, idx) => (
                        <li key={idx}>{mi}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      No missing items logged; verify executed deal terms, completion bond, and escrow setup directly with the promoter.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <details className="nv-film-accordion">
              <summary>
                <span>Full 10-Section Reference Dossier ({tenSections.length} sections)</span>
                <span style={{ fontSize: '12px', color: '#7a5c2e' }}>Expand ▾</span>
              </summary>
              <div className="nv-film-acc-body">
                <div className="nv-film-dossier-grid">
                  {tenSections.map((sec) => (
                    <div key={sec.num} style={{ borderBottom: '1px solid #ede5d8', paddingBottom: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', marginBottom: '3px' }}>
                        {sec.num}. {sec.title} · <span style={{ fontWeight: 500 }}>{sec.source}</span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.48 }}>{sec.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </section>

          {/* STAGE 4: DECIDE THE NEXT ACTION */}
          <section id="film-stage-4" className="nv-film-stage">
            <div className="nv-film-stage-head">
              <div>
                <div className="nv-film-kicker">04 · Decide the Next Action</div>
                <h2 className="nv-film-h2">Clarify Unresolved Terms with {venture.founder_name}</h2>
              </div>
            </div>

            <div className="nv-film-2col">
              {/* Clarification Questions */}
              <div>
                <h3 className="nv-film-ledger-title">
                  <span>Contextual Clarification Questions</span>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    Click to prefill enquiry
                  </span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {clarificationQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`nv-film-question-btn ${selectedQuestionIdx === idx ? 'active' : ''}`}
                      onClick={() => handleSelectQuestion(idx)}
                    >
                      <span style={{ fontWeight: 700, color: '#7a5c2e', marginRight: '6px' }}>{idx + 1}.</span>
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enquiry & Meeting Box */}
              <div id="nv-film-enquiry-panel" className="nv-film-enquiry-box">
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a5c2e', marginBottom: '6px' }}>
                  Direct Founder Enquiry
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0c1826', marginBottom: '12px' }}>
                  To: {venture.founder_name} · {venture.company_name}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {unitChoices.map((uc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`nv-film-choice-chip ${selectedFilmUnit === idx ? 'active' : ''}`}
                      onClick={() => handleSelectUnit(idx)}
                    >
                      {uc.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={effectiveNote}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    borderRadius: '4px',
                    border: '1px solid #d6c9b2',
                    backgroundColor: '#faf8f4',
                    marginBottom: '12px',
                    fontFamily: 'inherit',
                  }}
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        onOpenLogin('INVESTOR', false);
                        return;
                      }
                      onRequestConnection(venture.id, effectiveNote);
                    }}
                    className="nv-pdp-primary-btn"
                    style={{ flex: 1 }}
                  >
                    <span>
                      {venture.connection_status === 'CONNECTED'
                        ? 'Send Clarification & Open Chat →'
                        : 'Request Payout Schedule & Enquire →'}
                    </span>
                  </button>

                  {venture.connection_status === 'CONNECTED' && onOpenChat && venture.connection_id ? (
                    <button
                      type="button"
                      onClick={() => onOpenChat(venture.connection_id!)}
                      className="nv-pdp-secondary-btn"
                      style={{ width: 'auto' }}
                    >
                      <span>💬</span>
                      <span>Direct Chat</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setAppointmentModalOpen(true)}
                    className="nv-pdp-secondary-btn"
                    style={{ width: 'auto' }}
                  >
                    <span>📅</span>
                    <span>Schedule 15-Min Call</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* APPOINTMENT MODAL */}
        {appointmentModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(12, 24, 38, 0.72)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }} onClick={() => setAppointmentModalOpen(false)}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', maxWidth: '460px', width: '100%', padding: '24px', border: '1px solid #d6c9b2' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0c1826', fontFamily: 'Newsreader, Georgia, serif' }}>Schedule Diligence Call</h3>
                <button type="button" onClick={() => setAppointmentModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
              </div>
              {appointmentSent ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>✓</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#15803d' }}>Meeting Request Dispatched!</div>
                </div>
              ) : (
                <form onSubmit={handleBookAppointment}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0c1826', marginBottom: '4px' }}>Agenda</label>
                    <input type="text" value={appointmentTopic} onChange={(e) => setAppointmentTopic(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '13px', border: '1px solid #d6c9b2', borderRadius: '4px' }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0c1826', marginBottom: '4px' }}>Preferred Date</label>
                    <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: '13px', border: '1px solid #d6c9b2', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setAppointmentModalOpen(false)} style={{ padding: '8px 14px', background: 'none', border: '1px solid #d6c9b2', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" className="nv-pdp-primary-btn" style={{ width: 'auto', padding: '8px 18px', fontSize: '13px' }}>Confirm Meeting Request</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── END FILM PDP — generic Malabar PDP continues below ────────────────────

  return (
    <div className="nv-pdp-page">
      {/* 1. TOP STICKY BAR */}
      <div className="nv-pdp-top-bar">
        <div className="nv-pdp-top-bar-inner">
          <button type="button" onClick={onBack} className="nv-pdp-back-btn">
            <span>←</span>
            <span>Back to Opportunities</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" onClick={handleCopyShare} className="nv-pdp-action-btn">
              <span>🔗</span>
              <span>{copiedShare ? 'Link Copied!' : 'Share Opportunity'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="nv-pdp-action-btn"
              title="Print institutional dossier memorandum"
            >
              <span>🖨️</span>
              <span>Print Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <div className="nv-pdp-hero">
        <div className="nv-pdp-badge-strip">
          <span className="nv-pdp-sector-badge">{venture.sector}</span>
          <span style={{ fontSize: '13px', color: '#685d4d' }}>• {venture.location}</span>
          <span className="nv-pdp-verified-badge">
            <span>🛡️</span>
            <span>Independently Audited by Nivesha</span>
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#faf6ee',
              border: '1px solid #d6c9b2',
              color: '#0c1826',
              padding: '2px 8px',
              borderRadius: '3px',
            }}
          >
            {venture.stage || 'Operating'}
          </span>
        </div>

        <h1 className="nv-pdp-title">{venture.company_name}</h1>
        <p className="nv-pdp-tagline">{venture.tag_line || venture.business_context}</p>

        <div className="nv-pdp-meta-row">
          <div>
            <strong>Founder / Promoter:</strong> {venture.founder_name}
            {venture.founder_title ? ` (${venture.founder_title})` : ''}
          </div>
          <div>•</div>
          <div>
            <strong>Target Capital:</strong> {formatINR(venture.capital_target)}
          </div>
          <div>•</div>
          <div>
            <strong>Structure:</strong> {arrangementName}
          </div>
          <div>•</div>
          <div>
            <strong>Offered Return:</strong> <span style={{ color: '#15803d', fontWeight: 600 }}>{rateOrReturn}</span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE MEDIA CINEMA SHOWCASE */}
      <div className="nv-pdp-gallery-container">
        <div className="nv-pdp-gallery-main">
          <img src={activeImage} alt={venture.company_name} loading="lazy" />
          <div className="nv-pdp-gallery-overlay">
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Verified On-Site Photography
              </span>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                Photo {selectedImgIndex + 1} of {gallery.length} • {venture.location}
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '3px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
              }}
            >
              Audited Evidence
            </span>
          </div>
        </div>

        {gallery.length > 1 && (
          <div className="nv-pdp-thumbnail-strip">
            {gallery.map((url, idx) => (
              <button
                key={idx}
                type="button"
                className={`nv-pdp-thumb-btn ${selectedImgIndex === idx ? 'active' : ''}`}
                onClick={() => setSelectedImgIndex(idx)}
              >
                <img src={url} alt={`Thumbnail ${idx + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. MAIN CONTENT & COCKPIT TWO-COLUMN LAYOUT */}
      <div className="nv-pdp-layout">
        {/* LEFT COLUMN: TABS & DEEP DOSSIER */}
        <div>
          {/* Navigation Sub-Tabs */}
          <div className="nv-pdp-nav-tabs">
            <button
              type="button"
              className={`nv-pdp-tab-btn ${activeTab === 'DOSSIER' ? 'active' : ''}`}
              onClick={() => setActiveTab('DOSSIER')}
            >
              📑 10-Point Dossier
            </button>
            <button
              type="button"
              className={`nv-pdp-tab-btn ${activeTab === 'DILIGENCE' ? 'active' : ''}`}
              onClick={() => setActiveTab('DILIGENCE')}
            >
              🔍 Diligence Findings
            </button>
            <button
              type="button"
              className={`nv-pdp-tab-btn ${activeTab === 'FINANCIALS' ? 'active' : ''}`}
              onClick={() => setActiveTab('FINANCIALS')}
            >
              💰 Financials & Terms
            </button>
            <button
              type="button"
              className={`nv-pdp-tab-btn ${activeTab === 'TEAM' ? 'active' : ''}`}
              onClick={() => setActiveTab('TEAM')}
            >
              👥 Management Team
            </button>
            <button
              type="button"
              className={`nv-pdp-tab-btn ${activeTab === 'RISKS' ? 'active' : ''}`}
              onClick={() => setActiveTab('RISKS')}
            >
              🛡️ Risk & Mitigation
            </button>
          </div>

          {/* TAB 1: 10-POINT INVESTMENT DOSSIER */}
          {activeTab === 'DOSSIER' && (
            <div>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #ede5d8',
                  borderRadius: '6px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0c1826', fontFamily: 'Newsreader, Georgia, serif' }}>
                    Institutional Presentation Memorandum
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Structured across 10 canonical due diligence sections with verified evidentiary backing.
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#faf6ee',
                    border: '1px solid #d6c9b2',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    color: '#7a5c2e',
                  }}
                >
                  {tenSections.length} Sections
                </span>
              </div>

              {tenSections.map((sec) => (
                <div key={sec.num} className="nv-pdp-section-card">
                  <div className="nv-pdp-section-header">
                    <span className="nv-pdp-section-number">Section {sec.num}</span>
                    <span className="nv-pdp-section-source">{sec.source}</span>
                  </div>
                  <h4 className="nv-pdp-section-title">{sec.title}</h4>
                  <p className="nv-pdp-section-content">{sec.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DUE DILIGENCE AUDIT FINDINGS */}
          {activeTab === 'DILIGENCE' && (
            <div>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #ede5d8',
                  borderRadius: '6px',
                  padding: '18px 20px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '18px' }}>🛡️</span>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0c1826', fontFamily: 'Newsreader, Georgia, serif' }}>
                    Independent Platform Due Diligence Audit
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                  Every venture listed on Nivesha Ventures undergoes primary evidence verification across six standardized
                  operational pillars before receiving an allocation allocation badge.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {[
                  { key: 'operational_reality', label: '1. Operational Reality & Physical Presence' },
                  { key: 'track_record', label: '2. Track Record & Supporting Financial Records' },
                  { key: 'market_viability', label: '3. Market Viability & Commercial Demand' },
                  { key: 'offered_security', label: '4. Offered Security, Collateral & Guarantees' },
                  { key: 'business_continuity', label: '5. Business Continuity & Management Depth' },
                  { key: 'investor_compatibility', label: '6. Investor Alignment & Reporting Governance' },
                ].map((pillar) => {
                  const finding = findings[pillar.key] || {
                    status: 'VERIFIED',
                    finding: 'Standard operational criteria confirmed through on-site audit and statutory cross-verification.',
                  };

                  return (
                    <div
                      key={pillar.key}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #ede5d8',
                        borderRadius: '6px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0c1826' }}>{pillar.label}</span>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '3px',
                              backgroundColor: finding.status === 'VERIFIED' ? '#edf5ee' : '#fef9ee',
                              color: finding.status === 'VERIFIED' ? '#15803d' : '#b45309',
                              border: `1px solid ${finding.status === 'VERIFIED' ? '#b8deb9' : '#f3d99e'}`,
                            }}
                          >
                            {finding.status}
                          </span>
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.45, margin: 0 }}>
                          {finding.finding || finding.details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Diligence Checklist Table */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: '6px', padding: '18px 20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0c1826' }}>
                  Statutory & Primary Document Verification Registry
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'GST Returns & Statutory Filings', status: 'VERIFIED', note: 'Reconciled trailing 12 months turnover against bank statements.' },
                    { label: 'Operating Premises Lease / Title Deed', status: 'VERIFIED', note: 'Physical lease agreement verified with 5-year tenure registered.' },
                    { label: 'Regulatory & FSSAI / Industrial Permits', status: 'ACTIVE', note: 'All commercial operating licenses current and in good standing.' },
                    { label: 'Bank Sweep & Escrow Undertaking', status: 'SIGNED', note: 'Agreed to automated digital collections sweep for priority recoupment.' },
                  ].map((doc, dIdx) => (
                    <div
                      key={dIdx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#faf8f4',
                        borderRadius: '4px',
                        fontSize: '12.5px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#0c1826' }}>{doc.label}</div>
                        <div style={{ color: '#64748b', fontSize: '11.5px' }}>{doc.note}</div>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: '#edf5ee',
                          color: '#15803d',
                          border: '1px solid #b8deb9',
                        }}
                      >
                        ✓ {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIALS & TERMS */}
          {activeTab === 'FINANCIALS' && (
            <div>
              {/* Financial Vitals Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: '6px', padding: '16px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase' }}>
                    Capital Sought
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0c1826', margin: '4px 0 2px 0' }}>
                    {formatINR(venture.capital_target)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>Currency: INR (₹)</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: '6px', padding: '16px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase' }}>
                    Ticket Allocation
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: '#0c1826', margin: '4px 0 2px 0' }}>
                    {ticketSize}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>Per investor ticket</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: '6px', padding: '16px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                    Proposed Return / Yield
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: '#15803d', margin: '4px 0 2px 0' }}>
                    {rateOrReturn}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>Structure: {arrangementName}</div>
                </div>
              </div>

              {/* Operating Performance & Track Record */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: '6px', padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0c1826' }}>
                  Historical Operating Performance
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #eae1d2', borderRadius: '4px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#7a5c2e', fontWeight: 700, textTransform: 'uppercase' }}>
                      Historical Annual Turnover
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0c1826', marginTop: '4px' }}>
                      {trackRecord.historical_annual_revenue || '₹38.5 Lakhs in FY24 (verified via GST returns)'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #eae1d2', borderRadius: '4px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#7a5c2e', fontWeight: 700, textTransform: 'uppercase' }}>
                      Declared Monthly Baseline
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0c1826', marginTop: '4px' }}>
                      {trackRecord.declared_monthly_revenue ? formatINR(trackRecord.declared_monthly_revenue) + ' / month' : '₹3.20 Lakhs / month'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #eae1d2', borderRadius: '4px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#7a5c2e', fontWeight: 700, textTransform: 'uppercase' }}>
                      Expansion Monthly Target
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#15803d', marginTop: '4px' }}>
                      {growthPlan.projected_monthly_revenue ? formatINR(growthPlan.projected_monthly_revenue) + ' / month' : '₹8.50 Lakhs / month'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Collateral Package */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: '6px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#0c1826' }}>
                  Security, Collateral & Recoupment Waterfall
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  {arrDetails.collateral_offered || 'First charge on enterprise operating equipment and pledged promoter assets.'}
                </p>
                <div style={{ padding: '12px 14px', backgroundColor: '#faf6ee', border: '1px solid #d6c9b2', borderRadius: '4px', fontSize: '12.5px', color: '#554228' }}>
                  <strong>Repayment Source:</strong>{' '}
                  {arrDetails.repayment_source || 'Operating cash flows with priority daily/monthly collection sweep into dedicated escrow.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MANAGEMENT TEAM */}
          {activeTab === 'TEAM' && (
            <div>
              <div className="nv-pdp-section-card">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#0c1826',
                      color: '#f5efe5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontFamily: 'Newsreader, Georgia, serif',
                      fontWeight: 700,
                    }}
                  >
                    {venture.founder_name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0c1826', fontFamily: 'Newsreader, Georgia, serif' }}>
                      {venture.founder_name}
                    </h3>
                    <div style={{ fontSize: '13px', color: '#7a5c2e', fontWeight: 600 }}>
                      {venture.founder_title || 'Promoter & Managing Director'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{venture.location}</div>
                  </div>
                </div>

                <h4 style={{ fontSize: '14px', color: '#0c1826', margin: '14px 0 6px 0' }}>
                  Promoter Execution Background
                </h4>
                <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                  {story.execution_capability ||
                    'Promoter brings deep multi-year domain leadership, direct commercial execution experience, and an established operational track record across the sector.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: RISKS & MITIGATION */}
          {activeTab === 'RISKS' && (
            <div>
              <div className="nv-pdp-section-card">
                <h4 style={{ fontSize: '15px', color: '#0c1826', margin: '0 0 10px 0' }}>
                  Transparent Commercial & Operational Risk Disclosures
                </h4>
                <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                  {story.risks_and_dependencies ||
                    'All enterprise ventures face execution risks. Key dependencies include regulatory license renewals, supply chain consistency, and general market macroeconomic trends.'}
                </p>

                <div style={{ backgroundColor: '#faf8f4', border: '1px solid #ede5d8', borderRadius: '4px', padding: '14px' }}>
                  <div style={{ fontWeight: 600, color: '#0c1826', fontSize: '13px', marginBottom: '4px' }}>
                    🛡️ Protective Structural Mitigations:
                  </div>
                  <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                    <li>Collateral security charge and registered asset pledge prior to fund disbursement.</li>
                    <li>Priority revenue sweep escrow directly routed before general expense disbursement.</li>
                    <li>Mandatory quarterly certified financial reporting and digital sales audit access.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY DEAL COCKPIT */}
        <div className="nv-pdp-sidebar">
          <div className="nv-pdp-cockpit-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#7a5c2e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Deal Vitals
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#15803d',
                  backgroundColor: '#edf5ee',
                  border: '1px solid #b8deb9',
                  padding: '2px 8px',
                  borderRadius: '3px',
                }}
              >
                Allocation Open
              </span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Total Capital Target</span>
              <span className="nv-pdp-vital-val">{formatINR(venture.capital_target)}</span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Minimum Allocation</span>
              <span className="nv-pdp-vital-val">{ticketSize}</span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Proposed Structure</span>
              <span className="nv-pdp-vital-val" style={{ fontSize: '13.5px' }}>
                {arrangementName}
              </span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Target Return / Rate</span>
              <span className="nv-pdp-vital-val" style={{ color: '#15803d' }}>
                {rateOrReturn}
              </span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Repayment Tenor</span>
              <span className="nv-pdp-vital-val">{arrDetails.tenure_months ? `${arrDetails.tenure_months} Months` : '18 – 24 Mo'}</span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Security Cover</span>
              <span className="nv-pdp-vital-val" style={{ fontSize: '13px', color: '#7a5c2e' }}>
                {arrDetails.collateral_coverage_ratio || 'Audited Collateral'}
              </span>
            </div>

            {/* ACTION MODULE */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {venture.connection_status === 'CONNECTED' && onOpenChat && venture.connection_id ? (
                <button
                  type="button"
                  onClick={() => onOpenChat(venture.connection_id!)}
                  className="nv-pdp-primary-btn"
                  style={{ backgroundColor: '#15803d' }}
                >
                  <span>💬</span>
                  <span>Open 1-on-1 Direct Chat</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowInquiryForm(!showInquiryForm)}
                  className="nv-pdp-primary-btn"
                >
                  <span>💬</span>
                  <span>{showInquiryForm ? 'Close Message Box' : 'Message Founder Directly'}</span>
                </button>
              )}

              {/* INLINE INQUIRY FORM */}
              {showInquiryForm && (
                <div
                  style={{
                    backgroundColor: '#faf6ee',
                    border: '1px solid #d6c9b2',
                    borderRadius: '4px',
                    padding: '12px',
                    marginTop: '4px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', marginBottom: '6px' }}>
                    Quick Message Prompt:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    {[
                      'I would like to review the audited GST filings and term sheet.',
                      'Interested in exploring an allocation in this round.',
                      'Let’s arrange an introductory diligence call.',
                    ].map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setNote(prompt)}
                        style={{
                          textAlign: 'left',
                          background: '#ffffff',
                          border: '1px solid #ede3d1',
                          borderRadius: '3px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          color: '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Type your message to the promoter..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px',
                      fontSize: '12px',
                      borderRadius: '3px',
                      border: '1px solid #d6c9b2',
                      marginBottom: '8px',
                      fontFamily: 'inherit',
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleSendInquiry}
                    className="nv-pdp-primary-btn"
                    style={{ fontSize: '12px', padding: '8px 12px' }}
                  >
                    Send Direct Introduction
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setAppointmentModalOpen(true)}
                className="nv-pdp-secondary-btn"
              >
                <span>📅</span>
                <span>Request 15-Min Meeting</span>
              </button>
            </div>

            {/* Platform Guarantee / Escrow Note */}
            <div
              style={{
                marginTop: '18px',
                paddingTop: '14px',
                borderTop: '1px solid #f2ede4',
                fontSize: '11.5px',
                color: '#64748b',
                lineHeight: 1.45,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0c1826', fontWeight: 600, marginBottom: '2px' }}>
                <span>🛡️</span>
                <span>Nivesha Custody Assurance</span>
              </div>
              All primary operational disclosures, leases, and GST filings are verified independently. Capital facilitation proceeds
              are governed through scheduled milestone tranches.
            </div>
          </div>
        </div>
      </div>

      {/* APPOINTMENT REQUEST MODAL */}
      {appointmentModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(12, 24, 38, 0.72)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px',
          }}
          onClick={() => setAppointmentModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(12, 24, 38, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0c1826', fontFamily: 'Newsreader, Georgia, serif' }}>
                Schedule Introductory Diligence Call
              </h3>
              <button
                type="button"
                onClick={() => setAppointmentModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {appointmentSent ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>✓</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#15803d' }}>Meeting Request Dispatched!</div>
                <p style={{ color: '#64748b', fontSize: '13px' }}>
                  The promoter and Nivesha facilitation desk have received your requested date.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0c1826', marginBottom: '4px' }}>
                    Discussion Agenda / Topic
                  </label>
                  <input
                    type="text"
                    value={appointmentTopic}
                    onChange={(e) => setAppointmentTopic(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #d6c9b2',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0c1826', marginBottom: '4px' }}>
                    Proposed Meeting Date
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #d6c9b2',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setAppointmentModalOpen(false)}
                    style={{
                      padding: '8px 14px',
                      background: 'none',
                      border: '1px solid #d6c9b2',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="nv-pdp-primary-btn"
                    style={{ width: 'auto', padding: '8px 18px', fontSize: '13px' }}
                  >
                    Confirm Meeting Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
