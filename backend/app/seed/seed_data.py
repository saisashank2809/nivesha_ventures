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
from app.core.supabase import supabase_admin


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


def sync_supabase_user(email: str, password: str, full_name: str, role: str, firm: str):
    """Optional sync to Supabase Auth so logins work via Supabase directly."""
    if not supabase_admin:
        return None
    try:
        user_res = supabase_admin.auth.admin.create_user({
            "email": email.lower().strip(),
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name,
                "role": role,
                "firm_or_company": firm,
            },
        })
        if user_res and user_res.user:
            return user_res.user.id
    except Exception as e:
        # User might already exist in Supabase Auth
        pass
    return None


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

    standard_pw = "password123"
    pw_hash = hash_pw(standard_pw)

    # =========================================================================
    # 1. PLATFORM REVIEWER & INVESTOR USERS
    # =========================================================================

    reviewer = User(
        id="usr-reviewer-01",
        email="reviewer@nivesha.in",
        password_hash=pw_hash,
        full_name="Platform Review Desk",
        role=UserRole.REVIEWER,
        firm_or_company="Nivesha Ventures",
        title="Head of Due Diligence & Facilitation",
        bio="Independent reviewer facilitating venture evaluation, evidence audits, and introduction appointments.",
    )

    investor_rohan = User(
        id="usr-investor-01",
        email="investor@peakindia.vc",
        password_hash=pw_hash,
        full_name="Rohan Varma",
        role=UserRole.INVESTOR,
        firm_or_company="Varma Capital Partners",
        title="Managing Partner",
        bio="Multi-asset investor deploying growth capital, private credit, fractional entertainment units, and healthcare buyouts across South India.",
    )

    # Incompatible Tech Investor (for compatibility test verification)
    investor_siddharth = User(
        id="usr-investor-02",
        email="siddharth@techalpha.vc",
        password_hash=pw_hash,
        full_name="Siddharth Rao",
        role=UserRole.INVESTOR,
        firm_or_company="TechAlpha Capital",
        title="General Partner",
        bio="Pure-play early stage SaaS and AI software equity investor.",
    )

    # Hands-off Family Office Investor (for trade-off test verification)
    investor_meera = User(
        id="usr-investor-03",
        email="meera@nairfamilyoffice.in",
        password_hash=pw_hash,
        full_name="Meera Nair",
        role=UserRole.INVESTOR,
        firm_or_company="Nair Family Office",
        title="Investment Director",
        bio="Hands-off wealth management office seeking passive fixed-yield deployments.",
    )

    # =========================================================================
    # 2. SEED 6 DISTINCT VENTURE FOUNDERS (ONE ACCOUNT PER VENTURE)
    # =========================================================================

    # 1. Film Production Founder
    founder_film = User(
        id="usr-founder-film",
        email="film.producer@nivesha.in",
        password_hash=pw_hash,
        full_name="Raghavendra Rao",
        role=UserRole.FOUNDER,
        firm_or_company="Vayuputra Productions",
        title="Managing Producer & Director",
        bio="National Award-winning filmmaker with 14 years industry experience in Telugu & pan-Indian production.",
    )

    # 2. Shoe Manufacturing Founder
    founder_shoe = User(
        id="usr-founder-shoe",
        email="footwear.founder@nivesha.in",
        password_hash=pw_hash,
        full_name="Vikramaditya Sahni",
        role=UserRole.FOUNDER,
        firm_or_company="StrideCraft Footwear (Aethel Brand)",
        title="Chief Executive & Founder",
        bio="Second-generation footwear manufacturer modernizing D2C athletic and casual shoes via celebrity co-branding.",
    )

    # 3. Collateral Debt Manufacturer Founder
    founder_debt = User(
        id="usr-founder-debt",
        email="debt.founder@nivesha.in",
        password_hash=pw_hash,
        full_name="Suresh Chandra Patra",
        role=UserRole.FOUNDER,
        firm_or_company="Apex Precision Engineering",
        title="Managing Director",
        bio="Industrialist operating high-precision CNC machining units for automotive and defense OEM supply.",
    )

    # 4. Rural Logistics Founder
    founder_logistics = User(
        id="usr-founder-logistics",
        email="logistics.founder@nivesha.in",
        password_hash=pw_hash,
        full_name="Sravani Reddy",
        role=UserRole.FOUNDER,
        firm_or_company="GramaBlink Hyperlocal Logistics",
        title="Founder & CEO",
        bio="Supply chain technologist pioneering Tier-3 quick-commerce delivery via women's self-help groups (DWACRA) in Andhra Pradesh.",
    )

    # 5. Healthcare Buyout Founder
    founder_healthcare = User(
        id="usr-founder-healthcare",
        email="healthcare.founder@nivesha.in",
        password_hash=pw_hash,
        full_name="Dr. Hariprasad Varma",
        role=UserRole.FOUNDER,
        firm_or_company="Varma Multispeciality Care",
        title="Medical Director & Senior Surgeon",
        bio="Senior surgical director overseeing 120-bed NABH-accredited tertiary care hospitals in Bengaluru & Mysuru.",
    )

    # 6. Real Estate Developer Founder
    founder_realestate = User(
        id="usr-founder-realestate",
        email="realestate.founder@nivesha.in",
        password_hash=pw_hash,
        full_name="Karthik Narayana",
        role=UserRole.FOUNDER,
        firm_or_company="Greenfield Land Developers",
        title="Managing Partner",
        bio="RERA-registered plotted township developer executing master-planned gated layouts near Hyderabad growth corridors.",
    )

    # 7. Food & Hospitality Founder (Malabar Coast Kitchen)
    founder_restaurant = User(
        id="usr-founder-restaurant",
        email="founder@malabarcoast.in",
        password_hash=pw_hash,
        full_name="Arvind Nair",
        role=UserRole.FOUNDER,
        firm_or_company="The Malabar Coast Kitchen",
        title="Founder & Managing Operator",
        bio="Culinary entrepreneur with 10 years experience operating high-repeat coastal Indian kitchens in Bengaluru.",
    )

    users_list = [
        reviewer,
        investor_rohan,
        investor_siddharth,
        investor_meera,
        founder_film,
        founder_shoe,
        founder_debt,
        founder_logistics,
        founder_healthcare,
        founder_realestate,
        founder_restaurant,
    ]
    for u in users_list:
        db.add(u)
    db.commit()

    # Try sync to Supabase Auth in background (silently succeeds or skips)
    for u in users_list:
        sync_supabase_user(u.email, standard_pw, u.full_name, u.role.value, u.firm_or_company or "")

    # =========================================================================
    # 3. SEED THE 6 NEW VENTURES + RESTAURANT WITH THE 10 COMMON SECTIONS
    # =========================================================================

    # -------------------------------------------------------------------------
    # Venture 1: Film Production (Garuda - The Untold Legend)
    # -------------------------------------------------------------------------
    v_film = Venture(
        id="ven-film-01",
        founder_id=founder_film.id,
        company_name="Vayuputra Productions - 'Garuda'",
        tag_line="Pan-Indian mythological action feature film seeking fractional equity co-producers.",
        business_context=(
            "A high-concept mythological fantasy action film budgeted at ₹12 Cr. Seeking ₹6 Cr through 24 fractional equity units "
            "(₹25 Lakhs per unit) with tiered producer screen credits, top-tier technical crew (Hanu-Man DOP, Sam CS), and structured OTT recovery."
        ),
        sector="Film / Entertainment",
        location="Hyderabad & Bengaluru",
        stage="Pre-Production / Casting Locked",
        capital_target=60000000.0,  # ₹6 Cr
        ticket_min=2500000.0,       # ₹25 Lakh per unit
        ticket_max=20000000.0,      # ₹2 Cr (Producer tier)
        currency="INR",
        capital_structures=["Fractional Equity Units", "Profit Participation", "Tiered Producer Credits"],
        verification_status=VerificationStatus.PARTIALLY_VERIFIED,
        proposed_arrangement="FRACTIONAL_EQUITY_UNITS",
        arrangement_details={
            "structure_name": "Fractional Equity Participation with Screen Credits",
            "total_budget": 120000000.0,  # ₹12 Cr
            "capital_sought": 60000000.0, # ₹6 Cr
            "unit_price": 2500000.0,      # ₹25 Lakh
            "total_units": 24,
            "calculated_budget_contribution": "50.0% of ₹12 Cr total production budget",
            "calculation_note": "50% funding contribution does NOT equate to 50% film IP ownership. Net theatrical & OTT profit split is 60% to investor pool until 100% capital recoupment, then 40% parity.",
            "credit_tiers": [
                {"tier": "Associate Producer", "min_investment": "₹25 Lakhs (1 Unit)", "perks": "Title credit, premiere passes, audio launch invite"},
                {"tier": "Co-Producer", "min_investment": "₹50 Lakhs (2 Units)", "perks": "Separate title card, trailer launch on-stage, promotional attribution"},
                {"tier": "Presents / Special Partner", "min_investment": "₹1 Crore (4 Units)", "perks": "Top-billed presentation credit on posters & digital assets"},
                {"tier": "Producer", "min_investment": "₹2 Crores (8 Units)", "perks": "Main title producer billing alongside lead studio"},
            ],
            "waterfall_recovery_order": "1. P&A costs -> 2. Investor Principal Recoupment (First Out) -> 3. Talent Backend Pool -> 4. Equity Profit Split",
        },
        operating_track_record={
            "past_projects": "2 Feature Films delivered (2021 & 2023), cumulative theatrical gross ₹42 Cr",
            "declared_box_office_multipliers": "5x to 7x for comparable category films (Hanu-Man, Karthikeya 2)",
            "declared_box_office_label": "Historical Industry Benchmark (Not a Guaranteed Return)",
            "distribution_loi": "Non-binding Letter of Intent received from 2 regional distributors for Nizam & Ceeded territories",
        },
        growth_plan={
            "theatrical_release_window": "Q4 2027 (Diwali Festival Window)",
            "satellite_ott_strategy": "Direct-to-digital pre-sale talks initiated with Zee5 & Prime Video post-first look teaser",
            "music_rights_valuation": "Projected ₹2.5 Cr audio/music rights recovery backed by Sam CS composition deal",
        },
        due_diligence_findings={
            "crew_credentials": {
                "status": "VERIFIED",
                "finding": "Cinematographer Shivendra (Hanu-Man) and Composer Sam CS formally contracted under signed agreements.",
            },
            "script_ip_copyright": {
                "status": "VERIFIED",
                "finding": "Script registered with Screenwriters Association (SWA); no prior encumbrances or title claims.",
            },
            "budget_breakdown": {
                "status": "SUPPORTED",
                "finding": "Itemized ₹12 Cr production budget validated against standard industry line-item rates.",
            },
            "comparable_multipliers": {
                "status": "UNRESOLVED_CHECK",
                "finding": "5x–7x multipliers are historical peer comparisons. Exact recovery depends entirely on theatrical footfalls and OTT contract pricing.",
            },
            "talent_binding": {
                "status": "PARTLY_VERIFIED",
                "finding": "Lead protagonist MOU signed with scheduling dates locked for July-October production schedule.",
            },
        },
        missing_information=[
            "Final binding Long-Form Agreement for Hindi dubbing satellite rights.",
            "Independent completion bond insurance quotation.",
        ],
        venture_story={
            "venture_overview": "Mythological action thriller 'Garuda' produced by Vayuputra Productions, Hyderabad. Pre-production locked with Hanu-Man DOP and Sam CS as music director.",
            "current_position": "Script locked, primary cast signed, visual effects pre-visualization completed for 18 core action sequences.",
            "opportunity": "Pan-Indian demand for visual folklore spectacles following the ₹300 Cr+ box office benchmarks of Hanu-Man and Kantara.",
            "capital_requirement": "₹6.00 Crores external financing against ₹12.00 Crores total budget (₹6.00 Cr promoter commitment and vendor deferrals in place).",
            "use_of_capital": "Production shooting schedule (₹3.8 Cr), VFX & CGI pipeline (₹1.8 Cr), Sound design & post-production (₹40 L).",
            "investment_proposal": "24 fractional equity units at ₹25 Lakhs/unit. 100% first-dollar principal recoupment priority from OTT and satellite pre-sales, followed by 40% net theatrical profit share.",
            "execution_capability": "Production house with 2 profitable regional releases, veteran VFX supervisors from Baahubali and Hanu-Man.",
            "risks_and_dependencies": "Release window competition, VFX schedule overruns, and censor certification clearance.",
            "investor_participation": "Tiered screen credits (Associate to Main Producer), quarterly audited line-item expense ledger, private screening access.",
            "evidence_and_next_steps": "Script copyright and crew contracts verified. Platform review desk ready to facilitate intro upon proof of funds.",
        },
        traction_metrics=[
            {"label": "Total Budget", "value": "₹12.00 Cr", "period": "Production", "status": "BUDGET_LOCKED"},
            {"label": "Capital Sought", "value": "₹6.00 Cr", "period": "24 Units", "status": "FRACTIONAL_EQUITY"},
            {"label": "Unit Size", "value": "₹25.00 Lakhs", "period": "Per Unit", "status": "VERIFIED"},
            {"label": "Peer Multiplier", "value": "5x – 7x", "period": "Historical Comparison", "status": "BENCHMARK_ONLY"},
        ],
        diligence_brief={
            "business_model": {"title": "Theatrical & Digital Waterfall", "status": "SUPPORTED", "description": "Multi-stream revenue from Digital OTT, Theatrical Box Office, Satellite broadcast, Music streaming, and Hindi dubbing rights."},
            "questions_for_founder": ["What happens if VFX post-production delays the release past the Diwali window?", "Is there an escrow account for investor funds released against milestone shoot schedules?"],
        },
        custom_answers={"business_type": "FILM_ENTERTAINMENT", "proposed_arrangement": "FRACTIONAL_EQUITY_UNITS"},
    )

    # -------------------------------------------------------------------------
    # Venture 2: Shoe Manufacturing + Celebrity Service Line (StrideCraft)
    # -------------------------------------------------------------------------
    v_shoe = Venture(
        id="ven-shoe-02",
        founder_id=founder_shoe.id,
        company_name="StrideCraft Footwear (Aethel Brand)",
        tag_line="Established footwear manufacturer scaling D2C athletic line via zero-upfront-fee celebrity revenue-share.",
        business_context=(
            "An active shoe manufacturer with a 35,000 pairs/month automated plant in Agra/Noida. Seeking ₹3 Cr growth capital to scale "
            "a high-margin athletic line co-branded with a top Indian celebrity on a zero-upfront-fee, 7% revenue-share model."
        ),
        sector="Manufacturing / Consumer Brand",
        location="Noida & Gurugram",
        stage="Operating & Scaling (Plant Active)",
        capital_target=30000000.0,  # ₹3 Cr
        ticket_min=5000000.0,       # ₹50 Lakhs
        ticket_max=30000000.0,
        currency="INR",
        capital_structures=["Growth Equity", "Mezzanine Debt", "Revenue Share Hybrid"],
        verification_status=VerificationStatus.PARTIALLY_VERIFIED,
        proposed_arrangement="GROWTH_EQUITY_WITH_REV_SHARE",
        arrangement_details={
            "structure_name": "Growth Capital for Celebrity D2C Scaling",
            "requested_amount": 30000000.0,
            "proposed_equity_offered": "12.5% to 15.0%",
            "celebrity_partnership_model": "Zero upfront endorsement fee; celebrity receives 7.0% royalty on net sales plus 3.0% phantom equity.",
            "calculated_margin_impact": "At ₹2,400 retail price (cost of goods ₹780), 7% celebrity share equals ₹168/pair. Gross margin remains healthy at 58.5% post-royalty.",
            "returns_buffer": "12% return and refund allowance factored into operational cash flow model.",
        },
        operating_track_record={
            "factory_capacity": "35,000 pairs/month automated injection moulding plant",
            "current_utilization": "62% (21,700 pairs/month OEM production for Bata & Metro)",
            "historical_monthly_revenue": "₹78.50 Lakhs average monthly revenue across FY24",
            "ebitda_margin": "14.2% on B2B contract manufacturing",
        },
        growth_plan={
            "d2c_expansion_target": "50,000 pairs/year of Aethel branded sneakers sold at ₹2,499 average selling price",
            "projected_revenue_fy26": "₹18.50 Crores with D2C contributing 65% of gross profit",
        },
        due_diligence_findings={
            "manufacturing_assets": {
                "status": "VERIFIED",
                "finding": "Factory premises and machinery inspected. Unencumbered plant equipment valued at ₹4.2 Cr.",
            },
            "financial_statements": {
                "status": "VERIFIED",
                "finding": "FY23 and FY24 audited balance sheets and GST filings match declared revenue records.",
            },
            "celebrity_talent_binding": {
                "status": "UNRESOLVED_CHECK",
                "finding": "Celebrity agency term sheet agreed in principle, but formal binding contract has NOT yet been executed. Investor must clarify talent campaign obligations.",
            },
            "returns_and_logistics_impact": {
                "status": "SUPPORTED",
                "finding": "Reverse logistics contract terms with Delhivery and BlueDart provide clear unit economics on D2C returns.",
            },
        },
        missing_information=[
            "Countersigned formal agreement with celebrity management agency.",
            "Detailed SKU-level packaging and mould tooling quotes for Aethel runner line.",
        ],
        venture_story={
            "venture_overview": "StrideCraft Footwear is an established ISO-certified shoe manufacturing plant in Noida expanding from OEM contract production into high-margin branded D2C.",
            "current_position": "Operating profitably with ₹9.4 Cr annual OEM turnover, 35,000 pairs/month capacity, and 45 corporate retail accounts.",
            "opportunity": "Rapidly expanding Indian premium athleisure sneaker market, targeting the ₹2,000–₹3,500 sweet spot dominated by overpriced imports.",
            "capital_requirement": "₹3.00 Crores growth capital (₹1.2 Cr raw material inventory, ₹1.0 Cr launch marketing, ₹80 L tooling and working capital).",
            "use_of_capital": "Raw materials bulk sourcing for 60,000 pairs, digital launch campaign, and D2C fulfillment warehousing.",
            "investment_proposal": "14% equity in StrideCraft Brand subsidiary or 18% coupon mezzanine debt with 3% revenue kicker.",
            "execution_capability": "25 years of leather and polymer manufacturing experience with supply contracts for major national brands.",
            "risks_and_dependencies": "Celebrity availability for quarterly photo shoots, customer return rate volatility, and online customer acquisition costs (CAC).",
            "investor_participation": "Board observer seat, quarterly audited inventory reconciliations, veto rights on further equity dilution.",
            "evidence_and_next_steps": "Factory deed and audited GST returns verified. Reviewer awaiting signed talent agreement to approve investor introductions.",
        },
        traction_metrics=[
            {"label": "Annual Revenue", "value": "₹9.40 Cr", "period": "FY24 Audited", "status": "VERIFIED"},
            {"label": "Plant Capacity", "value": "35,000 Pairs/mo", "period": "Rated Capacity", "status": "VERIFIED"},
            {"label": "Gross Margin", "value": "58.5%", "period": "D2C Post-Royalty", "status": "CALCULATED"},
            {"label": "Talent Contract", "value": "Term Sheet Stage", "period": "Agency Review", "status": "PENDING_VERIFICATION"},
        ],
        diligence_brief={
            "business_model": {"title": "Direct-to-Consumer + Retail Wholesale", "status": "SUPPORTED", "description": "Blended model leveraging in-house manufacturing cost advantage to sell online at 55%+ gross margins."},
            "questions_for_founder": ["What are the minimum sales guarantees demanded by the celebrity agency?", "What is the clawback mechanism if the talent faces public reputational risks?"],
        },
        custom_answers={"business_type": "MANUFACTURING_CONSUMER", "proposed_arrangement": "EQUITY_REVENUE_SHARE"},
    )

    # -------------------------------------------------------------------------
    # Venture 3: Collateral-Backed Debt Deal (Apex Precision Engineering)
    # -------------------------------------------------------------------------
    v_debt = Venture(
        id="ven-debt-03",
        founder_id=founder_debt.id,
        company_name="Apex Precision Engineering",
        tag_line="High-precision CNC component supplier seeking ₹25 Lakhs secured debt at 18% return backed by 3 BHK flat.",
        business_context=(
            "An aerospace and defense tooling supplier in Peenya Industrial Area, Bengaluru. Seeking a ₹25 Lakh working capital loan "
            "for 18 months at 18% annual return to execute a confirmed HAL defense supply contract, secured by first charge against a 3 BHK flat (Valuation ₹1.15 Cr)."
        ),
        sector="Manufacturing / Industrial",
        location="Peenya, Bengaluru",
        stage="Operating Business (12 Years Track Record)",
        capital_target=2500000.0,  # ₹25 Lakhs
        ticket_min=1000000.0,      # ₹10 Lakhs
        ticket_max=2500000.0,      # ₹25 Lakhs
        currency="INR",
        capital_structures=["Secured Debt / Loan", "Mortgage-Backed Loan", "Convertible Debt Option"],
        verification_status=VerificationStatus.VERIFIED,
        proposed_arrangement="SECURED_COLLATERAL_DEBT",
        arrangement_details={
            "structure_name": "Secured Short-Term Debt with Immovable Collateral",
            "loan_amount": 2500000.0,
            "interest_rate": "18.0% per annum",
            "calculation_basis": "Annual simple interest calculated monthly on principal (₹37,500 monthly interest payout).",
            "tenure_months": 18,
            "total_interest_payable": 675000.0,  # ₹25L * 18% * 1.5 yrs
            "collateral_offered": "First registered mortgage charge on 1,850 sq.ft 3 BHK residential apartment in Indiranagar, Bengaluru.",
            "collateral_valuation": 11500000.0,  # ₹1.15 Cr
            "collateral_coverage_ratio": "4.6x Principal Loan Amount (460% collateral cover)",
            "equity_conversion_fallback": "If principal is not repaid within 18 months, lender holds option to convert debt into 10% equity stake in Apex Precision Engineering.",
        },
        operating_track_record={
            "annual_turnover": "₹3.85 Crores (FY24 GST verified)",
            "existing_bank_debt": "₹45 Lakhs working capital overdraft with Canara Bank (Standard asset, zero NPAs)",
            "primary_clients": "Hindustan Aeronautics Limited (HAL), BEML, Dynamatic Technologies",
        },
        growth_plan={
            "confirmed_purchase_orders": "₹68 Lakhs in active purchase orders from defense public sector undertakings",
            "repayment_source": "Designated escrow account mapped to HAL invoice discounting and direct collections",
        },
        due_diligence_findings={
            "collateral_title_deed": {
                "status": "VERIFIED",
                "finding": "Original title deeds of Indiranagar 3 BHK flat inspected by legal counsel; nil encumbrance certificate (EC) verified for 30 years.",
            },
            "property_valuation": {
                "status": "VERIFIED",
                "finding": "Government-approved valuer report confirms distress market value of ₹1.15 Crores (4.6x loan coverage).",
            },
            "purchase_orders": {
                "status": "VERIFIED",
                "finding": "Purchase orders PO-HAL-2026-992 and PO-BEML-441 authenticated with defense procurement portal.",
            },
            "conversion_mechanics": {
                "status": "SUPPORTED",
                "finding": "Founder board resolution pre-approving mortgage execution and conditional equity conversion in draft agreement.",
            },
        },
        missing_information=[
            "Formal NOC from the apartment owners' residential welfare association for mortgage registration.",
        ],
        venture_story={
            "venture_overview": "Apex Precision Engineering has manufactured precision CNC machine components in Peenya, Bengaluru since 2012, supplying aerospace and defense contractors.",
            "current_position": "Running 6 computerized CNC lathe centers at 85% capacity with unblemished 12-year debt servicing record.",
            "opportunity": "Execution of a specialized titanium component order for HAL requiring ₹25 Lakhs upfront alloy billets and heat-treatment tooling.",
            "capital_requirement": "₹25.00 Lakhs short-term secured debt for raw material procurement.",
            "use_of_capital": "100% fund deployment into certified titanium alloy billets (₹18 L) and precision cutting inserts (₹7 L).",
            "investment_proposal": "18% p.a. simple interest paid monthly (₹37,500/month), principal bullet repayment at 18 months, backed by first legal mortgage on ₹1.15 Cr flat.",
            "execution_capability": "ISO 9001:2015 and AS9100D aerospace certified facility with seasoned machinists.",
            "risks_and_dependencies": "Payment cycle delay from defense PSU (mitigated by 4.6x property collateral cushion).",
            "investor_participation": "Monthly bank-certified interest remittance, registered mortgage deed, and personal guarantee from founder.",
            "evidence_and_next_steps": "All property documents, bank statements, and purchase orders verified. Ready for immediate investor introduction and legal escrow.",
        },
        traction_metrics=[
            {"label": "Loan Target", "value": "₹25.00 Lakhs", "period": "18 Months", "status": "VERIFIED"},
            {"label": "Interest Return", "value": "18.0% p.a.", "period": "Monthly Payout", "status": "COMMITTED"},
            {"label": "Collateral Value", "value": "₹1.15 Cr", "period": "3 BHK Flat", "status": "4.6x_COVERAGE"},
            {"label": "Confirmed POs", "value": "₹68.00 Lakhs", "period": "HAL & BEML", "status": "VERIFIED"},
        ],
        diligence_brief={
            "business_model": {"title": "Direct B2B Defense Supply", "status": "VERIFIED", "description": "High barrier-to-entry precision engineering with established defense vendor codes."},
            "questions_for_founder": ["Will the mortgage be registered as an equitable mortgage or registered mortgage with Sub-Registrar?"],
        },
        custom_answers={"business_type": "MANUFACTURING_DEBT", "proposed_arrangement": "SECURED_DEBT"},
    )

    # -------------------------------------------------------------------------
    # Venture 4: Rural / Tier-3 Logistics Startup (GramaBlink)
    # -------------------------------------------------------------------------
    v_logistics = Venture(
        id="ven-logistics-04",
        founder_id=founder_logistics.id,
        company_name="GramaBlink Hyperlocal Logistics",
        tag_line="Hyperlocal 45-minute delivery network for Tier-3 towns powered by local hubs and DWACRA women's SHGs.",
        business_context=(
            "Hyperlocal supply chain and quick delivery network modeled on Blinkit, purpose-built for non-metro Andhra Pradesh & Odisha "
            "towns (Vizianagaram, Gajapathinagaram, Bobbili). Utilizing micro-warehouses and DWACRA women's self-help groups for last-mile delivery."
        ),
        sector="Logistics / Rural Delivery",
        location="Vizianagaram & Bobbili, AP",
        stage="Operating Pilot (Expanding to 5 Towns)",
        capital_target=7500000.0,   # ₹75 Lakhs
        ticket_min=1500000.0,       # ₹15 Lakhs
        ticket_max=7500000.0,
        currency="INR",
        capital_structures=["Early-Stage Equity", "Revenue Share", "Convertible Note"],
        verification_status=VerificationStatus.PARTIALLY_VERIFIED,
        proposed_arrangement="EARLY_STAGE_EQUITY",
        arrangement_details={
            "structure_name": "Pre-Series A Equity for Tier-3 Micro-Hub Network",
            "funding_sought": 7500000.0,
            "equity_offered": "15.0% post-money valuation at ₹5.0 Cr cap",
            "unit_economics": "Average Order Value (AOV) ₹340; Net contribution margin ₹48/order after delivery payout to DWACRA women.",
            "hub_model": "300 sq.ft leased micro-dark stores near town bus stations stocking 1,200 fast-moving daily essential SKUs.",
            "shg_engagement": "DWACRA women earn ₹28 per drop within 3 km radius, operating on 2-wheelers or electric cycles.",
        },
        operating_track_record={
            "active_orders": "620 daily orders across Vizianagaram pilot cluster",
            "repeat_order_rate": "54% 30-day cohort retention",
            "monthly_gmv": "₹63.20 Lakhs gross merchandise value in April 2026",
            "active_merchant_tieups": "84 local kiranas and wholesale FMCG stockists integrated",
        },
        growth_plan={
            "geographic_expansion": "Opening 6 new micro-hubs across Bobbili, Gajapathinagaram, Salur, Parvathipuram, and Srikakulam",
            "projected_daily_orders": "3,000 daily orders within 9 months of hub rollout",
        },
        due_diligence_findings={
            "pilot_traction": {
                "status": "VERIFIED",
                "finding": "Payment gateway and UPI transaction logs confirm 18,000+ completed orders in past 30 days.",
            },
            "delivery_economics": {
                "status": "SUPPORTED",
                "finding": "Calculated delivery cost of ₹28 per drop is sustainable due to compact 3 km cluster density in small towns.",
            },
            "dwacra_partnership": {
                "status": "UNRESOLVED_CHECK",
                "finding": "MOU signed with district federation; however, official bank link verification for direct subsidy transfers is pending approval.",
            },
            "tech_stack": {
                "status": "VERIFIED",
                "finding": "Proprietary Android merchant app and vernacular customer order interface functioning smoothly with offline SMS fallback.",
            },
        },
        missing_information=[
            "Official sanction letter from District Rural Development Agency (DRDA) for state-wide DWACRA federation endorsement.",
        ],
        venture_story={
            "venture_overview": "GramaBlink delivers groceries, medicines, and farm inputs within 45 minutes across Tier-3 towns where mainstream quick-commerce does not operate.",
            "current_position": "Live in Vizianagaram with 620 daily orders, 3 dark stores, 84 partner suppliers, and positive unit economics.",
            "opportunity": "Over 450 unserved Tier-3 and Tier-4 towns in South India with high smartphone penetration but zero instant delivery access.",
            "capital_requirement": "₹75.00 Lakhs expansion capital for hub fit-outs, inventory credit lines, and local merchant onboarding.",
            "use_of_capital": "Dark store inventory float (₹35 L), cold storage freezers & racking (₹20 L), vernacular marketing (₹10 L), working capital (₹10 L).",
            "investment_proposal": "15% equity at ₹5 Cr valuation cap with right of first refusal in subsequent Series A round.",
            "execution_capability": "Founder ex-Delhivery operations manager with deep grassroots relationships with Andhra Pradesh merchant associations.",
            "risks_and_dependencies": "Monsoon transport delays, inventory shrinkage in perishable fresh items, and fuel price changes.",
            "investor_participation": "Monthly MIS dashboard, dark store inventory audits, quarterly financial advisory meetings.",
            "evidence_and_next_steps": "Live order backend verified. Review desk awaiting final DRDA paperwork before clearing investor meetings.",
        },
        traction_metrics=[
            {"label": "Daily Orders", "value": "620 Orders/day", "period": "Vizianagaram Hub", "status": "VERIFIED"},
            {"label": "Monthly GMV", "value": "₹63.20 Lakhs", "period": "Pilot Run", "status": "VERIFIED"},
            {"label": "Order Margin", "value": "₹48.00 / drop", "period": "Unit Contribution", "status": "CALCULATED"},
            {"label": "DWACRA Partners", "value": "45 Delivery Agents", "period": "Active Network", "status": "SUPPORTED"},
        ],
        diligence_brief={
            "business_model": {"title": "Town Micro-Fulfillment", "status": "SUPPORTED", "description": "High-margin hyper-dense town delivery tapping existing retail wholesale margins without burning delivery subsidies."},
            "questions_for_founder": ["How do you ensure inventory freshness for fresh vegetables in small town hubs?"],
        },
        custom_answers={"business_type": "LOGISTICS_RURAL", "proposed_arrangement": "EQUITY_EXPANSION"},
    )

    # -------------------------------------------------------------------------
    # Venture 5: Healthcare Buyout / Expansion (Varma Multispeciality Care)
    # -------------------------------------------------------------------------
    v_health = Venture(
        id="ven-health-05",
        founder_id=founder_healthcare.id,
        company_name="Varma Multispeciality Care",
        tag_line="120-bed NABH-accredited tertiary surgical hospital seeking ₹5 Cr for 50% equity buyout & Cath Lab expansion.",
        business_context=(
            "An operational 120-bed multi-speciality hospital in Bengaluru & Mysuru. Seeking ₹5.0 Cr for a 50% partial equity buyout "
            "of a retiring founding partner (₹3.5 Cr) and installation of an advanced digital Cath Lab for cardiac interventions (₹1.5 Cr)."
        ),
        sector="Healthcare / Hospital",
        location="Bengaluru & Mysuru",
        stage="Established Hospital (8 Years Operation)",
        capital_target=50000000.0,  # ₹5 Cr
        ticket_min=10000000.0,      # ₹1 Cr
        ticket_max=50000000.0,      # ₹5 Cr
        currency="INR",
        capital_structures=["Partial Buyout / Secondary", "Growth Equity", "Asset Acquisition"],
        verification_status=VerificationStatus.VERIFIED,
        proposed_arrangement="PARTIAL_EQUITY_BUYOUT",
        arrangement_details={
            "structure_name": "50% Ownership Acquisition / Secondary Buyout & Expansion",
            "total_transaction_size": 50000000.0,
            "buyout_component": "₹3.50 Crores dedicated to purchasing 50% equity stake from retiring co-founder Dr. K.S. Rao.",
            "primary_capex_component": "₹1.50 Crores injected directly into hospital treasury for GE Innova Digital Cath Lab acquisition.",
            "operational_valuation_basis": "1.4x FY24 audited revenue of ₹14.2 Crores (hospital pre-money valuation of ₹10.0 Crores).",
            "governance_rights": "50% voting rights, joint signatory on capital expenditures above ₹10 Lakhs, 2 out of 4 board seats.",
        },
        operating_track_record={
            "operational_beds": "120 beds across 2 hospital campuses (80 in Bengaluru, 40 in Mysuru)",
            "average_occupancy": "72% average annual bed occupancy rate",
            "annual_revenue_fy24": "₹14.20 Crores with ₹2.40 Crores EBITDA (16.9% operating margin)",
            "empanelment": "Empanelled with CGHS, ECHS, Star Health, and 18 leading TPA health insurance networks",
        },
        growth_plan={
            "cath_lab_addition": "Addition of full-time interventional cardiology unit projected to add ₹4.8 Cr high-margin revenue annually",
            "target_occupancy": "Projected 82% bed occupancy following cardiac emergency triage deployment",
        },
        due_diligence_findings={
            "nabh_accreditation": {
                "status": "VERIFIED",
                "finding": "NABH certification and Clinical Establishment permits active and valid through November 2027.",
            },
            "financial_audit": {
                "status": "VERIFIED",
                "finding": "P&L, balance sheets, and tax clearances for FY22, FY23, and FY24 verified by independent chartered accountants.",
            },
            "shareholder_buyout_agreement": {
                "status": "SUPPORTED",
                "finding": "Draft Share Purchase Agreement (SPA) executed between continuing founder and exiting partner Dr. Rao.",
            },
            "liabilities_check": {
                "status": "SUPPORTED",
                "finding": "Medical equipment lease liabilities of ₹85 Lakhs with Siemens Healthcare are current and fully disclosed.",
            },
        },
        missing_information=[
            "Final clearance certificate from biomedical waste pollution control board for Mysuru expansion wing.",
        ],
        venture_story={
            "venture_overview": "Varma Multispeciality Care operates two state-of-the-art hospitals with 120 operational beds, 4 laminar airflow modular operating theatres, and 24x7 trauma care.",
            "current_position": "Consistently profitable for 6 consecutive years, treating over 45,000 outpatients and 5,800 inpatient surgical admissions in FY24.",
            "opportunity": "Surging demand for non-metro cardiac care where patients currently travel 140 km to Bengaluru for angioplasties.",
            "capital_requirement": "₹5.00 Crores (₹3.5 Cr secondary partner buyout + ₹1.5 Cr primary Cath Lab equipment lease down payment).",
            "use_of_capital": "Secondary equity purchase from retiring director (₹3.5 Cr) and Cath Lab equipment acquisition (₹1.5 Cr).",
            "investment_proposal": "50% equity stake, 2 board seats, 50% share of annual distributable cash dividends (historical ₹1.2 Cr dividend pool).",
            "execution_capability": "Led by Dr. Hariprasad Varma (MS, MCh), supported by 18 full-time specialist consultants and 85 nursing staff.",
            "risks_and_dependencies": "Key doctor retention, medical negligence litigation risks (insured under ₹10 Cr indemnity policy), and insurance reimbursement cycles.",
            "investor_participation": "50% board representation, audit committee leadership, quarterly dividend distribution, and statutory co-signing authority.",
            "evidence_and_next_steps": "Complete financial and clinical records audited. Ready for legal review and platform introduction.",
        },
        traction_metrics=[
            {"label": "Annual Revenue", "value": "₹14.20 Cr", "period": "FY24 Audited", "status": "VERIFIED"},
            {"label": "EBITDA Profit", "value": "₹2.40 Cr", "period": "16.9% Margin", "status": "VERIFIED"},
            {"label": "Bed Count", "value": "120 Beds", "period": "72% Occupancy", "status": "VERIFIED"},
            {"label": "NABH License", "value": "Valid to 2027", "period": "Clinical Audit", "status": "VERIFIED"},
        ],
        diligence_brief={
            "business_model": {"title": "Tertiary Clinical & Surgical Care", "status": "VERIFIED", "description": "High-margin surgical and in-patient care with steady cash flow from commercial and government health insurance panels."},
            "questions_for_founder": ["What are the non-compete clauses for the exiting co-founder Dr. K.S. Rao in the Mysuru territory?"],
        },
        custom_answers={"business_type": "HEALTHCARE_HOSPITAL", "proposed_arrangement": "PARTIAL_BUYOUT"},
    )

    # -------------------------------------------------------------------------
    # Venture 6: Real Estate & Land Development (Suryam Meadows)
    # -------------------------------------------------------------------------
    v_realestate = Venture(
        id="ven-re-06",
        founder_id=founder_realestate.id,
        company_name="Suryam Meadows Plotted Layout (Phase 2)",
        tag_line="18-acre RERA-registered master-planned gated villa layout seeking ₹4 Cr development project financing.",
        business_context=(
            "An 18-acre premium plotted township on the Hyderabad–Warangal growth corridor (Near Ghatkesar / Yadagirigutta). "
            "Seeking ₹4.0 Cr project equity / mezzanine financing to complete phase-2 blacktop roads, underground cabling, and clubhouse amenities."
        ),
        sector="Real Estate / Land Development",
        location="Ghatkesar, Hyderabad",
        stage="Development Phase (DTCP Layout Approved)",
        capital_target=40000000.0,  # ₹4 Cr
        ticket_min=10000000.0,      # ₹1 Cr
        ticket_max=40000000.0,      # ₹4 Cr
        currency="INR",
        capital_structures=["Project Financing", "Joint Development Equity", "Mezzanine Debt with Plot Security"],
        verification_status=VerificationStatus.PARTIALLY_VERIFIED,
        proposed_arrangement="PROJECT_DEVELOPMENT_FINANCING",
        arrangement_details={
            "structure_name": "Project Finance with Assigned Plot Security Escrow",
            "requested_capital": 40000000.0,
            "proposed_return": "22.0% projected IRR or 30% project profit share",
            "security_structure": "Registered mortgage charge on 38 unencumbered villa plots (market value ₹9.2 Crores).",
            "total_plots": "142 plotted units across 18 acres, 54 plots sold in Phase 1.",
            "development_timeline": "14-month completion cycle for underground utilities, clubhouse, and landscaped parks.",
        },
        operating_track_record={
            "phase_1_sales": "54 plots sold generating ₹14.8 Crores in collections with all customer registrations completed",
            "past_developments": "3 successfully completed residential layouts delivered over past 8 years in Telangana",
            "land_ownership": "100% clear freehold title with absolute ownership registered under Greenfield Land Developers LLP",
        },
        growth_plan={
            "phase_2_sales_potential": "88 remaining plots at average ticket size of ₹28 Lakhs (₹24.6 Cr gross realization potential)",
            "projected_net_margin": "₹8.4 Crores net project surplus post-infrastructure completion",
        },
        due_diligence_findings={
            "title_deed_verification": {
                "status": "VERIFIED",
                "finding": "30-year search report confirms clean agricultural to non-agricultural (NA) conversion with zero litigation.",
            },
            "dtcp_layout_approval": {
                "status": "VERIFIED",
                "finding": "Directorate of Town & Country Planning (DTCP) final layout sanction LP No. 44/2024 received.",
            },
            "rera_status": {
                "status": "PARTLY_VERIFIED",
                "finding": "RERA Phase-2 registration application submitted; formal registration certificate pending final issuance.",
            },
            "escrow_mechanism": {
                "status": "SUPPORTED",
                "finding": "Axis Bank RERA-compliant separate project collection account operational.",
            },
        },
        missing_information=[
            "Final physical RERA certificate copy (acknowledgment receipt verified).",
            "Final environmental clearance NOC for rain-water harvesting percolation ponds.",
        ],
        venture_story={
            "venture_overview": "Suryam Meadows is an 18-acre luxury plotted community featuring 142 villa plots with 40-foot BT roads, underground power cabling, 24x7 security, and clubhouse.",
            "current_position": "Phase 1 fully developed and sold out (54 plots). Phase 2 civil groundwork, boundary walling, and transformer installation 60% complete.",
            "opportunity": "Proximity to Hyderabad Regional Ring Road (RRR) and IT corridor expansion driving 25% annual land value appreciation.",
            "capital_requirement": "₹4.00 Crores project completion capital.",
            "use_of_capital": "Road asphalting (₹1.4 Cr), underground drainage & STP (₹1.2 Cr), clubhouse construction (₹90 L), electric cabling (₹50 L).",
            "investment_proposal": "22% targeted project IRR backed by registered allocation of 38 unsold plots in escrow, or 30% net project profit share.",
            "execution_capability": "Civil engineering leadership team with 20+ years infrastructure construction pedigree in Telangana.",
            "risks_and_dependencies": "Real estate market absorption velocity, cement/steel material cost escalation, and monsoon delays.",
            "investor_participation": "Joint escrow account signing for plot registration sales proceeds, monthly aerial drone project milestone reports.",
            "evidence_and_next_steps": "Land title deeds and DTCP sanctions confirmed. Introduction ready for real estate debt/equity investors.",
        },
        traction_metrics=[
            {"label": "Project Size", "value": "18 Acres", "period": "142 Plots", "status": "VERIFIED"},
            {"label": "Phase 1 Sales", "value": "₹14.80 Cr", "period": "54 Plots Sold", "status": "VERIFIED"},
            {"label": "Plot Security", "value": "₹9.20 Cr", "period": "38 Escrow Plots", "status": "2.3x_COVERAGE"},
            {"label": "DTCP Approval", "value": "Approved", "period": "LP No. 44/2024", "status": "VERIFIED"},
        ],
        diligence_brief={
            "business_model": {"title": "Plotted Real Estate Township", "status": "VERIFIED", "description": "Low-capex high-velocity plotted land development avoiding heavy vertical construction risks."},
            "questions_for_founder": ["What is the timeline for releasing the mortgaged plots as Phase 2 sales progress?"],
        },
        custom_answers={"business_type": "REAL_ESTATE_LAND", "proposed_arrangement": "PROJECT_FINANCING"},
    )

    # -------------------------------------------------------------------------
    # Venture 7: The Malabar Coast Kitchen (Restaurant / F&B Expansion)
    # -------------------------------------------------------------------------
    v_restaurant = Venture(
        id="ven-malabar-01",
        founder_id=founder_restaurant.id,
        company_name="The Malabar Coast Kitchen",
        tag_line="High-repeat coastal Indian casual dining expanding from Indiranagar to Koramangala.",
        business_context=(
            "An authentic coastal seafood and Malabar regional dining concept operating successfully in Indiranagar, Bengaluru. "
            "Seeking ₹20 Lakhs working expansion capital through a structured 24-month revenue-linked loan to fit out a 70-seat second location in Koramangala."
        ),
        sector="Food & Beverage / Hospitality",
        location="Indiranagar, Bengaluru",
        stage="Operating & Cash-Flow Positive (4 Years)",
        capital_target=2000000.0,  # ₹20 Lakhs
        ticket_min=500000.0,
        ticket_max=2000000.0,
        currency="INR",
        capital_structures=["Revenue-Share Loan", "Term Debt", "Mezzanine Debt"],
        verification_status=VerificationStatus.PARTIALLY_VERIFIED,
        proposed_arrangement="LOAN",
        arrangement_details={
            "structure_name": "Revenue-Linked Expansion Loan",
            "offered_interest_rate": "16.5% per annum",
            "tenure_months": 24,
            "collateral_offered": "Pledge of commercial kitchen equipment (refrigeration, rational combi ovens) valued at ₹14 Lakhs.",
            "repayment_source": "Operating cash flow from Indiranagar parent outlet and dedicated POS collection sweep.",
            "equity_fallback": "Option to convert remaining principal into 4% equity stake if delayed past 24 months.",
        },
        operating_track_record={
            "declared_monthly_revenue": 320000.0,
            "declared_monthly_revenue_label": "Founder-Declared",
            "historical_annual_revenue": "₹38.5 Lakhs in FY24 (verified via GST returns)",
            "average_monthly_footfall": "3,400 covers / month with 4.4 rating on Zomato/Google",
        },
        growth_plan={
            "projected_monthly_revenue": 850000.0,
            "projections_label": "Founder Projection",
            "expansion_target": "70-seat Koramangala 5th Block outlet operational within 90 days",
        },
        due_diligence_findings={
            "operational_reality": {"status": "VERIFIED", "finding": "Indiranagar restaurant visited by platform reviewer. 48 covers active, kitchen operating cleanly with FSSAI license active."},
            "track_record": {"status": "PARTLY_VERIFIED", "finding": "GST filings confirm ₹3.2L average monthly turnover over trailing 12 months; internal POS logs match bank deposits."},
            "business_continuity": {"status": "SUPPORTED", "finding": "Long-term 5-year lease signed for Koramangala with fixed lock-in. Head chef holds 5% phantom equity."},
            "investor_compatibility": {"status": "SUPPORTED", "finding": "Founder prefers debt/revenue-share to avoid dilution. Willing to provide weekly digital sales audit exports."},
        },
        missing_information=[
            "Final contractor quotation for Koramangala acoustic and exhaust fit-out.",
            "Signed commercial lease agreement copy for second location.",
        ],
        venture_story={
            "venture_overview": "The Malabar Coast Kitchen is an established high-repeat casual dining brand in Indiranagar, Bengaluru, serving authentic coastal delicacies from Mangalore, Kerala, and Goa.",
            "current_position": "Operating with ₹3.2 Lakhs monthly turnover at 22% net operating margin with strong brand equity and 4.4/5 rating across 1,800+ reviews.",
            "opportunity": "Huge unmet demand in Koramangala for authentic non-vegetarian coastal dining without fine-dining markup.",
            "capital_requirement": "₹20.00 Lakhs expansion capital to fund outlet fit-out, commercial kitchen setup, and working capital buffer.",
            "use_of_capital": "Kitchen equipment and exhaust system (₹9 L), dining interior fit-out (₹6 L), initial lease deposit and permits (₹5 L).",
            "investment_proposal": "16.5% p.a. revenue-linked loan over 24 months with equipment mortgage charge and personal guarantee.",
            "execution_capability": "Promoter with 10 years hospitality management background supported by seasoned culinary team.",
            "risks_and_dependencies": "Staff attrition, food inflation, and local municipal health licensing renewals.",
            "investor_participation": "Monthly digital sales audit reports, priority reservations, and quarterly advisory meetings.",
            "evidence_and_next_steps": "FSSAI license and GST records checked. Introduction recommended for consumer and debt investors.",
        },
        traction_metrics=[
            {"label": "Monthly Sales", "value": "₹3.20 Lakhs", "period": "Trailing 12mo", "status": "VERIFIED"},
            {"label": "Projected Sales", "value": "₹8.50 Lakhs", "period": "2 Outlets", "status": "PROJECTION"},
            {"label": "Loan Target", "value": "₹20.00 Lakhs", "period": "24 Months", "status": "LOAN_PROPOSAL"},
            {"label": "Net Margin", "value": "22.0%", "period": "Indiranagar Unit", "status": "CHECKED_AGAINST_SOURCE"},
        ],
        diligence_brief={
            "business_model": {"title": "Casual Dining & Takeaway", "status": "VERIFIED", "description": "High table-turnover restaurant model with 35% delivery contribution through Swiggy/Zomato."},
            "questions_for_founder": ["What are the lease deposit refund terms if the Koramangala outlet faces zoning restrictions?"],
        },
        custom_answers={"business_type": "FOOD_HOSPITALITY", "proposed_arrangement": "LOAN"},
    )

    all_ventures = [
        v_film,
        v_shoe,
        v_debt,
        v_logistics,
        v_health,
        v_realestate,
        v_restaurant,
    ]
    for v in all_ventures:
        db.add(v)
    db.commit()

    # =========================================================================
    # 4. SEED INVESTOR MANDATES
    # =========================================================================
    man_rohan = InvestorMandate(
        id="man-compatible-01",
        investor_id=investor_rohan.id,
        firm_name="Varma Capital Partners",
        target_sectors=[
            "Manufacturing / Industrial",
            "Manufacturing / Consumer Brand",
            "Film / Entertainment",
            "Healthcare / Hospital",
            "Food & Beverage / Hospitality",
            "Logistics / Rural Delivery",
            "Real Estate / Land Development",
        ],
        target_stages=["Operating Business", "Expansion Phase", "Pre-Production / Casting Locked", "Established Hospital"],
        locations=["Bengaluru", "Hyderabad", "Noida", "Mysuru", "Peenya"],
        ticket_min=500000.0,     # ₹5 Lakhs (permits restaurant ₹20L)
        ticket_max=50000000.0,   # ₹5 Crores
        currency="INR",
        acceptable_structures=[
            "Secured Debt / Loan",
            "Fractional Equity Units",
            "Partial Buyout / Secondary",
            "Growth Equity with Rev-Share",
            "Revenue-Share Loan",
            "Project Development Financing",
            "Loan",
        ],
        thesis_summary=(
            "Deploying private credit, growth equity, and asset-backed capital into cash-flow positive consumer brands, "
            "precision manufacturing, fractional entertainment units, and healthcare infrastructure across high-growth Indian corridors."
        ),
        preferences={
            "min_collateral_cover_for_debt": "1.5x",
            "requires_audited_financials": True,
            "requires_registered_mortgage": True,
        },
        accepted_arrangements=[
            "SECURED_COLLATERAL_DEBT",
            "FRACTIONAL_EQUITY_UNITS",
            "PARTIAL_EQUITY_BUYOUT",
            "GROWTH_EQUITY_WITH_REV_SHARE",
            "LOAN",
            "EARLY_STAGE_EQUITY",
            "PROJECT_DEVELOPMENT_FINANCING",
        ],
        time_horizon="1_TO_3_YEARS",
        desired_involvement="ACTIVE_ADVISORY",
        willing_to_follow_up="MONTHLY_CHECK_IN",
        mandatory_sectors=[],
        mandatory_arrangements=[],
        flexible_preferences={"open_to_hybrid": True, "open_to_credits": True},
    )
    db.add(man_rohan)

    # Incompatible Tech Mandate (Siddharth Rao)
    man_siddharth = InvestorMandate(
        id="man-incompatible-02",
        investor_id=investor_siddharth.id,
        firm_name="TechAlpha Capital",
        target_sectors=["Technology / SaaS", "Artificial Intelligence"],
        target_stages=["Seed", "Pre-Series A"],
        locations=["Bengaluru", "Hyderabad", "San Francisco"],
        ticket_min=2000000.0,
        ticket_max=10000000.0,
        currency="INR",
        acceptable_structures=["Equity"],
        thesis_summary="Pure-play SaaS and deep-tech equity investments. No debt or brick-and-mortar.",
        preferences={"requires_tech_ip": True},
        accepted_arrangements=["EQUITY"],
        mandatory_sectors=["Technology / SaaS", "Artificial Intelligence"],
        mandatory_arrangements=["EQUITY"],
    )
    db.add(man_siddharth)

    # Conflict / Trade-off Mandate (Meera Nair - Hands off)
    man_meera = InvestorMandate(
        id="man-conflict-03",
        investor_id=investor_meera.id,
        firm_name="Nair Family Office",
        target_sectors=["Food & Beverage / Hospitality", "Retail", "Healthcare"],
        target_stages=["Operating Business"],
        locations=["Bengaluru", "Kochi"],
        ticket_min=500000.0,
        ticket_max=3000000.0,
        currency="INR",
        acceptable_structures=["Revenue-Share Loan", "Term Debt"],
        thesis_summary="Passive family office seeking high-yield debt without operational involvement.",
        preferences={},
        accepted_arrangements=["LOAN"],
        desired_involvement="HANDS_OFF",
        willing_to_follow_up="NO_FOLLOW_UP",
    )
    db.add(man_meera)
    db.commit()

    # =========================================================================
    # 5. GENERATE MATCH CASES FOR ROHAN VARMA AGAINST ALL VENTURES
    # =========================================================================
    for v in all_ventures:
        eval_res = evaluate_match(v, man_rohan)
        mc = MatchCase(
            id=f"mc-rohan-{v.id}",
            venture_id=v.id,
            mandate_id=man_rohan.id,
            venture_version=v.version,
            mandate_version=man_rohan.version or 1,
            outcome=eval_res["outcome"],
            compatibility_reasons=eval_res["compatibility_reasons"],
            mandatory_mismatches=eval_res["mandatory_mismatches"],
            trade_offs=eval_res["trade_offs"],
            missing_information=eval_res["missing_information"],
            rule_results=eval_res["rule_results"],
            review_stage=ReviewStage.APPROVED_FOR_FACILITATION,
        )
        db.add(mc)

    # Also explicit match case for test compatibility
    mc_malabar_compat = MatchCase(
        id="mc-malabar-compatible",
        venture_id=v_restaurant.id,
        mandate_id=man_rohan.id,
        venture_version=v_restaurant.version,
        mandate_version=1,
        outcome=MatchOutcome.POTENTIALLY_SUITABLE,
        compatibility_reasons=["Sector match: Food & Beverage", "Arrangement compatible: Loan / Debt", "Ticket overlap verified"],
        mandatory_mismatches=[],
        trade_offs=[],
        missing_information=[],
        rule_results=[],
        review_stage=ReviewStage.APPROVED_FOR_FACILITATION,
    )
    db.add(mc_malabar_compat)
    db.commit()

    # =========================================================================
    # 6. SEED CONNECTIONS & SAMPLE MESSAGES
    # =========================================================================
    conn_film = Connection(
        id="conn-rohan-film",
        venture_id=v_film.id,
        investor_id=investor_rohan.id,
        status=ConnectionStatus.CONNECTED,
        requested_by=UserRole.INVESTOR,
        investor_consent=True,
        founder_consent=True,
        reviewer_approved=True,
        request_note="Interested in 2 units (₹50 Lakhs) for Co-Producer credit tier. Would like to review OTT pre-sale LOI.",
        connected_at=datetime.now(timezone.utc) - timedelta(days=2),
    )
    db.add(conn_film)

    conn_debt = Connection(
        id="conn-rohan-debt",
        venture_id=v_debt.id,
        investor_id=investor_rohan.id,
        status=ConnectionStatus.CONNECTED,
        requested_by=UserRole.INVESTOR,
        investor_consent=True,
        founder_consent=True,
        reviewer_approved=True,
        request_note="Comfortable with ₹25L loan at 18% p.a. backed by 3 BHK flat. Ready to initiate legal title search.",
        connected_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db.add(conn_debt)

    conn_restaurant = Connection(
        id="conn-rohan-malabar-01",
        venture_id=v_restaurant.id,
        investor_id=investor_rohan.id,
        status=ConnectionStatus.CONNECTED,
        requested_by=UserRole.INVESTOR,
        investor_consent=True,
        founder_consent=True,
        reviewer_approved=True,
        request_note="Interested in supporting the Koramangala expansion.",
        connected_at=datetime.now(timezone.utc) - timedelta(days=3),
    )
    db.add(conn_restaurant)
    db.commit()

    # Messages for Restaurant
    m_rest_1 = Message(
        id="msg-rest-01",
        connection_id=conn_restaurant.id,
        sender_id=investor_rohan.id,
        recipient_id=founder_restaurant.id,
        content="Hello Arvind, reviewed your Koramangala expansion plan. Very impressed with the Indiranagar footfalls.",
        timestamp=datetime.now(timezone.utc) - timedelta(days=3),
        is_read=True,
    )
    m_rest_2 = Message(
        id="msg-rest-02",
        connection_id=conn_restaurant.id,
        sender_id=founder_restaurant.id,
        recipient_id=investor_rohan.id,
        content="Thank you Rohan! We are ready to break ground as soon as the equipment financing is finalized.",
        timestamp=datetime.now(timezone.utc) - timedelta(days=2),
        is_read=True,
    )
    m_rest_3 = Message(
        id="msg-rest-03",
        connection_id=conn_restaurant.id,
        sender_id=investor_rohan.id,
        recipient_id=founder_restaurant.id,
        content="Could we schedule a call for Thursday at 3 PM to align on the repayment schedule?",
        timestamp=datetime.now(timezone.utc) - timedelta(days=1),
        is_read=True,
    )
    db.add(m_rest_1)
    db.add(m_rest_2)
    db.add(m_rest_3)

    # Messages for Film
    m1 = Message(
        id="msg-film-01",
        connection_id=conn_film.id,
        sender_id=investor_rohan.id,
        recipient_id=founder_film.id,
        content="Hello Raghavendra, very intrigued by Garuda. I am considering a 2-unit commitment (₹50 Lakhs) under the Co-Producer tier. Could you share the recovery waterfall order?",
        timestamp=datetime.now(timezone.utc) - timedelta(days=2),
        is_read=True,
    )
    m2 = Message(
        id="msg-film-02",
        connection_id=conn_film.id,
        sender_id=founder_film.id,
        recipient_id=investor_rohan.id,
        content="Namaste Rohan garu! Thank you for connecting. Yes, 100% of OTT and satellite pre-sales flow directly to equity investors until full principal recoupment before any backend profit splits.",
        timestamp=datetime.now(timezone.utc) - timedelta(days=1, hours=20),
        is_read=True,
    )
    db.add(m1)
    db.add(m2)

    # Messages for Collateral Debt
    m3 = Message(
        id="msg-debt-01",
        connection_id=conn_debt.id,
        sender_id=investor_rohan.id,
        recipient_id=founder_debt.id,
        content="Hello Suresh, we reviewed the 3 BHK property valuation report (₹1.15 Cr) for the ₹25L precision machining loan. The 4.6x coverage is solid. What is your expected disbursement timeline?",
        timestamp=datetime.now(timezone.utc) - timedelta(days=1),
        is_read=True,
    )
    m4 = Message(
        id="msg-debt-02",
        connection_id=conn_debt.id,
        sender_id=founder_debt.id,
        recipient_id=investor_rohan.id,
        content="Thank you Mr. Varma. We need to release the titanium alloy billet PO to HAL by the 10th of next month. Original title deeds are ready for your advocate's verification.",
        timestamp=datetime.now(timezone.utc) - timedelta(hours=14),
        is_read=True,
    )
    db.add(m3)
    db.add(m4)

    # =========================================================================
    # 7. SEED ONBOARDING QUESTIONS
    # =========================================================================
    questions = [
        OnboardingQuestion(
            id="q-biz-type",
            section="BUSINESS_CLASSIFICATION",
            question_key="business_type",
            label="What type of business do you operate?",
            description="Select the closest operational category. This determines contextual due diligence requirements.",
            question_type="SELECT",
            options=[
                {"value": "FILM_ENTERTAINMENT", "label": "Film Production & Creative Media"},
                {"value": "MANUFACTURING_CONSUMER", "label": "Shoe & Consumer Brand Manufacturing"},
                {"value": "MANUFACTURING_DEBT", "label": "Precision / Industrial Manufacturing"},
                {"value": "LOGISTICS_RURAL", "label": "Hyperlocal / Rural & Tier-3 Logistics"},
                {"value": "HEALTHCARE_HOSPITAL", "label": "Hospital & Clinical Healthcare"},
                {"value": "REAL_ESTATE_LAND", "label": "Real Estate & Plotted Township Layout"},
                {"value": "FOOD_HOSPITALITY", "label": "Food, Beverage & Restaurant Expansion"},
                {"value": "OTHER", "label": "Other Business Category"},
            ],
            is_mandatory=True,
            order=1,
        ),
        OnboardingQuestion(
            id="q-funding-arr",
            section="FUNDING_ARRANGEMENT",
            question_key="proposed_arrangement",
            label="What funding arrangement are you proposing?",
            description="Independent of your sector, what financial consideration do you offer to capital providers?",
            question_type="SELECT",
            options=[
                {"value": "SECURED_COLLATERAL_DEBT", "label": "Secured Debt / Loan (Backed by Property or Equipment Collateral)"},
                {"value": "FRACTIONAL_EQUITY_UNITS", "label": "Fractional Equity Units (With Screen Credits & Recovery Waterfall)"},
                {"value": "GROWTH_EQUITY_WITH_REV_SHARE", "label": "Growth Equity + Celebrity / Brand Revenue-Share Hybrid"},
                {"value": "PARTIAL_EQUITY_BUYOUT", "label": "Partial Ownership Acquisition / Secondary Buyout"},
                {"value": "PROJECT_DEVELOPMENT_FINANCING", "label": "Project Development Financing / Mezzanine with Plot Escrow"},
                {"value": "LOAN", "label": "Revenue-Linked Term Loan / Working Capital Debt"},
                {"value": "NEED_GUIDANCE", "label": "Other / Help Me Structure My Arrangement"},
            ],
            is_mandatory=True,
            order=2,
        ),
    ]
    for q in questions:
        db.add(q)
    db.commit()
    print("Database seeded with 7 authentic ventures, dedicated founder accounts, and multi-asset investor mandate.")
