import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map(t => {
        let bg = 'bg-slate-900 text-white border-slate-700';
        let Icon = Info;
        let iconColor = 'text-blue-400';

        if (t.type === 'success') {
          bg = 'bg-emerald-950 text-emerald-100 border-emerald-700';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (t.type === 'error') {
          bg = 'bg-rose-950 text-rose-100 border-rose-700';
          Icon = AlertCircle;
          iconColor = 'text-rose-400';
        } else if (t.type === 'warning') {
          bg = 'bg-amber-950 text-amber-100 border-amber-700';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl text-sm transition-all duration-300 animate-in slide-in-from-bottom-3 ${bg}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 font-medium">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white shrink-0 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
