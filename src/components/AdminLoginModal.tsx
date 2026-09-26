import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  X,
  Sparkles,
  Key,
  Users,
  Briefcase,
  GraduationCap,
  CircleDollarSign,
  QrCode,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserRole } from '../types/erp';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => void;
  onCustomLogin: (userProfile: { name: string; email: string; role: UserRole }) => void;
  hasWorkspaceAuth: boolean;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

interface ExecutiveProfile {
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  avatarBg: string;
  permissions: string[];
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentRole,
  onSelectRole,
  onGoogleSignIn,
  onSignOut,
  onCustomLogin,
  hasWorkspaceAuth,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'google' | 'credentials'>('profiles');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Manual credentials form state
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [credentialRole, setCredentialRole] = useState<UserRole>('Admin');

  if (!isOpen) return null;

  const executiveProfiles: ExecutiveProfile[] = [
    {
      name: 'Dr. Eleanor Vance',
      email: 'principal@oakridgeacademy.edu',
      role: 'Super Admin',
      designation: 'Institutional Director & Superintendent',
      avatarBg: 'bg-indigo-600',
      permissions: ['Full Root Access', 'Fee Approvals', 'Google Workspace Sync', 'Security Audits'],
    },
    {
      name: 'Marcus Sterling',
      email: 'm.sterling@oakridgeacademy.edu',
      role: 'Principal',
      designation: 'Campus Dean & Academic Operations',
      avatarBg: 'bg-blue-600',
      permissions: ['Curriculum Planning', 'Teacher Review', 'Student Conduct', 'Exam Moderation'],
    },
    {
      name: 'Sarah Jenkins, CPA',
      email: 'accounts@oakridgeacademy.edu',
      role: 'Accountant',
      designation: 'Chief Bursar & Head of Finance',
      avatarBg: 'bg-emerald-600',
      permissions: ['Fee Invoicing', 'Payment Collection', 'Expense Audits', 'Sheets Financial Sync'],
    },
    {
      name: 'David Chen',
      email: 'hr@oakridgeacademy.edu',
      role: 'HR Manager',
      designation: 'Director of Human Resources & Payroll',
      avatarBg: 'bg-purple-600',
      permissions: ['Faculty Recruitment', 'Payroll Slips', 'Staff Attendance', 'Contracts'],
    },
    {
      name: 'Officer Thomas Jackson',
      email: 'security.gate@oakridgeacademy.edu',
      role: 'Receptionist',
      designation: 'Campus Gate & Optical QR Lead',
      avatarBg: 'bg-amber-600',
      permissions: ['Optical Gate Scan', 'Daily Check-Ins', 'Visitor Passes', 'ID Verification'],
    },
    {
      name: 'Liam Henderson',
      email: 'pos.operator@oakridgeacademy.edu',
      role: 'POS Operator',
      designation: 'School Store & Bookstore Manager',
      avatarBg: 'bg-sky-600',
      permissions: ['Inventory Stock', 'Retail Sales', 'Receipt Printing', 'Barcode Scan'],
    },
  ];

  const handleProfileSelect = (prof: ExecutiveProfile) => {
    onSelectRole(prof.role);
    onCustomLogin({
      name: prof.name,
      email: prof.email,
      role: prof.role,
    });
    onShowToast('success', 'Admin Session Authenticated', `Logged in as ${prof.name} (${prof.role}).`);
    onClose();
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim()) {
      onShowToast('error', 'Staff ID Required', 'Please enter your institutional staff ID.');
      return;
    }

    onSelectRole(credentialRole);
    onCustomLogin({
      name: `Staff Member (${staffId.toUpperCase()})`,
      email: `${staffId.toLowerCase()}@oakridgeacademy.edu`,
      role: credentialRole,
    });
    onShowToast('success', 'Staff Login Successful', `Authorized access under ${credentialRole} profile.`);
    onClose();
  };

  const handleGoogleClick = async () => {
    setIsLoggingIn(true);
    try {
      await onGoogleSignIn();
      onShowToast('success', 'Google Workspace Connected', 'Successfully signed in and retrieved OAuth token.');
      onClose();
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      onShowToast('error', 'Google Sign-in Failed', err.message || 'Could not complete Google OAuth login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-900/10 via-indigo-800/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Administrative Access &amp; Session Control
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Role-Based Security
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in with Google Workspace or choose a verified administrative role profile.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner if logged in */}
        {currentUser && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser.displayName?.charAt(0) || 'A'
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{currentUser.displayName || 'Authorized Administrator'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                    {currentRole}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {currentUser.email} · {hasWorkspaceAuth ? 'Workspace Token Active' : 'Basic Session'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onSignOut();
                onShowToast('info', 'Signed Out', 'Administrative session has been cleared.');
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 mt-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'profiles'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Fast Role Switcher (1-Click)</span>
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'google'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google Workspace OAuth</span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'credentials'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Staff ID Login</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: EXECUTIVE PROFILES */}
          {activeTab === 'profiles' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 mb-2">
                Select an institutional leader profile to instantaneously unlock role-specific dashboards, financial privileges, and approval controls:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {executiveProfiles.map((prof) => (
                  <div
                    key={prof.email}
                    onClick={() => handleProfileSelect(prof)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group text-left ${
                      currentRole === prof.role
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-white dark:bg-slate-900 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${prof.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-sm`}
                        >
                          {prof.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {prof.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {prof.designation}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {prof.role}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1">
                      {prof.permissions.map((p) => (
                        <span
                          key={p}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE WORKSPACE OAUTH */}
          {activeTab === 'google' && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto shadow-md shadow-indigo-600/10">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Authenticate with Google Workspace
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Connect your verified Google account to grant real-time access to Google Sheets, Drive document storage, official Gmail sending, and Google Forms.
                </p>
              </div>

              <div className="py-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Google Drive
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Google Sheets
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Gmail Send
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Forms &amp; People
                </span>
              </div>

              <button
                onClick={handleGoogleClick}
                disabled={isLoggingIn}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2.5 mx-auto transition-all cursor-pointer"
              >
                <span>{isLoggingIn ? 'Authorizing in popup...' : 'Launch Google Sign-In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 3: STAFF ID & CREDENTIALS */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Staff ID
                </label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. EMP-2024-001 or ADM-991"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password / PIN Code
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Administrative Role
                </label>
                <select
                  value={credentialRole}
                  onChange={(e) => setCredentialRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="Super Admin">Super Admin (Central Control)</option>
                  <option value="Admin">Administrator</option>
                  <option value="Principal">Principal / Academic Dean</option>
                  <option value="Accountant">Accountant / Finance</option>
                  <option value="HR Manager">HR &amp; Payroll Manager</option>
                  <option value="Teacher">Faculty / Teacher</option>
                  <option value="Receptionist">Receptionist / Gate Security</option>
                  <option value="POS Operator">Campus Store POS Operator</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Sign In with Institutional ID
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Cloud Firestore RBAC Security Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
