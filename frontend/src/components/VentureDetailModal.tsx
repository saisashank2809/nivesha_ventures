import React, { useState } from 'react';
import { VentureDetail } from '../shared/types';
import { formatINR } from '../shared/formatters';

interface VentureDetailModalProps {
  venture: VentureDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestConnection: (ventureId: string, note?: string) => void;
  onOpenChat?: (connectionId: string) => void;
}

export const VentureDetailModal: React.FC<VentureDetailModalProps> = ({
  venture,
  isOpen,
  onClose,
  onRequestConnection,
  onOpenChat,
}) => {
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'DOSSIER' | 'FINDINGS' | 'TERMS'>('DOSSIER');

  if (!isOpen || !venture) return null;

  const story = (venture.venture_story || {}) as Record<string, string>;
  const arrDetails = venture.arrangement_details || {};
  const findings = venture.due_diligence_findings || {};
  const evidenceChecklist = findings.evidence_checklist as Array<{ label: string; status: string; note: string }> | undefined;

  // The 10 standardized presentation sections
  const tenSections = [
    { num: '01', title: 'Venture Overview', content: story.venture_overview || venture.business_context, source: 'FOUNDER INPUTS' },
    { num: '02', title: 'Current Position', content: story.current_position || 'Active operating enterprise with verifiable records.', source: 'OPERATING RECORDS' },
    { num: '03', title: 'Opportunity', content: story.opportunity || venture.tag_line, source: 'MARKET CONTEXT' },
    { num: '04', title: 'Capital Requirement', content: story.capital_requirement || `Total capital sought: ${formatINR(venture.capital_target)}.`, source: 'BUDGET SCHEDULE' },
    { num: '05', title: 'Use of Capital', content: story.use_of_capital || arrDetails.itemized_budget || 'Itemized capital deployment against audited line items.', source: 'DEPLOYMENT PLAN' },
    { num: '06', title: 'Investment Proposal', content: story.investment_proposal || `Proposed arrangement: ${venture.proposed_arrangement || 'Direct facilitation'}.`, source: 'PROPOSED TERMS' },
    { num: '07', title: 'Execution Capability', content: story.execution_capability || 'Seasoned management and technical partner delivery credentials.', source: 'TEAM & PARTNERS' },
    { num: '08', title: 'Risks & Dependencies', content: story.risks_and_dependencies || 'Subject to statutory approvals, supply chain milestones, and delivery timelines.', source: 'DISCLOSURES' },
    { num: '09', title: 'Investor Participation', content: story.investor_participation || 'Audited financial reporting, priority recoupment waterfall, and governance rights.', source: 'GOVERNANCE' },
    { num: '10', title: 'Evidence & Next Steps', content: story.evidence_and_next_steps || 'Initial documentation submitted and ready for platform review clearance.', source: 'REVIEW AUDIT' },
  ];

  const handleSendRequest = () => {
    onRequestConnection(venture.id, note);
    setShowNoteInput(false);
    setNote('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(12, 24, 38, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          backgroundColor: '#fffdf9',
          border: '1px solid #d6c9b2',
          boxShadow: '0 30px 60px -20px rgba(12, 24, 38, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e3d6bf',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fbf8f2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a5c2e' }}>
              Standardized 10-Section Dossier
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                backgroundColor: venture.verification_status === 'VERIFIED' ? '#15803d' : '#0c1826',
                color: '#f5efe5',
              }}
            >
              {venture.verification_status}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#4c5262',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Info */}
          <div>
            <h2
              style={{
                margin: '0 0 4px 0',
                fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
                fontSize: '30px',
                fontWeight: 400,
                color: '#121a29',
              }}
            >
              {venture.company_name}
            </h2>
            <div style={{ fontSize: '13.5px', color: '#7a5c2e', fontWeight: 600, marginBottom: '10px' }}>
              {venture.founder_name} {venture.founder_title ? `· ${venture.founder_title}` : ''} · {venture.location}
            </div>
            <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.6, color: '#4c5262' }}>
              {venture.tag_line}
            </p>
          </div>

          {/* Key Parameters Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              backgroundColor: '#f5efe5',
              border: '1px solid #d6c9b2',
              padding: '14px 18px',
            }}
          >
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a5c2e' }}>Sector</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#121a29', marginTop: '4px' }}>{venture.sector}</div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a5c2e' }}>Arrangement</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#121a29', marginTop: '4px' }}>
                {(venture.proposed_arrangement || 'Direct').replace(/_/g, ' ')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a5c2e' }}>Capital Target</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#121a29', marginTop: '4px' }}>{formatINR(venture.capital_target)}</div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a5c2e' }}>Ticket Range</div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#121a29', marginTop: '4px' }}>
                {formatINR(venture.ticket_min)} – {formatINR(venture.ticket_max)}
              </div>
            </div>
          </div>

          {/* Platform Derived Calculations Banner (if available) */}
          {(arrDetails.calculated_budget_contribution || arrDetails.collateral_coverage_ratio || arrDetails.calculated_margin_impact) && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #7a5c2e', padding: '14px 18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                🧮 Platform Calculated Metrics & Epistemic Separation
              </div>
              <div style={{ fontSize: '13px', color: '#121a29', lineHeight: 1.5 }}>
                {arrDetails.calculated_budget_contribution && (
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Budget Ratio:</strong> {arrDetails.calculated_budget_contribution}. <em>{arrDetails.calculation_note}</em>
                  </div>
                )}
                {arrDetails.collateral_coverage_ratio && (
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Collateral Cover:</strong> {arrDetails.collateral_coverage_ratio} ({formatINR(arrDetails.collateral_valuation)} residential property).
                  </div>
                )}
                {arrDetails.calculated_margin_impact && (
                  <div>
                    <strong>Margin Analysis:</strong> {arrDetails.calculated_margin_impact}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtabs for View: 10-Section Dossier vs Evidence Checklist */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #d6c9b2', paddingBottom: '8px' }}>
            <button
              onClick={() => setActiveTab('DOSSIER')}
              style={{
                padding: '6px 14px',
                border: 'none',
                background: activeTab === 'DOSSIER' ? '#0c1826' : 'transparent',
                color: activeTab === 'DOSSIER' ? '#fff' : '#4c5262',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              10-Section Unified Presentation
            </button>
            <button
              onClick={() => setActiveTab('FINDINGS')}
              style={{
                padding: '6px 14px',
                border: 'none',
                background: activeTab === 'FINDINGS' ? '#0c1826' : 'transparent',
                color: activeTab === 'FINDINGS' ? '#fff' : '#4c5262',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Evidence & Verification Checks
            </button>
          </div>

          {/* TAB 1: 10 SECTIONS DOSSIER */}
          {activeTab === 'DOSSIER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {tenSections.map((sec) => (
                <div
                  key={sec.num}
                  style={{
                    padding: '14px 18px',
                    backgroundColor: '#fbf8f2',
                    border: '1px solid #e3d6bf',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', fontFamily: 'monospace' }}>{sec.num}</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#121a29' }}>{sec.title}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: '#fff', padding: '1px 6px', border: '1px solid #d6c9b2' }}>
                      {sec.source}
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#121a29', lineHeight: 1.55 }}>
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: EVIDENCE CHECKLIST */}
          {activeTab === 'FINDINGS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: '#4c5262', marginBottom: '4px' }}>
                Platform reviewer audit trail distinguishing submitted claims from verified proof and open questions:
              </div>

              {evidenceChecklist ? (
                evidenceChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: item.status === 'VERIFIED' ? '#f0fdf4' : item.status === 'UNRESOLVED_CHECK' ? '#fffbeb' : '#fff',
                      border: '1px solid #d6c9b2',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#121a29' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: '#4c5262', marginTop: '2px' }}>{item.note}</div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        backgroundColor: item.status === 'VERIFIED' ? '#15803d' : item.status === 'UNRESOLVED_CHECK' ? '#b45309' : '#0c1826',
                        color: '#fff',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#7a5c2e' }}>
                  Standard evidence review pending platform desk dispatch.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e3d6bf',
            backgroundColor: '#fbf8f2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#7a5c2e' }}>
            Nivesha Ventures · Capital Facilitation Platform
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {venture.connection_status === 'CONNECTED' ? (
              <button
                onClick={() => {
                  onClose();
                  if (onOpenChat && venture.connection_id) onOpenChat(venture.connection_id);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0c1826',
                  color: '#f5efe5',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>💬</span> Open Direct Chat
              </button>
            ) : venture.connection_status === 'REQUESTED' ? (
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#7a5c2e' }}>
                ⌛ Connection Request Pending Founder Consent
              </span>
            ) : showNoteInput ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Optional introductory note to founder..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #8a8070',
                    width: '280px',
                  }}
                />
                <button
                  onClick={handleSendRequest}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#0c1826',
                    color: '#f5efe5',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Send Request
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNoteInput(true)}
                style={{
                  padding: '10px 22px',
                  backgroundColor: '#0c1826',
                  color: '#f5efe5',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Request Introduction & Diligence Meeting
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
