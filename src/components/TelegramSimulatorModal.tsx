import React, { useState } from 'react';
import { Send, Check, Copy, ExternalLink, Bot, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TelegramSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  onCodeSelected?: (code: string) => void;
}

export const TelegramSimulatorModal: React.FC<TelegramSimulatorModalProps> = ({
  isOpen,
  onClose,
  phone,
  onCodeSelected
}) => {
  const { lastSimulatedCode, showToast } = useAuth();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string; code?: string }>>([
    {
      sender: 'bot',
      text: "Assalomu alaykum! TestMakon rasmiy tasdiqlash botiga xush kelibsiz. Saytga kirish uchun telefon raqamingiz orqali tasdiqlash kodini olishingiz mumkin.",
      time: "Hozir"
    }
  ]);
  const [input, setInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(lastSimulatedCode);

  if (!isOpen) return null;

  const handleSend = async (commandText?: string) => {
    const textToSend = commandText || input.trim();
    if (!textToSend) return;

    const timeNow = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { sender: 'user', text: textToSend, time: timeNow }]);
    setInput('');

    // Fetch new OTP from backend
    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      const code = data.simulatedCode || lastSimulatedCode || '839214';
      setGeneratedCode(code);

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `Saytga kirish uchun tasdiqlash kodingiz:\n\n${code}\n\nBu kod 5 daqiqa amal qiladi. Hech kimga bermang!`,
            time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
            code
          }
        ]);
      }, 400);
    } catch (err) {
      console.error(err);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    showToast(`Kod nusxalandi: ${code}`, 'success');
    if (onCodeSelected) {
      onCodeSelected(code);
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 text-white border border-slate-700 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col h-[560px]">
        {/* Telegram Header */}
        <div className="bg-[#242f3d] p-4 flex items-center justify-between border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#2aabee] flex items-center justify-center text-white font-bold shadow-md shadow-[#2aabee]/30">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#242f3d]" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-1.5">
                TestMakon Bot
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xs text-[#2aabee]">bot • onlayn</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telegram Chat Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0e1621] text-sm">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl ${
                  m.sender === 'user'
                    ? 'bg-[#2b5278] text-white rounded-tr-none'
                    : 'bg-[#182533] text-slate-100 rounded-tl-none border border-slate-800'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
                {m.code && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between gap-3">
                    <span className="font-mono text-xl font-bold tracking-widest text-amber-400">
                      {m.code}
                    </span>
                    <button
                      onClick={() => copyCode(m.code!)}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#2aabee] text-white hover:bg-[#259cdb] flex items-center gap-1 transition-all"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      Nusxalash va kiritish
                    </button>
                  </div>
                )}
                <div className="text-[10px] text-slate-400 text-right mt-1">{m.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Commands & Real Bot Link */}
        <div className="p-3 bg-[#17212b] border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSend('/start')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 whitespace-nowrap"
            >
              /start
            </button>
            <button
              onClick={() => handleSend('/kod')}
              className="px-3 py-1.5 rounded-lg bg-[#2aabee]/20 hover:bg-[#2aabee]/30 text-[#2aabee] text-xs font-semibold whitespace-nowrap flex items-center gap-1"
            >
              👉 /kod (Kodni olish)
            </button>
            <a
              href={`https://t.me/TestMakonBot?start=${encodeURIComponent(phone)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-400 hover:text-white whitespace-nowrap flex items-center gap-1 ml-auto"
            >
              Haqiqiy Telegram ilovasida ochish <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Chat input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Xabar yozing yoki /kod bosing..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-[#242f3d] text-white placeholder-slate-500 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2aabee]"
            />
            <button
              onClick={() => handleSend()}
              className="w-10 h-10 rounded-xl bg-[#2aabee] text-white flex items-center justify-center hover:bg-[#259cdb] transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
