import React from 'react';
import { Drawer } from '../common/Drawer';
import { AttendanceRecord } from '../../types/attendance';
import { Badge } from '../common/Badge';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Bot,
  Layers,
  DollarSign,
  FileText,
} from 'lucide-react';

interface EmployeeAttendanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  history: AttendanceRecord[];
}

export const EmployeeAttendanceDrawer: React.FC<EmployeeAttendanceDrawerProps> = ({
  isOpen,
  onClose,
  record,
  history,
}) => {
  if (!record) return null;

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '—';
    }
  };

  const dynamicData = record.dynamic_checkup_data || {};

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${record.employee_name}`}
      subtitle={`${record.employee_id} • ${record.department}`}
      width="xl"
    >
      <div className="space-y-6">
        {/* Top Highlight Card: Selected Day Status */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">{record.date}</span>
            </div>
            {record.approval_status === 'Present' && <Badge variant="green" dot>Present</Badge>}
            {record.approval_status === 'Working' && <Badge variant="blue" dot>Working</Badge>}
            {record.approval_status === 'Late' && <Badge variant="amber" dot>Late Sign-in</Badge>}
            {record.approval_status === 'Absent' && (
              <Badge variant="red" dot>
                {record.created_by_node1_absence ? 'Absent (Auto-Marked by Node 1)' : 'Absent'}
              </Badge>
            )}
            {record.approval_status === 'Auto-closed' && (
              <Badge variant="gray" dot>Auto-closed by Node 1</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="rounded-xl bg-white p-3 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">First Sign In</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {formatTime(record.first_sign_in)}
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Last Sign Out</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {formatTime(record.last_sign_out)}
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Signed In Flag</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {record.is_signed_in ? 'true (Active)' : 'false'}
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Location Tag</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {record.extra_notes || '—'}
              </div>
            </div>
          </div>

          {/* Checkup / Tasks */}
          <div className="mt-3 rounded-xl bg-white p-3 border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">Daily Checkup Tasks</span>
            <p className="mt-1 text-xs text-slate-700 leading-relaxed">
              {record.tasks_done || (
                <span className="italic text-slate-400">No checkup tasks submitted.</span>
              )}
            </p>
          </div>
        </div>

        {/* Dynamic Checkup Data (JSONB inspection as defined in HLD) */}
        {(dynamicData.overtime_hours || dynamicData.anomaly_note || dynamicData.monthly_ot_hours) && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 mb-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>attendance_records.dynamic_checkup_data (JSONB)</span>
            </div>

            <div className="space-y-2 text-xs">
              {dynamicData.overtime_hours && (
                <div className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-blue-200/60">
                  <span className="text-slate-600 font-medium">Node 3 Overtime Sync:</span>
                  <span className="font-bold text-slate-900">
                    {dynamicData.overtime_hours} hrs • ₹{dynamicData.overtime_amount?.toLocaleString()} (@ ₹{dynamicData.overtime_rate}/hr)
                  </span>
                </div>
              )}

              {dynamicData.anomaly_note && (
                <div className="rounded-lg bg-white p-2.5 border border-blue-200/60">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    <span>Approved Anomaly Narrative (Committed by HR):</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed italic bg-slate-50 p-2 rounded">
                    "{dynamicData.anomaly_note}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 30-Day Attendance Timeline & History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Attendance History (Past 30 Days)
            </h4>
            <span className="text-xs text-slate-400 font-medium">
              {history.length} records logged
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-20 font-mono text-[11px] font-semibold text-slate-700">
                      {h.date}
                    </div>
                    {h.approval_status === 'Present' && <Badge variant="green" size="sm">Present</Badge>}
                    {h.approval_status === 'Working' && <Badge variant="blue" size="sm">Working</Badge>}
                    {h.approval_status === 'Late' && <Badge variant="amber" size="sm">Late</Badge>}
                    {h.approval_status === 'Absent' && (
                      <Badge variant="red" size="sm">
                        {h.created_by_node1_absence ? 'Absent (Node 1)' : 'Absent'}
                      </Badge>
                    )}
                    {h.approval_status === 'Auto-closed' && (
                      <Badge variant="gray" size="sm">Auto-closed</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                    <span>In: {formatTime(h.first_sign_in)}</span>
                    <span>Out: {formatTime(h.last_sign_out)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
