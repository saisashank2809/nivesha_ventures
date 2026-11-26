import React from 'react';
import { formatINR } from '../../../shared/formatters';
import { FilmVentureViewModel } from './filmVentureModel';

interface InvestorCompatibilityProps {
  model: FilmVentureViewModel;
  loadingMatch?: boolean;
}

export const InvestorCompatibility: React.FC<InvestorCompatibilityProps> = ({ model, loadingMatch = false }) => {
  const { matchCase, mandate, cleanEnumText, aiContext } = model;

  if (loadingMatch) {
    return (
      <section id="sec-fit" className="nv-story-band nv-band-fit">
        <div className="nv-film-wrap">
          <div className="nv-fit-split">
            <div>
              <span className="nv-zone-kicker">Investor Suitability</span>
              <h2 className="nv-story-h2">Checking Your Mandate Match...</h2>
            </div>
            <p className="nv-story-sub" style={{ margin: 0 }}>
              Comparing venture structure, corridor, and ticket range against your saved Investor Mandate.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!matchCase && !mandate) {
    return (
      <section id="sec-fit" className="nv-story-band nv-band-fit">
        <div className="nv-film-wrap">
          <div className="nv-fit-split">
            <div>
              <span className="nv-zone-kicker">Investor Suitability</span>
              <h2 className="nv-story-h2">Personalised Mandate Matching</h2>
            </div>
            <p className="nv-story-sub" style={{ margin: 0 }}>
              Sign in with an active Investor Mandate to compare sector, ticket sizing, location, and acceptable structure rules against this venture.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const outcomeTone =
    matchCase?.outcome === 'POTENTIALLY_SUITABLE' && !(matchCase.mandatory_mismatches?.length > 0)
      ? 'verified'
      : matchCase?.mandatory_mismatches?.length
      ? 'risk'
      : 'partial';

  const outcomeLabel =
    matchCase?.mandatory_mismatches?.length
      ? 'Mandate Mismatch'
      : matchCase?.outcome === 'POTENTIALLY_SUITABLE'
      ? 'Potentially Suitable'
      : 'Review Trade-Offs';

  const reasons = matchCase?.compatibility_reasons || [];
  const mismatches = matchCase?.mandatory_mismatches || [];
  const tradeOffs = matchCase?.trade_offs || [];
  const ticketRange =
    mandate?.ticket_min && mandate?.ticket_max
      ? `${formatINR(mandate.ticket_min)} – ${formatINR(mandate.ticket_max)}`
      : null;

  return (
    <section id="sec-fit" className="nv-story-band nv-band-fit">
      <div className="nv-film-wrap">
        <div className="nv-fit-split">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span className="nv-zone-kicker" style={{ marginBottom: 0 }}>
                Mandate Match{mandate?.firm_name ? ` · ${mandate.firm_name}` : ''}
              </span>
              <span className={`nv-status-pill ${outcomeTone}`}>{outcomeLabel}</span>
            </div>
            <h2 className="nv-story-h2">Is This Film Right for Your Portfolio?</h2>
            <p className="nv-story-sub">
              {aiContext?.matchExplanation ||
                (mismatches.length > 0
                  ? cleanEnumText(mismatches[0])
                  : tradeOffs.length > 0
                  ? cleanEnumText(tradeOffs[0])
                  : 'Evaluated deterministically against your saved sector, corridor, ticket, and structure rules.')}
            </p>
            {ticketRange && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-subtle)' }}>
                Your ticket mandate: <strong style={{ color: 'var(--text-main)' }}>{ticketRange}</strong>
              </div>
            )}
          </div>

          <div className="nv-fit-checklist">
            {reasons.slice(0, 3).map((r, idx) => (
              <div key={`r-${idx}`} className="nv-fit-row">
                <strong>✓ Aligned Criterion</strong>
                <span>{cleanEnumText(r)}</span>
              </div>
            ))}
            {mismatches.map((m, idx) => (
              <div key={`m-${idx}`} className="nv-fit-row danger">
                <strong>✕ Mandatory Mismatch</strong>
                <span>{cleanEnumText(m)}</span>
              </div>
            ))}
            {tradeOffs.map((t, idx) => (
              <div key={`t-${idx}`} className="nv-fit-row warn">
                <strong>! Mandate Trade-Off</strong>
                <span>{cleanEnumText(t)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
