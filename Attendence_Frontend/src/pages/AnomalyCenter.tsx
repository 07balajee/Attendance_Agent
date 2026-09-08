import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { anomalyService } from '../services/anomalyService';
import { agentService } from '../services/agentService';
import { AnomalyRecord, AnomalySummaryStats, AnomalyType } from '../types/anomaly';
import { HILQueueItem } from '../types/agent';
import { HILReviewModal } from '../components/hil/HILReviewModal';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../hooks/useToast';
import {
  AlertTriangle,
  Clock,
  Calendar,
  UserX,
  CheckSquare,
  Layers,
  Sparkles,
  Bot,
  Search,
  CheckCircle,
  Eye,
  PauseCircle,
} from 'lucide-react';

export const AnomalyCenter: React.FC = () => {
  const { selectedDepartment } = useOutletContext<{ selectedDepartment: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [stats, setStats] = useState<AnomalySummaryStats | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedSignalType, setSelectedSignalType] = useState<string>('All');

  // HIL Modal State
  const [selectedHILItem, setSelectedHILItem] = useState<HILQueueItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [anomList, summary] = await Promise.all([
        anomalyService.getAnomalies({
          severity: selectedSeverity,
          department: selectedDepartment,
          search,
        }),
        anomalyService.getAnomalySummary(),
      ]);
      setAnomalies(anomList);
      setStats(summary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDepartment, selectedSeverity, search]);

  const handleOpenHIL = (anom: AnomalyRecord) => {
    const hilItem: HILQueueItem = {
      id: anom.id,
      thread_id: anom.thread_id || `attendance-${anom.employee_id}-2026-09-07`,
      employee_id: anom.employee_id,
      employee_name: anom.employee_name,
      department: anom.department,
      run_date: '2026-09-07',
      anomaly_types: [anom.detected_signal.title],
      flags: {
        [anom.detected_signal.type]: {
          count: anom.detected_signal.count,
          threshold: anom.detected_signal.threshold,
          message: anom.detected_signal.message,
        },
      },
      draft_narrative:
        anom.draft_narrative ||
        `The employee has shown recurring behavioral flags: ${anom.detected_signal.message} Suggest conducting a check-in conversation.`,
      created_at: anom.detected_on,
      waiting_minutes: 35,
      status: 'Waiting for Review',
    };

    setSelectedHILItem(hilItem);
  };

  const filteredAnomalies = anomalies.filter((a) => {
    if (selectedSignalType !== 'All' && a.detected_signal.type !== selectedSignalType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 5 Top Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Anomalies
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
            <p className="text-[11px] text-slate-400">Evaluated over 30d/90d</p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Critical Severity
            </span>
            <div className="text-2xl font-black text-rose-700 mt-1">{stats.critical}</div>
            <p className="text-[11px] text-rose-600">Late & Repeated Absence</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Warning Severity
            </span>
            <div className="text-2xl font-black text-amber-700 mt-1">{stats.warning}</div>
            <p className="text-[11px] text-amber-600">Checkups & Leaves</p>
          </div>

          <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
              Under HIL Review
            </span>
            <div className="text-2xl font-black text-purple-700 mt-1">{stats.underReview}</div>
            <p className="text-[11px] text-purple-600">Threads paused at Node 5</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Resolved & Committed
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.resolved}</div>
            <p className="text-[11px] text-emerald-600">Narrative written to DB</p>
          </div>
        </div>
      )}

      {/* Strict HLD Signal Thresholds Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 tracking-tight">
              Deterministic Anomaly Detection Signals (HLD Section 11 Specification)
            </h4>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Fixed Thresholds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
          <div
            onClick={() => setSelectedSignalType(selectedSignalType === 'habitual_late' ? 'All' : 'habitual_late')}
            className={`cursor-pointer rounded-xl border p-3 transition-colors ${
              selectedSignalType === 'habitual_late'
                ? 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-500'
                : 'border-slate-100 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-xs font-bold">Habitual Late Arrival</span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-700">first_sign_in &gt; 09:30</div>
            <div className="mt-0.5 text-[10px] text-slate-500 font-semibold">≥ 4 days in past 30 days</div>
          </div>

          <div
            onClick={() => setSelectedSignalType(selectedSignalType === 'frequent_short_leave' ? 'All' : 'frequent_short_leave')}
            className={`cursor-pointer rounded-xl border p-3 transition-colors ${
              selectedSignalType === 'frequent_short_leave'
                ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500'
                : 'border-slate-100 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-bold">Frequent Short Leave</span>
              <Calendar className="h-4 w-4" />
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-700">1-day approved leaves</div>
            <div className="mt-0.5 text-[10px] text-slate-500 font-semibold">≥ 3 leaves in past 30 days</div>
          </div>

          <div
            onClick={() => setSelectedSignalType(selectedSignalType === 'repeated_absence' ? 'All' : 'repeated_absence')}
            className={`cursor-pointer rounded-xl border p-3 transition-colors ${
              selectedSignalType === 'repeated_absence'
                ? 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-500'
                : 'border-slate-100 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-xs font-bold">Repeated Absence</span>
              <UserX className="h-4 w-4" />
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-700">status = "Absent"</div>
            <div className="mt-0.5 text-[10px] text-slate-500 font-semibold">≥ 2 rows in past 30 days</div>
          </div>

          <div
            onClick={() => setSelectedSignalType(selectedSignalType === 'missing_checkup' ? 'All' : 'missing_checkup')}
            className={`cursor-pointer rounded-xl border p-3 transition-colors ${
              selectedSignalType === 'missing_checkup'
                ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500'
                : 'border-slate-100 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-bold">Missing Checkup</span>
              <CheckSquare className="h-4 w-4" />
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-700">tasks_done is NULL</div>
            <div className="mt-0.5 text-[10px] text-slate-500 font-semibold">≥ 3 days in past 30 days</div>
          </div>

          <div
            onClick={() => setSelectedSignalType(selectedSignalType === 'excess_leave_pattern' ? 'All' : 'excess_leave_pattern')}
            className={`cursor-pointer rounded-xl border p-3 transition-colors ${
              selectedSignalType === 'excess_leave_pattern'
                ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500'
                : 'border-slate-100 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-xs font-bold">Excess Leave Pattern</span>
              <Layers className="h-4 w-4" />
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-700">is_excess_leave = true</div>
            <div className="mt-0.5 text-[10px] text-slate-500 font-semibold">≥ 2 requests in 90 days</div>
          </div>
        </div>
      </div>

      {/* Main Anomaly Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-5 pt-4 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Detected Behavioral Anomalies</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              Showing {filteredAnomalies.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee, ID, signal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical Only</option>
              <option value="Warning">Warning Only</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : filteredAnomalies.length === 0 ? (
          <EmptyState
            title="No anomalies detected"
            description="No employee records currently breach the 30-day or 90-day threshold patterns."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Detected Signal</th>
                  <th className="py-3 px-4">Occurrences vs Threshold</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detected On</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAnomalies.map((anom) => (
                  <tr key={anom.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{anom.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{anom.employee_id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{anom.department}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{anom.detected_signal.title}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={anom.detected_signal.message}>
                        {anom.detected_signal.message}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">
                        {anom.detected_signal.count} occurrences
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        (min {anom.detected_signal.threshold})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {anom.detected_signal.timeWindowDays} days
                    </td>
                    <td className="py-3 px-4">
                      {anom.detected_signal.severity === 'Critical' ? (
                        <Badge variant="red" size="sm" dot>Critical</Badge>
                      ) : (
                        <Badge variant="amber" size="sm" dot>Warning</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {anom.status === 'Under Review' || anom.status === 'Drafted' ? (
                        <Badge variant="purple" size="sm">Paused HIL</Badge>
                      ) : anom.status === 'Resolved' ? (
                        <Badge variant="green" size="sm">Resolved</Badge>
                      ) : (
                        <Badge variant="amber" size="sm">Detected</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {anom.detected_on.slice(0, 10)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {anom.status === 'Under Review' || anom.status === 'Drafted' ? (
                        <button
                          onClick={() => handleOpenHIL(anom)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
                        >
                          <PauseCircle className="h-3.5 w-3.5" />
                          <span>Review in HIL</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenHIL(anom)}
                          className="rounded-lg bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HIL Review Modal */}
      <HILReviewModal
        isOpen={!!selectedHILItem}
        onClose={() => setSelectedHILItem(null)}
        item={selectedHILItem}
        onApproveAndCommit={async (approvedText) => {
          if (!selectedHILItem) return;
          await agentService.approveHILNarrative(
            selectedHILItem.thread_id,
            selectedHILItem.employee_id,
            approvedText,
            selectedHILItem.run_date
          );
          showToast(
            'success',
            'Narrative Committed',
            'Command(resume) executed. Approved manager narrative written to dynamic_checkup_data.'
          );
          loadData();
        }}
        onReject={async () => {
          if (!selectedHILItem) return;
          await agentService.rejectHILNarrative(
            selectedHILItem.thread_id,
            selectedHILItem.employee_id,
            selectedHILItem.run_date
          );
          showToast('info', 'Draft Discarded', 'Thread resumed and closed without writing an anomaly note.');
          loadData();
        }}
      />
    </div>
  );
};
