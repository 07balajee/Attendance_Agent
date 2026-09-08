import React from 'react';
import { Database, ArrowRight, ArrowLeftRight, ShieldCheck } from 'lucide-react';

export const DataFlowDiagram: React.FC = () => {
  const flows = [
    {
      table: 'attendance_records',
      role: 'Core attendance logs & dynamic checkup store',
      nodes: [
        { name: 'Node 1 (Absence)', type: 'READ + WRITE', note: 'Inserts Absent rows, auto-closes sign-outs' },
        { name: 'Node 3 (Overtime)', type: 'READ + WRITE', note: 'Writes OT hours & amount into dynamic_checkup_data' },
        { name: 'Node 5 (Anomaly)', type: 'READ + WRITE', note: 'Reads 30d trends, writes anomaly_note post-HIL' },
      ],
    },
    {
      table: 'leave_requests',
      role: 'Leave applications & approval state',
      nodes: [
        { name: 'Node 2 (Leave)', type: 'READ + WRITE', note: 'Sets is_excess_leave=true & SLA warnings' },
        { name: 'Node 4 (Escalation)', type: 'READ + WRITE', note: 'Flags SLA breaches ≥ 5 business days' },
      ],
    },
    {
      table: 'employee_balances',
      role: 'Leave quotas & remaining balance',
      nodes: [
        { name: 'Node 2 (Leave)', type: 'READ ONLY', note: 'Strictly read-only; compares days against remaining' },
      ],
    },
    {
      table: 'overtime_requests',
      role: 'Overtime hours, rate, and manager approvals',
      nodes: [
        { name: 'Node 3 (Overtime)', type: 'READ ONLY', note: 'Reads approved OT rows for current pay period' },
        { name: 'Node 4 (Escalation)', type: 'READ + WRITE', note: 'SLA warnings and breach escalations' },
      ],
    },
    {
      table: 'expenses',
      role: 'Employee reimbursement claims',
      nodes: [
        { name: 'Node 4 (Escalation)', type: 'READ + WRITE', note: 'Sets reviewed_by="System (auto-escalated)" on breach' },
      ],
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Database Contract & Data Flow Mapping
          </h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Schema Changes: NONE</span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Strict adherence to existing Supabase Postgres schema. Nodes store enriched data (overtime amount and anomaly narratives) directly into <code>attendance_records.dynamic_checkup_data</code> (JSONB).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
        {flows.map((flow) => (
          <div
            key={flow.table}
            className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {flow.table}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{flow.role}</p>

              <div className="mt-3 space-y-2 border-t border-slate-200/60 pt-2.5">
                {flow.nodes.map((n, i) => (
                  <div key={i} className="text-xs rounded-lg bg-white p-2 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-[11px]">{n.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          n.type.includes('WRITE')
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {n.type}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500 leading-tight">{n.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
