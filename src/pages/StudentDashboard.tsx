import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Test, TestResult } from '../types';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  TrendingUp,
  FileText,
  Users,
  Calendar,
  Sparkles
} from 'lucide-react';

interface StudentDashboardProps {
  onStartTest: (testId: string) => void;
  onViewResult: (resultId: string) => void;
  onGoToTests: () => void;
  onGoToResults: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onStartTest,
  onViewResult,
  onGoToTests,
  onGoToResults
}) => {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [testsRes, analyticsRes] = await Promise.all([
          fetch(`/api/tests?studentId=${user.id}`),
          fetch(`/api/results/students/${user.id}/analytics`)
        ]);

        if (testsRes.ok) {
          const tData = await testsRes.json();
          setTests(tData.tests || []);
        }
        if (analyticsRes.ok) {
          const aData = await analyticsRes.json();
          setAnalytics(aData);
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  const activeTests = tests.filter(t => t.studentStatus === 'IN_PROGRESS' || t.studentStatus === 'NOT_STARTED');
  const completedTests = tests.filter(t => t.studentStatus === 'COMPLETED' || t.studentStatus === 'ATTEMPTS_EXHAUSTED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Tasdiqlangan o‘quvchi profili
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xush kelibsiz, {user?.first_name} {user?.last_name}! 👋
          </h1>
          <p className="text-sm text-indigo-200 max-w-2xl leading-relaxed">
            Sizga biriktirilgan guruhlar va imtihonlarni quyida ko‘rishingiz, testlarni onlayn topshirishingiz va natijalaringizni tahlil qilishingiz mumkin.
          </p>
        </div>

        {/* Decorative blur circle */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>O‘rtacha ko‘rsatkich</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.averageScore || 0}%
          </div>
          <div className="text-[11px] text-slate-400">Umumiy foiz</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Topshirilgan testlar</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.totalCompleted || 0}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {analytics?.passedCount || 0} tasi o‘tdi
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Eng yaxshi natija</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.bestScore || 0}%
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Rekord ball</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Mavjud testlar</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {activeTests.length}
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Faol holatda</div>
        </div>
      </div>

      {/* Available Tests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Topshirish uchun testlar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Guruhlaringiz bo‘yicha faollashtirilgan nazorat ishlari
            </p>
          </div>
          <button
            onClick={onGoToTests}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Barchasini ko‘rish <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeTests.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Hozirda yangi testlar yo‘q
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sizga tayinlangan barcha testlar yakunlangan yoki ustoz tomonidan hali yangi test e'lon qilinmagan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTests.map(test => {
              const isInProgress = test.studentStatus === 'IN_PROGRESS';
              return (
                <div
                  key={test.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
                        {test.groupName}
                      </span>
                      {isInProgress && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                          Boshlangan
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {test.title}
                    </h3>

                    {test.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {test.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {test.time_limit_minutes} daqiqa
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {test.questionsCount} ta savol
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        O‘tish: {test.passing_percentage}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onStartTest(test.id)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                      isInProgress
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {isInProgress ? 'Davom ettirish' : 'Testni boshlash'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Completed Tests Section */}
      {completedTests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Yaqinda topshirilgan testlar
              </h2>
              <p className="text-xs text-slate-500">
                Siz erishgan so‘nggi imtihon natijalari
              </p>
            </div>
            <button
              onClick={onGoToResults}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Barcha natijalar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedTests.map(test => {
              const res = test.studentResult;
              if (!res) return null;
              const isPassed = res.is_passed;

              return (
                <div
                  key={test.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-500">
                      {test.groupName}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {test.title}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Ball: {res.earned_points}/{res.total_points} • Foiz: {res.percentage}%
                    </div>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        isPassed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {isPassed ? 'O‘tdi' : 'O‘tmadi'}
                    </span>
                    <div>
                      <button
                        onClick={() => onViewResult(res.id)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline block"
                      >
                        Natijani ko‘rish →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
