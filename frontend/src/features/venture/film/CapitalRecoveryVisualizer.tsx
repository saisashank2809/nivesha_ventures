import React from 'react';
import { formatINR } from '../../../shared/formatters';
import { FilmVentureViewModel } from './filmVentureModel';

interface CapitalRecoveryVisualizerProps {
  model: FilmVentureViewModel;
}

export const CapitalRecoveryVisualizer: React.FC<CapitalRecoveryVisualizerProps> = ({ model }) => {
  const capitalLabel = model.selectedCapital ? formatINR(model.selectedCapital) : formatINR(model.capitalSought);

  return (
    <section id="sec-recovery" className="nv-story-band nv-band-white">
      <div className="nv-film-wrap">
        <span className="nv-zone-kicker">Capital Recovery &amp; Loss Risk</span>
        <h2 className="nv-story-h2">What Happens to {capitalLabel} Under Both Release Outcomes</h2>
        {model.historicalBenchmarkText && (
          <p className="nv-story-sub">
            Industry benchmarks ({model.historicalBenchmarkText}) are historical peer comparisons only — never a projected return.
          </p>
        )}

        <div className="nv-outcome-split">
          <div className="nv-outcome-panel ok">
            <strong className="nv-out-heading">If Net Proceeds Exceed P&amp;A &amp; Prior Dues</strong>
            <p className="nv-out-desc">
              Remaining surplus after release/marketing deductions may allow return of {capitalLabel} and contract profit participation. No ROI or break-even estimate is implied.
            </p>
            <div className="nv-out-bar-row">
              <span>Receipts Pool</span>
              <div className="nv-out-track"><div className="nv-out-fill" style={{ width: '90%', backgroundColor: '#0066cc' }} /></div>
            </div>
            <div className="nv-out-bar-row">
              <span>P&amp;A (Uncapped)</span>
              <div className="nv-out-track"><div className="nv-out-fill" style={{ width: '38%', backgroundColor: '#d97706' }} /></div>
            </div>
            <div className="nv-out-bar-row">
              <span>Your {capitalLabel}</span>
              <div className="nv-out-track"><div className="nv-out-fill" style={{ width: '62%', backgroundColor: '#16a34a' }} /></div>
            </div>
          </div>

          <div className="nv-outcome-panel loss">
            <strong className="nv-out-heading">If Receipts Fall Short or P&amp;A Surges</strong>
            <p className="nv-out-desc">
              Lower footfalls, discounted digital pricing, or high publicity costs can leave zero surplus — causing delayed recovery, partial return, or total capital loss of {capitalLabel}.
            </p>
            <div className="nv-out-bar-row">
              <span>Receipts Pool</span>
              <div className="nv-out-track"><div className="nv-out-fill" style={{ width: '36%', backgroundColor: '#64748b' }} /></div>
            </div>
            <div className="nv-out-bar-row">
              <span>P&amp;A Absorbs First</span>
              <div className="nv-out-track"><div className="nv-out-fill" style={{ width: '36%', backgroundColor: '#dc2626' }} /></div>
            </div>
            <div className="nv-out-bar-row">
              <span>Your {capitalLabel}</span>
              <div className="nv-out-track"><div className="nv-out-fill" style={{ width: '10%', backgroundColor: '#dc2626' }} /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
