"""
Node 3 — Overtime-to-Payroll Sync Agent

What it does:
  - Fetches all Approved overtime_requests for the employee in the current pay
    period (calendar month).
  - For each approved OT row: computes overtime_amount = hours × rate.
  - Writes overtime_hours + overtime_amount into the matching
    attendance_records.dynamic_checkup_data JSONB field for that date.
  - Writes a monthly OT summary into the most recent attendance row's
    dynamic_checkup_data under keys "monthly_ot_hours" and "monthly_ot_pay".

Tables:  overtime_requests  (READ)
         attendance_records  (READ + WRITE — dynamic_checkup_data JSONB)
         employees           (READ — overtime_rate fallback)
Writes:  attendance_records.dynamic_checkup_data
No LLM involved.
"""
import json
import logging
from datetime import date
from typing import Any, Dict, List, Optional

import database as db
from config import settings

logger = logging.getLogger(__name__)


def _parse_employee_json(raw: str) -> Dict:
    """The overtime_requests.employee column stores a JSON string {id,name,rate}."""
    try:
        return json.loads(raw or "{}")
    except Exception:
        return {}


def _get_overtime_rate(employee_id: str, emp_json: Dict) -> float:
    """Rate priority: OT request JSON → employees.overtime_rate → default 25."""
    if emp_json.get("rate"):
        try:
            return float(emp_json["rate"])
        except Exception:
            pass
    rows = db.fetch_all("employees", {"id": employee_id})
    if rows and rows[0].get("overtime_rate"):
        return float(rows[0]["overtime_rate"])
    return 25.0


def _merge_jsonb(existing_raw: Any, new_data: Dict) -> Dict:
    """Merge new_data into existing dynamic_checkup_data dict."""
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
    run_date: str = state.get("run_date", date.today().isoformat())

    logs: List[str] = []
    actions: List[Dict] = []

    logs.append(f"[Node 3] Overtime sync for {employee_name} ({employee_id})")

    # Current pay period = calendar month of run_date
    month_prefix = run_date[:7]  # "YYYY-MM"

    # Fetch all approved OT requests for this month
    all_ot = db.fetch_all("overtime_requests", {"employee_id": employee_id})
    approved_this_month = [
        r for r in all_ot
        if r.get("status") == "Approved"
        and (r.get("reviewed_on") or r.get("date") or "")[:7] == month_prefix
    ]

    if not approved_this_month:
        logs.append(f"[Node 3] No approved OT in {month_prefix}. Nothing to sync.")
        return {**state, "node3_result": {"actions": [], "logs": logs}}

    logs.append(f"[Node 3] {len(approved_this_month)} approved OT row(s) to sync.")

    total_hours = 0.0
    total_pay = 0.0

    for ot in approved_this_month:
        ot_id = ot["id"]
        ot_date = ot.get("date", "")
        hours = float(ot.get("hours", 0))
        emp_json = _parse_employee_json(ot.get("employee", "{}"))
        rate = _get_overtime_rate(employee_id, emp_json)
        amount = round(hours * rate, 2)

        total_hours += hours
        total_pay += amount

        logs.append(
            f"[Node 3] OT {ot_id}: date={ot_date}, "
            f"hours={hours}, rate={rate}, amount={amount}"
        )

        # Find the attendance_records row for the same date
        att_rows = db.fetch_all(
            "attendance_records",
            {"employee_id": employee_id, "date": ot_date},
        )

        if att_rows:
            rec = att_rows[0]
            existing_jsonb = rec.get("dynamic_checkup_data") or {}
            merged = _merge_jsonb(existing_jsonb, {
                "overtime_hours": hours,
                "overtime_amount": amount,
                "overtime_rate": rate,
                "ot_synced_by_agent": True,
            })
            result = db.patch(
                "attendance_records",
                rec["id"],
                {"dynamic_checkup_data": merged},
            )
            actions.append({
                "action": "OT_SYNC_TO_ATTENDANCE",
                "ot_id": ot_id,
                "attendance_record_id": rec["id"],
                "date": ot_date,
                "hours": hours,
                "amount": amount,
                "result": result,
            })
            logs.append(
                f"[Node 3] ✓ Synced OT into attendance_records[{rec['id']}]. "
                f"dry_run={settings.DRY_RUN}"
            )
        else:
            logs.append(
                f"[Node 3] No attendance row found for {ot_date}. "
                f"OT data noted in monthly summary only."
            )

    # Write monthly summary to the most recent attendance row
    all_att = db.fetch_all("attendance_records", {"employee_id": employee_id})
    month_att = [r for r in all_att if (r.get("date") or "")[:7] == month_prefix]
    month_att.sort(key=lambda r: r.get("date") or "", reverse=True)

    if month_att:
        latest_rec = month_att[0]
        existing_jsonb = latest_rec.get("dynamic_checkup_data") or {}
        merged = _merge_jsonb(existing_jsonb, {
            "monthly_ot_hours": round(total_hours, 2),
            "monthly_ot_pay": round(total_pay, 2),
            "monthly_ot_synced_by_agent": True,
        })
        result = db.patch(
            "attendance_records",
            latest_rec["id"],
            {"dynamic_checkup_data": merged},
        )
        actions.append({
            "action": "MONTHLY_OT_SUMMARY",
            "attendance_record_id": latest_rec["id"],
            "monthly_ot_hours": total_hours,
            "monthly_ot_pay": total_pay,
            "result": result,
        })
        logs.append(
            f"[Node 3] ✓ Monthly summary written: "
            f"{total_hours}h = ₹{total_pay}. dry_run={settings.DRY_RUN}"
        )
    else:
        logs.append("[Node 3] No attendance rows this month to write summary to.")

    return {**state, "node3_result": {"actions": actions, "logs": logs}}
