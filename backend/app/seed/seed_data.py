import bcrypt
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.models import (
    User,
    UserRole,
    Venture,
    InvestorMandate,
    Connection,
    ConnectionStatus,
    VerificationStatus,
    Message,
    OnboardingQuestion,
    MatchCase,
    MatchOutcome,
    ReviewStage,
    AppointmentRequest,
    AppointmentStatus,
)
from app.services.matching_service import evaluate_match


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


def seed_database(db: Session):
    # Clear existing tables in reverse dependency order
    db.query(AppointmentRequest).delete()
    db.query(MatchCase).delete()
    db.query(Message).delete()
    db.query(Connection).delete()
    db.query(InvestorMandate).delete()
    db.query(Venture).delete()
    db.query(OnboardingQuestion).delete()
    db.query(User).delete()
    db.commit()

    # 1. Seed Users
    reviewer = User(
        id="usr-reviewer-01",
        email="reviewer@nivesha.in",
        password_hash=hash_pw("password123"),
        full_name="Platform Review Desk",
        role=UserRole.REVIEWER,
        firm_or_company="Nivesha Ventures",
        title="Head of Due Diligence & Matching",
        bio="Independent reviewer facilitating venture evaluation, evidence audits, and introduction appointments.",
    )

    # Founder: Primary coherent restaurant demo (Malabar Coast Kitchen)
    founder_restaurant = User(
        id="usr-founder-restaurant",
        email="founder@malabarcoast.in",
        password_hash=hash_pw("password123"),
        full_name="Arvind Nair",
        role=UserRole.FOUNDER,
        firm_or_company="The Malabar Coast Kitchen",
        title="Founder & Managing Operator",
        bio="Culinary entrepreneur with 10 years experience operating high-repeat coastal Indian kitchens in Bengaluru.",
    )

    # Investor 1: Compatible Investor (F&B / Retail, accepts debt/revenue-share, willing to follow up)
    investor_compatible = User(
        id="usr-investor-01",
        email="investor@peakindia.vc",
        password_hash=hash_pw("password123"),
        full_name="Rohan Varma",
        role=UserRole.INVESTOR,
        firm_or_company="Peak India Growth Syndicate",
        title="Managing Partner",
        bio="Syndicate lead backing high-operating-margin consumer and food expansion opportunities in South India.",
    )

    # Investor 2: Incompatible Investor (Pure Tech / B2B SaaS, equity-only, ₹50L+ checks)
    investor_incompatible = User(
        id="usr-investor-incompatible",
        email="siddharth@cloudscale.vc",
        password_hash=hash_pw("password123"),
        full_name="Siddharth Rao",
        role=UserRole.INVESTOR,
        firm_or_company="CloudScale Enterprise Capital",
        title="Partner - B2B Tech",
        bio="Exclusively investing in B2B enterprise software, developer tools, and cloud infrastructure.",
    )

    # Investor 3: Preference-Conflict Investor (F&B ticket matches, but wants zero hands-on involvement or follow-up)
    investor_conflict = User(
        id="usr-investor-low-involvement",
        email="meera@passiveyield.in",
        password_hash=hash_pw("password123"),
        full_name="Meera Nair",
        role=UserRole.INVESTOR,
        firm_or_company="High-Yield Passive Syndicate",
        title="Principal Investor",
        bio="Seeking fixed return and asset-backed allocations with completely hands-off, passive operational involvement.",
    )

    # Supporting tech founder for variety
    founder_tech = User(
        id="usr-founder-tech",
        email="founder@bharatpay.in",
        password_hash=hash_pw("password123"),
        full_name="Kabir Mehta",
        role=UserRole.FOUNDER,
        firm_or_company="BharatPay FinTech Solutions",
        title="Founder & CEO",
        bio="FinTech infrastructure builder modernizing MSME trade credit reconciliation in Bharat.",
    )

    db.add_all([
        reviewer,
        founder_restaurant,
        investor_compatible,
        investor_incompatible,
        investor_conflict,
        founder_tech,
    ])
    db.commit()

    # 2. Seed Investor Mandates
    # Mandate 1: Compatible with Restaurant
    mandate_compatible = InvestorMandate(
        id="man-compatible-01",
        investor_id=investor_compatible.id,
        firm_name="Peak India Growth Syndicate",
        target_sectors=["Food & Beverage", "Retail & Hospitality", "Consumer Brands"],
        target_stages=["Post-Revenue Expansion", "Cashflow Positive", "Seed"],
        locations=["Bengaluru", "Karnataka", "South India"],
        ticket_min=500000.0,    # ₹5 Lakh
        ticket_max=2000000.0,   # ₹20 Lakh
        currency="INR",
        acceptable_structures=["LOAN", "REVENUE_SHARE", "EQUITY"],
        thesis_summary="Backing local consumer & food brands expanding into proven high-density commercial catchment areas.",
        accepted_arrangements=["LOAN", "REVENUE_SHARE", "EQUITY"],
        time_horizon="1_TO_3_YEARS",
        desired_involvement="MONTHLY_ADVISORY",
        willing_to_follow_up="MONTHLY_OPERATIONAL_REVIEWS",
        mandatory_sectors=["Food & Beverage", "Retail & Hospitality"],
        mandatory_arrangements=["LOAN", "REVENUE_SHARE"],
        flexible_preferences={"quarterly_interest_preferred": True, "equipment_security_preferred": True},
        version=1,
    )

    # Mandate 2: Incompatible with Restaurant (Pure Tech Equity)
    mandate_incompatible = InvestorMandate(
        id="man-incompatible-02",
        investor_id=investor_incompatible.id,
        firm_name="CloudScale Enterprise Capital",
        target_sectors=["Enterprise SaaS", "B2B Software", "FinTech"],
        target_stages=["Series A", "Pre-Series A"],
        locations=["Bengaluru", "Delhi NCR", "Global"],
        ticket_min=5000000.0,   # ₹50 Lakh
        ticket_max=20000000.0,  # ₹2 Crore
        currency="INR",
        acceptable_structures=["EQUITY", "SAFE"],
        thesis_summary="Strict focus on venture-scale software with 80%+ gross margins and global customer cohorts.",
        accepted_arrangements=["EQUITY"],
        time_horizon="5_PLUS_YEARS",
        desired_involvement="ACTIVE_HANDS_ON",
        willing_to_follow_up="MONTHLY_OPERATIONAL_REVIEWS",
        mandatory_sectors=["Enterprise SaaS", "B2B Software"],
        mandatory_arrangements=["EQUITY"],
        flexible_preferences={"board_seat_required": True},
        version=1,
    )

    # Mandate 3: Preference Conflict (Ticket & Sector match, but wants ZERO involvement/follow-up)
    mandate_conflict = InvestorMandate(
        id="man-conflict-03",
        investor_id=investor_conflict.id,
        firm_name="High-Yield Passive Syndicate",
        target_sectors=["Food & Beverage", "Retail & Hospitality", "Consumer Services"],
        target_stages=["Post-Revenue Expansion"],
        locations=["Bengaluru", "Karnataka"],
        ticket_min=1000000.0,   # ₹10 Lakh
        ticket_max=2500000.0,   # ₹25 Lakh
        currency="INR",
        acceptable_structures=["LOAN", "REVENUE_SHARE"],
        thesis_summary="Asset-backed debt and revenue share yields with hands-off quarterly automated disbursements.",
        accepted_arrangements=["LOAN", "REVENUE_SHARE"],
        time_horizon="1_TO_3_YEARS",
        desired_involvement="PASSIVE",
        willing_to_follow_up="NO_FOLLOW_UP",
        mandatory_sectors=[],
        mandatory_arrangements=["LOAN", "REVENUE_SHARE"],
        flexible_preferences={"automated_escrow_preferred": True},
        version=1,
    )

    db.add_all([mandate_compatible, mandate_incompatible, mandate_conflict])
    db.commit()

    # 3. Seed Primary Coherent Restaurant Venture (The Malabar Coast Kitchen)
    v_restaurant = Venture(
        id="ven-malabar-01",
        founder_id=founder_restaurant.id,
        company_name="The Malabar Coast Kitchen",
        tag_line="Authentic coastal South Indian cuisine expanding to a second high-footfall location in Koramangala.",
        business_context=(
            "The Malabar Coast Kitchen operates a proven 42-seat dining and delivery establishment in Indiranagar, "
            "Bengaluru. Operating at 88% average dinner table capacity with strong repeat customer cohorts, the business "
            "is raising growth capital to launch a 50-seat second outlet on Koramangala 80-ft Road."
        ),
        sector="Food & Beverage",
        location="Bengaluru, Karnataka",
        stage="Post-Revenue Expansion",
        capital_target=2000000.0,  # ₹20 Lakh
        ticket_min=500000.0,       # ₹5 Lakh
        ticket_max=2000000.0,      # ₹20 Lakh
        currency="INR",
        capital_structures=["LOAN", "REVENUE_SHARE"],
        verification_status=VerificationStatus.PARTIALLY_VERIFIED,
        proposed_arrangement="LOAN",
        arrangement_details={
            "arrangement_type": "LOAN",
            "collateral_offered": True,
            "collateral_details": "Commercial kitchen line equipment & stainless steel infrastructure (est. ₹12L liquidation value) pledged as security.",
            "proposed_return_type": "INTEREST",
            "proposed_rate_or_terms": "14% annual interest with quarterly amortized payouts over a 24-month horizon.",
            "equity_fallback": "Option to convert remaining principal into 7% equity if secondary outlet revenue exceeds ₹10L/mo for 3 consecutive quarters.",
            "repayment_schedule": "1_TO_3_YEARS",
        },
        operating_track_record={
            "declared_monthly_revenue": 320000.0,  # ₹3.2 Lakh/mo
            "declared_monthly_revenue_label": "Founder-Declared",
            "declared_operating_margin": "24% EBITDA cash margin",
            "evidence_status": "PARTIALLY_EVIDENCED",
            "evidence_notes": "12 months GSTR-3B filings reconciled with Razorpay POS settlement bank statements.",
        },
        growth_plan={
            "projected_monthly_revenue": 850000.0,  # ₹8.5 Lakh/mo combined
            "projections_label": "Founder Projection",
            "intended_use_summary": "Koramangala 50-seat outlet: lease deposit (₹6L), kitchen fit-out & extraction (₹8L), initial inventory & working capital (₹6L).",
            "operating_cost_assumptions": "Projected additional operating cost of ₹2.8L/mo (lease ₹1.1L, staff ₹1.2L, utilities ₹50k).",
            "unsupported_assumptions": [
                "Commercial lease agreement for Koramangala location is a draft term sheet; final registration pending capital.",
                "Kitchen fit-out quotation is a single contractor bid; formal competitive tender pending.",
            ],
        },
        continuity_plan={
            "coverage_summary": "Head Chef has 5-year tenure with equity pool participation; all recipe specifications and prep routines cataloged in operating SOP manual.",
            "backup_operator_assigned": True,
            "backup_operator_name": "Suresh Babu (Co-Founder & General Manager)",
        },
        due_diligence_findings={
            "operational_reality": {
                "title": "Operational Reality & Scaling Costs",
                "status": "REVIEW_PENDING",
                "details": "Projected ₹2.8L/mo overhead is realistic for Koramangala 80-ft road, but food ingredient price inflation requires a 5% contingency margin.",
                "source": "Platform Analyst Review",
            },
            "track_record": {
                "title": "Historical Track Record & Sales",
                "status": "CHECKED_AGAINST_SOURCE",
                "details": "Historical ₹3.2L/mo declared revenue verified against 12 months GSTR-3B filings and Razorpay POS settlements (average 1,840 monthly covers).",
                "source": "State GST Portal & Bank Statements",
            },
            "market_viability": {
                "title": "Market Viability & Customer Demand",
                "status": "EVIDENCE_SUPPLIED",
                "details": "High commercial footfall corridor; 4.4/5 rating on Zomato across 3,400+ verified customer reviews in Indiranagar location.",
                "source": "Third-Party Platform Reviews",
            },
            "offered_security": {
                "title": "Offered Security & Collateral",
                "status": "REVIEW_PENDING",
                "details": "Equipment asset list supplied by founder (est. ₹12L replacement value). Specialist asset valuation and charge registration pending introduction.",
                "source": "Founder Asset Declaration",
            },
            "business_continuity": {
                "title": "Operational Continuity & Key-Person Backup",
                "status": "EVIDENCE_SUPPLIED",
                "details": "Documented kitchen SOPs and head chef equity retention agreements in place. Operational coverage verified.",
                "source": "Internal Operations Audit",
            },
            "investor_compatibility": {
                "title": "Investor Compatibility & Follow-up Needs",
                "status": "DISCREPANCY_IDENTIFIED",
                "details": "Expansion requires monthly operational oversight and cashflow review. Unsuitable for hands-off passive investors who do not conduct follow-up.",
                "source": "Platform Matching Analysis",
            },
        },
        missing_information=[
            "Executed commercial lease deed for Koramangala 80-ft road location.",
            "Independent certified valuation report for pledged kitchen equipment.",
        ],
        venture_story={
            "what_business_does": "The Malabar Coast Kitchen serves authentic coastal South Indian cuisine with high dine-in capacity utilization and loyal repeat delivery cohorts.",
            "what_it_has_achieved": "Built a profitable flagship in Indiranagar generating a declared ₹3.2 Lakh monthly revenue with 24% operating margins.",
            "what_capital_is_requested": "₹20 Lakh capital facilitation (ticket sizes ₹5L–₹20L) under a 14% p.a. term loan / revenue share arrangement.",
            "what_capital_enables": "Launch of a second 50-seat location in Koramangala, with projected monthly revenue scaling to ₹8.5 Lakh across both outlets.",
            "proposed_arrangement": "Term loan with 14% p.a. interest or revenue share; secured by commercial equipment pledge.",
            "uncertainties_and_risks": "Koramangala lease execution is pending; fit-out contractor estimates are not yet formally locked; requires active monthly operational follow-up.",
        },
        traction_metrics=[
            {"label": "Monthly Revenue", "value": "₹3.2 Lakh", "period": "Founder-Declared (GST checked)", "status": "CHECKED_AGAINST_SOURCE"},
            {"label": "Operating Margin", "value": "24% EBITDA", "period": "Last 12 Mos", "status": "CHECKED_AGAINST_SOURCE"},
            {"label": "Avg Monthly Covers", "value": "1,840 diners", "period": "Indiranagar", "status": "EVIDENCE_SUPPLIED"},
            {"label": "Capital Target", "value": "₹20 Lakh", "period": "Expansion Round", "status": "WORKING_ASSUMPTION"},
        ],
        diligence_brief={
            "financials": {
                "title": "Financial Track Record",
                "description": "Declared ₹3.2L monthly revenue supported by GST filings and bank credit entries. Operating margins average 24%.",
                "status": "CHECKED_AGAINST_SOURCE",
            },
            "legal_compliance": {
                "title": "Legal Standing & FSSAI",
                "description": "FSSAI central license valid through 2028. GST registrations active with zero tax arrears.",
                "status": "CHECKED_AGAINST_SOURCE",
            },
            "business_model": {
                "title": "Unit Economics",
                "description": "Average ticket size ₹480 dine-in, ₹340 delivery. Food cost maintained strictly below 32% of revenue.",
                "status": "CHECKED_AGAINST_SOURCE",
            },
            "questions_for_founder": [
                "When will the final Koramangala lease contract be signed?",
                "What is the timeline for kitchen equipment delivery and installation?",
            ],
        },
        version=1,
    )

    # Seed Secondary Tech Venture (BharatPay)
    v_tech = Venture(
        id="ven-bharatpay-01",
        founder_id=founder_tech.id,
        company_name="BharatPay FinTech Solutions",
        tag_line="Automated B2B trade payments and invoice reconciliation infrastructure for Indian MSMEs.",
        business_context="Intelligent digital ledger layer connecting 14,000+ wholesalers and retail merchants across tier-2/3 Indian cities.",
        sector="FinTech",
        location="Bengaluru, Karnataka",
        stage="Pre-Series A",
        capital_target=28000000.0,
        ticket_min=2500000.0,
        ticket_max=10000000.0,
        currency="INR",
        capital_structures=["EQUITY", "SAFE"],
        verification_status=VerificationStatus.VERIFIED,
        proposed_arrangement="EQUITY",
        arrangement_details={"arrangement_type": "EQUITY", "proposed_return_type": "EQUITY_APPRECIATION"},
        operating_track_record={"declared_monthly_revenue": 5200000.0, "evidence_status": "INDEPENDENTLY_CHECKED"},
        growth_plan={"projected_monthly_revenue": 14000000.0, "projections_label": "Founder Projection"},
        continuity_plan={"coverage_summary": "Co-founder team and engineering leads with ESOP pool.", "backup_operator_assigned": True},
        due_diligence_findings={},
        missing_information=[],
        venture_story={
            "what_business_does": "B2B payments ledger and invoice discounting integration for MSMEs.",
            "what_it_has_achieved": "₹6.2 Cr ARR with 14,000 active retail merchants.",
            "what_capital_is_requested": "₹2.8 Cr Pre-Series A round.",
            "what_capital_enables": "Expansion into Andhra Pradesh and Tamil Nadu wholesale clusters.",
            "proposed_arrangement": "Equity funding.",
            "uncertainties_and_risks": "Regulatory changes in RBI digital lending guidelines.",
        },
        traction_metrics=[
            {"label": "Annual Recurring Revenue", "value": "₹6.2 Cr", "period": "FY26 Audited", "status": "CHECKED_AGAINST_SOURCE"},
            {"label": "Active Merchants", "value": "14,200+", "period": "Current", "status": "CHECKED_AGAINST_SOURCE"},
        ],
        version=1,
    )

    db.add_all([v_restaurant, v_tech])
    db.commit()

    # 4. Pre-evaluate Match Cases for The Malabar Coast Kitchen against the 3 Investors
    # Case 1: Compatible Investor (Rohan Varma) -> POTENTIALLY_SUITABLE
    eval_c1 = evaluate_match(v_restaurant, mandate_compatible)
    mc_c1 = MatchCase(
        id="mc-malabar-compatible",
        venture_id=v_restaurant.id,
        mandate_id=mandate_compatible.id,
        venture_version=v_restaurant.version,
        mandate_version=mandate_compatible.version,
        outcome=eval_c1["outcome"],
        compatibility_reasons=eval_c1["compatibility_reasons"],
        mandatory_mismatches=eval_c1["mandatory_mismatches"],
        trade_offs=eval_c1["trade_offs"],
        missing_information=eval_c1["missing_information"],
        rule_results=eval_c1["rule_results"],
        review_stage=ReviewStage.APPROVED_FOR_FACILITATION,
    )

    # Case 2: Incompatible Investor (Siddharth Rao) -> UNSUITABLE (Tech only, Equity only)
    eval_c2 = evaluate_match(v_restaurant, mandate_incompatible)
    mc_c2 = MatchCase(
        id="mc-malabar-incompatible",
        venture_id=v_restaurant.id,
        mandate_id=mandate_incompatible.id,
        venture_version=v_restaurant.version,
        mandate_version=mandate_incompatible.version,
        outcome=eval_c2["outcome"],
        compatibility_reasons=eval_c2["compatibility_reasons"],
        mandatory_mismatches=eval_c2["mandatory_mismatches"],
        trade_offs=eval_c2["trade_offs"],
        missing_information=eval_c2["missing_information"],
        rule_results=eval_c2["rule_results"],
        review_stage=ReviewStage.AWAITING_REVIEW,
    )

    # Case 3: Preference Conflict Investor (Meera Nair) -> POTENTIALLY_SUITABLE with explicit Trade-Off
    eval_c3 = evaluate_match(v_restaurant, mandate_conflict)
    mc_c3 = MatchCase(
        id="mc-malabar-conflict",
        venture_id=v_restaurant.id,
        mandate_id=mandate_conflict.id,
        venture_version=v_restaurant.version,
        mandate_version=mandate_conflict.version,
        outcome=eval_c3["outcome"],
        compatibility_reasons=eval_c3["compatibility_reasons"],
        mandatory_mismatches=eval_c3["mandatory_mismatches"],
        trade_offs=eval_c3["trade_offs"],
        missing_information=eval_c3["missing_information"],
        rule_results=eval_c3["rule_results"],
        review_stage=ReviewStage.DRAFT,
    )

    db.add_all([mc_c1, mc_c2, mc_c3])
    db.commit()

    # 5. Seed Pre-Existing Connection and Messages (Rohan Varma <-> Arvind Nair)
    conn = Connection(
        id="conn-rohan-malabar-01",
        venture_id=v_restaurant.id,
        investor_id=investor_compatible.id,
        status=ConnectionStatus.CONNECTED,
        requested_by=UserRole.INVESTOR,
        investor_consent=True,
        founder_consent=True,
        reviewer_approved=True,
        request_note="Very interested in your Indiranagar customer retention and the proposed 14% term loan terms for Koramangala.",
        created_at=datetime.now(timezone.utc) - timedelta(days=2),
        connected_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db.add(conn)
    db.commit()

    m1 = Message(
        id="msg-001",
        connection_id=conn.id,
        sender_id=investor_compatible.id,
        recipient_id=founder_restaurant.id,
        content="Hello Arvind, glad to connect! We reviewed your Malabar Coast Kitchen brief. Your ₹3.2L monthly revenue and 24% operating cash margins look very solid.",
        is_read=True,
        timestamp=datetime.now(timezone.utc) - timedelta(hours=20),
    )
    m2 = Message(
        id="msg-002",
        connection_id=conn.id,
        sender_id=founder_restaurant.id,
        recipient_id=investor_compatible.id,
        content="Thank you Rohan! We've spent 4 years building this kitchen foundation in Indiranagar. Happy to share our Koramangala location term sheet and unit economics model.",
        is_read=True,
        timestamp=datetime.now(timezone.utc) - timedelta(hours=16),
    )
    m3 = Message(
        id="msg-003",
        connection_id=conn.id,
        sender_id=investor_compatible.id,
        recipient_id=founder_restaurant.id,
        content="Sounds great. Let's schedule an appointment this Thursday to review the equipment collateral schedule and contractor estimates.",
        is_read=False,
        timestamp=datetime.now(timezone.utc) - timedelta(hours=2),
    )
    db.add_all([m1, m2, m3])
    db.commit()

    # 6. Seed Appointment Request
    appt1 = AppointmentRequest(
        id="appt-malabar-01",
        match_case_id=mc_c1.id,
        venture_id=v_restaurant.id,
        investor_id=investor_compatible.id,
        founder_id=founder_restaurant.id,
        requested_by=UserRole.INVESTOR,
        meeting_purpose="Review Koramangala expansion unit economics, equipment pledge schedule, and draft lease terms.",
        sharing_scope="Declared revenue reconciliation, food cost breakdown, and contractor quotation.",
        preferred_times=["Thursday 3:00 PM IST", "Friday 11:30 AM IST"],
        status=AppointmentStatus.REQUESTED,
        notes="Please have the Indiranagar GSTR-3B filings and Koramangala floor plan available for review.",
    )
    db.add(appt1)
    db.commit()

    # 7. Seed Extensible Guided Onboarding Questions
    questions = [
        OnboardingQuestion(
            id="q1",
            section="1. Goal & Business Model",
            question_key="business_type",
            label="What type of business do you operate?",
            description="Select the category that best describes your current commercial operations.",
            question_type="SELECT",
            options=["Food & Beverage / Restaurant", "Retail & Consumer Goods", "Enterprise B2B SaaS", "Healthcare & Diagnostics", "Agritech & Supply Chain", "CleanTech & Energy"],
            placeholder="Select business type...",
            is_mandatory=True,
            order=1,
        ),
        OnboardingQuestion(
            id="q2",
            section="1. Goal & Business Model",
            question_key="primary_objective",
            label="What is your primary commercial objective?",
            description="Tell investors what this capital facilitation will achieve.",
            question_type="SELECT",
            options=["Opening a new operating location / outlet", "Purchasing machinery or commercial equipment", "Working capital & inventory expansion", "Hiring and team scaling", "Refinancing existing operational liabilities"],
            placeholder="Select primary objective...",
            is_mandatory=True,
            order=2,
        ),
        OnboardingQuestion(
            id="q3",
            section="2. Proposed Funding Arrangement",
            question_key="proposed_arrangement",
            label="What funding arrangement do you propose to investors?",
            description="These are proposed commercial arrangements, not finalized legal contracts.",
            question_type="SELECT",
            options=["LOAN (Fixed Term Debt)", "REVENUE_SHARE (Royalty on Sales)", "EQUITY (Ownership Stake)", "OTHER / Need Facilitation Help"],
            placeholder="Select proposed arrangement...",
            is_mandatory=True,
            order=3,
        ),
        OnboardingQuestion(
            id="q4",
            section="2. Proposed Funding Arrangement",
            question_key="collateral_offered",
            label="Is physical collateral or equipment security being offered?",
            description="Investors value verifiable asset backing when assessing credit arrangements.",
            question_type="SELECT",
            options=["YES - Commercial equipment and physical assets", "YES - Real estate / leasehold property charge", "NO - Unsecured business loan", "UNSURE / Need guidance"],
            placeholder="Select collateral status...",
            is_mandatory=True,
            order=4,
        ),
        OnboardingQuestion(
            id="q5",
            section="3. Current Performance & Track Record",
            question_key="declared_monthly_revenue",
            label="Current Average Monthly Revenue (INR)",
            description="Clearly labelled as Founder-Declared until verified against GST or audited bank reconciliations.",
            question_type="CURRENCY",
            placeholder="e.g. 320000",
            is_mandatory=True,
            order=5,
        ),
        OnboardingQuestion(
            id="q6",
            section="3. Current Performance & Track Record",
            question_key="declared_operating_margin",
            label="Estimated Operating Cash Margin (%)",
            description="EBITDA margin before taxes and founder personal drawings.",
            question_type="TEXT",
            placeholder="e.g. 24% cash operating margin",
            is_mandatory=True,
            order=6,
        ),
        OnboardingQuestion(
            id="q7",
            section="4. Capital Purpose & Growth Projections",
            question_key="capital_target",
            label="Total Capital Requirement (INR)",
            description="Documented working assumption baseline is ₹10 Lakh.",
            question_type="CURRENCY",
            placeholder="e.g. 2000000",
            is_mandatory=True,
            order=7,
        ),
        OnboardingQuestion(
            id="q8",
            section="4. Capital Purpose & Growth Projections",
            question_key="projected_monthly_revenue",
            label="Projected Monthly Revenue after Deployment (INR)",
            description="Clearly labelled as Founder Projection.",
            question_type="CURRENCY",
            placeholder="e.g. 850000",
            is_mandatory=True,
            order=8,
        ),
        OnboardingQuestion(
            id="q9",
            section="5. Continuity & Operational Coverage",
            question_key="continuity_plan_summary",
            label="Operational continuity and key-person backup arrangement",
            description="Explain how day-to-day operations continue if the primary founder is temporarily unavailable.",
            question_type="TEXTAREA",
            placeholder="Describe operational coverage, SOP documentation, and second-in-command responsibilities...",
            is_mandatory=True,
            order=9,
        ),
    ]
    db.add_all(questions)
    db.commit()
    print("Database seeded with coherent restaurant demo and 3 test matching scenarios successfully.")
