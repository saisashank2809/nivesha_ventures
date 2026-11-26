import React, { useEffect, useRef, useState } from 'react';
import { formatINR } from '../../../shared/formatters';
import { FilmVentureViewModel } from './filmVentureModel';

interface CapitalUtilisationExperienceProps {
  model: FilmVentureViewModel;
}

export const CapitalUtilisationExperience: React.FC<CapitalUtilisationExperienceProps> = ({ model }) => {
  const prefersReduced =
    typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(prefersReduced);
  const [activeIdx, setActiveIdx] = useState(0);
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

  const colors = ['#0f172a', '#0066cc', '#b48a3e', '#64748b'];
  const items = model.spendItems;
  const activeItem = items[activeIdx] || items[0] || null;

  return (
    <section id="sec-spend" className="nv-story-band nv-band-white">
      <div className="nv-film-wrap">
        <div className="nv-spend-split">
          <div ref={ref}>
            <span className="nv-zone-kicker">Use of Funds</span>
            <h2 className="nv-story-h2">Where the {formatINR(model.capitalSought)} Raise Goes</h2>
            <p className="nv-story-sub" style={{ marginBottom: '14px' }}>
              {items.length > 0
                ? 'Tap or hover a production category to inspect its operational allocation.'
                : String(model.venture.venture_story?.use_of_capital || 'Line-item production allocation unavailable.')}
            </p>

            {items.length > 0 && (
              <div className="nv-spend-bars">
                {items.map((item, idx) => (
                  <button
                    key={item.label}
                    type="button"
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => setActiveIdx(idx)}
                    className={`nv-spend-row ${idx === activeIdx ? 'active' : ''}`}
                    aria-pressed={idx === activeIdx}
                  >
                    <div className="nv-spend-top">
                      <span>{item.label}</span>
                      <span>
                        {item.amount} ({item.pct}%)
                      </span>
                    </div>
                    <div className="nv-spend-track">
                      <div
                        className="nv-spend-fill"
                        style={{
                          width: visible ? `${item.pct}%` : '0%',
                          backgroundColor: colors[idx % colors.length],
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeItem ? (
            <div className="nv-spend-spotlight">
              {activeItem.imageUrl ? (
                <img src={activeItem.imageUrl} alt={activeItem.label} />
              ) : (
                <div className="nv-spend-img-fallback">No reference image on file</div>
              )}
              <div className="nv-spend-spotlight-body">
                <strong>
                  {activeItem.label} · {activeItem.amount} ({activeItem.pct}%)
                </strong>
                <p>{activeItem.purpose}</p>
              </div>
            </div>
          ) : (
            <div className="nv-spend-spotlight" style={{ padding: '20px' }}>
              <strong>Allocation Disclosure</strong>
              <p style={{ marginTop: '6px' }}>Detailed itemized rupee split not provided by founder.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
