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
        backgroundColor: '#0c1826',
        border: '1px solid #1e2d3f',
        boxShadow: '0 12px 32px -8px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* ── Cinematic Hero Image ── */}
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={heroUrl}
          alt={venture.company_name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* dark gradient overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(12,24,38,0.15) 0%, rgba(12,24,38,0.75) 70%, rgba(12,24,38,1) 100%)',
          }}
        />
        {/* top-left badge strip */}
        <div
          style={{
            position: 'absolute', top: '12px', left: '12px',
            display: 'flex', gap: '6px', alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#f5c842',
              backgroundColor: 'rgba(12,24,38,0.7)', backdropFilter: 'blur(4px)',
              padding: '3px 8px', borderRadius: '2px',
              border: '1px solid rgba(245,200,66,0.4)',
            }}
          >
            🎬 {venture.sector}
          </span>
          <span
            style={{
              fontSize: '10px', fontWeight: 600,
              backgroundColor: venture.verification_status === 'VERIFIED'
                ? 'rgba(21,128,61,0.85)' : 'rgba(180,83,9,0.85)',
              color: '#fff', padding: '3px 7px', borderRadius: '2px',
              backdropFilter: 'blur(4px)',
            }}
          >
            {venture.verification_status === 'VERIFIED' ? '✓ Verified' : 'In Diligence'}
          </span>
        </div>
        {/* stage pill top-right */}
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <span
            style={{
              fontSize: '10px', fontWeight: 600, color: '#c9b48a',
              backgroundColor: 'rgba(12,24,38,0.7)', backdropFilter: 'blur(4px)',
              padding: '3px 8px', borderRadius: '2px',
              border: '1px solid rgba(201,180,138,0.35)',
            }}
          >
            {venture.stage || 'Production'}
          </span>
        </div>
        {/* bottom overlay: title + tagline */}
        <div style={{ position: 'absolute', bottom: '12px', left: '14px', right: '14px' }}>
          <h3
            style={{
              margin: 0, lineHeight: 1.2, color: '#f5efe5',
              fontFamily: "Newsreader, Georgia, serif",
              fontSize: '20px', fontWeight: 600,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {venture.company_name}
          </h3>
          <p
            style={{
              margin: '4px 0 0 0', fontSize: '12px', color: '#c9b48a',
              lineHeight: 1.4, opacity: 0.9,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
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
          borderBottom: '1px solid #1e2d3f',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}
      >
        <div
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: '#1e2d3f', border: '1px solid #2e4059',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: '#c9b48a',
            fontFamily: "Newsreader, Georgia, serif", flexShrink: 0,
          }}
        >
          {venture.founder_name.charAt(0)}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.3 }}>
          <span style={{ color: '#c9b48a', fontWeight: 600 }}>{venture.founder_name}</span>
          {venture.founder_title ? <span style={{ color: '#64748b' }}> · {venture.founder_title}</span> : null}
          <span style={{ color: '#475569' }}> · {venture.location}</span>
        </div>
      </div>

      {/* ── 3-figure production budget strip ── */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '1px solid #1e2d3f',
        }}
      >
        {[
          { label: 'Project Budget', value: formatINR(venture.capital_target ? venture.capital_target * 2 : 0) || '₹12 Cr', sub: 'Total production cost' },
          { label: 'Capital Sought', value: formatINR(venture.capital_target), sub: 'Investor raise' },
          { label: 'Per Unit', value: formatINR(venture.ticket_min), sub: 'Min ticket size' },
        ].map((fig, i) => (
          <div
            key={i}
            style={{
              padding: '12px 10px',
              borderRight: i < 2 ? '1px solid #1e2d3f' : 'none',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', fontWeight: 600, marginBottom: '3px' }}>
              {fig.label}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#f5efe5', fontFamily: "Newsreader, Georgia, serif" }}>
              {fig.value}
            </div>
            <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>{fig.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Traction metrics chips ── */}
      {topMetrics.length > 0 && (
        <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '5px', borderBottom: '1px solid #1e2d3f' }}>
          {topMetrics.map((m, i) => {
            const s = getStatusStyle(m.status);
            return (
              <span
                key={i}
                style={{
                  fontSize: '10.5px', padding: '3px 8px', borderRadius: '2px',
                  backgroundColor: 'rgba(30,45,63,0.8)',
                  border: `1px solid ${s.border}`,
                  color: s.text,
                }}
              >
                <strong>{m.label}:</strong> {m.value}
                {m.period ? <span style={{ color: '#475569' }}> · {m.period}</span> : null}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Open question callout ── */}
      <div
        style={{
          margin: '0 14px 0 14px',
          marginTop: '12px',
          padding: '9px 12px',
          backgroundColor: 'rgba(245,200,66,0.07)',
          border: '1px solid rgba(245,200,66,0.2)',
          borderRadius: '3px',
          fontSize: '11.5px',
          color: '#c9b48a',
          lineHeight: 1.45,
        }}
      >
        <span style={{ fontWeight: 700, color: '#f5c842' }}>⚠ Open:</span>{' '}
        When the film earns, who gets paid first? Payout schedule not yet confirmed.
      </div>

      {/* ── Footer actions ── */}
      <div
        style={{
          padding: '12px 14px',
          marginTop: '12px',
          borderTop: '1px solid #1e2d3f',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => onSelect(venture)}
          style={{
            background: 'none', border: 'none',
            color: '#c9b48a', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', padding: 0,
            textDecoration: 'underline', textUnderlineOffset: '3px',
          }}
        >
          Explore the film venture →
        </button>

        {isConnected ? (
          <button
            type="button"
            onClick={() => onOpenChat && venture.connection_id && onOpenChat(venture.connection_id)}
            style={{
              padding: '6px 14px',
              backgroundColor: '#15803d', color: '#fff',
              border: 'none', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', borderRadius: '2px',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <span>💬</span> Chat
          </button>
        ) : isRequested ? (
          <span
            style={{
              padding: '6px 10px',
              backgroundColor: 'rgba(30,45,63,0.8)',
              border: '1px solid #2e4059', color: '#64748b',
              fontSize: '11px', fontWeight: 600, borderRadius: '2px',
            }}
          >
            ⌛ Requested
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onRequestConnection && onRequestConnection(venture)}
            style={{
              padding: '6px 14px',
              backgroundColor: '#f5c842', color: '#0c1826',
              border: 'none', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', borderRadius: '2px',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
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
