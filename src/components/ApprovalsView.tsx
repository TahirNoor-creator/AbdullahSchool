import React from 'react';
import {
  CheckSquare2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  User,
} from 'lucide-react';
import { ApprovalRequest } from '../types/erp';

interface ApprovalsViewProps {
  approvals: ApprovalRequest[];
  onApprove: (id: string, approver: string) => void;
  onReject: (id: string, approver: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  approvals,
  onApprove,
  onReject,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare2 className="w-5 h-5 text-indigo-500" />
            Controlled Transaction Approval Workflows
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            DRAFT → SUBMITTED → PENDING APPROVAL → APPROVED → POSTED (or REJECTED/CANCELLED). Server-enforced financial controls.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Workflow Type</th>
                <th className="py-3 px-4">Request Title</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {approvals.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {req.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {req.title}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 dark:text-slate-200 font-medium">{req.requesterName}</div>
                    <div className="text-[10px] text-slate-400">{req.requesterRole}</div>
                  </td>
                  <td className="py-3 px-4 font-bold font-mono text-slate-900 dark:text-white">
                    {req.amount ? `$${req.amount.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                    {req.details}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : req.status === 'Pending Approval'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {req.status === 'Pending Approval' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onApprove(req.id, 'Principal / Super Admin')}
                          className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onReject(req.id, 'Principal / Super Admin')}
                          className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {req.approver ? `By ${req.approver}` : 'Completed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
