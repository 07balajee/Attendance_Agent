import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArchitectureFlowDiagram } from '../components/orchestration/ArchitectureFlowDiagram';
import { NodeDetailModal } from '../components/orchestration/NodeDetailModal';
import { ThreadMonitorTable } from '../components/orchestration/ThreadMonitorTable';
import { LiveExecutionModal } from '../components/orchestration/LiveExecutionModal';
import { DataFlowDiagram } from '../components/orchestration/DataFlowDiagram';
import { HILReviewModal } from '../components/hil/HILReviewModal';

import { agentService, RUN_DATE } from '../services/agentService';
import { AgentNodeConfig, AgentThread, HILQueueItem } from '../types/agent';
import { EmployeeBrief } from '../types/common';
import { Badge } from '../components/common/Badge';
import { useToast } from '../hooks/useToast';

import {
  Bot,
  Play,
  PauseCircle,
  CheckCircle,
  Terminal,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const AgentOrchestration: React.FC = () => {
  const { showToast } = useToast();

  const [nodes, setNodes] = useState<AgentNodeConfig[]>([]);
  const [threads, setThreads] = useState<AgentThread[]>([]);
  const [hilQueue, setHilQueue] = useState<HILQueueItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeBrief[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [selectedNode, setSelectedNode] = useState<AgentNodeConfig | null>(null);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [inspectThread, setInspectThread] = useState<AgentThread | null>(null);
  const [selectedHILItem, setSelectedHILItem] = useState<HILQueueItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const n = agentService.getAgentNodes();
      const [t, h, e] = await Promise.all([
        agentService.getAgentThreads(),
        agentService.getHILQueue(),
        agentService.getEmployees(),
      ]);
      setNodes(n);
      setThreads(t);
      setHilQueue(h);
      setEmployees(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewHIL = (thread: AgentThread) => {
    const queueItem = hilQueue.find((q) => q.thread_id === thread.thread_id || q.employee_id === thread.employee_id);
    if (queueItem) {
      setSelectedHILItem(queueItem);
    } else {
      // Create fallback item from thread
      setSelectedHILItem({
        id: `hil_${thread.employee_id}`,
        thread_id: thread.thread_id,
        employee_id: thread.employee_id,
        employee_name: thread.employee_name,
        department: thread.department,
        run_date: thread.run_date,
        anomaly_types: Object.keys(thread.flags || {}),
        flags: thread.flags || {},
        draft_narrative: thread.draft_narrative || 'Draft narrative pending review.',
        created_at: thread.started_at,
        waiting_minutes: 30,
        status: 'Waiting for Review',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Trigger Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                LangGraph Multi-Agent Orchestration Center
              </h2>
              <p className="text-xs text-slate-500">
                OxiqAI HRMS Attendance Autonomous Automation Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh State</span>
          </button>

          <button
            onClick={() => setRunModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Test Pipeline (Interactive)</span>
          </button>
        </div>
      </div>

      {/* Primary Architecture Flow Diagram */}
      <ArchitectureFlowDiagram nodes={nodes} onSelectNode={setSelectedNode} />

      {/* HIL Review Queue if any thread is waiting */}
      {hilQueue.length > 0 && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2">
              <PauseCircle className="h-5 w-5 text-purple-600 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-purple-950">
                  Human-in-the-Loop Review Queue (Node 5 LangGraph Checkpoints)
                </h3>
                <p className="text-xs text-purple-800">
                  Threads paused at <code>interrupt()</code> awaiting human manager narrative review
                </p>
              </div>
            </div>
            <Badge variant="purple" size="md">
              {hilQueue.length} Threads Awaiting Action
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {hilQueue.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-purple-200 bg-white p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{item.employee_name}</span>
                    <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
                      {item.run_date}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mb-2">
                    {item.employee_id} • {item.department}
                  </div>

                  <div className="text-xs space-y-1 mb-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Detected Signals:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.anomaly_types.map((type, i) => (
                        <span
                          key={i}
                          className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded border border-slate-100 mb-3">
                    "{item.draft_narrative}"
                  </p>
                </div>

                <button
                  onClick={() => setSelectedHILItem(item)}
                  className="w-full rounded-lg bg-blue-600 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Review Draft & Commit</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thread Monitoring Table */}
      <ThreadMonitorTable
        threads={threads}
        onInspectThread={(t) => setInspectThread(t)}
        onReviewHIL={handleReviewHIL}
      />

      {/* Section 17 Data Flow Mapping Diagram */}
      <DataFlowDiagram />

      {/* Modals */}
      <NodeDetailModal
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        node={selectedNode}
      />

      <LiveExecutionModal
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        employees={employees}
        onOpenHILReview={(empId, details) => {
          const q = hilQueue.find((i) => i.employee_id === empId);
          if (q) {
            setSelectedHILItem(q);
            return;
          }
          const employee = employees.find((item) => item.id === empId);
          if (employee) {
            setSelectedHILItem({
              id: `hil_${empId}`,
              thread_id: `attendance-${empId}-${details?.run_date || RUN_DATE}`,
              employee_id: empId,
              employee_name: details?.employee_name || employee.name,
              department: employee.department,
              run_date: details?.run_date || RUN_DATE,
              anomaly_types: Object.keys(details?.flags || {}),
              flags: details?.flags || {},
              draft_narrative: details?.draft_narrative || 'Draft narrative pending review.',
              created_at: new Date().toISOString(),
              waiting_minutes: 0,
              status: 'Waiting for Review',
            });
          }
        }}
      />

      {/* Thread Inspection Modal */}
      {inspectThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setInspectThread(null)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl z-10 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono">
                  Thread: {inspectThread.thread_id}
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectThread.employee_name} ({inspectThread.employee_id}) • {inspectThread.department}
                </p>
              </div>
              <Badge variant={inspectThread.status === 'Completed' ? 'green' : inspectThread.status === 'Running' ? 'blue' : 'purple'}>
                {inspectThread.status}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px]">
              <div className="rounded-xl bg-slate-950 p-4 text-emerald-400 space-y-1">
                {inspectThread.logs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectThread(null)}
                className="rounded-xl border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIL Review Modal */}
      <HILReviewModal
        isOpen={!!selectedHILItem}
        onClose={() => setSelectedHILItem(null)}
        item={selectedHILItem}
        onApproveAndCommit={async (approvedText) => {
          if (!selectedHILItem) return;
          await agentService.approveHILNarrative(
            selectedHILItem.thread_id,
            selectedHILItem.employee_id,
            approvedText,
            selectedHILItem.run_date
          );
          showToast(
            'success',
            'Narrative Committed',
            'Command(resume) executed. Approved manager narrative written to dynamic_checkup_data.'
          );
          loadData();
        }}
        onReject={async () => {
          if (!selectedHILItem) return;
          await agentService.rejectHILNarrative(
            selectedHILItem.thread_id,
            selectedHILItem.employee_id,
            selectedHILItem.run_date
          );
          showToast('info', 'Draft Discarded', 'Thread resumed without writing an anomaly note.');
          loadData();
        }}
      />
    </div>
  );
};
