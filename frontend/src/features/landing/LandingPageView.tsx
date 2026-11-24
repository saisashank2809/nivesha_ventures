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
  onNavigateToDashboard?: () => void;
}

interface ArchetypePreview {
  id: string;
  name: string;
  sector: string;
  arrangement: string;
  target: string;
  summary: string;
  sectionsPreview: Array<{ num: string; title: string; highlight: string; source: string }>;
}

const ARCHETYPES: ArchetypePreview[] = [
  {
    id: 'film',
    name: 'Garuda: The Legend Begins',
    sector: 'Film / Entertainment',
    arrangement: 'Fractional Equity Units + Producer Credits',
    target: '₹6.00 Cr (50% of ₹12 Cr Budget)',
    summary: 'High-concept mythological fantasy action feature film with locked credentials (Hanu-Man DOP, Sam CS score). Seeking ₹6 Cr via ₹25 Lakhs per unit with tiered producer credits.',
    sectionsPreview: [
      { num: '01', title: 'Venture Overview', highlight: 'Mythological adventure film written by national-award winning script consultants. Theatrical & digital rights locked.', source: 'FOUNDER DECLARATION' },
      { num: '04', title: 'Capital Requirement', highlight: 'Total budget ₹12 Cr; promoter equity ₹6 Cr committed. Seeking ₹6 Cr gap divided into 24 fractional units of ₹25 Lakhs each.', source: 'BUDGET SCHEDULE' },
      { num: '06', title: 'Investment Proposal', highlight: 'Priority recoupment from first box-office & OTT proceeds before equity split. Tiered producer credits (Co-Producer, Presents).', source: 'STRUCTURE TERMS' },
      { num: '07', title: 'Execution Capability', highlight: 'DOP Dasaradhi Sivendra (Hanu-Man), music director Sam CS (Vikram, Kaithi). 65-day principal photography schedule.', source: 'CREDENTIALS' },
      { num: '08', title: 'Risks & Dependencies', highlight: 'VFX vendor milestone sign-offs, weather window in Araku Valley, and Hindi satellite pre-licensing timelines.', source: 'DISCLOSURES' },
      { num: '10', title: 'Evidence & Next Steps', highlight: 'Script copyright registration, lead actor agreement, bank escrow mandate under platform review.', source: 'REVIEW DESK' },
    ],
  },
  {
    id: 'shoe',
    name: 'StrideCraft Footwear',
    sector: 'Manufacturing / Consumer Brand',
    arrangement: 'Growth Capital + Celebrity Revenue Share',
    target: '₹3.00 Cr Growth Facility',
    summary: 'Operating Indian footwear manufacturer expanding D2C reach with a zero-upfront-fee celebrity service line model, sharing per-unit net revenue to drive pan-India buzz.',
    sectionsPreview: [
      { num: '02', title: 'Current Position', highlight: '₹42 Lakhs MRR with 42% gross margin. Operating 12,000 pairs/month capacity in Agra industrial corridor.', source: 'OPERATING AUDIT' },
      { num: '03', title: 'Opportunity', highlight: 'Restructuring brand around zero-upfront celebrity endorsement with 4.5% revenue-share per pair sold.', source: 'MARKET CONTEXT' },
      { num: '05', title: 'Use of Capital', highlight: '₹1.2 Cr in specialized injection molds; ₹1.1 Cr launch inventory; ₹70 Lakhs digital distribution setup.', source: 'DEPLOYMENT PLAN' },
      { num: '06', title: 'Investment Proposal', highlight: 'Growth equity tranche with liquidation preference and monthly MIS reporting verified via GST filings.', source: 'STRUCTURE TERMS' },
      { num: '08', title: 'Risks & Dependencies', highlight: 'Talent campaign schedule delivery, return-rate management, and rubber raw material price volatility.', source: 'DISCLOSURES' },
      { num: '10', title: 'Evidence & Next Steps', highlight: '3-year audited financials, MCA 2024 filings, and preliminary celebrity term sheet on file.', source: 'REVIEW DESK' },
    ],
  },
  {
    id: 'debt',
    name: 'Apex CNC Precision',
    sector: 'Manufacturing / Industrial Debt',
    arrangement: '18% Secured Debt (3 BHK Collateral)',
    target: '₹25.00 Lakhs Working Capital',
    summary: 'Precision CNC machining supplier serving aerospace and automotive clients, offering a 1-year loan at 18% p.a. fully secured against a 3 BHK luxury residential flat.',
    sectionsPreview: [
      { num: '01', title: 'Venture Overview', highlight: '10-year established CNC machining facility holding AS9100 aerospace certification in Hyderabad.', source: 'FOUNDER DECLARATION' },
      { num: '04', title: 'Capital Requirement', highlight: '₹25 Lakhs for raw titanium billet procurement against verified purchase orders worth ₹85 Lakhs.', source: 'BUDGET SCHEDULE' },
      { num: '06', title: 'Investment Proposal', highlight: '18% committed annual return payable quarterly. First mortgage charge registered on unencumbered 3 BHK flat.', source: 'STRUCTURE TERMS' },
      { num: '08', title: 'Risks & Dependencies', highlight: 'Repayment dependent on 60-day Tier-1 aerospace payment terms; title search verification required.', source: 'DISCLOSURES' },
      { num: '09', title: 'Investor Participation', highlight: 'Registered mortgage deed with power of attorney, quarterly audit inspection rights, and post-dated cheques.', source: 'GOVERNANCE' },
      { num: '10', title: 'Evidence & Next Steps', highlight: 'Property title search clearance, encumbrance certificate, and CA-certified net worth certificate verified.', source: 'REVIEW DESK' },
    ],
  },
  {
    id: 'logistics',
    name: 'GramaBlink Logistics',
    sector: 'Logistics / Rural Delivery',
    arrangement: 'Tier-3 Network Equity Financing',
    target: '₹1.20 Cr Expansion Round',
    summary: 'Hyperlocal 30-minute delivery infrastructure in Andhra Pradesh Tier-3 towns (Vizianagaram, Bobbili), partnering with DWACRA women self-help groups for village micro-hubs.',
    sectionsPreview: [
      { num: '02', title: 'Current Position', highlight: '14,800 monthly deliveries across 3 towns; ₹18 average gross delivery take-rate; cash-flow breakeven.', source: 'OPERATING AUDIT' },
      { num: '03', title: 'Opportunity', highlight: 'Capturing unserved tier-3 FMCG demand with 6,500 daily active households and 120 kirana merchant partners.', source: 'MARKET CONTEXT' },
      { num: '05', title: 'Use of Capital', highlight: '8 new town micro-hubs, 40 retrofitted EV two-wheelers, and regional dispatch routing software.', source: 'DEPLOYMENT PLAN' },
      { num: '07', title: 'Execution Capability', highlight: 'Promoters ex-Delhivery & Ninjacart; formal partnership with 24 DWACRA cluster federations.', source: 'CREDENTIALS' },
      { num: '08', title: 'Risks & Dependencies', highlight: 'Monsoon access in rural interior mandals, regional smartphone penetration, and merchant credit cycles.', source: 'DISCLOSURES' },
      { num: '10', title: 'Evidence & Next Steps', highlight: 'UPI settlement records, Gram Panchayat operating permissions, and fleet insurance papers verified.', source: 'REVIEW DESK' },
    ],
  },
  {
    id: 'hospital',
    name: 'Varma Superspeciality Hospital',
    sector: 'Healthcare / Acquisition',
    arrangement: '50% Secondary Equity Buyout',
    target: '₹8.00 Cr Partial Acquisition',
    summary: '120-bed established multi-specialty hospital with digital Cath Lab and NABH accreditation. Founding director offering 50% equity buyout for institutional expansion.',
    sectionsPreview: [
      { num: '01', title: 'Venture Overview', highlight: 'NABH-accredited tertiary center operating for 8 years with cardiology, orthopedics, and nephrology focus.', source: 'FOUNDER DECLARATION' },
      { num: '02', title: 'Current Position', highlight: '₹14.2 Cr FY25 revenue; 22.4% EBITDA; 74% average bed occupancy; 18 full-time senior surgeons.', source: 'OPERATING AUDIT' },
      { num: '06', title: 'Investment Proposal', highlight: '50% equity transfer from retiring co-founder; joint board nomination rights; quarterly dividend distribution.', source: 'STRUCTURE TERMS' },
      { num: '07', title: 'Execution Capability', highlight: 'Retaining Medical Director (30 yrs surgical experience) with 5-year lock-in and clinical autonomy.', source: 'CREDENTIALS' },
      { num: '08', title: 'Risks & Dependencies', highlight: 'Aarogyasri / Ayushman Bharat state reimbursement receivables (average 75-day turnaround).', source: 'DISCLOSURES' },
      { num: '10', title: 'Evidence & Next Steps', highlight: 'Bio-medical waste compliance, AERB radiation permits, fire safety NOC, and 3-year statutory audits verified.', source: 'REVIEW DESK' },
    ],
  },
  {
    id: 'realestate',
    name: 'Suryam Meadows Layout',
    sector: 'Real Estate / Land Development',
    arrangement: 'Project Financing + 1st Charge Mortgage',
    target: '₹4.50 Cr Phase-1 Capital',
    summary: '18-acre DTCP-approved plotted community adjacent to upcoming industrial corridor. Seeking ₹4.5 Cr for underground cabling, black-top roads, and clubhouse development.',
    sectionsPreview: [
      { num: '01', title: 'Venture Overview', highlight: '18-acre plotted development layout with 210 residential plots; DTCP final technical sanction secured.', source: 'FOUNDER DECLARATION' },
      { num: '04', title: 'Capital Requirement', highlight: '₹4.5 Cr for civil works, solar lighting, rainwater harvesting, and gated security infrastructure.', source: 'BUDGET SCHEDULE' },
      { num: '06', title: 'Investment Proposal', highlight: 'Project debt facility with 1.4x asset mortgage cover over 80 designated commercial boundary plots.', source: 'STRUCTURE TERMS' },
      { num: '08', title: 'Risks & Dependencies', highlight: 'Pacing of plot sales dependent on state highway bypass completion; water clearance renewal.', source: 'DISCLOSURES' },
      { num: '09', title: 'Investor Participation', highlight: 'Escrow account on plot registration proceeds; mandatory 30% revenue sweep to capital retirement.', source: 'GOVERNANCE' },
      { num: '10', title: 'Evidence & Next Steps', highlight: '30-year non-encumbrance certificate, DTCP sanction letter, and soil stability reports verified.', source: 'REVIEW DESK' },
    ],
  },
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  ventures,
  currentUser,
  onExploreVentures,
  onStartOnboarding,
  onOpenLogin,
  onSelectVenture,
  onNavigateToDashboard,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedArchetypeIndex, setSelectedArchetypeIndex] = useState<number>(0);
  const [showDemoCredentials, setShowDemoCredentials] = useState<boolean>(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const activeArchetype = ARCHETYPES[selectedArchetypeIndex] || ARCHETYPES[0];

  const faqs = [
    {
      q: 'What is the role of Nivesha Ventures in investment transactions?',
      a: 'Nivesha Ventures acts solely as an independent due diligence, structuring, and introduction technology platform. We are not a broker-dealer, investment advisor, or custodian. We never hold, pool, or escrow investor funds. All capital transfers and legal documentation occur bilaterally and directly between the commercial bank accounts of the transacting parties.',
    },
    {
      q: 'What is the standard deal ticket size and platform working assumption?',
      a: 'Our operating baseline assumes minimum individual investment tickets of ₹10 Lakhs (ranging from ₹10 Lakhs up to ₹8 Crores). Ventures listed on Nivesha are typically seeking between ₹25 Lakhs and ₹15 Crores across debt, revenue share, fractional equity, or secondary buyout structures.',
    },
    {
      q: 'How does Nivesha verify venture claims before introduction?',
      a: 'Every venture must complete our standardized 10-section dossier. Our independent Review Desk verifies submitted P&L against GST filings, checks MCA statutory compliance, conducts primary reference calls with actual paying customers and suppliers, and verifies physical collateral titles before clearing any venture for facilitation.',
    },
    {
      q: 'How do introductions and direct communication work?',
      a: 'To maintain high institutional hygiene and prevent unsolicited spam, all direct communication is strictly gated by mutual consent. An investor submits a formal connection request with a structured deal note. Once the founder inspects the investor’s profile and approves, a private 1-on-1 direct encrypted chat channel is immediately unlocked.',
    },
    {
      q: 'What are the platform fees and when are they confirmed?',
      a: 'In accordance with our neutral facilitation guidelines, platform fees are strictly marked "To be confirmed upon introduction readiness." Nivesha does not promise speculative transaction fees or take unauthorized cuts.',
    },
    {
      q: 'Can founders edit their venture presentation and add custom sections?',
      a: 'Yes. Once registered, founders access their dedicated Founder Dashboard where they can edit the 10 core sections, add unlimited custom sections (such as Box Office Breakdown or Collateral Title Reports), upload high-resolution media, and manage inbound investor requests.',
    },
  ];

  return (
    <div style={{ width: '100%', overflowX: 'hidden', backgroundColor: '#faf9f5' }}>
      {/* Logged-In Executive Strip */}
      {currentUser && (
        <div
          style={{
            background: 'linear-gradient(90deg, #0c1826 0%, #162638 100%)',
            color: '#f5efe5',
            padding: '10px 24px',
            borderBottom: '1px solid #7a5c2e',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                backgroundColor: '#7a5c2e',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {currentUser.role.replace('_', ' ')} ACTIVE
            </span>
            <span style={{ fontSize: '13.5px' }}>
              Welcome, <strong>{currentUser.full_name}</strong>. You are currently viewing the public platform showcase.
            </span>
          </div>

          <button
            onClick={onNavigateToDashboard}
            style={{
              padding: '6px 16px',
              backgroundColor: '#f5efe5',
              color: '#0c1826',
              fontWeight: 700,
              fontSize: '12.5px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
          >
            <span>Go to your {currentUser.role === 'FOUNDER' ? 'Founder Dashboard' : currentUser.role === 'INVESTOR' ? 'Investor Dashboard' : 'Review Desk'}</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section
        style={{
          padding: '88px 24px 72px',
          background: 'radial-gradient(ellipse at 50% 15%, #ffffff 0%, #faf8f2 50%, #f3ece0 100%)',
          borderBottom: '1px solid #d6c9b2',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          {/* Eyebrow badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 18px',
              borderRadius: '9999px',
              background: '#f1e6d4',
              border: '1px solid #dcc9af',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#7a5c2e',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '26px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#7a5c2e',
              }}
            />
            Independent Capital Facilitation & Due Diligence
          </div>

          <h1
            style={{
              fontSize: '52px',
              lineHeight: 1.15,
              fontWeight: 600,
              color: '#0c1826',
              marginBottom: '22px',
              letterSpacing: '-0.025em',
              fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
            }}
          >
            Institutional Capital Facilitation for Verified Indian Enterprises.
          </h1>

          <p
            style={{
              fontSize: '19px',
              lineHeight: 1.6,
              color: '#4c566a',
              maxWidth: '820px',
              margin: '0 auto 36px',
            }}
          >
            We bridge the gap between accredited investors and high-conviction Indian businesses across film production,
            consumer manufacturing, rural logistics, hospital buyouts, and real estate. Every venture is presented through
            our standardized 10-section dossier with primary evidence verification—eliminating pitch deck speculation.
          </p>

          {/* Action CTAs */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '48px',
            }}
          >
            <button
              onClick={onExploreVentures}
              style={{
                padding: '14px 32px',
                borderRadius: '6px',
                background: '#0c1826',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(12, 24, 38, 0.25)',
                cursor: 'pointer',
              }}
            >
              <span>Explore Verified Opportunities</span>
              <span>&rarr;</span>
            </button>

            <button
              onClick={onStartOnboarding}
              style={{
                padding: '14px 28px',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#0c1826',
                border: '1px solid #c5b59b',
                fontSize: '15px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <span>Submit Venture for Review</span>
            </button>
          </div>

          {/* 4 Key Platform Working Pillars Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              maxWidth: '920px',
              margin: '0 auto',
              textAlign: 'left',
            }}
          >
            <div style={{ background: '#ffffff', border: '1px solid #d6c9b2', padding: '16px 20px', borderRadius: '8px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0c1826', fontFamily: "Newsreader, Georgia, serif" }}>
                ≥ ₹10 Lakhs
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#7a5c2e', marginTop: '2px' }}>
                Minimum Deal Baseline
              </div>
              <div style={{ fontSize: '12px', color: '#687282', marginTop: '4px' }}>
                Working assumption for serious institutional and accredited tickets.
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #d6c9b2', padding: '16px 20px', borderRadius: '8px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0c1826', fontFamily: "Newsreader, Georgia, serif" }}>
                10 Sections
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#7a5c2e', marginTop: '2px' }}>
                Unified Dossier Standard
              </div>
              <div style={{ fontSize: '12px', color: '#687282', marginTop: '4px' }}>
                Every venture presents operational facts, terms, and risks identically.
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #d6c9b2', padding: '16px 20px', borderRadius: '8px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0c1826', fontFamily: "Newsreader, Georgia, serif" }}>
                6 Pillars
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#7a5c2e', marginTop: '2px' }}>
                Primary Diligence Audit
              </div>
              <div style={{ fontSize: '12px', color: '#687282', marginTop: '4px' }}>
                Audited GST, MCA checks, customer interviews, and collateral search.
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #d6c9b2', padding: '16px 20px', borderRadius: '8px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0c1826', fontFamily: "Newsreader, Georgia, serif" }}>
                100% Consent
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#7a5c2e', marginTop: '2px' }}>
                Gated Direct Messaging
              </div>
              <div style={{ fontSize: '12px', color: '#687282', marginTop: '4px' }}>
                Direct meetings and encrypted chat unlock only upon mutual approval.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Capital Facilitation Works (Sequential 4-Stage Architecture) */}
      <section style={{ padding: '80px 24px', background: '#faf9f5', borderBottom: '1px solid #d6c9b2' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              THE FACILITATION DISCIPLINE
            </div>
            <h2 style={{ fontSize: '36px', color: '#0c1826', marginTop: '8px', marginBottom: '14px', fontFamily: "Newsreader, Georgia, serif" }}>
              How Nivesha Facilitates High-Value Capital.
            </h2>
            <p style={{ fontSize: '16px', color: '#536074', lineHeight: 1.6 }}>
              A neutral, transparent pathway that separates operating facts, proposed arrangement structures, and evidence verification before capital conversations begin.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {[
              {
                step: '01',
                title: '10-Section Intake',
                subtitle: 'Structured Promoter Profile',
                description: 'The promoter submits verified baseline facts, cap table, current operating traction, itemized use of funds, and proposed consideration terms.',
              },
              {
                step: '02',
                title: 'Review Desk Audit',
                subtitle: 'Independent Evidence Check',
                description: 'Our review analysts examine 3-year P&L against GST filings, conduct primary customer calls, inspect title deeds, and publish verified badges.',
              },
              {
                step: '03',
                title: 'Mandate Discovery',
                subtitle: 'Grounded Investor Matching',
                description: 'Institutional capital providers inspect verified dossiers matched directly to their ticket sizes, preferred arrangements, and sector mandates.',
              },
              {
                step: '04',
                title: 'Mutual Consent Meet',
                subtitle: 'Direct Encrypted Chat',
                description: 'Once both founder and investor review each other’s credentials and formally consent, 1-on-1 private messaging unlocks without third-party interference.',
              },
            ].map((st, i) => (
              <div
                key={i}
                style={{
                  background: '#ffffff',
                  border: '1px solid #d6c9b2',
                  borderRadius: '10px',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(12, 24, 38, 0.04)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '32px',
                      fontFamily: "Newsreader, Georgia, serif",
                      color: '#7a5c2e',
                      fontWeight: 600,
                      marginBottom: '10px',
                    }}
                  >
                    {st.step}
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: 600, color: '#0c1826', marginBottom: '4px' }}>
                    {st.title}
                  </h3>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#7a5c2e', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                    {st.subtitle}
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#536074' }}>
                    {st.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive 10-Section Venture Architecture Deep-Dive */}
      <section style={{ padding: '84px 24px', background: '#f5efe5', borderBottom: '1px solid #d6c9b2' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 40px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              THE COMMON VENTURE MODEL
            </div>
            <h2 style={{ fontSize: '36px', color: '#0c1826', marginTop: '8px', marginBottom: '14px', fontFamily: "Newsreader, Georgia, serif" }}>
              One Rigorous Structure for Every Venture.
            </h2>
            <p style={{ fontSize: '16px', color: '#536074', lineHeight: 1.6 }}>
              Whether a film production, shoe factory, collateral loan, rural logistics hub, hospital buyout, or real estate layout—investors evaluate identical core sections with transparent proof.
            </p>
          </div>

          {/* Archetype Selector Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '32px',
            }}
          >
            {ARCHETYPES.map((arch, idx) => (
              <button
                key={arch.id}
                onClick={() => setSelectedArchetypeIndex(idx)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  backgroundColor: selectedArchetypeIndex === idx ? '#0c1826' : '#ffffff',
                  color: selectedArchetypeIndex === idx ? '#f5efe5' : '#0c1826',
                  border: selectedArchetypeIndex === idx ? '1px solid #0c1826' : '1px solid #d6c9b2',
                  fontSize: '13px',
                  fontWeight: selectedArchetypeIndex === idx ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {arch.name.split(':')[0]}
              </button>
            ))}
          </div>

          {/* Active Archetype Dossier Preview Box */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #d6c9b2',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 8px 24px rgba(12, 24, 38, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                paddingBottom: '20px',
                borderBottom: '1px solid #e8dfcf',
                marginBottom: '24px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#f5efe5', color: '#7a5c2e', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {activeArchetype.sector}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#e9f5ed', color: '#15803d', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {activeArchetype.arrangement}
                  </span>
                </div>
                <h3 style={{ fontSize: '26px', color: '#0c1826', margin: 0, fontFamily: "Newsreader, Georgia, serif" }}>
                  {activeArchetype.name}
                </h3>
                <p style={{ fontSize: '14.5px', color: '#536074', marginTop: '6px', maxWidth: '750px', lineHeight: 1.5 }}>
                  {activeArchetype.summary}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase' }}>
                  Target Capital
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#0c1826' }}>
                  {activeArchetype.target}
                </div>
                <button
                  onClick={onExploreVentures}
                  style={{
                    marginTop: '10px',
                    padding: '6px 14px',
                    backgroundColor: '#0c1826',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View in Deal Directory &rarr;
                </button>
              </div>
            </div>

            {/* Render 6 key sections from this archetype */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              {activeArchetype.sectionsPreview.map((sec, i) => (
                <div
                  key={i}
                  style={{
                    background: '#fcfbf8',
                    border: '1px solid #e8dfcf',
                    borderRadius: '8px',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e' }}>
                      SECTION {sec.num}
                    </span>
                    <span style={{ fontSize: '9.5px', fontWeight: 600, color: '#4c566a', backgroundColor: '#f0e8d9', padding: '2px 6px', borderRadius: '3px' }}>
                      {sec.source}
                    </span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
                    {sec.title}
                  </div>
                  <p style={{ fontSize: '13px', lineHeight: 1.55, color: '#536074', margin: 0 }}>
                    {sec.highlight}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Verified Ventures Showcase */}
      <section style={{ padding: '80px 24px', background: '#faf9f5', borderBottom: '1px solid #d6c9b2' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '36px',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                VERIFIED DEAL ROOM
              </div>
              <h2 style={{ fontSize: '36px', color: '#0c1826', marginTop: '6px', margin: 0, fontFamily: "Newsreader, Georgia, serif" }}>
                Active Ventures Currently Facilitating
              </h2>
            </div>
            <button
              onClick={onExploreVentures}
              style={{
                background: 'none',
                border: 'none',
                color: '#7a5c2e',
                fontWeight: 700,
                fontSize: '14.5px',
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '28px',
            }}
          >
            {ventures.map((v) => {
              const coverImg = v.hero_image_url || (v.gallery_urls && v.gallery_urls[0]);
              return (
                <div
                  key={v.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #d6c9b2',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(12, 24, 38, 0.05)',
                  }}
                >
                  {coverImg && (
                    <div style={{ position: 'relative', height: '170px', width: '100%', backgroundColor: '#0c1826' }}>
                      <img
                        src={coverImg}
                        alt={v.company_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(12, 24, 38, 0.6) 0%, transparent 70%)',
                        }}
                      />
                      <div style={{ position: 'absolute', bottom: '12px', left: '16px', display: 'flex', gap: '6px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(12, 24, 38, 0.85)',
                            color: '#f5efe5',
                            fontSize: '11px',
                            fontWeight: 600,
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          {v.sector}
                        </span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(122, 92, 46, 0.9)',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {(v.proposed_arrangement || 'Standard').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#0c1826', margin: 0, fontFamily: "Newsreader, Georgia, serif" }}>
                          {v.company_name}
                        </h3>
                        <span style={{ fontSize: '11.5px', color: '#687282', fontWeight: 500 }}>
                          {v.location}
                        </span>
                      </div>

                      <p style={{ fontSize: '13.5px', color: '#536074', lineHeight: 1.5, marginBottom: '18px' }}>
                        {v.tag_line}
                      </p>

                      {/* Traction Highlights */}
                      <div
                        style={{
                          background: '#fcfbf8',
                          border: '1px solid #e8dfcf',
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
                            <div style={{ fontSize: '10.5px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase' }}>
                              {m.label}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0c1826' }}>
                              {m.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
                        <span style={{ fontSize: '12px', color: '#687282' }}>Target Sought:</span>
                        <strong style={{ fontSize: '17px', color: '#0c1826', fontWeight: 700 }}>
                          {formatINR(v.capital_target)}
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectVenture(v)}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '6px',
                        background: '#f5efe5',
                        border: '1px solid #c5b59b',
                        color: '#0c1826',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>Inspect 10-Section Dossier & Evidence</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Due Diligence Standards: The 6 Verification Pillars */}
      <section style={{ padding: '80px 24px', background: '#ffffff', borderBottom: '1px solid #d6c9b2' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 52px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              OUR DUE DILIGENCE MANDATE
            </div>
            <h2 style={{ fontSize: '36px', color: '#0c1826', marginTop: '8px', marginBottom: '14px', fontFamily: "Newsreader, Georgia, serif" }}>
              What We Verify Before Any Introduction.
            </h2>
            <p style={{ fontSize: '16px', color: '#536074', lineHeight: 1.6 }}>
              We do not accept decks at face value. Our Review Desk audits the following 6 core verification pillars and publishes findings directly into the venture brief.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {[
              {
                title: 'Financials & GST Reconciliations',
                desc: '3 years of audited balance sheets, profit & loss, monthly GST portal returns, and bank statements confirming cash collection run-rate.',
                badge: 'Audited & Reconciled',
              },
              {
                title: 'MCA Statutory & Cap Table Verification',
                desc: 'Ministry of Corporate Affairs filings, shareholder agreements, director disqualification search, charge registries, and IP assignments.',
                badge: 'Statutory Search',
              },
              {
                title: 'Physical Collateral & Asset Title',
                desc: '30-year non-encumbrance certificate, registered sub-registrar mortgage charges, site physical inspections, and independent valuation.',
                badge: 'Physical Verification',
              },
              {
                title: 'Primary Customer & Supplier Reference Calls',
                desc: 'Confidential primary calls conducted by our analysts with actual enterprise buyers, vendors, and partners to verify repeat order health.',
                badge: 'Primary Reference Calls',
              },
              {
                title: 'Unit Economics Stress Testing',
                desc: 'Gross margin reality checks, working capital cycles, debtor collection days, customer acquisition cost payback, and burn coverage.',
                badge: 'Cashflow Stress-Tested',
              },
              {
                title: 'Milestone-Governed Capital Tranches',
                desc: 'Itemized use of capital budgets tied to concrete operational deliverables (molds, equipment, print copies, beds) before tranche release.',
                badge: 'Milestone Governed',
              },
            ].map((p, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #d6c9b2',
                  borderRadius: '10px',
                  padding: '24px',
                  background: '#faf9f5',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0c1826', margin: 0 }}>
                    {p.title}
                  </h3>
                </div>
                <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#536074', marginBottom: '16px' }}>
                  {p.desc}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    background: '#e8f3ea',
                    color: '#15803d',
                    fontSize: '11.5px',
                    fontWeight: 700,
                  }}
                >
                  ✓ {p.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Neutral Facilitation & Governance Disclosures */}
      <section style={{ padding: '72px 24px', background: '#f5efe5', borderBottom: '1px solid #d6c9b2' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            REGULATORY ARCHITECTURE & TRUST
          </div>
          <h2 style={{ fontSize: '32px', color: '#0c1826', marginTop: '8px', marginBottom: '16px', fontFamily: "Newsreader, Georgia, serif" }}>
            Platform Neutrality & Clear Disclosures.
          </h2>
          <div style={{ textAlign: 'left', background: '#ffffff', border: '1px solid #d6c9b2', borderRadius: '10px', padding: '28px 32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: '#4c566a', lineHeight: 1.65 }}>
              <div>
                <strong style={{ color: '#0c1826' }}>• Independent Facilitator Role:</strong> Nivesha Ventures operates strictly as a technology and due diligence preparation platform. We are not a registered broker-dealer, stock exchange, alternative investment fund (AIF) manager, or portfolio manager under SEBI regulations.
              </div>
              <div>
                <strong style={{ color: '#0c1826' }}>• Zero Custody Policy:</strong> Nivesha Ventures never holds, solicits, pools, or escrows client funds. All investment transactions, debentures, share transfers, and loans are executed bilaterally directly between the commercial bank accounts of the transacting parties.
              </div>
              <div>
                <strong style={{ color: '#0c1826' }}>• Working Baseline & Deal Tickets:</strong> All venture parameters reflect an assumed institutional working baseline of ≥ ₹10 Lakhs ticket sizes. Platform fees are strictly marked "To be confirmed upon introduction readiness."
              </div>
              <div>
                <strong style={{ color: '#0c1826' }}>• Verified vs. Declared Separation:</strong> The platform maintains an explicit distinction between founder-submitted declarations, calculated benchmarks, and review-desk verified primary evidence.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '80px 24px', background: '#faf9f5', borderBottom: '1px solid #d6c9b2' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 style={{ fontSize: '36px', color: '#0c1826', marginTop: '8px', fontFamily: "Newsreader, Georgia, serif" }}>
              Answers for Investors and Founders.
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
                    border: '1px solid #d6c9b2',
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
                      color: '#0c1826',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '20px', color: '#7a5c2e', fontWeight: 700 }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 24px 20px',
                        fontSize: '14.5px',
                        lineHeight: 1.6,
                        color: '#536074',
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

      {/* Discreet Demo Evaluator Credentials Drawer */}
      <section style={{ padding: '32px 24px', background: '#f5efe5', borderBottom: '1px solid #d6c9b2' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🔑 Platform Evaluator Reference (Demo Accounts)
              </span>
              <p style={{ fontSize: '12px', color: '#687282', margin: '2px 0 0' }}>
                Quick credentials for testing individual founder dashboards and the investor portal. (Password: <code>password123</code> or <code>Password123!</code>)
              </p>
            </div>
            <button
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              style={{
                padding: '6px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #c5b59b',
                color: '#0c1826',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showDemoCredentials ? 'Hide Accounts ▲' : 'Show Accounts ▼'}
            </button>
          </div>

          {showDemoCredentials && (
            <div
              style={{
                marginTop: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '10px',
                fontSize: '12px',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ padding: '8px 12px', background: '#f5efe5', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Investor Portal:</strong> Rohan Varma
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>investor@peakindia.vc</div>
              </div>
              <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Film Production:</strong> Raghavendra Rao (Garuda)
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>film.producer@nivesha.in</div>
              </div>
              <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Shoe D2C Brand:</strong> Vikramaditya Sahni (StrideCraft)
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
                <strong style={{ color: '#0c1826' }}>Real Estate Layout:</strong> Karthik Narayana (Suryam)
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>realestate.founder@nivesha.in</div>
              </div>
              <div style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e3d6bf' }}>
                <strong style={{ color: '#0c1826' }}>Food & Hospitality:</strong> Arvind Nair (Malabar)
                <div style={{ color: '#7a5c2e', fontFamily: 'monospace', marginTop: '2px' }}>founder@malabarcoast.in</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Final Call to Action */}
      <section
        style={{
          padding: '88px 24px',
          background: '#f1e8da',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '38px', color: '#0c1826', marginBottom: '16px', fontFamily: "Newsreader, Georgia, serif" }}>
            Begin Your Capital Facilitation Journey.
          </h2>
          <p style={{ fontSize: '17px', color: '#536074', marginBottom: '32px', lineHeight: 1.6 }}>
            Whether evaluating verified enterprises for high-conviction deployment or raising capital with audited credibility, Nivesha Ventures provides the institutional infrastructure.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onExploreVentures}
              style={{
                padding: '14px 30px',
                borderRadius: '6px',
                background: '#0c1826',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Explore Verified Opportunities &rarr;
            </button>
            <button
              onClick={onStartOnboarding}
              style={{
                padding: '14px 28px',
                borderRadius: '6px',
                background: '#ffffff',
                border: '1px solid #c5b59b',
                color: '#0c1826',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Submit Enterprise Dossier
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '44px 24px',
          background: '#0c1826',
          color: '#94a3b8',
          fontSize: '13px',
          borderTop: '1px solid #23344a',
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
            <span style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: '19px', color: '#ffffff', fontWeight: 600 }}>
              Nivesha Ventures
            </span>
            <span style={{ marginLeft: '12px', color: '#cbd5e1' }}>
              Independent Capital Facilitation & Diligence Preparation Platform.
            </span>
          </div>
          <div>© {new Date().getFullYear()} Nivesha Ventures. All rights reserved. Platform fees to be confirmed upon introduction readiness.</div>
        </div>
      </footer>
    </div>
  );
};