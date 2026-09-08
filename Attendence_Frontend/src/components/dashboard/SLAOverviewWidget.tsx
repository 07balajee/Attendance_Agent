import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

interface SLAOverviewWidgetProps {
  approachingCount: number;
  breachedCount: number;
  escalatedCount: number;
}

export const SLAOverviewWidget: React.FC<SLAOverviewWidgetProps> = ({
  approachingCount,
  breachedCount,
  escalatedCount,
}) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">SLA Watchdog Overview</h3>
          <p className="text-xs text-slate-500">Managed deterministically by Node 4 Escalation Agent</p>
        </div>
        <button
          onClick={() => navigate('/sla')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <span>SLA Center</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Approaching SLA Card */}
        <div
          onClick={() => navigate('/sla?status=warning')}
          className="cursor-pointer rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Approaching SLA</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-900">{approachingCount}</div>
          <p className="mt-0.5 text-[11px] text-amber-700 leading-snug">
            Pending ≥ 2 business days
          </p>
        </div>

        {/* SLA Breached Card */}
        <div
          onClick={() => navigate('/sla?status=breached')}
          className="cursor-pointer rounded-xl border border-rose-200/80 bg-rose-50/40 p-3.5 hover:border-rose-300 transition-colors"
        >
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">SLA Breached</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-900">{breachedCount}</div>
          <p className="mt-0.5 text-[11px] text-rose-700 leading-snug">
            Pending ≥ 5 business days
          </p>
        </div>

        {/* Auto-Escalated Card */}
        <div
          onClick={() => navigate('/sla?status=escalated')}
          className="cursor-pointer rounded-xl border border-purple-200/80 bg-purple-50/40 p-3.5 hover:border-purple-300 transition-colors"
        >
          <div className="flex items-center justify-between text-purple-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Auto-Escalated</span>
            <ShieldAlert className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-900">{escalatedCount}</div>
          <p className="mt-0.5 text-[11px] text-purple-700 leading-snug">
            Node 4 system stamped
          </p>
        </div>
      </div>
    </div>
  );
};
