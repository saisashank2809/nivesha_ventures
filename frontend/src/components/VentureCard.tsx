import React from 'react';
import { VentureCard as VentureCardType } from '../shared/types';
import { formatINR } from '../shared/formatters';

interface VentureCardProps {
  venture: VentureCardType;
  onSelect: (venture: VentureCardType) => void;
  onRequestConnection?: (venture: VentureCardType) => void;
  onOpenChat?: (connectionId: string) => void;
}

// ─── helpers ───────────────────────────────────────────────────────────────
const isFilm = (v: VentureCardType) =>
  /film|cinema|motion picture|creative media|entertainment/i.test(v.sector || '');

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  VERIFIED:          { bg: '#edf5ee', text: '#15803d', border: '#b8deb9' },
  PARTLY_VERIFIED:   { bg: '#fef9ee', text: '#b45309', border: '#f3d99e' },
  OPEN_QUESTION:     { bg: '#fef3f2', text: '#b91c1c', border: '#fca5a5' },
  default:           { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};
const getStatusStyle = (s?: string) =>
  statusColor[s ?? ''] ?? statusColor.default;

// ─── Film-specific card ─────────────────────────────────────────────────────
const FilmVentureCard: React.FC<VentureCardProps> = ({ venture, onSelect, onRequestConnection, onOpenChat }) => {
  const heroUrl =
    venture.hero_image_url ||
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=900&q=80';

  const topMetrics = (venture.traction_metrics || []).slice(0, 3);
  const isConnected = venture.connection_status === 'CONNECTED';
  const isRequested = venture.connection_status === 'REQUESTED';

  return (
    <article
      style={{
        backgroundColor: '#fffdf9',
        border: '1px solid #cdbca0',
        borderTop: '3px solid #6d2832',
        borderRadius: '8px',
        boxShadow: '0 8px 24px -10px rgba(12, 24, 38, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ── Cinematic Hero Image ── */}
      <div style={{ position: 'relative', height: '190px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#0c1826' }}>
        <img
          src={heroUrl}
          alt={venture.company_name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(12,24,38,0.18) 0%, rgba(12,24,38,0.82) 100%)',
          }}
        />
        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#6d2832',
              backgroundColor: '#faf1f2',
              padding: '3px 8px',
              borderRadius: '3px',
              border: '1px solid #ddb9be',
            }}
          >
            🎬 Featured · Film Production
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#f5efe5',
              backgroundColor: 'rgba(12,24,38,0.78)',
              padding: '3px 8px',
              borderRadius: '3px',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {venture.stage || 'Production'}
          </span>
        </div>
        <div style={{ position: 'absolute', bottom: '12px', left: '14px', right: '14px' }}>
          <h3
            style={{
              margin: 0,
              lineHeight: 1.2,
              color: '#fffdf9',
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: '21px',
              fontWeight: 600,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {venture.company_name}
          </h3>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '12px',
              color: '#f5efe5',
              lineHeight: 1.4,
              opacity: 0.92,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {venture.tag_line || venture.business_context}
          </p>
        </div>
      </div>

      {/* ── Founder line ── */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #e6dccb',
          backgroundColor: '#fbf8f2',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#0c1826',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: '#f5efe5',
            fontFamily: 'Newsreader, Georgia, serif',
            flexShrink: 0,
          }}
        >
          {venture.founder_name.charAt(0)}
        </div>
        <div style={{ fontSize: '12px', color: '#4c5262', lineHeight: 1.3 }}>
          <strong style={{ color: '#0c1826' }}>{venture.founder_name}</strong>
          {venture.founder_title ? <span> · {venture.founder_title}</span> : null}
          <span style={{ color: '#7a5c2e' }}> · {venture.location}</span>
        </div>
      </div>

      {/* ── 3-figure production budget strip ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '1px solid #e6dccb',
          backgroundColor: '#faf6ee',
        }}
      >
        {[
          { label: 'Project Budget', value: formatINR((venture.arrangement_details as any)?.total_budget || (venture.capital_target ? venture.capital_target * 2 : 0)), sub: 'Declared total' },
          { label: 'Capital Sought', value: formatINR(venture.capital_target), sub: 'External raise' },
          { label: 'Per Unit', value: formatINR(venture.ticket_min), sub: 'Proposed unit' },
        ].map((fig, i) => (
          <div
            key={i}
            style={{
              padding: '11px 10px',
              borderRight: i < 2 ? '1px solid #e6dccb' : 'none',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7a5c2e', fontWeight: 700, marginBottom: '2px' }}>
              {fig.label}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0c1826', fontFamily: 'Newsreader, Georgia, serif' }}>
              {fig.value}
            </div>
            <div style={{ fontSize: '9.5px', color: '#685d4d', marginTop: '2px' }}>{fig.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Traction metrics chips ── */}
      {topMetrics.length > 0 && (
        <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '5px', borderBottom: '1px solid #f1ece2' }}>
          {topMetrics.map((m, i) => {
            const s = getStatusStyle(m.status);
            return (
              <span
                key={i}
                style={{
                  fontSize: '10.5px',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  backgroundColor: '#ffffff',
                  border: `1px solid ${s.border}`,
                  color: s.text,
                }}
              >
                <strong>{m.label}:</strong> {m.value}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Open question callout ── */}
      <div
        style={{
          margin: '12px 14px 0 14px',
          padding: '9px 12px',
          backgroundColor: '#fdf2f2',
          borderLeft: '3px solid #991b1b',
          borderRadius: '0 4px 4px 0',
          fontSize: '11.5px',
          color: '#3f1d1d',
          lineHeight: 1.45,
        }}
      >
        <span style={{ fontWeight: 700, color: '#991b1b' }}>Open Decision:</span>{' '}
        When the film earns money, who gets paid first? Payout waterfall requires signed deal terms.
      </div>

      {/* ── Footer actions ── */}
      <div
        style={{
          padding: '12px 14px',
          marginTop: '12px',
          borderTop: '1px solid #e6dccb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#fffdf9',
        }}
      >
        <button
          type="button"
          onClick={() => onSelect(venture)}
          style={{
            padding: '7px 14px',
            backgroundColor: '#0c1826',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Explore the film venture →
        </button>

        {isConnected ? (
          <button
            type="button"
            onClick={() => onOpenChat && venture.connection_id && onOpenChat(venture.connection_id)}
            style={{
              padding: '7px 12px',
              backgroundColor: '#15803d',
              color: '#fff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span>💬</span> Chat
          </button>
        ) : isRequested ? (
          <span
            style={{
              padding: '6px 10px',
              backgroundColor: '#faf6ee',
              border: '1px solid #d6c9b2',
              color: '#7a5c2e',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
            }}
          >
            ⌛ Requested
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onRequestConnection && onRequestConnection(venture)}
            style={{
              padding: '7px 12px',
              backgroundColor: '#faf6ee',
              color: '#0c1826',
              border: '1px solid #c5b59b',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            Request payout schedule
          </button>
        )}
      </div>
    </article>
  );
};

// ─── Default (non-film) card — unchanged layout ─────────────────────────────
const DefaultVentureCard: React.FC<VentureCardProps> = ({ venture, onSelect, onRequestConnection, onOpenChat }) => {
  const isConnected = venture.connection_status === 'CONNECTED';
  const isRequested = venture.connection_status === 'REQUESTED';

  return (
    <article
      style={{
        backgroundColor: '#fffdf9',
        border: '1px solid #d6c9b2',
        boxShadow: '0 8px 24px -12px rgba(12, 24, 38, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        boxSizing: 'border-box',
      }}
    >
      <div>
        {/* Card Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e3d6bf',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#fbf8f2',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a5c2e' }}>
            {venture.sector} · {venture.stage}
          </span>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 600, padding: '3px 8px',
              backgroundColor: venture.verification_status === 'VERIFIED' ? '#0c1826' : '#7a5c2e',
              color: '#f5efe5',
            }}
          >
            {venture.verification_status === 'VERIFIED' ? '✓ Verified Diligence' : 'In Diligence'}
          </span>
        </div>

        {/* Card Body */}
        <div style={{ padding: '20px' }}>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
              fontSize: '22px', fontWeight: 500, lineHeight: 1.25, color: '#121a29',
            }}
          >
            {venture.company_name}
          </h3>
          <div style={{ fontSize: '12px', color: '#7a5c2e', marginBottom: '10px' }}>
            {venture.founder_name}{venture.founder_title ? ` · ${venture.founder_title}` : ''} ({venture.location})
          </div>
          <p
            style={{
              margin: '0 0 16px 0', fontSize: '13px', lineHeight: 1.55, color: '#4c5262',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', minHeight: '40px',
            }}
          >
            {venture.tag_line || venture.business_context}
          </p>

          {/* Metrics Grid */}
          <div
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px',
              backgroundColor: '#f5efe5', border: '1px solid #e3d6bf',
              padding: '12px', marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4c5262', fontWeight: 500 }}>Round Target</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#121a29', marginTop: '2px' }}>{formatINR(venture.capital_target)}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4c5262', fontWeight: 500 }}>Check Size Range</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#7a5c2e', marginTop: '3px' }}>
                {formatINR(venture.ticket_min)} – {formatINR(venture.ticket_max)}
              </div>
            </div>
          </div>

          {/* Traction */}
          {venture.traction_metrics && venture.traction_metrics.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
              {venture.traction_metrics.slice(0, 3).map((metric, idx) => (
                <span key={idx} style={{ fontSize: '11px', padding: '3px 7px', backgroundColor: '#fff', border: '1px solid #d6c9b2', color: '#121a29' }}>
                  <strong style={{ color: '#7a5c2e' }}>{metric.label}:</strong> {metric.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '14px 20px', borderTop: '1px solid #e3d6bf',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '8px', backgroundColor: '#fffdf9',
        }}
      >
        <button type="button" onClick={() => onSelect(venture)}
          style={{ background: 'none', border: 'none', color: '#7a5c2e', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
        >
          View Diligence Brief →
        </button>

        {isConnected ? (
          <button type="button" onClick={() => onOpenChat && venture.connection_id && onOpenChat(venture.connection_id)}
            style={{ padding: '6px 14px', backgroundColor: '#0c1826', color: '#f5efe5', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>💬</span> Message Founder
          </button>
        ) : isRequested ? (
          <span style={{ padding: '6px 10px', backgroundColor: '#f5efe5', border: '1px solid #b39463', color: '#7a5c2e', fontSize: '12px', fontWeight: 600 }}>
            ⌛ Requested
          </span>
        ) : (
          <button type="button" onClick={() => onRequestConnection && onRequestConnection(venture)}
            style={{ padding: '6px 14px', backgroundColor: '#121a29', color: '#f5efe5', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>💬</span><span>Direct DM</span>
          </button>
        )}
      </div>
    </article>
  );
};

// ─── Exported router ────────────────────────────────────────────────────────
export const VentureCard: React.FC<VentureCardProps> = (props) =>
  isFilm(props.venture)
    ? <FilmVentureCard {...props} />
    : <DefaultVentureCard {...props} />;
