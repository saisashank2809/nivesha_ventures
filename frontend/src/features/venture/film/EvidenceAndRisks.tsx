import React, { useState } from 'react';
import { FilmVentureViewModel } from './filmVentureModel';

interface EvidenceAndRisksProps {
  model: FilmVentureViewModel;
}

export const EvidenceAndRisks: React.FC<EvidenceAndRisksProps> = ({ model }) => {
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'NEEDS_CHECK'>('ALL');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const { evidenceChecks, materialRisks, tenSections, aiContext } = model;
  const verifiedCount = evidenceChecks.filter((e) => e.tone === 'verified').length;
  const needsCheckCount = evidenceChecks.filter((e) => e.tone !== 'verified').length;

  const filtered = evidenceChecks.filter((item) => {
    if (filter === 'VERIFIED') return item.tone === 'verified';
    if (filter === 'NEEDS_CHECK') return item.tone !== 'verified';
    return true;
  });

  return (
    <section id="sec-evidence" className="nv-story-band nv-band-mist">
      <div className="nv-film-wrap">
        <div className="nv-ev-risk-grid">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <div>
                <span className="nv-zone-kicker">Diligence Evidence</span>
                <h2 className="nv-story-h2" style={{ fontSize: '21px' }}>Document &amp; Agreement Checks ({evidenceChecks.length})</h2>
              </div>
              <div className="nv-filter-row" role="group" aria-label="Filter evidence checks" style={{ marginBottom: 0 }}>
                <button type="button" onClick={() => setFilter('ALL')} className={`nv-filter-chip ${filter === 'ALL' ? 'active' : ''}`}>
                  All ({evidenceChecks.length})
                </button>
                <button type="button" onClick={() => setFilter('VERIFIED')} className={`nv-filter-chip ${filter === 'VERIFIED' ? 'active' : ''}`}>
                  Verified / Supported ({verifiedCount})
                </button>
                <button type="button" onClick={() => setFilter('NEEDS_CHECK')} className={`nv-filter-chip ${filter === 'NEEDS_CHECK' ? 'active' : ''}`}>
                  Partly / Unresolved ({needsCheckCount})
                </button>
              </div>
            </div>

            {aiContext?.evidenceSummary && (
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '10px' }}>{aiContext.evidenceSummary}</p>
            )}

            <div className="nv-z4-evidence-list">
              {filtered.length > 0 ? (
                filtered.map((ev) => {
                  const isOpen = expandedKey === ev.key;
                  return (
                    <div key={ev.key} className="nv-z4-ev-item">
                      <button
                        type="button"
                        onClick={() => setExpandedKey(isOpen ? null : ev.key)}
                        className="nv-evidence-toggle-btn"
                        aria-expanded={isOpen}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontWeight: 600, color: 'var(--text-main)' }}>
                          <span className={`nv-ev-dot ${ev.tone}`} aria-hidden="true" />
                          <span>{ev.label}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{isOpen ? '▴' : '▾'}</span>
                        </span>
                        <span className={`nv-status-pill ${ev.tone}`}>{ev.statusLabel}</span>
                      </button>
                      {isOpen && <div className="nv-z4-ev-detail">{ev.details}</div>}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '14px 4px', fontSize: '13px', color: 'var(--text-subtle)' }}>
                  No diligence items match this filter or none uploaded on file yet.
                </div>
              )}
            </div>

            <details className="nv-film-accordion" style={{ marginTop: '12px' }}>
              <summary>
                <span>Inspect Full 10-Section Reference Dossier ({tenSections.length})</span>
                <span style={{ color: 'var(--accent-blue)' }}>Expand ▾</span>
              </summary>
              <div className="nv-film-acc-body">
                <div className="nv-film-dossier-grid">
                  {tenSections.map((sec) => (
                    <div key={sec.num} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', paddingBottom: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '2px' }}>
                        {sec.num}. {sec.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sec.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>

          <div className="nv-risk-alert-panel" aria-label="Material risks and missing safeguards">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="nv-zone-kicker" style={{ color: '#991b1b', marginBottom: 0 }}>Always Visible</span>
              <span className="nv-status-pill risk">{materialRisks.length} Key Risks</span>
            </div>
            <h3 style={{ fontSize: '18px', color: '#7f1d1d', marginBottom: '10px' }}>Material Risks &amp; Contradictions</h3>
            <ul className="nv-risk-bullets">
              {materialRisks.map((rk, i) => (
                <li key={rk.title}>
                  <strong>{i + 1}. {rk.title}:</strong> {rk.summary}
                </li>
              ))}
            </ul>
            {(aiContext?.contradictionHighlights || []).map((c, idx) => (
              <div key={idx} style={{ marginTop: '8px', fontSize: '12.5px', color: '#7f1d1d', borderTop: '1px solid rgba(220,38,38,0.16)', paddingTop: '6px' }}>
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
