import React from 'react';
import { AgentThread } from '../../types/agent';
import { Badge } from '../common/Badge';
import { Bot, PauseCircle, PlayCircle, CheckCircle, Clock, Eye, AlertCircle } from 'lucide-react';

interface ThreadMonitorTableProps {
  threads: AgentThread[];
  onInspectThread: (thread: AgentThread) => void;
  onReviewHIL?: (thread: AgentThread) => void;
}

export const ThreadMonitorTable: React.FC<ThreadMonitorTableProps> = ({
  threads,
  onInspectThread,
  onReviewHIL,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="green" dot>Completed</Badge>;
      case 'Running':
        return <Badge variant="blue" dot>Running</Badge>;
      case 'Paused — HIL':
        return (
          <Badge variant="purple" dot className="animate-pulse">
            ⏸ Paused — HIL Review
          </Badge>
        );
      case 'Waiting':
        return <Badge variant="gray" dot>Waiting</Badge>;
      case 'Failed':
        return <Badge variant="red" dot>Failed</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              LangGraph Thread Monitor
            </h3>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              Isolated Execution
            </span>
          </div>
          <p className="text-xs text-slate-500">
            One independent thread per employee — a paused thread never blocks other threads
          </p>
        </div>
        <span className="text-xs text-slate-400 font-semibold">
          {threads.length} active threads
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">Thread ID</th>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Run Date</th>
              <th className="py-3 px-4">Current Node</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">HIL Required</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {threads.map((t) => (
              <tr key={t.thread_id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-mono text-[11px] text-blue-600 font-bold">
                  {t.thread_id}
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{t.employee_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{t.employee_id} • {t.department}</div>
                </td>
                <td className="py-3 px-4 text-slate-600">{t.run_date}</td>
                <td className="py-3 px-4">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700 font-semibold">
                    {t.current_node}
                  </span>
                </td>
                <td className="py-3 px-4">{getStatusBadge(t.status)}</td>
                <td className="py-3 px-4">
                  {t.hil_required ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      <PauseCircle className="h-3 w-3" /> Yes (Pending)
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">No</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {t.status === 'Paused — HIL' && onReviewHIL && (
                      <button
                        onClick={() => onReviewHIL(t)}
                        className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 transition-colors shadow-xs"
                      >
                        Review HIL
                      </button>
                    )}
                    <button
                      onClick={() => onInspectThread(t)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> Logs
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
