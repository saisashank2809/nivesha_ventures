import React, { useEffect, useRef, useState } from 'react';
import { formatINR } from '../../../shared/formatters';
import { FilmVentureViewModel } from './filmVentureModel';

interface FundingCompositionProps {
  model: FilmVentureViewModel;
}

export const FundingComposition: React.FC<FundingCompositionProps> = ({ model }) => {
  const prefersReduced =
    typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(prefersReduced);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visible || !ref.current || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [visible]);

  const promoPct = model.promoterPctOfBudget ?? 0;
  const raisePct = model.raisePctOfBudget ?? 100;

  return (
    <section id="sec-funding" className="nv-story-band nv-band-mist">
      <div className="nv-film-wrap">
        <div className="nv-funding-split">
          <div>
            <span className="nv-zone-kicker">Capital Composition</span>
            <h2 className="nv-story-h2">
              {model.projectBudget && model.promoterShare > 0
                ? 'Declared Promoter Stake vs. External Target'
                : 'Target Raise Capital & Funding Status'}
            </h2>
            <p className="nv-story-sub">
              {model.projectBudget
                ? `Only the external target share is open to co-producers. Promoter commitments and vendor deferrals are declared figures, not verified bank balances.`
                : `Seeking ${formatINR(model.capitalSought)} as a target raise; secured funds and escrow balances are unconfirmed.`}
            </p>
          </div>

          <div ref={ref}>
            <div className="nv-funding-bar-track" role="img" aria-label="Funding breakdown between declared promoter stake and external target">
              {model.promoterShare > 0 && promoPct > 0 && (
                <div
                  className="nv-fb-seg promoter"
                  style={{ width: visible ? `${promoPct}%` : '0%' }}
                >
                  {formatINR(model.promoterShare)} Promoter &amp; Deferrals ({promoPct}%)
                </div>
              )}
              <div
                className="nv-fb-seg external"
                style={{ width: visible ? `${raisePct}%` : '0%' }}
              >
                {formatINR(model.capitalSought)} External Goal ({raisePct}%)
              </div>
            </div>

            <div className="nv-funding-notes">
              {model.promoterShare > 0 && (
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>Declared Stake Only:</strong> Not audited as deposited bank cash.
                </div>
              )}
              <div>
                <strong style={{ color: 'var(--accent-blue)' }}>Funding Target:</strong> Not yet secured; zero confirmed escrow balance on file.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
