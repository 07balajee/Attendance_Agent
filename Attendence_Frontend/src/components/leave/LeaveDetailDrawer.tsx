import React, { useState } from 'react';
import { Drawer } from '../common/Drawer';
import { LeaveRequest } from '../../types/leave';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Shield,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface LeaveDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request: LeaveRequest | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const LeaveDetailDrawer: React.FC<LeaveDetailDrawerProps> = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) return null;

  const handleApproveConfirm = async () => {
    setIsProcessing(true);
    try {
      await onApprove(request.id);
      setApproveConfirmOpen(false);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;
    setIsProcessing(true);
    try {
      await onReject(request.id, rejectReason);
      setRejectModalOpen(false);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Leave Request Review"
        subtitle={`Request ID: ${request.id} • ${request.employee_name}`}
        width="lg"
        footer={
          request.status === 'Pending' ? (
            <div className="flex items-center gap-3 w-full justify-between">
              <span className="text-[11px] text-slate-500 italic">
                Preserving Human Authority (HLD Rule 1)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(true)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => setApproveConfirmOpen(true)}
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Approve Leave
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-5">
          {/* Excess Leave Warning Banner */}
          {request.is_excess_leave && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    ⚠ Excess Leave Flagged by Node 2
                  </h4>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    Employee requested <strong>{request.days} days</strong>, but remaining balance is only{' '}
                    <strong>{request.remaining_balance} days</strong>.
                  </p>
                  <p className="mt-1.5 text-[11px] text-amber-700 font-medium">
                    Strict HLD Rule: The agent flags excess leave but NEVER auto-rejects. Final decision remains with the HR/Manager.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLA Status Banner */}
          {request.sla_status === 'breached' && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-rose-900">SLA Breached (≥ 5 Business Days)</h5>
                <p className="mt-0.5 text-xs text-rose-700">
                  This request has been pending for {request.age_bd} business days. Immediate review required.
                </p>
              </div>
            </div>
          )}

          {/* Request Metadata Grid */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-xs text-slate-500 font-medium">Employee Name</span>
                <div className="text-sm font-bold text-slate-900">{request.employee_name}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium">Status</span>
                <div className="mt-0.5">
                  {request.status === 'Pending' && <Badge variant="amber">Pending</Badge>}
                  {request.status === 'Approved' && <Badge variant="green">Approved</Badge>}
                  {request.status === 'Rejected' && <Badge variant="red">Rejected</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Leave Type</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">{request.type} Leave</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Days Requested</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">{request.days} day(s)</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Start Date</span>
                <div className="font-semibold text-slate-800 mt-0.5">{request.start_date}</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-bold">End Date</span>
                <div className="font-semibold text-slate-800 mt-0.5">{request.end_date}</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Applied On</span>
                <div className="font-semibold text-slate-800 mt-0.5">{request.applied_on}</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Remaining Balance</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {request.remaining_balance} day(s)
                </div>
              </div>
            </div>
          </div>

          {/* Management / Agent Note */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Audit Log & Management Notes
            </span>
            <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[11px] leading-relaxed">
              {request.management_note || 'No notes currently attached to this request.'}
            </div>
          </div>

          {/* Approval Details if already processed */}
          {request.reviewed_by && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs flex items-center justify-between">
              <span className="text-slate-500 font-medium">Reviewed By:</span>
              <span className="font-bold text-slate-900">{request.reviewed_by}</span>
            </div>
          )}
        </div>
      </Drawer>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={approveConfirmOpen}
        onClose={() => setApproveConfirmOpen(false)}
        onConfirm={handleApproveConfirm}
        title="Approve Leave Request"
        message={`Are you sure you want to approve this ${request.type} leave for ${request.employee_name} (${request.days} days)? Quota balance will be updated.`}
        confirmText="Approve"
        type="primary"
        isLoading={isProcessing}
      />

      {/* Reject Confirmation Dialog with Reason Input */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setRejectModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Reject Leave Request</h3>
            <p className="mt-1 text-xs text-slate-500">
              Please enter a reason for rejecting {request.employee_name}'s leave request:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Critical project deadline, staffing shortage..."
              className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || isProcessing}
                onClick={handleRejectConfirm}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
