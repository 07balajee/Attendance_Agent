"""
demo_runner.py — CLI demo runner for the Attendance Agent POC

Run this directly from the terminal to see the full pipeline execute
with visible step-by-step logs, without needing the browser dashboard.

Usage:
    cd attendance_agent_poc
    python demo_runner.py                         # runs for all seeded employees
    python demo_runner.py --employee emp_004      # run for one employee
    python demo_runner.py --employee emp_004 --dry-run false  # live writes
    python demo_runner.py --list-employees        # show available employees
"""
import sys
import os
import json
import argparse
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))

from config import settings
import database as db
import agents.node1_absence as node1
import agents.node2_leave as node2
import agents.node3_overtime as node3
import agents.node4_escalation as node4
import agents.node5_anomaly as node5


# ── ANSI colours ─────────────────────────────────────────────────────────────
R = "\033[0m"
BOLD = "\033[1m"
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
DIM = "\033[2m"


def c(colour, text): return f"{colour}{text}{R}"
def header(text): print(f"\n{BOLD}{BLUE}{'═'*60}{R}\n{BOLD}{BLUE}  {text}{R}\n{BOLD}{BLUE}{'═'*60}{R}")
def node_header(n, name): print(f"\n{BOLD}{CYAN}  ▶ Node {n} — {name}{R}")
def sep(): print(f"{DIM}  {'─'*56}{R}")


def print_logs(logs):
    for line in logs:
        if "✓" in line or "done" in line.lower():
            print(f"  {GREEN}{line}{R}")
        elif "SLA" in line or "BREACH" in line or "⚠" in line:
            print(f"  {YELLOW}{line}{R}")
        elif "Absent" in line or "absent" in line:
            print(f"  {RED}{line}{R}")
        elif "HIL" in line or "⏸" in line or "pause" in line.lower():
            print(f"  {MAGENTA}{line}{R}")
        elif "Node" in line and "[Node" in line:
            print(f"  {BOLD}{line}{R}")
        elif "[DRY_RUN]" in line:
            print(f"  {DIM}{line}{R}")
        else:
            print(f"  {line}")


def print_actions(actions):
    if not actions:
        print(f"  {DIM}  No actions taken.{R}")
        return
    for a in actions:
        act = a.get("action", "—")
        if isinstance(act, list):
            act = ", ".join(act)
        dry = " (DRY RUN — no real write)" if a.get("result", {}).get("_dry_run") else ""
        colour = GREEN if "INSERT" in act or "SYNC" in act or "SUMMARY" in act else YELLOW
        print(f"  {colour}  → {act}{R}{DIM}{dry}{R}")


def run_for_employee(emp: dict, run_date: str, dry_run: bool):
    settings.DRY_RUN = dry_run
    employee_id = emp["id"]
    employee_name = emp.get("name") or emp.get("full_name", employee_id)
    department = emp.get("department", "")

    header(f"{employee_name}  [{employee_id}]  {department}")
    print(f"  Run date : {c(CYAN, run_date)}")
    print(f"  Dry run  : {c(YELLOW, str(dry_run))}")

    state = {
        "employee_id": employee_id,
        "employee_name": employee_name,
        "department": department,
        "run_date": run_date,
        "escalation_list": [],
    }

    # ── Node 1 ───────────────────────────────────────────────────────────
    node_header(1, "Absence Marking Agent")
    state = node1.run(state)
    r = state.get("node1_result", {})
    print_logs(r.get("logs", []))
    print_actions(r.get("actions", []))

    # ── Node 2 ───────────────────────────────────────────────────────────
    node_header(2, "Leave Balance Enforcement Agent")
    state = node2.run(state)
    r = state.get("node2_result", {})
    print_logs(r.get("logs", []))
    print_actions(r.get("actions", []))

    # ── Node 3 ───────────────────────────────────────────────────────────
    node_header(3, "Overtime-to-Payroll Sync Agent")
    state = node3.run(state)
    r = state.get("node3_result", {})
    print_logs(r.get("logs", []))
    print_actions(r.get("actions", []))

    # ── Node 4 ───────────────────────────────────────────────────────────
    node_header(4, "Escalation Agent")
    state = node4.run(state)
    r = state.get("node4_result", {})
    print_logs(r.get("logs", []))
    print_actions(r.get("actions", []))

    # ── Node 5 ───────────────────────────────────────────────────────────
    node_header(5, "Anomaly Detection & Narrative Agent")
    state = node5.run(state)
    r = state.get("node5_result", {})
    print_logs(r.get("logs", []))

    if state.get("node5_hil_required"):
        sep()
        print(f"\n  {MAGENTA}{BOLD}⏸  HIL PAUSE — HR REVIEW REQUIRED{R}")
        flags = state.get("node5_flags", {})
        print(f"\n  {BOLD}Flags detected:{R}")
        for flag, detail in flags.items():
            print(f"    {YELLOW}• {flag.replace('_',' ').title()}{R}: {detail['message']}")
        print(f"\n  {BOLD}Draft Narrative:{R}")
        print(f"  {DIM}{'─'*56}{R}")
        draft = state.get("node5_draft_narrative", "")
        for line in draft.split("\n"):
            print(f"    {line}")
        print(f"  {DIM}{'─'*56}{R}")

        # Simulate HR review in CLI
        print(f"\n  {MAGENTA}[HR Review]{R} Press ENTER to approve as-is, or type a replacement:")
        try:
            user_input = input("  > ").strip()
        except (EOFError, KeyboardInterrupt):
            user_input = ""

        approved_text = user_input if user_input else draft

        print(f"\n  {GREEN}Approving narrative...{R}")
        state = node5.commit_approved_narrative(state, approved_text)
        r5_updated = state.get("node5_result", {})
        print_logs(r5_updated.get("logs", []))
        print_actions(r5_updated.get("actions", []))
    else:
        print_actions(r.get("actions", []))

    # ── Summary ───────────────────────────────────────────────────────────
    sep()
    total_actions = sum(
        len(state.get(f"node{i}_result", {}).get("actions", []))
        for i in range(1, 6)
    )
    escalations = len(state.get("escalation_list", []))
    flags_found = len(state.get("node5_flags", {}))

    print(f"\n  {BOLD}Pipeline Summary:{R}")
    print(f"    Total actions taken  : {c(GREEN, str(total_actions))}")
    print(f"    Escalations flagged  : {c(YELLOW, str(escalations))}")
    print(f"    Anomaly flags        : {c(RED if flags_found else DIM, str(flags_found))}")
    print(f"    HIL completed        : {c(GREEN, 'Yes') if state.get('node5_hil_completed') else c(DIM, 'No')}")
    print()


def main():
    parser = argparse.ArgumentParser(description="Attendance Agent POC — CLI demo runner")
    parser.add_argument("--employee", type=str, default=None,
                        help="Employee ID to run pipeline for (e.g. emp_004)")
    parser.add_argument("--dry-run", type=str, default="true",
                        choices=["true","false"],
                        help="true = no DB writes (default), false = live writes")
    parser.add_argument("--run-date", type=str, default=None,
                        help="Date to run for, YYYY-MM-DD (default: today)")
    parser.add_argument("--list-employees", action="store_true",
                        help="List all employees and exit")
    args = parser.parse_args()

    dry_run = args.dry_run.lower() == "true"
    run_date = args.run_date or date.today().isoformat()

    print(f"\n{BOLD}{BLUE}  Attendance Agent POC — Demo Runner{R}")
    print(f"  Supabase : {settings.SUPABASE_URL[:50] if settings.SUPABASE_URL else 'NOT CONFIGURED'}")
    print(f"  Gemini   : {'Configured' if settings.gemini_configured else 'Not configured (fallback narrative)'}")
    print(f"  Dry run  : {dry_run}")
    print(f"  Run date : {run_date}")

    # Load employees
    try:
        all_emps = db.fetch_all("employees")
    except Exception as e:
        print(f"\n{RED}ERROR: Could not connect to Supabase: {e}{R}")
        print("Make sure SUPABASE_URL and SUPABASE_KEY are set in .env")
        sys.exit(1)

    if args.list_employees:
        print(f"\n{BOLD}  Available employees:{R}")
        for e in sorted(all_emps, key=lambda x: x.get("name","")):
            print(f"    {e['id']:<20} {e.get('name',''):<25} {e.get('department','')}")
        sys.exit(0)

    if args.employee:
        emp = next((e for e in all_emps if e["id"] == args.employee), None)
        if not emp:
            print(f"\n{RED}Employee '{args.employee}' not found.{R}")
            print("Run with --list-employees to see available IDs.")
            sys.exit(1)
        run_for_employee(emp, run_date, dry_run)
    else:
        # Demo mode: run for first 3 employees only
        demo_emps = sorted(all_emps, key=lambda x: x.get("name",""))[:3]
        print(f"\n{DIM}  Running for {len(demo_emps)} employees (use --employee ID for a specific one){R}")
        for emp in demo_emps:
            run_for_employee(emp, run_date, dry_run)


if __name__ == "__main__":
    main()
