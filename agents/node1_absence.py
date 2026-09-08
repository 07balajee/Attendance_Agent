"""
Node 1 — Absence-Marking Agent

What it does:
  - For every employee, checks if an attendance_records row exists for today.
  - If no row exists on a working day → creates one with approval_status='Absent'.
  - If a row exists with is_signed_in=True but last_sign_out is NULL and the
    current hour is past AUTO_CLOSE_HOUR → auto-closes the sign-out.
  - If a row exists with is_signed_in=False and first_sign_in is NULL →
    patches approval_status to 'Absent'.
  - Guards the extra_notes column: never overwrites WFO/WFH values.

Tables:  attendance_records (READ + WRITE)
         employees           (READ)
Writes:  approval_status, last_sign_out
No LLM involved.
"""
import json
import logging
from datetime import datetime, date
from typing import Any, Dict, List

import database as db
from config import settings

logger = logging.getLogger(__name__)

# Weekday numbers that are working days (0=Monday … 4=Friday)
WORKING_WEEKDAYS = {0, 1, 2, 3, 4}


def _load_holidays() -> set:
    """Load holiday dates from holidays.json bundled in the POC folder.
    Falls back to main project path if running inside the full codebase.
    Never writes to this file."""
    import pathlib
    # 1. POC-local copy (standalone zip distribution)
    poc_root = pathlib.Path(__file__).resolve().parent.parent
    local_path = poc_root / "holidays.json"
    if local_path.exists():
        holidays_path = local_path
    else:
        # 2. Main project path (when running inside the full repo)
        holidays_path = (
            poc_root.parent
            / "hrms" / "modules" / "attendance" / "holidays.json"
        )
    if holidays_path.exists():
        try:
            with open(holidays_path) as f:
                data = json.load(f)
            # Only Fixed + Global Shutdown count as non-working
            return {
                h["date"]
                for h in data
                if h.get("type") in ("Fixed", "Global Shutdown")
            }
        except Exception as e:
            logger.warning("Could not load holidays.json: %s", e)
    return set()


def _is_working_day(check_date: date, holidays: set) -> bool:
    if check_date.weekday() not in WORKING_WEEKDAYS:
        return False
    return check_date.isoformat() not in holidays


def run(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node entrypoint.
    Receives state dict, returns updated state dict with node1_result appended.
    """
    employee_id: str = state["employee_id"]
    employee_name: str = state.get("employee_name", employee_id)
    today: str = state.get("run_date", date.today().isoformat())
    today_dt = date.fromisoformat(today)
    now_hour = datetime.now().hour

    logs: List[str] = []
    actions: List[Dict] = []

    logs.append(f"[Node 1] Absence check for {employee_name} ({employee_id}) on {today}")

    holidays = _load_holidays()

    if not _is_working_day(today_dt, holidays):
        logs.append(f"[Node 1] {today} is not a working day — skipping.")
        return {**state, "node1_result": {"actions": [], "logs": logs}}

    # Fetch today's attendance row
    rows = db.fetch_all("attendance_records", {"employee_id": employee_id, "date": today})
    record = rows[0] if rows else None

    if record is None:
        # ── Case A: No row at all → mark Absent ──────────────────────────
        logs.append(f"[Node 1] No attendance row found for {today}. Creating Absent record.")
        payload = {
            "employee_id": employee_id,
            "employee_name": employee_name,
            "date": today,
            "is_signed_in": False,
            "approval_status": "Absent",
            "department": state.get("department", ""),
        }
        result = db.insert("attendance_records", payload)
        actions.append({
            "action": "INSERT_ABSENT",
            "employee_id": employee_id,
            "date": today,
            "result": result,
        })
        logs.append(f"[Node 1] ✓ Absent row created. dry_run={settings.DRY_RUN}")

    elif record.get("is_signed_in") and not record.get("last_sign_out"):
        # ── Case B: Still signed in, no sign-out past auto-close hour ────
        if now_hour >= settings.AUTO_CLOSE_HOUR:
            auto_time = datetime.now().replace(
                hour=settings.AUTO_CLOSE_HOUR, minute=0, second=0, microsecond=0
            ).isoformat()
            logs.append(
                f"[Node 1] Employee signed in but no sign-out. "
                f"Auto-closing at {settings.AUTO_CLOSE_HOUR}:00."
            )
            result = db.patch(
                "attendance_records",
                record["id"],
                {"last_sign_out": auto_time, "is_signed_in": False},
            )
            actions.append({
                "action": "AUTO_CLOSE_SIGNOUT",
                "record_id": record["id"],
                "auto_close_time": auto_time,
                "result": result,
            })
            logs.append(f"[Node 1] ✓ Auto sign-out applied. dry_run={settings.DRY_RUN}")
        else:
            logs.append(
                f"[Node 1] Employee still signed in, current hour {now_hour} "
                f"< auto-close threshold {settings.AUTO_CLOSE_HOUR}. No action."
            )

    elif not record.get("is_signed_in") and not record.get("first_sign_in"):
        # ── Case C: Row exists but never signed in → confirm Absent ──────
        current_status = record.get("approval_status", "")
        if current_status != "Absent":
            logs.append(
                f"[Node 1] Row exists but no sign-in found. "
                f"Patching approval_status → Absent."
            )
            result = db.patch(
                "attendance_records",
                record["id"],
                {"approval_status": "Absent"},
            )
            actions.append({
                "action": "PATCH_ABSENT",
                "record_id": record["id"],
                "result": result,
            })
            logs.append(f"[Node 1] ✓ approval_status set to Absent. dry_run={settings.DRY_RUN}")
        else:
            logs.append(f"[Node 1] Row already marked Absent — no change needed.")

    else:
        logs.append(
            f"[Node 1] Normal attendance row found "
            f"(signed_in={record.get('is_signed_in')}, "
            f"sign_out={record.get('last_sign_out')}). No action."
        )

    return {**state, "node1_result": {"actions": actions, "logs": logs}}
