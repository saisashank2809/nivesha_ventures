import React, { useState, useEffect } from 'react';
import { VentureDetail, User } from '../../shared/types';
import { Api } from '../../shared/api';
import { formatINR } from '../../shared/formatters';

interface FounderGuidedJourneyProps {
  currentUser: User | null;
  onComplete: () => void;
  onCancel: () => void;
  onOpenLogin: () => void;
}

export const FounderGuidedJourney: React.FC<FounderGuidedJourneyProps> = ({
  currentUser,
  onComplete,
  onCancel,
  onOpenLogin,
}) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [ventureId, setVentureId] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('The Malabar Coast Kitchen');
  const [businessType, setBusinessType] = useState('Food & Beverage / Restaurant');
  const [primaryObjective, setPrimaryObjective] = useState('Opening a new location / outlet');
  const [location, setLocation] = useState('Bengaluru, Karnataka');

  // Arrangement & Terms
  const [proposedArrangement, setProposedArrangement] = useState<'LOAN' | 'REVENUE_SHARE' | 'EQUITY' | 'OTHER'>('LOAN');
  const [collateralOffered, setCollateralOffered] = useState<boolean>(true);
  const [collateralDetails, setCollateralDetails] = useState('Commercial kitchen line equipment & stainless steel infrastructure (est. ₹12L liquidation value) pledged as security.');
  const [proposedReturnRate, setProposedReturnRate] = useState('14% annual interest with quarterly amortized payouts over a 24-month horizon');
  const [equityFallback, setEquityFallback] = useState('Option to convert remaining principal into 7% equity if secondary outlet revenue exceeds ₹10L/mo for 3 consecutive quarters');
  const [repaymentSchedule, setRepaymentSchedule] = useState('1_TO_3_YEARS');

  // Track Record (Declared)
  const [declaredRevenue, setDeclaredRevenue] = useState<number>(320000);
  const [declaredMargin, setDeclaredMargin] = useState('24% EBITDA cash margin');
  const [evidenceTypes, setEvidenceTypes] = useState<string[]>([
    'GST Returns (GSTR-3B for 12 months)',
    'Razorpay POS settlement bank statements',
    'FSSAI central food license',
  ]);

  // Capital Purpose & Projections
  const [capitalTarget, setCapitalTarget] = useState<number>(2000000); // ₹20 Lakh
  const [ticketMin, setTicketMin] = useState<number>(500000); // ₹5 Lakh
  const [ticketMax, setTicketMax] = useState<number>(2000000); // ₹20 Lakh
  const [projectedRevenue, setProjectedRevenue] = useState<number>(850000);
  const [intendedUse, setIntendedUse] = useState('Koramangala 50-seat outlet: lease deposit (₹6L), kitchen fit-out & extraction (₹8L), initial inventory & working capital (₹6L).');
  const [operatingCostAssumptions, setOperatingCostAssumptions] = useState('Projected additional operating cost of ₹2.8L/mo (lease ₹1.1L, staff ₹1.2L, utilities ₹50k).');

  // Continuity & Missing Gaps
  const [continuityCoverage, setContinuityCoverage] = useState('Head Chef has 5-year tenure with equity pool participation; all recipe specifications and prep routines cataloged in operating SOP manual.');
  const [backupOperator, setBackupOperator] = useState('Suresh Babu (Co-Founder & General Manager)');
  const [unsupportedItems, setUnsupportedItems] = useState<string[]>([
    'Executed commercial lease deed for Koramangala 80-ft road location pending final funding.',
    'Independent certified valuation report for pledged kitchen equipment pending formal surveyor review.',
  ]);

  // Assembled Story
  const [storyWhatBusinessDoes, setStoryWhatBusinessDoes] = useState(
    'The Malabar Coast Kitchen serves authentic coastal South Indian cuisine with high dine-in capacity utilization and loyal repeat delivery cohorts in East Bengaluru.'
  );
  const [storyAchievements, setStoryAchievements] = useState(
    'Built a profitable flagship in Indiranagar generating a declared ₹3.2 Lakh monthly revenue with 24% operating margins.'
  );
  const [storyCapitalEnables, setStoryCapitalEnables] = useState(
    'Launch of a second 50-seat location in Koramangala, with projected monthly revenue scaling to ₹8.5 Lakh across both outlets.'
  );
  const [storyUncertainties, setStoryUncertainties] = useState(
    'Koramangala lease execution is pending; fit-out contractor estimates are not yet formally locked; requires active monthly operational follow-up.'
  );

  useEffect(() => {
    const loadCurrentVenture = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const v = await Api.getMyVenture();
        if (v) {
          setVentureId(v.id);
          setCompanyName(v.company_name || 'The Malabar Coast Kitchen');
          setCapitalTarget(v.capital_target || 2000000);
          setTicketMin(v.ticket_min || 500000);
          setTicketMax(v.ticket_max || 2000000);
          setLocation(v.location || 'Bengaluru, Karnataka');
          if (v.proposed_arrangement) {
            setProposedArrangement(v.proposed_arrangement as any);
          }
          if (v.operating_track_record?.declared_monthly_revenue) {
            setDeclaredRevenue(v.operating_track_record.declared_monthly_revenue);
          }
          if (v.growth_plan?.projected_monthly_revenue) {
            setProjectedRevenue(v.growth_plan.projected_monthly_revenue);
          }
          if (v.growth_plan?.intended_use_summary) {
            setIntendedUse(v.growth_plan.intended_use_summary);
          }
          if (v.venture_story) {
            if (v.venture_story.what_business_does) setStoryWhatBusinessDoes(v.venture_story.what_business_does);
            if (v.venture_story.what_it_has_achieved) setStoryAchievements(v.venture_story.what_it_has_achieved);
            if (v.venture_story.what_capital_enables) setStoryCapitalEnables(v.venture_story.what_capital_enables);
            if (v.venture_story.uncertainties_and_risks) setStoryUncertainties(v.venture_story.uncertainties_and_risks);
          }
        }
      } catch {
        // No current venture or first-time setup
      } finally {
        setLoading(false);
      }
    };
    loadCurrentVenture();
  }, [currentUser]);

  const handleSaveAndSubmit = async () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    try {
      setSaving(true);
      const payload: Partial<VentureDetail> = {
        company_name: companyName,
        tag_line: `${companyName} - Expanding to high-footfall location in Koramangala`,
        business_context: storyWhatBusinessDoes,
        sector: 'Food & Beverage',
        location: location,
        stage: 'Post-Revenue Expansion',
        capital_target: capitalTarget,
        ticket_min: ticketMin,
        ticket_max: ticketMax,
        currency: 'INR',
        capital_structures: [proposedArrangement],
        proposed_arrangement: proposedArrangement,
        arrangement_details: {
          arrangement_type: proposedArrangement,
          collateral_offered: collateralOffered,
          collateral_details: collateralDetails,
          proposed_return_type: proposedArrangement === 'LOAN' ? 'INTEREST' : 'EQUITY_APPRECIATION',
          proposed_rate_or_terms: proposedReturnRate,
          equity_fallback: equityFallback,
          repayment_schedule: repaymentSchedule,
        },
        operating_track_record: {
          declared_monthly_revenue: declaredRevenue,
          declared_monthly_revenue_label: 'Founder-Declared',
          declared_operating_margin: declaredMargin,
          evidence_status: 'PARTIALLY_EVIDENCED',
          evidence_types: evidenceTypes,
        },
        growth_plan: {
          projected_monthly_revenue: projectedRevenue,
          projections_label: 'Founder Projection',
          intended_use_summary: intendedUse,
          operating_cost_assumptions: operatingCostAssumptions,
          unsupported_assumptions: unsupportedItems,
        },
        continuity_plan: {
          coverage_summary: continuityCoverage,
          backup_operator_assigned: true,
          backup_operator_name: backupOperator,
        },
        missing_information: unsupportedItems,
        venture_story: {
          what_business_does: storyWhatBusinessDoes,
          what_it_has_achieved: storyAchievements,
          what_capital_is_requested: `${formatINR(capitalTarget)} growth facilitation under a ${proposedArrangement} arrangement.`,
          what_capital_enables: storyCapitalEnables,
          proposed_arrangement: `${proposedArrangement} (${proposedReturnRate})`,
          uncertainties_and_risks: storyUncertainties,
        },
        traction_metrics: [
          { label: 'Monthly Revenue', value: formatINR(declaredRevenue), period: 'Founder-Declared (GST checked)', status: 'CHECKED_AGAINST_SOURCE' },
          { label: 'Operating Margin', value: declaredMargin, period: 'Operating', status: 'CHECKED_AGAINST_SOURCE' },
          { label: 'Projected Target', value: formatINR(projectedRevenue), period: 'Founder Projection', status: 'WORKING_ASSUMPTION' },
        ],
      };

      if (ventureId) {
        await Api.updateMyVenture(ventureId, payload);
      } else {
        await Api.createVenture(payload);
      }

      onComplete();
    } catch (err: any) {
      alert(`Failed to save venture record: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ maxWidth: '640px', margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <h2 style={{ fontSize: '28px', color: '#0c1826', marginBottom: '12px' }}>Founder Sign In Required</h2>
        <p style={{ color: '#536074', marginBottom: '24px' }}>
          Please sign in as a Founder to access the guided story builder and save your venture proposal.
        </p>
        <button
          onClick={onOpenLogin}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0c1826',
            color: '#fff',
            borderRadius: '6px',
            fontWeight: 600,
          }}
        >
          Sign In as Founder
        </button>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px 20px', color: '#536074' }}>Loading guided journey...</div>;
  }

  const stepsTotal = 7;

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', padding: '40px 24px 100px' }}>
      {/* Header with Progress Bar */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#536074',
              fontSize: '13px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            &larr; Exit to Dashboard
          </button>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#856127', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Step {step} of {stepsTotal}
          </div>
        </div>

        {/* Progress track */}
        <div style={{ width: '100%', height: '4px', backgroundColor: '#e6decb', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${(step / stepsTotal) * 100}%`,
              height: '100%',
              backgroundColor: '#856127',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* STEP 1: UNDERSTAND THE REQUEST */}
      {step === 1 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>1. OBJECTIVE & BUSINESS TYPE</div>
          <h1 style={{ fontSize: '32px', color: '#0c1826', marginBottom: '12px' }}>
            What do you want to achieve with this capital?
          </h1>
          <p style={{ fontSize: '15px', color: '#536074', marginBottom: '28px' }}>
            Select the broad category and operating activity that best reflects your company.
          </p>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#0c1826', marginBottom: '8px' }}>
              Business Name / Brand
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. The Malabar Coast Kitchen"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '6px',
                border: '1px solid #e6decb',
                background: '#fff',
                fontSize: '15px',
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#0c1826', marginBottom: '12px' }}>
              What type of business do you operate?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {[
                { title: 'Food & Beverage / Restaurant', desc: 'Dining, delivery kitchen, cafe, or regional specialty food' },
                { title: 'Retail & Consumer Goods', desc: 'Physical retail store, regional apparel, or packaged products' },
                { title: 'Enterprise B2B Software', desc: 'Digital software, SaaS, or IT business services' },
                { title: 'Healthcare & Diagnostics', desc: 'Clinics, diagnostic centers, pharmacy, medical equipment' },
              ].map((opt) => {
                const isSelected = businessType === opt.title;
                return (
                  <div
                    key={opt.title}
                    onClick={() => setBusinessType(opt.title)}
                    style={{
                      border: isSelected ? '2px solid #856127' : '1px solid #e6decb',
                      backgroundColor: isSelected ? '#fbf8f2' : '#ffffff',
                      borderRadius: '8px',
                      padding: '18px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14.5px', color: '#0c1826', marginBottom: '4px' }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#536074', lineHeight: 1.4 }}>
                      {opt.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '36px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#0c1826', marginBottom: '12px' }}>
              What is your primary expansion goal?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {[
                'Opening a new location / outlet',
                'Purchasing commercial kitchen / line equipment',
                'Working capital & supply chain buffer',
                'Refinancing existing operational liabilities',
              ].map((obj) => {
                const isSelected = primaryObjective === obj;
                return (
                  <div
                    key={obj}
                    onClick={() => setPrimaryObjective(obj)}
                    style={{
                      border: isSelected ? '2px solid #856127' : '1px solid #e6decb',
                      backgroundColor: isSelected ? '#fbf8f2' : '#ffffff',
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: isSelected ? 600 : 500, fontSize: '14px', color: '#0c1826' }}>
                      {isSelected ? '✓ ' : ''}{obj}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setStep(2)}
              style={{
                padding: '12px 28px',
                backgroundColor: '#0c1826',
                color: '#fff',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Continue to Funding Arrangement &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PROPOSED FUNDING ARRANGEMENT */}
      {step === 2 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>2. PROPOSED FUNDING ARRANGEMENT</div>
          <h1 style={{ fontSize: '32px', color: '#0c1826', marginBottom: '12px' }}>
            How do you propose to structure this capital?
          </h1>
          <p style={{ fontSize: '15px', color: '#536074', marginBottom: '24px' }}>
            These are proposed commercial arrangements, not finalized legal contracts. Select what works best for your cash flow.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {[
              { id: 'LOAN', title: 'Term Loan / Debt', desc: 'Fixed interest payouts with amortized principal return' },
              { id: 'REVENUE_SHARE', title: 'Revenue Share / Royalty', desc: 'Percentage share of monthly gross turnover until return multiple cap' },
              { id: 'EQUITY', title: 'Equity Stake', desc: 'Minority company ownership with board or observer representation' },
              { id: 'OTHER', title: 'Hybrid / Need Help', desc: 'Open to structured dialogue with facilitation desk' },
            ].map((arr) => {
              const isSelected = proposedArrangement === arr.id;
              return (
                <div
                  key={arr.id}
                  onClick={() => setProposedArrangement(arr.id as any)}
                  style={{
                    border: isSelected ? '2px solid #856127' : '1px solid #e6decb',
                    backgroundColor: isSelected ? '#fbf8f2' : '#ffffff',
                    borderRadius: '8px',
                    padding: '18px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#0c1826', marginBottom: '4px' }}>
                    {arr.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#536074', lineHeight: 1.4 }}>
                    {arr.desc}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contextual Follow-ups based on Choice */}
          <div style={{ background: '#fdfbf7', border: '1px solid #e6decb', borderRadius: '10px', padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '17px', color: '#0c1826', marginBottom: '16px' }}>
              Arrangement Specifics & Security
            </h3>

            {/* Collateral Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#0c1826', marginBottom: '8px' }}>
                Is physical collateral or equipment security being offered?
              </label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCollateralOffered(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: collateralOffered ? '2px solid #856127' : '1px solid #e6decb',
                    backgroundColor: collateralOffered ? '#fff' : '#f4ede2',
                    fontWeight: collateralOffered ? 600 : 400,
                    fontSize: '13px',
                  }}
                >
                  Yes — Commercial assets / Equipment
                </button>
                <button
                  type="button"
                  onClick={() => setCollateralOffered(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: !collateralOffered ? '2px solid #856127' : '1px solid #e6decb',
                    backgroundColor: !collateralOffered ? '#fff' : '#f4ede2',
                    fontWeight: !collateralOffered ? 600 : 400,
                    fontSize: '13px',
                  }}
                >
                  No — Unsecured arrangement
                </button>
              </div>

              {collateralOffered && (
                <input
                  type="text"
                  value={collateralDetails}
                  onChange={(e) => setCollateralDetails(e.target.value)}
                  placeholder="Describe offered collateral, estimated value, and location..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e6decb',
                    fontSize: '13px',
                    background: '#fff',
                  }}
                />
              )}
            </div>

            {/* Proposed Rate or Returns */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
                Proposed Return or Payout Terms
              </label>
              <input
                type="text"
                value={proposedReturnRate}
                onChange={(e) => setProposedReturnRate(e.target.value)}
                placeholder="e.g. 14% p.a. interest amortized quarterly over 24 months"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e6decb',
                  fontSize: '13px',
                  background: '#fff',
                }}
              />
            </div>

            {/* Equity Fallback */}
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
                Contingency / Equity Fallback (Optional)
              </label>
              <input
                type="text"
                value={equityFallback}
                onChange={(e) => setEquityFallback(e.target.value)}
                placeholder="e.g. Option to convert into equity if revenue exceeds ₹10L/mo"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e6decb',
                  fontSize: '13px',
                  background: '#fff',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '1px solid #e6decb',
                borderRadius: '6px',
                color: '#0c1826',
              }}
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(3)}
              style={{
                padding: '12px 28px',
                backgroundColor: '#0c1826',
                color: '#fff',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Continue to Business Track Record &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CURRENT BUSINESS & TRACK RECORD */}
      {step === 3 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>3. CURRENT PERFORMANCE & EVIDENCE</div>
          <h1 style={{ fontSize: '32px', color: '#0c1826', marginBottom: '12px' }}>
            What is your current operating performance?
          </h1>
          <p style={{ fontSize: '15px', color: '#536074', marginBottom: '24px' }}>
            Clearly state your historical numbers. In Nivesha, participant figures are transparently labeled as
            <strong> Founder-Declared</strong> until checked against external statutory sources.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            <div style={{ background: '#fff', border: '1px solid #e6decb', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#0c1826' }}>
                  Average Monthly Revenue (INR)
                </label>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#fdf4e7', color: '#856127' }}>
                  Founder-Declared
                </span>
              </div>
              <input
                type="number"
                value={declaredRevenue}
                onChange={(e) => setDeclaredRevenue(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#0c1826',
                  border: '1px solid #e6decb',
                  borderRadius: '6px',
                }}
              />
              <div style={{ fontSize: '12px', color: '#536074', marginTop: '6px' }}>
                Formatted: {formatINR(declaredRevenue)} / month
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e6decb', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#0c1826' }}>
                  Operating Margin / Cashflow
                </label>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#fdf4e7', color: '#856127' }}>
                  Founder-Declared
                </span>
              </div>
              <input
                type="text"
                value={declaredMargin}
                onChange={(e) => setDeclaredMargin(e.target.value)}
                placeholder="e.g. 24% EBITDA cash margin"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#0c1826',
                  border: '1px solid #e6decb',
                  borderRadius: '6px',
                }}
              />
              <div style={{ fontSize: '12px', color: '#536074', marginTop: '6px' }}>
                After food/inventory cost, staff, and rent
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#0c1826', marginBottom: '12px' }}>
              What supporting records are currently available for review?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'GST Returns (GSTR-3B for 12 months)',
                'Razorpay POS settlement bank statements',
                'FSSAI central food license',
                'Audited CA Balance Sheet / P&L statement',
                'Trade vendor invoices & inventory logs',
              ].map((ev) => {
                const checked = evidenceTypes.includes(ev);
                return (
                  <div
                    key={ev}
                    onClick={() => {
                      if (checked) {
                        setEvidenceTypes(evidenceTypes.filter((x) => x !== ev));
                      } else {
                        setEvidenceTypes([...evidenceTypes, ev]);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: checked ? '1px solid #856127' : '1px solid #e6decb',
                      background: checked ? '#fcfaf5' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <input type="checkbox" checked={checked} readOnly style={{ accentColor: '#856127' }} />
                    <span style={{ fontSize: '13.5px', color: '#0c1826', fontWeight: checked ? 600 : 400 }}>
                      {ev}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(2)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '1px solid #e6decb',
                borderRadius: '6px',
              }}
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(4)}
              style={{
                padding: '12px 28px',
                backgroundColor: '#0c1826',
                color: '#fff',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Continue to Capital Purpose &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CAPITAL PURPOSE & PROJECTIONS */}
      {step === 4 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>4. CAPITAL PURPOSE & PROJECTIONS</div>
          <h1 style={{ fontSize: '32px', color: '#0c1826', marginBottom: '12px' }}>
            How much capital is needed and what does it enable?
          </h1>
          <p style={{ fontSize: '15px', color: '#536074', marginBottom: '24px' }}>
            Working baseline assumption: <strong>₹10 Lakh minimum</strong> total capital requirement. Projections are
            clearly documented as estimates rather than guaranteed outcomes.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div style={{ background: '#fff', border: '1px solid #e6decb', borderRadius: '8px', padding: '20px' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
                Total Capital Requested (INR)
              </label>
              <input
                type="number"
                value={capitalTarget}
                onChange={(e) => setCapitalTarget(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#0c1826',
                  border: '1px solid #e6decb',
                  borderRadius: '6px',
                }}
              />
              <div style={{ fontSize: '12px', color: '#856127', marginTop: '6px' }}>
                Baseline working assumption: {formatINR(capitalTarget)}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e6decb', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#0c1826' }}>
                  Projected Post-Expansion Revenue
                </label>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#edf5ee', color: '#15803d' }}>
                  Founder Projection
                </span>
              </div>
              <input
                type="number"
                value={projectedRevenue}
                onChange={(e) => setProjectedRevenue(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#0c1826',
                  border: '1px solid #e6decb',
                  borderRadius: '6px',
                }}
              />
              <div style={{ fontSize: '12px', color: '#536074', marginTop: '6px' }}>
                Projected combined: {formatINR(projectedRevenue)} / month
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#0c1826', marginBottom: '8px' }}>
              Acceptable Individual Investor Ticket Range
            </label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#536074' }}>Min Ticket (INR)</div>
                <input
                  type="number"
                  value={ticketMin}
                  onChange={(e) => setTicketMin(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e6decb' }}
                />
              </div>
              <span style={{ color: '#536074' }}>to</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#536074' }}>Max Ticket (INR)</div>
                <input
                  type="number"
                  value={ticketMax}
                  onChange={(e) => setTicketMax(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e6decb' }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#0c1826', marginBottom: '8px' }}>
              Specific Deployment Plan
            </label>
            <textarea
              rows={3}
              value={intendedUse}
              onChange={(e) => setIntendedUse(e.target.value)}
              placeholder="e.g. Koramangala lease deposit, kitchen equipment, fit-out..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #e6decb',
                fontSize: '14px',
                background: '#fff',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(3)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '1px solid #e6decb',
                borderRadius: '6px',
              }}
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(5)}
              style={{
                padding: '12px 28px',
                backgroundColor: '#0c1826',
                color: '#fff',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Continue to Continuity & Risks &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: CONTINUITY & MISSING INFORMATION */}
      {step === 5 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>5. OPERATIONAL CONTINUITY & GAPS</div>
          <h1 style={{ fontSize: '32px', color: '#0c1826', marginBottom: '12px' }}>
            Identify operational coverage and unverified assumptions
          </h1>
          <p style={{ fontSize: '15px', color: '#536074', marginBottom: '24px' }}>
            Transparent disclosure of missing evidence or execution dependencies prevents mismatched introductions and builds trust.
          </p>

          <div style={{ background: '#fff', border: '1px solid #e6decb', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
              Operational Continuity & Key-Person Backup
            </label>
            <p style={{ fontSize: '12.5px', color: '#536074', marginBottom: '12px' }}>
              Describe who manages kitchen and vendor operations if the primary founder is temporarily indisposed.
            </p>
            <textarea
              rows={3}
              value={continuityCoverage}
              onChange={(e) => setContinuityCoverage(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #e6decb',
                fontSize: '13.5px',
                marginBottom: '12px',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0c1826' }}>Second-in-Command:</span>
              <input
                type="text"
                value={backupOperator}
                onChange={(e) => setBackupOperator(e.target.value)}
                placeholder="Name and role..."
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #e6decb', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ background: '#fdfbf7', border: '1px solid #e6decb', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0c1826', marginBottom: '6px' }}>
              Unverified Assumptions & Missing Dependencies
            </label>
            <p style={{ fontSize: '12.5px', color: '#536074', marginBottom: '14px' }}>
              Select or note any critical documents or agreements not yet formally locked:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {unsupportedItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...unsupportedItems];
                      updated[idx] = e.target.value;
                      setUnsupportedItems(updated);
                    }}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #e6decb', fontSize: '13px', background: '#fff' }}
                  />
                  <button
                    type="button"
                    onClick={() => setUnsupportedItems(unsupportedItems.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: '18px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setUnsupportedItems([...unsupportedItems, ''])}
                style={{
                  alignSelf: 'flex-start',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: '1px dashed #856127',
                  background: '#fff',
                  color: '#856127',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                + Add Missing Item / Unverified Assumption
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(4)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '1px solid #e6decb',
                borderRadius: '6px',
              }}
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(6)}
              style={{
                padding: '12px 28px',
                backgroundColor: '#0c1826',
                color: '#fff',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Generate Venture Story &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: ASSEMBLE VENTURE STORY */}
      {step === 6 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>6. ASSEMBLED VENTURE STORY</div>
          <h1 style={{ fontSize: '32px', color: '#0c1826', marginBottom: '12px' }}>
            Review and refine your venture narrative
          </h1>
          <p style={{ fontSize: '15px', color: '#536074', marginBottom: '28px' }}>
            This synthesized story is presented directly to compatible investors. You can edit any section below.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: '#fff', border: '1px solid #e6decb', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#856127', textTransform: 'uppercase', marginBottom: '6px' }}>
                1. What the business does
              </div>
              <textarea
                rows={3}
                value={storyWhatBusinessDoes}
                onChange={(e) => setStoryWhatBusinessDoes(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #e6decb', fontSize: '14px' }}
              />
            </div>

            <div style={{ background: '#fff', border: '1px solid #e6decb', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#856127', textTransform: 'uppercase', marginBottom: '6px' }}>
                2. What it has achieved (Declared & Checked)
              </div>
              <textarea
                rows={2}
                value={storyAchievements}
                onChange={(e) => setStoryAchievements(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #e6decb', fontSize: '14px' }}
              />
            </div>

            <div style={{ background: '#fff', border: '1px solid #e6decb', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#856127', textTransform: 'uppercase', marginBottom: '6px' }}>
                3. What the capital enables (Projections)
              </div>
              <textarea
                rows={2}
                value={storyCapitalEnables}
                onChange={(e) => setStoryCapitalEnables(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #e6decb', fontSize: '14px' }}
              />
            </div>

            <div style={{ background: '#fff', border: '1px solid #e6decb', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#856127', textTransform: 'uppercase', marginBottom: '6px' }}>
                4. Key uncertainties & operational risks
              </div>
              <textarea
                rows={3}
                value={storyUncertainties}
                onChange={(e) => setStoryUncertainties(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #e6decb', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(5)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '1px solid #e6decb',
                borderRadius: '6px',
              }}
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(7)}
              style={{
                padding: '12px 28px',
                backgroundColor: '#0c1826',
                color: '#fff',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Proceed to Final Confirmation &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: REVIEW AND SAVE */}
      {step === 7 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>7. FINAL CONFIRMATION & PUBLICATION</div>
          <h1 style={{ fontSize: '32px', color: '#0c1826', marginBottom: '12px' }}>
            Save and register shared venture profile
          </h1>
          <p style={{ fontSize: '15px', color: '#536074', marginBottom: '28px' }}>
            Your structured submission will be saved as the official <strong>Venture</strong> record across the platform.
            Review the final summary below before saving:
          </p>

          <div
            style={{
              background: '#fff',
              border: '1px solid #e6decb',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(12, 24, 38, 0.05)',
              marginBottom: '36px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '24px', color: '#0c1826', margin: 0 }}>{companyName}</h2>
                <div style={{ fontSize: '13px', color: '#856127', marginTop: '4px' }}>
                  {businessType} • {location}
                </div>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: '4px', background: '#fdf4e7', color: '#856127', fontSize: '12px', fontWeight: 600 }}>
                {proposedArrangement}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#fdfbf7', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#536074' }}>Target Capital</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0c1826' }}>{formatINR(capitalTarget)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#536074' }}>Declared Monthly Revenue</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0c1826' }}>{formatINR(declaredRevenue)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#536074' }}>Projected Target</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#15803d' }}>{formatINR(projectedRevenue)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#536074' }}>Proposed Return</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0c1826', marginTop: '2px' }}>{proposedReturnRate}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0c1826', textTransform: 'uppercase', marginBottom: '4px' }}>
                Venture Overview
              </div>
              <p style={{ fontSize: '14px', color: '#536074', lineHeight: 1.6 }}>{storyWhatBusinessDoes}</p>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0c1826', textTransform: 'uppercase', marginBottom: '4px' }}>
                Documented Uncertainties & Risks
              </div>
              <p style={{ fontSize: '13.5px', color: '#856127', lineHeight: 1.5 }}>{storyUncertainties}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(6)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '1px solid #e6decb',
                borderRadius: '6px',
              }}
            >
              &larr; Back to Story Edit
            </button>
            <button
              onClick={handleSaveAndSubmit}
              disabled={saving}
              style={{
                padding: '14px 32px',
                backgroundColor: '#0c1826',
                color: '#fff',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '15px',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save & Publish Venture Record'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
