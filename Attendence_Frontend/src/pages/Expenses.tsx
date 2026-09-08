import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ExpenseDetailDrawer } from '../components/expenses/ExpenseDetailDrawer';
import { expenseService } from '../services/expenseService';
import { ExpenseRequest, ExpenseStatus } from '../types/expense';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../hooks/useToast';
import {
  Receipt,
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  IndianRupee,
} from 'lucide-react';

export const Expenses: React.FC = () => {
  const { selectedDepartment } = useOutletContext<{ selectedDepartment: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);

  // Filter tabs: All, Pending, Approved, Rejected, SLA Breached, Escalated
  const [activeTab, setActiveTab] = useState<
    ExpenseStatus | 'All' | 'SLA Breached' | 'Escalated'
  >('Pending');
  const [search, setSearch] = useState('');

  // Drawer
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await expenseService.getExpenses({
        status: activeTab,
        department: selectedDepartment,
        search,
      });
      setExpenses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedDepartment, search]);

  const handleApprove = async (id: string) => {
    await expenseService.approveExpense(id, 'Finance Manager');
    showToast('success', 'Expense Approved', 'Reimbursement authorized for payment.');
    loadData();
  };

  const handleReject = async (id: string, reason: string) => {
    await expenseService.rejectExpense(id, 'Finance Manager', reason);
    showToast('info', 'Expense Rejected', 'Claim has been marked as rejected with reason.');
    loadData();
  };

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
    <div className="space-y-6">
      {/* Node 4 Escalation Rule Banner */}
      <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-purple-950 font-medium">
          <ShieldAlert className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <span>
            <strong>Node 4 Escalation Rule:</strong> Expense claims pending ≥ 5 business days are auto-stamped with{' '}
            <code>reviewed_by = "System (auto-escalated)"</code> and flagged for priority review. Human approval is strictly required before payout.
          </span>
        </div>
        <span className="rounded-md bg-white border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
          Auto-Escalated
        </span>
      </div>

      {/* Expenses Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Navigation Tabs and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-5 pt-4 pb-3 gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {(['Pending', 'All', 'SLA Breached', 'Escalated', 'Approved', 'Rejected'] as const).map(
              (tab) => (
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
              )
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-56 rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : expenses.length === 0 ? (
          <EmptyState
            title={`No ${activeTab} expenses`}
            description="There are currently no reimbursement claims matching your selection."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Expense Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Submitted On</th>
                  <th className="py-3 px-4">Age (BD)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SLA Watchdog</th>
                  <th className="py-3 px-4">Management Note</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{exp.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {exp.employee_id} • {exp.department}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{exp.expense_type}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{exp.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{exp.applied_on}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{exp.age_bd || 1} days</td>
                    <td className="py-3 px-4">
                      {exp.reviewed_by?.includes('auto-escalated') ? (
                        <Badge variant="purple" size="sm">
                          Auto-Escalated
                        </Badge>
                      ) : exp.status === 'Pending' ? (
                        <Badge variant="amber">Pending</Badge>
                      ) : exp.status === 'Approved' ? (
                        <Badge variant="green">Approved</Badge>
                      ) : (
                        <Badge variant="red">Rejected</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {exp.status === 'Pending' ? getSLABadge(exp.age_bd, exp.sla_status) : '—'}
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      {exp.management_note ? (
                        <span className="text-slate-600 truncate block text-[11px]" title={exp.management_note}>
                          {exp.management_note}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedExpense(exp)}
                        className="rounded-lg bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        {exp.status === 'Pending' ? 'Review & Settle' : 'View Claim'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      <ExpenseDetailDrawer
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};
