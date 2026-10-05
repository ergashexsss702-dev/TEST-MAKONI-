import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TestResult, Group } from '../types';
import {
  User,
  Phone,
  Bot,
  Award,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  Calendar,
  BookOpen,
  Eye,
  Search
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface StudentProfilePageProps {
  onViewResult: (resultId: string) => void;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ onViewResult }) => {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadProfileData = async () => {
      try {
        const [resResults, resGroups, resAnalytics] = await Promise.all([
          fetch(`/api/results?studentId=${user.id}`),
          fetch(`/api/groups?studentId=${user.id}`),
          fetch(`/api/results/students/${user.id}/analytics`)
        ]);

        if (resResults.ok) {
          const d = await resResults.json();
          setResults(d.results || []);
        }
        if (resGroups.ok) {
          const g = await resGroups.json();
          setGroups(g.groups || []);
        }
        if (resAnalytics.ok) {
          const a = await resAnalytics.json();
          setAnalytics(a);
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  const filteredResults = results.filter(r =>
    (r.testTitle || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-600/25">
              {user?.first_name?.charAt(0)}
              {user?.last_name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </h1>
                {user?.is_verified && (
                  <span className="p-1 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" title="Telegram orqali tasdiqlangan">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5" />
                {user?.phone}
              </p>
            </div>
          </div>

          {/* Groups & Telegram Status Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                A'zo guruhlar:
              </span>
              <span className="font-bold text-indigo-700 dark:text-indigo-300">
                {groups.length > 0 ? groups.map(g => g.name).join(', ') : 'Biriktirilmagan'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Telegram:
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" />
                Tasdiqlangan
              </span>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              O‘rtacha ball
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {analytics?.averageScore || 0}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Eng yaxshi natija
            </span>
            <div className="text-2xl font-black text-amber-500 font-mono">
              {analytics?.bestScore || 0}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Topshirilgan testlar
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {analytics?.totalCompleted || 0}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Muvaffaqiyat foizi
            </span>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {analytics?.passRate || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Performance Graph (Section 17: Recharts X: Date, Y: Percentage) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            O‘zlashtirish Dinamikasi Grafigi
          </h2>
          <p className="text-xs text-slate-500">
            Har bir topshirilgan test bo‘yicha to‘plangan foizlar tarixi
          </p>
        </div>

        {analytics?.timelineData && analytics.timelineData.length > 0 ? (
          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.timelineData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Natija']}
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.testTitle} (${item.fullDate})` : '';
                  }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#4f46e5' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            Grafik shakllantirish uchun kamida bitta test topshirilishi kerak.
          </div>
        )}
      </div>

      {/* Results History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Natijalar tarixi
            </h2>
            <p className="text-xs text-slate-500">
              Topshirilgan barcha testlar ro‘yxati
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Test nomini qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Hech qanday natija topilmadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3">Test nomi</th>
                  <th className="py-3 px-3">Sana</th>
                  <th className="py-3 px-3">Ball</th>
                  <th className="py-3 px-3">Foiz</th>
                  <th className="py-3 px-3">Natija</th>
                  <th className="py-3 px-3">Sarflangan vaqt</th>
                  <th className="py-3 px-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredResults.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                      {r.testTitle}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500">
                      {new Date(r.created_at).toLocaleDateString('uz-UZ')}
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
                    <td className="py-3.5 px-3 text-slate-500 font-mono">
                      {Math.floor(r.time_spent_seconds / 60)} daq {r.time_spent_seconds % 60} son
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onViewResult(r.id)}
                        className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 transition-all flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ko‘rish
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
