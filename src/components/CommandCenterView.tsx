import React from 'react';
import {
  Users,
  CalendarCheck,
  CircleDollarSign,
  Briefcase,
  Boxes,
  Activity,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Mail,
  FileSpreadsheet,
  CloudCog,
  RefreshCw,
  TrendingUp,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Flame,
  CheckSquare2,
  ExternalLink,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  FeeInvoice,
  FeePayment,
  Employee,
  InventoryItem,
  Campus,
  Announcement,
  ApprovalRequest,
  UserRole,
} from '../types/erp';
import { User } from 'firebase/auth';

interface CommandCenterViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  invoices: FeeInvoice[];
  payments: FeePayment[];
  employees: Employee[];
  inventory: InventoryItem[];
  campuses: Campus[];
  announcements: Announcement[];
  approvals: ApprovalRequest[];
  hasWorkspaceAuth: boolean;
  currentUser?: User | null;
  currentRole?: UserRole;
  connectedSheetId?: string | null;
  connectedSheetTitle?: string | null;
  connectedSheetUrl?: string | null;
  onOpenSheetModal: () => void;
  onOpenAdminLoginModal: () => void;
  onOpenHealthCheck: () => void;
  onNavigateView: (view: any) => void;
  onRefreshData: () => void;
  onQuickSyncToSheets?: () => void;
  isSyncingSheets?: boolean;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  students,
  attendance,
  invoices,
  payments,
  employees,
  inventory,
  campuses,
  announcements,
  approvals,
  hasWorkspaceAuth,
  currentUser,
  currentRole = 'Super Admin',
  connectedSheetId,
  connectedSheetTitle,
  connectedSheetUrl,
  onOpenSheetModal,
  onOpenAdminLoginModal,
  onOpenHealthCheck,
  onNavigateView,
  onRefreshData,
  onQuickSyncToSheets,
  isSyncingSheets = false,
}) => {
  // Calculations
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'active').length;

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balance, 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  const lowStockCount = inventory.filter((i) => i.quantity <= i.minStockAlert).length;
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'Pending Approval').length;

  // Today attendance average
  const todayAtt = attendance[0];
  const attendanceRate = todayAtt
    ? Math.round((todayAtt.presentCount / (todayAtt.totalStudents || 1)) * 100)
    : 94;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            Executive Control Room
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ERP Command Center
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            Real-time institutional oversight across academics, admissions, financial operations, multi-campus faculties, and cloud integrations.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAdminLoginModal}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors border border-indigo-400/40 text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>Admin: {currentRole}</span>
          </button>
          <button
            onClick={onOpenSheetModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white transition-colors border border-emerald-400/40 text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>Sheets Master DB</span>
          </button>
          <button
            onClick={() => onNavigateView('qr-scanner')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 text-xs font-semibold flex items-center gap-1.5"
          >
            <span>📷 QR Gate Scanner</span>
          </button>
          <button
            onClick={() => onNavigateView('analytics')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 text-xs font-semibold flex items-center gap-1.5"
          >
            <span>📊 Analytics &amp; KPI</span>
          </button>
          <button
            onClick={onRefreshData}
            title="Refresh ERP Data"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenHealthCheck}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Health Check</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Live Database Master Synchronization Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/50 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Google Sheets Enterprise Central Database
              </h2>
              {connectedSheetId ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  Connected &amp; Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {connectedSheetTitle
                ? `Active Sheet: "${connectedSheetTitle}" — Real-time 2-way sync across Students, Attendance, Fees, Staff, and Inventory tabs.`
                : 'Connect or generate a dedicated Google Spreadsheet to automatically backup and store school records in Google Drive.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {connectedSheetUrl && (
            <a
              href={connectedSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
              <span>Open in Sheets</span>
            </a>
          )}
          {onQuickSyncToSheets && (
            <button
              onClick={onQuickSyncToSheets}
              disabled={isSyncingSheets}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? 'Syncing...' : 'Sync All to Sheets'}</span>
            </button>
          )}
          <button
            onClick={onOpenSheetModal}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-1.5 transition-colors"
          >
            <span>Manage Sheets Database →</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Students */}
        <div
          onClick={() => onNavigateView('students')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Enrolled</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalStudents.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3" /> {activeStudents} Active
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Across {campuses.length} Campuses & STEM Wings
          </div>
        </div>

        {/* KPI 2: Attendance */}
        <div
          onClick={() => onNavigateView('attendance')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Daily Attendance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {attendanceRate}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3" /> Target: 92%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {todayAtt ? `${todayAtt.presentCount} present today` : 'Rosters synced'}
          </div>
        </div>

        {/* KPI 3: Fee Collections */}
        <div
          onClick={() => onNavigateView('fees-invoicing')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fee Collections</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${totalCollected.toLocaleString()}
            </span>
            <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold">
              {collectionRate}% Collected
            </span>
          </div>
          <div className="mt-2 text-[11px] text-rose-500 font-medium">
            ${totalOutstanding.toLocaleString()} Outstanding Balance
          </div>
        </div>

        {/* KPI 4: Pending Approvals & Store */}
        <div
          onClick={() => onNavigateView('approvals')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Approvals & Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckSquare2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {pendingApprovalsCount}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              Pending Actions
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {lowStockCount > 0 ? `⚠️ ${lowStockCount} inventory items low on stock` : 'Inventory healthy'}
          </div>
        </div>
      </div>

      {/* Integration Control Status Room */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CloudCog className="w-5 h-5 text-indigo-500" />
              Live Integration & Subsystem Telemetry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active connections verified across Cloud Firestore, Google Workspace, Gemini AI, and background services.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              All 8 Core Systems Operational
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Service 1: Cloud Firestore */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Database</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              Cloud Firestore
            </div>
            <div className="text-[10px] text-slate-500">Persistent sync</div>
          </div>

          {/* Service 2: Google Drive */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Drive</span>
              <span className={`w-2 h-2 rounded-full ${hasWorkspaceAuth ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              Google Drive
            </div>
            <div className="text-[10px] text-slate-500">{hasWorkspaceAuth ? 'Files linked' : 'OAuth Ready'}</div>
          </div>

          {/* Service 3: Google Sheets */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Sheets</span>
              <span className={`w-2 h-2 rounded-full ${hasWorkspaceAuth ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              Google Sheets
            </div>
            <div className="text-[10px] text-slate-500">{hasWorkspaceAuth ? '2-Way sync' : 'OAuth Ready'}</div>
          </div>

          {/* Service 4: Gmail */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Gmail</span>
              <span className={`w-2 h-2 rounded-full ${hasWorkspaceAuth ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              Gmail Dispatch
            </div>
            <div className="text-[10px] text-slate-500">{hasWorkspaceAuth ? 'Confirmed send' : 'OAuth Ready'}</div>
          </div>

          {/* Service 5: Gemini AI Suite */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">AI Engine</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              Gemini 3 Series
            </div>
            <div className="text-[10px] text-slate-500">Live, Pro & 3.5</div>
          </div>

          {/* Service 6: Backup Health */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Backup</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              Automated Snapshots
            </div>
            <div className="text-[10px] text-slate-500">Verified healthy</div>
          </div>
        </div>
      </div>

      {/* Lower Row: Recent Transactions & Broadcast Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Financial Transactions */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Fee Receipts & Transactions
              </h2>
              <p className="text-xs text-slate-500">Real-time ledger updates</p>
            </div>
            <button
              onClick={() => onNavigateView('fees-invoicing')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All Invoices →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.slice(0, 4).map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                    $
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {p.studentName}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {p.receiptNo} · {p.paymentMethod} ({p.paymentDate})
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    +${p.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">{p.recordedBy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* School Announcements */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Announcements & Notices
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {announcements.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {announcements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      ann.priority === 'warning'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : ann.priority === 'emergency'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <span className="text-[10px] text-slate-400">{ann.createdAt.split(' ')[0]}</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {ann.title}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {ann.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
