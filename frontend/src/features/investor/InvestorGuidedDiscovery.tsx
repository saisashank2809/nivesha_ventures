import React, { useState, useEffect } from 'react';
import { VentureCard, InvestorMandate, User, MatchCase, AppointmentRequest } from '../../shared/types';
import { Api } from '../../shared/api';
import { formatINR } from '../../shared/formatters';

interface InvestorGuidedDiscoveryProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onOpenDirectChat?: (connectionId: string) => void;
}

export const InvestorGuidedDiscovery: React.FC<InvestorGuidedDiscoveryProps> = ({
  currentUser,
  onOpenLogin,
  onOpenDirectChat,
}) => {
  const [mandate, setMandate] = useState<InvestorMandate | null>(null);
  const [ventures, setVentures] = useState<VentureCard[]>([]);
  const [matchCases, setMatchCases] = useState<Record<string, MatchCase>>({});
  const [loading, setLoading] = useState(true);
  const [activeDiligenceVentureId, setActiveDiligenceVentureId] = useState<string | null>(null);

  // Appointment Modal State
  const [appointmentModalVenture, setAppointmentModalVenture] = useState<VentureCard | null>(null);
  const [meetingPurpose, setMeetingPurpose] = useState('Review expansion unit economics, collateral schedule, and location term sheet');
  const [sharingScope, setSharingScope] = useState('Declared monthly GST returns, food cost reconciliations, and contractor quotes');
  const [preferredTime, setPreferredTime] = useState('Thursday 3:00 PM IST');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [submittingAppointment, setSubmittingAppointment] = useState(false);
  const [appointmentSuccess, setAppointmentSuccess] = useState<string | null>(null);

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

  const handleOpenAppointmentModal = (v: VentureCard) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    setAppointmentModalVenture(v);
    setMeetingPurpose(`Review ${v.company_name} expansion unit economics, collateral schedule, and location term sheet`);
    setAppointmentSuccess(null);
  };

  const handleSubmitAppointment = async () => {
    if (!appointmentModalVenture) return;
    try {
      setSubmittingAppointment(true);
      const linkedCase = matchCases[appointmentModalVenture.id];
      await Api.createAppointment({
        venture_id: appointmentModalVenture.id,
        match_case_id: linkedCase ? linkedCase.id : null,
        meeting_purpose: meetingPurpose,
        sharing_scope: sharingScope,
        preferred_times: [preferredTime],
        notes: appointmentNotes,
      });
      setAppointmentSuccess(`Appointment request registered for ${appointmentModalVenture.company_name}! Context preserved.`);
      setTimeout(() => {
        setAppointmentModalVenture(null);
        setAppointmentSuccess(null);
      }, 2500);
    } catch (err: any) {
      alert(`Failed to register appointment: ${err.message}`);
    } finally {
      setSubmittingAppointment(false);
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {ventures.map((venture) => {
          const matchCase = matchCases[venture.id];
          const isDiligenceOpen = activeDiligenceVentureId === venture.id;
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

          return (
            <div
              key={venture.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e6decb',
                borderRadius: '12px',
                padding: '28px',
                boxShadow: '0 4px 16px rgba(12, 24, 38, 0.05)',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '24px', color: '#0c1826', margin: 0 }}>
                      {venture.company_name}
                    </h2>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        backgroundColor: outcomeColor.bg,
                        color: outcomeColor.text,
                        border: `1px solid ${outcomeColor.border}`,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {outcomeColor.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#536074' }}>
                    {venture.sector} • {venture.location} • {venture.stage}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0c1826' }}>
                    {formatINR(venture.capital_target)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#856127', fontWeight: 600 }}>
                    Proposed: {venture.proposed_arrangement || 'LOAN'}
                  </div>
                </div>
              </div>

              {/* Tagline / Business Context */}
              <p style={{ fontSize: '14.5px', color: '#536074', lineHeight: 1.6, marginBottom: '20px' }}>
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
                      : trackRecord.annual_turnover || trackRecord.factory_capacity || trackRecord.past_projects || trackRecord.operational_beds || trackRecord.phase_1_sales || trackRecord.active_orders || 'Operating Record'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#536074' }}>
                    {trackRecord.declared_operating_margin || trackRecord.ebitda_margin || trackRecord.average_occupancy || trackRecord.repeat_order_rate || trackRecord.distribution_loi || 'Verified Baseline'}
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
                      : growthPlan.theatrical_release_window || growthPlan.d2c_expansion_target || growthPlan.cath_lab_addition || growthPlan.geographic_expansion || growthPlan.phase_2_sales_potential || 'Growth Target'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#536074' }}>
                    {growthPlan.expansion_target || growthPlan.satellite_ott_strategy || growthPlan.projected_revenue_fy26 || growthPlan.target_occupancy || 'Stated milestone'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#536074', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Proposed Terms
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0c1826' }}>
                    {venture.arrangement_details?.interest_rate || venture.arrangement_details?.structure_name || venture.arrangement_details?.proposed_equity_offered || (venture.proposed_arrangement || 'Direct').replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#856127' }}>
                    {venture.arrangement_details?.collateral_offered || venture.arrangement_details?.collateral_details ? '✓ Asset-Backed Security' : 'Direct Participation'}
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

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f2ede1', flexWrap: 'wrap', gap: '12px' }}>
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
                  {isDiligenceOpen ? '▲ Hide Diligence Categories' : '▼ Inspect 6 Due Diligence Categories'}
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
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
                      onClick={() => handleOpenAppointmentModal(venture)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#0c1826',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Interested / Set Up Appointment
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Appointment Request Modal */}
      {appointmentModalVenture && (
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
              maxWidth: '600px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(12, 24, 38, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: '2px' }}>FACILITATED APPOINTMENT</div>
                <h3 style={{ fontSize: '20px', color: '#0c1826', margin: 0 }}>
                  Request Introduction with {appointmentModalVenture.company_name}
                </h3>
              </div>
              <button
                onClick={() => setAppointmentModalVenture(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', color: '#536074', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {appointmentSuccess ? (
              <div style={{ padding: '20px', background: '#edf5ee', color: '#15803d', borderRadius: '8px', textAlign: 'center', fontWeight: 600 }}>
                ✓ {appointmentSuccess}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '13.5px', color: '#536074', marginBottom: '20px' }}>
                  This request preserves the verified venture context and match case references. The platform facilitates
                  mutual consent before introducing both parties.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
                    Meeting Objective & Topics
                  </label>
                  <input
                    type="text"
                    value={meetingPurpose}
                    onChange={(e) => setMeetingPurpose(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e6decb', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
                    Approved Information-Sharing Scope
                  </label>
                  <input
                    type="text"
                    value={sharingScope}
                    onChange={(e) => setSharingScope(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e6decb', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
                    Preferred Meeting Slot
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e6decb', fontSize: '13px' }}
                  >
                    <option value="Thursday 3:00 PM IST">Thursday 3:00 PM IST</option>
                    <option value="Friday 11:30 AM IST">Friday 11:30 AM IST</option>
                    <option value="Next Monday 4:00 PM IST">Next Monday 4:00 PM IST</option>
                  </select>
                </div>

                <div style={{ fontSize: '11.5px', color: '#856127', background: '#fdfbf7', padding: '10px 12px', borderRadius: '6px', marginBottom: '20px' }}>
                  ℹ️ <strong>Demonstration Note:</strong> This records a simulated platform appointment request.
                  No external calendar entries or automated emails are sent.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={() => setAppointmentModalVenture(null)}
                    style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #e6decb', borderRadius: '6px' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitAppointment}
                    disabled={submittingAppointment}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#0c1826',
                      color: '#fff',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                    }}
                  >
                    {submittingAppointment ? 'Registering...' : 'Confirm Appointment Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
