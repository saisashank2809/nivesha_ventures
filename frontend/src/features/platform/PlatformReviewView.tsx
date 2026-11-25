import React, { useState, useEffect } from 'react';
import {
  MatchCase,
  AppointmentRequest,
  VentureCard,
  InvestorMandate,
  PlatformConfig,
  ReviewStage,
  AppointmentStatus,
  User,
} from '../../shared/types';
import { Api } from '../../shared/api';
import { formatINR } from '../../shared/formatters';

interface PlatformReviewViewProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onSelectVenture?: (venture: VentureCard) => void;
}

export const PlatformReviewView: React.FC<PlatformReviewViewProps> = ({
  currentUser,
  onOpenLogin,
  onSelectVenture,
}) => {
  const [activeTab, setActiveTab] = useState<'MATCH_CASES' | 'APPOINTMENTS' | 'VENTURES' | 'MANDATES' | 'ASSUMPTIONS'>('MATCH_CASES');
  const [matchCases, setMatchCases] = useState<MatchCase[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [ventures, setVentures] = useState<VentureCard[]>([]);
  const [mandates, setMandates] = useState<InvestorMandate[]>([]);
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mcList, apptList, vList, mList, cfg] = await Promise.all([
        Api.getMatchCases(),
        Api.getAppointments(),
        Api.getVentures(),
        Api.getAllMandates(),
        Api.getConfig(),
      ]);
      setMatchCases(mcList);
      setAppointments(apptList);
      setVentures(vList);
      setMandates(mList);
      setConfig(cfg);
    } catch (err) {
      console.error('Failed to load platform review data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleUpdateReviewStage = async (caseId: string, stage: ReviewStage) => {
    try {
      await Api.updateMatchReviewStage(caseId, stage);
      setActionMessage(`Review stage updated to ${stage}`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Error updating review stage: ${err.message}`);
    }
  };

  const handleUpdateAppointmentStatus = async (apptId: string, status: AppointmentStatus) => {
    try {
      await Api.updateAppointmentStatus(apptId, status);
      setActionMessage(`Appointment status updated to ${status}`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Error updating appointment: ${err.message}`);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px 20px', color: '#536074' }}>Loading platform review workspace...</div>;
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 24px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="eyebrow" style={{ marginBottom: '6px' }}>PLATFORM CORE DESK</div>
        <h1 style={{ fontSize: '34px', color: '#0f172a', marginBottom: '8px' }}>
          Platform Facilitation & Review Workspace
        </h1>
        <p style={{ fontSize: '15px', color: '#536074', maxWidth: '780px' }}>
          Inspect venture submissions, investor mandates, deterministic match outcomes, due diligence findings,
          and appointment facilitation requests across the platform.
        </p>
      </div>

      {actionMessage && (
        <div style={{ background: '#edf5ee', color: '#15803d', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #b8deb9', fontWeight: 600 }}>
          ✓ {actionMessage}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e6decb', marginBottom: '32px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'MATCH_CASES', label: `Match Cases (${matchCases.length})` },
          { id: 'APPOINTMENTS', label: `Appointments (${appointments.length})` },
          { id: 'VENTURES', label: `Ventures (${ventures.length})` },
          { id: 'MANDATES', label: `Mandates (${mandates.length})` },
          { id: 'ASSUMPTIONS', label: 'Platform Working Assumptions' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 18px',
                background: isActive ? '#fff' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #856127' : '2px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13.5px',
                color: isActive ? '#0f172a' : '#536074',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MATCH CASES */}
      {activeTab === 'MATCH_CASES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {matchCases.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #e6decb' }}>
              No match cases evaluated yet.
            </div>
          ) : (
            matchCases.map((mc) => {
              const outcomeBadge =
                mc.outcome === 'POTENTIALLY_SUITABLE'
                  ? { bg: '#edf5ee', text: '#15803d', label: 'Potentially Suitable' }
                  : mc.outcome === 'UNSUITABLE'
                  ? { bg: '#fef2f2', text: '#b91c1c', label: 'Unsuitable' }
                  : { bg: '#fdf4e7', text: '#856127', label: 'Needs Information' };

              return (
                <div
                  key={mc.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e6decb',
                    borderRadius: '10px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(12, 24, 38, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                          {mc.venture_name || 'Venture'}
                        </span>
                        <span style={{ color: '#536074' }}>&harr;</span>
                        <span style={{ fontSize: '18px', fontWeight: 600, color: '#856127' }}>
                          {mc.investor_name || 'Investor'}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: outcomeBadge.bg, color: outcomeBadge.text, fontSize: '12px', fontWeight: 600 }}>
                          {outcomeBadge.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#536074' }}>
                        Case ID: {mc.id} • Venture v{mc.venture_version} • Mandate v{mc.mandate_version}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#536074' }}>Stage:</span>
                      <select
                        value={mc.review_stage}
                        onChange={(e) => handleUpdateReviewStage(mc.id, e.target.value as ReviewStage)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e6decb', fontSize: '12.5px', background: '#fdfbf7', fontWeight: 600 }}
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="AWAITING_REVIEW">AWAITING_REVIEW</option>
                        <option value="APPROVED_FOR_FACILITATION">APPROVED_FOR_FACILITATION</option>
                        <option value="APPOINTMENT_REQUESTED">APPOINTMENT_REQUESTED</option>
                        <option value="APPOINTMENT_SCHEDULED">APPOINTMENT_SCHEDULED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                  </div>

                  {/* Findings breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '12px', background: '#fcfaf6', padding: '16px', borderRadius: '8px' }}>
                    {mc.compatibility_reasons.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#15803d', marginBottom: '4px' }}>Compatibility Reasons:</div>
                        <ul style={{ margin: '0 0 0 16px', padding: 0, fontSize: '12.5px', color: '#536074' }}>
                          {mc.compatibility_reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {mc.trade_offs.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#b45309', marginBottom: '4px' }}>Trade-Offs & Concerns:</div>
                        <ul style={{ margin: '0 0 0 16px', padding: 0, fontSize: '12.5px', color: '#b45309' }}>
                          {mc.trade_offs.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {mc.mandatory_mismatches.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#b91c1c', marginBottom: '4px' }}>Mandatory Blockers:</div>
                        <ul style={{ margin: '0 0 0 16px', padding: 0, fontSize: '12.5px', color: '#b91c1c' }}>
                          {mc.mandatory_mismatches.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {mc.missing_information.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#856127', marginBottom: '4px' }}>Missing Gaps / Dependencies:</div>
                        <ul style={{ margin: '0 0 0 16px', padding: 0, fontSize: '12.5px', color: '#536074' }}>
                          {mc.missing_information.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: APPOINTMENTS */}
      {activeTab === 'APPOINTMENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {appointments.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #e6decb' }}>
              No appointment requests recorded.
            </div>
          ) : (
            appointments.map((appt) => (
              <div
                key={appt.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6decb',
                  borderRadius: '10px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(12, 24, 38, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                      {appt.meeting_purpose}
                    </div>
                    <div style={{ fontSize: '13px', color: '#536074' }}>
                      Between: <strong>{appt.investor_name}</strong> ({appt.investor_firm || 'Investor'}) & <strong>{appt.founder_name}</strong> ({appt.venture_name})
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#536074' }}>Status:</span>
                    <select
                      value={appt.status}
                      onChange={(e) => handleUpdateAppointmentStatus(appt.id, e.target.value as AppointmentStatus)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e6decb', fontSize: '12.5px', background: '#fdfbf7', fontWeight: 600 }}
                    >
                      <option value="REQUESTED">REQUESTED</option>
                      <option value="CONFIRMED_SIMULATED">CONFIRMED (SIMULATED)</option>
                      <option value="DECLINED">DECLINED</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: '#fcfaf6', padding: '14px', borderRadius: '6px', fontSize: '13px', color: '#536074', marginBottom: '10px' }}>
                  <strong>Sharing Scope:</strong> {appt.sharing_scope}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#856127' }}>
                  <span>Preferred Slot: {appt.preferred_times.join(', ') || 'Thursday 3:00 PM IST'}</span>
                  <span>Registered: {new Date(appt.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: VENTURES */}
      {activeTab === 'VENTURES' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {ventures.map((v) => (
            <div
              key={v.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e6decb',
                borderRadius: '8px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', color: '#0f172a', margin: 0 }}>{v.company_name}</h3>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#856127', background: '#fdf4e7', padding: '2px 6px', borderRadius: '3px' }}>
                  {v.proposed_arrangement || 'LOAN'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#536074', lineHeight: 1.5, marginBottom: '14px' }}>
                {v.tag_line}
              </p>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                Target: {formatINR(v.capital_target)}
              </div>
              <div style={{ fontSize: '12px', color: '#536074', borderTop: '1px solid #f2ede1', paddingTop: '10px' }}>
                Founder: {v.founder_name} • {v.location}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: MANDATES */}
      {activeTab === 'MANDATES' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {mandates.map((m) => (
            <div
              key={m.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e6decb',
                borderRadius: '8px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', color: '#0f172a', margin: 0 }}>{m.firm_name}</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#536074', lineHeight: 1.5, marginBottom: '14px' }}>
                {m.thesis_summary || 'Targeting high-margin expansion opportunities.'}
              </p>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                Tickets: {m.ticket_min ? formatINR(m.ticket_min) : '₹5L'} – {m.ticket_max ? formatINR(m.ticket_max) : '₹20L'}
              </div>
              <div style={{ fontSize: '12px', color: '#856127' }}>
                Involvement: {m.desired_involvement} • Follow-Up: {m.willing_to_follow_up}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: PLATFORM ASSUMPTIONS */}
      {activeTab === 'ASSUMPTIONS' && config && (
        <div style={{ background: '#fff', border: '1px solid #e6decb', borderRadius: '12px', padding: '32px' }}>
          <h2 style={{ fontSize: '22px', color: '#0f172a', marginBottom: '16px' }}>
            Centralized Platform Working Assumptions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: 1.6, color: '#536074' }}>
            <div>
              <strong>Brand Name:</strong> {config.platform_name} ({config.tagline})
            </div>
            <div>
              <strong>Working Opportunity Baseline:</strong> {config.min_opportunity_display} ({formatINR(config.min_opportunity_amount)}) — Clearly documented working assumption, not forced onto individual investor contributions.
            </div>
            <div>
              <strong>Commercial Terms / Fees:</strong> {config.commercial_fee_status} — {config.commercial_fee_note}
            </div>
            <div>
              <strong>Legal Policy Status:</strong> {config.legal_status_note}
            </div>
            <div style={{ background: '#fdfbf7', padding: '16px', borderRadius: '6px', borderLeft: '4px solid #856127', marginTop: '10px' }}>
              <strong>Platform Mediation Boundary:</strong> {config.disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
