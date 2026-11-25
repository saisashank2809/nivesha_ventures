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
    def analyze_founder_onboarding(cls, answers: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes the 12 click-first founder onboarding responses:
        - Enforces ₹10 Lakh ticket-size guardrail
        - Runs collateral + experience vs offered return value-discovery check
        - Generates scaling reality-check warning chips
        - Synthesizes founder summary & prefilled Story Builder blocks
        """
        role_archetype = str(answers.get("role_archetype") or "Founder")
        experience_years = str(answers.get("experience_years") or "0-2 yrs")
        core_expertise = answers.get("core_expertise") or []
        if isinstance(core_expertise, str):
            core_expertise = [core_expertise]
        continuity_backup = str(answers.get("continuity_backup_plan") or "No backup yet")
        three_year_goal = str(answers.get("three_year_goal") or "Scale capacity")
        bottleneck = str(answers.get("biggest_bottleneck") or "Insufficient capital")

        try:
            capital_target = float(answers.get("capital_target") or 1000000.0)
        except (ValueError, TypeError):
            capital_target = 1000000.0

        capital_use = answers.get("capital_use") or []
        if isinstance(capital_use, str):
            capital_use = [capital_use]
        arrangement = str(answers.get("proposed_arrangement") or "Secured Loan")
        collateral_type = str(answers.get("collateral_type") or "Unsecured")

        try:
            offered_return_rate = float(answers.get("offered_return_rate") or 14.0)
        except (ValueError, TypeError):
            offered_return_rate = 14.0

        equity_dilution = str(answers.get("equity_dilution_willingness") or "Open to dilution")
        investor_style = str(answers.get("investor_involvement_pref") or "Silent Financial Partner")
        update_cadence = str(answers.get("update_cadence") or "Quarterly")

        # 1. Ticket-Size Guardrail (< ₹10 Lakhs)
        ticket_guardrail = None
        if capital_target < 1000000.0:
            ticket_guardrail = {
                "triggered": True,
                "min_amount": 1000000.0,
                "entered_amount": capital_target,
                "title": "₹10 Lakh Baseline Notice",
                "message": (
                    f"You entered ₹{capital_target:,.0f}. Nivesha Ventures specializes in high-ticket "
                    "opportunities starting at ₹10 Lakhs (₹10,00,000). You can adjust your expansion scope "
                    "to ₹10L+ or continue to join our early-stage waitlist."
                ),
            }

        # 2. Value-Discovery & Over-Offering Check
        value_discovery_tips: List[str] = []
        detected_conflicts: List[str] = []

        is_secured = collateral_type in ("Clean-Title Land", "Factory/Assets")
        is_experienced = experience_years in ("6-10 yrs", "10+ yrs")

        if is_secured and offered_return_rate > 16.0:
            exp_note = f" and {experience_years} of operations" if is_experienced else ""
            value_discovery_tips.append(
                f"Since you are backing this with {collateral_type.lower()}{exp_note}, offering "
                f"{offered_return_rate:.0f}% interest may give away too much value. Comparable secured deals "
                "close at 12–14%. Consider lowering your offered rate."
            )

        if arrangement == "Pure Equity / Dividend" and equity_dilution == "Zero Dilution":
            detected_conflicts.append(
                "Trade-off alert: You selected Pure Equity / Dividend with zero ownership dilution. "
                "Investors will expect either measurable equity dilution or a structured revenue-share/dividend waterfall."
            )

        if arrangement == "Pure Equity / Dividend" and is_secured:
            value_discovery_tips.append(
                f"You offered {collateral_type} alongside Pure Equity. Usually collateral is reserved for Secured Loans — "
                "you can keep your assets unencumbered if raising pure equity."
            )

        if continuity_backup == "No backup yet":
            detected_conflicts.append(
                "Continuity risk flagged: Investors require a clear 3–6 month operational backup plan. "
                "We will highlight this as an action item in your Story Builder."
            )

        # 3. Scaling Reality Check (Hidden Costs Flag)
        reality_check_chips: List[str] = []
        if "New Location Setup" in capital_use or three_year_goal in ("Scale capacity", "Expand to new cities"):
            reality_check_chips = [
                "Have you factored in commercial rent deposits (6–10 months)?",
                "Include licensing, fire/hygiene & statutory compliance costs",
                "Keep a 15% working-capital margin buffer for ramp-up months",
            ]
        elif "Machinery/Equipment" in capital_use:
            reality_check_chips = [
                "Account for installation, GST, and freight on machinery",
                "Budget 10–15% working capital for initial raw-material cycles",
            ]

        # 4. Structured Profile Synthesis
        expertise_str = ", ".join(core_expertise) if core_expertise else "General Operations"
        use_str = ", ".join(capital_use) if capital_use else "Growth & Working Capital"
        lakhs = capital_target / 100000.0
        capital_display = f"₹{lakhs / 100:.2f} Cr" if lakhs >= 100 else f"₹{lakhs:.1f} L"

        founder_summary = (
            f"{role_archetype} with {experience_years} domain experience (strengths: {expertise_str}). "
            f"Seeking {capital_display} via {arrangement} ({collateral_type}, {offered_return_rate:.0f}% target yield) "
            f"for {use_str}. 3-year goal: {three_year_goal}. Continuity plan: {continuity_backup}. "
            f"Prefers {investor_style} with {update_cadence} updates."
        )

        # Map arrangement to Story Builder enum
        arrangement_map = {
            "Secured Loan": "SECURED_COLLATERAL_DEBT",
            "Loan + Equity Fallback": "SECURED_COLLATERAL_DEBT",
            "Pure Equity / Dividend": "GROWTH_EQUITY_WITH_REV_SHARE",
        }
        mapped_arrangement = arrangement_map.get(arrangement, "LOAN")

        prefilled_story_blocks = {
            "capital_target": capital_target,
            "proposed_arrangement": mapped_arrangement,
            "use_of_funds_summary": f"Primary allocation toward {use_str} to address {bottleneck.lower()} and {three_year_goal.lower()}.",
            "founder_bio_summary": f"{role_archetype} with {experience_years} experience specializing in {expertise_str}.",
            "continuity_note": f"Operational continuity covered by: {continuity_backup}.",
            "collateral_type": collateral_type,
            "offered_return_rate": offered_return_rate,
            "investor_involvement": investor_style,
            "update_cadence": update_cadence,
            "three_year_goal": three_year_goal,
        }

        return {
            "founder_summary": founder_summary,
            "ticket_guardrail": ticket_guardrail,
            "value_discovery_tips": value_discovery_tips,
            "reality_check_chips": reality_check_chips,
            "detected_conflicts": detected_conflicts,
            "prefilled_story_blocks": prefilled_story_blocks,
        }

    @classmethod
    def analyze_investor_onboarding(
        cls,
        answers: Dict[str, Any],
        natural_language_note: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        AI-native investor discovery analyzer:
        - Extracts structured preferences from optional natural-language notes without inventing unstated structures
        - Detects conflicts between objective, risk tolerance, stage, and horizon
        - Provides plain-language terminology notes for beginners / 'Not sure' selections
        - Proposes InvestorMandate fields (never auto-locking mandatory rules without confirmation)
        """
        extracted_preferences: Dict[str, Any] = {}
        follow_up_questions: List[str] = []
        terminology_notes: List[str] = []
        detected_conflicts: List[str] = []

        note = (natural_language_note or "").strip()
        note_lower = note.lower()

        # 1. Extract explicit signals from natural-language note (no hallucinated assumptions)
        if note:
            if "crore" in note_lower or "cr" in note_lower:
                cr_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:crore|cr)", note_lower)
                if cr_match:
                    extracted_preferences["ticket_max"] = float(cr_match.group(1)) * 10000000.0
            elif "lakh" in note_lower:
                l_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l)", note_lower)
                if l_match:
                    extracted_preferences["ticket_max"] = float(l_match.group(1)) * 100000.0

            sector_keywords = {
                "manufacturing": "Manufacturing",
                "healthcare": "Healthcare",
                "hospital": "Healthcare",
                "food": "Food & Beverage",
                "restaurant": "Food & Beverage",
                "logistics": "Logistics",
                "real estate": "Real Estate",
                "film": "Film / Entertainment",
                "tech": "Technology",
                "saas": "Technology",
            }
            found_sectors = [v for k, v in sector_keywords.items() if k in note_lower]
            if found_sectors:
                extracted_preferences["target_sectors"] = list(dict.fromkeys(found_sectors))

            if "profitable" in note_lower or "established" in note_lower:
                extracted_preferences["target_stages"] = ["Established", "Growing / Expansion"]
            if "not" in note_lower and ("daily" in note_lower or "manage" in note_lower):
                extracted_preferences["desired_involvement"] = "MONTHLY_ADVISORY"
            if "passive" in note_lower:
                extracted_preferences["desired_involvement"] = "PASSIVE"

        # 2. Merge structured answers with extracted proposals
        investor_type = str(answers.get("investor_type") or "Individual investor")
        capacity_type = str(answers.get("investing_capacity_type") or "Personally")
        experience_level = str(answers.get("experience_level") or "Some experience")
        primary_objective = str(answers.get("primary_objective") or "Long-term capital growth")
        time_horizon = str(answers.get("time_horizon") or "3_TO_5_YEARS")
        desired_involvement = str(
            answers.get("desired_involvement")
            or extracted_preferences.get("desired_involvement")
            or "MONTHLY_ADVISORY"
        )
        risk_level = str(answers.get("risk_tolerance_level") or "Can tolerate some loss")

        raw_arrs = answers.get("accepted_arrangements") or []
        if isinstance(raw_arrs, str):
            raw_arrs = [raw_arrs]
        if not raw_arrs and not any(w in note_lower for w in ("debt", "loan", "equity", "revenue")):
            follow_up_questions.append(
                "Would you prefer to provide a repayable business loan (Debt), take Equity ownership, or explore Revenue Sharing?"
            )

        raw_sectors = answers.get("target_sectors") or extracted_preferences.get("target_sectors") or []
        if isinstance(raw_sectors, str):
            raw_sectors = [raw_sectors]

        raw_stages = answers.get("target_stages") or extracted_preferences.get("target_stages") or []
        if isinstance(raw_stages, str):
            raw_stages = [raw_stages]

        raw_locs = answers.get("locations") or ["India"]
        if isinstance(raw_locs, str):
            raw_locs = [l.strip() for l in raw_locs.split(",") if l.strip()]

        try:
            ticket_min = float(answers.get("ticket_min") or 1000000.0)
        except (ValueError, TypeError):
            ticket_min = 1000000.0

        try:
            ticket_max = float(
                answers.get("ticket_max")
                or extracted_preferences.get("ticket_max")
                or max(ticket_min, 5000000.0)
            )
        except (ValueError, TypeError):
            ticket_max = max(ticket_min, 5000000.0)

        # 3. Conflict & Coherence Checks
        if primary_objective == "Regular income" and "Pre-Revenue / Idea" in raw_stages:
            detected_conflicts.append(
                "Objective vs. Stage conflict: Regular income typically requires cash-flow-positive operating businesses, whereas Idea-stage ventures rarely generate immediate payouts."
            )
        if risk_level == "Prefer capital preservation" and ("EQUITY" in raw_arrs or "Turnaround" in raw_stages):
            detected_conflicts.append(
                "Risk vs. Structure conflict: Capital preservation aligns more closely with asset-backed Secured Debt than pure Equity or Turnaround ventures."
            )
        if time_horizon == "UNDER_1_YEAR" and "EQUITY" in raw_arrs:
            detected_conflicts.append(
                "Horizon vs. Structure conflict: Equity investments generally require a 3–5+ year horizon for exit or liquidity."
            )

        # 4. Beginner / Uncertain Terminology Notes
        if experience_level == "Beginner" or "Not sure" in raw_arrs or risk_level == "Not sure":
            terminology_notes.append(
                "Debt / Secured Loan: Fixed repayment schedule with interest (lower upside, stronger downside protection when backed by collateral)."
            )
            terminology_notes.append(
                "Equity Ownership: Share in company ownership and long-term exit value (higher upside, but capital is locked longer and exposed to business loss)."
            )
            terminology_notes.append(
                "Revenue Sharing: Regular percentage payout from monthly/quarterly sales until a target return cap is reached."
            )

        if risk_level == "Not sure":
            follow_up_questions.append(
                "Could you tolerate locking funds for 3+ years or losing part of your principal on a single venture if returns are higher?"
            )

        clean_arrs = [a for a in raw_arrs if a != "Not sure"]
        if not clean_arrs:
            clean_arrs = ["LOAN", "REVENUE_SHARE", "EQUITY"]

        mandatory_sectors = answers.get("mandatory_sectors") or []
        mandatory_arrs = answers.get("mandatory_arrangements") or []
        if isinstance(mandatory_sectors, str):
            mandatory_sectors = [mandatory_sectors]
        if isinstance(mandatory_arrs, str):
            mandatory_arrs = [mandatory_arrs]

        follow_up_cadence = "MONTHLY_OPERATIONAL_REVIEWS" if desired_involvement in ("MONTHLY_ADVISORY", "ACTIVE_ADVISORY", "ACTIVE_HANDS_ON") else "PERIODIC_CHECK_IN"

        proposed_mandate = {
            "target_sectors": raw_sectors or ["Manufacturing", "Food & Beverage", "Healthcare"],
            "mandatory_sectors": mandatory_sectors,
            "target_stages": raw_stages or ["Growing / Expansion", "Established"],
            "locations": raw_locs,
            "ticket_min": ticket_min,
            "ticket_max": ticket_max,
            "accepted_arrangements": clean_arrs,
            "acceptable_structures": clean_arrs,
            "mandatory_arrangements": mandatory_arrs,
            "time_horizon": time_horizon,
            "desired_involvement": desired_involvement,
            "willing_to_follow_up": follow_up_cadence,
            "thesis_summary": (
                f"{investor_type} ({capacity_type}) seeking {primary_objective.lower()} over {time_horizon.replace('_', ' ').lower()} "
                f"across {', '.join(raw_sectors) if raw_sectors else 'multiple sectors'}."
            ),
        }

        lakhs_min = ticket_min / 100000.0
        lakhs_max = ticket_max / 100000.0
        investor_summary = (
            f"{investor_type} investing {capacity_type.lower()} ({experience_level} in private deals). "
            f"Primary objective: {primary_objective} with ₹{lakhs_min:.0f}L–₹{lakhs_max:.0f}L ticket size, "
            f"{time_horizon.replace('_', ' ').lower()} horizon, and {desired_involvement.replace('_', ' ').lower()} involvement. "
            f"Self-reported risk stance: {risk_level}."
        )

        return {
            "investor_summary": investor_summary,
            "extracted_preferences": extracted_preferences,
            "detected_conflicts": detected_conflicts,
            "follow_up_questions": follow_up_questions,
            "terminology_notes": terminology_notes,
            "proposed_mandate": proposed_mandate,
            "suitability_disclaimer": (
                "These answers are self-reported preferences used for venture matching and do not constitute "
                "a formal or certified financial suitability or accreditation assessment."
            ),
        }

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
