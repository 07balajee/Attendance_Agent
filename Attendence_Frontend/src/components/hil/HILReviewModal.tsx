import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { HILQueueItem } from '../../types/agent';
import { Badge } from '../common/Badge';
import {
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  Clock,
  Calendar,
  FileCheck,
  CheckCircle,
  XCircle,
  ArrowDown,
  Layers,
  Edit3,
} from 'lucide-react';

interface HILReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: HILQueueItem | null;
  onApproveAndCommit: (approvedText: string) => Promise<void>;
  onReject: () => Promise<void>;
}

export const HILReviewModal: React.FC<HILReviewModalProps> = ({
  isOpen,
  onClose,
  item,
  onApproveAndCommit,
  onReject,
}) => {
  if (!item) return null;

  const [narrativeText, setNarrativeText] = useState(item.draft_narrative);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmCommitOpen, setConfirmCommitOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCommit = async () => {
    setIsSubmitting(true);
    try {
      await onApproveAndCommit(narrativeText);
      setConfirmCommitOpen(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject();
      setConfirmRejectOpen(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const flagEntries = Object.entries(item.flags || {});

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Human-in-the-Loop Review: Anomaly Narrative"
        subtitle={`LangGraph interrupt() state checkpointed for Thread: ${item.thread_id}`}
        maxWidth="4xl"
      >
        <div className="space-y-6">
          {/* HIL Interruption State Banner */}
          <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white flex-shrink-0 animate-pulse">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Thread Paused — Waiting for Human Review
                  </span>
                  <Badge variant="purple" size="sm">
                    LangGraph interrupt()
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  Node 5 raised behavioral anomaly flags and drafted a manager-facing narrative using the{' '}
                  <strong>Anthropic Claude API</strong>. In strict compliance with HLD Rule 9, the AI draft cannot
                  be committed to the database without explicit HR review and human confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Journey Visualization */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              LangGraph Human-in-the-Loop Architecture Flow
            </span>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-700">
              <span className="bg-white border px-2.5 py-1 rounded-lg">1. Node 5 Detection</span>
              <span>➔</span>
              <span className="bg-white border px-2.5 py-1 rounded-lg">2. Anthropic API Draft</span>
              <span>➔</span>
              <span className="bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg text-amber-900">
                3. interrupt() Pause
              </span>
              <span>➔</span>
              <span className="bg-blue-100 border border-blue-300 px-2.5 py-1 rounded-lg text-blue-900">
                4. HR Review & Edit
              </span>
              <span>➔</span>
              <span className="bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg text-emerald-900">
                5. Command(resume) Commit
              </span>
            </div>
          </div>

          {/* Employee & Detected Flags Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Employee Metadata */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Employee Under Review
              </span>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                  {item.employee_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.employee_name}</h4>
                  <p className="text-xs text-slate-500 font-mono">{item.employee_id}</p>
                </div>
              </div>
              <div className="mt-3 text-xs space-y-1.5 border-t border-slate-100 pt-2.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Department:</span>
                  <span className="font-semibold text-slate-800">{item.department}</span>
                </div>
                <div className="flex justify-between">
                  <span>Run Date:</span>
                  <span className="font-semibold text-slate-800">{item.run_date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waiting Time:</span>
                  <span className="font-semibold text-amber-700">{item.waiting_minutes} mins</span>
                </div>
              </div>
            </div>

            {/* Detected Anomalies List */}
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Detected Behavioral Signals (Node 5 Part A)
              </span>
              <div className="mt-2 space-y-2">
                {flagEntries.map(([key, val]: [string, any]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-xs"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 uppercase text-[11px]">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <p className="text-slate-600 text-[11px] mt-0.5">{val.message}</p>
                      </div>
                    </div>
                    <Badge variant="amber" size="sm">
                      {val.count} / {val.threshold} threshold
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Generated Manager Narrative Section */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950">AI Generated Manager Narrative</h4>
                  <span className="text-[10px] font-bold text-blue-700">
                    AI-generated draft — Human approval required
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditing ? 'Done Editing' : 'Edit Draft'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Review and adjust the AI draft before committing to the database. Once approved, this will be
              written into <code>attendance_records.dynamic_checkup_data["anomaly_note"]</code>.
            </p>

            <div className="relative">
              <textarea
                rows={5}
                value={narrativeText}
                onChange={(e) => setNarrativeText(e.target.value)}
                className="w-full rounded-xl border border-blue-200 bg-white p-3.5 text-xs text-slate-800 leading-relaxed font-sans shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Managerial narrative draft..."
              />
              <span className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400">
                {narrativeText.length} characters
              </span>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setConfirmRejectOpen(true)}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              Discard Draft & Resume Without Note
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close (Keep Paused)
              </button>

              <button
                type="button"
                onClick={() => setConfirmCommitOpen(true)}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve & Commit</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmCommitOpen}
        onClose={() => setConfirmCommitOpen(false)}
        onConfirm={handleCommit}
        title="Approve and commit this narrative?"
        message="This human action executes LangGraph Command(resume=approved_text) to commit the approved manager narrative directly into attendance_records.dynamic_checkup_data. Thread will advance to Completed."
        confirmText="Confirm & Commit to DB"
        type="primary"
        isLoading={isSubmitting}
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        onConfirm={handleReject}
        title="Discard Draft Narrative?"
        message="Discard the AI generated draft for this employee? The thread will resume and mark as Completed without writing an anomaly note to the database."
        confirmText="Discard & Resume"
        type="danger"
        isLoading={isSubmitting}
      />
    </>
  );
};
