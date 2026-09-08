import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { EmployeeBrief } from '../../types/common';
import { agentService, PipelineStreamEvent, RUN_DATE } from '../../services/agentService';
import {
  Play,
  Terminal,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  Bot,
  Shield,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface LiveExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeBrief[];
  onOpenHILReview?: (employeeId: string, details?: PipelineStreamEvent) => void;
}

export const LiveExecutionModal: React.FC<LiveExecutionModalProps> = ({
  isOpen,
  onClose,
  employees,
  onOpenHILReview,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState('emp_004');
  const [dryRun, setDryRun] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeNode, setActiveNode] = useState<string>('IDLE');
  const [hilTriggered, setHilTriggered] = useState(false);
  const [pipelineFinished, setPipelineFinished] = useState(false);

  const selectedEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];

  const handleStartPipeline = async () => {
    if (!selectedEmp) return;
    setIsRunning(true);
    setLogs([]);
    setActiveNode('START');
    setHilTriggered(false);
    setPipelineFinished(false);

    try {
      await agentService.runPipelineStream(
        selectedEmp.id,
        selectedEmp.name,
        selectedEmp.department,
        RUN_DATE,
        dryRun,
        (event: PipelineStreamEvent) => {
          setActiveNode(event.node);
          if (event.logs && event.logs.length > 0) {
            setLogs((prev) => [...prev, ...event.logs]);
          }
          if (event.node === 'NODE5_HIL_PAUSE') {
            setHilTriggered(true);
            setIsRunning(false);
            onClose();
            onOpenHILReview?.(selectedEmp.id, event);
          }
          if (event.node === 'PIPELINE_COMPLETE') {
            setPipelineFinished(true);
            setIsRunning(false);
          }
        }
      );
    } catch (err: any) {
      setLogs((prev) => [...prev, `❌ Error executing pipeline: ${err.message}`]);
      setIsRunning(false);
    }
  };

  const nodeSteps = [
    { id: 'NODE1', name: '1. Absence', active: activeNode.includes('NODE1') },
    { id: 'NODE2', name: '2. Leave', active: activeNode.includes('NODE2') },
    { id: 'NODE3', name: '3. Overtime', active: activeNode.includes('NODE3') },
    { id: 'NODE4', name: '4. Escalation', active: activeNode.includes('NODE4') },
    { id: 'NODE5', name: '5. Anomaly + HIL', active: activeNode.includes('NODE5') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Run LangGraph Agent Pipeline"
      subtitle="Executes 5 subagent nodes on an isolated employee thread"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Controls Strip */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Select Employee</label>
              <select
                disabled={isRunning}
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id}) — {emp.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Dry Run Toggle */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Execution Mode</label>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-800">
                    {dryRun ? 'Dry Run (Safe Demo)' : 'Live DB Writes'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  disabled={isRunning}
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              Thread: <code className="font-mono text-slate-700 font-bold">attendance-{selectedEmp.id}-2026-09-07</code>
            </span>

            <button
              onClick={handleStartPipeline}
              disabled={isRunning}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isRunning ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Running Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Run Agent Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Node Progress Bar */}
        <div className="flex items-center justify-between gap-2 border-y border-slate-100 py-3">
          {nodeSteps.map((s, idx) => (
            <div
              key={s.id}
              className={`flex-1 rounded-lg px-2.5 py-1.5 text-center text-xs font-semibold transition-all ${
                s.active
                  ? 'bg-blue-600 text-white shadow-xs animate-pulse'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {s.name}
            </div>
          ))}
        </div>

        {/* Live Logs Stream */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5" />
              <span>Live Pipeline Execution Logs</span>
            </div>
            {isRunning && <span className="animate-pulse text-blue-400">● Streaming...</span>}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <span className="text-slate-600 italic">Select an employee and click Run to stream logs...</span>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={
                    log.includes('PAUSE') || log.includes('interrupt')
                      ? 'text-amber-400 font-bold'
                      : log.includes('✅') || log.includes('✓')
                      ? 'text-emerald-400'
                      : log.includes('⚠')
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Post-execution Alert & Actions */}
        {hilTriggered && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PauseCircle className="h-5 w-5 text-purple-600" />
              <div>
                <span className="text-xs font-bold text-purple-900 block">
                  LangGraph interrupt() triggered — HIL Review Required
                </span>
                <span className="text-[11px] text-purple-700">
                  Node 5 drafted a manager narrative and paused this employee's thread.
                </span>
              </div>
            </div>
            {onOpenHILReview && (
              <button
                onClick={() => {
                  onClose();
                  onOpenHILReview(selectedEmp.id);
                }}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition-colors shadow-xs"
              >
                Open HIL Review
              </button>
            )}
          </div>
        )}

        {pipelineFinished && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center gap-3 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Pipeline executed to completion without anomaly flags. No human pause needed.</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
