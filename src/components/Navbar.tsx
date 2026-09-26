import React, { useState } from 'react';
import {
  School,
  Search,
  Activity,
  Bell,
  Plus,
  Moon,
  Sun,
  Laptop,
  LogOut,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Building2,
  Sparkles,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SchoolProfile, Campus, UserRole } from '../types/erp';

interface NavbarProps {
  schoolProfile: SchoolProfile;
  campuses: Campus[];
  selectedCampusId: string;
  onSelectCampus: (campusId: string) => void;
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
}

export const Navbar: React.FC<NavbarProps> = ({
  schoolProfile,
  campuses,
  selectedCampusId,
  onSelectCampus,
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
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

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

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: School Identity & Campus Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
            <School className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
              {schoolProfile.schoolName}
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                ERP Command Center
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Code: {schoolProfile.schoolCode} · {schoolProfile.establishedYear}
            </p>
          </div>
        </div>

        {/* Campus Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
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
        </div>
      </div>

      {/* Middle: Global Search trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
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
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Google Sheets Live Database Pill */}
        {onOpenSheetModal && (
          <button
            onClick={onOpenSheetModal}
            title={connectedSheetTitle ? `Active Sheet: ${connectedSheetTitle}` : 'Connect Google Sheet Database'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              connectedSheetTitle
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">
              {connectedSheetTitle ? 'Sheets DB' : 'Connect Sheets'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectedSheetTitle ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            ></span>
          </button>
        )}

        {/* System Health Pulse */}
        <button
          onClick={onOpenHealthCheck}
          title="Complete System Health Check"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden lg:inline">System Healthy</span>
          <Activity className="w-3.5 h-3.5 ml-0.5 text-emerald-600" />
        </button>

        {/* Quick Actions Button */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all"
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

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span className="font-semibold">{currentRole}</span>
          </button>
          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 max-h-64 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Simulate Role
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
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
            <button
              onClick={onOpenAdminLoginModal}
              title="Manage Admin Session & Access"
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full ring-2 ring-indigo-500/30 overflow-hidden bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
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
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                  {currentUser.email}
                </div>
              </div>
            </button>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onSignIn}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition-all shadow-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in</span>
            </button>
            {onOpenAdminLoginModal && (
              <button
                onClick={onOpenAdminLoginModal}
                title="Admin Profiles & Credentials Login"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
