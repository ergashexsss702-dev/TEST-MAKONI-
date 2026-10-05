import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Phone, ArrowRight, Sparkles, GraduationCap, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onGoToRegister: () => void;
  onGoToVerify: (phone: string, simulatedCode?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onGoToRegister, onGoToVerify }) => {
  const { login, showToast } = useAuth();
  const [phone, setPhone] = useState('+998 ');
  const [loading, setLoading] = useState(false);

  // Format phone as: +998 XX XXX XX XX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+998')) val = '+998 ';
    
    const digits = val.replace(/\D/g, '').substring(3); // after 998
    let formatted = '+998 ';
    if (digits.length > 0) formatted += digits.substring(0, 2);
    if (digits.length >= 3) formatted += ' ' + digits.substring(2, 5);
    if (digits.length >= 6) formatted += ' ' + digits.substring(5, 7);
    if (digits.length >= 8) formatted += ' ' + digits.substring(7, 9);

    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await login(phone);
    setLoading(false);

    if (res.success) {
      showToast("Telegram orqali tasdiqlash kodi yuborildi!", 'success');
      onGoToVerify(phone, res.simulatedCode);
    } else {
      showToast(res.error || "Kirishda xatolik.", 'error');
    }
  };

  const handleQuickLogin = async (quickPhone: string) => {
    setPhone(quickPhone);
    setLoading(true);
    const res = await login(quickPhone);
    setLoading(false);
    if (res.success) {
      showToast("Telegram tasdiqlash kodi olindi!", 'success');
      onGoToVerify(quickPhone, res.simulatedCode);
    } else {
      showToast(res.error || "Kirishda xatolik.", 'error');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tizimga Kirish
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Telefon raqamingiz orqali Telegram bot bilan tasdiqlang
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Telefon raqami
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+998 90 123 45 67"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Shakli: +998 XX XXX XX XX
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Kodni Telegram orqali olish <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access (For review testing) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Sinov uchun tezkor hisoblar:
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('+998 99 111 22 33')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
            >
              <div className="font-bold text-indigo-600 dark:text-indigo-400">👤 Muhammad</div>
              <div className="text-[10px] text-slate-500">Talaba</div>
            </button>

            <button
              onClick={() => handleQuickLogin('+998 93 987 65 43')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
            >
              <div className="font-bold text-emerald-600 dark:text-emerald-400">🎓 Malika</div>
              <div className="text-[10px] text-slate-500">Ustoz</div>
            </button>

            <button
              onClick={() => handleQuickLogin('+998 90 123 45 67')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
            >
              <div className="font-bold text-purple-600 dark:text-purple-400">🛡️ Anvar</div>
              <div className="text-[10px] text-slate-500">Admin</div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
          Hisobingiz yo‘qmi?{' '}
          <button
            onClick={onGoToRegister}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>
      </div>
    </div>
  );
};
