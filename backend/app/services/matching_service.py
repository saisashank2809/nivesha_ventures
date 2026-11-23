"""Shared Deterministic Matching Engine for Nivesha Ventures.

Compares Venture records against Investor Mandates across 7 dimensions:
1. Funding Arrangement
2. Sector
3. Geography
4. Business Stage
5. Individual Contribution Ticket Range
6. Time Horizon
7. Involvement & Follow-up Expectations

Decision Order:
1. Known mandatory failure -> UNSUITABLE
2. No mandatory failure, but required information unresolved -> NEEDS_MORE_INFORMATION
3. Mandatory checks pass -> POTENTIALLY_SUITABLE
4. Preference variances & monitoring burdens surfaced as explicit TRADE_OFFS.
"""

from typing import Dict, Any, List
from app.models.models import Venture, InvestorMandate, MatchOutcome


def evaluate_match(venture: Venture, mandate: InvestorMandate) -> Dict[str, Any]:
    rule_results: List[Dict[str, Any]] = []
    compatibility_reasons: List[str] = []
    mandatory_mismatches: List[str] = []
    trade_offs: List[str] = []
    missing_info: List[str] = list(venture.missing_information or [])

    # 1. Funding Arrangement Rule
    v_arr = (venture.proposed_arrangement or "LOAN").upper()
    v_structures = [s.upper() for s in (venture.capital_structures or [])]
    if v_arr not in v_structures:
        v_structures.append(v_arr)

    m_accepted_arr = [a.upper() for a in (mandate.accepted_arrangements or mandate.acceptable_structures or [])]
    m_mandatory_arr = [a.upper() for a in (mandate.mandatory_arrangements or [])]

    arrangement_overlap = any(s in m_accepted_arr for s in v_structures) or not m_accepted_arr
    if m_mandatory_arr and not any(s in m_mandatory_arr for s in v_structures):
        mandatory_mismatches.append(
            f"Funding arrangement mismatch: Investor mandates {', '.join(m_mandatory_arr)}, but venture proposes {v_arr}."
        )
        rule_results.append({
            "rule": "funding_arrangement",
            "dimension": "Arrangement & Structure",
            "result": "FAIL",
            "reason": f"Investor strictly requires {', '.join(m_mandatory_arr)}. Venture offers {v_arr}.",
            "is_mandatory": True,
        })
    elif arrangement_overlap:
        compatibility_reasons.append(f"Proposed arrangement '{v_arr}' aligns with investor's accepted structures.")
        rule_results.append({
            "rule": "funding_arrangement",
            "dimension": "Arrangement & Structure",
            "result": "PASS",
            "reason": f"Mutually acceptable arrangement identified ({v_arr}).",
            "is_mandatory": bool(m_mandatory_arr),
        })
    else:
        mandatory_mismatches.append(f"Venture offers {v_arr}, which is not in investor's accepted arrangements.")
        rule_results.append({
            "rule": "funding_arrangement",
            "dimension": "Arrangement & Structure",
            "result": "FAIL",
            "reason": f"No overlap between venture structures ({v_structures}) and investor mandate ({m_accepted_arr}).",
            "is_mandatory": True,
        })

    # 2. Sector Compatibility
    v_sector = (venture.sector or "").strip().lower()
    m_sectors = [s.strip().lower() for s in (mandate.target_sectors or [])]
    m_mand_sectors = [s.strip().lower() for s in (mandate.mandatory_sectors or [])]

    sector_match = any(v_sector in s or s in v_sector for s in m_sectors) or not m_sectors
    if m_mand_sectors and not any(v_sector in s or s in v_sector for s in m_mand_sectors):
        mandatory_mismatches.append(
            f"Sector mismatch: Investor mandates focus in {', '.join(mandate.mandatory_sectors)}, excluding '{venture.sector}'."
        )
        rule_results.append({
            "rule": "sector",
            "dimension": "Industry Sector",
            "result": "FAIL",
            "reason": f"Venture sector '{venture.sector}' is outside mandatory focus sectors.",
            "is_mandatory": True,
        })
    elif sector_match:
        compatibility_reasons.append(f"Venture sector '{venture.sector}' matches investor's target industries.")
        rule_results.append({
            "rule": "sector",
            "dimension": "Industry Sector",
            "result": "PASS",
            "reason": f"Sector '{venture.sector}' fits within investor target sectors.",
            "is_mandatory": bool(m_mand_sectors),
        })
    else:
        trade_offs.append(f"Venture sector '{venture.sector}' is outside standard target sectors ({', '.join(mandate.target_sectors)}).")
        rule_results.append({
            "rule": "sector",
            "dimension": "Industry Sector",
            "result": "TRADE_OFF",
            "reason": f"Sector preference difference (non-mandatory).",
            "is_mandatory": False,
        })

    # 3. Geography
    v_loc = (venture.location or "").strip().lower()
    m_locs = [l.strip().lower() for l in (mandate.locations or [])]
    geo_match = any(v_loc in l or l in v_loc or "india" in l for l in m_locs) or not m_locs
    if geo_match:
        compatibility_reasons.append(f"Location in '{venture.location}' is covered by investor mandate.")
        rule_results.append({
            "rule": "geography",
            "dimension": "Geography",
            "result": "PASS",
            "reason": f"Venture operates in permitted geography ({venture.location}).",
            "is_mandatory": False,
        })
    else:
        trade_offs.append(f"Location preference trade-off: Venture is in {venture.location}, investor focuses on {', '.join(mandate.locations)}.")
        rule_results.append({
            "rule": "geography",
            "dimension": "Geography",
            "result": "TRADE_OFF",
            "reason": f"Geographic preference difference.",
            "is_mandatory": False,
        })

    # 4. Business Stage
    v_stage = (venture.stage or "").strip().lower()
    m_stages = [st.strip().lower() for st in (mandate.target_stages or [])]
    stage_match = any(v_stage in s or s in v_stage for s in m_stages) or not m_stages
    if stage_match:
        compatibility_reasons.append(f"Business stage '{venture.stage}' aligns with investor expectations.")
        rule_results.append({
            "rule": "stage",
            "dimension": "Business Stage",
            "result": "PASS",
            "reason": f"Stage aligns with mandate preferences.",
            "is_mandatory": False,
        })
    else:
        trade_offs.append(f"Stage difference: Venture is at '{venture.stage}', whereas investor prefers {', '.join(mandate.target_stages)}.")
        rule_results.append({
            "rule": "stage",
            "dimension": "Business Stage",
            "result": "TRADE_OFF",
            "reason": f"Stage preference variance.",
            "is_mandatory": False,
        })

    # 5. Ticket Range Overlap
    v_min = venture.ticket_min if venture.ticket_min is not None else 500000.0
    v_max = venture.ticket_max if venture.ticket_max is not None else venture.capital_target
    m_min = mandate.ticket_min if mandate.ticket_min is not None else 250000.0
    m_max = mandate.ticket_max if mandate.ticket_max is not None else 5000000.0

    overlap_start = max(v_min, m_min)
    overlap_end = min(v_max, m_max)

    if overlap_start <= overlap_end:
        overlap_range_str = f"₹{overlap_start/100000:.1f}L – ₹{overlap_end/100000:.1f}L"
        compatibility_reasons.append(
            f"Acceptable individual ticket ranges overlap ({overlap_range_str}). Venture total target: ₹{venture.capital_target/100000:.1f}L."
        )
        rule_results.append({
            "rule": "ticket_range",
            "dimension": "Contribution & Ticket Size",
            "result": "PASS",
            "reason": f"Contribution ranges overlap successfully between {overlap_range_str}.",
            "is_mandatory": True,
        })
    else:
        mandatory_mismatches.append(
            f"Contribution mismatch: Investor contribution range (₹{m_min/100000:.1f}L – ₹{m_max/100000:.1f}L) does not overlap with venture ticket size (₹{v_min/100000:.1f}L – ₹{v_max/100000:.1f}L)."
        )
        rule_results.append({
            "rule": "ticket_range",
            "dimension": "Contribution & Ticket Size",
            "result": "FAIL",
            "reason": f"No overlap between investor ticket (₹{m_min/100000:.1f}L – ₹{m_max/100000:.1f}L) and venture requirement.",
            "is_mandatory": True,
        })

    # 6. Time Horizon
    m_horizon = getattr(mandate, "time_horizon", "3_TO_5_YEARS")
    arr_details = venture.arrangement_details or {}
    v_horizon = arr_details.get("repayment_schedule", "2_TO_3_YEARS")
    compatibility_reasons.append(f"Time horizon compatible: Venture planning on {v_horizon}; investor mandate accepts {m_horizon}.")
    rule_results.append({
        "rule": "time_horizon",
        "dimension": "Time Horizon",
        "result": "PASS",
        "reason": f"Expected tenure compatible ({v_horizon} vs. {m_horizon}).",
        "is_mandatory": False,
    })

    # 7. Involvement and Follow-Up Expectations (Key Requirement!)
    m_involvement = getattr(mandate, "desired_involvement", "PASSIVE")
    m_followup = getattr(mandate, "willing_to_follow_up", "PERIODIC_CHECK_IN")

    # If venture is F&B / retail expansion, it requires active operational follow-up
    requires_regular_followup = v_arr == "LOAN" or "food" in v_sector or "restaurant" in v_sector

    if requires_regular_followup and m_followup in ["NO_FOLLOW_UP", "PASSIVE"]:
        trade_offs.append(
            "Involvement friction: Investor prefers passive engagement with no routine follow-up, but this operational expansion requires monthly unit reviews."
        )
        rule_results.append({
            "rule": "involvement_and_followup",
            "dimension": "Involvement & Follow-up",
            "result": "TRADE_OFF",
            "reason": "Venture requires ongoing monthly monitoring which conflicts with investor's passive preference.",
            "is_mandatory": False,
        })
    else:
        compatibility_reasons.append(f"Involvement expectations aligned ({m_involvement}, follow-up: {m_followup}).")
        rule_results.append({
            "rule": "involvement_and_followup",
            "dimension": "Involvement & Follow-up",
            "result": "PASS",
            "reason": "Involvement and follow-up expectations compatible.",
            "is_mandatory": False,
        })

    # Final Outcome Assessment Order:
    # 1. Any known mandatory failure -> UNSUITABLE
    # 2. No mandatory failure, but unresolved missing information -> NEEDS_MORE_INFORMATION
    # 3. Mandatory checks pass and required info present -> POTENTIALLY_SUITABLE
    if len(mandatory_mismatches) > 0:
        outcome = MatchOutcome.UNSUITABLE
    elif len(missing_info) > 0 and any("unsupported" in m.lower() or "missing" in m.lower() or "pending" in m.lower() for m in missing_info):
        outcome = MatchOutcome.NEEDS_MORE_INFORMATION
    else:
        outcome = MatchOutcome.POTENTIALLY_SUITABLE

    return {
        "outcome": outcome,
        "compatibility_reasons": compatibility_reasons,
        "mandatory_mismatches": mandatory_mismatches,
        "trade_offs": trade_offs,
        "missing_information": missing_info,
        "rule_results": rule_results,
    }
