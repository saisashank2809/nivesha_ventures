import React, { useState, useEffect } from 'react';
import { VentureDetail, User, Connection } from '../../shared/types';
import { Api } from '../../shared/api';
import { formatINR } from '../../shared/formatters';
import { VentureDetailModal } from '../../components/VentureDetailModal';

interface FounderDashboardProps {
  currentUser: User | null;
  onOpenBuilder: () => void;
  onOpenChat: (connectionId: string) => void;
  onOpenLogin: () => void;
  onSelectVenture?: (ventureId: string) => void;
}

interface CustomSectionItem {
  id: string;
  num: string;
  title: string;
  content: string;
  source: string;
}

export const FounderDashboard: React.FC<FounderDashboardProps> = ({
  currentUser,
  onOpenBuilder,
  onOpenChat,
  onOpenLogin,
}) => {
  const [venture, setVenture] = useState<VentureDetail | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SECTIONS' | 'PROFILE' | 'CONNECTIONS' | 'EVIDENCE'>('SECTIONS');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Edit Venture Deal Terms State
  const [companyName, setCompanyName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [businessContext, setBusinessContext] = useState('');
  const [sector, setSector] = useState('');
  const [customSector, setCustomSector] = useState('');
  const [stage, setStage] = useState('');
  const [customStage, setCustomStage] = useState('');
  const [location, setLocation] = useState('');
  const [capitalTarget, setCapitalTarget] = useState<number>(10000000);
  const [ticketMin, setTicketMin] = useState<number>(1000000);
  const [ticketMax, setTicketMax] = useState<number>(5000000);
  const [proposedArrangement, setProposedArrangement] = useState('');
  const [customArrangement, setCustomArrangement] = useState('');
  const [itemizedBudget, setItemizedBudget] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // 10 Standard Sections Edit State
  const [coreSections, setCoreSections] = useState<Record<string, string>>({
    venture_overview: '',
    current_position: '',
    opportunity: '',
    capital_requirement: '',
    use_of_capital: '',
    investment_proposal: '',
    execution_capability: '',
    risks_and_dependencies: '',
    investor_participation: '',
    evidence_and_next_steps: '',
  });

  // Custom Sections State
  const [customSections, setCustomSections] = useState<CustomSectionItem[]>([]);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  const [newSectionSource, setNewSectionSource] = useState('FOUNDER DECLARATION');

  // Evidence Checklist State
  const [evidenceItems, setEvidenceItems] = useState<Array<{ label: string; status: string; note: string }>>([]);
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [newEvidenceLabel, setNewEvidenceLabel] = useState('');
  const [newEvidenceNote, setNewEvidenceNote] = useState('');
  const [newEvidenceStatus, setNewEvidenceStatus] = useState<'VERIFIED' | 'SUPPORTED' | 'UNRESOLVED_CHECK'>('SUPPORTED');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [v, conns] = await Promise.all([
        Api.getMyVenture(),
        Api.getConnections().catch(() => []),
      ]);
      setVenture(v);
      setConnections(conns);

      if (v) {
        setCompanyName(v.company_name || '');
        setTagLine(v.tag_line || '');
        setBusinessContext(v.business_context || '');
        setSector(v.sector || 'Manufacturing / Consumer Brand');
        setStage(v.stage || 'Established & Operating Business');
        setLocation(v.location || 'India');
        setCapitalTarget(v.capital_target || 10000000);
        setTicketMin(v.ticket_min || 1000000);
        setTicketMax(v.ticket_max || 5000000);
        setProposedArrangement(v.proposed_arrangement || 'Fractional Equity Units');
        setHeroImageUrl(v.hero_image_url || '');
        setPitchDeckUrl(v.pitch_deck_url || '');
        setVideoUrl(v.video_url || '');

        const arr = (v.arrangement_details || {}) as Record<string, any>;
        setItemizedBudget(arr.itemized_budget || '');

        const story = (v.venture_story || {}) as Record<string, any>;
        setCoreSections({
          venture_overview: story.venture_overview || v.business_context || '',
          current_position: story.current_position || '',
          opportunity: story.opportunity || v.tag_line || '',
          capital_requirement: story.capital_requirement || `Total capital sought: ${formatINR(v.capital_target)}.`,
          use_of_capital: story.use_of_capital || arr.itemized_budget || '',
          investment_proposal: story.investment_proposal || `Proposed arrangement: ${v.proposed_arrangement || 'Direct facilitation'}.`,
          execution_capability: story.execution_capability || '',
          risks_and_dependencies: story.risks_and_dependencies || '',
          investor_participation: story.investor_participation || '',
          evidence_and_next_steps: story.evidence_and_next_steps || '',
        });

        // Load custom sections if any
        const loadedCustom = (story.custom_sections as CustomSectionItem[]) ||
          (arr.custom_sections as CustomSectionItem[]) || [];
        setCustomSections(loadedCustom);

        // Load evidence checklist if any
        const findings = v.due_diligence_findings || {};
        const checklist = findings.evidence_checklist as Array<{ label: string; status: string; note: string }> || [];
        setEvidenceItems(checklist);
      }
    } catch (err: any) {
      console.error('Error loading founder dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'FOUNDER') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // Handle saving general venture details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venture) return;

    try {
      setSaving(true);
      const finalSector = sector === 'OTHER' ? (customSector.trim() || 'Specialized Industry') : sector;
      const finalStage = stage === 'OTHER' ? (customStage.trim() || 'Custom Operating Stage') : stage;
      const finalArrangement = proposedArrangement === 'OTHER' ? (customArrangement.trim() || 'Custom Structure') : proposedArrangement;

      const payload: Partial<VentureDetail> = {
        company_name: companyName,
        tag_line: tagLine,
        business_context: businessContext,
        sector: finalSector,
        stage: finalStage,
        location: location,
        capital_target: capitalTarget,
        ticket_min: ticketMin,
        ticket_max: ticketMax,
        proposed_arrangement: finalArrangement,
        hero_image_url: heroImageUrl || undefined,
        pitch_deck_url: pitchDeckUrl || undefined,
        video_url: videoUrl || undefined,
        capital_structures: [finalArrangement],
        arrangement_details: {
          ...(venture.arrangement_details || {}),
          itemized_budget: itemizedBudget,
          custom_sections: customSections,
        },
      };

      const updated = await Api.updateMyVenture(venture.id, payload);
      setVenture(updated);
      showToast('Venture terms and details updated successfully!');
    } catch (err: any) {
      alert(`Failed to save changes: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle saving 10 standard sections + custom sections
  const handleSaveSections = async () => {
    if (!venture) return;

    try {
      setSaving(true);
      const updatedStory = {
        ...venture.venture_story,
        ...coreSections,
        custom_sections: customSections,
      };

      const payload: Partial<VentureDetail> = {
        venture_story: updatedStory,
        arrangement_details: {
          ...(venture.arrangement_details || {}),
          custom_sections: customSections,
        },
      };

      const updated = await Api.updateMyVenture(venture.id, payload);
      setVenture(updated);
      showToast('Dossier presentation sections saved successfully!');
    } catch (err: any) {
      alert(`Failed to save sections: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Add new custom section
  const handleAddCustomSection = () => {
    if (!newSectionTitle.trim()) {
      alert('Please enter a section title.');
      return;
    }

    const nextNum = String(11 + customSections.length).padStart(2, '0');
    const newSection: CustomSectionItem = {
      id: `custom-sec-${Date.now()}`,
      num: nextNum,
      title: newSectionTitle.trim(),
      content: newSectionContent.trim() || 'Founder notes and documentation pending review.',
      source: newSectionSource.trim() || 'FOUNDER DECLARATION',
    };

    const updated = [...customSections, newSection];
    setCustomSections(updated);
    setNewSectionTitle('');
    setNewSectionContent('');
    setShowAddSectionModal(false);
    showToast(`Added custom section "${newSection.title}". Don't forget to click "Save All Sections".`);
  };

  // Delete custom section
  const handleDeleteCustomSection = (id: string) => {
    if (confirm('Are you sure you want to delete this custom section?')) {
      const updated = customSections.filter((s) => s.id !== id);
      setCustomSections(updated);
      showToast('Custom section removed.');
    }
  };

  // Save evidence checklist
  const handleSaveEvidence = async () => {
    if (!venture) return;
    try {
      setSaving(true);
      const payload: Partial<VentureDetail> = {
        due_diligence_findings: {
          ...(venture.due_diligence_findings || {}),
          evidence_checklist: evidenceItems,
        },
        missing_information: evidenceItems.filter((e) => e.status === 'UNRESOLVED_CHECK').map((e) => e.label),
      };
      const updated = await Api.updateMyVenture(venture.id, payload);
      setVenture(updated);
      showToast('Evidence checklist saved successfully!');
    } catch (err: any) {
      alert(`Failed to save evidence: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle investor connection approval/decline
  const handleConsent = async (connectionId: string, consent: boolean) => {
    try {
      await Api.submitConsent(connectionId, consent);
      showToast(consent ? 'Connection approved! Direct chat unlocked.' : 'Connection request declined.');
      await loadData();
    } catch (err: any) {
      alert(`Consent error: ${err.message}`);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ maxWidth: '800px', margin: '80px auto', textAlign: 'center', padding: '0 20px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
        <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: '32px', color: '#121a29', marginBottom: '16px' }}>
          Founder Portal Access
        </h2>
        <p style={{ fontSize: '15px', color: '#4c5262', marginBottom: '28px' }}>
          Please sign in to access your company dashboard, update deal terms, manage your dossier sections, and view investor inquiries.
        </p>
        <button
          onClick={onOpenLogin}
          style={{
            padding: '12px 28px',
            backgroundColor: '#0c1826',
            color: '#f5efe5',
            fontWeight: 600,
            fontSize: '14.5px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Sign In as Founder
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#7a5c2e', fontSize: '15px' }}>
        Loading founder dashboard & venture dossier...
      </div>
    );
  }

  if (!venture) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', textAlign: 'center', padding: '40px 20px', backgroundColor: '#fffdf9', border: '1px solid #d6c9b2' }}>
        <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: '30px', color: '#121a29', marginBottom: '12px' }}>
          No Active Venture Profile Found
        </h2>
        <p style={{ fontSize: '14.5px', color: '#4c5262', marginBottom: '24px' }}>
          Your founder account is ready. Build your complete 10-section dossier using our guided builder.
        </p>
        <button
          onClick={onOpenBuilder}
          style={{
            padding: '12px 26px',
            backgroundColor: '#0c1826',
            color: '#f5efe5',
            fontWeight: 600,
            fontSize: '14.5px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          🚀 Launch Venture Story Builder →
        </button>
      </div>
    );
  }

  // Calculate pending vs connected investor counts
  const pendingRequests = connections.filter((c) => c.status === 'REQUESTED' && !c.founder_consent);
  const activeConnections = connections.filter((c) => c.status === 'CONNECTED');

  const standardSectionMeta = [
    { key: 'venture_overview', num: '01', title: 'Venture Overview', tag: 'FOUNDER INPUTS' },
    { key: 'current_position', num: '02', title: 'Current Position', tag: 'OPERATING RECORDS' },
    { key: 'opportunity', num: '03', title: 'Opportunity', tag: 'MARKET CONTEXT' },
    { key: 'capital_requirement', num: '04', title: 'Capital Requirement', tag: 'BUDGET SCHEDULE' },
    { key: 'use_of_capital', num: '05', title: 'Use of Capital', tag: 'DEPLOYMENT PLAN' },
    { key: 'investment_proposal', num: '06', title: 'Investment Proposal', tag: 'PROPOSED TERMS' },
    { key: 'execution_capability', num: '07', title: 'Execution Capability', tag: 'TEAM & PARTNERS' },
    { key: 'risks_and_dependencies', num: '08', title: 'Risks & Dependencies', tag: 'DISCLOSURES' },
    { key: 'investor_participation', num: '09', title: 'Investor Participation', tag: 'GOVERNANCE' },
    { key: 'evidence_and_next_steps', num: '10', title: 'Evidence & Next Steps', tag: 'REVIEW AUDIT' },
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 20px 80px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#0c1826',
            color: '#f5efe5',
            padding: '12px 20px',
            borderRadius: '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            zIndex: 1500,
            fontSize: '13.5px',
            fontWeight: 500,
            borderLeft: '4px solid #15803d',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Top Banner & Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '20px',
          backgroundColor: '#fffdf9',
          border: '1px solid #d6c9b2',
          padding: '24px 28px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Founder Enterprise Dashboard
          </div>
          <h1
            style={{
              fontFamily: "Newsreader, Georgia, serif",
              fontSize: '32px',
              color: '#121a29',
              margin: '4px 0 8px',
              fontWeight: 400,
            }}
          >
            {venture.company_name}
          </h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', fontSize: '13px', color: '#4c5262' }}>
            <span
              style={{
                backgroundColor: '#e9f5ed',
                color: '#15803d',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '3px',
                border: '1px solid #c2e5cb',
              }}
            >
              ✓ {venture.verification_status}
            </span>
            <span>•</span>
            <span style={{ fontWeight: 600, color: '#121a29' }}>{venture.sector}</span>
            <span>•</span>
            <span>{venture.stage}</span>
            <span>•</span>
            <span>{venture.location}</span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setPreviewModalOpen(true)}
            style={{
              padding: '9px 16px',
              backgroundColor: '#f5efe5',
              border: '1px solid #7a5c2e',
              color: '#7a5c2e',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>👁️</span> Live Investor Preview
          </button>

          <button
            type="button"
            onClick={onOpenBuilder}
            style={{
              padding: '9px 18px',
              backgroundColor: '#0c1826',
              color: '#f5efe5',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🚀</span> Guided Story Builder
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', color: '#7a5c2e', textTransform: 'uppercase', fontWeight: 600 }}>Target Capital</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#121a29', marginTop: '4px' }}>{formatINR(venture.capital_target)}</div>
          <div style={{ fontSize: '11.5px', color: '#4c5262', marginTop: '4px' }}>Tickets: {formatINR(venture.ticket_min || 0)} – {formatINR(venture.ticket_max || 0)}</div>
        </div>

        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', color: '#7a5c2e', textTransform: 'uppercase', fontWeight: 600 }}>Proposed Arrangement</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#121a29', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {venture.proposed_arrangement || 'Direct Facilitation'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#15803d', marginTop: '4px' }}>Active in Investor Matching</div>
        </div>

        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', color: '#7a5c2e', textTransform: 'uppercase', fontWeight: 600 }}>Dossier Content</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#121a29', marginTop: '4px' }}>
            {10 + customSections.length} Sections
          </div>
          <div style={{ fontSize: '11.5px', color: '#4c5262', marginTop: '4px' }}>10 Standard + {customSections.length} Custom Sections</div>
        </div>

        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', color: '#7a5c2e', textTransform: 'uppercase', fontWeight: 600 }}>Inbound Introductions</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: pendingRequests.length > 0 ? '#b45309' : '#121a29', marginTop: '4px' }}>
            {pendingRequests.length} Pending
          </div>
          <div style={{ fontSize: '11.5px', color: '#15803d', marginTop: '4px' }}>{activeConnections.length} Active Direct Chats</div>
        </div>
      </div>

      {/* Tab Navigation Switcher */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #d6c9b2', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('SECTIONS')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'SECTIONS' ? 700 : 500,
            color: activeTab === 'SECTIONS' ? '#0c1826' : '#4c5262',
            cursor: 'pointer',
            borderBottom: activeTab === 'SECTIONS' ? '3px solid #7a5c2e' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📋</span> Dossier & Custom Sections ({10 + customSections.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PROFILE')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'PROFILE' ? 700 : 500,
            color: activeTab === 'PROFILE' ? '#0c1826' : '#4c5262',
            cursor: 'pointer',
            borderBottom: activeTab === 'PROFILE' ? '3px solid #7a5c2e' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✏️</span> Edit Venture & Deal Terms
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CONNECTIONS')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'CONNECTIONS' ? 700 : 500,
            color: activeTab === 'CONNECTIONS' ? '#0c1826' : '#4c5262',
            cursor: 'pointer',
            borderBottom: activeTab === 'CONNECTIONS' ? '3px solid #7a5c2e' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🤝</span> Investor Introductions
          {pendingRequests.length > 0 && (
            <span style={{ backgroundColor: '#b45309', color: '#fff', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EVIDENCE')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: activeTab === 'EVIDENCE' ? 700 : 500,
            color: activeTab === 'EVIDENCE' ? '#0c1826' : '#4c5262',
            cursor: 'pointer',
            borderBottom: activeTab === 'EVIDENCE' ? '3px solid #7a5c2e' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📑</span> Evidence Checklist ({evidenceItems.length})
        </button>
      </div>

      {/* TAB 1: DOSSIER SECTIONS MANAGER (EDIT EXISTING + ADD NEW SECTIONS) */}
      {activeTab === 'SECTIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '16px 20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#121a29' }}>Manage Presentation Dossier Sections</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4c5262' }}>
                Edit any of your 10 standardized presentation sections or add new custom sections to address specific investor inquiries.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(true)}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#7a5c2e',
                  color: '#fff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>+</span> Add New Section
              </button>

              <button
                type="button"
                onClick={handleSaveSections}
                disabled={saving}
                style={{
                  padding: '9px 24px',
                  backgroundColor: '#0c1826',
                  color: '#f5efe5',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : '💾 Save All Sections'}
              </button>
            </div>
          </div>

          {/* Add Section Creator Box */}
          {showAddSectionModal && (
            <div style={{ backgroundColor: '#faf4eb', border: '2px dashed #7a5c2e', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#121a29' }}>Create a New Custom Section for Your Venture</h4>
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#4c5262' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                    Section Title <span style={{ color: '#b45309' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="e.g. Unit Economics & Margins, Intellectual Property & Patents, ESG Commitments..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                    Category / Source Tag
                  </label>
                  <input
                    type="text"
                    value={newSectionSource}
                    onChange={(e) => setNewSectionSource(e.target.value)}
                    placeholder="e.g. UNIT ECONOMICS, AUDITED REPORT, PATENT AUDIT, ESG GOVERNANCE"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                  Section Content / Narrative Details
                </label>
                <textarea
                  rows={4}
                  value={newSectionContent}
                  onChange={(e) => setNewSectionContent(e.target.value)}
                  placeholder="Provide complete details, metrics, operational records, and verification references..."
                  style={{ width: '100%', padding: '12px', border: '1px solid #8a8070', background: '#fff', fontSize: '13.5px', lineHeight: 1.55, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #8a8070', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomSection}
                  style={{ padding: '8px 20px', backgroundColor: '#15803d', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Add Section to Dossier
                </button>
              </div>
            </div>
          )}

          {/* List of 10 Standard Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Standard 10 Facilitation Sections
            </div>

            {standardSectionMeta.map((sec) => (
              <div
                key={sec.key}
                style={{
                  backgroundColor: '#fffdf9',
                  border: '1px solid #d6c9b2',
                  padding: '18px 22px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#7a5c2e', fontFamily: 'monospace' }}>{sec.num}</span>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#121a29' }}>{sec.title}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: '#faf4eb', padding: '2px 8px', border: '1px solid #d6c9b2' }}>
                    {sec.tag}
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={coreSections[sec.key] || ''}
                  onChange={(e) => setCoreSections({ ...coreSections, [sec.key]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d6c9b2',
                    backgroundColor: '#faf8f4',
                    fontSize: '13.5px',
                    lineHeight: 1.55,
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            ))}
          </div>

          {/* List of Custom Sections (If any) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Custom Sections Added by Founder ({customSections.length})
              </div>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(true)}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#fffdf9',
                  border: '1px dashed #7a5c2e',
                  color: '#7a5c2e',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Add Another Section
              </button>
            </div>

            {customSections.length === 0 ? (
              <div style={{ padding: '24px', backgroundColor: '#faf5ec', border: '1px dashed #d6c9b2', textAlign: 'center', color: '#4c5262', fontSize: '13.5px' }}>
                No custom sections added yet. Click <strong>"+ Add New Section"</strong> above to add proprietary topics like Unit Economics, IP / Patents, or Customer Case Studies.
              </div>
            ) : (
              customSections.map((cs, idx) => (
                <div
                  key={cs.id}
                  style={{
                    backgroundColor: '#fffdf9',
                    border: '1px solid #c5b59b',
                    padding: '18px 22px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#7a5c2e', fontFamily: 'monospace' }}>{cs.num}</span>
                      <input
                        type="text"
                        value={cs.title}
                        onChange={(e) => {
                          const updated = [...customSections];
                          updated[idx].title = e.target.value;
                          setCustomSections(updated);
                        }}
                        style={{ fontSize: '15px', fontWeight: 600, color: '#121a29', border: '1px solid transparent', padding: '2px 6px', background: 'transparent' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: '#faf4eb', padding: '2px 8px', border: '1px solid #d6c9b2' }}>
                        {cs.source}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomSection(cs.id)}
                        style={{ padding: '3px 8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '11px', cursor: 'pointer' }}
                        title="Delete Section"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={cs.content}
                    onChange={(e) => {
                      const updated = [...customSections];
                      updated[idx].content = e.target.value;
                      setCustomSections(updated);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d6c9b2',
                      backgroundColor: '#faf8f4',
                      fontSize: '13.5px',
                      lineHeight: 1.55,
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              ))
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleSaveSections}
              disabled={saving}
              style={{
                padding: '12px 36px',
                backgroundColor: '#0c1826',
                color: '#f5efe5',
                border: 'none',
                fontSize: '14.5px',
                fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : '💾 Save All Presentation Sections'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT VENTURE PROFILE & DEAL TERMS */}
      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveProfile} style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #d6c9b2', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#121a29' }}>Edit Venture Deal Terms & Core Profile</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4c5262' }}>
                Changes made here immediately update your venture card, matching parameters, and investor discovery profile.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '10px 24px', backgroundColor: '#0c1826', color: '#f5efe5', border: 'none', fontSize: '13.5px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Row 1: Company Name & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                  Company / Entity Name <span style={{ color: '#b45309' }}>*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                  Operating Location(s)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Row 2: Tagline */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                Elevator Tagline / Opportunity Hook
              </label>
              <input
                type="text"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Row 3: Sector & Stage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                  Sector / Industry
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="Film / Entertainment">Film / Entertainment</option>
                  <option value="Manufacturing / Consumer Brand">Manufacturing / Consumer Brand</option>
                  <option value="Manufacturing / Industrial">Manufacturing / Industrial</option>
                  <option value="Logistics / Rural Delivery">Logistics / Rural Delivery</option>
                  <option value="Healthcare / Hospital">Healthcare / Hospital</option>
                  <option value="Real Estate / Land Development">Real Estate / Land Development</option>
                  <option value="Food & Beverage / Hospitality">Food & Beverage / Hospitality</option>
                  <option value="OTHER">Other Sector (Custom)</option>
                </select>
                {sector === 'OTHER' && (
                  <input
                    type="text"
                    value={customSector}
                    onChange={(e) => setCustomSector(e.target.value)}
                    placeholder="Specify custom sector..."
                    style={{ width: '100%', marginTop: '8px', padding: '8px 10px', border: '1px solid #8a8070', background: '#faf4eb', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                  Operating Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="Project Financing / Pre-Production">Project Financing / Pre-Production</option>
                  <option value="Early Operations (< 1 Year)">Early Operations (&lt; 1 Year)</option>
                  <option value="Established & Operating Business">Established & Operating Business</option>
                  <option value="Expansion Phase (Multi-Location)">Expansion Phase (Multi-Location)</option>
                  <option value="Ownership Buyout / Shareholder Exit">Ownership Buyout / Shareholder Exit</option>
                  <option value="OTHER">Other Stage (Custom)</option>
                </select>
                {stage === 'OTHER' && (
                  <input
                    type="text"
                    value={customStage}
                    onChange={(e) => setCustomStage(e.target.value)}
                    placeholder="Specify custom stage..."
                    style={{ width: '100%', marginTop: '8px', padding: '8px 10px', border: '1px solid #8a8070', background: '#faf4eb', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            </div>

            {/* Row 4: Capital Financial Targets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                  Total Capital Sought (INR)
                </label>
                <input
                  type="number"
                  value={capitalTarget}
                  onChange={(e) => setCapitalTarget(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11.5px', color: '#7a5c2e' }}>Formatted: {formatINR(capitalTarget)}</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                  Min Investor Ticket (INR)
                </label>
                <input
                  type="number"
                  value={ticketMin}
                  onChange={(e) => setTicketMin(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11.5px', color: '#7a5c2e' }}>Formatted: {formatINR(ticketMin)}</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                  Max Investor Ticket (INR)
                </label>
                <input
                  type="number"
                  value={ticketMax}
                  onChange={(e) => setTicketMax(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11.5px', color: '#7a5c2e' }}>Formatted: {formatINR(ticketMax)}</span>
              </div>
            </div>

            {/* Row 5: Proposed Arrangement */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                Proposed Funding Structure / Consideration
              </label>
              <input
                type="text"
                value={proposedArrangement}
                onChange={(e) => setProposedArrangement(e.target.value)}
                placeholder="e.g. Fractional Equity Units (₹25L/unit) • 18% Secured Debt • Revenue Share Hybrid..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Row 6: Itemized Budget */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                Itemized Use of Capital Breakdown
              </label>
              <textarea
                rows={3}
                value={itemizedBudget}
                onChange={(e) => setItemizedBudget(e.target.value)}
                placeholder="e.g. Principal shoot (₹3.8 Cr), VFX & CGI pipeline (₹1.8 Cr), Sound design (₹40 L)..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Row 7: Media & Showcase Assets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                  Hero Image Showcase URL
                </label>
                <input
                  type="url"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                  Pitch Deck URL (DocSend / PDF)
                </label>
                <input
                  type="url"
                  value={pitchDeckUrl}
                  onChange={(e) => setPitchDeckUrl(e.target.value)}
                  placeholder="https://docsend.com/..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#121a29', marginBottom: '6px' }}>
                  Founder Video Pitch (Loom / YouTube)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://loom.com/share/..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#0c1826',
                  color: '#f5efe5',
                  border: 'none',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : '💾 Save Venture Deal Terms'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: INVESTOR CONNECTIONS & DILIGENCE CHATS */}
      {activeTab === 'CONNECTIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Pending Inbound Connection Requests */}
          <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '24px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#121a29' }}>
              Pending Inbound Introductions ({pendingRequests.length})
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#4c5262' }}>
              These accredited investors have inspected your venture dossier and requested direct communication. Granting consent immediately opens the direct chat channel.
            </p>

            {pendingRequests.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#faf5ec', border: '1px dashed #d6c9b2', color: '#4c5262', fontSize: '14px' }}>
                No pending connection requests right now. Your profile is actively featured in the investor directory.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pendingRequests.map((conn) => (
                  <div
                    key={conn.id}
                    style={{
                      padding: '18px 20px',
                      backgroundColor: '#fbf8f2',
                      border: '1px solid #d6c9b2',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#121a29' }}>
                        {conn.investor_name || 'Accredited Investor'}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#7a5c2e', marginTop: '2px' }}>
                        {conn.investor_firm ? `${conn.investor_firm} • ` : ''}Requested on {new Date(conn.created_at).toLocaleDateString()}
                      </div>
                      {conn.request_note && (
                        <div style={{ marginTop: '8px', fontSize: '13px', color: '#4c5262', backgroundColor: '#fff', padding: '8px 12px', border: '1px solid #e3d6bf' }}>
                          "{conn.request_note}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleConsent(conn.id, false)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#fffdf9',
                          border: '1px solid #8a8070',
                          color: '#4c5262',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConsent(conn.id, true)}
                        style={{
                          padding: '8px 20px',
                          backgroundColor: '#15803d',
                          color: '#fff',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Approve Introduction & Open Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Connected Direct Chats */}
          <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '24px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#121a29' }}>
              Active Investor Connections ({activeConnections.length})
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#4c5262' }}>
              These investors have been verified and approved. You have full private direct chat enabled with them.
            </p>

            {activeConnections.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#faf5ec', border: '1px dashed #d6c9b2', color: '#4c5262', fontSize: '14px' }}>
                No active connections yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeConnections.map((conn) => (
                  <div
                    key={conn.id}
                    style={{
                      padding: '16px 20px',
                      backgroundColor: '#f5efe5',
                      border: '1px solid #d6c9b2',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#121a29' }}>
                        {conn.investor_name || 'Active Investor Partner'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7a5c2e' }}>
                        {conn.investor_firm || 'Private Capital Office'} • Direct Channel Unlocked
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenChat(conn.id)}
                      style={{
                        padding: '8px 18px',
                        backgroundColor: '#0c1826',
                        color: '#f5efe5',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>💬</span> Open Chat Channel →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EVIDENCE CHECKLIST */}
      {activeTab === 'EVIDENCE' && (
        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #d6c9b2', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '19px', color: '#121a29' }}>Diligence Evidence & Verification Checklist</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4c5262' }}>
                Maintain transparency on which claims have documentary backing (contracts, MCA filings, property deeds, bank statements).
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAddEvidence(true)}
                style={{ padding: '8px 16px', backgroundColor: '#7a5c2e', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                + Add Evidence Item
              </button>
              <button
                type="button"
                onClick={handleSaveEvidence}
                disabled={saving}
                style={{ padding: '8px 24px', backgroundColor: '#0c1826', color: '#f5efe5', border: 'none', fontSize: '13px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}
              >
                {saving ? 'Saving...' : '💾 Save Evidence Checklist'}
              </button>
            </div>
          </div>

          {/* Add Evidence Creator Box */}
          {showAddEvidence && (
            <div style={{ padding: '16px', backgroundColor: '#faf4eb', border: '1px solid #d6c9b2', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13.5px', color: '#121a29' }}>Add Document or Statutory Verification Check</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#121a29', marginBottom: '4px' }}>Document / Check Title</label>
                  <input
                    type="text"
                    value={newEvidenceLabel}
                    onChange={(e) => setNewEvidenceLabel(e.target.value)}
                    placeholder="e.g. ISO 9001 Certificate, Land Title Deed, Audited Ledger..."
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #8a8070', background: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#121a29', marginBottom: '4px' }}>Verification Note / Reference</label>
                  <input
                    type="text"
                    value={newEvidenceNote}
                    onChange={(e) => setNewEvidenceNote(e.target.value)}
                    placeholder="e.g. Certified copy on file; valid through 2028"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #8a8070', background: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#4c5262' }}>Status:</span>
                  {(['VERIFIED', 'SUPPORTED', 'UNRESOLVED_CHECK'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewEvidenceStatus(st)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: newEvidenceStatus === st ? '#0c1826' : '#fff',
                        color: newEvidenceStatus === st ? '#fff' : '#4c5262',
                        border: '1px solid #8a8070',
                        cursor: 'pointer',
                      }}
                    >
                      {st === 'VERIFIED' ? 'Verified' : st === 'SUPPORTED' ? 'Supported' : 'Unresolved'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddEvidence(false)}
                    style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #8a8070', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newEvidenceLabel.trim()) return;
                      setEvidenceItems([
                        ...evidenceItems,
                        {
                          label: newEvidenceLabel.trim(),
                          status: newEvidenceStatus,
                          note: newEvidenceNote.trim() || 'Founder uploaded documentation',
                        },
                      ]);
                      setNewEvidenceLabel('');
                      setNewEvidenceNote('');
                      setShowAddEvidence(false);
                    }}
                    style={{ padding: '6px 14px', backgroundColor: '#15803d', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Add Checklist Item
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of Evidence Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {evidenceItems.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '14px 18px',
                  backgroundColor: item.status === 'VERIFIED' ? '#f0fdf4' : item.status === 'UNRESOLVED_CHECK' ? '#fffbeb' : '#fff',
                  border: '1px solid #d6c9b2',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#121a29' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#4c5262', marginTop: '2px' }}>{item.note}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...evidenceItems];
                      updated[index].status = 'VERIFIED';
                      setEvidenceItems(updated);
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: item.status === 'VERIFIED' ? '#15803d' : '#fff',
                      color: item.status === 'VERIFIED' ? '#fff' : '#4c5262',
                      border: '1px solid #8a8070',
                      cursor: 'pointer',
                    }}
                  >
                    Verified
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...evidenceItems];
                      updated[index].status = 'SUPPORTED';
                      setEvidenceItems(updated);
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: item.status === 'SUPPORTED' ? '#0c1826' : '#fff',
                      color: item.status === 'SUPPORTED' ? '#fff' : '#4c5262',
                      border: '1px solid #8a8070',
                      cursor: 'pointer',
                    }}
                  >
                    Supported
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...evidenceItems];
                      updated[index].status = 'UNRESOLVED_CHECK';
                      setEvidenceItems(updated);
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: item.status === 'UNRESOLVED_CHECK' ? '#b45309' : '#fff',
                      color: item.status === 'UNRESOLVED_CHECK' ? '#fff' : '#4c5262',
                      border: '1px solid #8a8070',
                      cursor: 'pointer',
                    }}
                  >
                    Unresolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-Screen Interactive Preview Modal */}
      {previewModalOpen && venture && (
        <VentureDetailModal
          venture={{
            ...venture,
            venture_story: {
              ...venture.venture_story,
              ...coreSections,
              custom_sections: customSections,
            },
            arrangement_details: {
              ...(venture.arrangement_details || {}),
              custom_sections: customSections,
            },
          }}
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          onRequestConnection={() => {
            alert('Preview Mode: In live discovery, investors click this to request direct appointment and diligence chat with you.');
          }}
        />
      )}
    </div>
  );
};
