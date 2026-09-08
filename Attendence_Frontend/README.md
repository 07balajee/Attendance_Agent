# OxiqAI HRMS — Attendance Module with Agentic Orchestration Frontend

A production-quality, responsive enterprise HRMS frontend built strictly according to the **High-Level Design (HLD)** document and POC architecture for Attendance Automation with LangGraph Multi-Agent Orchestration.

---

## 1. Architectural Foundation & HLD Alignment

This application models an enterprise HRMS dashboard that interfaces with a **5-Node LangGraph Multi-Agent Pipeline**:

| Node | Name | Technology | Tables & Mutated Fields | Core Role |
| :--- | :--- | :--- | :--- | :--- |
| **Node 1** | **Absence-Marking Agent** | Deterministic | `attendance_records` (`approval_status="Absent"`, `last_sign_out="21:00"`) | Evaluates working calendar & holidays. Creates `Absent` row if no swipe exists on a working day. Auto-closes unclosed swipes after 21:00. |
| **Node 2** | **Leave Balance Enforcement Agent** | Deterministic | `leave_requests` (`is_excess_leave=true`, `management_note`) | Flags excess leave if requested days > remaining quota. **Preserves Human Authority**: strictly does not auto-reject. Appends SLA warning (2d) and breach notes (5d). |
| **Node 3** | **Overtime-to-Payroll Sync Agent** | Deterministic | `attendance_records.dynamic_checkup_data` (`overtime_hours`, `overtime_amount`) | Reads approved overtime for the month, computes `hours × rate = amount`, and writes into `attendance_records.dynamic_checkup_data` JSONB. Zero direct payroll API calls. |
| **Node 4** | **Expense & Request Escalation Agent** | Deterministic | `expenses` (`reviewed_by="System (auto-escalated)"`, `management_note`) | Cross-functional SLA watchdog across leave, overtime, and expenses. Stamps auto-escalation on breached expense claims (≥ 5 business days). |
| **Node 5** | **Anomaly Detection & Narrative Agent** | Hybrid (Deterministic + Anthropic Claude 3.5 Sonnet) | `attendance_records.dynamic_checkup_data["anomaly_note"]` (post-HIL only) | Evaluates 30d/90d behavioral trends. **Only when flags exist**, invokes Anthropic API to draft a manager narrative and triggers LangGraph `interrupt()` for Human-in-the-Loop review. |

### Strict Business Rules Enforced:
1. **Human Authority Preserved**: AI and subagents never auto-approve or auto-reject leave, overtime, or expenses.
2. **Zero Schema Changes**: Reuses existing Supabase Postgres tables. Overtime sync and approved anomaly narratives write directly into the existing `dynamic_checkup_data` JSONB column.
3. **One Thread Per Employee**: Thread format `attendance-{employee_id}-{YYYY-MM-DD}`. Thread isolation ensures a paused thread on Node 5 for one employee never blocks other employees.
4. **HIL Narrative Commits**: AI-generated manager narratives are drafts only; committing requires explicit human review and confirmation (`Command(resume=approved_text)`).

---

## 2. Application Structure & Routes

```
Attendance Module
├── /                 → Attendance Dashboard (8 KPIs, live swipes, SLA & Anomaly widgets)
├── /attendance       → Attendance Management (30-day history timeline, Node 1 Absent rows)
├── /leave            → Leave Management (Excess leave flags, quotas, approvals)
├── /overtime         → Overtime & Payroll Sync (Hours × Rate formula, dynamic_checkup_data sync)
├── /expenses         → Expenses & Reimbursements (Aging in business days, auto-escalations)
├── /sla              → SLA Monitoring Center (2-day warning, 5-day breach lifecycle)
├── /anomalies        → Behavioral Anomaly Center (5 exact HLD signals, HIL trigger)
├── /orchestration    → Agentic Orchestration (LangGraph workflow, thread monitor, runner)
└── /settings         → Attendance Automation Settings (HLD tunables, Dry Run mode)
```

---

## 3. Technology Stack

- **React 18** + **Vite 6** + **TypeScript 5**
- **Tailwind CSS** (Clean enterprise palette: Slate, Blue, Emerald, Amber, Rose, Purple)
- **Lucide React** (Consistent enterprise iconography)
- **React Router DOM v6** (Responsive layout with collapsible sidebar and breadcrumbs)
- **Modular Service Architecture** (`attendanceService`, `leaveService`, `overtimeService`, `expenseService`, `anomalyService`, `agentService`)
- **FastAPI POC Connector** (Detects live FastAPI server on `http://127.0.0.1:8001` or falls back seamlessly to rich in-memory simulation)

---

## 4. How to Run the Frontend

### Prerequisites
- Node.js (v18 or higher; verified on v24.18.0)
- npm (v9 or higher; verified on v11.16.0)

### Quick Start
```bash
# Navigate to the frontend directory
cd Attendence_Frontend

# Install dependencies (already completed)
npm install

# Start development server
npm run dev
```

Open your browser to: **http://localhost:3000**

### Production Build
```bash
npm run build
npm run preview
```

---

## 5. Connecting with the Python Backend POC

The frontend is pre-configured to communicate with the FastAPI backend POC (`http://127.0.0.1:8001`):
1. Navigate to `attendance_agent_poc`:
   ```bash
   cd attendance_agent_poc
   python main.py
   ```
2. In the frontend, the Top Navigation bar will automatically detect the server and display:
   `● Port 8001 Live`
3. If the backend is not running, the application smoothly switches to `● Simulated Mode` with realistic Indian enterprise dataset (15 employees, 30-day swipe histories, pending requests, SLA warnings, and LangGraph thread states).
