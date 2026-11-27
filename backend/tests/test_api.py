import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.database import Base, get_db
from app.main import app
from app.seed.seed_data import seed_database

# In-memory test SQLite
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


def get_auth_token(email: str = "investor@peakindia.vc", password: str = "password123") -> str:
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return resp.json()["access_token"]


def test_platform_config():
    """Verify centralized branding and ₹10 Lakh working assumption."""
    resp = client.get("/api/config")
    assert resp.status_code == 200
    data = resp.json()
    assert data["platform_name"] == "Nivesha Ventures"
    assert data["min_opportunity_amount"] == 1000000.0
    assert "To be confirmed" in data["commercial_fee_status"]


def test_auth_login_and_me():
    """Verify investor login returns JWT token and user profile."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "investor@peakindia.vc", "password": "password123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["full_name"] == "Rohan Varma"
    assert data["user"]["role"] == "INVESTOR"

    # Test me endpoint with authentic token
    token = data["access_token"]
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "investor@peakindia.vc"


def test_unauthenticated_access_denied():
    """Verify protected endpoints reject requests without a valid Bearer token."""
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_restaurant_venture_detail_and_story():
    """Verify primary coherent restaurant venture has declared track record, projections, and due diligence."""
    token = get_auth_token("investor@peakindia.vc")
    resp = client.get(
        "/api/ventures/ven-malabar-01",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["company_name"] == "The Malabar Coast Kitchen"
    assert detail["capital_target"] == 2000000.0
    assert detail["proposed_arrangement"] == "LOAN"

    # Check operating track record (declared) vs growth plan (projections)
    track_record = detail["operating_track_record"]
    assert track_record["declared_monthly_revenue"] == 320000.0
    assert track_record["declared_monthly_revenue_label"] == "Founder-Declared"

    growth = detail["growth_plan"]
    assert growth["projected_monthly_revenue"] == 850000.0
    assert growth["projections_label"] == "Founder Projection"

    # Check 6 due diligence categories
    findings = detail["due_diligence_findings"]
    assert "operational_reality" in findings
    assert "track_record" in findings
    assert "business_continuity" in findings
    assert "investor_compatibility" in findings


def test_matching_scenarios_for_restaurant():
    """Verify the 3 test matching scenarios:
    1. Rohan Varma (F&B / Debt) -> POTENTIALLY_SUITABLE
    2. Siddharth Rao (Tech / Equity) -> UNSUITABLE
    3. Meera Nair (Hands-off) -> POTENTIALLY_SUITABLE with explicit Trade-Off
    """
    reviewer_token = get_auth_token("reviewer@nivesha.in")

    # 1. Compatible match run
    r1 = client.post(
        "/api/matches/run",
        json={"venture_id": "ven-malabar-01", "mandate_id": "man-compatible-01"},
        headers={"Authorization": f"Bearer {reviewer_token}"},
    )
    assert r1.status_code == 200
    c1 = r1.json()
    assert c1["outcome"] == "POTENTIALLY_SUITABLE"
    assert len(c1["compatibility_reasons"]) > 0

    # 2. Incompatible match run
    r2 = client.post(
        "/api/matches/run",
        json={"venture_id": "ven-malabar-01", "mandate_id": "man-incompatible-02"},
        headers={"Authorization": f"Bearer {reviewer_token}"},
    )
    assert r2.status_code == 200
    c2 = r2.json()
    assert c2["outcome"] == "UNSUITABLE"
    assert len(c2["mandatory_mismatches"]) > 0
    assert any("sector" in m.lower() or "arrangement" in m.lower() for m in c2["mandatory_mismatches"])

    # 3. Preference-conflict match run (Hands-off investor)
    r3 = client.post(
        "/api/matches/run",
        json={"venture_id": "ven-malabar-01", "mandate_id": "man-conflict-03"},
        headers={"Authorization": f"Bearer {reviewer_token}"},
    )
    assert r3.status_code == 200
    c3 = r3.json()
    assert c3["outcome"] == "POTENTIALLY_SUITABLE"
    assert len(c3["trade_offs"]) > 0
    assert any("involvement" in t.lower() or "follow-up" in t.lower() for t in c3["trade_offs"])


def test_appointment_request_and_review():
    """Verify creating an appointment request preserves identities, meeting purpose, and scope."""
    investor_token = get_auth_token("investor@peakindia.vc")
    reviewer_token = get_auth_token("reviewer@nivesha.in")

    resp = client.post(
        "/api/appointments",
        json={
            "venture_id": "ven-malabar-01",
            "match_case_id": "mc-malabar-compatible",
            "meeting_purpose": "Review Koramangala expansion unit economics and equipment pledge schedule",
            "sharing_scope": "Declared sales breakdown and contractor quotation",
            "preferred_times": ["Thursday 3:00 PM IST", "Friday 11:00 AM IST"],
        },
        headers={"Authorization": f"Bearer {investor_token}"},
    )
    assert resp.status_code == 200
    appt = resp.json()
    assert appt["venture_name"] == "The Malabar Coast Kitchen"
    assert appt["status"] == "REQUESTED"
    assert "Review Koramangala" in appt["meeting_purpose"]

    # Verify review stage updated on linked match case
    mc_resp = client.get(
        "/api/matches/mc-malabar-compatible",
        headers={"Authorization": f"Bearer {reviewer_token}"},
    )
    assert mc_resp.status_code == 200
    assert mc_resp.json()["review_stage"] == "APPOINTMENT_REQUESTED"


def test_direct_messaging_unlocked_when_connected():
    """Verify connected parties can chat 1-on-1 through web interface."""
    conn_id = "conn-rohan-malabar-01"
    investor_token = get_auth_token("investor@peakindia.vc")
    founder_token = get_auth_token("founder@malabarcoast.in")

    # 1. Fetch initial message history
    msgs_resp = client.get(
        f"/api/connections/{conn_id}/messages",
        headers={"Authorization": f"Bearer {investor_token}"},
    )
    assert msgs_resp.status_code == 200
    msgs = msgs_resp.json()
    assert len(msgs) >= 3

    # 2. Founder replies
    send_resp = client.post(
        f"/api/connections/{conn_id}/messages",
        json={"content": "Thursday at 3 PM works perfectly for me. Looking forward to our discussion!"},
        headers={"Authorization": f"Bearer {founder_token}"},
    )
    assert send_resp.status_code == 201
    new_msg = send_resp.json()
    assert new_msg["sender_name"] == "Arvind Nair"
    assert "Thursday at 3 PM" in new_msg["content"]


def test_v1_onboarding_questions_and_ai_copilot():
    """Verify 12 V1 click-first questions, AI guardrails (<₹10L, over-offering, scaling), and profile persistence."""
    founder_token = get_auth_token("founder@malabarcoast.in")

    # 1. Fetch 12 V1 essential questions
    q_resp = client.get("/api/onboarding/questions?v1_only=true&stage=founder_discovery")
    assert q_resp.status_code == 200
    questions = q_resp.json()
    assert len(questions) == 12
    assert all(q["is_v1_essential"] is True for q in questions)

    # 2. Analyze with < ₹10L + Secured Collateral @ 18% + New Location Setup
    analyze_resp = client.post(
        "/api/onboarding/analyze",
        json={
            "answers": {
                "role_archetype": "Business owner",
                "experience_years": "6-10 yrs",
                "core_expertise": ["Operations", "Finance"],
                "continuity_backup_plan": "No backup yet",
                "three_year_goal": "Scale capacity",
                "biggest_bottleneck": "Insufficient capital",
                "capital_target": 500000,
                "capital_use": ["New Location Setup"],
                "proposed_arrangement": "Secured Loan",
                "collateral_type": "Clean-Title Land",
                "offered_return_rate": 18,
                "investor_involvement_pref": "Silent Financial Partner",
                "update_cadence": "Quarterly",
            }
        },
        headers={"Authorization": f"Bearer {founder_token}"},
    )
    assert analyze_resp.status_code == 200
    analysis = analyze_resp.json()
    assert analysis["ticket_guardrail"]["triggered"] is True
    assert any("12–14%" in tip for tip in analysis["value_discovery_tips"])
    assert len(analysis["reality_check_chips"]) >= 2
    assert any("Continuity risk" in c for c in analysis["detected_conflicts"])

    # 3. Submit onboarding and verify founder_profile persistence
    submit_resp = client.post(
        "/api/onboarding/submit",
        json={
            "answers": {
                "role_archetype": "Business owner",
                "experience_years": "6-10 yrs",
                "core_expertise": ["Operations"],
                "continuity_backup_plan": "Trained Manager",
                "three_year_goal": "Scale capacity",
                "biggest_bottleneck": "Insufficient capital",
                "capital_target": 2500000,
                "capital_use": ["Machinery/Equipment"],
                "proposed_arrangement": "Secured Loan",
                "collateral_type": "Clean-Title Land",
                "offered_return_rate": 14,
                "investor_involvement_pref": "Silent Financial Partner",
                "update_cadence": "Quarterly",
            }
        },
        headers={"Authorization": f"Bearer {founder_token}"},
    )
    assert submit_resp.status_code == 200
    assert submit_resp.json()["status"] == "SUCCESS"

    profile_resp = client.get(
        "/api/onboarding/founder-profile",
        headers={"Authorization": f"Bearer {founder_token}"},
    )
    assert profile_resp.status_code == 200
    profile = profile_resp.json()
    assert profile["role_archetype"] == "Business owner"
    assert profile["continuity_backup_plan"] == "Trained Manager"

    # 4. Update Founder Profile via PATCH and verify identity + discovery updates
    patch_resp = client.patch(
        "/api/onboarding/founder-profile",
        json={
            "full_name": "Arvind Nair Updated",
            "title": "Managing Founder",
            "bio": "10+ years scaling coastal hospitality.",
            "three_year_goal": "Expand to new cities",
            "core_expertise": ["Operations", "Finance"],
        },
        headers={"Authorization": f"Bearer {founder_token}"},
    )
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["full_name"] == "Arvind Nair Updated"
    assert updated["title"] == "Managing Founder"
    assert updated["three_year_goal"] == "Expand to new cities"
    assert updated["core_expertise"] == ["Operations", "Finance"]


def test_investor_onboarding_and_profile_flow():
    """Verify 15 investor discovery questions, AI natural-language/conflict analysis, mandate confirmation, and profile edit."""
    investor_token = get_auth_token("investor@peakindia.vc")
    founder_token = get_auth_token("founder@malabarcoast.in")

    # 1. Fetch 15 investor discovery questions
    q_resp = client.get("/api/onboarding/questions?v1_only=true&stage=investor_discovery")
    assert q_resp.status_code == 200
    questions = q_resp.json()
    assert len(questions) == 15

    # 2. Analyze natural language + conflicting answers
    analyze_resp = client.post(
        "/api/mandates/onboarding/analyze",
        json={
            "natural_language_note": "I have ₹1 crore available for profitable manufacturing companies, no daily ops.",
            "answers": {
                "investor_type": "Angel investor",
                "experience_level": "Beginner",
                "primary_objective": "Regular income",
                "risk_tolerance_level": "Prefer capital preservation",
                "accepted_arrangements": ["EQUITY"],
                "target_stages": ["Pre-Revenue / Idea"],
            },
        },
    )
    assert analyze_resp.status_code == 200
    analysis = analyze_resp.json()
    assert analysis["extracted_preferences"]["ticket_max"] == 10000000.0
    assert "Manufacturing" in analysis["extracted_preferences"]["target_sectors"]
    assert len(analysis["detected_conflicts"]) >= 2
    assert len(analysis["terminology_notes"]) >= 2
    assert "suitability_disclaimer" in analysis

    # 3. Submit confirmed mandate & investor profile
    submit_resp = client.post(
        "/api/mandates/onboarding/submit",
        json={
            "answers": {
                "investor_type": "Family office",
                "investing_capacity_type": "Organization",
                "professional_background": ["Manufacturing", "Finance"],
                "past_private_investments": "Yes",
                "experience_level": "Experienced",
                "prior_structures_used": ["Debt", "Revenue sharing"],
                "evaluation_priorities": ["Financial performance", "Asset security"],
                "primary_objective": "Regular income",
                "time_horizon": "1_TO_3_YEARS",
                "desired_involvement": "MONTHLY_ADVISORY",
                "ticket_min": 1000000,
                "ticket_max": 5000000,
                "risk_tolerance_level": "Can tolerate some loss",
                "accepted_arrangements": ["LOAN", "SECURED_COLLATERAL_DEBT"],
                "target_sectors": ["Food & Beverage", "Manufacturing"],
                "target_stages": ["Established", "Growing / Expansion"],
                "locations": ["Bengaluru", "India"],
                "expected_evidence": ["Financial records", "Asset information"],
            },
            "confirmed_mandate": {
                "mandatory_sectors": ["Food & Beverage"],
                "mandatory_arrangements": ["LOAN"],
                "target_sectors": ["Food & Beverage", "Manufacturing"],
                "accepted_arrangements": ["LOAN", "SECURED_COLLATERAL_DEBT"],
                "ticket_min": 1000000,
                "ticket_max": 5000000,
                "locations": ["Bengaluru", "India"],
            },
        },
        headers={"Authorization": f"Bearer {investor_token}"},
    )
    assert submit_resp.status_code == 200
    sub_data = submit_resp.json()
    assert sub_data["investor_profile"]["onboarding_completed"] is True
    assert sub_data["mandate"]["mandatory_sectors"] == ["Food & Beverage"]

    # 4. Verify 7-point Matching Engine still works with updated mandate
    match_resp = client.post(
        "/api/matches/run",
        json={"venture_id": "ven-malabar-01"},
        headers={"Authorization": f"Bearer {investor_token}"},
    )
    assert match_resp.status_code == 200
    assert match_resp.json()["outcome"] == "POTENTIALLY_SUITABLE"

    # 5. Update investor profile & verify founder cannot access investor profile (403)
    patch_resp = client.patch(
        "/api/mandates/investor-profile",
        json={"title": "Managing Partner", "primary_objective": "Portfolio diversification"},
        headers={"Authorization": f"Bearer {investor_token}"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["primary_objective"] == "Portfolio diversification"

    forbidden_resp = client.get(
        "/api/mandates/investor-profile",
        headers={"Authorization": f"Bearer {founder_token}"},
    )
    assert forbidden_resp.status_code == 403


def test_recommended_matches_ranking():
    """Verify conservative collateral investor onboarding ranks secured debt above high-risk equity."""
    investor_token = get_auth_token("investor@peakindia.vc")

    submit_resp = client.post(
        "/api/mandates/onboarding/submit",
        json={
            "answers": {
                "investor_type": "Family office",
                "investing_capacity_type": "Organization",
                "primary_objective": "Regular income",
                "risk_tolerance_level": "Prefer capital preservation",
                "expected_evidence": ["Asset information", "Financial records"],
                "accepted_arrangements": ["SECURED_COLLATERAL_DEBT", "LOAN"],
                "target_sectors": ["Industrial Manufacturing", "Food & Beverage"],
                "target_stages": ["Established", "Growing / Expansion"],
                "locations": ["Bengaluru", "India"],
                "ticket_min": 1000000,
                "ticket_max": 3000000,
            },
            "confirmed_mandate": {
                "accepted_arrangements": ["SECURED_COLLATERAL_DEBT", "LOAN"],
                "mandatory_arrangements": ["SECURED_COLLATERAL_DEBT", "LOAN"],
                "target_sectors": ["Industrial Manufacturing", "Food & Beverage"],
                "ticket_min": 1000000,
                "ticket_max": 3000000,
                "locations": ["Bengaluru", "India"],
            },
        },
        headers={"Authorization": f"Bearer {investor_token}"},
    )
    assert submit_resp.status_code == 200

    rec_resp = client.get(
        "/api/matches/recommended",
        headers={"Authorization": f"Bearer {investor_token}"},
    )
    assert rec_resp.status_code == 200
    recs = rec_resp.json()
    assert len(recs) >= 1
    assert recs[0]["match_score"] > 50
    assert recs[0]["proposed_arrangement"] in ("SECURED_COLLATERAL_DEBT", "LOAN")
    assert len(recs[0]["recommendation_reasons"]) >= 1
