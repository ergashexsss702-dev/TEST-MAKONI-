import React, { useState, useEffect } from 'react';
import { Test, QuestionStat } from '../types';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';

interface TeacherStatisticsPageProps {
  initialTestId?: string;
  onCancel: () => void;
}

export const TeacherStatisticsPage: React.FC<TeacherStatisticsPageProps> = ({
  initialTestId,
  onCancel
}) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState(initialTestId || '');
  const [statsData, setStatsData] = useState<{
    testTitle: string;
    totalCompletedAttempts: number;
    questionStats: QuestionStat[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

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

    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/results/tests/${selectedTestId}/question-stats`);
        if (res.ok) {
          const data = await res.json();
          setStatsData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedTestId]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Savollar Qiyinligi va Statistikasi 📈
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Har bir savol bo‘yicha to‘g‘ri va noto‘g‘ri javoblar foizi hamda murakkablik darajasi
          </p>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Ortga qaytish
        </button>
      </div>

      {/* Test Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Tahlil qilinadigan testni tanlang:
        </label>
        <select
          value={selectedTestId}
          onChange={e => setSelectedTestId(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {tests.map(t => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.groupName})
            </option>
          ))}
        </select>
      </div>

      {/* Summary KPI */}
      {statsData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Test nomi
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {statsData.testTitle}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Topshirganlar soni
            </span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {statsData.totalCompletedAttempts} ta o‘quvchi
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Jami savollar
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {statsData.questionStats.length} ta savol
            </div>
          </div>
        </div>
      )}

      {/* Questions Difficulty List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
      ) : !statsData || statsData.questionStats.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          Savollar bo‘yicha statistika topilmadi.
        </div>
      ) : (
        <div className="space-y-4">
          {statsData.questionStats.map((qs, idx) => (
            <div
              key={qs.questionId || idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
            >
              {/* Question header & difficulty badge */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Savol #{qs.orderNum}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${qs.difficultyColor}`}
                >
                  {qs.difficulty}
                </span>
              </div>

              {/* Question text */}
              <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {qs.questionText}
              </div>

              {/* Graphical Percentage Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    To‘g‘ri javob: {qs.correctPercentage}% ({qs.correctAnswers} ta)
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    Xato javob: {qs.incorrectPercentage}% ({qs.incorrectAnswers} ta)
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${qs.correctPercentage}%` }}
                    title={`To'g'ri: ${qs.correctPercentage}%`}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${qs.incorrectPercentage}%` }}
                    title={`Xato: ${qs.incorrectPercentage}%`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
