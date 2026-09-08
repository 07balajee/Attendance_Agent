"""
orchestrator.py — LangGraph Master Graph

Wires the 5 subagent nodes into a single StateGraph.
One thread per employee (thread_id = "attendance-{employee_id}-{run_date}").

Flow:
  START → node1 → node2 → node3 → node4 → node5 → END
                                                    ↑
                                              (HIL pause here
                                               if flags found)

State schema:
  employee_id          : str
  employee_name        : str
  department           : str
  run_date             : str  (YYYY-MM-DD)
  escalation_list      : list  (built by nodes 2 & 4, consumed by node 5)
  node1_result         : dict
  node2_result         : dict
  node3_result         : dict
  node4_result         : dict
  node5_result         : dict
  node5_hil_required   : bool
  node5_draft_narrative: str
  node5_flags          : dict
  node5_hil_completed  : bool
"""
import sys
import os
import logging
from datetime import date
from typing import Any, Dict, List, TypedDict, Optional

# ── path fix so agents/ imports work ─────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from langgraph.graph import StateGraph, START, END
from langgraph.types import Command, interrupt
from langgraph.checkpoint.sqlite import SqliteSaver

import agents.node1_absence as node1
import agents.node2_leave as node2
import agents.node3_overtime as node3
import agents.node4_escalation as node4
import agents.node5_anomaly as node5

logger = logging.getLogger(__name__)

# ── State schema ──────────────────────────────────────────────────────────────
class AgentState(TypedDict, total=False):
    employee_id: str
    employee_name: str
    department: str
    run_date: str
    escalation_list: List[Dict]
    node1_result: Dict
    node2_result: Dict
    node3_result: Dict
    node4_result: Dict
    node5_result: Dict
    node5_hil_required: bool
    node5_draft_narrative: str
    node5_flags: Dict
    node5_hil_completed: bool


# ── Checkpoint store (SQLite, stored inside poc folder) ──────────────────────
_CHECKPOINT_DB = os.path.join(os.path.dirname(__file__), "..", "checkpointer", "agent_state.db")
os.makedirs(os.path.dirname(_CHECKPOINT_DB), exist_ok=True)


def _build_graph(checkpointer):
    """Build and compile the LangGraph StateGraph."""
    graph = StateGraph(AgentState)

    # Register nodes
    graph.add_node("node1_absence",    node1.run)
    graph.add_node("node2_leave",      node2.run)
    graph.add_node("node3_overtime",   node3.run)
    graph.add_node("node4_escalation", node4.run)
    graph.add_node("node5_anomaly",    node5.run)
    graph.add_node("node5_hil_gate",   _hil_gate)

    # Linear edges
    graph.add_edge(START,              "node1_absence")
    graph.add_edge("node1_absence",    "node2_leave")
    graph.add_edge("node2_leave",      "node3_overtime")
    graph.add_edge("node3_overtime",   "node4_escalation")
    graph.add_edge("node4_escalation", "node5_anomaly")
    graph.add_edge("node5_anomaly",    "node5_hil_gate")
    graph.add_edge("node5_hil_gate",   END)

    return graph.compile(checkpointer=checkpointer)


def _hil_gate(state: AgentState) -> AgentState:
    """Pause only for flagged runs and resume with the approved narrative."""
    if not state.get("node5_hil_required"):
        return state

    decision = interrupt({
        "type": "attendance_narrative_review",
        "employee_id": state.get("employee_id"),
        "employee_name": state.get("employee_name"),
        "run_date": state.get("run_date"),
        "flags": state.get("node5_flags", {}),
        "draft_narrative": state.get("node5_draft_narrative", ""),
    })
    if isinstance(decision, dict) and decision.get("decision") == "reject":
        result = dict(state.get("node5_result", {}))
        logs = list(result.get("logs", []))
        logs.append("[Node 5] HR rejected the draft narrative. No DB write occurred.")
        return {
            **state,
            "node5_result": {
                **result,
                "logs": logs,
                "hil_required": False,
                "hil_completed": True,
                "hil_rejected": True,
            },
            "node5_hil_required": False,
            "node5_hil_completed": True,
        }

    return node5.commit_approved_narrative(state, str(decision))


def run_pipeline(
    employee_id: str,
    employee_name: str,
    department: str = "",
    run_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Run the full 5-node pipeline for one employee.
    Returns the final state dict.
    If Node 5 sets hil_required=True, the state is checkpointed and returned
    with node5_hil_required=True — the caller must then call resume_after_hil().
    """
    run_date = run_date or date.today().isoformat()
    thread_id = f"attendance-{employee_id}-{run_date}"

    initial_state: AgentState = {
        "employee_id": employee_id,
        "employee_name": employee_name,
        "department": department,
        "run_date": run_date,
        "escalation_list": [],
    }

    with SqliteSaver.from_conn_string(_CHECKPOINT_DB) as checkpointer:
        app = _build_graph(checkpointer)
        config = {"configurable": {"thread_id": thread_id}}

        logger.info("Starting pipeline for %s (thread: %s)", employee_id, thread_id)

        # Run until END or the conditional HIL gate.
        for _ in app.stream(initial_state, config=config):
            pass

        # Get the actual state from the checkpointer
        snapshot = app.get_state(config)
        return dict(snapshot.values) if snapshot else {}


def resume_after_hil(
    employee_id: str,
    approved_narrative: str,
    run_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Resume a paused thread after HR approves the Node 5 narrative.
    Commits the approved text to the DB and marks HIL as complete.
    """
    run_date = run_date or date.today().isoformat()
    thread_id = f"attendance-{employee_id}-{run_date}"

    with SqliteSaver.from_conn_string(_CHECKPOINT_DB) as checkpointer:
        app = _build_graph(checkpointer)
        config = {"configurable": {"thread_id": thread_id}}

        # Get current paused state
        snapshot = app.get_state(config)
        if not snapshot:
            raise ValueError(f"No paused state found for thread {thread_id}")

        current_state = dict(snapshot.values)

        if not current_state.get("node5_hil_required"):
            raise ValueError(f"Thread {thread_id} is not waiting for HIL approval")

        # Resume the graph so the HIL gate owns the commit and final transition.
        app.invoke(Command(resume=approved_narrative), config=config)
        snapshot = app.get_state(config)
        updated_state = dict(snapshot.values) if snapshot else {}

        logger.info("HIL resumed for %s — narrative committed.", employee_id)
        return updated_state


def reject_after_hil(
    employee_id: str,
    run_date: Optional[str] = None,
) -> Dict[str, Any]:
    """Resume a paused thread without committing an anomaly narrative."""
    run_date = run_date or date.today().isoformat()
    thread_id = f"attendance-{employee_id}-{run_date}"

    with SqliteSaver.from_conn_string(_CHECKPOINT_DB) as checkpointer:
        app = _build_graph(checkpointer)
        config = {"configurable": {"thread_id": thread_id}}
        snapshot = app.get_state(config)
        if not snapshot or not snapshot.values.get("node5_hil_required"):
            raise ValueError(f"No paused HIL state found for thread {thread_id}")
        app.invoke(Command(resume={"decision": "reject"}), config=config)
        snapshot = app.get_state(config)
        return dict(snapshot.values) if snapshot else {}


def get_thread_state(employee_id: str, run_date: Optional[str] = None) -> Dict[str, Any]:
    """Read one employee thread from the LangGraph checkpoint store."""
    run_date = run_date or date.today().isoformat()
    thread_id = f"attendance-{employee_id}-{run_date}"
    if not os.path.exists(_CHECKPOINT_DB):
        return {}
    with SqliteSaver.from_conn_string(_CHECKPOINT_DB) as checkpointer:
        app = _build_graph(checkpointer)
        snapshot = app.get_state({"configurable": {"thread_id": thread_id}})
        return dict(snapshot.values) if snapshot else {}


def stream_pipeline(
    employee_id: str,
    employee_name: str,
    department: str = "",
    run_date: Optional[str] = None,
):
    """Yield LangGraph update events and a final checkpoint-backed state."""
    run_date = run_date or date.today().isoformat()
    thread_id = f"attendance-{employee_id}-{run_date}"
    initial_state: AgentState = {
        "employee_id": employee_id,
        "employee_name": employee_name,
        "department": department,
        "run_date": run_date,
        "escalation_list": [],
    }

    with SqliteSaver.from_conn_string(_CHECKPOINT_DB) as checkpointer:
        app = _build_graph(checkpointer)
        config = {"configurable": {"thread_id": thread_id}}
        for update in app.stream(initial_state, config=config, stream_mode="updates"):
            yield update
        snapshot = app.get_state(config)
        yield {"__final__": dict(snapshot.values) if snapshot else {}}


def get_paused_threads() -> List[Dict[str, Any]]:
    """Return all threads currently paused at Node 5 HIL."""
    import sqlite3
    paused = []
    if not os.path.exists(_CHECKPOINT_DB):
        return paused
    try:
        conn = sqlite3.connect(_CHECKPOINT_DB)
        cursor = conn.execute(
            "SELECT thread_id FROM checkpoints WHERE checkpoint IS NOT NULL"
        )
        rows = cursor.fetchall()
        conn.close()
        # Filter to threads that have hil_required in their state
        with SqliteSaver.from_conn_string(_CHECKPOINT_DB) as checkpointer:
            # Build a minimal graph to read states
            graph = StateGraph(AgentState)
            graph.add_node("node5_anomaly", node5.run)
            graph.add_edge(START, "node5_anomaly")
            graph.add_edge("node5_anomaly", END)
            app = graph.compile(checkpointer=checkpointer)

            for (thread_id,) in rows:
                try:
                    config = {"configurable": {"thread_id": thread_id}}
                    snapshot = app.get_state(config)
                    if snapshot:
                        state = dict(snapshot.values)
                        if state.get("node5_hil_required") and not state.get("node5_hil_completed"):
                            paused.append({
                                "thread_id": thread_id,
                                "employee_id": state.get("employee_id"),
                                "employee_name": state.get("employee_name"),
                                "run_date": state.get("run_date"),
                                "flags": state.get("node5_flags", {}),
                                "draft_narrative": state.get("node5_draft_narrative", ""),
                            })
                except Exception:
                    pass
    except Exception as e:
        logger.error("Error reading paused threads: %s", e)
    return paused
