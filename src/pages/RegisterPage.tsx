import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Phone, User, ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';

interface RegisterPageProps {
  onGoToLogin: () => void;
  onGoToVerify: (phone: string, simulatedCode?: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onGoToLogin, onGoToVerify }) => {
  const { register, showToast } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+998')) val = '+998 ';
    
    const digits = val.replace(/\D/g, '').substring(3);
    let formatted = '+998 ';
    if (digits.length > 0) formatted += digits.substring(0, 2);
    if (digits.length >= 3) formatted += ' ' + digits.substring(2, 5);
    if (digits.length >= 6) formatted += ' ' + digits.substring(5, 7);
    if (digits.length >= 8) formatted += ' ' + digits.substring(7, 9);

    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast("Ism va familiyani to'liq kiriting.", 'warning');
      return;
    }

    setLoading(true);
    const res = await register(firstName, lastName, phone, role);
    setLoading(false);

    if (res.success) {
      showToast("Ro'yxatdan o'tdingiz! Telegram orqali tasdiqlang.", 'success');
      onGoToVerify(phone, res.simulatedCode);
    } else {
      showToast(res.error || "Xatolik yuz berdi.", 'error');
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
            Ro‘yxatdan O‘tish
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Platformadan foydalanish uchun ma'lumotlaringizni kiriting
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Ism
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Ali"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Familiya
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Valiyev"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

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
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Shakli: +998 XX XXX XX XX</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Rol
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  role === 'STUDENT'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                👤 Talaba / O‘quvchi
              </button>
              <button
                type="button"
                onClick={() => setRole('TEACHER')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  role === 'TEACHER'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                🎓 Ustoz / O‘qituvchi
              </button>
            </div>
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
                Davom etish (Telegram orqali tasdiqlash) <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Hisobingiz bormi?{' '}
          <button
            onClick={onGoToLogin}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Kirish
          </button>
        </div>
      </div>
    </div>
  );
};
