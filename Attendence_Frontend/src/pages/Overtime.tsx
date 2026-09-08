import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { OvertimeMetrics } from '../components/overtime/OvertimeMetrics';
import { OvertimeDetailDrawer } from '../components/overtime/OvertimeDetailDrawer';
import { overtimeService } from '../services/overtimeService';
import { OvertimeRequest, OvertimeMonthlySummary, OvertimeStatus } from '../types/overtime';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../hooks/useToast';
import { Clock, IndianRupee, Layers, CheckCircle2, AlertCircle, Search } from 'lucide-react';

export const Overtime: React.FC = () => {
  const { selectedDepartment } = useOutletContext<{ selectedDepartment: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [summary, setSummary] = useState<OvertimeMonthlySummary | null>(null);

  // Tabs: Pending, Approved, Rejected, Payroll Synced
  const [activeTab, setActiveTab] = useState<OvertimeStatus | 'Payroll Synced'>('Pending');
  const [search, setSearch] = useState('');

  // Drawer
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, summ] = await Promise.all([
        overtimeService.getOvertimeRequests({
          status: activeTab,
          department: selectedDepartment,
          search,
        }),
        overtimeService.getOvertimeSummary(),
      ]);
      setRequests(reqs);
      setSummary(summ);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedDepartment, search]);

  const handleApprove = async (id: string) => {
    await overtimeService.approveOvertime(id, 'Manager');
    showToast(
      'success',
      'Overtime Approved & Synced',
      'Overtime hours & pay synced into attendance_records.dynamic_checkup_data by Node 3.'
    );
    loadData();
  };

  const handleReject = async (id: string, reason: string) => {
    await overtimeService.rejectOvertime(id, 'Manager', reason);
    showToast('info', 'Overtime Rejected', 'Claim has been marked as rejected.');
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Monthly Summary Cards */}
      {summary && <OvertimeMetrics summary={summary} />}

      {/* Node 3 Data Flow Architecture Note */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-blue-900 font-medium">
          <Layers className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Node 3 Overtime Rule:</strong> Approved overtime is written into{' '}
            <code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-bold">
              attendance_records.dynamic_checkup_data
            </code>{' '}
            (overtime_hours and overtime_amount). Direct payroll APIs are NOT called; payroll module reads from dynamic_checkup_data.
          </span>
        </div>
        <span className="rounded-md bg-white border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
          Node 3 Subagent
        </span>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Navigation Tabs and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-5 pt-4 pb-3 gap-3">
          <div className="flex items-center gap-1">
            {(['Pending', 'Approved', 'Rejected', 'Payroll Synced'] as const).map((tab) => (
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
              placeholder="Search employee or claim ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-56 rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Overtime Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : requests.length === 0 ? (
          <EmptyState
            title={`No ${activeTab} overtime claims`}
            description="There are currently no overtime requests matching this filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Work Date</th>
                  <th className="py-3 px-4">Hours</th>
                  <th className="py-3 px-4">Hourly Rate</th>
                  <th className="py-3 px-4">Calculation (Hours × Rate)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payroll Sync</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((ot) => (
                  <tr key={ot.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{ot.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {ot.employee_id} • {ot.department}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{ot.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{ot.hours} hrs</td>
                    <td className="py-3 px-4 text-slate-600">₹{ot.rate}/hr</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>{ot.hours}h × ₹{ot.rate} =</span>
                        <span className="text-emerald-700">₹{ot.amount.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {ot.status === 'Pending' && <Badge variant="amber">Pending</Badge>}
                      {ot.status === 'Approved' && <Badge variant="green">Approved</Badge>}
                      {ot.status === 'Rejected' && <Badge variant="red">Rejected</Badge>}
                    </td>
                    <td className="py-3 px-4">
                      {ot.payroll_synced ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Synced (Node 3)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unsynced</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRequest(ot)}
                        className="rounded-lg bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        {ot.status === 'Pending' ? 'Review Claim' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overtime Drawer */}
      <OvertimeDetailDrawer
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};
