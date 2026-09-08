import React from 'react';
import { Drawer } from '../common/Drawer';
import { AgentNodeConfig } from '../../types/agent';
import { Badge } from '../common/Badge';
import {
  Bot,
  Database,
  Cpu,
  Layers,
  Sparkles,
  FileCode,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface NodeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: AgentNodeConfig | null;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ isOpen, onClose, node }) => {
  if (!node) return null;

  const isHybrid = node.type === 'hybrid_llm';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Node ${node.nodeNumber} — ${node.name}`}
      subtitle={node.role}
      width="lg"
    >
      <div className="space-y-6">
        {/* Technology Classification Badge Card */}
        <div
          className={`rounded-2xl border p-4 ${
            isHybrid ? 'border-purple-200 bg-purple-50/40' : 'border-emerald-200 bg-emerald-50/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className={`h-4 w-4 ${isHybrid ? 'text-purple-600' : 'text-emerald-600'}`} />
              <span className="text-xs font-bold text-slate-900">Technology Classification</span>
            </div>
            <Badge variant={isHybrid ? 'purple' : 'green'} size="sm">
              {node.technologyBadge}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-slate-700 leading-relaxed">
            {isHybrid
              ? 'Node 5 operates in two stages: Part A uses deterministic rule algorithms to detect flags. Part B conditionally calls Anthropic Claude 3.5 Sonnet to draft manager narratives.'
              : 'Deterministic rule-based agent. Operates strictly using deterministic business logic without non-deterministic AI halluncinations.'}
          </p>
        </div>

        {/* Operational Description */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Agent Role & Mission
          </span>
          <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">{node.description}</p>
        </div>

        {/* Database Tables Interacted With */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Postgres / Supabase Data Contracts
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Input Tables (Read)</span>
              <div className="mt-1 font-mono text-[11px] text-slate-800 space-y-1">
                {node.inputTables.map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Output Tables (Written)</span>
              <div className="mt-1 font-mono text-[11px] text-slate-800 space-y-1">
                {node.outputTables.map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="font-bold text-slate-800">Fields Mutated:</span>{' '}
            <code className="text-slate-700">{node.writesSummary}</code>
          </div>
        </div>

        {/* Specific Business Rules */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Execution Rules (HLD Specifications)
          </span>
          <ul className="space-y-2 text-xs text-slate-700">
            {node.rulesSummary.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-normal">{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Execution Metrics (Demo Snapshot) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Last Execution Telemetry (emp_004 Run)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Demo Values</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white p-2 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
              <div className="font-bold text-emerald-700 mt-0.5">Completed</div>
            </div>
            <div className="rounded-lg bg-white p-2 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Latency</span>
              <div className="font-bold text-slate-800 mt-0.5">{isHybrid ? '1,850 ms' : '420 ms'}</div>
            </div>
            <div className="rounded-lg bg-white p-2 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Errors</span>
              <div className="font-bold text-slate-800 mt-0.5">0</div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
