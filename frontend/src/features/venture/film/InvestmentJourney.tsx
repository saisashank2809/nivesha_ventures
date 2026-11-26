import React, { useEffect, useState } from 'react';
import { formatINR } from '../../../shared/formatters';
import { FilmVentureViewModel } from './filmVentureModel';

interface InvestmentJourneyProps {
  model: FilmVentureViewModel;
}

export const InvestmentJourney: React.FC<InvestmentJourneyProps> = ({ model }) => {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() =>
    typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefersReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const capitalLabel = model.selectedCapital ? formatINR(model.selectedCapital) : formatINR(model.capitalSought);
  const spendSummary =
    model.spendItems.length > 0
      ? model.spendItems.slice(0, 3).map((s) => `${s.label} (${s.amount})`).join(' · ')
      : 'Filming & post-production deployment';

  return (
    <section id="sec-money" className="nv-story-band nv-band-conduit">
      <div className="nv-film-wrap">
        <span className="nv-zone-kicker">Follow Your Money</span>
        <h2 className="nv-story-h2">
          How {capitalLabel} Travels From Commitment to Potential Recovery
        </h2>
        <p className="nv-story-sub">
          {model.conflictSummary}
        </p>

        <div className="nv-conduit-shell">
          {/* Desktop Continuous SVG Conduit (with static accessibility and reduced-motion gate) */}
          <svg
            className="nv-conduit-desktop"
            viewBox="0 0 1000 325"
            role="img"
            aria-label={`Money flow diagram for ${capitalLabel} showing filming allocation, repayment bottleneck, and possible recovery or capital loss`}
          >
            <defs>
              <marker id="nvArrG" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a" />
              </marker>
              <marker id="nvArrR" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
              </marker>
            </defs>

            <line x1="255" y1="20" x2="255" y2="305" stroke="rgba(15,23,42,0.06)" strokeDasharray="4 4" />
            <line x1="505" y1="20" x2="505" y2="305" stroke="rgba(15,23,42,0.06)" strokeDasharray="4 4" />
            <line x1="725" y1="20" x2="725" y2="305" stroke="rgba(15,23,42,0.06)" strokeDasharray="4 4" />

            <text x="135" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">1. CAPITAL ENTRY</text>
            <text x="380" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">2. PRODUCTION &amp; RELEASE</text>
            <text x="615" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#b45309">
              {model.hasRepaymentConflict ? '3. REPAYMENT BOTTLENECK' : '3. DEDUCTIONS FIRST'}
            </text>
            <text x="855" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">4. OUTCOME PATHS</text>

            <path d="M 85 148 L 280 148" className="nv-pipe-base" />
            <path d="M 280 148 C 315 148, 315 96, 355 96 L 420 96 C 455 96, 460 148, 490 148" className="nv-pipe-base" style={{ strokeWidth: 9 }} />
            <path d="M 280 148 L 490 148" className="nv-pipe-base" style={{ strokeWidth: 8 }} />
            <path d="M 280 148 C 315 148, 315 200, 355 200 L 420 200 C 455 200, 460 148, 490 148" className="nv-pipe-base" style={{ strokeWidth: 6 }} />
            <path d="M 490 148 L 685 148" stroke="#fde68a" strokeWidth="18" strokeLinecap="round" fill="none" />
            <path d="M 490 148 L 685 148" stroke="#d97706" strokeWidth="4" strokeDasharray="6 6" fill="none" />
            <path d="M 685 148 C 715 148, 720 103, 748 103" className="nv-pipe-base" style={{ strokeWidth: 8 }} />
            <path d="M 685 148 C 715 148, 720 206, 748 206" className="nv-pipe-base" style={{ strokeWidth: 8 }} />

            <path d="M 85 148 L 280 148" className="nv-pipe-flow" />
            <path d="M 280 148 C 315 148, 315 96, 355 96 L 420 96 C 455 96, 460 148, 490 148" className="nv-pipe-flow" />
            <path d="M 280 148 L 490 148" className="nv-pipe-flow" />
            <path d="M 685 148 C 715 148, 720 103, 748 103" className="nv-pipe-green" markerEnd="url(#nvArrG)" />
            <path d="M 685 148 C 715 148, 720 206, 748 206" className="nv-pipe-red" markerEnd="url(#nvArrR)" />

            {!prefersReduced && (
              <circle cx="0" cy="0" r="6.5" fill="#0066cc">
                <animateMotion dur="3.6s" repeatCount="indefinite" path="M 85 148 L 280 148 L 490 148 L 685 148" />
              </circle>
            )}

            <rect x="40" y="112" width="152" height="72" rx="14" fill="#0f172a" />
            <text x="116" y="140" textAnchor="middle" fontSize="18" fontWeight="700" fill="#ffffff">
              {capitalLabel}
            </text>
            <text x="116" y="158" textAnchor="middle" fontSize="11" fill="#94a3b8">
              {model.selectedUnits} unit{model.selectedUnits > 1 ? 's' : ''} · No escrow yet
            </text>
            <text x="116" y="174" textAnchor="middle" fontSize="10" fill="#38bdf8">
              0% Film IP Ownership
            </text>

            {(model.spendItems.length > 0 ? model.spendItems.slice(0, 3) : [{ label: 'Production', amount: formatINR(model.capitalSought) }]).map((sp, i) => {
              const yPos = [82, 134, 186][i] || 134;
              return (
                <g key={sp.label}>
                  <rect x="330" y={yPos} width="124" height="28" rx="14" fill={i === 2 ? '#f1f5f9' : '#eff6ff'} stroke={i === 2 ? '#cbd5e1' : '#93c5fd'} />
                  <text x="392" y={yPos + 18} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={i === 2 ? '#334155' : '#1e3a8a'}>
                    {sp.label.split('&')[0].trim()} · {sp.amount}
                  </text>
                </g>
              );
            })}
            <text x="392" y="246" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#475569">
              {model.milestones[2]?.detail || 'Release target pending'}
            </text>

            <polygon points="615,96 672,148 615,200 558,148" fill="#fffbeb" stroke="#d97706" strokeWidth="2.5" />
            <text x="615" y="142" textAnchor="middle" fontSize="11" fontWeight="700" fill="#92400e">P&amp;A FIRST</text>
            <text x="615" y="158" textAnchor="middle" fontSize="10" fontWeight="600" fill="#b45309">Uncapped</text>

            {model.hasRepaymentConflict && (
              <g>
                <rect x="528" y="218" width="174" height="58" rx="10" fill="#fef2f2" stroke="#fca5a5" />
                <text x="615" y="237" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#991b1b">Conflicting Priority:</text>
                <text x="615" y="252" textAnchor="middle" fontSize="10" fill="#7f1d1d">60% Pool (Note) vs.</text>
                <text x="615" y="266" textAnchor="middle" fontSize="10" fill="#7f1d1d">100% OTT First-Out</text>
              </g>
            )}

            <rect x="748" y="66" width="222" height="76" rx="14" fill="#ecfdf5" stroke="#16a34a" strokeWidth="1.8" />
            <text x="859" y="90" textAnchor="middle" fontSize="12" fontWeight="700" fill="#14532d">Potential Recovery</text>
            <text x="859" y="108" textAnchor="middle" fontSize="10.5" fill="#166534">Return of {capitalLabel} + profit split</text>
            <text x="859" y="125" textAnchor="middle" fontSize="9.5" fill="#15803d">Requires signed terms · No ROI</text>

            <rect x="748" y="168" width="222" height="76" rx="14" fill="#fef2f2" stroke="#dc2626" strokeWidth="1.5" />
            <text x="859" y="192" textAnchor="middle" fontSize="12" fontWeight="700" fill="#7f1d1d">Shortfall / Loss Risk</text>
            <text x="859" y="210" textAnchor="middle" fontSize="10.5" fill="#991b1b">Delayed, partial or 0% on {capitalLabel}</text>
            <text x="859" y="227" textAnchor="middle" fontSize="9.5" fill="#b91c1c">High P&amp;A or weak receipts absorb</text>
          </svg>

          {/* Mobile Vertical Conduit Fallback */}
          <div className="nv-conduit-mobile" aria-label="Mobile capital journey steps">
            <div className="nv-cm-step">
              <div className="nv-cm-rail"><div className="nv-cm-dot">1</div><div className="nv-cm-line" /></div>
              <div className="nv-cm-body">
                <strong>{capitalLabel} Enters Production</strong>
                <span>No confirmed escrow · 0% Film Copyright (IP)</span>
              </div>
            </div>
            <div className="nv-cm-step">
              <div className="nv-cm-rail"><div className="nv-cm-dot">2</div><div className="nv-cm-line" /></div>
              <div className="nv-cm-body">
                <strong>Production &amp; Target Release</strong>
                <span>{spendSummary}</span>
              </div>
            </div>
            <div className="nv-cm-step">
              <div className="nv-cm-rail"><div className="nv-cm-dot warn">!</div><div className="nv-cm-line" /></div>
              <div className="nv-cm-body">
                <strong style={{ color: '#b45309' }}>Bottleneck: P&amp;A Deducts First (No Cap)</strong>
                <span>{model.conflictSummary}</span>
              </div>
            </div>
            <div className="nv-cm-step">
              <div className="nv-cm-rail"><div className="nv-cm-dot ok">3</div></div>
              <div className="nv-cm-body">
                <strong>Outcome Depends on Net Surplus After P&amp;A</strong>
                <span>Surplus allows recovery of {capitalLabel}; shortfall risks partial or total loss.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
