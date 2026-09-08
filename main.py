"""
main.py — POC FastAPI server (port 8001)

Completely isolated from the main HRMS app.
Serves the demo dashboard + agent pipeline API.

Endpoints:
  GET  /                          → demo dashboard HTML
  GET  /api/employees             → list employees from Supabase
  POST /api/run/{employee_id}     → run full pipeline, returns streamed logs
  GET  /api/status/{employee_id}  → get pipeline state for an employee
  GET  /api/hil/pending           → list all threads awaiting HIL review
  POST /api/hil/approve           → HR approves narrative, resumes thread
  POST /api/hil/reject            → HR rejects narrative, discards it
  GET  /health                    → health check
"""
import sys
import os
import logging
import json
from datetime import date
from typing import Any, Dict, List, Optional

# ── path fix so all poc modules resolve correctly ────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import database as db
from config import settings
from graph.orchestrator import (
    get_paused_threads,
    get_thread_state,
    reject_after_hil,
    resume_after_hil,
    stream_pipeline,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Attendance Agent POC",
    description="Demo pipeline for Attendance module agentic orchestration",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
_static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(_static_dir):
    app.mount("/static", StaticFiles(directory=_static_dir), name="static")


# ── Pydantic models ───────────────────────────────────────────────────────────
class HILApproveRequest(BaseModel):
    employee_id: str
    run_date: Optional[str] = None
    approved_text: str


class HILRejectRequest(BaseModel):
    employee_id: str
    run_date: Optional[str] = None


class RunRequest(BaseModel):
    run_date: Optional[str] = None
    dry_run: Optional[bool] = None


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "poc": "attendance_agent_poc",
        "port": settings.POC_PORT,
        "supabase_configured": settings.supabase_configured,
        "gemini_configured": settings.gemini_configured,
        "dry_run": settings.DRY_RUN,
    }


@app.get("/api/employees")
def get_employees():
    """Fetch employees list from the real Supabase DB."""
    try:
        rows = db.fetch_all("employees")
        # Only return fields needed for the demo selector
        result = []
        for r in rows:
            result.append({
                "id": r.get("id"),
                "name": r.get("name") or r.get("full_name", ""),
                "department": r.get("department", ""),
                "level": r.get("level", ""),
                "role": r.get("role", ""),
            })
        # Sort by name
        result.sort(key=lambda x: x["name"])
        return result
    except Exception as e:
        logger.error("get_employees error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/threads")
def get_threads():
    """Return checkpoint-backed thread summaries for the orchestration console."""
    import sqlite3
    from graph.orchestrator import _CHECKPOINT_DB

    if not os.path.exists(_CHECKPOINT_DB):
        return []
    try:
        with sqlite3.connect(_CHECKPOINT_DB) as conn:
            rows = conn.execute("SELECT DISTINCT thread_id FROM checkpoints").fetchall()
        result = []
        for (thread_id,) in rows:
            parts = thread_id.split("-", 2)
            if len(parts) != 3 or parts[0] != "attendance":
                continue
            state = get_thread_state(parts[1], parts[2])
            if state:
                result.append(_thread_summary(state, thread_id))
        return result
    except Exception as exc:
        logger.error("get_threads error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


def _thread_summary(state: Dict[str, Any], thread_id: str) -> Dict[str, Any]:
    """Map graph state to the frontend's thread contract."""
    hil_required = bool(state.get("node5_hil_required"))
    completed = bool(state.get("node5_hil_completed")) or not hil_required
    results = [state.get(f"node{i}_result", {}) for i in range(1, 6)]
    logs = [log for result in results for log in result.get("logs", [])]
    actions = [
        {"node": f"node{i}", "action": action.get("action", ""), "details": action}
        for i, result in enumerate(results, 1)
        for action in result.get("actions", [])
    ]
    return {
        "thread_id": thread_id,
        "employee_id": state.get("employee_id", ""),
        "employee_name": state.get("employee_name", ""),
        "department": state.get("department", ""),
        "run_date": state.get("run_date", ""),
        "current_node": "END" if completed else "node5_anomaly",
        "status": "Completed" if completed else "Paused — HIL",
        "started_at": state.get("started_at", ""),
        "updated_at": state.get("updated_at", ""),
        "hil_required": hil_required,
        "hil_completed": state.get("node5_hil_completed", False),
        "execution_time_ms": 0,
        "records_read": 0,
        "records_written": len(actions),
        "logs": logs,
        "actions_taken": actions,
        "flags": state.get("node5_flags", {}),
        "draft_narrative": state.get("node5_draft_narrative", ""),
        "approved_narrative": state.get("node5_result", {}).get("approved_narrative"),
    }


@app.post("/api/run/{employee_id}")
def run_pipeline(employee_id: str, req: RunRequest = RunRequest()):
    """
    Run the full 5-node pipeline for one employee.
    Streams back logs as newline-delimited JSON so the frontend
    can show live progress.
    """
    # Override dry_run if provided in request
    if req.dry_run is not None:
        settings.DRY_RUN = req.dry_run

    run_date = req.run_date or date.today().isoformat()

    # Get employee name for display
    emp_rows = db.fetch_all("employees", {"id": employee_id})
    if not emp_rows:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found.")
    emp = emp_rows[0]
    employee_name = emp.get("name") or emp.get("full_name", employee_id)
    department = emp.get("department", "")

    def _stream():
        """Yield graph events as newline-delimited JSON."""

        def emit(node: str, logs: list, actions: list = None, extra: dict = None):
            payload = {
                "node": node,
                "logs": logs,
                "actions": actions or [],
                **(extra or {}),
            }
            return json.dumps(payload) + "\n"

        yield emit("START", [
            f"▶ Pipeline started for {employee_name} ({employee_id})",
            f"  Run date : {run_date}",
            f"  Dry run  : {settings.DRY_RUN}",
            f"  Supabase : {settings.SUPABASE_URL[:40]}..." if settings.SUPABASE_URL else "  Supabase : NOT CONFIGURED",
        ])

        for update in stream_pipeline(employee_id, employee_name, department, run_date):
            if "__final__" in update:
                state = update["__final__"]
                if state.get("node5_hil_required"):
                    result = state.get("node5_result", {})
                    yield emit("NODE5_HIL_PAUSE", result.get("logs", []), result.get("actions", []), {
                        "hil_required": True,
                        "flags": state.get("node5_flags", {}),
                        "draft_narrative": state.get("node5_draft_narrative", ""),
                        "employee_id": employee_id,
                        "employee_name": employee_name,
                        "run_date": run_date,
                    })
                else:
                    yield emit("PIPELINE_COMPLETE", [f"✅ Pipeline complete for {employee_name}"])
                continue

            for node_name, payload in update.items():
                if node_name == "__interrupt__":
                    continue
                result_key = {
                    "node1_absence": "node1_result",
                    "node2_leave": "node2_result",
                    "node3_overtime": "node3_result",
                    "node4_escalation": "node4_result",
                    "node5_anomaly": "node5_result",
                }.get(node_name)
                event_name = {
                    "node1_absence": "NODE1_DONE",
                    "node2_leave": "NODE2_DONE",
                    "node3_overtime": "NODE3_DONE",
                    "node4_escalation": "NODE4_DONE",
                    "node5_anomaly": "NODE5_DONE",
                }.get(node_name)
                result = payload.get(result_key, {}) if isinstance(payload, dict) and result_key else {}
                if result and event_name:
                    yield emit(event_name, result.get("logs", []), result.get("actions", []))

    return StreamingResponse(_stream(), media_type="application/x-ndjson")


@app.get("/api/status/{employee_id}")
def get_status(employee_id: str, run_date: Optional[str] = None):
    """Return the latest pipeline state for an employee."""
    run_date = run_date or date.today().isoformat()
    state = get_thread_state(employee_id, run_date)
    if not state:
        return {"status": "no_run", "employee_id": employee_id, "run_date": run_date}
    return {
        "status": "paused_hil" if state.get("node5_hil_required") else "complete",
        "employee_id": employee_id,
        "run_date": run_date,
        "state": state,
    }


@app.get("/api/hil/pending")
def get_pending_hil():
    """Return all pipeline runs currently paused at Node 5 HIL."""
    return get_paused_threads()


@app.post("/api/hil/approve")
def approve_hil(req: HILApproveRequest):
    """HR approves the narrative — write to DB and mark complete."""
    run_date = req.run_date or date.today().isoformat()
    try:
        updated_state = resume_after_hil(req.employee_id, req.approved_text, run_date)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {
        "status": "approved",
        "employee_id": req.employee_id,
        "narrative_length": len(req.approved_text),
        "logs": updated_state.get("node5_result", {}).get("logs", []),
        "actions": updated_state.get("node5_result", {}).get("actions", []),
    }


@app.post("/api/hil/reject")
def reject_hil(req: HILRejectRequest):
    """HR rejects the narrative — mark as rejected, no DB write."""
    run_date = req.run_date or date.today().isoformat()
    try:
        reject_after_hil(req.employee_id, run_date)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"status": "rejected", "employee_id": req.employee_id}


# ── Dashboard HTML (served at /) ─────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
def dashboard():
    html_path = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if os.path.exists(html_path):
        with open(html_path, encoding="utf-8") as f:
            return f.read()
    return HTMLResponse("<h2>Static files not found. Run from attendance_agent_poc/ directory.</h2>")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.POC_HOST,
        port=settings.POC_PORT,
        reload=True,
        log_level="info",
    )
