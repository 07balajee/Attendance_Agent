import React, { useState } from 'react';
import { LeaveRequest } from '../../types/leave';
import { OvertimeRequest } from '../../types/overtime';
import { ExpenseRequest } from '../../types/expense';
import { Badge } from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, ArrowRight, Check, X } from 'lucide-react';

interface PendingRequestsTabsProps {
  leaveRequests: LeaveRequest[];
  overtimeRequests: OvertimeRequest[];
  expenses: ExpenseRequest[];
  onReviewLeave: (req: LeaveRequest) => void;
  onReviewOvertime: (req: OvertimeRequest) => void;
  onReviewExpense: (req: ExpenseRequest) => void;
}

export const PendingRequestsTabs: React.FC<PendingRequestsTabsProps> = ({
  leaveRequests,
  overtimeRequests,
  expenses,
  onReviewLeave,
  onReviewOvertime,
  onReviewExpense,
}) => {
  const [activeTab, setActiveTab] = useState<'leave' | 'overtime' | 'expenses'>('leave');
  const navigate = useNavigate();

  const pendingLeaves = leaveRequests.filter((r) => r.status === 'Pending');
  const pendingOT = overtimeRequests.filter((r) => r.status === 'Pending');
  const pendingExpenses = expenses.filter((r) => r.status === 'Pending');

  const getSLABadge = (ageBd?: number, slaStatus?: string) => {
    if (slaStatus === 'breached' || (ageBd && ageBd >= 5)) {
      return (
        <Badge variant="red" size="sm" dot>
          SLA Breached ({ageBd}d)
        </Badge>
      );
    }
    if (slaStatus === 'warning' || (ageBd && ageBd >= 2)) {
      return (
        <Badge variant="amber" size="sm" dot>
          Approaching ({ageBd}d)
        </Badge>
      );
    }
    return (
      <Badge variant="green" size="sm">
        Within SLA ({ageBd || 1}d)
      </Badge>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-5 pt-4 pb-0 gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Pending Requests Queue</h3>
          <p className="text-xs text-slate-500">Human review queue managed with automated agent SLA tracking</p>
        </div>

        <div className="flex items-center gap-1 border-b sm:border-none border-slate-200">
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'leave'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Leave</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
              {pendingLeaves.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('overtime')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overtime'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Overtime</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
              {pendingOT.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Expenses</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
              {pendingExpenses.length}
            </span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Request Type</th>
              <th className="py-3 px-4">Submitted On</th>
              <th className="py-3 px-4">Age (BD)</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">SLA Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {activeTab === 'leave' &&
              pendingLeaves.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{req.employee_name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span>{req.type} Leave ({req.days}d)</span>
                      {req.is_excess_leave && (
                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                          ⚠ Excess Leave
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{req.applied_on}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{req.age_bd || 1} days</td>
                  <td className="py-3 px-4">
                    <Badge variant="amber">Pending</Badge>
                  </td>
                  <td className="py-3 px-4">{getSLABadge(req.age_bd, req.sla_status)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onReviewLeave(req)}
                      className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}

            {activeTab === 'overtime' &&
              pendingOT.map((ot) => (
                <tr key={ot.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{ot.employee_name}</td>
                  <td className="py-3 px-4">
                    <span>
                      {ot.hours} hrs @ ₹{ot.rate}/hr = <strong className="text-slate-900">₹{ot.amount.toLocaleString()}</strong>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{ot.applied_on}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{ot.age_bd || 1} days</td>
                  <td className="py-3 px-4">
                    <Badge variant="amber">Pending</Badge>
                  </td>
                  <td className="py-3 px-4">{getSLABadge(ot.age_bd, ot.sla_status)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onReviewOvertime(ot)}
                      className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}

            {activeTab === 'expenses' &&
              pendingExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{exp.employee_name}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{exp.expense_type}</span>
                      <span className="text-[11px] text-slate-500">₹{exp.amount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{exp.applied_on}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{exp.age_bd || 1} days</td>
                  <td className="py-3 px-4">
                    {exp.reviewed_by?.includes('auto-escalated') ? (
                      <Badge variant="red" size="sm">
                        Auto-Escalated
                      </Badge>
                    ) : (
                      <Badge variant="amber">Pending</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">{getSLABadge(exp.age_bd, exp.sla_status)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onReviewExpense(exp)}
                      className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
