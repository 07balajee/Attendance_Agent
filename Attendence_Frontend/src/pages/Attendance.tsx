import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AttendanceFilterBar } from '../components/attendance/AttendanceFilterBar';
import { EmployeeAttendanceDrawer } from '../components/attendance/EmployeeAttendanceDrawer';
import { attendanceService } from '../services/attendanceService';
import { AttendanceRecord, AttendanceSummary } from '../types/attendance';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  Calendar,
  Clock,
  Eye,
  CheckCircle,
  AlertCircle,
  Layers,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const { selectedDepartment } = useOutletContext<{ selectedDepartment: string }>();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-09-07');
  const [selectedDept, setSelectedDept] = useState(selectedDepartment);
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Sorting and Pagination
  const [sortField, setSortField] = useState<keyof AttendanceRecord>('employee_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Drawer
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [attHistory, setAttHistory] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    setSelectedDept(selectedDepartment);
  }, [selectedDepartment]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const [data, summ] = await Promise.all([
        attendanceService.getAttendanceRecords({
          date: selectedDate,
          department: selectedDept,
          status: selectedStatus,
          search,
        }),
        attendanceService.getAttendanceSummary(selectedDate),
      ]);
      setRecords(data);
      setSummary(summ);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedDept, selectedStatus, search]);

  const handleViewDetails = async (rec: AttendanceRecord) => {
    setSelectedRecord(rec);
    const hist = await attendanceService.getEmployeeAttendanceHistory(rec.employee_id);
    setAttHistory(hist);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedDate('2026-09-07');
    setSelectedDept('All Departments');
    setSelectedStatus('All');
  };

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [records, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage) || 1;
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (field: keyof AttendanceRecord) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Summary Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present</span>
            <div className="text-xl font-black text-emerald-700 mt-1">{summary.present}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Signed in on-time</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Working Now</span>
            <div className="text-xl font-black text-blue-700 mt-1">{summary.working}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Signed in & active</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Late Sign-ins</span>
            <div className="text-xl font-black text-amber-700 mt-1">{summary.late}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Arrived after 09:30</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Absent (Node 1)</span>
            <div className="text-xl font-black text-rose-700 mt-1">{summary.absent}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Auto-marked missing swipes</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Auto-Closed</span>
            <div className="text-xl font-black text-slate-700 mt-1">{summary.autoClosed}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Closed after 21:00</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <AttendanceFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedDept={selectedDept}
        onDeptChange={setSelectedDept}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={handleResetFilters}
      />

      {/* Main Attendance Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Attendance Records for {selectedDate}
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Showing {records.length} records
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : paginatedRecords.length === 0 ? (
          <EmptyState
            title="No attendance records found"
            description="No employees matched your selected date, department, or status filters."
            action={{ label: 'Clear Filters', onClick: handleResetFilters }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th
                    onClick={() => toggleSort('employee_name')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-800"
                  >
                    <div className="flex items-center gap-1">
                      <span>Employee</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">First Sign In</th>
                  <th className="py-3 px-4">Last Sign Out</th>
                  <th className="py-3 px-4">Signed In</th>
                  <th
                    onClick={() => toggleSort('approval_status')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-800"
                  >
                    <div className="flex items-center gap-1">
                      <span>Approval Status</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Tasks Done</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-600">
                          {rec.employee_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{rec.employee_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {rec.employee_id} • {rec.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{rec.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {formatTime(rec.first_sign_in)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {formatTime(rec.last_sign_out)}
                    </td>
                    <td className="py-3 px-4">
                      {rec.is_signed_in ? (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Off</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {rec.approval_status === 'Present' && <Badge variant="green" dot>Present</Badge>}
                      {rec.approval_status === 'Working' && <Badge variant="blue" dot>Working</Badge>}
                      {rec.approval_status === 'Late' && <Badge variant="amber" dot>Late</Badge>}
                      {rec.approval_status === 'Absent' && (
                        <Badge variant="red" dot>
                          {rec.created_by_node1_absence ? 'Absent (Node 1)' : 'Absent'}
                        </Badge>
                      )}
                      {rec.approval_status === 'Auto-closed' && (
                        <Badge variant="gray" dot>Auto-closed</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      {rec.tasks_done ? (
                        <span className="text-slate-600 truncate block text-[11px]" title={rec.tasks_done}>
                          {rec.tasks_done}
                        </span>
                      ) : rec.approval_status === 'Absent' ? (
                        <span className="text-slate-400 italic text-[11px]">Unapproved absence</span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-1 text-[11px]">
                          <AlertCircle className="h-3 w-3" /> Pending checkup
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewDetails(rec)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <span className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Employee Details Drawer */}
      <EmployeeAttendanceDrawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        history={attHistory}
      />
    </div>
  );
};
