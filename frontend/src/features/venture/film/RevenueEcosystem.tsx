import React, { useEffect, useRef, useState } from 'react';
import { FilmVentureViewModel } from './filmVentureModel';

interface RevenueEcosystemProps {
  model: FilmVentureViewModel;
}

export const RevenueEcosystem: React.FC<RevenueEcosystemProps> = ({ model }) => {
  const prefersReduced =
    typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [inView, setInView] = useState(prefersReduced);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (inView || !ref.current || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [inView]);

  const channels = model.revenueChannels;
  const mid = Math.ceil(channels.length / 2);
  const leftChannels = channels.slice(0, mid);
  const rightChannels = channels.slice(mid);
  const hubImg = model.gallery[0] || null;

  return (
    <section
      id="sec-revenue"
      ref={ref}
      className={`nv-story-band nv-band-dark-constellation ${inView ? 'in-view' : ''}`}
    >
      <div className="nv-film-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="nv-dark-kicker">Planned Revenue Ecosystem</span>
            <h2 className="nv-story-h2" style={{ color: '#ffffff' }}>
              {channels.length > 0 ? `${channels.length} Potential Channels Explored` : 'Revenue Channels'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '4px' }}>
              Every revenue source and its reported documentation state appear directly — zero extra clicks required.
            </p>
          </div>
          <span className="nv-status-pill risk">
            {model.signedChannelCount} Signed Agreements Verified on File
          </span>
        </div>

        {channels.length > 0 ? (
          <div className="nv-rev-stage">
            <div className="nv-rev-col">
              {leftChannels.map((ch, idx) => (
                <div key={ch.id} className="nv-rev-stream" style={{ transitionDelay: `${idx * 100}ms` }}>
                  <div className="nv-rev-stream-head">
                    <strong>{ch.title}</strong>
                    <span className={`nv-status-pill ${ch.statusTone}`}>{ch.statusLabel}</span>
                  </div>
                  <p>{ch.detail}</p>
                </div>
              ))}
            </div>

            <div className="nv-rev-hub-center">
              {hubImg ? (
                <div className="nv-rev-aperture">
                  <img src={hubImg} alt={model.venture.company_name} />
                </div>
              ) : (
                <div className="nv-rev-aperture nv-rev-aperture-text">
                  <span>{model.venture.company_name.charAt(0)}</span>
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: '15px', marginTop: '8px', color: '#ffffff' }}>
                {model.venture.company_name}
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                {model.venture.stage || 'Pre-Signing Stage'}
              </div>
            </div>

            <div className="nv-rev-col">
              {rightChannels.map((ch, idx) => (
                <div key={ch.id} className="nv-rev-stream" style={{ transitionDelay: `${(idx + mid) * 100}ms` }}>
                  <div className="nv-rev-stream-head">
                    <strong>{ch.title}</strong>
                    <span className={`nv-status-pill ${ch.statusTone}`}>{ch.statusLabel}</span>
                  </div>
                  <p>{ch.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '18px', padding: '18px', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', fontSize: '13.5px' }}>
            Planned distribution and licensing channels have not yet been detailed on file.
          </div>
        )}
      </div>
    </section>
  );
};
