import React from 'react';
import { EmployeeLeaveBalance } from '../../types/leave';
import { HeartPulse, Coffee, CalendarCheck, Shield } from 'lucide-react';

interface LeaveBalanceCardsProps {
  balances: EmployeeLeaveBalance[];
}

export const LeaveBalanceCards: React.FC<LeaveBalanceCardsProps> = ({ balances }) => {
  // Aggregate company-wide or default overview
  const casualTotal = balances
    .filter((b) => b.leave_type === 'Casual')
    .reduce((acc, b) => ({ alloc: acc.alloc + b.allocated, rem: acc.rem + b.remaining }), { alloc: 0, rem: 0 });
  const sickTotal = balances
    .filter((b) => b.leave_type === 'Sick')
    .reduce((acc, b) => ({ alloc: acc.alloc + b.allocated, rem: acc.rem + b.remaining }), { alloc: 0, rem: 0 });
  const earnedTotal = balances
    .filter((b) => b.leave_type === 'Earned')
    .reduce((acc, b) => ({ alloc: acc.alloc + b.allocated, rem: acc.rem + b.remaining }), { alloc: 0, rem: 0 });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Casual Leave */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Casual Leave (CL)</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Coffee className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">{casualTotal.rem}</span>
          <span className="text-xs text-slate-400 font-medium">days remaining in pool</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
          <span>Total Allocated: {casualTotal.alloc} days</span>
          <span className="text-blue-600 font-semibold">12 days/yr quota</span>
        </div>
      </div>

      {/* Sick Leave */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sick Leave (SL)</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <HeartPulse className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">{sickTotal.rem}</span>
          <span className="text-xs text-slate-400 font-medium">days remaining in pool</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
          <span>Total Allocated: {sickTotal.alloc} days</span>
          <span className="text-emerald-600 font-semibold">10 days/yr quota</span>
        </div>
      </div>

      {/* Earned Leave */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Earned Leave (EL)</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <CalendarCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">{earnedTotal.rem}</span>
          <span className="text-xs text-slate-400 font-medium">days remaining in pool</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
          <span>Total Allocated: {earnedTotal.alloc} days</span>
          <span className="text-purple-600 font-semibold">15 days/yr quota</span>
        </div>
      </div>
    </div>
  );
};
