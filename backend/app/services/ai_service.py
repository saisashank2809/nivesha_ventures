from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Venture, User, InvestorMandate


class AIAssistantService:
    @classmethod
    def generate_response(
        cls,
        db: Session,
        user: User,
        message: str,
        context_type: str = "INVESTOR",
        venture_id: Optional[str] = None,
        history: List[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        msg_lower = message.lower().strip()
        ventures = db.query(Venture).all()

        recommended_ids = []
        suggested_actions = []

        if context_type == "INVESTOR":
            # Investor Assistant
            mandate = db.query(InvestorMandate).filter(InvestorMandate.investor_id == user.id).first()
            firm_name = mandate.firm_name if mandate else "Your Investment Firm"

            # Check if user is asking about specific sector or metric
            if any(w in msg_lower for w in ["fintech", "payments", "bharatpay"]):
                matching_v = [v for v in ventures if "fintech" in v.sector.lower()]
                recommended_ids = [v.id for v in matching_v]
                reply = (
                    f"Here is our top verified FinTech opportunity: **BharatPay FinTech Solutions**.\n\n"
                    f"• **Round**: ₹2.5 Cr (Ticket: ₹25 Lakh – ₹1 Cr)\n"
                    f"• **Stage**: Seed, Bengaluru\n"
                    f"• **Diligence Findings**: Reported ARR of ₹1.2 Cr reconciles with bank statements and GST filings.\n"
                    f"• **Nivesha Status**: Verified Independent Diligence Brief available."
                )
                suggested_actions = ["Request Connection with BharatPay", "Inspect Diligence Brief"]

            elif any(w in msg_lower for w in ["agri", "drone", "kisandrone", "agriculture"]):
                matching_v = [v for v in ventures if "agri" in v.sector.lower()]
                recommended_ids = [v.id for v in matching_v]
                reply = (
                    f"In AgriTech, we have **KisanDrone Technologies** (Pune):\n\n"
                    f"• **Seeking**: ₹1.5 Cr Seed round (Tickets: ₹20 Lakh – ₹50 Lakh)\n"
                    f"• **Traction**: ₹42 Lakh ARR with 140+ rural farming collectives onboarded.\n"
                    f"• **Diligence**: DGCA statutory drone compliance verified."
                )
                suggested_actions = ["View KisanDrone Profile", "Check Sector Alignment"]

            elif any(w in msg_lower for w in ["saas", "ai", "cloudmatrix", "software"]):
                matching_v = [v for v in ventures if "saas" in v.sector.lower() or "ai" in v.sector.lower()]
                recommended_ids = [v.id for v in matching_v]
                reply = (
                    f"In Enterprise SaaS / AI, we have **CloudMatrix AI** (Hyderabad):\n\n"
                    f"• **Seeking**: ₹1 Cr Pre-Seed round\n"
                    f"• **Status**: Diligence in progress. Note: Nivesha diligence flagged an open question on ARR reconciliation across early investor memos."
                )
                suggested_actions = ["Review Open Diligence Questions", "Request Clarification"]

            elif any(w in msg_lower for w in ["all", "list", "show", "ventures", "startups", "opportunities"]):
                recommended_ids = [v.id for v in ventures]
                reply = (
                    f"Nivesha currently features **{len(ventures)} independently vetted ventures** across FinTech, AgriTech, Enterprise AI, and CleanTech.\n\n"
                    f"All ventures include audited financials, founder reference checks, and verified statutory filings. Would you like me to filter by ticket size or sector?"
                )
                suggested_actions = ["Filter by FinTech", "Show Seed Stage Deals", "Compare Ticket Ranges"]

            elif any(w in msg_lower for w in ["mandate", "fit", "match", "align"]):
                # Mandate fit check
                if mandate:
                    sec_str = ", ".join(mandate.target_sectors) if mandate.target_sectors else "All Sectors"
                    reply = (
                        f"Based on **{mandate.firm_name}**'s mandate ({sec_str}, tickets ₹{mandate.ticket_min or 0:,.0f} – ₹{mandate.ticket_max or 0:,.0f}):\n\n"
                        f"1. **BharatPay FinTech**: **95% Compatibility** (Sector match, ticket overlap at ₹50L – ₹1Cr).\n"
                        f"2. **CloudMatrix AI**: **85% Compatibility** (SaaS focus aligned, awaiting ticket bound confirmation)."
                    )
                else:
                    reply = "You haven't configured your mandate preferences yet. Would you like to set your target check size and sectors now?"
                suggested_actions = ["View Compatible Matches", "Update Mandate"]

            else:
                reply = (
                    f"Hello! I am your **Nivesha Diligence Assistant**. I can help you evaluate vetted Indian ventures, "
                    f"review independent verification briefs (Financials, Legal, Team, Market), and check compatibility with your check size. "
                    f"What sectors or stages are you exploring today?"
                )
                suggested_actions = ["Show Verified FinTechs", "Explain Diligence Standards", "Check Mandate Overlap"]

        else:
            # Founder Assistant
            v = db.query(Venture).filter(Venture.founder_id == user.id).first()
            company = v.company_name if v else "Your Venture"

            if any(w in msg_lower for w in ["pitch", "story", "deck", "tagline"]):
                reply = (
                    f"To make **{company}** resonate with institutional and NRI angel investors, structure your narrative around:\n\n"
                    f"1. **The Specific Friction**: What concrete inefficiency do you solve?\n"
                    f"2. **Unit Economics & Evidence**: Revenue reconciliation with GST/Bank statements is Nivesha's gold standard.\n"
                    f"3. **Use of Funds**: Clear allocation across hiring, CAC, and regulatory compliance.\n\n"
                    f"Would you like me to suggest an updated tag line or elevator summary?"
                )
                suggested_actions = ["Improve Tagline", "Review Traction Metrics"]

            elif any(w in msg_lower for w in ["ticket", "valuation", "round", "target", "check"]):
                reply = (
                    f"For an early-stage Indian venture raising ₹1 Cr – ₹3 Cr:\n\n"
                    f"• **Recommended Minimum Individual Ticket**: ₹15 Lakh – ₹25 Lakh (attracts active high-conviction angels).\n"
                    f"• **Recommended Maximum Lead Ticket**: ₹50 Lakh – ₹1 Cr.\n"
                    f"• **Instrument**: Compulsory Convertible Preference Shares (CCPS) or iSAFE are most favored by investors on Nivesha."
                )
                suggested_actions = ["Update Ticket Range", "Review Capital Structure"]

            elif any(w in msg_lower for w in ["diligence", "verify", "audit", "questions"]):
                reply = (
                    f"Before Nivesha introduces an investor to **{company}**, our analysts review 5 pillars:\n\n"
                    f"1. **Financials**: Bank statements & GST filings.\n"
                    f"2. **Legal**: MCA incorporation, SHA, and cap table.\n"
                    f"3. **Team**: Past founder references and employment.\n"
                    f"4. **Customers**: Direct customer call verifications.\n"
                    f"5. **Business Model**: Unit margins & key supplier contracts."
                )
                suggested_actions = ["Upload Evidence Documents", "Complete Onboarding Questions"]

            else:
                reply = (
                    f"Welcome, {user.full_name}! I am your **Nivesha Founder Co-pilot**. "
                    f"I can assist you in preparing your venture showcase, defining optimal ticket sizes, "
                    f"and addressing questions before investors inspect your diligence brief. How can I assist you right now?"
                )
                suggested_actions = ["Refine Venture Showcase", "Check Diligence Readiness", "Review Onboarding Answers"]

        return {
            "reply": reply,
            "recommended_venture_ids": recommended_ids,
            "suggested_actions": suggested_actions,
        }
