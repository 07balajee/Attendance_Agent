import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { SLATimeline } from '../components/sla/SLATimeline';
import { LeaveDetailDrawer } from '../components/leave/LeaveDetailDrawer';
import { OvertimeDetailDrawer } from '../components/overtime/OvertimeDetailDrawer';
import { ExpenseDetailDrawer } from '../components/expenses/ExpenseDetailDrawer';

import { leaveService } from '../services/leaveService';
import { overtimeService } from '../services/overtimeService';
import { expenseService } from '../services/expenseService';

import { LeaveRequest } from '../types/leave';
import { OvertimeRequest } from '../types/overtime';
import { ExpenseRequest } from '../types/expense';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../hooks/useToast';

import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const SLAEscalations: React.FC = () => {
  const { selectedDepartment } = useOutletContext<{ selectedDepartment: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);

  // Tabs: All, Leave, Overtime, Expenses
  const [activeTab, setActiveTab] = useState<'All' | 'Leave' | 'Overtime' | 'Expenses'>('All');
  const [search, setSearch] = useState('');

  // Drawers
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [selectedOvertime, setSelectedOvertime] = useState<OvertimeRequest | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [l, ot, exp] = await Promise.all([
        leaveService.getLeaveRequests({ department: selectedDepartment }),
        overtimeService.getOvertimeRequests({ department: selectedDepartment }),
        expenseService.getExpenses({ department: selectedDepartment }),
      ]);
      setLeaves(l);
      setOvertime(ot);
      setExpenses(exp);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDepartment]);

  // Combine items requiring SLA monitoring (Pending items)
  const pendingLeaves = leaves.filter((r) => r.status === 'Pending');
  const pendingOT = overtime.filter((r) => r.status === 'Pending');
  const pendingExp = expenses.filter((r) => r.status === 'Pending');

  const totalPending = pendingLeaves.length + pendingOT.length + pendingExp.length;

  const approachingItems = [
    ...pendingLeaves.filter((r) => (r.age_bd || 0) >= 2 && (r.age_bd || 0) < 5),
    ...pendingOT.filter((r) => (r.age_bd || 0) >= 2 && (r.age_bd || 0) < 5),
    ...pendingExp.filter((r) => (r.age_bd || 0) >= 2 && (r.age_bd || 0) < 5),
  ];

  const breachedItems = [
    ...pendingLeaves.filter((r) => (r.age_bd || 0) >= 5),
    ...pendingOT.filter((r) => (r.age_bd || 0) >= 5),
    ...pendingExp.filter((r) => (r.age_bd || 0) >= 5),
  ];

  const escalatedItems = expenses.filter((e) => e.reviewed_by?.includes('auto-escalated'));

  // Unified items list
  interface UnifiedItem {
    id: string;
    typeCategory: 'Leave' | 'Overtime' | 'Expense';
    employeeName: string;
    employeeId: string;
    department: string;
    summary: string;
    appliedOn: string;
    ageBd: number;
    managementNote: string;
    slaStatus: 'warning' | 'breached' | 'normal';
    isEscalated: boolean;
    raw: any;
  }

  const unifiedList: UnifiedItem[] = [
    ...pendingLeaves.map((l) => ({
      id: l.id,
      typeCategory: 'Leave' as const,
      employeeName: l.employee_name,
      employeeId: l.employee_id,
      department: l.department,
      summary: `${l.type} Leave (${l.days} days)${l.is_excess_leave ? ' • ⚠ Excess' : ''}`,
      appliedOn: l.applied_on,
      ageBd: l.age_bd || 1,
      managementNote: l.management_note || '',
      slaStatus: (l.age_bd || 0) >= 5 ? ('breached' as const) : (l.age_bd || 0) >= 2 ? ('warning' as const) : ('normal' as const),
      isEscalated: (l.age_bd || 0) >= 5,
      raw: l,
    })),
    ...pendingOT.map((ot) => ({
      id: ot.id,
      typeCategory: 'Overtime' as const,
      employeeName: ot.employee_name,
      employeeId: ot.employee_id,
      department: ot.department,
      summary: `${ot.hours} hrs @ ₹${ot.rate}/hr = ₹${ot.amount}`,
      appliedOn: ot.applied_on,
      ageBd: ot.age_bd || 1,
      managementNote: ot.management_note || '',
      slaStatus: (ot.age_bd || 0) >= 5 ? ('breached' as const) : (ot.age_bd || 0) >= 2 ? ('warning' as const) : ('normal' as const),
      isEscalated: (ot.age_bd || 0) >= 5,
      raw: ot,
    })),
    ...pendingExp.map((e) => ({
      id: e.id,
      typeCategory: 'Expense' as const,
      employeeName: e.employee_name,
      employeeId: e.employee_id,
      department: e.department,
      summary: `${e.expense_type} • ₹${e.amount.toLocaleString()}`,
      appliedOn: e.applied_on,
      ageBd: e.age_bd || 1,
      managementNote: e.management_note || '',
      slaStatus: (e.age_bd || 0) >= 5 ? ('breached' as const) : (e.age_bd || 0) >= 2 ? ('warning' as const) : ('normal' as const),
      isEscalated: !!e.reviewed_by?.includes('auto-escalated'),
      raw: e,
    })),
  ];

  const filteredUnified = unifiedList
    .filter((item) => {
      if (activeTab !== 'All' && item.typeCategory !== activeTab) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.employeeName.toLowerCase().includes(q) ||
          item.employeeId.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => b.ageBd - a.ageBd); // Sort oldest first

  return (
    <div className="space-y-6">
      {/* 4 SLA Overview Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Requests
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalPending}</div>
          <p className="mt-1 text-[11px] text-slate-400">Total awaiting resolution</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Approaching SLA
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800">{approachingItems.length}</div>
          <p className="mt-1 text-[11px] text-amber-700">≥ 2 business days</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              SLA Breached
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-800">{breachedItems.length}</div>
          <p className="mt-1 text-[11px] text-rose-700">≥ 5 business days</p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Auto-Escalated
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-800">{escalatedItems.length}</div>
          <p className="mt-1 text-[11px] text-purple-700">System stamp attached</p>
        </div>
      </div>

      {/* Visual Timeline Progression */}
      <SLATimeline />

      {/* Unified Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Navigation Tabs and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-5 pt-4 pb-3 gap-3">
          <div className="flex items-center gap-1">
            {(['All', 'Leave', 'Overtime', 'Expenses'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee, summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-56 rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : filteredUnified.length === 0 ? (
          <EmptyState
            title="All requests within SLA"
            description="No pending requests currently exceed warning or breach thresholds."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Pipeline</th>
                  <th className="py-3 px-4">Request Summary</th>
                  <th className="py-3 px-4">Submitted On</th>
                  <th className="py-3 px-4">Age (Business Days)</th>
                  <th className="py-3 px-4">SLA Watchdog Status</th>
                  <th className="py-3 px-4">Agent Note</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUnified.map((item) => (
                  <tr key={`${item.typeCategory}_${item.id}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.employeeId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-700 text-[10px]">
                        {item.typeCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.summary}</td>
                    <td className="py-3 px-4 text-slate-500">{item.appliedOn}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-black text-sm ${
                          item.ageBd >= 5
                            ? 'text-rose-600'
                            : item.ageBd >= 2
                            ? 'text-amber-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {item.ageBd} days
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.isEscalated ? (
                        <Badge variant="purple" size="sm" dot>
                          Auto-Escalated
                        </Badge>
                      ) : item.slaStatus === 'breached' ? (
                        <Badge variant="red" size="sm" dot>
                          SLA Breached
                        </Badge>
                      ) : item.slaStatus === 'warning' ? (
                        <Badge variant="amber" size="sm" dot>
                          Approaching SLA
                        </Badge>
                      ) : (
                        <Badge variant="green" size="sm">
                          Within SLA
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-[220px]">
                      {item.managementNote ? (
                        <span className="text-slate-600 truncate block text-[11px]" title={item.managementNote}>
                          {item.managementNote}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (item.typeCategory === 'Leave') setSelectedLeave(item.raw);
                          if (item.typeCategory === 'Overtime') setSelectedOvertime(item.raw);
                          if (item.typeCategory === 'Expense') setSelectedExpense(item.raw);
                        }}
                        className="rounded-lg bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawers */}
      <LeaveDetailDrawer
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        request={selectedLeave}
        onApprove={async (id) => {
          await leaveService.approveLeaveRequest(id);
          showToast('success', 'Leave Approved', 'SLA resolved.');
          loadData();
        }}
        onReject={async (id, r) => {
          await leaveService.rejectLeaveRequest(id, 'HR Admin', r);
          showToast('info', 'Leave Rejected', 'SLA resolved.');
          loadData();
        }}
      />

      <OvertimeDetailDrawer
        isOpen={!!selectedOvertime}
        onClose={() => setSelectedOvertime(null)}
        request={selectedOvertime}
        onApprove={async (id) => {
          await overtimeService.approveOvertime(id);
          showToast('success', 'Overtime Approved', 'SLA resolved & synced.');
          loadData();
        }}
        onReject={async (id, r) => {
          await overtimeService.rejectOvertime(id, 'Manager', r);
          showToast('info', 'Overtime Rejected', 'SLA resolved.');
          loadData();
        }}
      />

      <ExpenseDetailDrawer
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onApprove={async (id) => {
          await expenseService.approveExpense(id);
          showToast('success', 'Expense Approved', 'SLA resolved.');
          loadData();
        }}
        onReject={async (id, r) => {
          await expenseService.rejectExpense(id, 'Finance Manager', r);
          showToast('info', 'Expense Rejected', 'SLA resolved.');
          loadData();
        }}
      />
    </div>
  );
};
