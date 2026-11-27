import React from 'react';
import { FilmVentureViewModel } from './filmVentureModel';

interface ProducerPortfolioProps {
  model: FilmVentureViewModel;
}

export const ProducerPortfolio: React.FC<ProducerPortfolioProps> = ({ model }) => {
  const {
    producerName,
    producerTitle,
    producerFirm,
    producerAvatarUrl,
    pastProjectsText,
    pastProjectsStatusLabel,
    pastProjectsStatusTone,
    pastProjectsHasGrossMetric,
    priorReleaseCount,
  } = model;

  const initials = producerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

  const releaseSlots =
    priorReleaseCount > 0
      ? Array.from({ length: Math.min(4, priorReleaseCount) }, (_, i) => i + 1)
      : [];

  return (
    <section id="sec-producer" className="nv-story-band nv-band-mist">
      <div className="nv-film-wrap">
        <div className="nv-prod-header-split">
          <div className="nv-prod-identity">
            {producerAvatarUrl ? (
              <img src={producerAvatarUrl} alt={producerName} className="nv-prod-photo" />
            ) : (
              <div className="nv-prod-monogram" aria-label="Producer monogram; portrait not on file">
                <strong>{initials}</strong>
                <span>No Photo</span>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span className="nv-zone-kicker" style={{ marginBottom: 0 }}>Meet the Producer</span>
                <span className={`nv-status-pill ${pastProjectsStatusTone}`}>
                  Track Record: {pastProjectsStatusLabel}
                </span>
              </div>
              <h2 className="nv-story-h2" style={{ fontSize: '22px' }}>{producerName}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {producerTitle} · {producerFirm}
              </p>

              {pastProjectsText ? (
                <div className="nv-prod-metrics-row">
                  <span className="nv-prod-fact">{pastProjectsText}</span>
                  {pastProjectsHasGrossMetric && (
                    <span className="nv-status-pill partial">Box-Office Gross ≠ Investor Profit</span>
                  )}
                </div>
              ) : (
                <div className="nv-prod-metrics-row">
                  <span className="nv-prod-fact">Prior release portfolio not itemized on file.</span>
                </div>
              )}
            </div>
          </div>

          <div className="nv-poster-grid" aria-label="Declared prior releases">
            {releaseSlots.length > 0 ? (
              releaseSlots.map((num) => (
                <div key={num} className="nv-poster-slot">
                  <strong>Declared Release #{num}</strong>
                  <span>Poster &amp; net P&amp;L not uploaded on file</span>
                </div>
              ))
            ) : (
              <div className="nv-poster-slot" style={{ gridColumn: '1 / -1' }}>
                <strong>Previous Film Assets</strong>
                <span>{pastProjectsText || 'No prior film posters or audited P&L uploaded on platform.'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
