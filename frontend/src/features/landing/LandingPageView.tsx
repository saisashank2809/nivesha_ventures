import React, { useState, useEffect } from 'react';
import { VentureCard, User } from '../../shared/types';
import { formatINR } from '../../shared/formatters';
import './LandingPageView.css';

interface LandingPageViewProps {
  ventures: VentureCard[];
  currentUser: User | null;
  onExploreVentures: () => void;
  onStartOnboarding: () => void;
  onOpenLogin: () => void;
  onSelectVenture: (venture: VentureCard) => void;
  onNavigateToDashboard?: () => void;
}

const IconArrowRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  ventures,
  currentUser,
  onExploreVentures,
  onStartOnboarding,
  onOpenLogin: _onOpenLogin,
  onSelectVenture,
  onNavigateToDashboard,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showDemoCredentials, setShowDemoCredentials] = useState<boolean>(false);

  useEffect(() => {
    const els = document.querySelectorAll('.nv-reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ventures.length]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Does Nivesha Ventures hold or collect my investment money?',
      a: 'No. We never collect, hold, or pool anyone’s money. We are not a bank or a fund manager. We simply check the business details and connect you with the owner. All payments happen directly between your bank account and the business’s bank account.',
    },
    {
      q: 'How much money do I need to invest?',
      a: 'Deals on this platform start from ₹10 Lakhs and go up to ₹5 Crore+. It is built for people looking to make serious investments in real businesses like factories, land layouts, hospitals, shops, and films.',
    },
    {
      q: 'Why do you show the risks of a business openly?',
      a: 'Investing ₹10 Lakhs or more is a big decision. Most websites only show the best sales pitch. We check tax records, property papers, and real profits, and we tell you both the good parts and the risks upfront so there are no surprises later.',
    },
    {
      q: 'Do I have to fill out long, complicated forms?',
      a: 'No. Instead of blank text boxes, you just click simple options to tell us what you are looking for. We show you businesses that match your budget and comfort level.',
    },
    {
      q: 'How do I talk to a business owner?',
      a: 'First, read the full 10-point summary of the business. If you are interested, send a message request. Once the business owner reviews your profile and accepts, a private 1-on-1 chat opens right here so you can talk directly and plan a meeting.',
    },
  ];

  return (
    <div className="nv-landing">
      {/* Logged-In Dashboard Shortcut */}
      {currentUser && (
        <div style={{ background: '#ffffff', width: '100%' }}>
          <div
            style={{
              padding: '14px 24px 0',
              display: 'flex',
              justifyContent: 'flex-end',
              maxWidth: '1180px',
              margin: '0 auto',
            }}
          >
            <button
              onClick={onNavigateToDashboard}
              className="nv-btn-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '12.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>
                Go to your{' '}
                {currentUser.role === 'FOUNDER'
                  ? 'Founder Dashboard'
                  : currentUser.role === 'INVESTOR'
                    ? 'Investor Dashboard'
                    : 'Review Desk'}
              </span>
              <IconArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="nv-hero">
        <div className="nv-hero-ambient" aria-hidden="true" />
        <div className="nv-hero-inner">
          <div className="eyebrow nv-hero-anim-1" style={{ marginBottom: '14px' }}>
            TRUSTED BUSINESS &amp; INVESTMENT DEALS
          </div>

          <h1 className="nv-hero-title nv-hero-anim-2">
            Invest in{' '}
            <span
              style={{
                backgroundColor: '#0066cc',
                color: '#ffffff',
                padding: '0 12px',
                borderRadius: '8px',
                display: 'inline-block',
              }}
            >
              Real Businesses
            </span>
            . Clearly and Safely.
          </h1>

          <p className="nv-hero-subtitle nv-hero-anim-3">
            Find checked business opportunities—from factories and land to films and hospitals—starting from ₹10 Lakhs.
            We verify the facts and show both the good and the risks before you talk.
          </p>

          {/* Primary Pill CTA + Secondary Blue Link */}
          <div className="nv-hero-ctas nv-hero-anim-4">
            <button onClick={onExploreVentures} className="nv-cta-card-primary">
              Explore Businesses to Invest In
            </button>

            <button onClick={onStartOnboarding} className="nv-hero-secondary-link">
              <span>Looking for Funding? Start Here</span>
              <span aria-hidden="true" style={{ fontSize: '18px', lineHeight: 1 }}>&rsaquo;</span>
            </button>
          </div>

          {/* Fanned Venture Categories Photo Showcase */}
          <div className="nv-hero-fan nv-hero-anim-4" aria-label="Venture categories we cover">
            {[
              {
                title: 'Film Production',
                sub: 'Projects & Studios',
                img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80',
              },
              {
                title: 'Manufacturing',
                sub: 'Factories & CNC',
                img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
              },
              {
                title: 'Real Estate & Land',
                sub: 'Layouts & Commercial',
                img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
              },
              {
                title: 'Consumer Brands',
                sub: 'Footwear & D2C',
                img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
              },
              {
                title: 'Hospitality & Retail',
                sub: 'Food & Local Hubs',
                img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
              },
            ].map((cat, idx) => (
              <button
                key={cat.title}
                type="button"
                onClick={onExploreVentures}
                className={`nv-fan-card nv-fan-card-${idx + 1}`}
                title={`Explore ${cat.title} opportunities`}
              >
                <img src={cat.img} alt={cat.title} />
                <div className="nv-fan-label">
                  {cat.title}
                  <span className="nv-fan-sub">{cat.sub}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Horizontal 4-Column Spec Strip */}
          <div className="nv-spec-strip nv-hero-anim-5">
            {[
              {
                stat: '₹10 Lakhs+',
                title: 'Starting Amount',
                desc: 'Built for serious investments, not small crowd-funding.',
              },
              {
                stat: 'Direct Payment',
                title: 'We Never Hold Money',
                desc: 'Payments happen directly between your bank and theirs.',
              },
              {
                stat: 'Full Truth',
                title: 'No Hidden Risks',
                desc: 'We check the paperwork and share risks upfront.',
              },
              {
                stat: 'Simple Choices',
                title: 'No Long Forms',
                desc: 'Click simple options instead of filling confusing forms.',
              },
            ].map((item, idx) => (
              <div key={idx} className="nv-spec-item">
                <div className="nv-spec-stat">{item.stat}</div>
                <div className="nv-spec-label">{item.title}</div>
                <div className="nv-spec-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. THREE SIMPLE PILLARS */}
      <section className="nv-section nv-section-ivory nv-reveal">
        <div className="nv-container">
          <div className="nv-section-header">
            <div className="eyebrow">WHY USE NIVESHA</div>
            <h2 className="nv-section-title">Clear Facts. No Sales Hype.</h2>
            <p className="nv-section-lead">
              Whether you are investing hard-earned savings or raising money for your company, everything here is written
              so anyone can understand it.
            </p>
          </div>

          <div className="nv-pillars-grid">
            <article className="nv-pillar-card">
              <div>
                <div className="eyebrow" style={{ marginBottom: '10px' }}>
                  FOR INVESTORS
                </div>
                <h3 style={{ fontSize: '23px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                  No Sales Pitch. Just the Full Truth.
                </h3>
                <p className="nv-quote-callout">&ldquo;Know both the profits and the risks before you invest.&rdquo;</p>
                <p style={{ fontSize: '14px', lineHeight: 1.65, color: '#475569', margin: 0 }}>
                  We don’t just take a business owner’s word for it. Before a business is shown to you, we check their
                  tax returns, property papers, real profits, and customer feedback—so you never walk in blind.
                </p>
              </div>
              <button onClick={onExploreVentures} className="nv-text-cta">
                <span>See Checked Businesses</span>
                <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>&rsaquo;</span>
              </button>
            </article>

            <article className="nv-pillar-card-dark">
              <div>
                <div className="eyebrow" style={{ marginBottom: '10px', color: '#d4af37' }}>
                  FOR BUSINESS OWNERS
                </div>
                <h3 style={{ fontSize: '23px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                  3 Simple Ways to Raise Money
                </h3>
                <p className="nv-quote-callout-dark">
                  &ldquo;Raise ₹10 Lakhs to ₹5 Crore+ on terms that fit your business.&rdquo;
                </p>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#94a3b8', marginBottom: '14px' }}>
                  You don’t have to give away ownership if you don’t want to. Choose how you want to raise funds:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#e5e5ea' }}>
                  <div style={{ background: 'rgba(255,255,255,0.07)', padding: '9px 12px', borderRadius: '10px' }}>
                    <strong style={{ color: '#ffffff' }}>1. Loan Against Property / Assets:</strong> Borrow money backed
                    by land, a flat, or machines and pay fixed interest.
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.07)', padding: '9px 12px', borderRadius: '10px' }}>
                    <strong style={{ color: '#ffffff' }}>2. Shared Sales / Hybrid:</strong> Pay a fixed return plus a
                    small share of your monthly sales.
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.07)', padding: '9px 12px', borderRadius: '10px' }}>
                    <strong style={{ color: '#ffffff' }}>3. Selling a Share (Equity):</strong> Give investors
                    part-ownership in your company or project.
                  </div>
                </div>
              </div>
              <button onClick={onStartOnboarding} className="nv-text-cta" style={{ color: '#d4af37' }}>
                <span>Submit Your Business</span>
                <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>&rsaquo;</span>
              </button>
            </article>

            <article className="nv-pillar-card">
              <div>
                <div className="eyebrow" style={{ marginBottom: '10px' }}>
                  SIMPLE EXPERIENCE
                </div>
                <h3 style={{ fontSize: '23px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                  Easy to Use. No Jargon.
                </h3>
                <p className="nv-quote-callout">&ldquo;Simple steps from start to finish.&rdquo;</p>
                <p style={{ fontSize: '14px', lineHeight: 1.65, color: '#475569', margin: 0 }}>
                  Every business is explained in the same simple 10-part format—what they do, how much they earn, how
                  they will use the money, and what could go wrong. Talk directly with the owner only when you are
                  ready.
                </p>
              </div>
              <button onClick={onExploreVentures} className="nv-text-cta">
                <span>Browse All Deals</span>
                <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>&rsaquo;</span>
              </button>
            </article>
          </div>
        </div>
      </section>

      {/* 3. STATIC SHOWCASE OF ALL PLATFORM VENTURES */}
      <section className="nv-section nv-section-parchment nv-reveal">
        <div className="nv-container">
          <div className="nv-section-header" style={{ marginBottom: '40px' }}>
            <div className="eyebrow">AVAILABLE OPPORTUNITIES ({ventures.length})</div>
            <h2 className="nv-section-title">Businesses Currently Looking for Funding</h2>
            <p className="nv-section-lead">
              Every active business on Nivesha Ventures is listed below with its simple summary and target amount.
            </p>
          </div>

          {ventures.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {ventures.map((v) => {
                const coverImg = v.hero_image_url || (v.gallery_urls && v.gallery_urls[0]);
                return (
                  <article
                    key={v.id}
                    className="nv-card-interactive"
                    style={{
                      borderRadius: '20px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(15, 23, 42, 0.08)',
                    }}
                  >
                    <div>
                      {coverImg && (
                        <div style={{ height: '165px', width: '100%', backgroundColor: '#0f172a', overflow: 'hidden' }}>
                          <img
                            src={coverImg}
                            alt={v.company_name}
                            loading="lazy"
                            className="nv-venture-card-img"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div style={{ padding: '22px 24px 16px' }}>
                        <div className="mono-label" style={{ fontSize: '11px', fontWeight: 600, color: '#0066cc', textTransform: 'uppercase', marginBottom: '6px' }}>
                          {v.sector} &bull; {v.location}
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                          {v.company_name}
                        </h3>

                        <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.55, margin: '0 0 16px' }}>
                          {v.tag_line || v.business_context}
                        </p>

                        <div
                          style={{
                            background: '#f5f5f7',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Amount Needed</div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                              {formatINR(v.capital_target)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Deal Type</div>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                              {(v.proposed_arrangement || v.capital_structures?.[0] || 'Direct Deal').replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '0 24px 22px' }}>
                      <button
                        onClick={() => onSelectVenture(v)}
                        className="nv-link-chevron"
                        style={{ fontSize: '13.5px', padding: 0 }}
                      >
                        <span>Read Full Details &amp; Risks</span>
                        <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>&rsaquo;</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div style={{ background: '#f5f5f7', borderRadius: '20px', padding: '32px', textAlign: 'center', color: '#475569' }}>
              Opportunities are loading. Click &ldquo;Explore Businesses to Invest In&rdquo; above to view the full directory.
            </div>
          )}
        </div>
      </section>

      {/* 3b. WHY CHOOSE NIVESHA */}
      <section className="nv-section nv-section-ivory nv-reveal">
        <div className="nv-container">
          <div className="nv-section-header" style={{ marginBottom: '40px' }}>
            <div className="eyebrow">WHY CHOOSE NIVESHA</div>
            <h2 className="nv-section-title">Why Choose Nivesha Over Brokers &amp; Listing Sites.</h2>
            <p className="nv-section-lead">
              Most websites just post ads and leave you to figure out the truth. We check the facts first and keep
              everything simple.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '24px',
            }}
          >
            {/* Typical Sites & Brokers */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '22px',
                padding: '30px 28px',
                border: '1px solid rgba(15, 23, 42, 0.08)',
              }}
            >
              <div className="mono-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
                OTHER PLATFORMS &amp; BROKERS
              </div>
              <h3 style={{ fontSize: '21px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                Guesswork, Hype &amp; Middlemen
              </h3>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#475569', lineHeight: 1.55 }}>
                <li>Anyone can post unverified claims and optimistic profit numbers.</li>
                <li>Risks and hidden problems are left out of the sales pitch.</li>
                <li>Long, confusing forms and endless cold calls from brokers.</li>
                <li>Hard-to-read pitch decks full of complicated finance words.</li>
              </ul>
            </div>

            {/* Nivesha Ventures */}
            <div
              style={{
                background: '#0f172a',
                color: '#f5f5f7',
                borderRadius: '22px',
                padding: '30px 28px',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div className="mono-label" style={{ fontSize: '11px', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', marginBottom: '10px' }}>
                NIVESHA VENTURES
              </div>
              <h3 style={{ fontSize: '21px', fontWeight: 700, color: '#ffffff', margin: '0 0 16px' }}>
                Checked Facts &amp; Direct Control
              </h3>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#cbd5e1', lineHeight: 1.55 }}>
                <li>Every business is checked against tax filings, bank records, and property titles.</li>
                <li>Both the upside and the real risks are shown upfront in plain words.</li>
                <li>No spam calls—chat 1-on-1 with the owner only when both sides agree.</li>
                <li>Your money stays in your bank until you pay the business directly.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS IN 4 SIMPLE STEPS (STATIC) */}
      <section className="nv-section nv-section-parchment nv-reveal">
        <div className="nv-container">
          <div className="nv-section-header">
            <div className="eyebrow">HOW IT WORKS</div>
            <h2 className="nv-section-title">4 Simple Steps From Start to Finish.</h2>
            <p className="nv-section-lead">
              We do the background checking first so you only spend time talking when everything looks right.
            </p>
          </div>

          <div className="nv-steps-grid">
            {[
              {
                step: '01',
                title: 'Pick What Fits You',
                subtitle: 'Simple Options',
                desc: 'Tell us your budget and whether you prefer fixed interest, profit-sharing, or part-ownership.',
              },
              {
                step: '02',
                title: 'We Check the Papers',
                subtitle: 'Background Check',
                desc: 'Our team checks tax filings, property titles, and real business numbers before listing any deal.',
              },
              {
                step: '03',
                title: 'Read the Full Story',
                subtitle: '10-Point Summary',
                desc: 'See how the business makes money, how your funds will be used, and what the risks are.',
              },
              {
                step: '04',
                title: 'Talk & Close Directly',
                subtitle: 'Direct Connection',
                desc: 'Send a message to the owner. When both sides agree, chat directly and transfer funds bank-to-bank.',
              },
            ].map((st, i) => (
              <div key={i} className="nv-step-card">
                <div className="mono-label" style={{ fontSize: '24px', color: '#0066cc', fontWeight: 700, marginBottom: '8px' }}>
                  {st.step}
                </div>
                <h3 style={{ fontSize: '18.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                  {st.title}
                </h3>
                <div className="eyebrow" style={{ fontSize: '10.5px', marginBottom: '12px', color: '#64748b' }}>
                  {st.subtitle}
                </div>
                <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#475569', margin: 0 }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. OUR PROMISE: WE NEVER HOLD YOUR MONEY */}
      <section className="nv-section nv-section-parchment nv-reveal">
        <div style={{ maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
          <div className="eyebrow">OUR PROMISE</div>
          <h2 className="nv-section-title" style={{ marginBottom: '24px' }}>
            We Connect &amp; Verify. We Never Hold Your Money.
          </h2>
          <div
            style={{
              background: '#0f172a',
              color: '#f5f5f7',
              borderRadius: '24px',
              padding: '34px 32px',
              textAlign: 'left',
              boxShadow: 'var(--shadow-lg)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            {[
              {
                title: 'Not a Bank or Investment Fund',
                desc: 'Nivesha Ventures is an independent checking and introduction platform—not a broker or fund manager.',
              },
              {
                title: 'Direct Bank-to-Bank Deals',
                desc: 'We never collect, hold, or pool your money. All payments and legal papers happen directly between you and the business.',
              },
              {
                title: 'Clear Service Fees',
                desc: 'We charge a clear fee only for checking documents, preparing the deal story, and helping with legal paperwork.',
              },
              {
                title: 'Facts Separated From Claims',
                desc: 'We always show clearly what the owner claimed versus what our team actually verified from records.',
              },
            ].map((g, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>{g.title}</div>
                <div style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.55 }}>{g.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. COMMON QUESTIONS (FAQ) */}
      <section className="nv-section nv-section-ivory nv-reveal">
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="eyebrow">COMMON QUESTIONS</div>
            <h2 className="nv-section-title">Simple Answers Before You Start.</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="nv-faq-item">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="nv-faq-btn"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span className={`nv-faq-chevron ${isOpen ? 'open' : ''}`} aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 24px 20px', fontSize: '14.5px', lineHeight: 1.6, color: '#475569' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Discreet Demo Evaluator Credentials Drawer */}
      <section style={{ padding: '28px 24px', background: '#ebebf0' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="eyebrow" style={{ fontSize: '11.5px' }}>
                Demo Accounts (For Testing)
              </span>
              <p style={{ fontSize: '12.5px', color: '#475569', margin: '3px 0 0' }}>
                Quick logins to test the investor and business owner dashboards. (Password:{' '}
                <code>password123</code> or <code>Password123!</code>)
              </p>
            </div>
            <button
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="nv-btn-secondary"
              style={{ padding: '7px 16px', fontSize: '12px' }}
              aria-expanded={showDemoCredentials}
            >
              {showDemoCredentials ? 'Hide Accounts' : 'Show Accounts'}
            </button>
          </div>

          {showDemoCredentials && (
            <div
              style={{
                marginTop: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '10px',
                fontSize: '12px',
              }}
            >
              {[
                { label: 'Investor Portal', name: 'Rohan Varma', email: 'investor@peakindia.vc' },
                { label: 'Film Production', name: 'Raghavendra Rao (Garuda)', email: 'film.producer@nivesha.in' },
                { label: 'Shoe D2C Brand', name: 'Vikramaditya Sahni (StrideCraft)', email: 'footwear.founder@nivesha.in' },
                { label: 'Collateral Debt', name: 'Suresh Chandra (Apex CNC)', email: 'debt.founder@nivesha.in' },
                { label: 'Rural Logistics', name: 'Sravani Reddy (GramaBlink)', email: 'logistics.founder@nivesha.in' },
                { label: 'Healthcare Buyout', name: 'Dr. Hariprasad Varma', email: 'healthcare.founder@nivesha.in' },
                { label: 'Real Estate Layout', name: 'Karthik Narayana (Suryam)', email: 'realestate.founder@nivesha.in' },
                { label: 'Food & Hospitality', name: 'Arvind Nair (Malabar)', email: 'founder@malabarcoast.in' },
              ].map((acc, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    background: '#ffffff',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    borderRadius: '12px',
                  }}
                >
                  <strong style={{ color: '#0f172a' }}>{acc.label}:</strong> {acc.name}
                  <div className="mono-label" style={{ color: '#0066cc', marginTop: '2px', fontSize: '11.5px' }}>
                    {acc.email}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section style={{ padding: '88px 24px', background: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          <h2 className="nv-section-title" style={{ marginBottom: '14px' }}>
            Ready to Take a Closer Look?
          </h2>
          <p style={{ fontSize: '17px', color: '#475569', marginBottom: '34px', lineHeight: 1.6 }}>
            Browse checked businesses looking for ₹10 Lakhs+ or share your own business details in a few simple steps.
          </p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onExploreVentures}
              className="nv-btn-dark"
              style={{ padding: '14px 30px', fontSize: '15px' }}
            >
              Explore Businesses to Invest In
            </button>
            <button
              onClick={onStartOnboarding}
              className="nv-link-chevron"
              style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600 }}
            >
              <span>Looking for Funding? Start Here</span>
              <span aria-hidden="true" style={{ fontSize: '18px', lineHeight: 1 }}>&rsaquo;</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '40px 24px',
          background: '#0f172a',
          color: '#94a3b8',
          fontSize: '13px',
        }}
      >
        <div
          style={{
            maxWidth: '1180px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <span style={{ fontSize: '17px', color: '#ffffff', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Nivesha Ventures
            </span>
            <span style={{ marginLeft: '12px', color: '#94a3b8' }}>
              Checked Business Deals &bull; Direct Connections.
            </span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} Nivesha Ventures. We never hold client funds.
          </div>
        </div>
      </footer>
    </div>
  );
};
