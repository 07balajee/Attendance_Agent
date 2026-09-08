import React from 'react';
import { AttendanceRecord } from '../../types/attendance';
import { Badge } from '../common/Badge';
import { StatusColor } from '../../types/common';
import { Eye, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface TodayAttendanceTableProps {
  records: AttendanceRecord[];
  onViewEmployee: (record: AttendanceRecord) => void;
}

export const TodayAttendanceTable: React.FC<TodayAttendanceTableProps> = ({
  records,
  onViewEmployee,
}) => {
  const getStatusBadge = (status: string, rec: AttendanceRecord) => {
    switch (status) {
      case 'Present':
        return (
          <Badge variant="green" dot>
            Present
          </Badge>
        );
      case 'Working':
        return (
          <Badge variant="blue" dot>
            Working
          </Badge>
        );
      case 'Late':
        return (
          <Badge variant="amber" dot>
            Late
          </Badge>
        );
      case 'Absent':
        return (
          <Badge variant="red" dot>
            {rec.created_by_node1_absence ? 'Absent (Node 1)' : 'Absent'}
          </Badge>
        );
      case 'Auto-closed':
        return (
          <Badge variant="gray" dot>
            Auto-closed
          </Badge>
        );
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '—';
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Today's Attendance</h3>
          <p className="text-xs text-slate-500">Live swipes, checkups, and Node 1 absence reconciliation</p>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Showing {records.length} employees
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Sign In</th>
              <th className="py-3 px-4">Sign Out</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Daily Checkup</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {records.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-600">
                      {rec.employee_name.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-900 truncate max-w-[140px]">
                      {rec.employee_name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{rec.employee_id}</td>
                <td className="py-3 px-4 text-slate-600">{rec.department}</td>
                <td className="py-3 px-4 text-slate-700 font-medium">
                  {formatTime(rec.first_sign_in)}
                </td>
                <td className="py-3 px-4 text-slate-700 font-medium">
                  {formatTime(rec.last_sign_out)}
                </td>
                <td className="py-3 px-4">{getStatusBadge(rec.approval_status, rec)}</td>
                <td className="py-3 px-4 max-w-[220px]">
                  {rec.tasks_done ? (
                    <span className="text-slate-600 truncate block text-[11px]" title={rec.tasks_done}>
                      {rec.tasks_done}
                    </span>
                  ) : rec.approval_status === 'Absent' ? (
                    <span className="text-slate-400 italic text-[11px]">No swipe / Absent</span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1 text-[11px]">
                      <AlertCircle className="h-3 w-3" /> Missing checkup
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onViewEmployee(rec)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <Eye className="h-3 w-3" /> Details
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
