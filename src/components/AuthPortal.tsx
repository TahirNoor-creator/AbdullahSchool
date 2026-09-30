import React, { useState } from 'react';
import {
  School,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Building2,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  KeyRound,
  RefreshCw,
  Sun,
  Moon,
  Unlock,
  HelpCircle,
  X,
} from 'lucide-react';
import { UserRole, Campus } from '../types/erp';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  designation?: string;
  campusId: string;
  academicSession: string;
  avatarBg?: string;
}

interface AuthPortalProps {
  onLoginSuccess: (
    user: AuthenticatedUser,
    token: string,
    redirectView: string,
    rememberMe: boolean
  ) => void;
  onGoogleSignIn: () => Promise<void>;
  campuses: Campus[];
  currentCampusId: string;
  currentAcademicSession: string;
  onSelectCampus: (campusId: string) => void;
  onSelectAcademicSession: (session: string) => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: (theme: 'light' | 'dark' | 'system') => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onLoginSuccess,
  onGoogleSignIn,
  campuses,
  currentCampusId,
  currentAcademicSession,
  onSelectCampus,
  onSelectAcademicSession,
  theme,
  onToggleTheme,
  onShowToast,
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('superadmin@oakridgeacademy.edu');
  const [password, setPassword] = useState('Oakridge@2025!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Lockout State
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState<number>(0);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockEmail, setUnlockEmail] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Demo accounts for fast evaluation
  const demoAccounts = [
    {
      role: 'Super Admin' as UserRole,
      label: 'Super Admin',
      email: 'superadmin@oakridgeacademy.edu',
      name: 'Dr. Eleanor Vance',
      pass: 'Oakridge@2025!',
      badgeBg: 'bg-indigo-600',
    },
    {
      role: 'Principal' as UserRole,
      label: 'Principal',
      email: 'principal@oakridgeacademy.edu',
      name: 'Marcus Sterling',
      pass: 'Oakridge@2025!',
      badgeBg: 'bg-blue-600',
    },
    {
      role: 'Accountant' as UserRole,
      label: 'Accountant',
      email: 'accountant@oakridgeacademy.edu',
      name: 'Sarah Jenkins, CPA',
      pass: 'Oakridge@2025!',
      badgeBg: 'bg-emerald-600',
    },
    {
      role: 'HR Manager' as UserRole,
      label: 'HR Manager',
      email: 'hr@oakridgeacademy.edu',
      name: 'David Chen',
      pass: 'Oakridge@2025!',
      badgeBg: 'bg-purple-600',
    },
    {
      role: 'Teacher' as UserRole,
      label: 'Teacher',
      email: 'teacher@oakridgeacademy.edu',
      name: 'Prof. Elizabeth Warren',
      pass: 'Oakridge@2025!',
      badgeBg: 'bg-teal-600',
    },
    {
      role: 'Receptionist' as UserRole,
      label: 'Gate / Security',
      email: 'security@oakridgeacademy.edu',
      name: 'Officer Thomas Jackson',
      pass: 'Oakridge@2025!',
      badgeBg: 'bg-amber-600',
    },
    {
      role: 'POS Operator' as UserRole,
      label: 'School Store POS',
      email: 'pos@oakridgeacademy.edu',
      name: 'Liam Henderson',
      pass: 'Oakridge@2025!',
      badgeBg: 'bg-sky-600',
    },
    {
      role: 'Student' as UserRole,
      label: 'Student Portal',
      email: 'student@oakridgeacademy.edu',
      name: 'Alexander Hayes',
      pass: 'Oakridge@2025!',
      badgeBg: 'bg-emerald-600',
    },
    {
      role: 'Parent' as UserRole,
      label: 'Parent Portal',
      email: 'parent@oakridgeacademy.edu',
      name: 'Robert & Clara Hayes',
      pass: 'Oakridge@2025!',
      badgeBg: 'bg-cyan-600',
    },
  ];

  const handleSelectDemoAccount = (acc: (typeof demoAccounts)[0]) => {
    setUsernameOrEmail(acc.email);
    setPassword(acc.pass);
    setErrorMessage(null);
    setIsLocked(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      setErrorMessage('Please enter your institutional email or username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          password,
          campusId: currentCampusId,
          academicSession: currentAcademicSession,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 423 || data.locked) {
          setIsLocked(true);
          setLockRemainingSeconds(data.remainingSeconds || 900);
          setUnlockEmail(usernameOrEmail);
          setErrorMessage(data.error || 'Account locked due to consecutive failed attempts.');
        } else {
          setErrorMessage(data.error || 'Invalid credentials. Please try again.');
          if (data.attemptsRemaining !== undefined) {
            setAttemptsRemaining(data.attemptsRemaining);
          }
        }
        return;
      }

      // Success
      setIsLocked(false);
      onShowToast(
        'success',
        'Authentication Successful',
        `Welcome back, ${data.user.name} (${data.user.role}). Redirecting to module...`
      );

      onLoginSuccess(data.user, data.token, data.defaultRedirect || 'command-center', rememberMe);
    } catch (err: any) {
      console.error('Login submit error:', err);
      setErrorMessage('Failed to connect to authentication server. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockCode.trim()) {
      onShowToast('error', 'Unlock Code Required', 'Please enter the institutional security unlock code.');
      return;
    }

    setIsUnlocking(true);
    try {
      const res = await fetch('/api/auth/unlock-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: unlockEmail || usernameOrEmail,
          unlockCode: unlockCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', 'Unlock Failed', data.error || 'Invalid security unlock code.');
        return;
      }

      setIsLocked(false);
      setErrorMessage(null);
      setShowUnlockModal(false);
      onShowToast('success', 'Account Unlocked', data.message || 'Account successfully unlocked.');
    } catch (err) {
      onShowToast('error', 'Error', 'Could not reach server to unlock account.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      onShowToast('error', 'Email Required', 'Please enter your registered institutional email.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', 'Request Failed', data.error || 'Could not process request.');
        return;
      }

      if (data.resetCode) {
        setResetCode(data.resetCode);
      }
      setForgotStep('verify');
      onShowToast('success', 'Reset Code Generated', data.message);
    } catch (err) {
      onShowToast('error', 'Error', 'Failed to request password reset code.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword) {
      onShowToast('error', 'Missing Information', 'Please provide the 6-digit code and a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast('error', 'Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetCode: resetCode.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', 'Reset Failed', data.error || 'Password update failed.');
        return;
      }

      onShowToast('success', 'Password Updated', 'Your password has been securely reset. Please log in.');
      setPassword(newPassword);
      setShowForgotModal(false);
      setForgotStep('request');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      onShowToast('error', 'Error', 'Failed to update password.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Graphic Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-600/25 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-[130px]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">
              Oakridge International Academy &amp; College
            </h1>
            <p className="text-[11px] text-slate-400">
              Enterprise School Management ERP &amp; Command Center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Security Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PBKDF2 Salting &amp; SSL Enforced</span>
          </div>

          {/* Theme switcher */}
          <button
            onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Toggle Visual Appearance"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </header>

      {/* Central Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Card Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Administrative Gateway &amp; Single Sign-On</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Access real-time command center, academics, financial ledger, and campus operations.
            </p>
          </div>

          {/* Error / Locked Alert */}
          {errorMessage && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-all animate-in fade-in ${
                isLocked
                  ? 'bg-rose-950/70 border-rose-800/80 text-rose-200'
                  : 'bg-amber-950/70 border-amber-800/80 text-amber-200'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 shrink-0 ${isLocked ? 'text-rose-400' : 'text-amber-400'}`} />
              <div className="flex-1 space-y-1">
                <div className="font-bold">
                  {isLocked ? 'Account Temporarily Locked' : 'Authentication Notice'}
                </div>
                <div>{errorMessage}</div>
                {isLocked && (
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowUnlockModal(true)}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Security Unlock Code</span>
                    </button>
                    <span className="text-[11px] text-rose-300/80">
                      Timer: {Math.ceil(lockRemainingSeconds / 60)}m left
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Campus and Academic Session Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Assigned Campus</span>
                </label>
                <select
                  value={currentCampusId}
                  onChange={(e) => onSelectCampus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="all">All Campuses (Central Control)</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Academic Session</span>
                </label>
                <select
                  value={currentAcademicSession}
                  onChange={(e) => onSelectAcademicSession(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="2025-2026">2025-2026 (Active Session)</option>
                  <option value="2024-2025">2024-2025 (Archived Session)</option>
                  <option value="2026-2027">2026-2027 (Upcoming Planning)</option>
                </select>
              </div>
            </div>

            {/* Email or Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Institutional Email or Username</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => {
                    setUsernameOrEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. principal@oakridgeacademy.edu or superadmin"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <UserIcon className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password with Show/Hide toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(usernameOrEmail);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-white absolute right-2.5 top-2 rounded-lg transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Session Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Remember session for 7 days</span>
              </label>

              <span className="text-[11px] text-slate-500">
                Auto-timeout: 15 min inactive
              </span>
            </div>

            {/* Submit Login Button */}
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : isLocked ? (
                <>
                  <Lock className="w-4 h-4 text-rose-300" />
                  <span>Account Locked (Unlock Required)</span>
                </>
              ) : (
                <>
                  <span>Authenticate &amp; Launch ERP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Or 1-Click Fast Access
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Quick Role Fill Pills */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>Select Pre-configured Role Profile:</span>
              <span className="text-slate-500 text-[10px]">Test Pass: Oakridge@2025!</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectDemoAccount(acc)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    usernameOrEmail === acc.email
                      ? 'border-indigo-500 bg-indigo-950/60 ring-1 ring-indigo-500/50'
                      : 'border-slate-800/80 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${acc.badgeBg}`} />
                    <span className="text-xs font-bold text-white truncate">{acc.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{acc.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Google Workspace SSO Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={async () => {
                try {
                  await onGoogleSignIn();
                } catch (err: any) {
                  onShowToast('error', 'Google SSO Failed', err.message || 'Google login error.');
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-700/90 hover:bg-slate-800/80 text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Single Sign-On with Google Workspace</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-3">
          <span>Oakridge ERP Engine v4.2</span>
          <span>·</span>
          <span>Zero Plain-Text Passwords</span>
          <span>·</span>
          <span>Role-Based Access Enforcement</span>
        </div>
        <div>
          Security Master Unlock Key: <code className="text-slate-400 font-mono">OAKRIDGE-SECURE-UNLOCK-2025</code>
        </div>
      </footer>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 text-left relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Password Recovery Studio</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotRequest} className="space-y-4 text-xs">
                <p className="text-slate-400">
                  Enter your registered institutional email. A secure 6-digit recovery code will be dispatched.
                </p>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Institutional Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@oakridgeacademy.edu"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Dispatch Reset Code</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
                <p className="text-slate-400">
                  Enter the 6-digit verification code sent to your email and declare your new password.
                </p>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">6-Digit Verification Code</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="e.g. 849201"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-center tracking-widest text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New secure password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Update Password &amp; Unlock</span>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ACCOUNT UNLOCK MODAL */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-rose-900/60 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 text-left relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                  <Unlock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Emergency Account Unlock</h3>
              </div>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-4 text-xs">
              <p className="text-slate-400">
                To bypass the 15-minute security lock, enter the institutional administrator unlock authorization code.
              </p>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Email</label>
                <input
                  type="email"
                  value={unlockEmail}
                  onChange={(e) => setUnlockEmail(e.target.value)}
                  placeholder="e.g. principal@oakridgeacademy.edu"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Master Unlock Authorization Code</label>
                <input
                  type="text"
                  value={unlockCode}
                  onChange={(e) => setUnlockCode(e.target.value)}
                  placeholder="OAKRIDGE-SECURE-UNLOCK-2025"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Default authorization: <code className="text-rose-400">OAKRIDGE-SECURE-UNLOCK-2025</code>
                </span>
              </div>
              <button
                type="submit"
                disabled={isUnlocking}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isUnlocking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Authorize Instant Unlock</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
