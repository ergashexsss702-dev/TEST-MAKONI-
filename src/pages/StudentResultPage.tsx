import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { TestResult, QuestionBreakdown } from '../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowLeft,
  Award,
  BookOpen,
  HelpCircle,
  Share2
} from 'lucide-react';

interface StudentResultPageProps {
  resultId: string;
  onGoHome: () => void;
  onGoProfile: () => void;
}

export const StudentResultPage: React.FC<StudentResultPageProps> = ({
  resultId,
  onGoHome,
  onGoProfile
}) => {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/results/${resultId}`);
        if (res.ok) {
          const data = await res.json();
          setResult(data.result);

          // Confetti celebratory explosion if passed!
          if (data.result && data.result.is_passed) {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        }
      } catch (err) {
        console.error('Failed to load result:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 text-center animate-pulse space-y-4">
        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">
          Natija topilmadi
        </h3>
        <button
          onClick={onGoHome}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
        >
          Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  const mins = Math.floor(result.time_spent_seconds / 60);
  const secs = result.time_spent_seconds % 60;
  const timeSpentStr = `${mins} daqiqa ${secs} soniya`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      
      {/* Top Banner Result Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
        
        {/* Pass/Fail Icon & Badge */}
        <div className="space-y-3">
          <div
            className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg transition-transform ${
              result.is_passed
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 shadow-emerald-600/20'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 shadow-rose-600/20'
            }`}
          >
            {result.is_passed ? (
              <CheckCircle2 className="w-12 h-12" />
            ) : (
              <XCircle className="w-12 h-12" />
            )}
          </div>

          <div>
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                result.is_passed
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {result.is_passed ? "O‘TDI (Muvaffaqiyatli)" : "O‘TMADI"}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
              {result.testTitle}
            </h1>
            <p className="text-xs text-slate-500">
              Guruh: {result.groupName} • {new Date(result.created_at).toLocaleString('uz-UZ')}
            </p>
          </div>
        </div>

        {/* 4 Score Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          
          {/* Points */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ball
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {result.earned_points} / {result.total_points}
            </div>
            <div className="text-[10px] text-slate-500">To‘plangan ball</div>
          </div>

          {/* Percentage */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Foiz
            </span>
            <div
              className={`text-2xl font-black font-mono ${
                result.is_passed ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {result.percentage.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500">O‘zlashtirish</div>
          </div>

          {/* Time Spent */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Sarflangan vaqt
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white pt-1">
              {timeSpentStr}
            </div>
            <div className="text-[10px] text-slate-500">Davomiyligi</div>
          </div>

          {/* Tab Exits */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Oynadan chiqishlar
            </span>
            <div
              className={`text-2xl font-black font-mono ${
                result.tab_exits_count > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'
              }`}
            >
              {result.tab_exits_count}
            </div>
            <div className="text-[10px] text-slate-500">Chiqishlar soni</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onGoHome}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all"
          >
            Bosh sahifaga qaytish
          </button>
          <button
            onClick={onGoProfile}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            Barcha natijalarim (Profil)
          </button>
        </div>
      </div>

      {/* Question-by-question Review (Section 16) */}
      {result.breakdown && result.breakdown.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Savollar bo‘yicha tahlil
            </h3>
            <span className="text-xs text-slate-500">
              {result.correct_answers} ta to‘g‘ri, {result.incorrect_answers} ta xato
            </span>
          </div>

          <div className="space-y-4">
            {result.breakdown.map((q, idx) => (
              <div
                key={q.question_id || idx}
                className={`p-5 rounded-3xl border bg-white dark:bg-slate-900 space-y-3 transition-all ${
                  q.is_correct
                    ? 'border-emerald-200 dark:border-emerald-950/80 shadow-sm'
                    : 'border-rose-200 dark:border-rose-950/80 shadow-sm'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Savol #{idx + 1}
                  </span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      q.is_correct
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {q.is_correct ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {q.earned_points} / {q.points} ball
                  </span>
                </div>

                {/* Text */}
                <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {q.question_text}
                </div>

                {/* Answer comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Sizning javobingiz:
                    </span>
                    <span
                      className={`font-bold text-sm ${
                        q.is_correct ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {q.selected_option || "(Belgilanmagan)"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-indigo-400 block text-[10px] uppercase font-bold">
                      To‘g‘ri javob:
                    </span>
                    <span className="font-bold text-sm text-indigo-700 dark:text-indigo-300">
                      {q.correct_option}
                    </span>
                  </div>
                </div>

                {/* Explanation if allowed */}
                {q.explanation && (
                  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200">
                    <strong className="font-bold">Izoh: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
