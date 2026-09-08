"""
Node 5 — Anomaly Detection and Narrative Agent

What it does (Part A — deterministic, no LLM):
  - Evaluates a rolling 30-day window of attendance_records + leave_requests.
  - Raises flags for:
      habitual_late        : late sign-in (>09:30) on >= 4 days in 30
      frequent_short_leave : >= 3 approved 1-day leaves in 30 days
      repeated_absence     : approval_status='Absent' on >= 2 rows in 30 days
      missing_checkup      : signed in but tasks_done is NULL on >= 3 days in 30
      excess_leave_pattern : is_excess_leave=True on >= 2 requests in 90 days
  - If NO flags → exits immediately (no LLM, no HIL pause).

What it does (Part B — Gemini LLM, conditional):
  - If flags are raised → calls Gemini to draft a professional manager narrative.
  - Sets node5_hil_required=True in state so the orchestrator knows to pause.
  - The HIL approval flow is handled by the orchestrator / FastAPI endpoint.
  - After HR approval → writes the approved text into
    attendance_records.dynamic_checkup_data["anomaly_note"] on the latest row.

Tables:  attendance_records (READ + WRITE post-HIL — dynamic_checkup_data)
         leave_requests      (READ)
Writes:  attendance_records.dynamic_checkup_data["anomaly_note"] (post-HIL only)
LLM:     Gemini (google-generativeai), conditional.
"""
import json
import logging
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

import database as db
from config import settings

logger = logging.getLogger(__name__)

# ── Thresholds ────────────────────────────────────────────────────────────────
LATE_THRESHOLD_HOUR = 9
LATE_THRESHOLD_MIN = 30
LATE_FLAG_COUNT = 4           # >= 4 late arrivals in 30 days
SHORT_LEAVE_FLAG_COUNT = 3    # >= 3 single-day leaves in 30 days
ABSENT_FLAG_COUNT = 2         # >= 2 absent rows in 30 days
MISSING_CHECKUP_FLAG_COUNT = 3  # >= 3 missing checkups in 30 days
EXCESS_LEAVE_FLAG_COUNT = 2   # >= 2 excess-leave flags in 90 days
EXCESS_LEAVE_WINDOW_DAYS = 90


def _date_n_days_ago(n: int) -> str:
    return (date.today() - timedelta(days=n)).isoformat()


def _is_late(sign_in_str: Optional[str]) -> bool:
    if not sign_in_str:
        return False
    try:
        dt = datetime.fromisoformat(sign_in_str)
        return dt.hour > LATE_THRESHOLD_HOUR or (
            dt.hour == LATE_THRESHOLD_HOUR and dt.minute > LATE_THRESHOLD_MIN
        )
    except Exception:
        return False


def _detect_flags(
    attendance_rows: List[Dict],
    leave_rows: List[Dict],
    window_30: str,
    window_90: str,
) -> Dict[str, Any]:
    flags: Dict[str, Any] = {}

    rows_30 = [r for r in attendance_rows if (r.get("date") or "") >= window_30]
    rows_90_leaves = [
        r for r in leave_rows
        if (r.get("applied_on") or "") >= window_90
        and r.get("is_excess_leave") is True
    ]

    # habitual_late
    late_count = sum(1 for r in rows_30 if _is_late(r.get("first_sign_in")))
    if late_count >= LATE_FLAG_COUNT:
        flags["habitual_late"] = {
            "count": late_count,
            "threshold": LATE_FLAG_COUNT,
            "message": f"Late arrival ({LATE_THRESHOLD_HOUR}:{LATE_THRESHOLD_MIN:02d}+) on {late_count} days in the past 30.",
        }

    # frequent_short_leave
    leaves_30 = [
        r for r in leave_rows
        if (r.get("applied_on") or "") >= window_30
        and r.get("status") == "Approved"
        and int(r.get("days", 0)) == 1
    ]
    if len(leaves_30) >= SHORT_LEAVE_FLAG_COUNT:
        flags["frequent_short_leave"] = {
            "count": len(leaves_30),
            "threshold": SHORT_LEAVE_FLAG_COUNT,
            "message": f"{len(leaves_30)} single-day approved leaves in the past 30 days.",
        }

    # repeated_absence
    absent_count = sum(
        1 for r in rows_30 if r.get("approval_status") == "Absent"
    )
    if absent_count >= ABSENT_FLAG_COUNT:
        flags["repeated_absence"] = {
            "count": absent_count,
            "threshold": ABSENT_FLAG_COUNT,
            "message": f"{absent_count} unapproved absences in the past 30 days.",
        }

    # missing_checkup
    missing_count = sum(
        1 for r in rows_30
        if r.get("is_signed_in") and not r.get("tasks_done")
    )
    if missing_count >= MISSING_CHECKUP_FLAG_COUNT:
        flags["missing_checkup"] = {
            "count": missing_count,
            "threshold": MISSING_CHECKUP_FLAG_COUNT,
            "message": f"Signed in but no daily checkup submitted on {missing_count} days.",
        }

    # excess_leave_pattern
    if len(rows_90_leaves) >= EXCESS_LEAVE_FLAG_COUNT:
        flags["excess_leave_pattern"] = {
            "count": len(rows_90_leaves),
            "threshold": EXCESS_LEAVE_FLAG_COUNT,
            "message": f"{len(rows_90_leaves)} excess-leave requests in the past 90 days.",
        }

    return flags


def _call_gemini(employee_name: str, flags: Dict, escalation_items: List[Dict]) -> str:
    """Call Gemini to draft a professional manager-facing narrative."""
    if not settings.gemini_configured:
        return _fallback_narrative(employee_name, flags, escalation_items)

    try:
        import importlib.util
        if importlib.util.find_spec("google.generativeai") is None:
            logger.warning("google-generativeai not installed — using fallback narrative.")
            return _fallback_narrative(employee_name, flags, escalation_items)

        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        flag_text = "\n".join(
            f"- {k}: {v['message']}" for k, v in flags.items()
        )
        escalation_text = ""
        if escalation_items:
            escalation_text = "\nAdditionally, the following items have breached SLA:\n"
            for item in escalation_items:
                escalation_text += (
                    f"- {item['table']} (ID: {item['id']}) "
                    f"pending {item['age_bd']} business days\n"
                )

        prompt = f"""You are an HR analytics assistant. Write a concise, professional,
empathetic narrative for a manager about the following attendance patterns observed
for employee {employee_name} over the past 30 days.

Observed patterns:
{flag_text}
{escalation_text}

Instructions:
- Keep it under 120 words.
- Be factual and non-judgmental.
- End with ONE suggested follow-up action.
- Do NOT mention specific dates or IDs.
- Write in third person (e.g. "The employee has shown...").
"""
        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        logger.warning("Gemini call failed: %s — using fallback narrative.", e)
        return _fallback_narrative(employee_name, flags, escalation_items)


def _fallback_narrative(
    employee_name: str, flags: Dict, escalation_items: List[Dict]
) -> str:
    """Rule-based narrative when Gemini is unavailable."""
    lines = [f"Attendance patterns flagged for {employee_name}:"]
    for k, v in flags.items():
        lines.append(f"• {v['message']}")
    if escalation_items:
        lines.append(
            f"• {len(escalation_items)} pending request(s) have breached SLA."
        )
    lines.append(
        "Recommended action: Schedule a brief check-in conversation with this employee."
    )
    return "\n".join(lines)


def _merge_jsonb(existing_raw: Any, new_data: Dict) -> Dict:
    if isinstance(existing_raw, dict):
        merged = dict(existing_raw)
    elif isinstance(existing_raw, str):
        try:
            merged = json.loads(existing_raw)
        except Exception:
            merged = {}
    else:
        merged = {}
    merged.update(new_data)
    return merged


def run(state: Dict[str, Any]) -> Dict[str, Any]:
    employee_id: str = state["employee_id"]
    employee_name: str = state.get("employee_name", employee_id)
    escalation_list: List[Dict] = state.get("escalation_list", [])
    employee_escalations = [
        e for e in escalation_list if e.get("employee_id") == employee_id
    ]

    logs: List[str] = []
    actions: List[Dict] = []

    logs.append(f"[Node 5] Anomaly detection for {employee_name} ({employee_id})")

    window_30 = _date_n_days_ago(settings.ANOMALY_WINDOW_DAYS)
    window_90 = _date_n_days_ago(EXCESS_LEAVE_WINDOW_DAYS)

    # Fetch data
    attendance_rows = db.fetch_all("attendance_records", {"employee_id": employee_id})
    leave_rows = db.fetch_all("leave_requests", {"employee_id": employee_id})

    # ── Part A: Deterministic flag detection ─────────────────────────────
    flags = _detect_flags(attendance_rows, leave_rows, window_30, window_90)

    if not flags and not employee_escalations:
        logs.append("[Node 5] No anomaly flags raised. Node exits — no LLM call.")
        return {
            **state,
            "node5_result": {
                "flags": {},
                "actions": [],
                "logs": logs,
                "hil_required": False,
            },
            "node5_hil_required": False,
        }

    # Flags found
    flag_summary = ", ".join(flags.keys()) if flags else "none"
    escalation_summary = f"{len(employee_escalations)} SLA-breached item(s)"
    logs.append(f"[Node 5] Flags raised: [{flag_summary}]. Escalations: {escalation_summary}")

    # ── Part B: Gemini narrative draft ───────────────────────────────────
    logs.append("[Node 5] Calling Gemini to draft manager narrative...")
    draft_narrative = _call_gemini(employee_name, flags, employee_escalations)
    logs.append(f"[Node 5] Draft narrative ready ({len(draft_narrative)} chars).")
    logs.append("[Node 5] ⏸ HIL pause — waiting for HR review and approval.")

    return {
        **state,
        "node5_result": {
            "flags": flags,
            "escalation_items": employee_escalations,
            "draft_narrative": draft_narrative,
            "actions": actions,
            "logs": logs,
            "hil_required": True,
        },
        "node5_hil_required": True,
        "node5_draft_narrative": draft_narrative,
        "node5_flags": flags,
    }


def commit_approved_narrative(
    state: Dict[str, Any], approved_text: str
) -> Dict[str, Any]:
    """
    Called after HR approves the narrative (HIL resume).
    Writes the approved text into the latest attendance_records row's
    dynamic_checkup_data under key 'anomaly_note'.
    """
    employee_id: str = state["employee_id"]
    employee_name: str = state.get("employee_name", employee_id)
    logs: List[str] = list(state.get("node5_result", {}).get("logs", []))
    actions: List[Dict] = []

    logs.append(f"[Node 5] HR approved narrative. Writing to DB...")

    # Get most recent attendance row
    all_att = db.fetch_all("attendance_records", {"employee_id": employee_id})
    all_att.sort(key=lambda r: r.get("date") or "", reverse=True)

    if all_att:
        latest = all_att[0]
        existing_jsonb = latest.get("dynamic_checkup_data") or {}
        merged = _merge_jsonb(existing_jsonb, {
            "anomaly_note": approved_text,
            "anomaly_flagged_by_agent": True,
            "anomaly_flags": list(state.get("node5_flags", {}).keys()),
        })
        result = db.patch(
            "attendance_records",
            latest["id"],
            {"dynamic_checkup_data": merged},
        )
        actions.append({
            "action": "WRITE_ANOMALY_NOTE",
            "record_id": latest["id"],
            "narrative_length": len(approved_text),
            "result": result,
        })
        logs.append(
            f"[Node 5] ✓ Anomaly note written to attendance_records[{latest['id']}]. "
            f"dry_run={settings.DRY_RUN}"
        )
    else:
        logs.append("[Node 5] No attendance rows found to write narrative to.")

    return {
        **state,
        "node5_result": {
            **state.get("node5_result", {}),
            "approved_narrative": approved_text,
            "actions": actions,
            "logs": logs,
            "hil_required": False,
            "hil_completed": True,
        },
        "node5_hil_required": False,
        "node5_hil_completed": True,
    }
