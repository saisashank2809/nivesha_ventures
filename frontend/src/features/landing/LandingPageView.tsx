import React, { useState } from 'react';
import { VentureCard, User } from '../../shared/types';
import { formatINR } from '../../shared/formatters';

interface LandingPageViewProps {
  ventures: VentureCard[];
  currentUser: User | null;
  onExploreVentures: () => void;
  onStartOnboarding: () => void;
  onOpenLogin: () => void;
  onSelectVenture: (venture: VentureCard) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  ventures,
  currentUser,
  onExploreVentures,
  onStartOnboarding,
  onOpenLogin,
  onSelectVenture,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const sectors = [
    {
      title: 'Fintech & Lending Tech',
      tagline: 'MSME credit, invoice discounting, and embedded payments in Bharat.',
      metrics: '₹50L – ₹12 Cr check sizes',
    },
    {
      title: 'Agritech & Rural Value Chains',
      tagline: 'Farmgate procurement, FPO digitization, and precision farm tech.',
      metrics: 'Series Seed to Series A',
    },
    {
      title: 'Enterprise B2B SaaS & AI',
      tagline: 'Vertical SaaS built from India with global and domestic enterprise adoption.',
      metrics: '₹1 Cr – ₹15 Cr tickets',
    },
    {
      title: 'CleanTech & Energy Transition',
      tagline: 'Distributed solar, battery repurposing, and commercial fleet decarbonization.',
      metrics: 'Growth & Expansion',
    },
    {
      title: 'Consumer & D2C Brands',
      tagline: 'Clean-label food, personal care, and regional consumer brands with genuine repeat cohorts.',
      metrics: 'Seed to Pre-Series A',
    },
    {
      title: 'Healthcare & Diagnostics Tech',
      tagline: 'Tier-2 diagnostic hubs, point-of-care screening, and medical devices.',
      metrics: 'Institutional syndicate',
    },
  ];

  const diligencePillars = [
    {
      id: 'financials',
      name: 'Financials & Unit Economics',
      desc: '3 years of audited P&L, bank statements, GST reconciliations, customer cohort gross margins, and burn multiple.',
      badge: 'Audited & Verified',
    },
    {
      id: 'legal',
      name: 'Legal Standing & Cap Table',
      desc: 'MCA statutory filings, verified cap table, ESOP pool documentation, founder IP assignments, and dispute search.',
      badge: 'Statutory Verification',
    },
    {
      id: 'team',
      name: 'Founders & Core Leadership',
      desc: 'Direct reference checks with previous employers/investors, founder vesting schedules, and key hire retention.',
      badge: 'Independent References',
    },
    {
      id: 'market',
      name: 'Market & Customer Validation',
      desc: '5+ direct confidential interviews conducted by our sector analysts with real paying enterprise and MSME customers.',
      badge: 'Primary Customer Calls',
    },
    {
      id: 'model',
      name: 'Business Model Resiliency',
      desc: 'Working capital cycles, debtor days, supplier concentration, pricing power, and organic vs. paid customer acquisition costs.',
      badge: 'Model Stress-Tested',
    },
    {
      id: 'funds',
      name: 'Milestone-Based Use of Funds',
      desc: 'Detailed monthly deployment forecast tied to verified operational milestones, giving clear 18-24 month runway visibility.',
      badge: 'Milestone Mapped',
    },
  ];

  const faqs = [
    {
      q: 'How does Nivesha Ventures differ from typical brokers or syndicates?',
      a: 'We are an independent verification and introduction platform, not a placement agent or transaction broker. We never hold or move capital, and we do not take percentage transaction cuts that incentivize misleading hype. Both sides pay transparent platform fees for verified diligence briefs and qualified introductions.',
    },
    {
      q: 'What is the typical ticket size and stage of ventures showcased?',
      a: 'Our ventures typically raise between ₹1 Crore and ₹15 Crores (individual ticket sizes ranging from ₹25 Lakhs to ₹5 Crores). They range from high-traction Post-Revenue Seed to Series A ventures with verified product-market fit.',
    },
    {
      q: 'How do introductions and direct messaging work?',
      a: 'To protect founders from endless spam and protect investors from unqualified pitches, direct communication is strictly gated by mutual consent. An investor requests a connection with an introductory note; once the founder reviews the investor’s mandate and approves, an encrypted 1-on-1 direct chat channel is immediately unlocked.',
    },
    {
      q: 'Can founders update their information and track diligence status?',
      a: 'Yes. Founders have a dedicated showcase dashboard and an extensible onboarding questionnaire where they submit business details, traction evidence, cap table details, and answers to diligence questions.',
    },
  ];

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '80px 24px 70px',
          background: 'radial-gradient(ellipse at 50% 20%, #ffffff 0%, #faf8f2 50%, #f4ede0 100%)',
          borderBottom: '1px solid var(--border-light)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: '#f1e6d4',
              border: '1px solid #dcc9af',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-gold)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '28px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-gold)',
              }}
            />
            Independent Venture Diligence & Introduction
          </div>

          <h1
            style={{
              fontSize: '52px',
              lineHeight: 1.15,
              fontWeight: 500,
              color: 'var(--bg-dark)',
              marginBottom: '24px',
              letterSpacing: '-0.02em',
            }}
          >
            Indian ventures, independently verified and clearly told.
          </h1>

          <p
            style={{
              fontSize: '19px',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              maxWidth: '780px',
              margin: '0 auto 36px',
            }}
          >
            We connect serious institutional and angel investors with verified Indian businesses. Before any
            introduction, our team examines audited numbers, conducts primary customer calls, and validates legal standing—so
            you spend your time evaluating real opportunities, not sorting through pitch deck hype.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '44px',
            }}
          >
            <button
              onClick={onExploreVentures}
              style={{
                padding: '14px 30px',
                borderRadius: '8px',
                background: 'var(--bg-dark)',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Explore Verified Ventures
            </button>

            <button
              onClick={onStartOnboarding}
              style={{
                padding: '14px 28px',
                borderRadius: '8px',
                background: '#ffffff',
                color: 'var(--bg-dark)',
                border: '1px solid var(--border-light)',
                fontSize: '15px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Founder Onboarding & Pitch
            </button>
          </div>

          {/* Dedicated Accounts & Platform Roles Guide */}
          <div
            style={{
              marginTop: '32px',
              maxWidth: '920px',
              margin: '32px auto 0',
              background: '#fffdf9',
              border: '1px solid #d6c9b2',
              padding: '20px 24px',
              textAlign: 'left',
              boxShadow: '0 4px 12px rgba(12, 24, 38, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  🔑 Seed Accounts & Authentic Logins
                </span>
                <span style={{ fontSize: '11px', backgroundColor: '#f5efe5', padding: '2px 8px', border: '1px solid #d6c9b2', color: '#121a29' }}>
                  Password for all: <strong>Password123!</strong>
                </span>
              </div>
              <button
                onClick={onOpenLogin}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#0c1826',
                  color: '#f5efe5',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign In Now →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', fontSize: '12px' }}>
              <div style={{ padding: '8px 12px', background: '#f5efe5', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Investor Portal:</strong> Rohan Varma
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>investor@peakindia.vc</div>
              </div>
              <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Film Production:</strong> Raghavendra Rao (Garuda)
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>film.producer@nivesha.in</div>
              </div>
              <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Shoe D2C Brand:</strong> Vikramaditya Sahni
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>footwear.founder@nivesha.in</div>
              </div>
              <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Collateral Debt:</strong> Suresh Chandra (Apex CNC)
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>debt.founder@nivesha.in</div>
              </div>
              <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Rural Logistics:</strong> Sravani Reddy (GramaBlink)
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>logistics.founder@nivesha.in</div>
              </div>
              <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Healthcare Buyout:</strong> Dr. Hariprasad Varma
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>healthcare.founder@nivesha.in</div>
              </div>
              <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Real Estate Layout:</strong> Karthik Narayana
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>realestate.founder@nivesha.in</div>
              </div>
              <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Food & Hospitality:</strong> Arvind Nair (Malabar)
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>founder@malabarcoast.in</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Audiences Section */}
      <section style={{ padding: '80px 24px', background: '#faf9f5' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
            {/* For Investors */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: '14px',
                padding: '36px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="eyebrow" style={{ marginBottom: '12px' }}>FOR ACCREDITED INVESTORS</div>
              <h2 style={{ fontSize: '28px', marginBottom: '16px', color: 'var(--bg-dark)' }}>
                See the venture as it really is.
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                Skip the generic promotional decks. Nivesha provides verified 4-page diligence briefs covering verified
                traction, audited unit economics, MCA compliance, and customer interviews before you commit partner time.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                {[
                  'Verified traction metrics (GST, ARR, MRR, retention)',
                  'Direct confidential customer interview transcripts',
                  'Clear cap table and MCA statutory compliance checks',
                  'Mutual consent introduction with direct founder messaging',
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-main)' }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={onExploreVentures}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'var(--bg-dark)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                View Deal Directory &rarr;
              </button>
            </div>

            {/* For Founders */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: '14px',
                padding: '36px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="eyebrow" style={{ marginBottom: '12px' }}>FOR AMBITIOUS FOUNDERS</div>
              <h2 style={{ fontSize: '28px', marginBottom: '16px', color: 'var(--bg-dark)' }}>
                Tell your story the way investors need to hear it.
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                Stop sending cold decks that end up unread. Nivesha frames your business context, validates your core metrics,
                and puts your opportunity directly in front of vetted investors actively seeking your exact sector and stage.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                {[
                  'Structured onboarding questionnaire that highlights real traction',
                  'Independent verification that builds instant trust with leads',
                  'Zero spam policy: you control who connects with you',
                  'In-app direct chat once connection request is mutually approved',
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-main)' }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={onStartOnboarding}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  background: '#f2eae0',
                  color: 'var(--bg-dark)',
                  border: '1px solid #d4c5ae',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Start Founder Questionnaire &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Ventures Preview */}
      <section style={{ padding: '80px 24px', background: '#f6f1e7', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="eyebrow">VERIFIED DEAL ROOM</div>
              <h2 style={{ fontSize: '34px', color: 'var(--bg-dark)', marginTop: '6px' }}>
                Active Ventures Currently Raising
              </h2>
            </div>
            <button
              onClick={onExploreVentures}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-gold)',
                fontWeight: 600,
                fontSize: '15px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              Browse all {ventures.length} ventures &rarr;
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {ventures.slice(0, 3).map((v) => (
              <div
                key={v.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--bg-dark)', margin: 0 }}>
                        {v.company_name}
                      </h3>
                      <div style={{ fontSize: '13px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                        {v.sector} • {v.location}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: '#f5efe5',
                          border: '1px solid #d6c9b2',
                          color: '#7a5c2e',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {(v.proposed_arrangement || 'Standard').replace(/_/g, ' ')}
                      </span>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: '#e9f5ed',
                          color: 'var(--accent-green)',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {v.stage}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '18px' }}>
                    {v.tag_line}
                  </p>

                  {/* Traction Grid */}
                  <div
                    style={{
                      background: '#fcfaf5',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '18px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                    }}
                  >
                    {v.traction_metrics && v.traction_metrics.slice(0, 2).map((m, i) => (
                      <div key={i}>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{m.label}</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--bg-dark)' }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Seeking: <strong style={{ color: 'var(--bg-dark)' }}>{formatINR(v.capital_target)}</strong>
                  </div>
                </div>

                <button
                  onClick={() => onSelectVenture(v)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    background: '#f2eae0',
                    border: '1px solid #d4c5ae',
                    color: 'var(--bg-dark)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginTop: '12px',
                  }}
                >
                  Inspect 10-Section Dossier & Diligence Brief &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification Framework Section */}
      <section style={{ padding: '80px 24px', background: '#ffffff', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 52px' }}>
            <div className="eyebrow">OUR DUE DILIGENCE STANDARD</div>
            <h2 style={{ fontSize: '36px', color: 'var(--bg-dark)', marginTop: '8px', marginBottom: '16px' }}>
              What we verify before an introduction.
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
              We do not accept decks at face value. Our sector analysts audit the following 6 core pillars and publish
              verified findings directly into the venture brief.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '28px',
            }}
          >
            {diligencePillars.map((p) => (
              <div
                key={p.id}
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  padding: '24px',
                  background: '#faf9f5',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--bg-dark)', margin: 0 }}>
                    {p.name}
                  </h3>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {p.desc}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    background: '#e8f3ea',
                    color: 'var(--accent-green)',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  ✓ {p.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors We Know Section */}
      <section style={{ padding: '80px 24px', background: '#faf9f5', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px' }}>
            <div className="eyebrow">SECTOR DEPTH</div>
            <h2 style={{ fontSize: '36px', color: 'var(--bg-dark)', marginTop: '8px', marginBottom: '14px' }}>
              Sectors we know in depth.
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
              We focus on high-conviction Indian sectors where proprietary operational data and grounded unit economics
              separate real businesses from vanity growth.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {sectors.map((s, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  padding: '24px',
                }}
              >
                <h3 style={{ fontSize: '19px', fontWeight: 600, color: 'var(--bg-dark)', marginBottom: '10px' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                  {s.tagline}
                </p>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-gold)' }}>
                  {s.metrics}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / 4 Steps */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-dark)', color: '#ffffff' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 56px' }}>
            <div style={{ color: '#dcc9af', fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              THE NIVESHA PROCESS
            </div>
            <h2 style={{ fontSize: '36px', color: '#ffffff', marginTop: '10px', marginBottom: '14px' }}>
              From first conversation to introduction.
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-on-dark-muted)' }}>
              A disciplined, four-stage journey ensuring clean data and mutual consent before any direct contact.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '28px' }}>
            {[
              {
                step: '01',
                title: 'Share your goals',
                desc: 'Founders submit onboarding questionnaires with traction claims; investors define precise mandate requirements.',
              },
              {
                step: '02',
                title: 'Shape & verify',
                desc: 'Our independent reviewers audit financials, speak with customers, review MCA filings, and compile the diligence brief.',
              },
              {
                step: '03',
                title: 'Review the brief',
                desc: 'Investors inspect verified metrics and diligence findings. If aligned, the investor requests a connection with a deal note.',
              },
              {
                step: '04',
                title: 'Meet directly',
                desc: 'Once the founder reviews the investor profile and consents, private 1-on-1 messaging unlocks inside the platform.',
              },
            ].map((st, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-dark-card)',
                  border: '1px solid var(--border-dark)',
                  borderRadius: '10px',
                  padding: '28px',
                }}
              >
                <div
                  style={{
                    fontSize: '28px',
                    fontFamily: 'var(--font-serif)',
                    color: '#c4a974',
                    marginBottom: '12px',
                  }}
                >
                  {st.step}
                </div>
                <h3 style={{ fontSize: '18px', color: '#ffffff', marginBottom: '10px' }}>
                  {st.title}
                </h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-on-dark-muted)' }}>
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '80px 24px', background: '#faf9f5' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="eyebrow">COMMON QUESTIONS</div>
            <h2 style={{ fontSize: '36px', color: 'var(--bg-dark)', marginTop: '8px' }}>
              Before you get in touch.
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      background: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--bg-dark)',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '20px', color: 'var(--accent-gold)' }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 24px 20px',
                        fontSize: '14.5px',
                        lineHeight: 1.6,
                        color: 'var(--text-muted)',
                        borderTop: '1px solid #f2ede1',
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section
        style={{
          padding: '80px 24px',
          background: '#f1e8da',
          borderTop: '1px solid var(--border-light)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '38px', color: 'var(--bg-dark)', marginBottom: '16px' }}>
            Let’s understand what you’re looking to achieve.
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--text-muted)', marginBottom: '32px' }}>
            Whether you are deploying capital into high-conviction Indian businesses or raising your next round with verified credibility, Nivesha Ventures is your platform.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onExploreVentures}
              style={{
                padding: '14px 28px',
                borderRadius: '8px',
                background: 'var(--bg-dark)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '15px',
              }}
            >
              Browse Deal Room
            </button>
            <button
              onClick={onStartOnboarding}
              style={{
                padding: '14px 28px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                color: 'var(--bg-dark)',
                fontWeight: 600,
                fontSize: '15px',
              }}
            >
              Start Founder Application
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '40px 24px',
          background: 'var(--bg-dark)',
          color: 'var(--text-on-dark-muted)',
          fontSize: '13px',
          borderTop: '1px solid var(--border-dark)',
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
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: '#ffffff', fontWeight: 600 }}>
              Nivesha Ventures
            </span>
            <span style={{ marginLeft: '12px' }}>
              Independent diligence and verified venture introductions.
            </span>
          </div>
          <div>© {new Date().getFullYear()} Nivesha Ventures. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
