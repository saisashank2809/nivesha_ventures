import React from 'react';
import { VentureCard as VentureCardType } from '../shared/types';
import { formatINR } from '../shared/formatters';

interface VentureCardProps {
  venture: VentureCardType;
  onSelect: (venture: VentureCardType) => void;
  onRequestConnection?: (venture: VentureCardType) => void;
  onOpenChat?: (connectionId: string) => void;
}

export const VentureCard: React.FC<VentureCardProps> = ({
  venture,
  onSelect,
  onRequestConnection,
  onOpenChat,
}) => {
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
        {/* Card Header: Sector & Verification Badge */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e3d6bf',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fbf8f2',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#7a5c2e',
            }}
          >
            {venture.sector} · {venture.stage}
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
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
              fontSize: '22px',
              fontWeight: 500,
              lineHeight: 1.25,
              color: '#121a29',
            }}
          >
            {venture.company_name}
          </h3>

          <div style={{ fontSize: '12px', color: '#7a5c2e', marginBottom: '10px' }}>
            {venture.founder_name} {venture.founder_title ? `· ${venture.founder_title}` : ''} ({venture.location})
          </div>

          <p
            style={{
              margin: '0 0 16px 0',
              fontSize: '13px',
              lineHeight: 1.55,
              color: '#4c5262',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '40px',
            }}
          >
            {venture.tag_line || venture.business_context}
          </p>

          {/* Key Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              backgroundColor: '#f5efe5',
              border: '1px solid #e3d6bf',
              padding: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4c5262', fontWeight: 500 }}>
                Round Target
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#121a29', marginTop: '2px' }}>
                {formatINR(venture.capital_target)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4c5262', fontWeight: 500 }}>
                Check Size Range
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#7a5c2e', marginTop: '3px' }}>
                {formatINR(venture.ticket_min)} – {formatINR(venture.ticket_max)}
              </div>
            </div>
          </div>

          {/* Traction Highlights */}
          {venture.traction_metrics && venture.traction_metrics.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
              {venture.traction_metrics.slice(0, 3).map((metric, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '11px',
                    padding: '3px 7px',
                    backgroundColor: '#fff',
                    border: '1px solid #d6c9b2',
                    color: '#121a29',
                  }}
                >
                  <strong style={{ color: '#7a5c2e' }}>{metric.label}:</strong> {metric.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid #e3d6bf',
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
            background: 'none',
            border: 'none',
            color: '#7a5c2e',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          View Diligence Brief →
        </button>

        {venture.connection_status === 'CONNECTED' ? (
          <button
            type="button"
            onClick={() => onOpenChat && venture.connection_id && onOpenChat(venture.connection_id)}
            style={{
              padding: '6px 14px',
              backgroundColor: '#0c1826',
              color: '#f5efe5',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>💬</span> Message Founder
          </button>
        ) : venture.connection_status === 'REQUESTED' ? (
          <span
            style={{
              padding: '6px 10px',
              backgroundColor: '#f5efe5',
              border: '1px solid #b39463',
              color: '#7a5c2e',
              fontSize: '12px',
              fontWeight: 600,
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
              backgroundColor: '#121a29',
              color: '#f5efe5',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Request Connection
          </button>
        )}
      </div>
    </article>
  );
};
