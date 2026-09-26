import React from 'react';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  secondsRemaining,
  onStayLoggedIn,
  onLogoutNow,
}) => {
  if (!isOpen) return null;

  const percentage = Math.max(0, Math.min(100, (secondsRemaining / 60) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 text-center relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-600/10 ring-4 ring-amber-50 dark:ring-amber-900/20">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Security Inactivity Protocol
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
            Session Expiring Soon
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Due to administrative inactivity, your authenticated session will be terminated to prevent unauthorized access.
          </p>
        </div>

        {/* Countdown Visual */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
            00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Seconds remaining before automatic sign-out
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={onStayLoggedIn}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Stay Logged In</span>
          </button>
          <button
            onClick={onLogoutNow}
            className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Log Out Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
