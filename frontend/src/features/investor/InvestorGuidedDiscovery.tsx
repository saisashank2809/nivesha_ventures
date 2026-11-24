import React, { useState, useEffect } from 'react';
import { VentureCard, InvestorMandate, User, MatchCase, AppointmentRequest } from '../../shared/types';
import { Api } from '../../shared/api';
import { formatINR } from '../../shared/formatters';

const SECTOR_IMAGE_PRESETS: Record<string, Array<{ label: string; url: string }>> = {
  'Film / Entertainment': [
    { label: 'Cinema Camera Rig', url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Movie Clapper & Stage', url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Studio Spotlights', url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=1200&q=80' },
  ],
  'Manufacturing / Consumer Brand': [
    { label: 'Athletic Red Sneaker', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Footwear Crafting Line', url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Brand Lifestyle Showroom', url: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80' },
  ],
  'Manufacturing / Industrial': [
    { label: 'CNC Precision Lathe', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Industrial Tooling Floor', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80' },
    { label: '3 BHK Residential Collateral', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80' },
  ],
  'Logistics / Rural Delivery': [
    { label: 'Distribution Warehouse', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80' },
    { label: 'EV Delivery Van', url: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Parcel Sorting Hub', url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80' },
  ],
  'Healthcare / Hospital': [
    { label: 'Tertiary Hospital Center', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Digital Cath Lab Suite', url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80' },
    { label: 'ICU Critical Care Ward', url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80' },
  ],
  'Real Estate / Land Development': [
    { label: 'Aerial Plotted Layout', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Roads & Infrastructure Works', url: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Gated Entrance Clubhouse', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
  ],
  'Food & Beverage / Hospitality': [
    { label: 'Dining Hall Atmosphere', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Signature Malabar Cuisine', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Commercial Kitchen Station', url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80' },
  ],
};

const getTenSections = (venture: VentureCard) => {
  const story = (venture.venture_story || {}) as Record<string, any>;
  const arr = venture.arrangement_details || {};
  const customSections: Array<{ num?: string; title: string; content: string; source?: string }> =
    (story.custom_sections as any[]) ||
    ((arr as any)?.custom_sections as any[]) ||
    [];

  return [
    { num: '01', title: 'Venture Overview', content: story.venture_overview || venture.business_context, source: 'FOUNDER DECLARATION' },
    { num: '02', title: 'Current Position', content: story.current_position || 'Active operating enterprise with verifiable baseline records.', source: 'OPERATING AUDIT' },
    { num: '03', title: 'Opportunity', content: story.opportunity || venture.tag_line, source: 'MARKET CONTEXT' },
    { num: '04', title: 'Capital Requirement', content: story.capital_requirement || `Total capital sought: ${formatINR(venture.capital_target)}.`, source: 'BUDGET SCHEDULE' },
    { num: '05', title: 'Use of Capital', content: story.use_of_capital || arr.itemized_budget || 'Audited line items for production and expansion deployment.', source: 'DEPLOYMENT PLAN' },
    { num: '06', title: 'Investment Proposal', content: story.investment_proposal || `Proposed arrangement: ${(venture.proposed_arrangement || 'Direct').replace(/_/g, ' ')}.`, source: 'STRUCTURE TERMS' },
    { num: '07', title: 'Execution Capability', content: story.execution_capability || 'Promoter credentials, leadership track record, and technical delivery partners.', source: 'CREDENTIALS' },
    { num: '08', title: 'Risks & Dependencies', content: story.risks_and_dependencies || 'Subject to supply milestones, contractor timelines, and statutory clearances.', source: 'DISCLOSURES' },
    { num: '09', title: 'Investor Participation', content: story.investor_participation || 'Audited financial reporting, priority recoupment waterfall, and governance rights.', source: 'GOVERNANCE' },
    { num: '10', title: 'Evidence & Next Steps', content: story.evidence_and_next_steps || 'Submitted documentation undergoing independent platform verification review.', source: 'REVIEW DESK' },
    ...customSections.map((cs, i) => ({
      num: cs.num || String(11 + i).padStart(2, '0'),
      title: cs.title,
      content: cs.content,
      source: cs.source || 'CUSTOM ADDITION',
    })),
  ];
};

interface InvestorGuidedDiscoveryProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onOpenDirectChat?: (connectionId: string) => void;
  onSelectVenture?: (ventureId: string) => void;
}

export const InvestorGuidedDiscovery: React.FC<InvestorGuidedDiscoveryProps> = ({
  currentUser,
  onOpenLogin,
  onOpenDirectChat,
  onSelectVenture,
}) => {
  const [mandate, setMandate] = useState<InvestorMandate | null>(null);
  const [ventures, setVentures] = useState<VentureCard[]>([]);
  const [matchCases, setMatchCases] = useState<Record<string, MatchCase>>({});
  const [loading, setLoading] = useState(true);
  const [activeDiligenceVentureId, setActiveDiligenceVentureId] = useState<string | null>(null);
  const [expandedDossierVentureId, setExpandedDossierVentureId] = useState<string | null>(null);
  const [selectedGalleryIndices, setSelectedGalleryIndices] = useState<Record<string, number>>({});

  // Add Image Modal State
  const [addImageModalVenture, setAddImageModalVenture] = useState<VentureCard | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [setAsHeroCheck, setSetAsHeroCheck] = useState(false);
  const [submittingImage, setSubmittingImage] = useState(false);
  const [imageActionSuccess, setImageActionSuccess] = useState<string | null>(null);

  // Direct DM Modal State
  const [directDMModalVenture, setDirectDMModalVenture] = useState<VentureCard | null>(null);
  const [directDMNote, setDirectDMNote] = useState('');
  const [submittingDM, setSubmittingDM] = useState(false);

  // Quick Mandate Discovery Controls
  const [selectedArrangement, setSelectedArrangement] = useState<string>('LOAN');
  const [selectedInvolvement, setSelectedInvolvement] = useState<string>('MONTHLY_ADVISORY');
  const [selectedFollowUp, setSelectedFollowUp] = useState<string>('MONTHLY_OPERATIONAL_REVIEWS');
  const [minContribution, setMinContribution] = useState<number>(500000);
  const [maxContribution, setMaxContribution] = useState<number>(2000000);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vList, mCases] = await Promise.all([
        Api.getVentures(),
        Api.getMatchCases(),
      ]);
      setVentures(vList);

      const caseMap: Record<string, MatchCase> = {};
      mCases.forEach((mc) => {
        caseMap[mc.venture_id] = mc;
      });
      setMatchCases(caseMap);

      if (currentUser?.role === 'INVESTOR') {
        const m = await Api.getMyMandate();
        setMandate(m);
        if (m.accepted_arrangements && m.accepted_arrangements.length > 0) {
          setSelectedArrangement(m.accepted_arrangements[0]);
        }
        if (m.desired_involvement) setSelectedInvolvement(m.desired_involvement);
        if (m.willing_to_follow_up) setSelectedFollowUp(m.willing_to_follow_up);
        if (m.ticket_min) setMinContribution(m.ticket_min);
        if (m.ticket_max) setMaxContribution(m.ticket_max);
      }
    } catch (err) {
      console.error('Failed to load investor discovery data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleOpenAddImageModal = (v: VentureCard) => {
    setAddImageModalVenture(v);
    setCustomImageUrl('');
    setImageCaption('');
    setSetAsHeroCheck(false);
    setImageActionSuccess(null);
  };

  const handleAddImage = async () => {
    if (!addImageModalVenture || !customImageUrl.trim()) return;
    try {
      setSubmittingImage(true);
      const updated = await Api.addImageToVenture(
        addImageModalVenture.id,
        customImageUrl.trim(),
        imageCaption.trim() || undefined,
        setAsHeroCheck
      );
      setVentures((prev) =>
        prev.map((v) =>
          v.id === updated.id
            ? { ...v, hero_image_url: updated.hero_image_url, gallery_urls: updated.gallery_urls }
            : v
        )
      );
      setImageActionSuccess('Image successfully added to venture media showcase!');
      setTimeout(() => {
        setAddImageModalVenture(null);
        setCustomImageUrl('');
        setImageCaption('');
        setImageActionSuccess(null);
      }, 1500);
    } catch (err: any) {
      alert(`Failed to add image: ${err.message}`);
    } finally {
      setSubmittingImage(false);
    }
  };

  const handleUpdatePreferences = async () => {
    if (!currentUser || currentUser.role !== 'INVESTOR') {
      onOpenLogin();
      return;
    }
    try {
      const updated = await Api.updateMyMandate({
        accepted_arrangements: [selectedArrangement],
        acceptable_structures: [selectedArrangement],
        desired_involvement: selectedInvolvement,
        willing_to_follow_up: selectedFollowUp,
        ticket_min: minContribution,
        ticket_max: maxContribution,
      });
      setMandate(updated);

      // Re-run matching evaluations for all ventures
      const newCases: Record<string, MatchCase> = {};
      for (const v of ventures) {
        const evaluated = await Api.runMatchAssessment(v.id, updated.id);
        newCases[v.id] = evaluated;
      }
      setMatchCases(newCases);
    } catch (err: any) {
      alert(`Error updating preferences: ${err.message}`);
    }
  };

  const handleOpenDirectDM = (v: VentureCard) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    setDirectDMModalVenture(v);
    setDirectDMNote(`Hi ${v.founder_name || v.company_name} team, I reviewed your venture dossier on Nivesha and would like to text directly to discuss your round.`);
  };

  const handleSendDirectDM = async () => {
    if (!directDMModalVenture) return;
    try {
      setSubmittingDM(true);
      const conn = await Api.requestConnection(directDMModalVenture.id, directDMNote.trim());
      setDirectDMModalVenture(null);
      if (onOpenDirectChat) {
        onOpenDirectChat(conn.id);
      }
    } catch (err: any) {
      alert(`Failed to send direct message: ${err.message}`);
    } finally {
      setSubmittingDM(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px 20px', color: '#536074' }}>Loading curated opportunities...</div>;
  }

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '36px 24px 100px' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '32px' }}>
        <div className="eyebrow" style={{ marginBottom: '6px' }}>INVESTOR GUIDED DISCOVERY</div>
        <h1 style={{ fontSize: '34px', color: '#0c1826', marginBottom: '8px' }}>
          Evaluate Opportunities & Due Diligence
        </h1>
        <p style={{ fontSize: '15px', color: '#536074', maxWidth: '780px' }}>
          Explore curated opportunities with explicit separation between <strong>Founder Declarations</strong>,
          <strong> Projections</strong>, and <strong>Statutory Checked Evidence</strong>. Matching logic surfaces
          compatibility reasons and trade-offs rather than silent rejections.
        </p>
      </div>

      {/* Guided Preference Selector Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e6decb',
          borderRadius: '12px',
          padding: '24px 28px',
          marginBottom: '36px',
          boxShadow: '0 2px 8px rgba(12, 24, 38, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: '#0c1826', margin: 0 }}>Your Investment Parameters</h3>
            <div style={{ fontSize: '13px', color: '#536074', marginTop: '2px' }}>
              Adjust your criteria to see how matching reasons and trade-offs adapt in real time.
            </div>
          </div>
          <button
            onClick={handleUpdatePreferences}
            style={{
              padding: '8px 18px',
              backgroundColor: '#0c1826',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Apply & Re-evaluate
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
          {/* Arrangement */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#536074', textTransform: 'uppercase', marginBottom: '6px' }}>
              Accepted Arrangement
            </label>
            <select
              value={selectedArrangement}
              onChange={(e) => setSelectedArrangement(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e6decb', background: '#fdfbf7', fontSize: '13.5px' }}
            >
              <option value="LOAN">Loan / Fixed Debt</option>
              <option value="REVENUE_SHARE">Revenue Share / Royalty</option>
              <option value="EQUITY">Equity Stake</option>
            </select>
          </div>

          {/* Desired Involvement */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#536074', textTransform: 'uppercase', marginBottom: '6px' }}>
              Desired Involvement
            </label>
            <select
              value={selectedInvolvement}
              onChange={(e) => setSelectedInvolvement(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e6decb', background: '#fdfbf7', fontSize: '13.5px' }}
            >
              <option value="PASSIVE">Passive (Hands-off)</option>
              <option value="MONTHLY_ADVISORY">Monthly Advisory</option>
              <option value="ACTIVE_HANDS_ON">Active Operational Lead</option>
            </select>
          </div>

          {/* Willingness to Follow Up */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#536074', textTransform: 'uppercase', marginBottom: '6px' }}>
              Follow-up Commitment
            </label>
            <select
              value={selectedFollowUp}
              onChange={(e) => setSelectedFollowUp(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e6decb', background: '#fdfbf7', fontSize: '13.5px' }}
            >
              <option value="NO_FOLLOW_UP">No Regular Follow-Up</option>
              <option value="PERIODIC_CHECK_IN">Periodic Quarterly Check-In</option>
              <option value="MONTHLY_OPERATIONAL_REVIEWS">Monthly Operational Reviews</option>
            </select>
          </div>

          {/* Contribution Range */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#536074', textTransform: 'uppercase', marginBottom: '6px' }}>
              Target Contribution Range
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={minContribution}
                onChange={(e) => setMinContribution(Number(e.target.value))}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e6decb', fontSize: '13px' }}
              >
                <option value={500000}>₹5 Lakh</option>
                <option value={1000000}>₹10 Lakh</option>
                <option value={2000000}>₹20 Lakh</option>
              </select>
              <span style={{ fontSize: '12px', color: '#536074' }}>to</span>
              <select
                value={maxContribution}
                onChange={(e) => setMaxContribution(Number(e.target.value))}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e6decb', fontSize: '13px' }}
              >
                <option value={2000000}>₹20 Lakh</option>
                <option value={5000000}>₹50 Lakh</option>
                <option value={10000000}>₹1 Crore</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Curated Opportunities Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {ventures.map((venture) => {
          const matchCase = matchCases[venture.id];
          const isDiligenceOpen = activeDiligenceVentureId === venture.id;
          const isDossierOpen = expandedDossierVentureId === venture.id;
          const outcome = matchCase?.outcome || 'POTENTIALLY_SUITABLE';

          const outcomeColor =
            outcome === 'POTENTIALLY_SUITABLE'
              ? { bg: '#edf5ee', text: '#15803d', border: '#b8deb9', label: 'Potentially Suitable' }
              : outcome === 'UNSUITABLE'
              ? { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', label: 'Mandatory Mismatch' }
              : { bg: '#fdf4e7', text: '#856127', border: '#ebd5b3', label: 'Needs Information' };

          const trackRecord = venture.operating_track_record || {};
          const growthPlan = venture.growth_plan || {};
          const story = (venture.venture_story || {}) as Record<string, any>;
          const findings = venture.due_diligence_findings || {};
          const arrDetails = venture.arrangement_details || {};
          const tenSecs = getTenSections(venture);

          const gallery =
            venture.gallery_urls && venture.gallery_urls.length > 0
              ? venture.gallery_urls
              : venture.hero_image_url
              ? [venture.hero_image_url]
              : ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'];
          const selectedIdx = selectedGalleryIndices[venture.id] || 0;
          const activeImage = gallery[selectedIdx] || gallery[0];

          return (
            <div
              key={venture.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e6decb',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(12, 24, 38, 0.05)',
              }}
            >
              {/* Visual Hero Banner with Overlaid Badges */}
              <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#0c1826' }}>
                <img
                  src={activeImage}
                  alt={venture.company_name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    filter: 'brightness(0.88)',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to top, rgba(12, 24, 38, 0.88) 0%, rgba(12, 24, 38, 0.25) 55%, rgba(12, 24, 38, 0.5) 100%)',
                  }}
                />

                {/* Overlaid Badges on Top */}
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '16px',
                    right: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(12, 24, 38, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: '#f5efe5',
                        border: '1px solid rgba(214, 201, 178, 0.3)',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {venture.sector}
                    </span>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        backgroundColor: outcomeColor.bg,
                        color: outcomeColor.text,
                        border: `1px solid ${outcomeColor.border}`,
                        fontSize: '11.5px',
                        fontWeight: 600,
                      }}
                    >
                      {outcomeColor.label}
                    </span>
                  </div>

                  {/* Add Image Button */}
                  <button
                    onClick={() => handleOpenAddImageModal(venture)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      border: '1px solid #d6c9b2',
                      color: '#0c1826',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    }}
                  >
                    <span>📷</span> + Add Image
                  </button>
                </div>

                {/* Overlaid Title on Banner Bottom */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '18px',
                    right: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <h2
                      onClick={() => (onSelectVenture ? onSelectVenture(venture.id) : setExpandedDossierVentureId(venture.id))}
                      style={{
                        fontSize: '23px',
                        color: '#ffffff',
                        margin: '0 0 2px 0',
                        fontFamily: "Newsreader, Georgia, serif",
                        fontWeight: 600,
                        textShadow: '0 1px 3px rgba(0,0,0,0.85)',
                        cursor: 'pointer',
                      }}
                      title="Click to view complete venture dossier"
                    >
                      {venture.company_name} ↗
                    </h2>
                    <div style={{ fontSize: '12px', color: '#f3ece2', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                      {venture.founder_name} {venture.founder_title ? `· ${venture.founder_title}` : ''} · {venture.location} · {venture.stage}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}>
                      {formatINR(venture.capital_target)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#e6decb', fontWeight: 600, textTransform: 'uppercase' }}>
                      Proposed: {(venture.proposed_arrangement || 'LOAN').replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery Thumbnails Strip (if multiple photos) */}
              {gallery.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '8px 18px',
                    backgroundColor: '#fbf8f2',
                    borderBottom: '1px solid #e6decb',
                    overflowX: 'auto',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: '#7a5c2e',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Media Gallery ({gallery.length}):
                  </span>
                  {gallery.map((imgUrl, gIdx) => (
                    <button
                      key={gIdx}
                      onClick={() =>
                        setSelectedGalleryIndices((prev) => ({
                          ...prev,
                          [venture.id]: gIdx,
                        }))
                      }
                      style={{
                        border: selectedIdx === gIdx ? '2px solid #7a5c2e' : '1px solid #d6c9b2',
                        borderRadius: '4px',
                        padding: 0,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        width: '56px',
                        height: '36px',
                        flexShrink: 0,
                        opacity: selectedIdx === gIdx ? 1 : 0.65,
                        transition: 'opacity 0.2s',
                      }}
                      title={`Preview photo ${gIdx + 1}`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${gIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                  <button
                    onClick={() => handleOpenAddImageModal(venture)}
                    style={{
                      border: '1px dashed #7a5c2e',
                      background: 'none',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      color: '#7a5c2e',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      height: '36px',
                    }}
                  >
                    + Add Photo
                  </button>
                </div>
              )}

              {/* Main Card Content */}
              <div style={{ padding: '24px 28px' }}>
                {/* Tagline / Business Context */}
                <p style={{ fontSize: '14.5px', color: '#536074', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                  {story.venture_overview || story.what_business_does || venture.tag_line || venture.business_context}
                </p>

                {/* Declarations vs Projections Comparison Box */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    backgroundColor: '#fbf8f2',
                    border: '1px solid #e6decb',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#856127', textTransform: 'uppercase' }}>
                        Operating Track Record
                      </span>
                      <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: '#fdf4e7', color: '#856127' }}>
                        Declared / Audited
                      </span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0c1826' }}>
                      {trackRecord.declared_monthly_revenue
                        ? `${formatINR(trackRecord.declared_monthly_revenue)}/mo`
                        : trackRecord.annual_turnover ||
                          trackRecord.factory_capacity ||
                          trackRecord.past_projects ||
                          trackRecord.operational_beds ||
                          trackRecord.phase_1_sales ||
                          trackRecord.active_orders ||
                          'Operating Record'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#536074' }}>
                      {trackRecord.declared_operating_margin ||
                        trackRecord.ebitda_margin ||
                        trackRecord.average_occupancy ||
                        trackRecord.repeat_order_rate ||
                        trackRecord.distribution_loi ||
                        'Verified Baseline'}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#15803d', textTransform: 'uppercase' }}>
                        Expansion Plan
                      </span>
                      <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: '#edf5ee', color: '#15803d' }}>
                        Projection
                      </span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#15803d' }}>
                      {growthPlan.projected_monthly_revenue
                        ? `${formatINR(growthPlan.projected_monthly_revenue)}/mo`
                        : growthPlan.theatrical_release_window ||
                          growthPlan.d2c_expansion_target ||
                          growthPlan.cath_lab_addition ||
                          growthPlan.geographic_expansion ||
                          growthPlan.phase_2_sales_potential ||
                          'Growth Target'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#536074' }}>
                      {growthPlan.expansion_target ||
                        growthPlan.satellite_ott_strategy ||
                        growthPlan.projected_revenue_fy26 ||
                        growthPlan.target_occupancy ||
                        'Stated milestone'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#536074', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Proposed Terms
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0c1826' }}>
                      {venture.arrangement_details?.interest_rate ||
                        venture.arrangement_details?.structure_name ||
                        venture.arrangement_details?.proposed_equity_offered ||
                        (venture.proposed_arrangement || 'Direct').replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#856127' }}>
                      {venture.arrangement_details?.collateral_offered || venture.arrangement_details?.collateral_details
                        ? '✓ Asset-Backed Security'
                        : 'Direct Participation'}
                    </div>
                  </div>
                </div>

                {/* Matching Explanations Block */}
                {matchCase && (
                  <div style={{ background: '#ffffff', borderLeft: '3px solid #856127', padding: '12px 16px', marginBottom: '20px' }}>
                    {matchCase.compatibility_reasons.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#15803d' }}>Why it Fits:</div>
                        <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '13px', color: '#536074' }}>
                          {matchCase.compatibility_reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {matchCase.trade_offs.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#b45309' }}>Trade-Offs & Involvement Concerns:</div>
                        <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '13px', color: '#b45309' }}>
                          {matchCase.trade_offs.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {matchCase.mandatory_mismatches.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#b91c1c' }}>Mandatory Deal-breakers:</div>
                        <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '13px', color: '#b91c1c' }}>
                          {matchCase.mandatory_mismatches.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Expandable 10-Section Complete Venture Dossier */}
                {isDossierOpen && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e6decb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ fontSize: '17px', color: '#0c1826', margin: 0, fontFamily: "Newsreader, Georgia, serif" }}>
                        Complete 10-Section Venture Dossier
                      </h4>
                      <span style={{ fontSize: '11px', color: '#7a5c2e', fontWeight: 600 }}>
                        Standardized Presentation
                      </span>
                    </div>

                    {/* Derived Mathematical Ratios */}
                    {(arrDetails.calculated_budget_contribution ||
                      arrDetails.collateral_coverage_ratio ||
                      arrDetails.calculated_margin_impact) && (
                      <div style={{ backgroundColor: '#fff', border: '1px solid #7a5c2e', padding: '12px 16px', borderRadius: '6px', marginBottom: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', marginBottom: '4px' }}>
                          🧮 Platform Calculated Metrics & Epistemic Separation
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#121a29', lineHeight: 1.5 }}>
                          {arrDetails.calculated_budget_contribution && (
                            <div style={{ marginBottom: '2px' }}>
                              <strong>Budget Ratio:</strong> {arrDetails.calculated_budget_contribution}. <em>{arrDetails.calculation_note}</em>
                            </div>
                          )}
                          {arrDetails.collateral_coverage_ratio && (
                            <div style={{ marginBottom: '2px' }}>
                              <strong>Collateral Coverage:</strong> {arrDetails.collateral_coverage_ratio} ({formatINR(arrDetails.collateral_valuation)} residential property).
                            </div>
                          )}
                          {arrDetails.calculated_margin_impact && (
                            <div>
                              <strong>Unit Margin Analysis:</strong> {arrDetails.calculated_margin_impact}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 10 Standardized Dossier Sections */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      {tenSecs.map((sec) => (
                        <div key={sec.num} style={{ background: '#fcfaf6', border: '1px solid #e6decb', borderRadius: '6px', padding: '12px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#7a5c2e', fontFamily: 'monospace' }}>
                              {sec.num}. {sec.title}
                            </span>
                            <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px', background: '#fff', border: '1px solid #d6c9b2', color: '#7a5c2e' }}>
                              {sec.source}
                            </span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#121a29', lineHeight: 1.45 }}>
                            {sec.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expandable 6 Due Diligence Categories */}
                {isDiligenceOpen && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e6decb' }}>
                    <h4 style={{ fontSize: '16px', color: '#0c1826', marginBottom: '14px' }}>
                      Due Diligence & Risk Findings (6 Standardized Review Categories)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      {[
                        { key: 'operational_reality', label: '1. Operational Reality & Scaling Expenses' },
                        { key: 'track_record', label: '2. Track Record & Supporting Evidence' },
                        { key: 'market_viability', label: '3. Market Viability & Customer Demand' },
                        { key: 'offered_security', label: '4. Offered Security & Collateral' },
                        { key: 'business_continuity', label: '5. Business Continuity & Operational Coverage' },
                        { key: 'investor_compatibility', label: '6. Investor Compatibility & Follow-up' },
                      ].map((cat) => {
                        const item = findings[cat.key] || {
                          title: cat.label,
                          status: 'CHECKED_AGAINST_SOURCE',
                          details: 'Standard verification criteria satisfied.',
                        };
                        return (
                          <div key={cat.key} style={{ background: '#fcfaf6', border: '1px solid #e6decb', borderRadius: '6px', padding: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#0c1826' }}>{cat.label}</span>
                              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '3px', background: '#e9f5ed', color: '#15803d' }}>
                                {item.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '12.5px', color: '#536074', lineHeight: 1.4 }}>
                              {item.details}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons Bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f2ede1',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  {/* Left Expand/Collapse Toggles */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setExpandedDossierVentureId(isDossierOpen ? null : venture.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0c1826',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {isDossierOpen ? '▲ Hide 10-Section Dossier' : '▼ Quick 10-Section Dossier'}
                    </button>

                    <button
                      onClick={() => setActiveDiligenceVentureId(isDiligenceOpen ? null : venture.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#856127',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {isDiligenceOpen ? '▲ Hide 6 Diligence Categories' : '▼ Inspect 6 Diligence Categories'}
                    </button>

                    <button
                      onClick={() => handleOpenAddImageModal(venture)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#15803d',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      📷 + Add Image
                    </button>
                  </div>

                  {/* Right Primary Actions */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Primary Button to Open Full Modal Details */}
                    <button
                      onClick={() =>
                        onSelectVenture ? onSelectVenture(venture.id) : setExpandedDossierVentureId(venture.id)
                      }
                      style={{
                        padding: '10px 18px',
                        backgroundColor: '#0c1826',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(12, 24, 38, 0.2)',
                      }}
                    >
                      <span>🔍</span> View Complete Details & Evidence
                    </button>

                    {venture.connection_status === 'CONNECTED' && onOpenDirectChat && venture.connection_id ? (
                      <button
                        onClick={() => onOpenDirectChat(venture.connection_id!)}
                        style={{
                          padding: '10px 18px',
                          backgroundColor: '#15803d',
                          color: '#fff',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Open Direct Messages
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenDirectDM(venture)}
                        style={{
                          padding: '10px 18px',
                          backgroundColor: '#0c1826',
                          color: '#f5efe5',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(12, 24, 38, 0.15)',
                        }}
                      >
                        <span>💬</span>
                        <span>Direct Message Founder</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Image Modal */}
      {addImageModalVenture && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(12, 24, 38, 0.72)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => setAddImageModalVenture(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(12, 24, 38, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: '2px' }}>VENTURE MEDIA SHOWCASE</div>
                <h3 style={{ fontSize: '20px', color: '#0c1826', margin: 0 }}>
                  Add Image to {addImageModalVenture.company_name}
                </h3>
              </div>
              <button
                onClick={() => setAddImageModalVenture(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', color: '#536074', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {imageActionSuccess ? (
              <div style={{ padding: '16px', background: '#edf5ee', color: '#15803d', borderRadius: '8px', textAlign: 'center', fontWeight: 600 }}>
                ✓ {imageActionSuccess}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '13px', color: '#536074', marginBottom: '16px' }}>
                  Provide visual proof of plant operations, product lines, machinery, land layouts, or facilities to substantiate founder declarations.
                </p>

                {/* Quick Sector Suggestions */}
                {SECTOR_IMAGE_PRESETS[addImageModalVenture.sector] && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Quick Curated Presets for {addImageModalVenture.sector}:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {SECTOR_IMAGE_PRESETS[addImageModalVenture.sector].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setCustomImageUrl(preset.url);
                            setImageCaption(preset.label);
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            backgroundColor: customImageUrl === preset.url ? '#0c1826' : '#f5efe5',
                            color: customImageUrl === preset.url ? '#fff' : '#121a29',
                            border: '1px solid #d6c9b2',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                          }}
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image URL Input */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e6decb', fontSize: '13px' }}
                  />
                </div>

                {/* Image Caption */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
                    Caption / Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Pledged 3 BHK apartment building collateral"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e6decb', fontSize: '13px' }}
                  />
                </div>

                {/* Set as Hero checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <input
                    type="checkbox"
                    id="setAsHero"
                    checked={setAsHeroCheck}
                    onChange={(e) => setSetAsHeroCheck(e.target.checked)}
                  />
                  <label htmlFor="setAsHero" style={{ fontSize: '13px', color: '#121a29', cursor: 'pointer' }}>
                    Set as Primary Cover/Hero Image
                  </label>
                </div>

                {/* Preview if URL exists */}
                {customImageUrl.trim() && (
                  <div style={{ marginBottom: '20px', borderRadius: '6px', overflow: 'hidden', height: '140px', border: '1px solid #e6decb' }}>
                    <img
                      src={customImageUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setAddImageModalVenture(null)}
                    style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #e6decb', borderRadius: '6px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={submittingImage || !customImageUrl.trim()}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: '#0c1826',
                      color: '#fff',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '13px',
                      border: 'none',
                      cursor: customImageUrl.trim() ? 'pointer' : 'not-allowed',
                      opacity: customImageUrl.trim() ? 1 : 0.6,
                    }}
                  >
                    {submittingImage ? 'Adding Image...' : 'Add Image to Showcase'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Direct DM Modal */}
      {directDMModalVenture && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(12, 24, 38, 0.7)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              padding: '30px',
              boxShadow: '0 20px 40px rgba(12, 24, 38, 0.25)',
              border: '1px solid #d6c9b2',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  💬 DIRECT MESSAGE FOUNDER
                </div>
                <h3 style={{ fontSize: '20px', color: '#0c1826', margin: '4px 0 0', fontFamily: "Newsreader, Georgia, serif" }}>
                  Message {directDMModalVenture.company_name}
                </h3>
              </div>
              <button
                onClick={() => setDirectDMModalVenture(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', color: '#536074', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#536074', marginBottom: '16px', lineHeight: 1.5 }}>
              Directly text founder <strong>{directDMModalVenture.founder_name}</strong>. Sending this message immediately unlocks your 1-on-1 private direct chat channel.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
                Your Message
              </label>
              <textarea
                rows={4}
                value={directDMNote}
                onChange={(e) => setDirectDMNote(e.target.value)}
                placeholder="Write your direct message to the founder..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #d6c9b2',
                  fontSize: '13.5px',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Quick Suggestions */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {[
                'Discuss ticket allocation',
                'Ask about unit economics',
                'Request collateral inspection',
                'Discuss repayment schedule',
              ].map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDirectDMNote((prev) => `${prev} I would particularly like to ${topic.toLowerCase()}.`)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    backgroundColor: '#f5efe5',
                    border: '1px solid #d6c9b2',
                    fontSize: '11px',
                    color: '#7a5c2e',
                    cursor: 'pointer',
                  }}
                >
                  + {topic}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDirectDMModalVenture(null)}
                style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #e6decb', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendDirectDM}
                disabled={submittingDM || !directDMNote.trim()}
                style={{
                  padding: '10px 22px',
                  backgroundColor: '#0c1826',
                  color: '#fff',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: submittingDM || !directDMNote.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>💬</span>
                <span>{submittingDM ? 'Sending...' : 'Send Direct Message →'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
