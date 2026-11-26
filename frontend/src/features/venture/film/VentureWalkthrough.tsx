import React, { useEffect, useMemo, useState } from 'react';
import { formatINR } from '../../../shared/formatters';
import { FilmVentureViewModel } from './filmVentureModel';

interface VentureWalkthroughProps {
  model: FilmVentureViewModel;
  isOpen: boolean;
  onClose: () => void;
}

const SCENE_MS = 5000;

export const VentureWalkthrough: React.FC<VentureWalkthroughProps> = ({ model, isOpen, onClose }) => {
  const prefersReduced =
    typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(!prefersReduced);
  const [showStaticSummary, setShowStaticSummary] = useState(prefersReduced);

  const scenes = useMemo(() => {
    const spendSummary =
      model.spendItems.length > 0
        ? model.spendItems.map((s) => `${s.label} (${s.amount})`).join(' · ')
        : 'Itemized production allocation disclosed in terms.';
    return [
      {
        tag: '01/06 · FILM OPPORTUNITY',
        title: model.venture.company_name,
        copy: model.conciseSummary,
        metrics: [
          ['Current Stage', model.venture.stage || 'Undisclosed'],
          ['Status', model.heroVerificationLabel],
        ],
      },
      {
        tag: '02/06 · FUNDING SPLIT',
        title: model.projectBudget
          ? `${formatINR(model.projectBudget)} Total · Seeking ${formatINR(model.capitalSought)}`
          : `Raising Target: ${formatINR(model.capitalSought)}`,
        copy:
          model.promoterShare > 0
            ? `${formatINR(model.promoterShare)} declared promoter/deferred contribution (not verified bank cash); ${formatINR(model.capitalSought)} external raise goal.`
            : `Seeking ${formatINR(model.capitalSought)} external financing; zero escrow confirmed on file.`,
        metrics: [
          ['Unit Entry', model.perUnit ? formatINR(model.perUnit) : 'Flexible'],
          ['Film IP Ownership', '0% Studio Retains IP'],
        ],
      },
      {
        tag: '03/06 · CAPITAL DEPLOYMENT',
        title: `Use of ${formatINR(model.capitalSought)} Raise`,
        copy: spendSummary,
        metrics: model.spendItems.slice(0, 2).map((s) => [s.amount, s.label]),
      },
      {
        tag: '04/06 · REVENUE CHANNELS',
        title: `${model.revenueChannels.length} Revenue Streams Explored`,
        copy:
          model.revenueChannels.length > 0
            ? model.revenueChannels.map((c) => `${c.title} (${c.statusLabel})`).join(' · ')
            : 'Distribution & OTT revenue details not provided on file.',
        metrics: [
          ['Signed Agreements', `${model.signedChannelCount} verified on file`],
          ['Missing Docs', `${model.missingDocuments.length} pending item(s)`],
        ],
      },
      {
        tag: '05/06 · RECOVERY & RISKS',
        title: model.hasRepaymentConflict ? 'Payout Priority Disputed · Loss Possible' : 'Unconfirmed Payout Order · Loss Possible',
        copy: model.conflictSummary,
        metrics: [
          ['Principal Risk', 'Partial or Total Loss Possible'],
          ['Peer Multipliers', model.historicalBenchmarkText ? 'Historical Only ≠ Forecast' : 'Unverified'],
        ],
      },
      {
        tag: '06/06 · YOUR NEXT STEP',
        title: `Clarify With ${model.producerName} First`,
        copy: model.clarificationItems[0]?.question || 'Request contract terms, P&A cap, and escrow structure before investing.',
        metrics: [
          ['Selected Review', model.selectedCapital ? formatINR(model.selectedCapital) : '1 Unit'],
          ['Action', 'Send Enquiry or Book 15-Min Call'],
        ],
      },
    ];
  }, [model]);

  const totalMs = scenes.length * SCENE_MS;

  useEffect(() => {
    if (!isOpen) {
      setPlaying(false);
      return;
    }
    setElapsedMs(0);
    setPlaying(!prefersReduced);
    setShowStaticSummary(prefersReduced);
  }, [isOpen, prefersReduced]);

  useEffect(() => {
    if (!isOpen || !playing) return;
    let rafId = 0;
    let last = performance.now();

    const step = (now: number) => {
      const delta = Math.max(0, now - last);
      last = now;
      setElapsedMs((prev) => {
        const next = prev + delta;
        if (next >= totalMs) {
          setPlaying(false);
          return totalMs - 10;
        }
        return next;
      });
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, playing, totalMs]);

  if (!isOpen) return null;

  const sceneIdx = Math.min(scenes.length - 1, Math.floor(Math.max(0, elapsedMs) / SCENE_MS));
  const scene = scenes[sceneIdx];
  const sec = Math.floor(Math.max(0, elapsedMs) / 1000);

  return (
    <section className="nv-wt-drawer" aria-label="Optional 30-second venture walkthrough">
      <div className="nv-film-wrap">
        <div className="nv-wt-bar" role="tablist" aria-label="Walkthrough scenes">
          {scenes.map((sc, i) => {
            const pct =
              i < sceneIdx ? 100 : i > sceneIdx ? 0 : Math.min(100, ((elapsedMs - i * SCENE_MS) / SCENE_MS) * 100);
            return (
              <button
                key={sc.tag}
                type="button"
                role="tab"
                aria-selected={sceneIdx === i}
                aria-label={`Jump to ${sc.tag}`}
                className="nv-wt-seg"
                onClick={() => {
                  setShowStaticSummary(false);
                  setElapsedMs(i * SCENE_MS);
                }}
              >
                <span className="nv-wt-seg-fill" style={{ width: `${pct}%` }} />
              </button>
            );
          })}
        </div>

        <div className="nv-wt-stage">
          <div>
            <span className="nv-wt-kicker">{scene.tag}</span>
            <h3 className="nv-wt-title">{scene.title}</h3>
            <p className="nv-wt-copy">{scene.copy}</p>
            <div className="nv-wt-metrics">
              {scene.metrics.map(([val, lbl]) => (
                <div key={lbl} className="nv-wt-metric-pill">
                  <strong>{val}</strong>
                  <span>{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="nv-wt-controls">
            <span className="nv-wt-timer">Scene {sceneIdx + 1} / {scenes.length} · 0:{String(sec).padStart(2, '0')} / 0:30</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="nv-wt-btn primary"
                onClick={() => {
                  if (elapsedMs >= totalMs - 40) setElapsedMs(0);
                  setShowStaticSummary(false);
                  setPlaying((p) => !p);
                }}
              >
                {playing ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                className="nv-wt-btn"
                onClick={() => {
                  setShowStaticSummary(false);
                  setElapsedMs(0);
                  setPlaying(true);
                }}
              >
                ↻ Replay
              </button>
              <button
                type="button"
                className="nv-wt-btn"
                onClick={() => {
                  setPlaying(false);
                  setShowStaticSummary((s) => !s);
                }}
              >
                {showStaticSummary ? 'Hide Summary' : 'Skip to Summary'}
              </button>
              <button type="button" className="nv-wt-btn" onClick={onClose}>
                Close ✕
              </button>
            </div>
          </div>
        </div>

        {showStaticSummary && (
          <div className="nv-wt-static-grid">
            {scenes.map((sc) => (
              <div key={sc.tag} className="nv-wt-static-cell">
                <strong>{sc.tag.split('·')[1]?.trim() || sc.tag}</strong>
                <span>{sc.copy}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
