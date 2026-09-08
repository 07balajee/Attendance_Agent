import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { LeaveBalanceCards } from '../components/leave/LeaveBalanceCards';
import { LeaveDetailDrawer } from '../components/leave/LeaveDetailDrawer';
import { leaveService } from '../services/leaveService';
import { LeaveRequest, EmployeeLeaveBalance, LeaveStatus } from '../types/leave';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../hooks/useToast';
import {
  CalendarDays,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  Filter,
  Search,
} from 'lucide-react';

export const LeaveManagement: React.FC = () => {
  const { selectedDepartment } = useOutletContext<{ selectedDepartment: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<EmployeeLeaveBalance[]>([]);

  // Filter tabs: Pending, Approved, Rejected, Excess Leave
  const [activeTab, setActiveTab] = useState<LeaveStatus | 'Excess Leave'>('Pending');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');

  // Drawer
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, bals] = await Promise.all([
        leaveService.getLeaveRequests({
          status: activeTab,
          type: selectedType,
          department: selectedDepartment,
          search,
        }),
        leaveService.getLeaveBalances(),
      ]);
      setRequests(reqs);
      setBalances(bals);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedType, selectedDepartment, search]);

  const handleApprove = async (id: string) => {
    await leaveService.approveLeaveRequest(id, 'HR Admin');
    showToast('success', 'Leave Approved', 'Request successfully approved. Balance deducted.');
    loadData();
  };

  const handleReject = async (id: string, reason: string) => {
    await leaveService.rejectLeaveRequest(id, 'HR Admin', reason);
    showToast('info', 'Leave Rejected', 'Request rejected and feedback logged.');
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
        Normal ({ageBd || 1}d)
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Leave Quota Cards */}
      <LeaveBalanceCards balances={balances} />

      {/* Human Authority Preservation Notice */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-blue-900 font-medium">
          <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Node 2 Rule:</strong> Excess leave is flagged automatically when requested days exceed
            remaining quota, but <strong>human approval authority is strictly preserved</strong>. Agents do NOT auto-reject.
          </span>
        </div>
        <span className="rounded-md bg-white border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
          Deterministic Rule
        </span>
      </div>

      {/* Requests Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Navigation Tabs and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-5 pt-4 pb-3 gap-3">
          <div className="flex items-center gap-1 border-b sm:border-none border-slate-200">
            {(['Pending', 'Approved', 'Rejected', 'Excess Leave'] as const).map((tab) => (
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

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-48 rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-700 outline-none cursor-pointer"
            >
              <option>All Types</option>
              <option>Casual</option>
              <option>Sick</option>
              <option>Earned</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : requests.length === 0 ? (
          <EmptyState
            title={`No ${activeTab} leave requests`}
            description="There are currently no leave requests in this category."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Days Requested</th>
                  <th className="py-3 px-4">Remaining Balance</th>
                  <th className="py-3 px-4">Applied On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Excess Leave</th>
                  <th className="py-3 px-4">SLA Watchdog</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{req.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {req.employee_id} • {req.department}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{req.type}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{req.days} days</td>
                    <td className="py-3 px-4 text-slate-600">{req.remaining_balance} days</td>
                    <td className="py-3 px-4 text-slate-500">{req.applied_on}</td>
                    <td className="py-3 px-4">
                      {req.status === 'Pending' && <Badge variant="amber">Pending</Badge>}
                      {req.status === 'Approved' && <Badge variant="green">Approved</Badge>}
                      {req.status === 'Rejected' && <Badge variant="red">Rejected</Badge>}
                    </td>
                    <td className="py-3 px-4">
                      {req.is_excess_leave ? (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                          <AlertTriangle className="h-3 w-3" /> Excess Leave
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Normal</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {req.status === 'Pending' ? getSLABadge(req.age_bd, req.sla_status) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="rounded-lg bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        {req.status === 'Pending' ? 'Review & Decide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Details Drawer */}
      <LeaveDetailDrawer
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};
