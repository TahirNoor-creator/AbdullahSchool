import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CircleDollarSign,
  Briefcase,
  Boxes,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  TrendingUp,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  Plus,
  Receipt,
  BookOpen,
  Bus,
  MessageSquare,
  BarChart3,
  Calendar,
  Building,
  Bell,
  Check,
  X,
  Wrench,
  Percent,
  TrendingDown,
  DollarSign,
  Award,
  Layers,
  FileText,
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
  // Notification dismiss state
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  // Key KPI metrics calculations
  const totalStudents = students.length || 1420;
  const activeStudents = students.filter((s) => s.status === 'active').length || totalStudents;
  const totalTeachers = employees.filter((e) => e.department === 'Academic').length || 32;
  const totalStaff = employees.length || 48;
  const totalClasses = 12;
  const totalSections = 24;

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0) || 492000;
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0) || 418500;
  const totalPendingFees = Math.max(0, totalInvoiced - totalCollected) || 73500;
  const collectionRate = Math.round((totalCollected / totalInvoiced) * 100) || 85;

  // Attendance calculation
  const todayAtt = attendance[0];
  const attendanceRate = todayAtt
    ? Math.round((todayAtt.presentCount / (todayAtt.totalStudents || 1)) * 100)
    : 95.2;

  // Dedicated School Notification Panel Items requested:
  const notificationItems = [
    {
      id: 'notif-1',
      type: 'admission',
      title: 'New Student Admission',
      time: '12 mins ago',
      desc: 'Emily Watson (Grade 10-A) admission paperwork verified and enrollment approved.',
      badge: 'Admissions',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      icon: Plus,
    },
    {
      id: 'notif-2',
      type: 'fee',
      title: 'Pending Fee Warning',
      time: '35 mins ago',
      desc: '14 invoices are due for Quarter 3 tuition. Automatic SMS reminder batch queued.',
      badge: 'Finance',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      icon: AlertTriangle,
    },
    {
      id: 'notif-3',
      type: 'attendance',
      title: 'Attendance Reminder',
      time: '1 hour ago',
      desc: 'Grade 9-B and Junior Science Wing registers pending morning optical verification.',
      badge: 'Rosters',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      icon: CalendarCheck,
    },
    {
      id: 'notif-4',
      type: 'exam',
      title: 'Term Exam Scheduled',
      time: '2 hours ago',
      desc: 'Term 2 Final Examinations commence on October 15th. Exam seating plan published.',
      badge: 'Academics',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      icon: GraduationCap,
    },
    {
      id: 'notif-5',
      type: 'notice',
      title: 'New School Circular',
      time: '3 hours ago',
      desc: 'Annual Inter-Campus STEM & Robotics Olympiad circular broadcasted to parents.',
      badge: 'Notice',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      icon: Bell,
    },
  ];

  const visibleNotifications = notificationItems.filter(
    (n) => !dismissedNotifications.includes(n.id)
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Executive Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            Central School Command Room
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional ERP Dashboard
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            Real-time multi-campus supervision: students, academics, fee collections, faculty rosters, 28-sheet Google Sheets database, and security diagnostics.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateView('backup-integrity')}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Integrity Fixer</span>
          </button>
          <button
            onClick={onOpenSheetModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white transition-colors border border-emerald-400/40 text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>28-Sheet Google DB</span>
          </button>
          <button
            onClick={onOpenHealthCheck}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Health Check</span>
          </button>
          <button
            onClick={onRefreshData}
            title="Refresh ERP Data"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 text-xs flex items-center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Dashboard Cards (6 Cards Specified by User) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: 👨🎓 Students */}
        <div
          onClick={() => onNavigateView('students')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Students
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalStudents.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>{activeStudents} Enrolled Active</span>
            </div>
          </div>
        </div>

        {/* Card 2: 👩🏫 Teachers & Staff */}
        <div
          onClick={() => onNavigateView('hr-payroll')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Teachers &amp; Staff
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalStaff}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-purple-600 dark:text-purple-400 font-semibold gap-1">
              <span>{totalTeachers} Academic Faculty</span>
            </div>
          </div>
        </div>

        {/* Card 3: 🏫 Classes & Sections */}
        <div
          onClick={() => onNavigateView('analytics')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Classes &amp; Sections
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalClasses} Grades
            </div>
            <div className="mt-1 flex items-center text-[11px] text-sky-600 dark:text-sky-400 font-semibold gap-1">
              <span>{totalSections} Active Sections</span>
            </div>
          </div>
        </div>

        {/* Card 4: 📅 Attendance */}
        <div
          onClick={() => onNavigateView('attendance')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Today's Attendance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {attendanceRate}%
            </div>
            <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Target: 92% (Normal)</span>
            </div>
          </div>
        </div>

        {/* Card 5: 💰 Fees Collected */}
        <div
          onClick={() => onNavigateView('fees-invoicing')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Fees Collected
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ${totalCollected.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
              <span>{collectionRate}% Collected</span>
            </div>
          </div>
        </div>

        {/* Card 6: ⚠️ Pending Fees */}
        <div
          onClick={() => onNavigateView('fees-invoicing')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pending Fees
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              ${totalPendingFees.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-rose-500 font-semibold gap-1">
              <span>14 Overdue Invoices</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Bar (6 Actions Specified by User) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Quick ERP Actions
          </h2>
          <span className="text-[11px] text-slate-400">One-click operational shortcuts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {/* Action 1: Add Student */}
          <button
            onClick={() => onNavigateView('students')}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Add Student</span>
          </button>

          {/* Action 2: Collect Fee */}
          <button
            onClick={() => onNavigateView('fees-invoicing')}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CircleDollarSign className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Collect Fee</span>
          </button>

          {/* Action 3: Mark Attendance */}
          <button
            onClick={() => onNavigateView('attendance')}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Mark Attendance</span>
          </button>

          {/* Action 4: Enter Marks */}
          <button
            onClick={() => onNavigateView('exams')}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Enter Marks</span>
          </button>

          {/* Action 5: Create Notice */}
          <button
            onClick={() => onNavigateView('communication')}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Create Notice</span>
          </button>

          {/* Action 6: Issue Book */}
          <button
            onClick={() => onNavigateView('library')}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Issue Book</span>
          </button>

          {/* Action 7: Integrity Fixer */}
          <button
            onClick={() => onNavigateView('backup-integrity')}
            className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-500 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Fix Conflicts</span>
          </button>
        </div>
      </div>

      {/* 4. Analytics Area (4 Analytics Modules Specified by User) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analytics 1: 📈 Student Attendance Weekly Trend */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-500" />
                Student Attendance Trend (Weekly)
              </h2>
              <p className="text-xs text-slate-500">Daily verification across all academic blocks</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Avg 94.8%
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { day: 'Monday', rate: 96, count: 1363, color: 'bg-emerald-500' },
              { day: 'Tuesday', rate: 95, count: 1349, color: 'bg-emerald-500' },
              { day: 'Wednesday', rate: 97, count: 1377, color: 'bg-emerald-600' },
              { day: 'Thursday', rate: 93, count: 1320, color: 'bg-emerald-500' },
              { day: 'Friday (Today)', rate: 95, count: 1351, color: 'bg-indigo-600' },
            ].map((d) => (
              <div key={d.day} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{d.day}</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {d.rate}% ({d.count} present)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${d.color} transition-all duration-500`}
                    style={{ width: `${d.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics 2: 📊 Fee Collection Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-sky-500" />
                Fee Collection Status
              </h2>
              <p className="text-xs text-slate-500">Collected vs outstanding tuition &amp; fees</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              85% Target Met
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Total Billed:</span>
              <strong className="text-slate-900 dark:text-white font-mono">${totalInvoiced.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Realized Collections:</span>
              <strong className="text-emerald-600 font-mono">${totalCollected.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Pending Dues:</span>
              <strong className="text-rose-500 font-mono">${totalPendingFees.toLocaleString()}</strong>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: `${collectionRate}%` }} />
              <div className="bg-rose-400 h-full" style={{ width: `${100 - collectionRate}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Tuition</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">$310,000</div>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Transport</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">$64,000</div>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Lab / Tech</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">$44,500</div>
            </div>
          </div>
        </div>

        {/* Analytics 3: 📚 Academic Performance */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-500" />
                Academic Performance (Term 2)
              </h2>
              <p className="text-xs text-slate-500">Grade distribution and examination metrics</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              98.4% Pass Rate
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
              <span className="text-lg font-black text-purple-700 dark:text-purple-300">32%</span>
              <div className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Grade A+</div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
              <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">44%</span>
              <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Grade A</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <span className="text-lg font-black text-blue-700 dark:text-blue-300">18%</span>
              <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Grade B</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-lg font-black text-slate-700 dark:text-slate-300">6%</span>
              <div className="text-[10px] uppercase font-bold text-slate-500">Grade C</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Top Subject: Advanced STEM &amp; Physics</span>
            </div>
            <strong className="text-indigo-600 dark:text-indigo-400 font-mono">92.4% avg</strong>
          </div>
        </div>

        {/* Analytics 4: 💵 Income vs Expenses */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Income vs Expenses
              </h2>
              <p className="text-xs text-slate-500">Monthly fiscal cash flow statement</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              +28.4% Margin
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Monthly Fee Revenue:
                </span>
                <strong className="font-mono text-emerald-600">$142,500</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Operational Expenses &amp; Payroll:
                </span>
                <strong className="font-mono text-rose-500">$102,000</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">Net Surplus:</span>
                <strong className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">+$40,500</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Notification Panel (Interactive, dismissible alerts requested by user) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Live School Notification Center
              </h2>
              <p className="text-xs text-slate-500">
                New admissions, fee deadlines, attendance reminders, scheduled exams, and announcements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {visibleNotifications.length} Active
            </span>
            {visibleNotifications.length < notificationItems.length && (
              <button
                onClick={() => setDismissedNotifications([])}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Reset Alerts
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleNotifications.map((n) => {
            const IconComponent = n.icon;
            return (
              <div
                key={n.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-400 transition-all space-y-1.5 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${n.badgeColor}`}>
                    {n.badge}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                    <button
                      onClick={() => setDismissedNotifications((prev) => [...prev, n.id])}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <IconComponent className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{n.title}</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {n.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Academic Calendar & Class Timetable Quick Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Calendar Widget */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Academic Calendar Highlights
            </h2>
            <span className="text-xs font-semibold text-slate-500 font-mono">Session 2025-2026</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {[
              { date: 'Oct 02, 2026', event: 'Mid-Term 1 Faculty Grade Moderation', category: 'Academic', color: 'text-indigo-600' },
              { date: 'Oct 15, 2026', event: 'Term 2 Final Examinations Start', category: 'Exam', color: 'text-purple-600' },
              { date: 'Oct 28, 2026', event: 'Quarterly Parent-Teacher Conference', category: 'Community', color: 'text-emerald-600' },
              { date: 'Nov 12, 2026', event: 'Annual STEM & Robotics Exhibition', category: 'Exhibition', color: 'text-amber-600' },
            ].map((ev, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 font-mono font-bold text-[11px] text-slate-400">
                    {ev.date}
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ev.event}
                  </span>
                </div>
                <span className={`text-[10px] font-bold ${ev.color}`}>
                  {ev.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Timetable Preview (Grade 10-A) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Today's Class Schedule (Grade 10-A)
            </h2>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Period 3 in Session
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {[
              { period: 'P1', time: '08:00 - 08:50', subject: 'Mathematics (Calculus)', teacher: 'Clara Oswald, M.Ed.', room: 'Science Wing 201' },
              { period: 'P2', time: '08:55 - 09:45', subject: 'Physics & Lab Practicum', teacher: 'Clara Oswald, M.Ed.', room: 'STEM Lab 1' },
              { period: 'P3', time: '10:05 - 10:55', subject: 'English World Literature', teacher: 'Ms. Sarah Jenkins', room: 'Hall B-101' },
              { period: 'P4', time: '11:00 - 11:50', subject: 'Chemistry Analysis', teacher: 'Dr. Robert Ford', room: 'Chem Lab 2' },
            ].map((slot) => (
              <div key={slot.period} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {slot.period}
                  </span>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{slot.subject}</div>
                    <div className="text-[10px] text-slate-400">{slot.teacher} · {slot.room}</div>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-slate-500">{slot.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Connected Google Sheets 28-Sheet Database Status Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/50 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Google Sheets Central Database (28 Tables)
              </h2>
              {connectedSheetId ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  Connected &amp; Auto-Save Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  Ready to Link
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {connectedSheetTitle
                ? `Active Sheet: "${connectedSheetTitle}" — Automated background auto date save across all 28 institutional sheets.`
                : 'Connect or generate a dedicated 28-tab Google Spreadsheet to automatically backup school master data.'}
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
              disabled={isSyncingSheets || !connectedSheetId}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? 'Syncing...' : 'Sync 28 Sheets Now'}</span>
            </button>
          )}
          <button
            onClick={onOpenSheetModal}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-1.5 transition-colors"
          >
            <span>Manage 28 Sheets →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
