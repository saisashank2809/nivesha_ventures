import React, { useState, useEffect } from 'react';
import { VentureDetail, User, TenSections } from '../../shared/types';
import { Api } from '../../shared/api';
import { formatINR } from '../../shared/formatters';

interface FounderGuidedJourneyProps {
  currentUser: User | null;
  onComplete: () => void;
  onCancel: () => void;
  onOpenLogin: () => void;
}

export type SectorType =
  | 'FILM_ENTERTAINMENT'
  | 'MANUFACTURING_CONSUMER'
  | 'MANUFACTURING_DEBT'
  | 'LOGISTICS_RURAL'
  | 'HEALTHCARE_HOSPITAL'
  | 'REAL_ESTATE_LAND'
  | 'FOOD_HOSPITALITY'
  | 'OTHER';

export type StageType =
  | 'PRE_REVENUE_PROJECT'
  | 'EARLY_OPERATIONS'
  | 'ESTABLISHED_OPERATING'
  | 'EXPANSION_PHASE'
  | 'BUYOUT_ACQUISITION';

export type ArrangementType =
  | 'SECURED_COLLATERAL_DEBT'
  | 'FRACTIONAL_EQUITY_UNITS'
  | 'GROWTH_EQUITY_WITH_REV_SHARE'
  | 'PARTIAL_EQUITY_BUYOUT'
  | 'PROJECT_DEVELOPMENT_FINANCING'
  | 'LOAN'
  | 'NEED_GUIDANCE';

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

  // Step 1: Business Classification
  const [businessType, setBusinessType] = useState<SectorType>('FILM_ENTERTAINMENT');
  const [companyName, setCompanyName] = useState('Vayuputra Productions');
  const [location, setLocation] = useState('Hyderabad & Bengaluru');

  // Step 2: Operating Stage
  const [stage, setStage] = useState<StageType>('PRE_REVENUE_PROJECT');

  // Step 3: Proposed Funding Arrangement (Decoupled from Business Type!)
  const [proposedArrangement, setProposedArrangement] = useState<ArrangementType>('FRACTIONAL_EQUITY_UNITS');

  // Step 4: Contextual Branching Variables
  // Film specific
  const [filmTotalBudget, setFilmTotalBudget] = useState<number>(120000000); // ₹12 Cr
  const [filmUnitTicket, setFilmUnitTicket] = useState<number>(2500000); // ₹25 Lakh
  const [filmCrewCredentials, setFilmCrewCredentials] = useState('Cinematographer: Shivendra (Hanu-Man); Music: Sam CS (Vikram Vedha, Kaithi); VFX: Firefly Studios.');
  const [filmCreditTiers, setFilmCreditTiers] = useState('Associate Producer (₹25L), Co-Producer (₹50L), Presents (₹1 Cr), Producer (₹2 Cr).');
  const [filmComparableMultipliers, setFilmComparableMultipliers] = useState('5x to 7x box-office peer benchmarks (Historical comparisons, not return guarantees).');

  // Shoe / Consumer specific
  const [factoryCapacity, setFactoryCapacity] = useState('35,000 pairs / month automated plant');
  const [capacityUtilization, setCapacityUtilization] = useState('62% current B2B OEM utilization');
  const [celebrityRevSharePct, setCelebrityRevSharePct] = useState('7.0% royalty per sale (Zero upfront talent endorsement fee)');
  const [returnsBuffer, setReturnsBuffer] = useState('12% return and reverse logistics allowance factored into cash flow');

  // Secured Debt specific
  const [debtTenureMonths, setDebtTenureMonths] = useState<number>(18);
  const [debtInterestRate, setDebtInterestRate] = useState('18.0% annual simple interest paid monthly on principal');
  const [collateralDetails, setCollateralDetails] = useState('First charge on 1,850 sq.ft 3 BHK flat in Indiranagar, Bengaluru. Valued at ₹1.15 Cr (4.6x loan coverage).');
  const [debtEquityConversion, setDebtEquityConversion] = useState('Option to convert remaining principal into 10% equity if not repaid in 18 months.');

  // Rural Logistics specific
  const [logisticsTowns, setLogisticsTowns] = useState('Vizianagaram, Bobbili, Gajapathinagaram, Salur (Andhra Pradesh)');
  const [hubModelDetails, setHubModelDetails] = useState('300 sq.ft dark stores near town bus stations with DWACRA women self-help groups handling last-mile deliveries.');
  const [unitDeliveryMargin, setUnitDeliveryMargin] = useState('₹48 contribution margin per order (Average order value ₹340).');

  // Healthcare specific
  const [hospitalBeds, setHospitalBeds] = useState('120 operational beds across 2 campuses');
  const [hospitalOccupancy, setHospitalOccupancy] = useState('72% average annual bed occupancy');
  const [hospitalBuyoutDetails, setHospitalBuyoutDetails] = useState('₹3.5 Cr secondary partner buyout (50% stake acquisition) + ₹1.5 Cr primary Cath Lab equipment capex.');
  const [hospitalAccreditation, setHospitalAccreditation] = useState('NABH-accredited with active Clinical Establishment permits.');

  // Real Estate specific
  const [reTotalAcreage, setReTotalAcreage] = useState('18 acres plotted gated layout (142 villa plots)');
  const [reDtcpApproval, setReDtcpApproval] = useState('DTCP Final Layout Sanction LP No. 44/2024');
  const [rePlotEscrowSecurity, setRePlotEscrowSecurity] = useState('Mortgage charge on 38 unencumbered villa plots (Market value ₹9.2 Cr, 2.3x coverage).');

  // Step 5: Capital Purpose & Targets
  const [capitalTarget, setCapitalTarget] = useState<number>(60000000); // ₹6 Cr default for film
  const [ticketMin, setTicketMin] = useState<number>(2500000);
  const [ticketMax, setTicketMax] = useState<number>(20000000);
  const [itemizedBudget, setItemizedBudget] = useState(
    'Production Shoot (₹3.8 Cr), VFX & CGI pipeline (₹1.8 Cr), Sound & Post-production (₹40 Lakhs).'
  );
  const [heroImageUrl, setHeroImageUrl] = useState('');

  // Step 6: Evidence & Uncertainties Checklist
  const [evidenceItems, setEvidenceItems] = useState([
    { label: 'Script Copyright / Registered IP', status: 'VERIFIED', note: 'Registered with Screenwriters Association (SWA)' },
    { label: 'Technical Crew Agreements', status: 'VERIFIED', note: 'Signed contracts with Hanu-Man DOP & Sam CS' },
    { label: 'Lead Actor Scheduling Agreement', status: 'PARTLY_VERIFIED', note: 'MOU signed, formal agreement in legal review' },
    { label: 'Theatrical Distribution LOI', status: 'SUPPORTED', note: 'Non-binding LOI from regional distributors' },
    { label: 'Completion Bond Insurance', status: 'UNRESOLVED_CHECK', note: 'Formal insurance quotation pending review' },
  ]);

  // Derived calculations
  const calculateDerivedUnits = () => {
    if (businessType === 'FILM_ENTERTAINMENT' && filmUnitTicket > 0) {
      const units = Math.round(capitalTarget / filmUnitTicket);
      const budgetPct = filmTotalBudget > 0 ? ((capitalTarget / filmTotalBudget) * 100).toFixed(1) : '50.0';
      return {
        unitCount: units,
        budgetPct: `${budgetPct}%`,
        notice: `${budgetPct}% of total budget; this mathematical ratio does NOT automatically establish equity ownership without contractual agreement.`,
      };
    }
    return null;
  };

  // Prefill defaults when user switches business sector
  const handleSelectBusinessType = (type: SectorType) => {
    setBusinessType(type);
    if (type === 'FILM_ENTERTAINMENT') {
      setCompanyName("Vayuputra Productions - 'Garuda'");
      setCapitalTarget(60000000);
      setTicketMin(2500000);
      setTicketMax(20000000);
      setProposedArrangement('FRACTIONAL_EQUITY_UNITS');
      setItemizedBudget('Principal production shooting (₹3.8 Cr), VFX & CGI pipeline (₹1.8 Cr), Sound design (₹40 L).');
      setEvidenceItems([
        { label: 'Script Copyright / Registered IP', status: 'VERIFIED', note: 'Registered with Screenwriters Association' },
        { label: 'Technical Crew Agreements', status: 'VERIFIED', note: 'Hanu-Man DOP & Composer Sam CS signed' },
        { label: 'Lead Actor Scheduling Agreement', status: 'PARTLY_VERIFIED', note: 'MOU signed for July-October production' },
        { label: 'Historical Comparable Box-Office', status: 'BENCHMARK_ONLY', note: '5x–7x peer multipliers are historical comparisons, not guarantees' },
      ]);
    } else if (type === 'MANUFACTURING_CONSUMER') {
      setCompanyName('StrideCraft Footwear (Aethel Brand)');
      setCapitalTarget(30000000);
      setTicketMin(5000000);
      setTicketMax(30000000);
      setProposedArrangement('GROWTH_EQUITY_WITH_REV_SHARE');
      setItemizedBudget('Raw materials for 60,000 pairs (₹1.2 Cr), Celebrity launch campaign (₹1.0 Cr), Mould tooling (₹80 L).');
      setEvidenceItems([
        { label: 'Factory Machinery & Premises', status: 'VERIFIED', note: '35,000 pairs/mo automated plant inspected' },
        { label: 'Audited Financial Statements', status: 'VERIFIED', note: 'FY24 revenue of ₹9.4 Cr verified via GST' },
        { label: 'Celebrity Talent Contract', status: 'UNRESOLVED_CHECK', note: 'Agency term sheet agreed; binding signature pending' },
        { label: 'Return & Refund Margin Allowance', status: 'SUPPORTED', note: '12% reverse logistics buffer validated' },
      ]);
    } else if (type === 'MANUFACTURING_DEBT') {
      setCompanyName('Apex Precision Engineering');
      setCapitalTarget(2500000);
      setTicketMin(1000000);
      setTicketMax(2500000);
      setProposedArrangement('SECURED_COLLATERAL_DEBT');
      setItemizedBudget('Titanium alloy billets for HAL aerospace contract (₹18 L), precision cutting inserts (₹7 L).');
      setEvidenceItems([
        { label: '3 BHK Residential Flat Title Deed', status: 'VERIFIED', note: 'Nil encumbrance certificate verified for 30 years' },
        { label: 'Independent Property Valuation', status: 'VERIFIED', note: 'Government valuer report confirms ₹1.15 Cr value (4.6x cover)' },
        { label: 'Defense PSU Purchase Orders', status: 'VERIFIED', note: 'PO-HAL-2026 authenticated with defense portal' },
        { label: 'Conditional Equity Fallback Option', status: 'SUPPORTED', note: 'Board resolution pre-approving 10% equity fallback' },
      ]);
    } else if (type === 'LOGISTICS_RURAL') {
      setCompanyName('GramaBlink Hyperlocal Logistics');
      setCapitalTarget(7500000);
      setTicketMin(1500000);
      setTicketMax(7500000);
      setProposedArrangement('GROWTH_EQUITY_WITH_REV_SHARE');
      setItemizedBudget('Micro-hub inventory float (₹35 L), cold storage & racking (₹20 L), local marketing (₹10 L), working capital (₹10 L).');
      setEvidenceItems([
        { label: 'Live Order Transaction Logs', status: 'VERIFIED', note: '620 daily orders in Vizianagaram verified via UPI backend' },
        { label: 'Unit Delivery Economics', status: 'SUPPORTED', note: '₹48/order net contribution verified across 3 km density' },
        { label: 'DWACRA SHG Federation Partnership', status: 'UNRESOLVED_CHECK', note: 'MOU signed; state bank transfer link pending' },
      ]);
    } else if (type === 'HEALTHCARE_HOSPITAL') {
      setCompanyName('Varma Multispeciality Care');
      setCapitalTarget(50000000);
      setTicketMin(10000000);
      setTicketMax(50000000);
      setProposedArrangement('PARTIAL_EQUITY_BUYOUT');
      setItemizedBudget('Secondary buyout of retiring founder 50% stake (₹3.5 Cr), Digital Cath Lab acquisition (₹1.5 Cr).');
      setEvidenceItems([
        { label: 'NABH Accreditation & Licenses', status: 'VERIFIED', note: 'Valid and active through November 2027' },
        { label: 'Audited Financials (3 Years)', status: 'VERIFIED', note: 'FY24 revenue ₹14.2 Cr, EBITDA ₹2.4 Cr verified' },
        { label: 'Share Purchase Agreement (SPA) Draft', status: 'SUPPORTED', note: 'Executed draft between continuing & exiting directors' },
      ]);
    } else if (type === 'REAL_ESTATE_LAND') {
      setCompanyName('Suryam Meadows Plotted Layout');
      setCapitalTarget(40000000);
      setTicketMin(10000000);
      setTicketMax(40000000);
      setProposedArrangement('PROJECT_DEVELOPMENT_FINANCING');
      setItemizedBudget('Blacktop road asphalting (₹1.4 Cr), Underground drainage (₹1.2 Cr), Clubhouse (₹90 L), Cabling (₹50 L).');
      setEvidenceItems([
        { label: 'Land Title & Non-Agri Conversion', status: 'VERIFIED', note: '30-year clean search report on 18 freehold acres' },
        { label: 'DTCP Layout Final Sanction', status: 'VERIFIED', note: 'Sanction order LP No. 44/2024 on file' },
        { label: 'RERA Phase-2 Registration', status: 'PARTLY_VERIFIED', note: 'Application submitted; formal certificate pending' },
        { label: '38 Unencumbered Mortgage Plots', status: 'SUPPORTED', note: 'Assigned escrow plots valued at ₹9.2 Cr (2.3x cover)' },
      ]);
    }
  };

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
          setCompanyName(v.company_name);
          setCapitalTarget(v.capital_target);
          setLocation(v.location);
          if (v.ticket_min) setTicketMin(v.ticket_min);
          if (v.ticket_max) setTicketMax(v.ticket_max);
          if (v.hero_image_url) setHeroImageUrl(v.hero_image_url);
        }
      } catch {
        // First-time founder or no venture saved yet
      } finally {
        setLoading(false);
      }
    };
    loadCurrentVenture();
  }, [currentUser]);

  // Generate the unified 10 standardized presentation sections
  const assembleTenSections = (): TenSections => {
    const derived = calculateDerivedUnits();

    let overview = `${companyName} is an operating enterprise based in ${location}.`;
    let currentPos = `Currently operating in ${stage.replace(/_/g, ' ').toLowerCase()} with active business records.`;
    let opp = `Targeting significant domestic growth by meeting unmet demand in the ${businessType.replace(/_/g, ' ').toLowerCase()} sector.`;
    let capReq = `Seeking ${formatINR(capitalTarget)} in capital facilitation.`;
    let useCap = itemizedBudget;
    let invProp = `Proposed arrangement: ${proposedArrangement.replace(/_/g, ' ')}.`;
    let execCap = `Led by experienced industry promoters with verifiable sector credentials.`;
    let risks = `Subject to regulatory compliance, project delivery timeline, and market adoption velocity.`;
    let invPart = `Structured investor reporting, governance transparency, and clear exit or principal recoupment priority.`;
    let evSteps = `Initial documentary evidence submitted. Awaiting platform reviewer audit for investor introduction approval.`;

    if (businessType === 'FILM_ENTERTAINMENT') {
      overview = `${companyName} presents a pan-Indian mythological fantasy feature film budgeted at ₹12 Cr, anchored by Hanu-Man DOP Shivendra and composer Sam CS.`;
      currentPos = `Script locked and copyrighted with SWA. Lead cast dates secured for production schedule. Pre-visualization completed for 18 core action sequences.`;
      opp = `Surging domestic and international demand for regional folklore and mythological action following multi-hundred-crore box office benchmarks.`;
      capReq = `Seeking ${formatINR(capitalTarget)} via ${derived?.unitCount || 24} fractional equity units (${formatINR(filmUnitTicket)}/unit) against ₹12 Cr total production budget.`;
      invProp = `100% priority recoupment from digital OTT & satellite pre-sales prior to profit splits, accompanied by tiered screen credits: ${filmCreditTiers}. ${derived?.notice || ''}`;
      execCap = filmCrewCredentials;
      risks = `Festival release window competition, VFX schedule overruns, and box-office variance (5x–7x peer benchmarks are historical comparisons, not guarantees).`;
      invPart = `Screen credit billing, quarterly audited expense ledgers, premiere screening passes, and pro-rata net profit dividends.`;
    } else if (businessType === 'MANUFACTURING_DEBT') {
      overview = `${companyName} is an established precision CNC tooling manufacturer in Peenya, Bengaluru with a 12-year aerospace supply track record.`;
      currentPos = `Active machining center with ₹3.85 Cr annual turnover and zero NPA debt servicing history.`;
      opp = `Immediate execution of ₹68 Lakhs in confirmed aerospace/defense purchase orders for HAL and BEML.`;
      capReq = `₹25.00 Lakhs short-term working capital debt for 18-month tenure.`;
      invProp = `18.0% annual simple interest paid monthly (₹37,500/month), backed by first legal mortgage on 3 BHK flat (Valuation ₹1.15 Cr, 4.6x collateral coverage). Conversion option: 10% equity if unpaid after 18 months.`;
      execCap = `AS9100D aerospace certified unit with experienced precision toolmakers.`;
      risks = `Defense PSU payment realization cycles (cushioned by 4.6x property security).`;
      invPart = `Monthly interest remittance, registered mortgage charge, and personal guarantee of the founder.`;
    } else if (businessType === 'MANUFACTURING_CONSUMER') {
      overview = `${companyName} is an ISO-certified shoe manufacturing plant in Noida expanding from OEM contract production into high-margin D2C athletic sneakers.`;
      currentPos = `Operating plant with ${factoryCapacity} at ${capacityUtilization}. Annual turnover of ₹9.4 Cr.`;
      opp = `Tapping the rapidly growing Indian athleisure sneaker market with celebrity endorsement at zero upfront endorsement fee.`;
      capReq = `₹3.00 Crores growth capital for raw material inventory and D2C launch.`;
      invProp = `14% growth equity or 18% coupon mezzanine debt with celebrity revenue share (${celebrityRevSharePct}). Returns buffer: ${returnsBuffer}.`;
      execCap = `25 years footwear manufacturing experience supplying national brands.`;
      risks = `Formal execution of pending binding celebrity talent contract; online customer acquisition cost volatility.`;
      invPart = `Board observer seat, quarterly audited inventory reconciliations, veto rights on further equity dilution.`;
    } else if (businessType === 'LOGISTICS_RURAL') {
      overview = `${companyName} operates a 45-minute hyperlocal delivery network for Tier-3 towns (${logisticsTowns}) utilizing DWACRA women's self-help groups.`;
      currentPos = `Live in Vizianagaram with 620 daily orders, ₹63.2L monthly GMV, and positive unit economics (${unitDeliveryMargin}).`;
      opp = `Unmet instant delivery demand across 450+ small towns in South India with high smartphone adoption but no quick-commerce coverage.`;
      capReq = `₹75.00 Lakhs expansion capital for 6 new town dark stores.`;
      invProp = `15% equity at ₹5.0 Cr valuation cap with right of first refusal in Series A.`;
      execCap = `Ex-Delhivery operations leadership with strong grassroots merchant integrations.`;
      risks = `Monsoon road disruptions and formalization of state-wide DWACRA federation partnership.`;
      invPart = `Monthly digital MIS reports, dark store inventory audits, and quarterly advisory calls.`;
    } else if (businessType === 'HEALTHCARE_HOSPITAL') {
      overview = `${companyName} is an established 120-bed multi-speciality tertiary surgical center operating in Bengaluru and Mysuru with 8 years of clinical history.`;
      currentPos = `${hospitalBeds} with ${hospitalOccupancy} occupancy and ₹14.2 Cr annual revenue (₹2.4 Cr EBITDA).`;
      opp = `High demand for non-metro emergency cardiac care, addressing a 140 km regional travel void.`;
      capReq = `₹5.00 Crores (${hospitalBuyoutDetails}).`;
      invProp = `50% equity buyout of retiring co-founder plus Cath Lab equipment acquisition. 50% voting rights and 2 board seats.`;
      execCap = `Led by senior surgical director Dr. Hariprasad Varma supported by 18 full-time clinical specialists. ${hospitalAccreditation}`;
      risks = `Consultant retention and clinical negligence insurance compliance (insured under ₹10 Cr policy).`;
      invPart = `50% board representation, audit committee co-signing rights, and 50% distribution of annual dividend pool.`;
    } else if (businessType === 'REAL_ESTATE_LAND') {
      overview = `${companyName} is an 18-acre master-planned plotted community near the Hyderabad Regional Ring Road growth corridor.`;
      currentPos = `Phase 1 sold out (54 plots, ₹14.8 Cr collections). Phase 2 civil groundwork 60% complete with ${reDtcpApproval}.`;
      opp = `Capital appreciation driven by highway connectivity and plotted township demand.`;
      capReq = `₹4.00 Crores infrastructure completion finance.`;
      invProp = `22% targeted project IRR backed by registered mortgage on 38 villa plots (${rePlotEscrowSecurity}) or 30% project profit share.`;
      execCap = `Civil engineering management with 20+ years infrastructure pedigree in Telangana.`;
      risks = `Market absorption velocity and pending formal physical copy of Phase-2 RERA certificate.`;
      invPart = `Joint signing on project escrow account and monthly drone milestone reports.`;
    }

    return {
      venture_overview: overview,
      current_position: currentPos,
      opportunity: opp,
      capital_requirement: capReq,
      use_of_capital: useCap,
      investment_proposal: invProp,
      execution_capability: execCap,
      risks_and_dependencies: risks,
      investor_participation: invPart,
      evidence_and_next_steps: evSteps,
    };
  };

  const handleSaveAndSubmit = async () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    try {
      setSaving(true);
      const tenSections = assembleTenSections();
      const derived = calculateDerivedUnits();

      const payload: Partial<VentureDetail> = {
        company_name: companyName,
        tag_line: `${companyName} - ${tenSections.opportunity.slice(0, 80)}...`,
        business_context: tenSections.venture_overview,
        sector: businessType.replace(/_/g, ' '),
        location: location,
        stage: stage.replace(/_/g, ' '),
        capital_target: capitalTarget,
        ticket_min: ticketMin,
        ticket_max: ticketMax,
        currency: 'INR',
        hero_image_url: heroImageUrl || undefined,
        capital_structures: [proposedArrangement],
        proposed_arrangement: proposedArrangement,
        arrangement_details: {
          arrangement_type: proposedArrangement,
          derived_calculations: derived,
          itemized_budget: itemizedBudget,
        },
        venture_story: tenSections,
        missing_information: evidenceItems.filter((e) => e.status === 'UNRESOLVED_CHECK').map((e) => e.label),
        due_diligence_findings: {
          evidence_checklist: evidenceItems,
        },
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
      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '32px', textAlign: 'center', backgroundColor: '#fffdf9', border: '1px solid #d6c9b2' }}>
        <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: '28px', color: '#121a29' }}>
          Founder Venture Showcase & Story Builder
        </h2>
        <p style={{ color: '#4c5262', fontSize: '14.5px', margin: '12px 0 24px' }}>
          Please sign in with your founder credentials to build and present your 10-section venture dossier.
        </p>
        <button
          onClick={onOpenLogin}
          style={{ padding: '10px 24px', backgroundColor: '#0c1826', color: '#f5efe5', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          Sign In as Founder
        </button>
      </div>
    );
  }

  const derived = calculateDerivedUnits();
  const previewTenSections = assembleTenSections();

  return (
    <div style={{ maxWidth: '1080px', margin: '30px auto', padding: '0 20px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      {/* Top Wizard Steps Bar */}
      <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Nivesha Venture Builder • Step {step} of 7
            </div>
            <h2 style={{ margin: '4px 0 0', fontFamily: "Newsreader, Georgia, serif", fontSize: '24px', color: '#121a29', fontWeight: 400 }}>
              {step === 1 && '1. Choose Business Classification'}
              {step === 2 && '2. Operating Stage & Maturity'}
              {step === 3 && '3. Proposed Funding Arrangement'}
              {step === 4 && '4. Contextual Deep-Dive Questions'}
              {step === 5 && '5. Capital Target & Fund Deployment'}
              {step === 6 && '6. Evidence & Diligence Checklist'}
              {step === 7 && '7. Review Unified 10-Section Dossier'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{ padding: '8px 16px', backgroundColor: '#fffdf9', border: '1px solid #8a8070', fontSize: '13px', cursor: 'pointer' }}
              >
                Back
              </button>
            )}
            {step < 7 ? (
              <button
                onClick={() => setStep(step + 1)}
                style={{ padding: '8px 20px', backgroundColor: '#0c1826', color: '#f5efe5', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Next Step →
              </button>
            ) : (
              <button
                onClick={handleSaveAndSubmit}
                disabled={saving}
                style={{ padding: '8px 24px', backgroundColor: '#15803d', color: '#fff', border: 'none', fontSize: '13.5px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save & Enter Matching Desk'}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div
              key={s}
              onClick={() => setStep(s)}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: s <= step ? '#7a5c2e' : '#e3d6bf',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: BUSINESS CLASSIFICATION */}
      {step === 1 && (
        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '32px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#121a29' }}>What operational category best describes your venture?</h3>
          <p style={{ margin: '0 0 24px', color: '#4c5262', fontSize: '13.5px' }}>
            Note: Selecting a sector does <strong>not</strong> predetermine your funding arrangement. A film, factory, and hospital each follow separate capital structures.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {[
              { type: 'FILM_ENTERTAINMENT', title: 'Film & Creative Media', desc: 'Feature films, digital series, OTT content, production studios' },
              { type: 'MANUFACTURING_CONSUMER', title: 'Shoe & Consumer Brand', desc: 'D2C brands, footwear, apparel, celebrity co-branded lines' },
              { type: 'MANUFACTURING_DEBT', title: 'Precision / Industrial Factory', desc: 'Aerospace, defense tooling, CNC machining, OEM components' },
              { type: 'LOGISTICS_RURAL', title: 'Rural & Hyperlocal Logistics', desc: 'Tier-3 delivery networks, dark stores, SHG last-mile fleet' },
              { type: 'HEALTHCARE_HOSPITAL', title: 'Hospital & Clinical Care', desc: 'Multi-speciality hospitals, surgical clinics, diagnostic centers' },
              { type: 'REAL_ESTATE_LAND', title: 'Real Estate & Plotted Layouts', desc: 'Township developments, plotted villa communities, master layouts' },
              { type: 'FOOD_HOSPITALITY', title: 'Food, Beverage & Restaurants', desc: 'Multi-outlet casual dining, QSR expansion, cloud kitchens' },
            ].map((item) => (
              <div
                key={item.type}
                onClick={() => handleSelectBusinessType(item.type as SectorType)}
                style={{
                  padding: '16px',
                  border: businessType === item.type ? '2px solid #0c1826' : '1px solid #d6c9b2',
                  backgroundColor: businessType === item.type ? '#f5efe5' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#121a29', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: '#4c5262' }}>{item.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Venture / Entity Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Operating Location(s)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: STAGE OF BUSINESS */}
      {step === 2 && (
        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '32px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#121a29' }}>What is the current operating stage of the venture?</h3>
          <p style={{ margin: '0 0 24px', color: '#4c5262', fontSize: '13.5px' }}>
            Identifies the risk profile and verification baseline required by capital providers.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { type: 'PRE_REVENUE_PROJECT', title: 'Project Financing / Pre-Production', desc: 'Pre-production or pre-launch stage with locked assets and rights (e.g. film casting, land sanction).' },
              { type: 'EARLY_OPERATIONS', title: 'Early Operations (< 1 Year)', desc: 'Live pilot running with early verified unit economics and customer transactions.' },
              { type: 'ESTABLISHED_OPERATING', title: 'Established & Operating Business', desc: 'Multi-year track record with audited financials and stable cash flows.' },
              { type: 'EXPANSION_PHASE', title: 'Expansion Phase (Multi-Location)', desc: 'Scaling successful flagship unit to additional cities or industrial capacity.' },
              { type: 'BUYOUT_ACQUISITION', title: 'Ownership Buyout / Shareholder Exit', desc: 'Transaction involving secondary stake purchase from an existing director or partner.' },
            ].map((item) => (
              <div
                key={item.type}
                onClick={() => setStage(item.type as StageType)}
                style={{
                  padding: '18px',
                  border: stage === item.type ? '2px solid #0c1826' : '1px solid #d6c9b2',
                  backgroundColor: stage === item.type ? '#f5efe5' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14.5px', color: '#121a29', marginBottom: '6px' }}>{item.title}</div>
                <div style={{ fontSize: '12.5px', color: '#4c5262' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: PROPOSED FUNDING ARRANGEMENT */}
      {step === 3 && (
        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '32px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#121a29' }}>What funding arrangement are you proposing to investors?</h3>
          <p style={{ margin: '0 0 24px', color: '#4c5262', fontSize: '13.5px' }}>
            These are proposed structures, not finalized legal terms. You decide what consideration you offer.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {[
              {
                type: 'SECURED_COLLATERAL_DEBT',
                title: 'Secured Debt / Mortgage Loan',
                desc: 'Committed interest return secured against registered immovable property or unencumbered machinery.',
              },
              {
                type: 'FRACTIONAL_EQUITY_UNITS',
                title: 'Fractional Equity Units (With Credits)',
                desc: 'Standardized investment units (e.g. ₹25 Lakhs/unit) with priority recoupment and tiered screen credits.',
              },
              {
                type: 'GROWTH_EQUITY_WITH_REV_SHARE',
                title: 'Growth Equity + Revenue Share Hybrid',
                desc: 'Equity issuance coupled with zero-upfront royalty / revenue-share kickers on sales.',
              },
              {
                type: 'PARTIAL_EQUITY_BUYOUT',
                title: 'Partial Ownership Buyout (Secondary)',
                desc: 'Acquisition of 50% or controlling ownership from a retiring partner combined with capex infusion.',
              },
              {
                type: 'PROJECT_DEVELOPMENT_FINANCING',
                title: 'Project Development Finance (Plot Escrow)',
                desc: 'Targeted project return backed by mortgaged inventory plots placed in an escrow release account.',
              },
              {
                type: 'LOAN',
                title: 'Revenue-Linked Term Loan',
                desc: 'Periodic amortized loan repaid from operational customer revenues without equity dilution.',
              },
              {
                type: 'NEED_GUIDANCE',
                title: 'Help Me Structure My Arrangement',
                desc: 'Platform reviewer will assess cash flows and recommend an optimal structure before investor matching.',
              },
            ].map((item) => (
              <div
                key={item.type}
                onClick={() => setProposedArrangement(item.type as ArrangementType)}
                style={{
                  padding: '18px',
                  border: proposedArrangement === item.type ? '2px solid #0c1826' : '1px solid #d6c9b2',
                  backgroundColor: proposedArrangement === item.type ? '#f5efe5' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14.5px', color: '#121a29', marginBottom: '6px' }}>{item.title}</div>
                <div style={{ fontSize: '12.5px', color: '#4c5262' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: CONTEXTUAL BRANCHING QUESTIONS */}
      {step === 4 && (
        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Dynamic Branching Active
            </span>
            <h3 style={{ margin: '4px 0 0', fontSize: '19px', color: '#121a29' }}>
              Specific Details for {businessType.replace(/_/g, ' ')} & {proposedArrangement.replace(/_/g, ' ')}
            </h3>
            <p style={{ margin: '6px 0 0', color: '#4c5262', fontSize: '13.5px' }}>
              These targeted questions reflect what investors require to evaluate your specific opportunity.
            </p>
          </div>

          {/* Film Specific Branch */}
          {businessType === 'FILM_ENTERTAINMENT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Total Film Production Budget</label>
                  <input
                    type="number"
                    value={filmTotalBudget}
                    onChange={(e) => setFilmTotalBudget(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#7a5c2e' }}>Formatted: {formatINR(filmTotalBudget)}</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Per-Unit Ticket Size</label>
                  <input
                    type="number"
                    value={filmUnitTicket}
                    onChange={(e) => setFilmUnitTicket(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#7a5c2e' }}>Formatted: {formatINR(filmUnitTicket)}</span>
                </div>
              </div>

              {derived && (
                <div style={{ backgroundColor: '#f5efe5', border: '1px solid #d6c9b2', padding: '14px 18px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#7a5c2e', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Platform Calculated Ratio
                  </div>
                  <div style={{ fontSize: '14px', color: '#121a29', fontWeight: 500 }}>
                    {formatINR(capitalTarget)} requested $\div$ {formatINR(filmUnitTicket)}/unit = <strong>{derived.unitCount} Participation Units</strong>.
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#4c5262', marginTop: '4px' }}>
                    {derived.notice}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Technical Crew & Creative Attachments</label>
                <input
                  type="text"
                  value={filmCrewCredentials}
                  onChange={(e) => setFilmCrewCredentials(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Tiered Screen Credit Allocations</label>
                <input
                  type="text"
                  value={filmCreditTiers}
                  onChange={(e) => setFilmCreditTiers(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Secured Debt Branch */}
          {proposedArrangement === 'SECURED_COLLATERAL_DEBT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Loan Tenure (Months)</label>
                  <input
                    type="number"
                    value={debtTenureMonths}
                    onChange={(e) => setDebtTenureMonths(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Committed Interest Rate & Calculation</label>
                  <input
                    type="text"
                    value={debtInterestRate}
                    onChange={(e) => setDebtInterestRate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Offered Immovable / Asset Collateral</label>
                <textarea
                  rows={3}
                  value={collateralDetails}
                  onChange={(e) => setCollateralDetails(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Equity Conversion Option (if unserviced)</label>
                <input
                  type="text"
                  value={debtEquityConversion}
                  onChange={(e) => setDebtEquityConversion(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Shoe / Consumer Brand Branch */}
          {businessType === 'MANUFACTURING_CONSUMER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Factory Plant Capacity</label>
                  <input
                    type="text"
                    value={factoryCapacity}
                    onChange={(e) => setFactoryCapacity(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Current Utilization</label>
                  <input
                    type="text"
                    value={capacityUtilization}
                    onChange={(e) => setCapacityUtilization(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Celebrity Partnership Terms (Revenue Share)</label>
                <input
                  type="text"
                  value={celebrityRevSharePct}
                  onChange={(e) => setCelebrityRevSharePct(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Healthcare / Hospital Branch */}
          {businessType === 'HEALTHCARE_HOSPITAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Operational Beds</label>
                  <input
                    type="text"
                    value={hospitalBeds}
                    onChange={(e) => setHospitalBeds(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Average Annual Occupancy</label>
                  <input
                    type="text"
                    value={hospitalOccupancy}
                    onChange={(e) => setHospitalOccupancy(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Transaction Allocation (Buyout vs Primary Capex)</label>
                <input
                  type="text"
                  value={hospitalBuyoutDetails}
                  onChange={(e) => setHospitalBuyoutDetails(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Rural Logistics Branch */}
          {businessType === 'LOGISTICS_RURAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Target Tier-3 Towns</label>
                <input
                  type="text"
                  value={logisticsTowns}
                  onChange={(e) => setLogisticsTowns(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Hub & DWACRA SHG Delivery Model</label>
                <textarea
                  rows={2}
                  value={hubModelDetails}
                  onChange={(e) => setHubModelDetails(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Real Estate Branch */}
          {businessType === 'REAL_ESTATE_LAND' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Acreage & Plot Units</label>
                  <input
                    type="text"
                    value={reTotalAcreage}
                    onChange={(e) => setReTotalAcreage(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Layout Sanction</label>
                  <input
                    type="text"
                    value={reDtcpApproval}
                    onChange={(e) => setReDtcpApproval(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Escrow Mortgage Plot Security</label>
                <input
                  type="text"
                  value={rePlotEscrowSecurity}
                  onChange={(e) => setRePlotEscrowSecurity(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: CAPITAL TARGET & USE BREAKDOWN */}
      {step === 5 && (
        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '32px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#121a29' }}>Capital Requirement & Itemized Deployment</h3>
          <p style={{ margin: '0 0 24px', color: '#4c5262', fontSize: '13.5px' }}>
            Specify the exact funding amount requested and the specific project line items it will fund.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Total Capital Target</label>
              <input
                type="number"
                value={capitalTarget}
                onChange={(e) => setCapitalTarget(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '11.5px', color: '#7a5c2e' }}>Formatted: {formatINR(capitalTarget)}</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Min Investor Ticket</label>
              <input
                type="number"
                value={ticketMin}
                onChange={(e) => setTicketMin(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '11.5px', color: '#7a5c2e' }}>Formatted: {formatINR(ticketMin)}</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Max Investor Ticket</label>
              <input
                type="number"
                value={ticketMax}
                onChange={(e) => setTicketMax(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '11.5px', color: '#7a5c2e' }}>Formatted: {formatINR(ticketMax)}</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>Itemized Use of Capital Breakdown</label>
            <textarea
              rows={4}
              value={itemizedBudget}
              onChange={(e) => setItemizedBudget(e.target.value)}
              placeholder="e.g. Equipment (₹10L), Working capital (₹5L), Fit-out (₹5L)..."
              style={{ width: '100%', padding: '12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box', marginBottom: '16px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>
              Primary Venture Media / Showcase Photo URL (Optional)
            </label>
            <input
              type="url"
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... (Photo of plant, facility, asset, or prototype)"
              style={{ width: '100%', padding: '12px', border: '1px solid #8a8070', background: '#fffdf9', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}

      {/* STEP 6: EVIDENCE & UNRESOLVED CHECKLIST */}
      {step === 6 && (
        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '32px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#121a29' }}>Evidence Status & Disclosures</h3>
          <p style={{ margin: '0 0 24px', color: '#4c5262', fontSize: '13.5px' }}>
            Flag which claims have documentary backing and which remain unverified. Preserving transparency speeds up investor reviews.
          </p>

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

      {/* STEP 7: REVIEW UNIFIED 10-SECTION DOSSIER */}
      {step === 7 && (
        <div style={{ backgroundColor: '#fffdf9', border: '1px solid #d6c9b2', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #d6c9b2', paddingBottom: '16px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Unified Presentation Dossier
              </span>
              <h3 style={{ margin: '4px 0 0', fontFamily: "Newsreader, Georgia, serif", fontSize: '26px', color: '#121a29', fontWeight: 400 }}>
                {companyName}
              </h3>
              <div style={{ fontSize: '12.5px', color: '#4c5262', marginTop: '2px' }}>
                {businessType.replace(/_/g, ' ')} • {proposedArrangement.replace(/_/g, ' ')} • {location}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#121a29' }}>{formatINR(capitalTarget)}</div>
              <div style={{ fontSize: '11px', color: '#7a5c2e', textTransform: 'uppercase' }}>Target Capital</div>
            </div>
          </div>

          {/* 10 Standard Sections Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { num: '01', title: 'Venture Overview', content: previewTenSections.venture_overview, tag: 'FOUNDER INPUTS' },
              { num: '02', title: 'Current Position', content: previewTenSections.current_position, tag: 'OPERATING RECORDS' },
              { num: '03', title: 'Opportunity', content: previewTenSections.opportunity, tag: 'MARKET CONTEXT' },
              { num: '04', title: 'Capital Requirement', content: previewTenSections.capital_requirement, tag: 'BUDGET SCHEDULE' },
              { num: '05', title: 'Use of Capital', content: previewTenSections.use_of_capital, tag: 'DEPLOYMENT PLAN' },
              { num: '06', title: 'Investment Proposal', content: previewTenSections.investment_proposal, tag: 'PROPOSED TERMS' },
              { num: '07', title: 'Execution Capability', content: previewTenSections.execution_capability, tag: 'TEAM & PARTNERS' },
              { num: '08', title: 'Risks & Dependencies', content: previewTenSections.risks_and_dependencies, tag: 'DISCLOSURES' },
              { num: '09', title: 'Investor Participation', content: previewTenSections.investor_participation, tag: 'GOVERNANCE' },
              { num: '10', title: 'Evidence & Next Steps', content: previewTenSections.evidence_and_next_steps, tag: 'REVIEW AUDIT' },
            ].map((sec) => (
              <div
                key={sec.num}
                style={{
                  padding: '16px 20px',
                  backgroundColor: '#f5efe5',
                  border: '1px solid #d6c9b2',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', fontFamily: 'monospace' }}>{sec.num}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#121a29' }}>{sec.title}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: '#fff', padding: '2px 8px', border: '1px solid #d6c9b2' }}>
                    {sec.tag}
                  </span>
                </div>
                <div style={{ fontSize: '13.5px', color: '#121a29', lineHeight: 1.55 }}>
                  {sec.content}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <button
              onClick={handleSaveAndSubmit}
              disabled={saving}
              style={{
                padding: '12px 36px',
                backgroundColor: '#0c1826',
                color: '#f5efe5',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Submit to Review Desk & Enter Matching'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
