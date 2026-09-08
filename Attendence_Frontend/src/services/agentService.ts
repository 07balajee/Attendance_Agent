import { AgentNodeConfig, AgentThread, HILQueueItem } from '../types/agent';
import { EmployeeBrief } from '../types/common';
import { AGENT_NODES_CONFIG, MOCK_AGENT_THREADS } from '../data/mockAgentThreads';
import { MOCK_HIL_QUEUE } from '../data/mockHILQueue';
import { API_BASE_URL, getSettings } from './apiConfig';

export const RUN_DATE = new Date().toISOString().slice(0, 10);

let threads: AgentThread[] = [...MOCK_AGENT_THREADS];
let hilQueue: HILQueueItem[] = [...MOCK_HIL_QUEUE];

export interface PipelineStreamEvent {
  node: string;
  logs: string[];
  actions?: any[];
  hil_required?: boolean;
  flags?: Record<string, any>;
  draft_narrative?: string;
  employee_id?: string;
  employee_name?: string;
  run_date?: string;
}

export const agentService = {
  getAgentNodes(): AgentNodeConfig[] {
    return AGENT_NODES_CONFIG;
  },

  async getEmployees(): Promise<EmployeeBrief[]> {
    const settings = getSettings();
    if (settings.useLiveBackendIfAvailable) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employees`, {
          signal: AbortSignal.timeout(1500),
        });
        if (res.ok) {
          const liveEmployees = await res.json();
          if (Array.isArray(liveEmployees)) {
            return liveEmployees.map((employee: any) => ({
              id: employee.id,
              name: employee.name || employee.full_name || employee.id,
              department: employee.department || 'General',
              role: employee.role || employee.level || '',
              email: employee.email || '',
              overtimeRate: employee.overtime_rate,
            }));
          }
        }
      } catch {
        // Fall back to the local demo employees when the API is unavailable.
      }
    }

    const { MOCK_EMPLOYEES } = await import('../data/mockEmployees');
    return [...MOCK_EMPLOYEES];
  },

  async getAgentThreads(): Promise<AgentThread[]> {
    const settings = getSettings();
    if (settings.useLiveBackendIfAvailable) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/threads`, {
          signal: AbortSignal.timeout(1500),
        });
        if (res.ok) {
          const liveThreads = await res.json();
          if (Array.isArray(liveThreads)) {
            return liveThreads as AgentThread[];
          }
        }
      } catch {
        // Fall back to the local demo data when the API is unavailable.
      }
    }

    await new Promise((r) => setTimeout(r, 100));
    return [...threads];
  },

  async getHILQueue(): Promise<HILQueueItem[]> {
    const settings = getSettings();
    if (settings.useLiveBackendIfAvailable) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/hil/pending`, {
          signal: AbortSignal.timeout(1500),
        });
        if (res.ok) {
          const livePending = await res.json();
          if (Array.isArray(livePending)) {
            // merge with mock for display richness
            const liveItems: HILQueueItem[] = livePending.map((p: any, idx: number) => ({
              id: `live_hil_${idx}`,
              thread_id: `attendance-${p.employee_id}-${p.run_date}`,
              employee_id: p.employee_id,
              employee_name: p.employee_name || p.employee_id,
              department: 'General',
              run_date: p.run_date,
              anomaly_types: Object.keys(p.flags || {}),
              flags: p.flags || {},
              draft_narrative: p.draft_narrative || '',
              created_at: new Date().toISOString(),
              waiting_minutes: 5,
              status: 'Waiting for Review',
            }));
            return liveItems;
          }
        }
      } catch {
        // fallback to local mock
      }
    }

    await new Promise((r) => setTimeout(r, 150));
    return [...hilQueue];
  },

  async approveHILNarrative(
    threadId: string,
    employeeId: string,
    approvedText: string,
    runDate: string = RUN_DATE
  ): Promise<{ status: string; approvedText: string }> {
    const settings = getSettings();

    // Try live backend first if enabled
    if (settings.useLiveBackendIfAvailable) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/hil/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: employeeId,
            run_date: runDate,
            approved_text: approvedText,
          }),
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) throw new Error(`HIL approval failed (${res.status})`);
      } catch {
        if (settings.useLiveBackendIfAvailable) throw new Error('Unable to reach the agent backend for HIL approval.');
      }
    }

    await new Promise((r) => setTimeout(r, 250));

    // Update in-memory threads
    const tIdx = threads.findIndex((t) => t.thread_id === threadId || t.employee_id === employeeId);
    if (tIdx >= 0) {
      threads[tIdx] = {
        ...threads[tIdx],
        status: 'Completed',
        current_node: 'END',
        hil_required: false,
        hil_completed: true,
        approved_narrative: approvedText,
        logs: [
          ...threads[tIdx].logs,
          `[Node 5] HR approved narrative: "${approvedText.slice(0, 60)}..."`,
          `[Node 5] ✓ Written to attendance_records.dynamic_checkup_data["anomaly_note"]`,
          `✅ Pipeline completed after Human Review.`,
        ],
      };
    }

    // Update HIL queue
    hilQueue = hilQueue.filter((item) => item.employee_id !== employeeId);

    return { status: 'approved', approvedText };
  },

  async rejectHILNarrative(
    threadId: string,
    employeeId: string,
    runDate: string = RUN_DATE
  ): Promise<{ status: string }> {
    const settings = getSettings();
    if (settings.useLiveBackendIfAvailable) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/hil/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: employeeId,
            run_date: runDate,
          }),
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) throw new Error(`HIL rejection failed (${res.status})`);
      } catch {
        if (settings.useLiveBackendIfAvailable) throw new Error('Unable to reach the agent backend for HIL rejection.');
      }
    }

    await new Promise((r) => setTimeout(r, 200));

    const tIdx = threads.findIndex((t) => t.thread_id === threadId || t.employee_id === employeeId);
    if (tIdx >= 0) {
      threads[tIdx] = {
        ...threads[tIdx],
        status: 'Completed',
        current_node: 'END',
        hil_required: false,
        logs: [
          ...threads[tIdx].logs,
          `[Node 5] HR discarded/rejected draft narrative. No DB write occurred.`,
          `✅ Pipeline completed without committing narrative.`,
        ],
      };
    }

    hilQueue = hilQueue.filter((item) => item.employee_id !== employeeId);
    return { status: 'rejected' };
  },

  async runPipelineStream(
    employeeId: string,
    employeeName: string,
    department: string,
    runDate: string = RUN_DATE,
    dryRun: boolean = true,
    onEvent: (event: PipelineStreamEvent) => void
  ): Promise<void> {
    const settings = getSettings();

    // Check if live backend can be streamed
    if (settings.useLiveBackendIfAvailable) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/run/${employeeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ run_date: runDate, dry_run: dryRun }),
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const parsed = JSON.parse(line);
                  onEvent(parsed);
                } catch {
                  // ignore non-json lines
                }
              }
            }
          }
          return;
        }
      } catch {
        // Fall back to robust simulation below
      }
    }

    // High fidelity simulator adhering strictly to HLD logic
    const threadId = `attendance-${employeeId}-${runDate}`;

    onEvent({
      node: 'START',
      logs: [
        `▶ LangGraph Master Orchestrator initialized`,
        `  Thread ID : ${threadId}`,
        `  Employee  : ${employeeName} (${employeeId})`,
        `  Run Date  : ${runDate}`,
        `  Dry Run   : ${dryRun ? 'TRUE (Safe Demo Mode)' : 'FALSE (Live Write)'}`,
      ],
    });
    await new Promise((r) => setTimeout(r, 450));

    // ── Node 1 ─────────────────────────────────────────────────
    onEvent({
      node: 'NODE1_START',
      logs: ['⚙ Node 1 — Absence Marking Agent running (Deterministic)...'],
    });
    await new Promise((r) => setTimeout(r, 550));

    const isAbsentEmp = employeeId === 'emp_004' || employeeId === 'emp_012';
    const n1Logs = [
      `[Node 1] Checking attendance row for ${runDate}...`,
      isAbsentEmp
        ? `[Node 1] No swipe detected on working day. Created approval_status="Absent" row. (dry_run=${dryRun})`
        : `[Node 1] Valid sign-in found. Sign-out checked against 21:00 threshold. No auto-close needed.`,
    ];
    onEvent({
      node: 'NODE1_DONE',
      logs: n1Logs,
      actions: isAbsentEmp ? [{ action: 'INSERT_ABSENT', employee_id: employeeId }] : [],
    });
    await new Promise((r) => setTimeout(r, 500));

    // ── Node 2 ─────────────────────────────────────────────────
    onEvent({
      node: 'NODE2_START',
      logs: ['⚙ Node 2 — Leave Balance Enforcement Agent running (Deterministic)...'],
    });
    await new Promise((r) => setTimeout(r, 550));

    const hasExcessLeave = employeeId === 'emp_004' || employeeId === 'emp_008';
    const n2Logs = [
      `[Node 2] Reading pending leave_requests & checking employee_balances...`,
      hasExcessLeave
        ? `[Node 2] ⚠ Excess leave detected: requested days > remaining balance. Flagged is_excess_leave=true (Preserved human approval authority).`
        : `[Node 2] All requested days are within available leave quota.`,
    ];
    onEvent({
      node: 'NODE2_DONE',
      logs: n2Logs,
      actions: hasExcessLeave ? [{ action: 'EXCESS_LEAVE_FLAGGED', employee_id: employeeId }] : [],
    });
    await new Promise((r) => setTimeout(r, 500));

    // ── Node 3 ─────────────────────────────────────────────────
    onEvent({
      node: 'NODE3_START',
      logs: ['⚙ Node 3 — Overtime-to-Payroll Sync Agent running (Deterministic)...'],
    });
    await new Promise((r) => setTimeout(r, 550));

    const hasApprovedOT = employeeId === 'emp_002';
    const n3Logs = [
      `[Node 3] Reading approved overtime for pay period 2026-09...`,
      hasApprovedOT
        ? `[Node 3] Found 1 approved OT: 8 hrs × ₹300/hr = ₹2,400. Patched attendance_records.dynamic_checkup_data. (dry_run=${dryRun})`
        : `[Node 3] No approved overtime in current month. Skipped sync.`,
    ];
    onEvent({
      node: 'NODE3_DONE',
      logs: n3Logs,
      actions: hasApprovedOT
        ? [{ action: 'OT_SYNC_TO_ATTENDANCE', hours: 8, amount: 2400 }]
        : [],
    });
    await new Promise((r) => setTimeout(r, 500));

    // ── Node 4 ─────────────────────────────────────────────────
    onEvent({
      node: 'NODE4_START',
      logs: ['⚙ Node 4 — Expense & Request Escalation Agent running (Deterministic)...'],
    });
    await new Promise((r) => setTimeout(r, 550));

    const hasBreach = employeeId === 'emp_004' || employeeId === 'emp_003';
    const n4Logs = [
      `[Node 4] Scanning leave, overtime, and expenses against 2-day warning & 5-day breach SLA...`,
      hasBreach
        ? `[Node 4] ⚠ SLA BREACH DETECTED: Item pending > 5 business days. Prepended breach note; auto-escalated expense review stamp. Added to shared escalation_list.`
        : `[Node 4] All pending items are within 2 business days. SLA compliant.`,
    ];
    onEvent({
      node: 'NODE4_DONE',
      logs: n4Logs,
      actions: hasBreach ? [{ action: 'SLA_BREACH_ESCALATED', employee_id: employeeId }] : [],
    });
    await new Promise((r) => setTimeout(r, 500));

    // ── Node 5 ─────────────────────────────────────────────────
    onEvent({
      node: 'NODE5_START',
      logs: ['⚙ Node 5 — Anomaly Detection & Narrative Agent running (Hybrid)...'],
    });
    await new Promise((r) => setTimeout(r, 600));

    const hasAnomalyFlags = employeeId === 'emp_004' || employeeId === 'emp_005';

    if (hasAnomalyFlags) {
      const draftNarrative =
        employeeId === 'emp_004'
          ? 'The employee has recorded five late arrivals past 09:30 and two unapproved absences in the last 30 days, alongside three missing daily checkup logs. An SLA-breached leave request and overdue equipment expense remain open. Recommend conducting a structured 1-on-1 check-in to identify workload challenges or commute constraints.'
          : 'The employee has utilized 3 isolated single-day leaves across the past month, predominantly adjacent to weekends. While all leaves were pre-approved within policy, frequent short-notice disruptions may affect product delivery cycles. Recommend an informal review of quarterly leave planning.';

      onEvent({
        node: 'NODE5_HIL_PAUSE',
        logs: [
          `[Node 5 Part A] Deterministic check flagged behavioral patterns!`,
          `[Node 5 Part B] Invoked Anthropic API (Claude 3.5 Sonnet) to generate manager narrative draft.`,
          `[Node 5] Draft completed (${draftNarrative.length} chars).`,
          `[Node 5] ⏸ LangGraph interrupt() invoked! Thread paused waiting for Human Review.`,
        ],
        hil_required: true,
        draft_narrative: draftNarrative,
        employee_id: employeeId,
        employee_name: employeeName,
        run_date: runDate,
      });

      // Update thread in-memory
      const tIdx = threads.findIndex((t) => t.employee_id === employeeId);
      if (tIdx >= 0) {
        threads[tIdx].status = 'Paused — HIL';
        threads[tIdx].current_node = 'node5_anomaly';
        threads[tIdx].hil_required = true;
      }
    } else {
      onEvent({
        node: 'NODE5_DONE',
        logs: [
          `[Node 5 Part A] Evaluated 30-day window: no anomaly flags triggered.`,
          `[Node 5] Zero flags found → LLM not invoked → no HIL pause required.`,
        ],
      });
      await new Promise((r) => setTimeout(r, 300));
      onEvent({
        node: 'PIPELINE_COMPLETE',
        logs: [
          `✅ LangGraph pipeline successfully completed for ${employeeName}.`,
          `Thread marked as Completed.`,
        ],
      });

      const tIdx = threads.findIndex((t) => t.employee_id === employeeId);
      if (tIdx >= 0) {
        threads[tIdx].status = 'Completed';
        threads[tIdx].current_node = 'END';
        threads[tIdx].hil_required = false;
      }
    }
  },
};
