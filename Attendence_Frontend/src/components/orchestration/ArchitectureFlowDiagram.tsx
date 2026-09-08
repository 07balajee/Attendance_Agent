import React from 'react';
import { AgentNodeConfig } from '../../types/agent';
import {
  Calendar,
  Zap,
  Bot,
  UserCheck,
  CalendarDays,
  Clock,
  ShieldAlert,
  Sparkles,
  ArrowDown,
  CheckCircle,
  PauseCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ArchitectureFlowDiagramProps {
  nodes: AgentNodeConfig[];
  onSelectNode: (node: AgentNodeConfig) => void;
}

export const ArchitectureFlowDiagram: React.FC<ArchitectureFlowDiagramProps> = ({
  nodes,
  onSelectNode,
}) => {
  const getNodeIcon = (nodeId: string) => {
    switch (nodeId) {
      case 'node1_absence':
        return UserCheck;
      case 'node2_leave':
        return CalendarDays;
      case 'node3_overtime':
        return Clock;
      case 'node4_escalation':
        return ShieldAlert;
      case 'node5_anomaly':
        return Sparkles;
      default:
        return Bot;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Attendance Agentic Orchestration Architecture
            </h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
              HLD Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Single LangGraph Master Orchestrator wiring 5 subagent nodes with conditional HIL pause
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Deterministic (Nodes 1–4)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            Hybrid + Anthropic LLM (Node 5)
          </span>
        </div>
      </div>

      {/* Trigger Sources Layer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
          Trigger Sources (Outside Orchestrator)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">1. Nightly Scheduled Sweep</span>
                <span className="rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700">
                  23:30 Local
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Nightly batch execution running one isolated LangGraph thread per active employee.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">2. Event-Driven Triggers</span>
                <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700">
                  Instantaneous
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Operates outside nightly cadence: Leave Approved/Rejected, Overtime Approved, Expense Approved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Down Arrow */}
      <div className="flex justify-center text-slate-300">
        <ArrowDown className="h-5 w-5" />
      </div>

      {/* Master Orchestrator Header */}
      <div className="rounded-2xl border-2 border-blue-600/30 bg-blue-50/20 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-blue-100 pb-3 mb-5 gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">LangGraph Master Orchestrator</h4>
              <p className="text-xs text-blue-700 font-medium">
                One independent thread per employee: <code>attendance-{'{employee_id}'}-{'{YYYY-MM-DD}'}</code>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            StateGraph Workflow
          </span>
        </div>

        {/* Sequential Nodes 1 to 5 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {nodes.map((node) => {
            const IconComponent = getNodeIcon(node.id);
            const isHybrid = node.type === 'hybrid_llm';

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`group cursor-pointer rounded-xl border p-4 bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between ${
                  isHybrid
                    ? 'border-purple-200 hover:border-purple-400'
                    : 'border-slate-200 hover:border-blue-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isHybrid
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold font-mono text-slate-400">
                      Node {node.nodeNumber}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {node.name}
                  </h5>

                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-3 leading-snug">
                    {node.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isHybrid
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isHybrid ? 'Hybrid + LLM' : 'Deterministic'}
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold group-hover:underline">
                    Inspect ➔
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Down Arrow from Node 5 */}
        <div className="flex justify-center text-slate-300 my-4">
          <ArrowDown className="h-5 w-5" />
        </div>

        {/* Branching from Node 5 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Branch A: No Flags Found */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-900">No Anomaly Flags Detected</span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                  Fast Exit
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                Zero anomaly flags raised. Anthropic API is <strong>NOT invoked</strong>, thread completes
                immediately without human pause.
              </p>
              <div className="mt-2 text-[10px] font-bold text-emerald-700">➔ Thread Status: Completed</div>
            </div>
          </div>

          {/* Branch B: Flags Found -> HIL Pause */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 flex items-start gap-3">
            <PauseCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-900">Anomaly Flags Detected</span>
                <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-800">
                  HIL Triggered
                </span>
              </div>
              <p className="text-[11px] text-purple-800 mt-1 leading-relaxed">
                Anthropic API generates manager narrative draft ➔ LangGraph <code>interrupt()</code> pauses
                thread ➔ HR reviews & edits draft ➔ <code>Command(resume)</code> writes <code>anomaly_note</code>.
              </p>
              <div className="mt-2 text-[10px] font-bold text-purple-700">
                ➔ Thread Status: Paused — HIL Review
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
