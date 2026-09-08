# Attendance Agent POC
### Agentic Orchestration — OxiqAI HRMS Attendance Module

Completely standalone proof-of-concept. No dependency on the main HRMS codebase.  
Connects to the same Supabase project the main app uses.  
**Dry Run is ON by default — safe to run, nothing gets written unless you turn it off.**

---

## What This Demonstrates

A 5-node LangGraph pipeline that runs for each employee and automates the
rule-based work that currently requires manual HR intervention.

| Node | Name | What It Does | LLM? |
|------|------|-------------|------|
| 1 | Absence Marking | Creates `Absent` rows for employees with no sign-in on working days | No |
| 2 | Leave Balance | Flags excess-leave requests, adds SLA warning/breach notes | No |
| 3 | Overtime Sync | Writes approved OT hours + amount into attendance records for payroll | No |
| 4 | Escalation | Detects Pending items (leave/OT/expenses) past SLA threshold | No |
| 5 | Anomaly + Narrative | Detects patterns (late arrivals, absences etc.), drafts manager narrative, **pauses for HR review** | Gemini (optional) |

---

## Verified Test Results (September 4, 2026)

Tested against real Supabase DB with 15 employees. All nodes passed.

| Test | Result |
|------|--------|
| Supabase connection | ✅ 15 real employees loaded |
| Node 1 — Absent row detection | ✅ Detected missing row, created Absent record (dry run) |
| Node 2 — Leave SLA breach | ✅ Detected 25-day old pending request, added breach note |
| Node 3 — Overtime sync | ✅ No approved OT this month — correctly skipped |
| Node 4 — Escalation | ✅ 2 SLA breaches flagged across leave + overtime |
| Node 5 — HIL pause | ✅ Anomaly detected, narrative drafted, HIL pause triggered |
| FastAPI server (port 8001) | ✅ Running |
| `/health` endpoint | ✅ |
| `/api/employees` | ✅ 15 employees |
| Dry Run protection | ✅ No actual DB writes during testing |

---

## Setup

### Step 1 — Create virtual environment and install dependencies

Always use a virtual environment to keep dependencies isolated from your system Python.

**Windows**
```bash
cd attendance_agent_poc
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Mac / Linux**
```bash
cd attendance_agent_poc
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

> **Every time you open a new terminal**, activate the venv first before running anything:
> - Windows: `venv\Scripts\activate`
> - Mac/Linux: `source venv/bin/activate`
>
> You will see `(venv)` at the start of your terminal prompt when it is active.

**Gemini (optional):** Node 5 uses Gemini to draft manager narratives.
If `GEMINI_API_KEY` is not set or the package is not installed, a
rule-based fallback narrative is used automatically — the pipeline still works.
To enable Gemini:
```bash
pip install google-generativeai
```

### Step 2 — Configure environment
```bash
cp .env.example .env
```
Open `.env` and fill in:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_KEY=your-supabase-service-role-key

# Optional — for AI narratives in Node 5
GEMINI_API_KEY=your-gemini-key

# Safety — true = no DB writes (default), false = live writes
AGENT_DRY_RUN=true
```

**Important:** If you have the main HRMS project's `.env` file, you can copy
the `SUPABASE_URL` and `SUPABASE_KEY` values directly from there.

### Step 3 — Run

**One-command Windows startup (recommended)**
```powershell
.\start.ps1
```

This creates `.venv` when needed, installs `requirements.txt`, preserves an
existing `.env`, and starts the API on port 8001. The dashboard then connects
to Supabase through the backend automatically.

**Option A — Browser Dashboard (recommended for demo)**
```bash
cd attendance_agent_poc
python main.py
```
Open: **http://127.0.0.1:8001**

**Option B — Terminal CLI**
```bash
cd attendance_agent_poc

# See all available employees
python demo_runner.py --list-employees

# Run pipeline for one employee (dry run — safe)
python demo_runner.py --employee emp_004

# Run with actual DB writes
python demo_runner.py --employee emp_004 --dry-run false
```

---

## Demo Walkthrough (For Mentor Presentation)

### Browser Demo
1. Open **http://127.0.0.1:8001**
2. Check top-right — should show `✓ Supabase | ⚠ Gemini | DRY RUN ON`
3. Select any employee from the dropdown (e.g. "Mike Employee")
4. Confirm **Dry Run toggle is ON** (left panel) — safe mode, no DB writes
5. Click **Run Agent Pipeline**
6. Watch **Live Logs** tab — each node logs its decision in real time
7. Check **Actions Taken** tab — see exactly what each agent decided to do
8. If anomaly flags trigger → **HIL Review** tab activates automatically
9. Review the drafted narrative, edit if needed → click **Approve & Save to DB**
10. Toggle Dry Run **OFF** and re-run to demonstrate actual DB writes

### What To Explain to Your Mentor

**Why Node 1 matters:**
> "The current router only creates an attendance row when an employee physically
> swipes in. If someone is absent, no row is created. Payroll counts present-day
> rows to calculate salary — a missing row silently inflates the salary. Node 1
> closes this gap by creating an `Absent` row nightly for employees who never showed up."

**Why Node 2 matters:**
> "The leave submission endpoint accepts any request regardless of balance.
> The `is_excess_leave` flag exists in the schema but is never set by the router.
> Node 2 sets it automatically and adds SLA notes when requests go stale."

**Why Node 3 matters:**
> "Approved overtime never reaches payroll — it only shows in the browser UI.
> Node 3 writes the calculated overtime amount into `attendance_records.dynamic_checkup_data`
> (a JSONB column that already exists), which the payroll module already reads.
> Zero schema changes needed."

**Why Node 5 has HIL:**
> "The AI is only used to make data readable — it converts raw flags into a
> professional manager narrative. But we never let AI write directly to the DB.
> HR reviews and approves the draft first. The agent surfaces information,
> humans make decisions."

---

## Dry Run vs Live Mode

| Setting | What Happens |
|---------|-------------|
| `AGENT_DRY_RUN=true` (default) | Agents read DB, log what they *would* do, **no writes** |
| `AGENT_DRY_RUN=false` | Agents actually write to Supabase |

In the browser dashboard, the **Dry Run toggle** controls this per-run and
overrides the `.env` setting. In CLI, use `--dry-run false`.

Actions marked with `(dry)` badge in the dashboard = would have happened in live mode.

---

## Folder Structure

```
attendance_agent_poc/
├── .env.example          ← copy to .env and fill credentials
├── requirements.txt      ← pip install -r requirements.txt
├── config.py             ← reads .env, all tunables in one place
├── database.py           ← thin Supabase wrapper (respects DRY_RUN)
├── main.py               ← FastAPI server on port 8001
├── demo_runner.py        ← CLI terminal demo
├── holidays.json         ← holiday calendar (bundled — no main project needed)
├── README.md             ← this file
├── agents/
│   ├── __init__.py
│   ├── node1_absence.py  ← Absence marking agent
│   ├── node2_leave.py    ← Leave balance enforcement agent
│   ├── node3_overtime.py ← Overtime-to-payroll sync agent
│   ├── node4_escalation.py ← SLA escalation agent
│   └── node5_anomaly.py  ← Anomaly detection + Gemini narrative + HIL
├── graph/
│   ├── __init__.py
│   └── orchestrator.py   ← LangGraph master graph
├── static/
│   └── index.html        ← Demo dashboard UI
└── checkpointer/
    └── states/           ← HIL state files saved here (auto-created at runtime)
```

---

## Both Apps Can Run Simultaneously

- Main HRMS app → **port 8000**
- This POC → **port 8001**

They share the same Supabase DB. The POC does not interfere with the main app.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `SUPABASE_URL not set` | Copy `.env.example` to `.env` and fill credentials |
| `ModuleNotFoundError: langgraph` | Run `pip install langgraph langchain-core` |
| `ModuleNotFoundError: google.generativeai` | Either install it or leave GEMINI_API_KEY blank — fallback narrative works fine |
| Port 8001 already in use | Change `POC_PORT=8002` in `.env` |
| `Employee not found` | Run `python demo_runner.py --list-employees` to see valid IDs |
#   A t t e n d a n c e _ A g e n t  
 