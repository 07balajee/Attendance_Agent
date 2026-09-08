import React, { useState } from 'react';
import { Drawer } from '../common/Drawer';
import { OvertimeRequest } from '../../types/overtime';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Clock, IndianRupee, Layers, CheckCircle, AlertCircle } from 'lucide-react';

interface OvertimeDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request: OvertimeRequest | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const OvertimeDetailDrawer: React.FC<OvertimeDetailDrawerProps> = ({
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
        title="Overtime Claim Review"
        subtitle={`Claim ID: ${request.id} • ${request.employee_name}`}
        width="lg"
        footer={
          request.status === 'Pending' ? (
            <div className="flex items-center gap-3 w-full justify-between">
              <span className="text-[11px] text-slate-500 italic">
                Preserving Human Authority
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(true)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  Reject Claim
                </button>
                <button
                  type="button"
                  onClick={() => setApproveConfirmOpen(true)}
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Approve Overtime
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-5">
          {/* Calculation Formula Display */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Overtime Calculation Formula
            </span>
            <div className="mt-2 flex items-center gap-2 text-base font-bold text-slate-900">
              <span>{request.hours} hours</span>
              <span className="text-slate-400">×</span>
              <span>₹{request.rate}/hour</span>
              <span className="text-slate-400">=</span>
              <span className="text-lg font-black text-blue-700">
                ₹{request.amount.toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Calculated dynamically based on employee profile rate tier.
            </p>
          </div>

          {/* Node 3 Payroll Sync Explanation Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Node 3 — Overtime-to-Payroll Sync Mechanism</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upon approval, Node 3 writes <code>overtime_hours</code> and <code>overtime_amount</code> into{' '}
              <span className="font-mono text-slate-800 font-semibold">
                attendance_records.dynamic_checkup_data
              </span>{' '}
              for this date. The payroll module consumes this JSONB field directly during salary runs.
            </p>
            <div className="mt-2.5 flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Payroll Sync Status:</span>
              {request.payroll_synced ? (
                <Badge variant="green" size="sm" dot>
                  Synced to dynamic_checkup_data
                </Badge>
              ) : (
                <Badge variant="amber" size="sm" dot>
                  Pending Approval Sync
                </Badge>
              )}
            </div>
          </div>

          {/* Claim Metadata Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Employee</span>
                <div className="font-bold text-slate-900 mt-0.5">{request.employee_name}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Department</span>
                <div className="font-bold text-slate-900 mt-0.5">{request.department}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Date of Work</span>
                <div className="font-bold text-slate-900 mt-0.5">{request.date}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Applied On</span>
                <div className="font-bold text-slate-900 mt-0.5">{request.applied_on}</div>
              </div>
            </div>

            {/* Notes */}
            {request.management_note && (
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Management / Agent Notes
                </span>
                <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {request.management_note}
                </p>
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* Confirmation Modals */}
      <ConfirmDialog
        isOpen={approveConfirmOpen}
        onClose={() => setApproveConfirmOpen(false)}
        onConfirm={handleApproveConfirm}
        title="Approve Overtime Claim"
        message={`Approve ${request.hours} hours (₹${request.amount}) for ${request.employee_name}? Node 3 will synchronize this amount into attendance_records.dynamic_checkup_data.`}
        confirmText="Approve & Sync"
        type="primary"
        isLoading={isProcessing}
      />

      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setRejectModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Reject Overtime Claim</h3>
            <p className="mt-1 text-xs text-slate-500">
              Please enter a reason for rejecting this claim:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Work hours not authorized by project lead..."
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
                Reject Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
