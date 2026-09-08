"""
Node 2 — Leave Balance Enforcement Agent

What it does:
  - Fetches all Pending leave_requests for the employee.
  - For each request: reads employee_balances and sets is_excess_leave=True
    if requested days > remaining balance.
  - Adds management_note when the request has been Pending beyond SLA thresholds.
  - Builds an escalation list (requests pending > SLA_BREACH_DAYS) for Node 4.

Tables:  leave_requests    (READ + WRITE — is_excess_leave, management_note)
         employee_balances  (READ only)
Writes:  is_excess_leave, management_note
No LLM involved.
"""
import logging
from datetime import date, datetime
from typing import Any, Dict, List

import database as db
from config import settings

logger = logging.getLogger(__name__)


def _business_days_since(applied_on_str: str) -> int:
    """Rough business-day count from applied_on to today (excludes weekends)."""
    try:
        start = datetime.fromisoformat(applied_on_str).date()
    except Exception:
        return 0
    today = date.today()
    delta = (today - start).days
    # subtract weekends (rough)
    full_weeks, rem = divmod(max(delta, 0), 7)
    bd = full_weeks * 5
    start_wd = start.weekday()
    for i in range(rem):
        if (start_wd + i) % 7 < 5:
            bd += 1
    return bd


def _get_balance(employee_name: str, leave_type: str) -> int:
    """Return remaining leave balance. Defaults to 999 if not found (safe fallback)."""
    all_balances = db.fetch_all("employee_balances", {"employee_name": employee_name})
    for bal in all_balances:
        if (bal.get("leave_type") or "").lower() == leave_type.lower():
            return int(bal.get("remaining", 999))
    return 999  # no balance row → don't falsely flag


def run(state: Dict[str, Any]) -> Dict[str, Any]:
    employee_id: str = state["employee_id"]
    employee_name: str = state.get("employee_name", employee_id)

    logs: List[str] = []
    actions: List[Dict] = []
    escalation_list: List[Dict] = state.get("escalation_list", [])

    logs.append(f"[Node 2] Leave balance check for {employee_name} ({employee_id})")

    # Fetch all pending leave requests for this employee
    all_requests = db.fetch_all("leave_requests", {"employee_id": employee_id})
    pending = [r for r in all_requests if r.get("status") == "Pending"]

    if not pending:
        logs.append("[Node 2] No pending leave requests found.")
        return {
            **state,
            "node2_result": {"actions": [], "logs": logs},
            "escalation_list": escalation_list,
        }

    logs.append(f"[Node 2] Found {len(pending)} pending leave request(s).")

    for req in pending:
        req_id = req["id"]
        leave_type = req.get("type", "")
        days_requested = int(req.get("days", 0))
        applied_on = req.get("applied_on", "")
        age_bd = _business_days_since(applied_on)

        patch_payload: Dict[str, Any] = {}
        action_tags: List[str] = []

        # ── Excess leave check ────────────────────────────────────────────
        remaining = _get_balance(employee_name, leave_type)
        if days_requested > remaining and not req.get("is_excess_leave"):
            patch_payload["is_excess_leave"] = True
            action_tags.append("EXCESS_LEAVE_FLAGGED")
            logs.append(
                f"[Node 2] Request {req_id}: {days_requested} days requested, "
                f"only {remaining} remaining → is_excess_leave=True"
            )

        # ── SLA checks ────────────────────────────────────────────────────
        existing_note = req.get("management_note") or ""

        if age_bd >= settings.SLA_BREACH_DAYS:
            note = (
                f"[Agent] SLA BREACHED — pending {age_bd} business days. "
                f"Immediate manager action required."
            )
            if note not in existing_note:
                patch_payload["management_note"] = note
                action_tags.append("SLA_BREACHED")
                logs.append(f"[Node 2] Request {req_id}: SLA breached ({age_bd} days).")
            # Add to cross-node escalation list
            escalation_list.append({
                "table": "leave_requests",
                "id": req_id,
                "employee_id": employee_id,
                "employee_name": employee_name,
                "age_bd": age_bd,
                "type": leave_type,
                "days": days_requested,
            })

        elif age_bd >= settings.SLA_WARNING_DAYS:
            note = (
                f"[Agent] Pending {age_bd} business days — approaching SLA. "
                f"Please review."
            )
            if note not in existing_note:
                patch_payload["management_note"] = note
                action_tags.append("SLA_WARNING")
                logs.append(f"[Node 2] Request {req_id}: SLA warning ({age_bd} days).")

        # ── Write if anything changed ─────────────────────────────────────
        if patch_payload:
            result = db.patch("leave_requests", req_id, patch_payload)
            actions.append({
                "action": action_tags,
                "request_id": req_id,
                "leave_type": leave_type,
                "patch": patch_payload,
                "result": result,
            })
            logs.append(
                f"[Node 2] ✓ Patched {req_id}: {action_tags}. dry_run={settings.DRY_RUN}"
            )
        else:
            logs.append(f"[Node 2] Request {req_id}: no changes needed.")

    return {
        **state,
        "node2_result": {"actions": actions, "logs": logs},
        "escalation_list": escalation_list,
    }
