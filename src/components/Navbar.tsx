import React, { useState } from 'react';
import {
  School,
  Search,
  Activity,
  Bell,
  Plus,
  Moon,
  Sun,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  FileSpreadsheet,
  ShieldCheck,
  Users,
  CalendarCheck,
  CircleDollarSign,
  Boxes,
  GraduationCap,
  Briefcase,
  Settings,
  ChevronDown,
  X,
  Lock,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SchoolProfile, Campus, UserRole } from '../types/erp';
import { ERPView } from './Sidebar';

interface NavbarProps {
  schoolProfile: SchoolProfile;
  campuses: Campus[];
  selectedCampusId: string;
  onSelectCampus: (campusId: string) => void;
  academicSession: string;
  onSelectAcademicSession: (session: string) => void;
  currentUser: User | null;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: (theme: 'light' | 'dark' | 'system') => void;
  onOpenSearch: () => void;
  onOpenHealthCheck: () => void;
  onOpenQuickAdmission: () => void;
  onOpenQuickFee: () => void;
  hasWorkspaceAuth: boolean;
  announcementsCount: number;
  connectedSheetTitle?: string | null;
  onOpenSheetModal?: () => void;
  onOpenAdminLoginModal?: () => void;
  onNavigateToView?: (view: ERPView) => void;
  studentCount?: number;
  todayAttendanceRate?: number;
  totalCollectedFees?: number;
  lowStockCount?: number;
  staffCount?: number;
  activeExamTerm?: string;
  announcements?: any[];
}

export const Navbar: React.FC<NavbarProps> = ({
  schoolProfile,
  campuses,
  selectedCampusId,
  onSelectCampus,
  academicSession,
  onSelectAcademicSession,
  currentUser,
  currentRole,
  onChangeRole,
  onSignIn,
  onSignOut,
  theme,
  onToggleTheme,
  onOpenSearch,
  onOpenHealthCheck,
  onOpenQuickAdmission,
  onOpenQuickFee,
  hasWorkspaceAuth,
  announcementsCount,
  connectedSheetTitle,
  onOpenSheetModal,
  onOpenAdminLoginModal,
  onNavigateToView,
  studentCount = 1420,
  todayAttendanceRate = 95.2,
  totalCollectedFees = 418500,
  lowStockCount = 4,
  staffCount = 48,
  activeExamTerm = 'Term 2 (Published)',
  announcements = [],
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const roles: UserRole[] = [
    'Super Admin',
    'Admin',
    'Principal',
    'Accountant',
    'HR Manager',
    'Teacher',
    'Receptionist',
    'POS Operator',
    'Parent',
    'Student',
  ];

  const activeAnnouncements = announcements.filter((a) => !dismissedAlerts.includes(a.id));

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      {/* Top Primary Bar */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: School Identity & Campus / Session Selectors */}
        <div className="flex items-center gap-3 lg:gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20 shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                {schoolProfile.schoolName}
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                  ERP Hub
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Code: {schoolProfile.schoolCode} · Est. {schoolProfile.establishedYear}
              </p>
            </div>
          </div>

          {/* Campus Selector */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={selectedCampusId}
              onChange={(e) => onSelectCampus(e.target.value)}
              className="bg-transparent border-none outline-none font-medium cursor-pointer pr-1"
            >
              <option value="all">All Campuses (Central)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Session Selector */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={academicSession}
              onChange={(e) => onSelectAcademicSession(e.target.value)}
              className="bg-transparent border-none outline-none font-medium cursor-pointer pr-1"
            >
              <option value="2025-2026">Session 2025-2026 (Active)</option>
              <option value="2024-2025">Session 2024-2025 (Archive)</option>
              <option value="2026-2027">Session 2026-2027 (Planning)</option>
            </select>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-sm mx-2 hidden xl:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all shadow-xs"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search students, invoices, staff, modules...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 shadow-xs">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Actions Button */}
          <div className="relative">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quick Action</span>
            </button>
            {showQuickMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onOpenQuickAdmission();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-500" />
                  New Student Admission
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onOpenQuickFee();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Collect Fee Payment
                </button>
              </div>
            )}
          </div>

          {/* Google Sheets / Database Status */}
          {onOpenSheetModal && (
            <button
              onClick={onOpenSheetModal}
              title={connectedSheetTitle ? `Active Sheet: ${connectedSheetTitle}` : 'Connect Google Sheet Database'}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                connectedSheetTitle
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden md:inline">
                {connectedSheetTitle ? 'Sheets DB' : 'Backup DB'}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${connectedSheetTitle ? 'bg-emerald-500' : 'bg-amber-400'}`}
              />
            </button>
          )}

          {/* Security Status Badge */}
          <div
            title="PBKDF2 Salted Hashing & Inactivity Watchdog Active"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[11px] font-semibold">Protected</span>
          </div>

          {/* System Health Pulse */}
          <button
            onClick={onOpenHealthCheck}
            title="Complete System Health Check"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden md:inline">Healthy</span>
            <Activity className="w-3.5 h-3.5 ml-0.5 text-emerald-600" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
              title="System Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
              {activeAnnouncements.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                  {activeAnnouncements.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3 px-4 z-50 animate-in fade-in space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Notifications &amp; Alerts
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {activeAnnouncements.length} Active
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                  {activeAnnouncements.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      All system alerts and notifications cleared.
                    </div>
                  ) : (
                    activeAnnouncements.map((ann) => (
                      <div
                        key={ann.id}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {ann.title}
                          </span>
                          <button
                            onClick={() => setDismissedAlerts((prev) => [...prev, ann.id])}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {ann.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Messages & Circulars Shortcut */}
          {onNavigateToView && (
            <button
              onClick={() => onNavigateToView('communication')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Parent & Faculty Messages / Notices (SMS & Email)"
            >
              <MessageSquare className="w-4 h-4 text-indigo-500" />
            </button>
          )}

          {/* Theme Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onToggleTheme('light')}
              className={`p-1.5 rounded-md ${
                theme === 'light'
                  ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleTheme('dark')}
              className={`p-1.5 rounded-md ${
                theme === 'dark'
                  ? 'bg-white dark:bg-slate-700 text-indigo-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              title="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Settings Shortcut */}
          {onNavigateToView && (
            <button
              onClick={() => onNavigateToView('appearance')}
              title="Settings & Appearance Studio"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="font-semibold">{currentRole}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 max-h-64 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Simulate Role Access
                </div>
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onChangeRole(r);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 ${
                      currentRole === r
                        ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {r}
                    {currentRole === r && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Google Workspace Account Sign-in / User Profile */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={onOpenAdminLoginModal}
                title="Manage Admin Session & Access"
                className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full ring-2 ring-indigo-500/30 overflow-hidden bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0).toUpperCase() || 'A'
                  )}
                </div>
                <div className="hidden xl:block">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {currentUser.displayName || 'Authorized Admin'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {currentUser.email}
                  </div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={onSignOut}
                title="Log Out & Invalidate Session"
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onSignIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
              >
                <span>Sign in</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-bar: Real-Time Operational KPI & Module Ticker */}
      <div className="h-10 px-4 sm:px-6 bg-slate-50/90 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          {/* 📊 Student summary */}
          <button
            onClick={() => onNavigateToView && onNavigateToView('students')}
            className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{studentCount.toLocaleString()}</span>
            <span className="text-[11px] text-slate-500">Students</span>
          </button>

          {/* 📝 Attendance */}
          <button
            onClick={() => onNavigateToView && onNavigateToView('attendance')}
            className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{todayAttendanceRate}%</span>
            <span className="text-[11px] text-slate-500">Present</span>
          </button>

          {/* 💰 Fees & Finance */}
          <button
            onClick={() => onNavigateToView && onNavigateToView('fees-invoicing')}
            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <CircleDollarSign className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">${(totalCollectedFees / 1000).toFixed(1)}k</span>
            <span className="text-[11px] text-slate-500">Fees Collected</span>
          </button>

          {/* 📦 Inventory/POS */}
          <button
            onClick={() => onNavigateToView && onNavigateToView('inventory-pos')}
            className="flex items-center gap-1.5 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <Boxes className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{lowStockCount} Items</span>
            <span className="text-[11px] text-slate-500">Low Stock</span>
          </button>

          {/* 👨‍🏫 Staff & Payroll */}
          <button
            onClick={() => onNavigateToView && onNavigateToView('hr-payroll')}
            className="flex items-center gap-1.5 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-purple-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{staffCount}</span>
            <span className="text-[11px] text-slate-500">Staff Active</span>
          </button>

          {/* 📑 Exams & Results */}
          <button
            onClick={() => onNavigateToView && onNavigateToView('exams')}
            className="flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5 text-teal-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{activeExamTerm}</span>
          </button>
        </div>

        {/* Right ticker alert */}
        <div className="hidden md:flex items-center gap-2 pl-4 text-[11px] text-slate-500 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Multi-Campus Gateway Live</span>
        </div>
      </div>
    </header>
  );
};
