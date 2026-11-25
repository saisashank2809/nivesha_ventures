import os
import json
import logging
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import httpx
from dotenv import load_dotenv

from app.models.models import Venture, User, InvestorMandate

# Load environment variables from .env
load_dotenv()

logger = logging.getLogger("nivesha.ai_service")


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
        """
        Generates dynamic AI response using configured LLM API (Google Gemini or OpenAI).
        Falls back seamlessly to local diligence heuristics if API is unavailable or fails.
        """
        api_key = os.getenv("NIVESHA_DILIGENCE_ASSISTANT_API_KEY") or os.getenv("OPENAI_API_KEY")
        api_url = os.getenv("NIVESHA_DILIGENCE_ASSISTANT_API_URL", "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
        model = os.getenv("NIVESHA_DILIGENCE_ASSISTANT_MODEL", "gemini-3-flash-preview")

        # Fetch platform context
        ventures = db.query(Venture).all()
        mandate = None
        if context_type == "INVESTOR":
            mandate = db.query(InvestorMandate).filter(InvestorMandate.investor_id == user.id).first()

        current_venture = None
        if venture_id:
            current_venture = db.query(Venture).filter(Venture.id == venture_id).first()

        # If API key is present, attempt dynamic LLM call
        if api_key and api_key.strip():
            clean_key = api_key.strip()
            try:
                # Detect whether key/URL corresponds to Gemini or OpenAI
                is_gemini = (
                    clean_key.startswith("AQ.")
                    or clean_key.startswith("AIza")
                    or "googleapis.com" in api_url
                    or "gemini" in model.lower()
                )

                if is_gemini:
                    dynamic_res = cls._call_gemini(
                        api_key=clean_key,
                        api_url=api_url,
                        model=model,
                        user=user,
                        context_type=context_type,
                        message=message,
                        ventures=ventures,
                        mandate=mandate,
                        current_venture=current_venture,
                        history=history or [],
                    )
                else:
                    dynamic_res = cls._call_openai(
                        api_key=clean_key,
                        api_url=api_url,
                        model=model,
                        user=user,
                        context_type=context_type,
                        message=message,
                        ventures=ventures,
                        mandate=mandate,
                        current_venture=current_venture,
                        history=history or [],
                    )

                if dynamic_res:
                    return dynamic_res
            except Exception as e:
                logger.warning(f"Dynamic AI call failed: {e}. Falling back to local intelligence.", exc_info=True)

        # Fallback to local intelligence heuristics
        return cls._fallback_response(
            db=db,
            user=user,
            message=message,
            context_type=context_type,
            ventures=ventures,
            mandate=mandate,
        )

    @classmethod
    def _call_gemini(
        cls,
        api_key: str,
        api_url: str,
        model: str,
        user: User,
        context_type: str,
        message: str,
        ventures: List[Venture],
        mandate: Optional[InvestorMandate],
        current_venture: Optional[Venture],
        history: List[Dict[str, str]],
    ) -> Optional[Dict[str, Any]]:
        """Invokes Google Gemini generateContent API with structured JSON output."""
        system_prompt = cls._build_system_prompt(
            user=user,
            context_type=context_type,
            ventures=ventures,
            mandate=mandate,
            current_venture=current_venture,
        )

        contents = []
        for h in history[-8:]:
            role = "user" if h.get("role") == "user" else "model"
            content = h.get("content")
            if content:
                contents.append({"role": role, "parts": [{"text": content}]})

        contents.append({"role": "user", "parts": [{"text": message}]})

        # Ensure model name without "models/" prefix for the path
        clean_model = model.replace("models/", "")
        endpoint = f"{api_url}/models/{clean_model}:generateContent?key={api_key}"

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
        }

        with httpx.Client(timeout=25.0) as client:
            resp = client.post(endpoint, json=payload)
            if resp.status_code != 200:
                logger.error(f"Gemini API error {resp.status_code}: {resp.text}")
                return None

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None

            raw_text = candidates[0]["content"]["parts"][0]["text"]
            return cls._parse_llm_json(raw_text)

    @classmethod
    def _call_openai(
        cls,
        api_key: str,
        api_url: str,
        model: str,
        user: User,
        context_type: str,
        message: str,
        ventures: List[Venture],
        mandate: Optional[InvestorMandate],
        current_venture: Optional[Venture],
        history: List[Dict[str, str]],
    ) -> Optional[Dict[str, Any]]:
        """Invokes OpenAI Chat Completions API with injected diligence knowledge."""
        system_prompt = cls._build_system_prompt(
            user=user,
            context_type=context_type,
            ventures=ventures,
            mandate=mandate,
            current_venture=current_venture,
        )

        messages = [{"role": "system", "content": system_prompt}]

        for h in history[-8:]:
            role = h.get("role")
            content = h.get("content")
            if role in ["user", "assistant"] and content:
                messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": message})

        endpoint = f"{api_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }

        with httpx.Client(timeout=25.0) as client:
            resp = client.post(endpoint, headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"OpenAI API error {resp.status_code}: {resp.text}")
                return None

            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return cls._parse_llm_json(content)

    @classmethod
    def _parse_llm_json(cls, raw_content: str) -> Dict[str, Any]:
        """Safely parses JSON from LLM output with robust regex fallbacks."""
        cleaned = raw_content.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)

        try:
            data = json.loads(cleaned)
            return {
                "reply": data.get("reply", cleaned),
                "recommended_venture_ids": data.get("recommended_venture_ids", []),
                "suggested_actions": data.get("suggested_actions", []),
            }
        except Exception:
            return {
                "reply": raw_content,
                "recommended_venture_ids": [],
                "suggested_actions": ["Review Diligence Brief", "Show Verified Ventures"],
            }

    @classmethod
    def _build_system_prompt(
        cls,
        user: User,
        context_type: str,
        ventures: List[Venture],
        mandate: Optional[InvestorMandate],
        current_venture: Optional[Venture],
    ) -> str:
        """Constructs an institutional-grade domain prompt with live database records."""
        is_investor = context_type == "INVESTOR"

        # Summarize catalog ventures
        venture_catalog = []
        for v in ventures:
            venture_catalog.append({
                "id": v.id,
                "company_name": v.company_name,
                "tag_line": v.tag_line,
                "sector": v.sector,
                "location": v.location,
                "stage": v.stage,
                "capital_target_inr": v.capital_target,
                "ticket_min_inr": v.ticket_min,
                "ticket_max_inr": v.ticket_max,
                "proposed_arrangement": v.proposed_arrangement,
                "verification_status": v.verification_status.value if hasattr(v.verification_status, "value") else str(v.verification_status),
                "traction_summary": v.traction_metrics or [],
                "diligence_summary": v.diligence_brief or {},
                "findings": v.due_diligence_findings or {},
            })

        user_context = {
            "name": user.full_name,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        }

        mandate_context = {}
        if mandate:
            mandate_context = {
                "firm_name": getattr(mandate, "firm_name", ""),
                "target_sectors": getattr(mandate, "target_sectors", []) or [],
                "ticket_min_inr": getattr(mandate, "ticket_min", None),
                "ticket_max_inr": getattr(mandate, "ticket_max", None),
                "target_stages": getattr(mandate, "target_stages", []) or [],
                "acceptable_structures": getattr(mandate, "acceptable_structures", []) or [],
                "accepted_arrangements": getattr(mandate, "accepted_arrangements", []) or [],
                "locations": getattr(mandate, "locations", []) or [],
                "desired_involvement": getattr(mandate, "desired_involvement", "PASSIVE"),
                "time_horizon": getattr(mandate, "time_horizon", "3_TO_5_YEARS"),
            }

        persona = (
            "You are the Nivesha Diligence Assistant, an institutional-grade AI advisor for HNIs, angel syndicates, and family offices in India.\n"
            "Your tone is professional, objective, analytical, and grounded strictly in verified evidence (GST filings, bank reconciliations, MCA cap tables).\n"
            "Always format currency in Indian numbering (₹ Lakhs and ₹ Crores). Never invent unverified traction.\n"
            "When recommending ventures, choose only from the Platform Ventures Catalog provided below.\n"
            if is_investor
            else
            "You are the Nivesha Founder Co-pilot, an expert venture advisor helping early-stage Indian founders prepare institutional-grade showcases.\n"
            "You help founders structure check sizes, model instruments (CCPS, iSAFE, Revenue Share), and prepare for rigorous financial diligence (GST/bank reconciliation)."
        )

        prompt = f"""
{persona}

Current User:
{json.dumps(user_context, indent=2)}

Investor Mandate (Active Criteria):
{json.dumps(mandate_context, indent=2) if mandate_context else "None configured yet"}

Platform Ventures Catalog:
{json.dumps(venture_catalog, indent=2)}

Current Focused Venture:
{json.dumps({'id': current_venture.id, 'company_name': current_venture.company_name, 'sector': current_venture.sector, 'diligence': current_venture.diligence_brief} if current_venture else None, indent=2)}

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with a single valid JSON object containing:
{{
  "reply": "Your markdown-formatted response to the user. Use concise bullet points, bold key figures, and reference verified diligence metrics from the catalog.",
  "recommended_venture_ids": ["array of exact matching venture UUID strings from the catalog above"],
  "suggested_actions": ["2 to 4 short, actionable chip prompts (e.g., 'Inspect BharatPay Brief', 'Check Ticket Fit', 'Filter FinTech')"]
}}
"""
        return prompt

    @classmethod
    def _fallback_response(
        cls,
        db: Session,
        user: User,
        message: str,
        context_type: str,
        ventures: List[Venture],
        mandate: Optional[InvestorMandate],
    ) -> Dict[str, Any]:
        """Deterministic heuristic response engine when external LLM is offline."""
        msg_lower = message.lower().strip()
        recommended_ids = []
        suggested_actions = []

        if context_type == "INVESTOR":
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
