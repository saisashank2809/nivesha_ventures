# Nivesha Ventures Platform

An independent capital-facilitation and due diligence platform connecting founders and investors.

---

## Architecture Overview

```text
nivesha-platform/
  frontend/               # React + Vite + TypeScript (Editorial Warm Ivory & Navy Aesthetic)
    src/
      features/
        landing/          # Platform overview and due diligence framework
        investor/         # InvestorGuidedDiscovery.tsx (Preference cards, curated matches, 6 risk categories)
        founder/          # FounderGuidedJourney.tsx (Step-by-step card branching, story generation)
        platform/         # PlatformReviewView.tsx (Match cases, appointment desk, assumptions)
      components/
        Navbar.tsx        # Top navigation with persona switcher (Investor, Founder, Reviewer)
        LoginModal.tsx    # Email/password authentication & 1-click persona logins
        VentureCard.tsx   # Verified venture cards with declared vs. projected traction
        VentureDetailModal.tsx # Full venture story & due diligence deep-dive
        DirectChatView.tsx     # 1-on-1 direct messaging (unlocked after mutual consent)
        ChatbotWidget.tsx      # Floating role-aware AI Assistant
      shared/             # API client, TypeScript types, INR formatters
  backend/                # FastAPI + SQLAlchemy + SQLite
    app/
      api/                # Modular REST endpoints (auth, ventures, mandates, matches, appointments, config)
      core/               # Centralized configuration (working baseline ₹10L, commercial terms)
      models/             # Three core objects (Venture, InvestorMandate, MatchCase) + AppointmentRequest
      schemas/            # Pydantic v2 validation contracts
      services/           # Deterministic 7-point matching service
      seed/               # Coherent restaurant demo & 3 test matching scenarios
      main.py             # FastAPI entrypoint with CORS & SQLite initialization
    tests/                # Automated pytest suite (6 passing integration tests)
```

---

## Core Product Boundaries & Assumptions

1. **Facilitation & Mediation Only:**
   - Nivesha Ventures facilitates introductions, verifies evidence, and coordinates appointments.
   - The platform **never** collects, holds, or disburses investment funds (no wallets, escrow, or payment transfers).
2. **Centralized Branding & Configurable Deal Baseline:**
   - Centralized working name: **Nivesha Ventures**.
   - Working opportunity baseline: **₹10 Lakh** minimum total capital requirement (not forced onto individual investor check sizes).
   - Commercial facilitation fees: **"To be confirmed"** (no invented percentage commissions).
   - Legal services: Represented as facilitation statuses and milestones, not executed legal advice.

---

## Coherent Demonstration Case: The Malabar Coast Kitchen

The entire platform is demonstrated through one coherent synthetic food business:

- **The Business:** *The Malabar Coast Kitchen* (Indiranagar, Bengaluru).
- **Capital Request:** **₹20 Lakh** to launch a 50-seat second outlet in Koramangala.
- **Proposed Arrangement:** **14% p.a. Term Loan / Revenue Share** with physical kitchen line equipment collateral (est. ₹12L liquidation value) and equity fallback.
- **Declared Performance vs. Projections:**
  - *Founder-Declared:* ₹3.2 Lakh/mo historical revenue (checked against 12 months GSTR-3B filings and POS settlement logs).
  - *Founder Projection:* ₹8.5 Lakh/mo target turnover across both outlets.
- **Unverified Gaps / Missing Information:**
  - Koramangala commercial lease deed is draft term sheet; final execution pending capital.
  - Kitchen fit-out quotation is contractor estimate; formal competitive tender pending.
- **6 Due Diligence Categories Evaluated:**
  1. *Operational Reality:* Scaling expenses and management overhead for 80-ft road.
  2. *Track Record:* 12 months GSTR-3B filings reconciled with Razorpay bank statements.
  3. *Market Viability:* 4.4/5 rating on Zomato across 3,400+ customer reviews.
  4. *Offered Security:* Commercial kitchen equipment pledged; specialist review pending.
  5. *Business Continuity:* Kitchen operating SOPs and sous-chef retention incentives documented.
  6. *Investor Compatibility:* High operational monitoring burden; conflicts with passive hands-off investors.

---

## Three Test Matching Scenarios

The shared backend matching engine evaluates the restaurant against 3 distinct investor profiles:

| Investor Persona | Mandate Focus | Rule Evaluation Result | Output Reason |
|---|---|---|---|
| **Rohan Varma** (`investor@peakindia.vc`) | F&B / Retail, Debt & Revenue-share, Monthly Reviews | **`POTENTIALLY_SUITABLE`** | Alignment in sector, ticket range (₹5L–₹20L), arrangement, and monthly operational follow-up. |
| **Siddharth Rao** (`siddharth@cloudscale.vc`) | Enterprise SaaS, Equity-only, ₹50L+ checks | **`UNSUITABLE`** | Mandatory sector dealbreaker and equity-only structure conflict. |
| **Meera Nair** (`meera@passiveyield.in`) | F&B / Debt, ₹10L–₹25L, **Zero Follow-up / Passive** | **`POTENTIALLY_SUITABLE` with Trade-Off** | Ticket matches, but surfaces explicit concern: *"Investor prefers passive engagement, but venture requires monthly operational monitoring."* |

---

## Quick Start & Verification

### 1. Start the Backend
```powershell
cd "nivesha-platform\backend"
python -m uvicorn app.main:app --reload --port 8000
```
- API Documentation: `http://localhost:8000/docs`
- Run integration tests: `python -m pytest` (6 tests passing).

### 2. Start the Frontend
```powershell
cd "nivesha-platform\frontend"
npm run dev
```
- Web Application: `http://localhost:5173`

---

## Pre-Configured Demo Accounts

Use the **SWITCH** menu in the top navigation bar to toggle between personas instantly:

| Persona | Role | Entity / Focus | Credentials |
|---|---|---|---|
| **Investor** | `INVESTOR` | Rohan Varma (Peak India Growth Syndicate) | `investor@peakindia.vc` / `password123` |
| **Founder** | `FOUNDER` | Arvind Nair (The Malabar Coast Kitchen) | `founder@malabarcoast.in` / `password123` |
| **Reviewer** | `REVIEWER` | Platform Review Desk (Due Diligence Lead) | `reviewer@nivesha.in` / `password123` |

---

## Guided Demonstration Steps

1. **Founder Journey:**
   - Switch persona to **Founder**.
   - Navigate to **Founder Story Builder**.
   - Walk through the 7 guided card-based decision steps (Objective $\rightarrow$ Funding Arrangement $\rightarrow$ Track Record $\rightarrow$ Capital Purpose $\rightarrow$ Missing Gaps $\rightarrow$ Story Assembly $\rightarrow$ Review & Save).
   - Save the record to publish to the shared platform database.
2. **Investor Discovery:**
   - Switch persona to **Investor**.
   - Navigate to **Investor Discovery**.
   - Adjust accepted arrangements, involvement, and check sizes to watch matching explanations and trade-offs adjust in real time.
   - Click **"Inspect 6 Due Diligence Categories"** to review operational reality, collateral, and continuity findings.
   - Click **"Interested / Set Up Appointment"** to register a simulated appointment request.
3. **Platform Review Workspace:**
   - Switch persona to **Reviewer**.
   - Navigate to **Review Desk**.
   - Inspect all evaluated match cases, trade-off notes, and advance review stages (`AWAITING_REVIEW` $\rightarrow$ `APPROVED_FOR_FACILITATION`).
   - Confirm appointment requests (`CONFIRMED_SIMULATED`).
4. **Direct Messaging:**
   - When both parties are connected with mutual consent, open the **Direct Chat** tab to message in real time with deal context pinned above the thread.
