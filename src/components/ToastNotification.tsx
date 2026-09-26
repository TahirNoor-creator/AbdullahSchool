import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, ExternalLink } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  url?: string;
  urlLabel?: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start justify-between gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-md ${
        toast.type === 'success'
          ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700/60 shadow-emerald-950/40'
          : toast.type === 'error'
          ? 'bg-rose-950/90 text-rose-100 border-rose-700/60 shadow-rose-950/40'
          : 'bg-slate-900/95 text-slate-100 border-slate-700 shadow-slate-950/50'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400" />}
        </div>
        <div className="space-y-1">
          <div className="font-bold">{toast.title}</div>
          <div className="text-[11px] opacity-90 leading-relaxed">{toast.message}</div>
          {toast.url && (
            <a
              href={toast.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold underline hover:opacity-80"
            >
              <span>{toast.urlLabel || 'Open Linked Google Document'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg hover:bg-white/10 shrink-0 text-white/60 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
