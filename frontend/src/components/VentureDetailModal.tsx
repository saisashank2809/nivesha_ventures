import React, { useState } from 'react';
import { VentureDetail } from '../shared/types';
import { formatINR } from '../shared/formatters';
import { Api } from '../shared/api';

interface VentureDetailModalProps {
  venture: VentureDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestConnection: (ventureId: string, note?: string) => void;
  onOpenChat?: (connectionId: string) => void;
}

export const VentureDetailModal: React.FC<VentureDetailModalProps> = ({
  venture,
  isOpen,
  onClose,
  onRequestConnection,
  onOpenChat,
}) => {
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'DOSSIER' | 'FINDINGS' | 'GALLERY'>('DOSSIER');
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [imageSuccessMsg, setImageSuccessMsg] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  React.useEffect(() => {
    if (venture) {
      const urls =
        venture.gallery_urls && venture.gallery_urls.length > 0
          ? venture.gallery_urls
          : venture.hero_image_url
          ? [venture.hero_image_url]
          : [];
      setGalleryUrls(urls);
      setSelectedImgIndex(0);
    }
  }, [venture]);

  if (!isOpen || !venture) return null;

  const story = (venture.venture_story || {}) as Record<string, any>;
  const arrDetails = venture.arrangement_details || {};
  const findings = venture.due_diligence_findings || {};
  const evidenceChecklist = findings.evidence_checklist as Array<{ label: string; status: string; note: string }> | undefined;

  const customSections: Array<{ num?: string; title: string; content: string; source?: string }> =
    (story.custom_sections as any[]) ||
    ((arrDetails as any)?.custom_sections as any[]) ||
    [];

  // The 10 standardized presentation sections + any custom sections added by founder
  const tenSections = [
    { num: '01', title: 'Venture Overview', content: story.venture_overview || venture.business_context, source: 'FOUNDER INPUTS' },
    { num: '02', title: 'Current Position', content: story.current_position || 'Active operating enterprise with verifiable records.', source: 'OPERATING RECORDS' },
    { num: '03', title: 'Opportunity', content: story.opportunity || venture.tag_line, source: 'MARKET CONTEXT' },
    { num: '04', title: 'Capital Requirement', content: story.capital_requirement || `Total capital sought: ${formatINR(venture.capital_target)}.`, source: 'BUDGET SCHEDULE' },
    { num: '05', title: 'Use of Capital', content: story.use_of_capital || arrDetails.itemized_budget || 'Itemized capital deployment against audited line items.', source: 'DEPLOYMENT PLAN' },
    { num: '06', title: 'Investment Proposal', content: story.investment_proposal || `Proposed arrangement: ${venture.proposed_arrangement || 'Direct facilitation'}.`, source: 'PROPOSED TERMS' },
    { num: '07', title: 'Execution Capability', content: story.execution_capability || 'Seasoned management and technical partner delivery credentials.', source: 'TEAM & PARTNERS' },
    { num: '08', title: 'Risks & Dependencies', content: story.risks_and_dependencies || 'Subject to statutory approvals, supply chain milestones, and delivery timelines.', source: 'DISCLOSURES' },
    { num: '09', title: 'Investor Participation', content: story.investor_participation || 'Audited financial reporting, priority recoupment waterfall, and governance rights.', source: 'GOVERNANCE' },
    { num: '10', title: 'Evidence & Next Steps', content: story.evidence_and_next_steps || 'Initial documentation submitted and ready for platform review clearance.', source: 'REVIEW AUDIT' },
    ...customSections.map((cs, i) => ({
      num: cs.num || String(11 + i).padStart(2, '0'),
      title: cs.title,
      content: cs.content,
      source: cs.source || 'FOUNDER CUSTOM SECTION',
    })),
  ];

  const handleSendRequest = () => {
    onRequestConnection(venture.id, note);
    setShowNoteInput(false);
    setNote('');
  };

  const handleAddImage = async () => {
    if (!venture || !customImageUrl.trim()) return;
    try {
      setIsAddingImage(true);
      const updated = await Api.addImageToVenture(
        venture.id,
        customImageUrl.trim(),
        imageCaption.trim() || undefined,
        false
      );
      const newUrls = updated.gallery_urls || [...galleryUrls, customImageUrl.trim()];
      setGalleryUrls(newUrls);
      setImageSuccessMsg('Image successfully added to gallery!');
      setCustomImageUrl('');
      setImageCaption('');
      setTimeout(() => setImageSuccessMsg(null), 2500);
    } catch (err: any) {
      alert(`Failed to add image: ${err.message}`);
    } finally {
      setIsAddingImage(false);
    }
  };

  const activeModalImage =
    galleryUrls[selectedImgIndex] ||
    venture.hero_image_url ||
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(12, 24, 38, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '92vh',
          backgroundColor: '#fffdf9',
          border: '1px solid #d6c9b2',
          boxShadow: '0 30px 60px -20px rgba(12, 24, 38, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e3d6bf',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fbf8f2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a5c2e' }}>
              Standardized 10-Section Dossier & Evidence
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                backgroundColor: venture.verification_status === 'VERIFIED' ? '#15803d' : '#0c1826',
                color: '#f5efe5',
              }}
            >
              {venture.verification_status}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#4c5262',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Visual Showcase Banner */}
          {galleryUrls.length > 0 && (
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e6decb' }}>
              <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#0c1826' }}>
                <img
                  src={activeModalImage}
                  alt={venture.company_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(12, 24, 38, 0.75) 0%, transparent 60%)',
                  }}
                />
                <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                    Photo {selectedImgIndex + 1} of {galleryUrls.length}
                  </div>
                  <button
                    onClick={() => setActiveTab('GALLERY')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#0c1826',
                      cursor: 'pointer',
                    }}
                  >
                    View All {galleryUrls.length} Images ↗
                  </button>
                </div>
              </div>

              {/* Thumbnails row */}
              {galleryUrls.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', padding: '8px 12px', backgroundColor: '#fbf8f2', overflowX: 'auto', alignItems: 'center' }}>
                  {galleryUrls.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImgIndex(idx)}
                      style={{
                        width: '54px',
                        height: '36px',
                        borderRadius: '3px',
                        padding: 0,
                        overflow: 'hidden',
                        border: selectedImgIndex === idx ? '2px solid #7a5c2e' : '1px solid #d6c9b2',
                        cursor: 'pointer',
                        opacity: selectedImgIndex === idx ? 1 : 0.65,
                        flexShrink: 0,
                      }}
                    >
                      <img src={url} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveTab('GALLERY')}
                    style={{
                      fontSize: '11px',
                      color: '#7a5c2e',
                      background: 'none',
                      border: '1px dashed #7a5c2e',
                      borderRadius: '3px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      height: '36px',
                    }}
                  >
                    + Add Image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Header Info */}
          <div>
            <h2
              style={{
                margin: '0 0 4px 0',
                fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
                fontSize: '30px',
                fontWeight: 400,
                color: '#121a29',
              }}
            >
              {venture.company_name}
            </h2>
            <div style={{ fontSize: '13.5px', color: '#7a5c2e', fontWeight: 600, marginBottom: '10px' }}>
              {venture.founder_name} {venture.founder_title ? `· ${venture.founder_title}` : ''} · {venture.location}
            </div>
            <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.6, color: '#4c5262' }}>
              {venture.tag_line}
            </p>
          </div>

          {/* Key Parameters Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              backgroundColor: '#f5efe5',
              border: '1px solid #d6c9b2',
              padding: '14px 18px',
            }}
          >
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a5c2e' }}>Sector</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#121a29', marginTop: '4px' }}>{venture.sector}</div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a5c2e' }}>Arrangement</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#121a29', marginTop: '4px' }}>
                {(venture.proposed_arrangement || 'Direct').replace(/_/g, ' ')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a5c2e' }}>Capital Target</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#121a29', marginTop: '4px' }}>{formatINR(venture.capital_target)}</div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a5c2e' }}>Ticket Range</div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#121a29', marginTop: '4px' }}>
                {formatINR(venture.ticket_min)} – {formatINR(venture.ticket_max)}
              </div>
            </div>
          </div>

          {/* Platform Derived Calculations Banner (if available) */}
          {(arrDetails.calculated_budget_contribution || arrDetails.collateral_coverage_ratio || arrDetails.calculated_margin_impact) && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #7a5c2e', padding: '14px 18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                🧮 Platform Calculated Metrics & Epistemic Separation
              </div>
              <div style={{ fontSize: '13px', color: '#121a29', lineHeight: 1.5 }}>
                {arrDetails.calculated_budget_contribution && (
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Budget Ratio:</strong> {arrDetails.calculated_budget_contribution}. <em>{arrDetails.calculation_note}</em>
                  </div>
                )}
                {arrDetails.collateral_coverage_ratio && (
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Collateral Cover:</strong> {arrDetails.collateral_coverage_ratio} ({formatINR(arrDetails.collateral_valuation)} residential property).
                  </div>
                )}
                {arrDetails.calculated_margin_impact && (
                  <div>
                    <strong>Margin Analysis:</strong> {arrDetails.calculated_margin_impact}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtabs for View: 10-Section Dossier vs Evidence Checklist vs Media */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #d6c9b2', paddingBottom: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('DOSSIER')}
              style={{
                padding: '6px 14px',
                border: 'none',
                background: activeTab === 'DOSSIER' ? '#0c1826' : 'transparent',
                color: activeTab === 'DOSSIER' ? '#fff' : '#4c5262',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              10-Section Unified Presentation
            </button>
            <button
              onClick={() => setActiveTab('FINDINGS')}
              style={{
                padding: '6px 14px',
                border: 'none',
                background: activeTab === 'FINDINGS' ? '#0c1826' : 'transparent',
                color: activeTab === 'FINDINGS' ? '#fff' : '#4c5262',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Evidence & Verification Checks
            </button>
            <button
              onClick={() => setActiveTab('GALLERY')}
              style={{
                padding: '6px 14px',
                border: 'none',
                background: activeTab === 'GALLERY' ? '#0c1826' : 'transparent',
                color: activeTab === 'GALLERY' ? '#fff' : '#4c5262',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📷</span> Media & Visual Proof ({galleryUrls.length})
            </button>
          </div>

          {/* TAB 1: 10 SECTIONS DOSSIER */}
          {activeTab === 'DOSSIER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {tenSections.map((sec) => (
                <div
                  key={sec.num}
                  style={{
                    padding: '14px 18px',
                    backgroundColor: '#fbf8f2',
                    border: '1px solid #e3d6bf',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', fontFamily: 'monospace' }}>{sec.num}</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#121a29' }}>{sec.title}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: '#fff', padding: '1px 6px', border: '1px solid #d6c9b2' }}>
                      {sec.source}
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#121a29', lineHeight: 1.55 }}>
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: EVIDENCE CHECKLIST */}
          {activeTab === 'FINDINGS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: '#4c5262', marginBottom: '4px' }}>
                Platform reviewer audit trail distinguishing submitted claims from verified proof and open questions:
              </div>

              {evidenceChecklist ? (
                evidenceChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: item.status === 'VERIFIED' ? '#f0fdf4' : item.status === 'UNRESOLVED_CHECK' ? '#fffbeb' : '#fff',
                      border: '1px solid #d6c9b2',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#121a29' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: '#4c5262', marginTop: '2px' }}>{item.note}</div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        backgroundColor: item.status === 'VERIFIED' ? '#15803d' : item.status === 'UNRESOLVED_CHECK' ? '#b45309' : '#0c1826',
                        color: '#fff',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#7a5c2e' }}>
                  Standard evidence review pending platform desk dispatch.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDIA & VISUAL PROOF */}
          {activeTab === 'GALLERY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '13.5px', color: '#4c5262' }}>
                  Audited photographic evidence of facilities, assets, and operational reality:
                </div>
                {imageSuccessMsg && (
                  <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                    ✓ {imageSuccessMsg}
                  </span>
                )}
              </div>

              {/* Photos Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {galleryUrls.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #e3d6bf',
                      backgroundColor: '#fbf8f2',
                    }}
                  >
                    <div style={{ height: '170px', overflow: 'hidden', backgroundColor: '#0c1826' }}>
                      <img
                        src={imgUrl}
                        alt={`Venture media ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                    </div>
                    <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#121a29' }}>
                        Image {idx + 1}
                      </span>
                      <a
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '11px', color: '#7a5c2e', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Open Full ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Add Image Form inside Modal */}
              <div
                style={{
                  padding: '18px 20px',
                  backgroundColor: '#f5efe5',
                  border: '1px solid #d6c9b2',
                  borderRadius: '8px',
                  marginTop: '10px',
                }}
              >
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0c1826', marginBottom: '8px' }}>
                  + Add Additional Image to Venture
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="url"
                    placeholder="Paste image URL (https://...)"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    style={{ flex: 2, minWidth: '220px', padding: '8px 12px', border: '1px solid #d6c9b2', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    placeholder="Caption (e.g. Factory floor)"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    style={{ flex: 1, minWidth: '150px', padding: '8px 12px', border: '1px solid #d6c9b2', fontSize: '13px' }}
                  />
                  <button
                    onClick={handleAddImage}
                    disabled={isAddingImage || !customImageUrl.trim()}
                    style={{
                      padding: '8px 18px',
                      backgroundColor: '#0c1826',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: customImageUrl.trim() ? 'pointer' : 'not-allowed',
                      opacity: customImageUrl.trim() ? 1 : 0.6,
                    }}
                  >
                    {isAddingImage ? 'Saving...' : 'Add Image'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e3d6bf',
            backgroundColor: '#fbf8f2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#7a5c2e' }}>
            Nivesha Ventures · Capital Facilitation Platform
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {venture.connection_status === 'CONNECTED' ? (
              <button
                onClick={() => {
                  onClose();
                  if (onOpenChat && venture.connection_id) onOpenChat(venture.connection_id);
                }}
                style={{
                  padding: '10px 20px',
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
                <span>💬</span> Open Direct Chat
              </button>
            ) : showNoteInput ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={`Write direct message to ${venture.founder_name || 'founder'}...`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #8a8070',
                    width: '320px',
                  }}
                />
                <button
                  onClick={handleSendRequest}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#0c1826',
                    color: '#f5efe5',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>💬</span>
                  <span>Send & Chat →</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNoteInput(true)}
                style={{
                  padding: '10px 22px',
                  backgroundColor: '#0c1826',
                  color: '#f5efe5',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(12, 24, 38, 0.2)',
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
};
