import React from 'react';
import { formatINR } from '../../../shared/formatters';
import { FilmVentureViewModel } from './filmVentureModel';

interface InvestmentParticipationSimulatorProps {
  model: FilmVentureViewModel;
  onSelectUnits: (units: number) => void;
}

export const InvestmentParticipationSimulator: React.FC<InvestmentParticipationSimulatorProps> = ({
  model,
  onSelectUnits,
}) => {
  const { ticketOptions, selectedUnits, selectedCapital, raiseSharePct, budgetSharePct, activeTier } = model;

  return (
    <section id="sec-ticket" className="nv-story-band nv-band-dark-ticket">
      <div className="nv-film-wrap">
        <span className="nv-dark-kicker">Choose Your Participation</span>
        <h2 className="nv-story-h2" style={{ color: '#ffffff' }}>
          Simulate a Contribution Across All Downstream Views
        </h2>
        <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '4px' }}>
          Selecting an amount synchronises your money journey, outcome scenarios, sticky navigation, and founder enquiry. Viewing terms does not commit capital.
        </p>

        {ticketOptions.length > 0 ? (
          <div className="nv-ticket-pills" role="group" aria-label="Select proposed investment ticket">
            {ticketOptions.map((opt) => (
              <button
                key={opt.units}
                type="button"
                aria-pressed={selectedUnits === opt.units}
                onClick={() => onSelectUnits(opt.units)}
                className={`nv-tk-btn ${selectedUnits === opt.units ? 'active' : ''}`}
              >
                <strong>{opt.amountLabel}</strong>
                <span>
                  {opt.units} unit{opt.units > 1 ? 's' : ''} · {opt.tierName}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', margin: '14px 0', fontSize: '13px', color: '#cbd5e1' }}>
            Unit pricing schedule not specified. Capital sought: {formatINR(model.capitalSought)}.
          </div>
        )}

        <div className="nv-tk-outputs">
          <div>
            <span className="nv-tk-out-lbl">Raise / Budget Share</span>
            <span className="nv-tk-out-val">
              {raiseSharePct !== null ? `${raiseSharePct}% of ${formatINR(model.capitalSought)} raise` : formatINR(selectedCapital || model.capitalSought)}
            </span>
            <span className="nv-tk-out-sub">
              {budgetSharePct !== null ? `${budgetSharePct}% of total budget (Contribution ≠ Equity %)` : 'Contribution % ≠ profit entitlement'}
            </span>
          </div>

          <div>
            <span className="nv-tk-out-lbl">Copyright Ownership</span>
            <span className="nv-tk-out-val" style={{ color: '#fcd34d' }}>0% Film Copyright (IP)</span>
            <span className="nv-tk-out-sub">Studio retains copyright &amp; negative rights</span>
          </div>

          <div>
            <span className="nv-tk-out-lbl">Proposed Film Credit</span>
            <span className="nv-tk-out-val">{activeTier ? activeTier.tierName : 'Contractual Attribution'}</span>
            <span className="nv-tk-out-sub">{activeTier ? activeTier.perks : 'As agreed in definitive contracts'}</span>
          </div>

          <div>
            <span className="nv-tk-out-lbl">Principal Downside</span>
            <span className="nv-tk-out-val" style={{ color: '#fca5a5' }}>Partial or Total Loss</span>
            <span className="nv-tk-out-sub">No guaranteed yield or fixed repayment date</span>
          </div>
        </div>
      </div>
    </section>
  );
};
