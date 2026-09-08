import React, { useState } from 'react';
import { Drawer } from '../common/Drawer';
import { ExpenseRequest } from '../../types/expense';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Receipt, AlertTriangle, ShieldAlert, Calendar, User, FileText } from 'lucide-react';

interface ExpenseDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseRequest | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const ExpenseDetailDrawer: React.FC<ExpenseDetailDrawerProps> = ({
  isOpen,
  onClose,
  expense,
  onApprove,
  onReject,
}) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!expense) return null;

  const handleApproveConfirm = async () => {
    setIsProcessing(true);
    try {
      await onApprove(expense.id);
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
      await onReject(expense.id, rejectReason);
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
        title="Expense Claim Details"
        subtitle={`Claim ID: ${expense.id} • ${expense.employee_name}`}
        width="lg"
        footer={
          expense.status === 'Pending' ? (
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
                  Approve Reimbursement
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-5">
          {/* SLA Escalation Banner */}
          {expense.reviewed_by?.includes('auto-escalated') && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-purple-900">
                    Auto-Escalated by Node 4 Escalation Agent
                  </h4>
                  <p className="mt-1 text-xs text-purple-800 leading-relaxed">
                    This claim has been pending for <strong>{expense.age_bd} business days</strong> (breached the 5-day threshold).
                    Node 4 automatically stamped <code>reviewed_by = "System (auto-escalated)"</code> and added it to the escalation queue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Amount & Status Top Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Claim Amount</span>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  ₹{expense.amount.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                <div className="mt-0.5">
                  {expense.status === 'Pending' && <Badge variant="amber">Pending Review</Badge>}
                  {expense.status === 'Approved' && <Badge variant="green">Approved</Badge>}
                  {expense.status === 'Rejected' && <Badge variant="red">Rejected</Badge>}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Employee</span>
                <div className="font-bold text-slate-900 mt-0.5">{expense.employee_name}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Category</span>
                <div className="font-bold text-slate-900 mt-0.5">{expense.expense_type}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Submitted On</span>
                <div className="font-bold text-slate-900 mt-0.5">{expense.applied_on}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">SLA Age</span>
                <div className="font-bold text-slate-900 mt-0.5">{expense.age_bd || 1} business days</div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Claim Justification & Description
              </span>
              <p className="mt-1.5 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {expense.description}
              </p>
            </div>

            {/* Management note */}
            {expense.management_note && (
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Audit Log & System Notes
                </span>
                <p className="mt-1.5 text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {expense.management_note}
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
        title="Approve Reimbursement"
        message={`Approve reimbursement of ₹${expense.amount.toLocaleString()} for ${expense.employee_name}?`}
        confirmText="Approve"
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
            <h3 className="text-base font-bold text-slate-900">Reject Reimbursement</h3>
            <p className="mt-1 text-xs text-slate-500">
              Please provide a policy reason for rejecting this claim:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Ineligible category, missing GST invoice..."
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
                Reject Reimbursement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
