import React, { useState, useEffect } from 'react';
import { VentureDetail, User, Connection } from '../../shared/types';
import { Api } from '../../shared/api';
import { formatINR } from '../../shared/formatters';

interface FounderDashboardProps {
  currentUser: User | null;
  onOpenOnboarding: () => void;
  onOpenChat: (connectionId: string) => void;
  onOpenLogin: () => void;
}

export const FounderDashboard: React.FC<FounderDashboardProps> = ({
  currentUser,
  onOpenOnboarding,
  onOpenChat,
  onOpenLogin,
}) => {
  const [venture, setVenture] = useState<VentureDetail | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Edit fields
  const [tagLine, setTagLine] = useState('');
  const [businessContext, setBusinessContext] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [v, conns] = await Promise.all([
        Api.getMyVenture(),
        Api.getConnections(),
      ]);
      setVenture(v);
      setTagLine(v.tag_line || '');
      setBusinessContext(v.business_context || '');
      setVideoUrl(v.video_url || '');
      setPitchDeckUrl(v.pitch_deck_url || '');
      setConnections(conns);
    } catch (err: any) {
      console.error('Error loading founder venture', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'FOUNDER') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleSaveShowcase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venture) return;
    try {
      setSaving(true);
      const updated = await Api.updateMyVenture(venture.id, {
        tag_line: tagLine,
        business_context: businessContext,
        video_url: videoUrl,
        pitch_deck_url: pitchDeckUrl,
      });
      setVenture(updated);
      setMessage('Showcase updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConsent = async (connectionId: string, consent: boolean) => {
    try {
      await Api.submitConsent(connectionId, consent);
      await loadData();
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ maxWidth: '800px', margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <h2 style={{ fontSize: '32px', color: 'var(--bg-dark)', marginBottom: '16px' }}>
          Founder Portal Access
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Please sign in to manage your company showcase, view investor connection requests, and access your onboarding questionnaire.
        </p>
        <button
          onClick={onOpenLogin}
          style={{
            padding: '12px 28px',
            borderRadius: '6px',
            background: 'var(--bg-dark)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '15px',
          }}
        >
          Sign In as Founder
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        Loading founder showcase...
      </div>
    );
  }

  if (!venture) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
        <h2 style={{ fontSize: '30px', color: 'var(--bg-dark)', marginBottom: '12px' }}>
          No Active Venture Profile Found
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          It looks like your company profile is not yet initialized. Complete the onboarding questionnaire to build your showcase!
        </p>
        <button
          onClick={onOpenOnboarding}
          style={{
            padding: '12px 24px',
            borderRadius: '6px',
            background: 'var(--accent-gold)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          Start Onboarding Questionnaire &rarr;
        </button>
      </div>
    );
  }

  // Pending connection requests for this founder
  const pendingRequests = connections.filter((c) => c.status === 'REQUESTED' && !c.founder_consent);
  const activeConnections = connections.filter((c) => c.status === 'CONNECTED');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 24px 80px' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div className="eyebrow">FOUNDER SHOWCASE PORTAL</div>
          <h1 style={{ fontSize: '36px', color: 'var(--bg-dark)', marginTop: '4px', marginBottom: '8px' }}>
            {venture.company_name}
          </h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '4px',
                background: '#e9f5ed',
                color: 'var(--accent-green)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              ✓ {venture.verification_status}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {venture.sector} • {venture.stage} • Raising {formatINR(venture.capital_target)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenOnboarding}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              color: 'var(--bg-dark)',
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Edit Onboarding Questions
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            background: '#e9f5ed',
            color: 'var(--accent-green)',
            padding: '12px 18px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontWeight: 500,
            fontSize: '14px',
            border: '1px solid #c2e5cb',
          }}
        >
          {message}
        </div>
      )}

      {/* Grid: Left Column (Showcase Management) & Right Column (Investor Connections & Diligence) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '32px' }}>
        {/* Left Column: Showcase Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Showcase Form */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '22px', color: 'var(--bg-dark)', marginBottom: '8px' }}>
              Venture Presentation & Narrative
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Refine how your opportunity appears to accredited investors. Ensure your business context highlights your moat and customer validation.
            </p>

            <form onSubmit={handleSaveShowcase} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '6px' }}>
                  Headline / Elevator Tagline
                </label>
                <input
                  type="text"
                  value={tagLine}
                  onChange={(e) => setTagLine(e.target.value)}
                  placeholder="e.g. India's fastest-growing enterprise supply chain operating system."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#fcfaf6',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '6px' }}>
                  Business Context & Moat
                </label>
                <textarea
                  rows={5}
                  value={businessContext}
                  onChange={(e) => setBusinessContext(e.target.value)}
                  placeholder="Describe your market dynamics, core problem, proprietary advantage, and customer retention cohorts..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                    lineHeight: 1.55,
                    outline: 'none',
                    background: '#fcfaf6',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '6px' }}>
                    Founder Video Pitch (Loom / YouTube)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://loom.com/share/..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-light)',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#fcfaf6',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '6px' }}>
                    Pitch Deck Link (PDF / DocSend)
                  </label>
                  <input
                    type="url"
                    value={pitchDeckUrl}
                    onChange={(e) => setPitchDeckUrl(e.target.value)}
                    placeholder="https://docsend.com/view/..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-light)',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#fcfaf6',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '6px',
                    background: 'var(--bg-dark)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '14px',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving...' : 'Update Showcase Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Verified Traction Metrics Overview */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '20px', color: 'var(--bg-dark)', marginBottom: '6px' }}>
              Verified Traction Metrics
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              These metrics have been cross-checked by Nivesha analysts against audited GST and banking records.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {venture.traction_metrics.map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: '#fcfaf6',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginBottom: '4px' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--bg-dark)' }}>
                    {m.value}
                  </div>
                  {m.period && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Period: {m.period}
                    </div>
                  )}
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: '#e8f3ea',
                      color: 'var(--accent-green)',
                      fontSize: '10px',
                      fontWeight: 600,
                    }}
                  >
                    ✓ {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Connection Requests & Direct Chats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Pending Inbound Requests */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '18px', color: 'var(--bg-dark)', margin: 0 }}>
                Inbound Connection Requests ({pendingRequests.length})
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Investors who have inspected your brief and requested an introduction. Granting consent unlocks direct chat.
            </p>

            {pendingRequests.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '28px 14px',
                  background: '#faf9f5',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-light)',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                }}
              >
                No pending requests. As vetted investors inspect your brief, their introduction requests will appear here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '16px',
                      background: '#fcfaf6',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--bg-dark)' }}>
                          {req.investor_name}
                        </div>
                        {req.investor_firm && (
                          <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                            {req.investor_firm}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          background: '#fcf4e6',
                          color: 'var(--accent-gold)',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        Awaiting Consent
                      </span>
                    </div>

                    {req.request_note && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '10px',
                          background: '#ffffff',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontStyle: 'italic',
                          color: 'var(--text-main)',
                          border: '1px solid #eee7da',
                        }}
                      >
                        "{req.request_note}"
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                      <button
                        onClick={() => handleConsent(req.id, true)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          background: 'var(--accent-green)',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '12.5px',
                        }}
                      >
                        Accept & Connect
                      </button>
                      <button
                        onClick={() => handleConsent(req.id, false)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          background: '#ffffff',
                          border: '1px solid var(--border-light)',
                          color: 'var(--text-muted)',
                          fontSize: '12.5px',
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Connected Conversations */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '18px', color: 'var(--bg-dark)', marginBottom: '8px' }}>
              Connected Conversations ({activeConnections.length})
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Parties with mutual consent. Direct in-app messaging is active.
            </p>

            {activeConnections.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 14px',
                  background: '#faf9f5',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-light)',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                }}
              >
                No active connections yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeConnections.map((conn) => (
                  <div
                    key={conn.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px',
                      background: '#fcfaf6',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--bg-dark)' }}>
                        {conn.investor_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {conn.investor_firm || 'Independent Syndicate'}
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenChat(conn.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        background: 'var(--bg-dark)',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      Open Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
