import React, { useState } from 'react';
import {
  CheckSquare2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  User,
  Plus,
  Search,
  Filter,
  DollarSign,
  FileText,
  AlertTriangle,
  ArrowRight,
  Lock,
  Layers,
  Sparkles,
  Ban,
  Check,
  X,
  History,
  Info,
} from 'lucide-react';
import { ApprovalRequest, UserRole } from '../types/erp';

interface ApprovalsViewProps {
  approvals: ApprovalRequest[];
  onApprove: (id: string, approver: string, comments?: string) => void;
  onReject: (id: string, approver: string, reason: string) => void;
  onPost?: (id: string, poster: string) => void;
  onCancel?: (id: string, canceler: string, reason: string) => void;
  onSubmitDraft?: (id: string, submitter: string) => void;
  onCreateTransaction?: (req: Omit<ApprovalRequest, 'id' | 'submittedDate'>) => void;
  currentRole?: UserRole;
  currentUserEmail?: string;
  currentUserName?: string;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  approvals,
  onApprove,
  onReject,
  onPost,
  onCancel,
  onSubmitDraft,
  onCreateTransaction,
  currentRole = 'Super Admin',
  currentUserEmail = 'superadmin@oakridgeacademy.edu',
  currentUserName = 'Dr. Eleanor Vance',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectModalItem, setRejectModalItem] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancelModalItem, setCancelModalItem] = useState<ApprovalRequest | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [auditModalItem, setAuditModalItem] = useState<ApprovalRequest | null>(null);

  // New Transaction Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ApprovalRequest['type']>('Student Fee Collection');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDetails, setNewDetails] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStatus, setNewStatus] = useState<'Draft' | 'Submitted'>('Submitted');

  // Permissions helper
  const canApprove =
    currentRole === 'Super Admin' ||
    currentRole === 'Principal' ||
    currentRole === 'Admin';
  const canSubmit =
    currentRole === 'Accountant' ||
    currentRole === 'Super Admin' ||
    currentRole === 'Principal' ||
    currentRole === 'Admin';

  // Stats Calculations
  const pendingApprovals = approvals.filter((a) => a.status === 'Pending Approval');
  const pendingAmount = pendingApprovals.reduce((acc, a) => acc + (a.amount || 0), 0);
  const approvedList = approvals.filter((a) => a.status === 'Approved');
  const postedList = approvals.filter((a) => a.status === 'Posted');
  const rejectedList = approvals.filter((a) => a.status === 'Rejected');
  const cancelledList = approvals.filter((a) => a.status === 'Cancelled');
  const draftsList = approvals.filter((a) => a.status === 'Draft');

  // Filtered List
  const filteredApprovals = approvals.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.studentName && req.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      req.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || req.type === filterType;
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (onCreateTransaction) {
      onCreateTransaction({
        title: newTitle,
        type: newType,
        amount: newAmount ? parseFloat(newAmount) : undefined,
        details: newDetails,
        studentName: newStudentName || undefined,
        requesterName: currentUserName,
        requesterRole: currentRole,
        createdBy: currentUserName,
        createdRole: currentRole,
        status: newStatus === 'Draft' ? 'Draft' : 'Pending Approval',
        auditTrail: [
          {
            action: 'Created',
            actor: currentUserName,
            role: currentRole,
            timestamp: new Date().toLocaleString(),
            notes: newStatus === 'Draft' ? 'Created as Draft' : 'Submitted for Review',
          },
          ...(newStatus !== 'Draft'
            ? [
                {
                  action: 'Submitted' as const,
                  actor: currentUserName,
                  role: currentRole,
                  timestamp: new Date().toLocaleString(),
                  notes: 'Submitted for managerial approval',
                },
              ]
            : []),
        ],
      });
    }

    // Reset Form
    setNewTitle('');
    setNewAmount('');
    setNewDetails('');
    setNewStudentName('');
    setShowCreateModal(false);
  };

  const confirmRejection = () => {
    if (!rejectModalItem || !rejectionReason.trim()) return;
    onReject(rejectModalItem.id, currentUserName, rejectionReason.trim());
    setRejectModalItem(null);
    setRejectionReason('');
  };

  const confirmCancellation = () => {
    if (!cancelModalItem || !cancellationReason.trim()) return;
    if (onCancel) {
      onCancel(cancelModalItem.id, currentUserName, cancellationReason.trim());
    }
    setCancelModalItem(null);
    setCancellationReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare2 className="w-5 h-5 text-indigo-500" />
              Controlled Transaction Approval Workflows
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Server-Enforced Controls
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            DRAFT ➔ SUBMITTED ➔ PENDING APPROVAL ➔ APPROVED ➔ POSTED. No unauthorized posting; complete 4-step audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Controlled Transaction</span>
          </button>
        </div>
      </div>

      {/* Financial Governance Alert Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>Server-Enforced Role Separation Policy:</span>
            <span className="font-mono text-[11px] font-normal px-2 py-0.2 rounded bg-indigo-200/60 dark:bg-indigo-900/60">
              Current Role: <strong>{currentRole}</strong>
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-indigo-800 dark:text-indigo-300">
            • <strong>Teachers &amp; Receptionists:</strong> Create draft &amp; submitted transactions.
            <br />
            • <strong>Accountants:</strong> Validate and submit transactions for managerial authorization.
            <br />
            • <strong>Principal &amp; Super Admins:</strong> Review, Approve, or Reject with mandatory recorded reasons.
            <br />
            • <strong>System Financial Engine:</strong> Posts transactions into official immutable general ledgers.
          </p>
        </div>
      </div>

      {/* Approval Dashboard KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* KPI 1: Pending Approvals */}
        <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="font-bold text-[11px]">Pending Approvals</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-amber-900 dark:text-amber-200">
            {pendingApprovals.length}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
            ${pendingAmount.toLocaleString()} pending
          </div>
        </div>

        {/* KPI 2: Approved Transactions */}
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="font-bold text-[11px]">Approved</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-emerald-900 dark:text-emerald-200">
            {approvedList.length}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
            Ready for posting
          </div>
        </div>

        {/* KPI 3: Posted (Locked) */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="font-bold text-[11px]">Posted (Locked)</span>
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {postedList.length}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            In general ledger
          </div>
        </div>

        {/* KPI 4: Drafts */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold text-[11px]">Draft Vouchers</span>
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-slate-800 dark:text-slate-200">
            {draftsList.length}
          </div>
          <div className="text-[10px] text-slate-400">
            Unsubmitted
          </div>
        </div>

        {/* KPI 5: Rejected */}
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-1">
          <div className="flex items-center justify-between text-rose-600">
            <span className="font-bold text-[11px]">Rejected</span>
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-rose-800 dark:text-rose-200">
            {rejectedList.length}
          </div>
          <div className="text-[10px] text-rose-500">
            With audit reasons
          </div>
        </div>

        {/* KPI 6: Cancelled */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold text-[11px]">Cancelled</span>
            <Ban className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-slate-700 dark:text-slate-300">
            {cancelledList.length}
          </div>
          <div className="text-[10px] text-slate-400">
            Revoked vouchers
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Txn ID, Student, Title, Requester, Details..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
            >
              <option value="all">All Controlled Types</option>
              <option value="Student Fee Collection">Fee Collection</option>
              <option value="Fee Discount">Fee Discount</option>
              <option value="Fee Refund">Fee Refund</option>
              <option value="Expense">Expense</option>
              <option value="Purchase">Purchase</option>
              <option value="Payroll">Payroll</option>
              <option value="Supplier Payment">Supplier Payment</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Posted">Posted</option>
              <option value="Draft">Draft</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Txn ID &amp; Type</th>
                <th className="py-3 px-4">Transaction Details</th>
                <th className="py-3 px-4">Audit Workflow (4 Steps)</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredApprovals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No matching transactions found.
                  </td>
                </tr>
              ) : (
                filteredApprovals.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 align-top">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {req.id}
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {req.type}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-top max-w-sm">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {req.title}
                      </div>
                      {req.studentName && (
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                          Student: <strong>{req.studentName}</strong>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {req.details}
                      </p>
                      {req.rejectionReason && (
                        <div className="mt-1 p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[10px]">
                          <strong>Rejection Reason:</strong> {req.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="space-y-1 text-[11px]">
                        <div>
                          <span className="text-slate-400">Created:</span>{' '}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {req.createdBy || req.requesterName}
                          </span>
                        </div>
                        {req.submittedBy && (
                          <div>
                            <span className="text-slate-400">Submitted:</span>{' '}
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {req.submittedBy}
                            </span>
                          </div>
                        )}
                        {req.approvedBy && (
                          <div>
                            <span className="text-slate-400">Approved:</span>{' '}
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {req.approvedBy}
                            </span>
                          </div>
                        )}
                        {req.postedBy && (
                          <div>
                            <span className="text-slate-400">Posted:</span>{' '}
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {req.postedBy}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top font-bold font-mono text-slate-900 dark:text-white">
                      {req.amount !== undefined ? `$${req.amount.toLocaleString()}` : '—'}
                    </td>

                    <td className="py-3 px-4 align-top">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : req.status === 'Pending Approval'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : req.status === 'Posted'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : req.status === 'Draft'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : req.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {req.status === 'Posted' && <Lock className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Audit Trail Button */}
                        <button
                          onClick={() => setAuditModalItem(req)}
                          title="View Full 4-Step Audit Trail"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {/* Draft -> Submit Button */}
                        {req.status === 'Draft' && onSubmitDraft && canSubmit && (
                          <button
                            onClick={() => onSubmitDraft(req.id, currentUserName)}
                            className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span>Submit</span>
                          </button>
                        )}

                        {/* Pending Approval -> Approve / Reject Buttons */}
                        {req.status === 'Pending Approval' && canApprove && (
                          <>
                            <button
                              onClick={() => onApprove(req.id, currentUserName)}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setRejectModalItem(req)}
                              className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {/* Approved -> Post Button */}
                        {req.status === 'Approved' && onPost && (
                          <button
                            onClick={() => onPost(req.id, currentUserName)}
                            className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Post Txn</span>
                          </button>
                        )}

                        {/* Cancel Button (for non-posted items) */}
                        {req.status !== 'Posted' && req.status !== 'Cancelled' && req.status !== 'Rejected' && onCancel && (
                          <button
                            onClick={() => setCancelModalItem(req)}
                            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500"
                            title="Cancel Transaction"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create Controlled Transaction */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="text-base font-bold flex items-center gap-2">
                <CheckSquare2 className="w-5 h-5 text-indigo-500" />
                Initiate Controlled Financial Transaction
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Transaction Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Science Fair Lab Consumables Purchase Voucher"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Workflow Type *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Student Fee Collection">Student Fee Collection</option>
                    <option value="Fee Discount">Fee Discount / Scholarship</option>
                    <option value="Fee Refund">Fee Refund</option>
                    <option value="Purchase">Purchase / Procurement</option>
                    <option value="Expense">Institutional Expense</option>
                    <option value="Payroll">Staff Salary &amp; Payroll</option>
                    <option value="Supplier Payment">Supplier / Vendor Payment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Associated Student Name (Optional)</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Alexander Hayes"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Transaction Details / Justification</label>
                <textarea
                  rows={3}
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="Specify line items, vendor quote references, or account ledger justification..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Initial Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="initialStatus"
                      value="Submitted"
                      checked={newStatus === 'Submitted'}
                      onChange={() => setNewStatus('Submitted')}
                    />
                    <span>Submit Directly for Approval</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="initialStatus"
                      value="Draft"
                      checked={newStatus === 'Draft'}
                      onChange={() => setNewStatus('Draft')}
                    />
                    <span>Save as Draft (Review Later)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  Initiate Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Mandatory Rejection Reason Dialog */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-rose-50/60 dark:bg-rose-950/40 flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">Reject Transaction: {rejectModalItem.id}</h3>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Financial governance policy strictly requires a documented rejection reason before an authorization rejection is entered into the institutional audit log.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Exceeds department budget allocation; 3 independent vendor quotes missing..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  onClick={() => setRejectModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRejection}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold shadow-md shadow-rose-600/20"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Mandatory Cancellation Reason Dialog */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
              <Ban className="w-5 h-5 text-slate-500 shrink-0" />
              <h3 className="text-sm font-bold">Cancel Transaction Voucher: {cancelModalItem.id}</h3>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Specify why this transaction request is being cancelled.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Cancellation Reason *
                </label>
                <textarea
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Duplicate entry by staff; customer settled in cash directly..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  onClick={() => setCancelModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={confirmCancellation}
                  disabled={!cancellationReason.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-bold"
                >
                  Cancel Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: 4-Step Audit Trail History Viewer */}
      {auditModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="text-sm font-bold">Complete 4-Step Audit Trail: {auditModalItem.id}</h3>
                  <p className="text-[11px] text-slate-500">{auditModalItem.title}</p>
                </div>
              </div>
              <button
                onClick={() => setAuditModalItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between">
                <div>
                  <span className="text-slate-500">Transaction Status:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{auditModalItem.status}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Amount:</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {auditModalItem.amount !== undefined ? `$${auditModalItem.amount.toLocaleString()}` : '—'}
                  </div>
                </div>
              </div>

              {/* 4-Step Visual Timeline */}
              <div className="space-y-3 relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 pl-4">
                {auditModalItem.auditTrail && auditModalItem.auditTrail.length > 0 ? (
                  auditModalItem.auditTrail.map((entry, idx) => (
                    <div key={idx} className="relative space-y-0.5">
                      <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                      <div className="flex items-center justify-between">
                        <strong className="text-indigo-600 dark:text-indigo-400 font-bold uppercase text-[10px]">
                          Step {idx + 1}: {entry.action}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">{entry.timestamp}</span>
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 font-semibold">
                        {entry.actor} <span className="text-slate-500 font-normal">({entry.role})</span>
                      </div>
                      {entry.notes && <p className="text-[11px] text-slate-500">{entry.notes}</p>}
                      {entry.reason && (
                        <p className="text-[11px] text-rose-500 font-medium">Reason: {entry.reason}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    <div>
                      <strong>Created By:</strong> {auditModalItem.createdBy || auditModalItem.requesterName} (
                      {auditModalItem.createdRole || auditModalItem.requesterRole}) on {auditModalItem.submittedDate}
                    </div>
                    {auditModalItem.submittedBy && (
                      <div>
                        <strong>Submitted By:</strong> {auditModalItem.submittedBy} on {auditModalItem.submittedAt || auditModalItem.submittedDate}
                      </div>
                    )}
                    {auditModalItem.approvedBy && (
                      <div>
                        <strong>Approved By:</strong> {auditModalItem.approvedBy} on {auditModalItem.approvedAt || 'Verified'}
                      </div>
                    )}
                    {auditModalItem.postedBy && (
                      <div>
                        <strong>Posted By:</strong> {auditModalItem.postedBy} on {auditModalItem.postedAt || 'Posted'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setAuditModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
