import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Test } from '../types';
import {
  Users,
  Search,
  Copy,
  Check,
  ArrowLeft,
  AlertCircle,
  Phone,
  Bot
} from 'lucide-react';

interface TeacherUnattemptedTestsPageProps {
  initialTestId?: string;
  onCancel: () => void;
}

export const TeacherUnattemptedTestsPage: React.FC<TeacherUnattemptedTestsPageProps> = ({
  initialTestId,
  onCancel
}) => {
  const { showToast } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState(initialTestId || '');
  const [unattemptedData, setUnattemptedData] = useState<{
    testTitle: string;
    unattemptedCount: number;
    unattempted: Array<{
      id: string;
      first_name: string;
      last_name: string;
      phone: string;
      group_name: string;
      is_verified: boolean;
    }>;
  } | null>(null);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch('/api/tests');
        if (res.ok) {
          const data = await res.json();
          setTests(data.tests || []);
          if (!selectedTestId && data.tests && data.tests.length > 0) {
            setSelectedTestId(data.tests[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTests();
  }, [selectedTestId]);

  useEffect(() => {
    if (!selectedTestId) return;

    const fetchUnattempted = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/results/tests/${selectedTestId}/unattempted`);
        if (res.ok) {
          const data = await res.json();
          setUnattemptedData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnattempted();
  }, [selectedTestId]);

  // Copy Telegram Reminder text
  const handleCopyReminder = () => {
    if (!unattemptedData) return;
    const studentNames = unattemptedData.unattempted
      .map((s, idx) => `${idx + 1}. ${s.first_name} ${s.last_name} (${s.phone})`)
      .join('\n');

    const reminderText = 
`🔔 DIQQAT! TESTNI TOPSHIRMAGANLAR RO‘YXATI:

📚 Test: ${unattemptedData.testTitle}
⚠️ Jami topshirmaganlar: ${unattemptedData.unattemptedCount} nafar

${studentNames}

Iltimos, belgilangan muddat ichida platformaga kirib testni topshiring!`;

    navigator.clipboard.writeText(reminderText);
    setCopied(true);
    showToast("Eslatma matni nusxalandi!", 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredList = unattemptedData
    ? unattemptedData.unattempted.filter(s =>
        `${s.first_name} ${s.last_name} ${s.phone}`.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Testni Topshirmagan O‘quvchilar ⚠️
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Guruhdagi testni hali ishlamagan o‘quvchilar ro‘yxati va eslatma matni
          </p>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Ortga qaytish
        </button>
      </div>

      {/* Test Selector & Copy Reminder Button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Testni tanlang:
          </label>
          <select
            value={selectedTestId}
            onChange={e => setSelectedTestId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {tests.map(t => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.groupName})
              </option>
            ))}
          </select>
        </div>

        {unattemptedData && unattemptedData.unattemptedCount > 0 && (
          <button
            onClick={handleCopyReminder}
            className="px-5 py-3 rounded-xl bg-[#2aabee] hover:bg-[#259cdb] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#2aabee]/25 self-start sm:self-end transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Telegram guruhga eslatma nusxalash
          </button>
        )}
      </div>

      {/* Main List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Qarzdor o‘quvchilar: {unattemptedData?.unattemptedCount || 0} nafar
            </h2>
            <p className="text-xs text-slate-500">
              Test: {unattemptedData?.testTitle}
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="O‘quvchini qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Yuklanmoqda...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-xs text-emerald-600 dark:text-emerald-400 space-y-2">
            <Users className="w-10 h-10 mx-auto" />
            <div className="font-bold">
              Barcha o‘quvchilar ushbu testni topshirib bo‘lgan! 🎉
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3">T/r</th>
                  <th className="py-3 px-3">O‘quvchi</th>
                  <th className="py-3 px-3">Telefon</th>
                  <th className="py-3 px-3">Guruh</th>
                  <th className="py-3 px-3">Telegram holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredList.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {s.first_name} {s.last_name}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{s.phone}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{s.group_name}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <Bot className="w-3 h-3" /> Faol
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
