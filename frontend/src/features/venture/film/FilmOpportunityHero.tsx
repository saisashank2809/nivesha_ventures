import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatINR } from '../../../shared/formatters';
import { FilmVentureViewModel } from './filmVentureModel';

interface FilmOpportunityHeroProps {
  model: FilmVentureViewModel;
  onOpenWalkthrough: () => void;
  onJumpToTicket: () => void;
}

const parseStudioAndTitle = (raw: string): { studio: string | null; filmTitle: string } => {
  const m = raw.match(/^(.+?)\s+[-—–:]\s+(['"]?)(.+?)\2$/);
  if (m) {
    return { studio: m[1].trim(), filmTitle: m[3].trim() };
  }
  return { studio: null, filmTitle: raw.trim() };
};

/**
 * Selects complete sentences grounded in repository venture copy without mid-sentence ellipsis or clipping.
 */
const buildCompleteHeroSummary = (ventureOverview?: string, tagLine?: string, studio?: string | null): string => {
  const raw = String(ventureOverview || tagLine || '').trim();
  if (!raw) return '';
  const sentences = raw.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length === 0) return raw;

  // Pick up to 2 complete sentences totaling <= 185 characters; omit redundant leading studio name if identical
  let first = sentences[0];
  if (studio && first.length > 120) {
    first = first.replace(new RegExp(`\\s*produced by\\s+${studio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.]*`, 'i'), '');
  }
  if (sentences.length > 1 && `${first} ${sentences[1]}`.length <= 185) {
    return `${first} ${sentences[1]}`;
  }
  return first;
};

/**
 * Orders existing gallery URLs to prioritize thematic / dark cinematic atmosphere for the venture genre
 * without inventing or fetching any external artwork.
 */
const prioritizeHeroGallery = (urls: string[], genreHint: string): string[] => {
  if (urls.length <= 1) return urls;
  const isMythOrThriller = /myth|thriller|action/i.test(genreHint);
  if (!isMythOrThriller) return urls;
  const rankUrl = (u: string) => {
    if (/1478760329108/.test(u)) return 0; // Dark storm atmospheric mood still
    if (/1485846234645/.test(u)) return 1; // Production slate still
    if (/1518173946687/.test(u)) return 2; // Atmospheric monsoon still
    if (/1536440136628/.test(u)) return 3; // Cinema hall mood still
    return 4;
  };
  return [...urls].sort((a, b) => rankUrl(a) - rankUrl(b));
};

export const FilmOpportunityHero: React.FC<FilmOpportunityHeroProps> = ({
  model,
  onOpenWalkthrough,
  onJumpToTicket,
}) => {
  const { venture, gallery: rawGallery, hasUploadedGallery } = model;

  const { studio, filmTitle } = parseStudioAndTitle(venture.company_name);
  const genreHint = `${venture.venture_story?.venture_overview || ''} ${venture.tag_line || ''} ${venture.business_context || ''}`;
  const gallery = useMemo(() => prioritizeHeroGallery(rawGallery, genreHint), [rawGallery, genreHint]);

  const [prefersReduced, setPrefersReduced] = useState<boolean>(() =>
    typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(() => !prefersReduced);
  const [parallaxY, setParallaxY] = useState(0);
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      setPrefersReduced(mq.matches);
      if (mq.matches) {
        setIsPlaying(false);
        setParallaxY(0);
      }
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    if (!isPlaying || prefersReduced || gallery.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveImgIdx((prev) => (prev + 1) % gallery.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [isPlaying, prefersReduced, gallery.length]);

  useEffect(() => {
    setActiveImgIdx(0);
  }, [venture.id]);

  useEffect(() => {
    if (prefersReduced || gallery.length === 0 || typeof window === 'undefined') {
      setParallaxY(0);
      return;
    }
    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom < 0) return;
        const scrolled = Math.max(0, -rect.top);
        setParallaxY(Math.min(26, Math.round(scrolled * 0.08 * 10) / 10));
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [prefersReduced, gallery.length]);

  const conciseSummary = useMemo(
    () => buildCompleteHeroSummary(venture.venture_story?.venture_overview, venture.tag_line, studio),
    [venture.venture_story?.venture_overview, venture.tag_line, studio]
  );

  const mediaDisclosure = /pre-production/i.test(venture.stage || '')
    ? 'Illustrative mood image · No official footage filmed'
    : venture.stage || 'Venture imagery on file';

  const handleSelectImage = (idx: number) => {
    setActiveImgIdx(idx);
    setIsPlaying(false);
  };

  return (
    <section
      id="sec-opportunity"
      ref={heroRef}
      className={`nv-cine-hero ${prefersReduced ? 'reduced-motion' : ''}`}
    >
      {gallery.length > 0 ? (
        <div
          className="nv-cine-bg-stack"
          style={{ transform: prefersReduced ? undefined : `translate3d(0, ${parallaxY}px, 0)` }}
          aria-hidden="true"
        >
          {gallery.map((url, idx) => {
            const isActive = idx === activeImgIdx;
            return (
              <img
                key={url + idx}
                src={url}
                alt=""
                className={`nv-cine-bg-img ${isActive ? 'active' : ''} ${isPlaying && isActive && !prefersReduced ? 'zooming' : ''}`}
              />
            );
          })}
        </div>
      ) : (
        <div className="nv-cine-bg-fallback" aria-hidden="true" />
      )}

      <div className="nv-cine-scrim" aria-hidden="true" />
      <div className="nv-cine-bottom-blend" aria-hidden="true" />

      <div className="nv-film-wrap nv-cine-inner">
        <div className="nv-cine-content">
          <div className="nv-hero-badges nv-stagger-1">
            <span className="nv-dark-chip">{venture.sector}</span>
            <span>{venture.location}</span>
            <span>&bull;</span>
            <span>{venture.stage || 'Stage Undisclosed'}</span>
            <span className={`nv-status-pill ${model.heroVerificationTone}`}>
              {model.heroVerificationLabel}
            </span>
          </div>

          <div className="nv-cine-studio-row nv-stagger-1">
            <span className="nv-cine-accent-rule" aria-hidden="true" />
            <span className="nv-cine-studio">{studio || venture.founder_title || venture.location}</span>
          </div>
          <h1 className="nv-cine-title nv-stagger-2">{filmTitle}</h1>

          {conciseSummary && <p className="nv-cine-desc nv-stagger-2">{conciseSummary}</p>}

          <div className="nv-cine-promoter nv-stagger-3">
            Promoter: <strong>{model.producerName}</strong>
            {model.producerTitle ? ` · ${model.producerTitle}` : ''}
          </div>

          <div className="nv-cine-figures nv-stagger-3" aria-label="Primary financial overview">
            <div className="nv-hero-fig">
              <span className="nv-hero-fig-lbl">Est. Film Budget</span>
              <span className="nv-hero-fig-val">
                {model.projectBudget ? formatINR(model.projectBudget) : 'Undisclosed'}
              </span>
              <span className="nv-hero-fig-sub">Itemized total cost</span>
            </div>
            <div className="nv-hero-fig">
              <span className="nv-hero-fig-lbl">Raising Target</span>
              <span className="nv-hero-fig-val">{formatINR(model.capitalSought)}</span>
              <span className="nv-hero-fig-sub">Goal · no escrow on file</span>
            </div>
            <div className="nv-hero-fig">
              <span className="nv-hero-fig-lbl">Starts At</span>
              <span className="nv-hero-fig-val">
                {model.perUnit ? formatINR(model.perUnit) : 'Flexible'}
              </span>
              <span className="nv-hero-fig-sub">
                {model.totalUnits ? `${model.totalUnits} proposed units` : 'Per participation'}
              </span>
            </div>
          </div>

          <div className="nv-hero-cta-row nv-stagger-4">
            <button
              type="button"
              onClick={onJumpToTicket}
              className="nv-pdp-blue-btn"
              style={{ width: 'auto', padding: '10px 20px' }}
            >
              <span>Explore Participation →</span>
            </button>
            <button type="button" onClick={onOpenWalkthrough} className="nv-ghost-dark-btn">
              <span>▶ Watch 30-Sec Walkthrough</span>
            </button>
          </div>
        </div>

        <div className="nv-cine-media-dock">
          <div className="nv-cine-disclosure">
            <span>{hasUploadedGallery ? mediaDisclosure : 'No official imagery uploaded on file'}</span>
            {gallery.length > 0 && (
              <span className="nv-cine-count">
                {activeImgIdx + 1} / {gallery.length}
              </span>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="nv-cine-controls" role="group" aria-label="Hero gallery controls">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                disabled={prefersReduced}
                className="nv-cine-ctrl-btn"
                aria-label={isPlaying ? 'Pause background slideshow' : 'Play background slideshow'}
                title={prefersReduced ? 'Paused (reduced motion enabled)' : isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying && !prefersReduced ? '⏸' : '▶'}
              </button>

              {gallery.map((url, idx) => (
                <button
                  key={url + idx}
                  type="button"
                  onClick={() => handleSelectImage(idx)}
                  aria-label={`Show background image ${idx + 1} of ${gallery.length}`}
                  aria-pressed={idx === activeImgIdx}
                  className={`nv-cine-pip ${idx === activeImgIdx ? 'active' : ''}`}
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
