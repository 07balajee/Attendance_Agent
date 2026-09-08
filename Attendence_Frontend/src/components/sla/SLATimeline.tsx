import React from 'react';
import { Clock, AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export const SLATimeline: React.FC = () => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">SLA Progression Lifecycle</h3>
          <p className="text-xs text-slate-500">
            Node 4 evaluates business days elapsed since request submission
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
          Strict HLD Rules
        </span>
      </div>

      <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-3 pt-2">
        {/* Step 1 */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Day 0–1</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-xs font-bold text-slate-900">Submitted & Active</div>
            <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
              Request logged into database. Within standard turnaround SLA.
            </p>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 py-0.5 px-2 rounded-md w-fit">
            Status: Normal
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center text-slate-300">
          <ArrowRight className="h-4 w-4" />
        </div>

        {/* Step 2 */}
        <div className="flex-1 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Day 2–4</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-xs font-bold text-amber-900">SLA Warning Threshold</div>
            <p className="mt-0.5 text-[11px] text-amber-800 leading-snug">
              Node 4 appends: <em>"Pending review required — approaching SLA."</em>
            </p>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-amber-800 bg-amber-100/70 py-0.5 px-2 rounded-md w-fit">
            ≥ 2 Business Days
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center text-slate-300">
          <ArrowRight className="h-4 w-4" />
        </div>

        {/* Step 3 */}
        <div className="flex-1 rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Day 5+</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <div className="text-xs font-bold text-rose-900">SLA Breached</div>
            <p className="mt-0.5 text-[11px] text-rose-800 leading-snug">
              Node 4 appends: <em>"SLA breached — immediate action required."</em>
            </p>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-rose-800 bg-rose-100/70 py-0.5 px-2 rounded-md w-fit">
            ≥ 5 Business Days
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center text-slate-300">
          <ArrowRight className="h-4 w-4" />
        </div>

        {/* Step 4 */}
        <div className="flex-1 rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Auto-Escalation</span>
            <ShieldAlert className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="text-xs font-bold text-purple-900">System Escalation Stamp</div>
            <p className="mt-0.5 text-[11px] text-purple-800 leading-snug">
              On expenses: sets <code>reviewed_by = "System (auto-escalated)"</code>.
            </p>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-purple-800 bg-purple-100/70 py-0.5 px-2 rounded-md w-fit">
            Pushed to Node 5 Context
          </div>
        </div>
      </div>
    </div>
  );
};
