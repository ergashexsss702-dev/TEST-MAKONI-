import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TestResult } from '../types';
import {
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  FileSpreadsheet,
  PlusCircle,
  FileUp,
  Clock,
  Eye,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface TeacherDashboardProps {
  onGoToTests: () => void;
  onGoToCreateTest: () => void;
  onGoToImport: () => void;
  onGoToGroups: () => void;
  onGoToResults: () => void;
  onGoToStats: () => void;
  onViewResult: (resultId: string) => void;
  onOpenRetake: (testId: string, studentId: string, studentName: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onGoToTests,
  onGoToCreateTest,
  onGoToImport,
  onGoToGroups,
  onGoToResults,
  onGoToStats,
  onViewResult,
  onOpenRetake
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, resultsRes] = await Promise.all([
          fetch('/api/admin/system-stats'),
          fetch('/api/results?limit=8')
        ]);

        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats(s);
        }
        if (resultsRes.ok) {
          const r = await resultsRes.json();
          setRecentResults(r.results || []);
        }
      } catch (err) {
        console.error('Teacher dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ustoz Boshqaruv Paneli 🎓
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Guruhlar, testlar, avtomatlashtirilgan Word importi va natijalar nazorati
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onGoToImport}
            className="px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition-all shadow-sm"
          >
            <FileUp className="w-4 h-4" /> DOCX Savol Import
          </button>
          <button
            onClick={onGoToCreateTest}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Yangi Test Yaratish
          </button>
        </div>
      </div>

      {/* 5 Key Metric Cards (Section 18) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Students */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>O‘quvchilar</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats?.totalStudents || 0}
          </div>
          <div className="text-[11px] text-slate-400">Jami ro‘yxatda</div>
        </div>

        {/* Active Groups */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Faol guruhlar</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats?.activeGroups || 0}
          </div>
          <div className="text-[11px] text-slate-400">Sinflar & kurslar</div>
        </div>

        {/* Total Tests */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Jami testlar</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats?.totalTests || 0}
          </div>
          <div className="text-[11px] text-slate-400">Tizimdagi testlar</div>
        </div>

        {/* Tests Completed Today */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Bugun topshirildi</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats?.testsCompletedToday || 0}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Bugungi imtihonlar</div>
        </div>

        {/* Average Score */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>O‘rtacha ball</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats?.averageScore || 0}%
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Umumiy ko‘rsatkich</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={onGoToImport}
          className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/40 dark:to-indigo-900/20 border border-indigo-200/80 dark:border-indigo-800/40 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform">
            <FileUp className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            DOCX Savollar Importi
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Word faylidan 50-100 tagacha savollarni xatolar tekshiruvi bilan 1 daqiqada yuklang.
          </p>
        </div>

        <div
          onClick={onGoToResults}
          className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800/40 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            Excel Natijalar Eksporti
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Guruhlar va testlar bo‘yicha to‘liq hisobotni rasmiy Excel formatida yuklab oling.
          </p>
        </div>

        <div
          onClick={onGoToStats}
          className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100/60 dark:from-purple-950/40 dark:to-purple-900/20 border border-purple-200/80 dark:border-purple-800/40 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            Savollar Qiyinligi Tahlili
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Qaysi savolda o‘quvchilar eng ko‘p adashganini va qiyinlik darajasini aniqlang.
          </p>
        </div>
      </div>

      {/* Recent Submissions Table (Section 18) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              So‘nggi topshirilgan natijalar
            </h2>
            <p className="text-xs text-slate-500">
              O‘quvchilarning so‘nggi imtihon ishlari va oynadan chiqishlar ko‘rsatkichi
            </p>
          </div>
          <button
            onClick={onGoToResults}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Barchasini ko‘rish <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentResults.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Hozircha test topshirganlar mavjud emas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3">O‘quvchi</th>
                  <th className="py-3 px-3">Test</th>
                  <th className="py-3 px-3">Guruh</th>
                  <th className="py-3 px-3">Ball</th>
                  <th className="py-3 px-3">Foiz</th>
                  <th className="py-3 px-3">Natija</th>
                  <th className="py-3 px-3">Chiqishlar</th>
                  <th className="py-3 px-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentResults.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {r.studentName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {r.studentPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                      {r.testTitle}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-medium">
                      {r.groupName}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {r.earned_points}/{r.total_points}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold">
                      {r.percentage}%
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.is_passed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {r.is_passed ? 'O‘tdi' : 'O‘tmadi'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-semibold">
                      <span
                        className={
                          r.tab_exits_count > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'
                        }
                      >
                        {r.tab_exits_count} ta
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => onViewResult(r.id)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 transition-all inline-flex items-center gap-1"
                        title="Natijani ko'rish"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ko‘rish
                      </button>
                      <button
                        onClick={() => onOpenRetake(r.test_id, r.student_id, r.studentName || '')}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-100 transition-all inline-flex items-center gap-1"
                        title="Qayta topshirishga ruxsat"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Qayta ochish
                      </button>
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
