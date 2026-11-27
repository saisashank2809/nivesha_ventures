import React from 'react';
import { FilmVentureViewModel } from './filmVentureModel';

interface ProductionReadinessProps {
  model: FilmVentureViewModel;
}

export const ProductionReadiness: React.FC<ProductionReadinessProps> = ({ model }) => {
  const { milestones, gallery, hasUploadedGallery } = model;

  return (
    <section id="sec-readiness" className="nv-story-band nv-band-white">
      <div className="nv-film-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div>
            <span className="nv-zone-kicker">Production Readiness</span>
            <h2 className="nv-story-h2">Verified Pre-Production Steps vs. Open Safeguards</h2>
          </div>
          <span className="nv-status-pill neutral">No Aggregate Trust Score</span>
        </div>

        <div className="nv-readiness-layout">
          <div className="nv-ms-rail" role="list" aria-label="Production stage milestones">
            {milestones.map((ms, idx) => (
              <div key={ms.id} className={`nv-ms-card ${ms.kind}`} role="listitem">
                <span className={`nv-ms-bar ${ms.kind}`} />
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '2px' }}>
                  0{idx + 1} · {ms.kind === 'done' ? 'VERIFIED' : ms.kind === 'current' ? 'CURRENT STAGE' : ms.kind === 'target' ? 'TARGET' : 'OPEN GAP'}
                </div>
                <strong style={{ display: 'block', fontSize: '13.5px', color: ms.kind === 'gap' ? '#b91c1c' : 'var(--text-main)' }}>
                  {ms.label}
                </strong>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {ms.detail}
                </span>
              </div>
            ))}
          </div>

          <div className="nv-assets-panel">
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: '8px' }}>
              {hasUploadedGallery
                ? `Uploaded Visual Assets (${gallery.length} · Illustrative Mood Stills)`
                : 'Production Assets Status'}
            </div>
            {gallery.length > 0 ? (
              <div className="nv-assets-strip">
                {gallery.slice(0, 4).map((url, idx) => (
                  <div key={url + idx} className="nv-asset-thumb">
                    <img src={url} alt={`Project mood asset ${idx + 1}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                No production stills uploaded on file yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
