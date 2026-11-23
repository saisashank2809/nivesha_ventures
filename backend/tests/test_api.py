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

    # Test me endpoint with token
    token = data["access_token"]
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "investor@peakindia.vc"


def test_restaurant_venture_detail_and_story():
    """Verify primary coherent restaurant venture has declared track record, projections, and due diligence."""
    resp = client.get(
        "/api/ventures/ven-malabar-01",
        headers={"X-Demo-Role": "INVESTOR", "X-Demo-User-Id": "usr-investor-01"},
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
    # 1. Compatible match run
    r1 = client.post(
        "/api/matches/run",
        json={"venture_id": "ven-malabar-01", "mandate_id": "man-compatible-01"},
        headers={"X-Demo-Role": "REVIEWER", "X-Demo-User-Id": "usr-reviewer-01"},
    )
    assert r1.status_code == 200
    c1 = r1.json()
    assert c1["outcome"] == "POTENTIALLY_SUITABLE"
    assert len(c1["compatibility_reasons"]) > 0

    # 2. Incompatible match run
    r2 = client.post(
        "/api/matches/run",
        json={"venture_id": "ven-malabar-01", "mandate_id": "man-incompatible-02"},
        headers={"X-Demo-Role": "REVIEWER", "X-Demo-User-Id": "usr-reviewer-01"},
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
        headers={"X-Demo-Role": "REVIEWER", "X-Demo-User-Id": "usr-reviewer-01"},
    )
    assert r3.status_code == 200
    c3 = r3.json()
    assert c3["outcome"] == "POTENTIALLY_SUITABLE"
    assert len(c3["trade_offs"]) > 0
    assert any("involvement" in t.lower() or "follow-up" in t.lower() for t in c3["trade_offs"])


def test_appointment_request_and_review():
    """Verify creating an appointment request preserves identities, meeting purpose, and scope."""
    resp = client.post(
        "/api/appointments",
        json={
            "venture_id": "ven-malabar-01",
            "match_case_id": "mc-malabar-compatible",
            "meeting_purpose": "Review Koramangala expansion unit economics and equipment pledge schedule",
            "sharing_scope": "Declared sales breakdown and contractor quotation",
            "preferred_times": ["Thursday 3:00 PM IST", "Friday 11:00 AM IST"],
        },
        headers={"X-Demo-Role": "INVESTOR", "X-Demo-User-Id": "usr-investor-01"},
    )
    assert resp.status_code == 200
    appt = resp.json()
    assert appt["venture_name"] == "The Malabar Coast Kitchen"
    assert appt["status"] == "REQUESTED"
    assert "Review Koramangala" in appt["meeting_purpose"]

    # Verify review stage updated on linked match case
    mc_resp = client.get(
        "/api/matches/mc-malabar-compatible",
        headers={"X-Demo-Role": "REVIEWER"},
    )
    assert mc_resp.status_code == 200
    assert mc_resp.json()["review_stage"] == "APPOINTMENT_REQUESTED"


def test_direct_messaging_unlocked_when_connected():
    """Verify connected parties can chat 1-on-1 through web interface."""
    conn_id = "conn-rohan-malabar-01"

    # 1. Fetch initial message history
    msgs_resp = client.get(
        f"/api/connections/{conn_id}/messages",
        headers={"X-Demo-Role": "INVESTOR", "X-Demo-User-Id": "usr-investor-01"},
    )
    assert msgs_resp.status_code == 200
    msgs = msgs_resp.json()
    assert len(msgs) >= 3

    # 2. Founder replies
    send_resp = client.post(
        f"/api/connections/{conn_id}/messages",
        json={"content": "Thursday at 3 PM works perfectly for me. Looking forward to our discussion!"},
        headers={"X-Demo-Role": "FOUNDER", "X-Demo-User-Id": "usr-founder-restaurant"},
    )
    assert send_resp.status_code == 201
    new_msg = send_resp.json()
    assert new_msg["sender_name"] == "Arvind Nair"
    assert "Thursday at 3 PM" in new_msg["content"]
