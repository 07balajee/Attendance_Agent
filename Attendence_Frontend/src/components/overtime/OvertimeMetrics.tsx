import React from 'react';
import { OvertimeMonthlySummary } from '../../types/overtime';
import { Clock, IndianRupee, CheckCircle2, AlertCircle } from 'lucide-react';

interface OvertimeMetricsProps {
  summary: OvertimeMonthlySummary;
}

export const OvertimeMetrics: React.FC<OvertimeMetricsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total OT Hours</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-slate-900">{summary.totalHours} hrs</div>
        <p className="mt-1 text-[11px] text-slate-400">Current calendar month</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total OT Pay</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <IndianRupee className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-emerald-700">
          ₹{summary.totalPay.toLocaleString()}
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Calculated (Hours × Rate)</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Synced Records</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-slate-900">{summary.syncedRecords}</div>
        <p className="mt-1 text-[11px] text-slate-400">Written to dynamic_checkup_data</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending OT Claims</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-slate-900">{summary.pendingRecords}</div>
        <p className="mt-1 text-[11px] text-slate-400">Awaiting manager approval</p>
      </div>
    </div>
  );
};
