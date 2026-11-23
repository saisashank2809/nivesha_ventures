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

  if (!isOpen || !venture) return null;

  const brief = venture.diligence_brief || {};
  const findings = [
    { key: 'financials', label: 'Financials', data: brief.financials },
    { key: 'legal_compliance', label: 'Legal & compliance', data: brief.legal_compliance },
    { key: 'founders_team', label: 'Founders & team', data: brief.founders_team },
    { key: 'market_customers', label: 'Market & customers', data: brief.market_customers },
    { key: 'business_model', label: 'Business model', data: brief.business_model },
  ].filter((f) => f.data);

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
        backgroundColor: 'rgba(12, 24, 38, 0.7)',
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
          maxWidth: '820px',
          maxHeight: '90vh',
          backgroundColor: '#fffdf9',
          border: '1px solid #d6c9b2',
          boxShadow: '0 30px 60px -20px rgba(12, 24, 38, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
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
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a5c2e' }}>
              Diligence Brief · Independent Report
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                backgroundColor: venture.verification_status === 'VERIFIED' ? '#0c1826' : '#7a5c2e',
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
        <div style={{ padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Info */}
          <div>
            <h2
              style={{
                margin: '0 0 6px 0',
                fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
                fontSize: '32px',
                fontWeight: 400,
                color: '#7a5c2e',
              }}
            >
              {venture.company_name}
            </h2>
            <div style={{ fontSize: '14px', color: '#121a29', fontWeight: 500, marginBottom: '14px' }}>
              {venture.founder_name} {venture.founder_title ? `(${venture.founder_title})` : ''} · {venture.location}
            </div>

            <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: '#4c5262' }}>
              {venture.tag_line}
            </p>
          </div>

          {/* Key Parameters DL */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              backgroundColor: '#f5efe5',
              border: '1px solid #d6c9b2',
              padding: '16px 20px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4c5262' }}>Sector</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#7a5c2e', marginTop: '4px' }}>{venture.sector}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4c5262' }}>Stage</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#7a5c2e', marginTop: '4px' }}>{venture.stage}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4c5262' }}>Seeking</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#121a29', marginTop: '4px' }}>{formatINR(venture.capital_target)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4c5262' }}>Check Range</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#7a5c2e', marginTop: '4px' }}>
                {formatINR(venture.ticket_min)} – {formatINR(venture.ticket_max)}
              </div>
            </div>
          </div>

          {/* Business Context Story */}
          {venture.business_context && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7a5c2e' }}>
                The Venture Story
              </h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#121a29' }}>
                {venture.business_context}
              </p>
            </div>
          )}

          {/* Verified Traction Metrics */}
          {venture.traction_metrics && venture.traction_metrics.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7a5c2e' }}>
                Verified Operating Traction
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {venture.traction_metrics.map((m, idx) => (
                  <div key={idx} style={{ padding: '12px', backgroundColor: '#fff', border: '1px solid #e3d6bf' }}>
                    <div style={{ fontSize: '11px', color: '#4c5262' }}>{m.label} ({m.period || 'Recent'})</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#121a29', marginTop: '4px' }}>{m.value}</div>
                    <div style={{ fontSize: '10px', color: '#0c1826', fontWeight: 600, marginTop: '2px' }}>✓ {m.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diligence Findings Breakdown */}
          {findings.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7a5c2e' }}>
                Independent Verification Findings
              </h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, border: '1px solid #ece3d4' }}>
                {findings.map((f, i) => (
                  <li
                    key={f.key}
                    style={{
                      padding: '16px 20px',
                      borderTop: i > 0 ? '1px solid #ece3d4' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '16px',
                      backgroundColor: i % 2 === 0 ? '#fffdf9' : '#fbf8f2',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#121a29' }}>{f.data?.title || f.label}</div>
                      <div style={{ fontSize: '13px', color: '#4c5262', marginTop: '4px', lineHeight: 1.5 }}>
                        {f.data?.description}
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 8px',
                        backgroundColor: f.data?.status === 'VERIFIED' ? '#0c1826' : '#fff',
                        color: f.data?.status === 'VERIFIED' ? '#f5efe5' : '#7a5c2e',
                        border: f.data?.status === 'VERIFIED' ? 'none' : '1px solid #7a5c2e',
                      }}
                    >
                      {f.data?.status === 'VERIFIED' ? '✓ Verified' : f.data?.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions Worth Asking The Founder */}
          {brief.questions_for_founder && brief.questions_for_founder.length > 0 && (
            <div style={{ backgroundColor: '#fbf8f2', border: '1px solid #e3d6bf', padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a5c2e', marginBottom: '8px' }}>
                Questions worth asking the founder
              </div>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#121a29', lineHeight: 1.6 }}>
                {brief.questions_for_founder.map((q, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{q}</li>
                ))}
              </ol>
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
            Prepared by Nivesha Ventures · Shared with investor as written
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
                <span>💬</span> Message Founder Directly
              </button>
            ) : venture.connection_status === 'REQUESTED' ? (
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#7a5c2e' }}>
                ⌛ Connection Request Pending Founder Consent
              </span>
            ) : showNoteInput ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Optional message to founder..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #8a8070',
                    width: '260px',
                  }}
                />
                <button
                  onClick={handleSendRequest}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#121a29',
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
                  padding: '10px 20px',
                  backgroundColor: '#121a29',
                  color: '#f5efe5',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Request Introduction & Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
