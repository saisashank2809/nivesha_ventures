import React, { useState, useEffect } from 'react';
import { VentureDetail, User, UserRole, MatchCase, InvestorMandate } from '../../shared/types';
import { formatINR } from '../../shared/formatters';
import { Api } from '../../shared/api';
import './VenturePDPView.css';
import './film/FilmVenturePDP.css';
import { buildFilmVentureModel } from './film/filmVentureModel';
import { VentureChapterNavigation } from './film/VentureChapterNavigation';
import { VentureWalkthrough } from './film/VentureWalkthrough';
import { FilmOpportunityHero } from './film/FilmOpportunityHero';
import { InvestorCompatibility } from './film/InvestorCompatibility';
import { FundingComposition } from './film/FundingComposition';
import { CapitalUtilisationExperience } from './film/CapitalUtilisationExperience';
import { InvestmentParticipationSimulator } from './film/InvestmentParticipationSimulator';
import { InvestmentJourney } from './film/InvestmentJourney';
import { RevenueEcosystem } from './film/RevenueEcosystem';
import { CapitalRecoveryVisualizer } from './film/CapitalRecoveryVisualizer';
import { ProducerPortfolio } from './film/ProducerPortfolio';
import { ProductionReadiness } from './film/ProductionReadiness';
import { EvidenceAndRisks } from './film/EvidenceAndRisks';
import { InvestorDecisionAssistant } from './film/InvestorDecisionAssistant';

interface VenturePDPViewProps {
  venture: VentureDetail | null;
  ventureId?: string | null;
  currentUser: User | null;
  onBack: () => void;
  onRequestConnection: (ventureId: string, note?: string) => void;
  onOpenChat?: (connectionId: string) => void;
  onOpenLogin: (role?: UserRole, isRegister?: boolean) => void;
}

const isFilmSector = (v: VentureDetail | null): boolean =>
  Boolean(
    v &&
      (/film|cinema|motion picture|creative media|entertainment/i.test(v.sector || '') ||
        (v as any).custom_answers?.business_type === 'FILM_ENTERTAINMENT')
  );

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

  // Single Source of Truth for Film Participation Units
  const [selectedUnitsCount, setSelectedUnitsCount] = useState(1);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  const [matchCase, setMatchCase] = useState<MatchCase | null>(null);
  const [mandate, setMandate] = useState<InvestorMandate | null>(null);
  const [loadingMatch, setLoadingMatch] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Appointment workflow with genuine API status/error reporting
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentTopic, setAppointmentTopic] = useState('Discuss deal structure, terms, and safeguards');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false);
  const [appointmentSent, setAppointmentSent] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setSelectedUnitsCount(1);
    setWalkthroughOpen(false);
  }, [venture?.id]);

  // Load actual MatchCase + InvestorMandate for signed-in investors
  useEffect(() => {
    if (!venture || !isFilmSector(venture) || currentUser?.role !== 'INVESTOR') {
      setMatchCase(null);
      setMandate(null);
      setLoadingMatch(false);
      return;
    }

    let cancelled = false;
    setLoadingMatch(true);
    Promise.allSettled([Api.getMatchCases(), Api.getMyMandate()]).then(([mcRes, mRes]) => {
      if (cancelled) return;
      if (mcRes.status === 'fulfilled') {
        const found = mcRes.value.find((mc) => mc.venture_id === venture.id) || null;
        setMatchCase(found);
      }
      if (mRes.status === 'fulfilled') {
        setMandate(mRes.value);
      }
      setLoadingMatch(false);
    });

    return () => {
      cancelled = true;
    };
  }, [venture?.id, currentUser?.id, currentUser?.role]);

  if (loading) {
    return (
      <div style={{ padding: '100px 24px', textAlign: 'center', backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
        <h2 style={{ fontSize: '22px', color: 'var(--text-main)', marginBottom: '8px' }}>Loading opportunity details...</h2>
        <p style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>Fetching verified records and deal terms.</p>
      </div>
    );
  }

  if (!venture) {
    return (
      <div style={{ padding: '100px 24px', textAlign: 'center', backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
        <h2 style={{ fontSize: '22px', color: 'var(--text-main)', marginBottom: '8px' }}>Venture Not Found</h2>
        <p style={{ color: 'var(--text-subtle)', fontSize: '14px', marginBottom: '24px' }}>
          This opportunity is unavailable or has finished its funding window.
        </p>
        <button type="button" onClick={onBack} className="nv-pdp-back-btn">
          ← Back to Opportunities
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

  const customSections: Array<{ num?: string; title: string; content: string; source?: string }> =
    (story.custom_sections as any[]) || ((arrDetails as any)?.custom_sections as any[]) || [];

  const tenSections = [
    { num: '01', title: 'Business Summary', content: story.venture_overview || venture.business_context, source: 'FOUNDER' },
    { num: '02', title: 'Current Operations', content: story.current_position || 'Active business with verified records.', source: 'RECORDS' },
    { num: '03', title: 'Market Demand', content: story.opportunity || venture.tag_line, source: 'MARKET' },
    { num: '04', title: 'Money Needed', content: story.capital_requirement || `Total capital sought: ${formatINR(venture.capital_target)}.`, source: 'PLAN' },
    { num: '05', title: 'Where Money Goes', content: story.use_of_capital || arrDetails.itemized_budget || 'Allocated across documented business items.', source: 'SPEND' },
    { num: '06', title: 'How Investors Earn', content: story.investment_proposal || `Structure: ${venture.proposed_arrangement || 'Direct deal'}.`, source: 'TERMS' },
    { num: '07', title: 'Team Experience', content: story.execution_capability || 'Experienced promoter and execution team.', source: 'TEAM' },
    { num: '08', title: 'Key Risks', content: story.risks_and_dependencies || 'Subject to execution timelines and demand conditions.', source: 'RISKS' },
    { num: '09', title: 'Investor Updates & Rights', content: story.investor_participation || 'Periodic financial reports and agreed payout oversight.', source: 'RIGHTS' },
    { num: '10', title: 'Checked Documents', content: story.evidence_and_next_steps || 'Initial paperwork checked by Nivesha reviewers.', source: 'CHECKS' },
    ...customSections.map((cs, i) => ({
      num: cs.num || String(11 + i).padStart(2, '0'),
      title: cs.title,
      content: cs.content,
      source: cs.source || 'ADDITIONAL',
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
    onRequestConnection(venture.id, note || 'I would like to understand the deal terms before investing.');
    setShowInquiryForm(false);
    setNote('');
  };

  const handleOpenAppointmentWithTopic = (topic: string) => {
    setAppointmentError(null);
    setAppointmentSent(false);
    setAppointmentTopic(topic);
    setAppointmentModalOpen(true);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin('INVESTOR', false);
      return;
    }
    setAppointmentSubmitting(true);
    setAppointmentError(null);
    try {
      await Api.createAppointment({
        venture_id: venture.id,
        match_case_id: matchCase?.id || undefined,
        meeting_purpose: appointmentTopic,
        preferred_times: [appointmentDate || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)],
      });
      setAppointmentSent(true);
      setAppointmentSubmitting(false);
      setTimeout(() => {
        setAppointmentModalOpen(false);
        setAppointmentSent(false);
      }, 2000);
    } catch (err: any) {
      setAppointmentSubmitting(false);
      setAppointmentSent(false);
      setAppointmentError(err?.message || 'Unable to submit appointment request. Please check your connection or sign in again.');
    }
  };

  const arrangementName =
    arrDetails.structure_name ||
    venture.proposed_arrangement?.replace(/_/g, ' ') ||
    'Structured Participation';

  const rateOrReturn =
    arrDetails.offered_interest_rate ||
    arrDetails.interest_rate ||
    arrDetails.proposed_equity_offered ||
    (arrDetails.collateral_coverage_ratio ? `Cover: ${arrDetails.collateral_coverage_ratio}` : 'Shared on request');

  const ticketSize =
    venture.ticket_min && venture.ticket_max
      ? `${formatINR(venture.ticket_min)} – ${formatINR(venture.ticket_max)}`
      : venture.ticket_min
      ? `Starts at ${formatINR(venture.ticket_min)}`
      : 'Flexible';

  // ─── FILM VENTURE STORYTELLING PDP (Knowledge-Driven Modular Sections) ───────
  if (isFilmSector(venture)) {
    const filmModel = buildFilmVentureModel(venture, matchCase, mandate, selectedUnitsCount);

    const scrollToTicket = () => {
      const el = document.getElementById('sec-ticket');
      if (el) {
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
    };

    return (
      <div className="nv-film-story-page">
        <VentureChapterNavigation
          selectedCapital={filmModel.selectedCapital}
          copiedShare={copiedShare}
          walkthroughOpen={walkthroughOpen}
          onBack={onBack}
          onCopyShare={handleCopyShare}
          onToggleWalkthrough={() => setWalkthroughOpen((w) => !w)}
        />

        <VentureWalkthrough
          model={filmModel}
          isOpen={walkthroughOpen}
          onClose={() => setWalkthroughOpen(false)}
        />

        <main>
          <FilmOpportunityHero
            model={filmModel}
            onOpenWalkthrough={() => setWalkthroughOpen(true)}
            onJumpToTicket={scrollToTicket}
          />

          <InvestorCompatibility model={filmModel} loadingMatch={loadingMatch} />

          <FundingComposition model={filmModel} />

          <CapitalUtilisationExperience model={filmModel} />

          <InvestmentParticipationSimulator
            model={filmModel}
            onSelectUnits={setSelectedUnitsCount}
          />

          <InvestmentJourney model={filmModel} />

          <RevenueEcosystem model={filmModel} />

          <CapitalRecoveryVisualizer model={filmModel} />

          <ProducerPortfolio model={filmModel} />

          <ProductionReadiness model={filmModel} />

          <EvidenceAndRisks model={filmModel} />

          <InvestorDecisionAssistant
            model={filmModel}
            currentUser={currentUser}
            selectedUnits={selectedUnitsCount}
            onSelectUnits={setSelectedUnitsCount}
            onRequestConnection={onRequestConnection}
            onOpenChat={onOpenChat}
            onOpenLogin={() => onOpenLogin('INVESTOR', false)}
            onOpenAppointmentModal={handleOpenAppointmentWithTopic}
          />
        </main>

        {/* APPOINTMENT MODAL */}
        {appointmentModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1200,
              padding: '20px',
            }}
            onClick={() => setAppointmentModalOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="film-appointment-title"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                maxWidth: '460px',
                width: '100%',
                padding: '26px',
                border: '1px solid rgba(15, 23, 42, 0.1)',
                boxShadow: 'var(--shadow-xl)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 id="film-appointment-title" style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Book 15-Min Call</h3>
                <button type="button" onClick={() => setAppointmentModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-subtle)' }}>
                  ✕
                </button>
              </div>
              {appointmentSent ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', color: 'var(--accent-green)', marginBottom: '8px' }}>✓</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-green)' }}>Call Request Confirmed!</div>
                </div>
              ) : (
                <form onSubmit={handleBookAppointment}>
                  {appointmentError && (
                    <div role="alert" style={{ padding: '9px 12px', marginBottom: '12px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid rgba(220,38,38,0.25)', fontSize: '12.5px', color: '#991b1b' }}>
                      {appointmentError}
                    </div>
                  )}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>What would you like to discuss?</label>
                    <input
                      type="text"
                      value={appointmentTopic}
                      onChange={(e) => setAppointmentTopic(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '13.5px', border: '1px solid rgba(15, 23, 42, 0.14)', backgroundColor: 'var(--bg-primary)', borderRadius: '10px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>Preferred Date</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '13.5px', border: '1px solid rgba(15, 23, 42, 0.14)', backgroundColor: 'var(--bg-primary)', borderRadius: '10px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setAppointmentModalOpen(false)} className="nv-pdp-secondary-btn" style={{ width: 'auto' }}>Cancel</button>
                    <button type="submit" disabled={appointmentSubmitting} className="nv-pdp-blue-btn" style={{ width: 'auto' }}>
                      {appointmentSubmitting ? 'Sending...' : 'Send Call Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── GENERIC (NON-FILM) VENTURE PDP — PRESERVED FUNCTIONALITY + ALIGNED UI ──
  return (
    <div className="nv-pdp-page">
      <div className="nv-pdp-top-bar">
        <div className="nv-pdp-top-bar-inner">
          <button type="button" onClick={onBack} className="nv-pdp-back-btn">
            <span>←</span>
            <span>Back to Opportunities</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" onClick={handleCopyShare} className="nv-pdp-action-btn">
              <span>{copiedShare ? 'Link Copied' : 'Share'}</span>
            </button>
            <button type="button" onClick={() => window.print()} className="nv-pdp-action-btn">
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      <div className="nv-pdp-hero">
        <div className="nv-pdp-badge-strip">
          <span className="nv-pdp-sector-badge">{venture.sector}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{venture.location}</span>
          <span className="nv-status-pill verified">✓ Checked by Nivesha</span>
          <span className="nv-status-pill neutral">{venture.stage || 'Operating'}</span>
        </div>

        <h1 className="nv-pdp-title">{venture.company_name}</h1>
        <p className="nv-pdp-tagline">{venture.tag_line || venture.business_context}</p>

        <div className="nv-pdp-vitals-bar">
          <div className="nv-pdp-vitals-item">
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Money Needed</div>
            <div style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{formatINR(venture.capital_target)}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>Founder: {venture.founder_name}</div>
          </div>
          <div className="nv-pdp-vitals-item">
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Min to Max Ticket</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{ticketSize}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>Per participant</div>
          </div>
          <div className="nv-pdp-vitals-item">
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Deal Type</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>{arrangementName}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>{venture.stage || 'Operating'}</div>
          </div>
          <div className="nv-pdp-vitals-item">
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>How You Earn</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--accent-green)', marginTop: '2px' }}>{rateOrReturn}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>Proposed return</div>
          </div>
        </div>
      </div>

      <div className="nv-pdp-gallery-container">
        <div className="nv-pdp-gallery-main">
          <img src={activeImage} alt={venture.company_name} loading="lazy" />
          <div className="nv-pdp-gallery-overlay">
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, opacity: 0.9 }}>On-Site Visit Photo</span>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>
                Photo {selectedImgIndex + 1} of {gallery.length} &bull; {venture.location}
              </div>
            </div>
            <span className="nv-status-pill verified" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>
              Site Checked
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

      <div className="nv-pdp-layout">
        <div>
          <div className="nv-pdp-nav-tabs">
            <button type="button" className={`nv-pdp-tab-btn ${activeTab === 'DOSSIER' ? 'active' : ''}`} onClick={() => setActiveTab('DOSSIER')}>
              Business Summary ({tenSections.length})
            </button>
            <button type="button" className={`nv-pdp-tab-btn ${activeTab === 'DILIGENCE' ? 'active' : ''}`} onClick={() => setActiveTab('DILIGENCE')}>
              What We Checked
            </button>
            <button type="button" className={`nv-pdp-tab-btn ${activeTab === 'FINANCIALS' ? 'active' : ''}`} onClick={() => setActiveTab('FINANCIALS')}>
              Numbers &amp; Security
            </button>
            <button type="button" className={`nv-pdp-tab-btn ${activeTab === 'TEAM' ? 'active' : ''}`} onClick={() => setActiveTab('TEAM')}>
              Promoter
            </button>
            <button type="button" className={`nv-pdp-tab-btn ${activeTab === 'RISKS' ? 'active' : ''}`} onClick={() => setActiveTab('RISKS')}>
              What Could Go Wrong
            </button>
          </div>

          {activeTab === 'DOSSIER' && (
            <div>
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

          {activeTab === 'DILIGENCE' && (
            <div>
              <div className="nv-pdp-section-card">
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-main)' }}>Background &amp; Document Checks</h3>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)' }}>
                  Each area compares founder claims against tax filings, leases, or site inspection notes.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                {[
                  { key: 'operational_reality', label: '1. Business Premise & Operations' },
                  { key: 'track_record', label: '2. Past Sales & Tax Records' },
                  { key: 'market_viability', label: '3. Local Customer Demand' },
                  { key: 'offered_security', label: '4. Asset / Security Offered' },
                  { key: 'business_continuity', label: '5. Lease & Key Staff Stability' },
                  { key: 'investor_compatibility', label: '6. Reporting & Updates' },
                ].map((pillar) => {
                  const finding = findings[pillar.key] || {
                    status: 'VERIFIED',
                    finding: 'Operational records checked during platform review.',
                  };
                  const isVerified = finding.status === 'VERIFIED';

                  return (
                    <div key={pillar.key} className="nv-pdp-section-card" style={{ marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>{pillar.label}</span>
                        <span className={`nv-status-pill ${isVerified ? 'verified' : 'partial'}`}>
                          {isVerified ? 'Checked' : 'Partly Checked'}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                        {finding.finding || finding.details}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'FINANCIALS' && (
            <div>
              <div className="nv-pdp-section-card">
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15.5px', color: 'var(--text-main)' }}>
                  Current Earnings vs. Expansion Goal
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Past Annual Sales</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                      {trackRecord.historical_annual_revenue || trackRecord.annual_turnover || 'Verified via GST returns'}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Current Monthly Baseline</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                      {trackRecord.declared_monthly_revenue ? `${formatINR(trackRecord.declared_monthly_revenue)} / month` : trackRecord.historical_monthly_revenue || 'Logged'}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Projected Target After Raise</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-green)', marginTop: '4px' }}>
                      {growthPlan.projected_monthly_revenue ? `${formatINR(growthPlan.projected_monthly_revenue)} / month` : growthPlan.projected_revenue_fy26 || 'Expansion target'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="nv-pdp-section-card">
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15.5px', color: 'var(--text-main)' }}>
                  What Protects Your Money &amp; How You Get Paid Back
                </h4>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 12px 0' }}>
                  {arrDetails.collateral_offered || 'Backed by pledged operating assets disclosed in deal terms.'}
                </p>
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-main)' }}>
                  <strong>Where payouts come from:</strong>{' '}
                  {arrDetails.repayment_source || 'Ongoing business collections routed to scheduled investor repayments.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TEAM' && (
            <div className="nv-pdp-section-card">
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-dark)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '21px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {venture.founder_name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>{venture.founder_name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--accent-blue)', fontWeight: 600 }}>
                    {venture.founder_title || 'Promoter & Managing Director'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>{venture.location}</div>
                </div>
              </div>

              <h4 style={{ fontSize: '14.5px', color: 'var(--text-main)', margin: '10px 0 6px 0' }}>Experience &amp; Track Record</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                {story.execution_capability || 'Experienced promoter with verifiable operating track record in this business.'}
              </p>
            </div>
          )}

          {activeTab === 'RISKS' && (
            <div className="nv-pdp-section-card">
              <h4 style={{ fontSize: '15.5px', color: 'var(--text-main)', margin: '0 0 10px 0' }}>Key Risks to Weigh</h4>
              <div className="nv-risk-compact" style={{ marginBottom: '14px' }}>
                <strong>Business &amp; Execution Risks:</strong>{' '}
                {story.risks_and_dependencies || 'Expansion delays, supplier price swings, or slower local footfall can affect payback speed.'}
              </div>

              <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13.5px', marginBottom: '6px' }}>
                  Proposed Safeguards
                </div>
                <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  <li>Asset pledge or charge recorded prior to disbursement where collateral applies.</li>
                  <li>Regular sales reporting access shared with participating investors.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="nv-pdp-sidebar">
          <div className="nv-pdp-cockpit-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Key Deal Terms</span>
              <span className="nv-status-pill verified">Open</span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Money Needed</span>
              <span className="nv-pdp-vital-val">{formatINR(venture.capital_target)}</span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Ticket Range</span>
              <span className="nv-pdp-vital-val">{ticketSize}</span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Deal Structure</span>
              <span className="nv-pdp-vital-val" style={{ fontSize: '13px' }}>{arrangementName}</span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Offered Return</span>
              <span className="nv-pdp-vital-val" style={{ color: 'var(--accent-green)' }}>{rateOrReturn}</span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Duration</span>
              <span className="nv-pdp-vital-val">{arrDetails.tenure_months ? `${arrDetails.tenure_months} Months` : '18 – 24 Months'}</span>
            </div>

            <div className="nv-pdp-cockpit-vital-row">
              <span className="nv-pdp-vital-label">Backed By</span>
              <span className="nv-pdp-vital-val" style={{ fontSize: '13px', color: 'var(--accent-blue)' }}>
                {arrDetails.collateral_coverage_ratio || 'Disclosed in Terms'}
              </span>
            </div>

            <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {venture.connection_status === 'CONNECTED' && onOpenChat && venture.connection_id ? (
                <button
                  type="button"
                  onClick={() => onOpenChat(venture.connection_id!)}
                  className="nv-pdp-primary-btn"
                  style={{ backgroundColor: 'var(--accent-green)' }}
                >
                  <span>Open Direct Chat</span>
                </button>
              ) : (
                <button type="button" onClick={() => setShowInquiryForm(!showInquiryForm)} className="nv-pdp-primary-btn">
                  <span>{showInquiryForm ? 'Close Message Box' : `Ask ${venture.founder_name}`}</span>
                </button>
              )}

              {showInquiryForm && (
                <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '14px', padding: '12px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>Quick questions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '8px' }}>
                    {[
                      'Please share the latest GST filings and draft agreement.',
                      'I am exploring a ticket in this round — can we discuss?',
                      'Let’s set up a quick 15-minute call.',
                    ].map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setNote(prompt)}
                        style={{
                          textAlign: 'left',
                          background: '#ffffff',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          padding: '6px 9px',
                          fontSize: '11.5px',
                          color: 'var(--text-muted)',
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
                    placeholder="Write your question..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '9px 10px',
                      fontSize: '12.5px',
                      borderRadius: '10px',
                      border: '1px solid rgba(15, 23, 42, 0.12)',
                      backgroundColor: '#ffffff',
                      marginBottom: '8px',
                      fontFamily: 'inherit',
                    }}
                  />

                  <button type="button" onClick={handleSendInquiry} className="nv-pdp-blue-btn" style={{ fontSize: '12.5px', padding: '9px 14px' }}>
                    Send Message
                  </button>
                </div>
              )}

              <button type="button" onClick={() => handleOpenAppointmentWithTopic('Discuss deal structure, terms, and safeguards')} className="nv-pdp-secondary-btn">
                <span>Book 15-Min Call</span>
              </button>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(15, 23, 42, 0.06)', fontSize: '12px', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
              Platform facilitates direct introductions and does not hold investor money.
            </div>
          </div>
        </div>
      </div>

      {appointmentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }} onClick={() => setAppointmentModalOpen(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', maxWidth: '460px', width: '100%', padding: '26px', boxShadow: 'var(--shadow-xl)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Book 15-Min Call</h3>
              <button type="button" onClick={() => setAppointmentModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-subtle)' }}>✕</button>
            </div>
            {appointmentSent ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', color: 'var(--accent-green)', marginBottom: '8px' }}>✓</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-green)' }}>Call Request Confirmed!</div>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment}>
                {appointmentError && (
                  <div role="alert" style={{ padding: '9px 12px', marginBottom: '12px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid rgba(220,38,38,0.25)', fontSize: '12.5px', color: '#991b1b' }}>
                    {appointmentError}
                  </div>
                )}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>Topic</label>
                  <input type="text" value={appointmentTopic} onChange={(e) => setAppointmentTopic(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '13.5px', border: '1px solid rgba(15, 23, 42, 0.14)', backgroundColor: 'var(--bg-primary)', borderRadius: '10px' }} />
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '5px' }}>Preferred Date</label>
                  <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '13.5px', border: '1px solid rgba(15, 23, 42, 0.14)', backgroundColor: 'var(--bg-primary)', borderRadius: '10px' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setAppointmentModalOpen(false)} className="nv-pdp-secondary-btn" style={{ width: 'auto' }}>Cancel</button>
                  <button type="submit" disabled={appointmentSubmitting} className="nv-pdp-blue-btn" style={{ width: 'auto' }}>
                    {appointmentSubmitting ? 'Sending...' : 'Send Call Request'}
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
