"""
Node 4 — Expense and Request Escalation Agent

What it does:
  - Checks all Pending items across leave_requests, overtime_requests, expenses.
  - Computes age in business days from applied_on.
  - Writes management_note with SLA warning (>= SLA_WARNING_DAYS) or breach
    (>= SLA_BREACH_DAYS) text.
  - Sets reviewed_by = 'System (auto-escalated)' on SLA-breached expense rows.
  - Passes breached items to Node 5 via the shared escalation_list in state.

Tables:  leave_requests    (READ + WRITE — management_note)
         overtime_requests  (READ + WRITE — management_note)
         expenses           (READ + WRITE — management_note, reviewed_by)
Writes:  management_note, reviewed_by (expenses only)
No LLM involved.
"""
import logging
from datetime import date, datetime
from typing import Any, Dict, List

import database as db
from config import settings

logger = logging.getLogger(__name__)


def _business_days_since(applied_on_str: str) -> int:
    try:
        start = datetime.fromisoformat(applied_on_str).date()
    except Exception:
        return 0
    today = date.today()
    delta = (today - start).days
    full_weeks, rem = divmod(max(delta, 0), 7)
    bd = full_weeks * 5
    start_wd = start.weekday()
    for i in range(rem):
        if (start_wd + i) % 7 < 5:
            bd += 1
    return bd


def _check_table(
    table: str,
    employee_id: str,
    employee_name: str,
    escalation_list: List[Dict],
    logs: List[str],
    actions: List[Dict],
    id_field: str = "id",
    extra_breach_patch: Dict = None,
):
    rows = db.fetch_all(table, {"employee_id": employee_id})
    pending = [r for r in rows if r.get("status") == "Pending"]

    if not pending:
        logs.append(f"[Node 4] {table}: no pending items.")
        return

    logs.append(f"[Node 4] {table}: {len(pending)} pending item(s).")

    for item in pending:
        item_id = item[id_field]
        applied_on = item.get("applied_on", "")
        age_bd = _business_days_since(applied_on)
        existing_note = item.get("management_note") or ""
        patch_payload: Dict[str, Any] = {}
        tag = ""

        if age_bd >= settings.SLA_BREACH_DAYS:
            note = (
                f"[Agent] SLA BREACHED — pending {age_bd} business days. "
                f"Immediate action required."
            )
            if note not in existing_note:
                patch_payload["management_note"] = note
            if extra_breach_patch:
                patch_payload.update(extra_breach_patch)
            tag = "SLA_BREACHED"
            logs.append(f"[Node 4] {table} {item_id}: breached ({age_bd} days).")
            escalation_list.append({
                "table": table,
                "id": item_id,
                "employee_id": employee_id,
                "employee_name": employee_name,
                "age_bd": age_bd,
            })

        elif age_bd >= settings.SLA_WARNING_DAYS:
            note = (
                f"[Agent] Pending {age_bd} business days — approaching SLA. "
                f"Please review."
            )
            if note not in existing_note:
                patch_payload["management_note"] = note
            tag = "SLA_WARNING"
            logs.append(f"[Node 4] {table} {item_id}: warning ({age_bd} days).")

        else:
            logs.append(
                f"[Node 4] {table} {item_id}: {age_bd} day(s) old — within SLA."
            )

        if patch_payload:
            result = db.patch(table, item_id, patch_payload)
            actions.append({
                "action": tag,
                "table": table,
                "item_id": item_id,
                "age_bd": age_bd,
                "patch": patch_payload,
                "result": result,
            })
            logs.append(
                f"[Node 4] ✓ Patched {table}/{item_id}. dry_run={settings.DRY_RUN}"
            )


def run(state: Dict[str, Any]) -> Dict[str, Any]:
    employee_id: str = state["employee_id"]
    employee_name: str = state.get("employee_name", employee_id)
    escalation_list: List[Dict] = state.get("escalation_list", [])

    logs: List[str] = []
    actions: List[Dict] = []

    logs.append(f"[Node 4] Escalation check for {employee_name} ({employee_id})")

    _check_table(
        "leave_requests", employee_id, employee_name,
        escalation_list, logs, actions,
    )
    _check_table(
        "overtime_requests", employee_id, employee_name,
        escalation_list, logs, actions,
    )
    _check_table(
        "expenses", employee_id, employee_name,
        escalation_list, logs, actions,
        extra_breach_patch={"reviewed_by": "System (auto-escalated)"},
    )

    return {
        **state,
        "node4_result": {"actions": actions, "logs": logs},
        "escalation_list": escalation_list,
    }
