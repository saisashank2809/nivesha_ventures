import React, { useEffect, useState } from 'react';
import { formatINR } from '../../../shared/formatters';

export interface ChapterItem {
  id: 'overview' | 'my-money' | 'returns' | 'trust' | 'connect';
  label: string;
  targetId: string;
  sectionIds: string[];
}

export const FILM_CHAPTERS: ChapterItem[] = [
  { id: 'overview', label: 'Overview', targetId: 'sec-opportunity', sectionIds: ['sec-opportunity', 'sec-fit'] },
  { id: 'my-money', label: 'My Money', targetId: 'sec-funding', sectionIds: ['sec-funding', 'sec-spend', 'sec-ticket', 'sec-money'] },
  { id: 'returns', label: 'Returns', targetId: 'sec-revenue', sectionIds: ['sec-revenue', 'sec-recovery'] },
  { id: 'trust', label: 'Trust', targetId: 'sec-producer', sectionIds: ['sec-producer', 'sec-readiness', 'sec-evidence'] },
  { id: 'connect', label: 'Connect', targetId: 'sec-act', sectionIds: ['sec-act'] },
];

interface VentureChapterNavigationProps {
  selectedCapital: number | null;
  copiedShare: boolean;
  walkthroughOpen: boolean;
  onBack: () => void;
  onCopyShare: () => void;
  onToggleWalkthrough: () => void;
}

export const VentureChapterNavigation: React.FC<VentureChapterNavigationProps> = ({
  selectedCapital,
  copiedShare,
  walkthroughOpen,
  onBack,
  onCopyShare,
  onToggleWalkthrough,
}) => {
  const [activeChapter, setActiveChapter] = useState<ChapterItem['id']>('overview');

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const sectionToChapter = new Map<string, ChapterItem['id']>();
    FILM_CHAPTERS.forEach((c) => c.sectionIds.forEach((sid) => sectionToChapter.set(sid, c.id)));

    const visibleRatios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        let bestId = '';
        let bestScore = 0;
        visibleRatios.forEach((ratio, id) => {
          if (ratio > bestScore) {
            bestScore = ratio;
            bestId = id;
          }
        });
        const chap = bestId ? sectionToChapter.get(bestId) : undefined;
        if (chap) setActiveChapter(chap);
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.05, 0.25, 0.5] }
    );

    sectionToChapter.forEach((_, sid) => {
      const el = document.getElementById(sid);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const jumpTo = (targetId: string, chapId: ChapterItem['id']) => {
    setActiveChapter(chapId);
    const el = document.getElementById(targetId);
    if (el) {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <div className="nv-pdp-top-bar" role="navigation" aria-label="Film Venture Sections">
      <div className="nv-pdp-top-bar-inner">
        <button type="button" onClick={onBack} className="nv-pdp-back-btn">
          <span>←</span>
          <span className="nv-back-label">Back to Opportunities</span>
        </button>

        <div className="nv-film-chapters" role="tablist" aria-label="Venture chapters">
          {FILM_CHAPTERS.map((chap) => (
            <button
              key={chap.id}
              type="button"
              role="tab"
              aria-selected={activeChapter === chap.id}
              onClick={() => jumpTo(chap.targetId, chap.id)}
              className={`nv-chap-pill ${activeChapter === chap.id ? 'active' : ''}`}
            >
              {chap.label}
            </button>
          ))}
        </div>

        <div className="nv-topbar-actions">
          {selectedCapital !== null && (
            <button
              type="button"
              onClick={() => jumpTo('sec-ticket', 'my-money')}
              className="nv-synced-ticket-pill"
              title="Jump to ticket selector"
            >
              Selected: {formatINR(selectedCapital)}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleWalkthrough}
            className={`nv-pdp-action-btn nv-wt-toggle ${walkthroughOpen ? 'active' : ''}`}
            aria-expanded={walkthroughOpen}
          >
            <span>{walkthroughOpen ? '✕ Close Brief' : '▶ 30s Brief'}</span>
          </button>
          <button type="button" onClick={onCopyShare} className="nv-pdp-action-btn nv-hide-xs">
            <span>{copiedShare ? 'Copied' : 'Share'}</span>
          </button>
          <button type="button" onClick={() => window.print()} className="nv-pdp-action-btn nv-hide-xs">
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};
