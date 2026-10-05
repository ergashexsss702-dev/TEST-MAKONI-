import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, ShieldCheck, Clock, RefreshCw, Bot, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import { TelegramSimulatorModal } from '../components/TelegramSimulatorModal';

interface VerifyTelegramPageProps {
  phone: string;
  simulatedCode?: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const VerifyTelegramPage: React.FC<VerifyTelegramPageProps> = ({
  phone,
  simulatedCode: initialCode,
  onSuccess,
  onBack
}) => {
  const { verifyCode, showToast, lastSimulatedCode } = useAuth();
  const [code, setCode] = useState(initialCode || lastSimulatedCode || '');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);

  // 5-minute countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const handleVerify = async (codeToSubmit?: string) => {
    const finalCode = (codeToSubmit || code).trim();
    if (finalCode.length !== 6) {
      showToast("6 xonali tasdiqlash kodini to'liq kiriting.", 'warning');
      return;
    }

    setLoading(true);
    const res = await verifyCode(phone, finalCode);
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      showToast(res.error || "Kod tasdiqlanmadi.", 'error');
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (res.ok) {
        setSecondsLeft(300);
        showToast("Yangi kod Telegram botga yuborildi!", 'success');
        if (data.simulatedCode) {
          setCode(data.simulatedCode);
        }
      } else {
        showToast(data.error || "Xatolik yuz berdi.", 'error');
      }
    } catch (err) {
      showToast("Tarmoq xatosi.", 'error');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Ortga qaytish
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#2aabee]/10 text-[#2aabee] flex items-center justify-center shadow-inner">
            <Bot className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Telegram orqali tasdiqlang
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{phone}</span> raqamiga Telegram bot orqali tasdiqlash kodi yuborildi
          </p>
        </div>

        {/* Telegram Bot Action Launcher */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2aabee] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>1.</strong> Telegram botga kiring va <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">/start</span> yoki <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">/kod</span> buyrug‘ini bosing.
              <br />
              <strong>2.</strong> Bot bergan 6 xonali kodni bu yerga kiriting.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBotModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2aabee] hover:bg-[#259cdb] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#2aabee]/25 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Telegram Botni ochish va kodni ko‘rish
          </button>
        </div>

        {/* Code Input Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                6 xonali tasdiqlash kodi
              </label>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{timeFormatted}</span>
              </div>
            </div>

            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
              placeholder="123456"
              autoFocus
              className="w-full py-3.5 text-center font-mono text-2xl font-black tracking-[0.4em] rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Hisobni tasdiqlash va kirish
              </>
            )}
          </button>
        </form>

        {/* Resend & Security Notes */}
        <div className="text-center space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleResend}
            disabled={secondsLeft > 0}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40 disabled:no-underline inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Yangi kod yuborish {secondsLeft > 0 && `(${secondsLeft}s)`}
          </button>

          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Kod bir martalik bo'lib, 5 daqiqa amal qiladi
          </p>
        </div>
      </div>

      {/* Interactive Telegram Bot Simulator Modal */}
      <TelegramSimulatorModal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        phone={phone}
        onCodeSelected={(newCode) => {
          setCode(newCode);
          setIsBotModalOpen(false);
          handleVerify(newCode);
        }}
      />
    </div>
  );
};
