import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TestResult, Group, Test } from '../types';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  RotateCcw,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  Clock,
  ShieldAlert
} from 'lucide-react';

interface TeacherResultsPageProps {
  onViewResult: (resultId: string) => void;
}

export const TeacherResultsPage: React.FC<TeacherResultsPageProps> = ({ onViewResult }) => {
  const { user, showToast } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Retake Modal State
  const [isRetakeModalOpen, setIsRetakeModalOpen] = useState(false);
  const [retakeTarget, setRetakeTarget] = useState<{ testId: string; studentId: string; studentName: string } | null>(null);
  const [retakeReason, setRetakeReason] = useState('');
  const [retakeLoading, setRetakeLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedGroup) queryParams.append('groupId', selectedGroup);
      if (selectedTest) queryParams.append('testId', selectedTest);
      if (selectedStatus !== 'all') queryParams.append('status', selectedStatus);
      if (search) queryParams.append('search', search);

      const [resResults, resGroups, resTests] = await Promise.all([
        fetch(`/api/results?${queryParams.toString()}`),
        fetch('/api/groups'),
        fetch('/api/tests')
      ]);

      if (resResults.ok) {
        const d = await resResults.json();
        setResults(d.results || []);
      }
      if (resGroups.ok) {
        const g = await resGroups.json();
        setGroups(g.groups || []);
      }
      if (resTests.ok) {
        const t = await resTests.json();
        setTests(t.tests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedGroup, selectedTest, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Excel Export Handler (Section 21)
  const handleExportExcel = (isDetailed = false) => {
    const params = new URLSearchParams();
    if (selectedGroup) params.append('groupId', selectedGroup);
    if (selectedTest) params.append('testId', selectedTest);
    if (selectedStatus !== 'all') params.append('status', selectedStatus);
    if (isDetailed) params.append('detailed', 'true');

    const downloadUrl = `/api/results/export/excel?${params.toString()}`;
    window.location.href = downloadUrl;
    showToast("Excel fayli yuklab olinmoqda...", 'info');
  };

  // Open Retake Modal (Section 22)
  const openRetakeModal = (testId: string, studentId: string, studentName: string) => {
    setRetakeTarget({ testId, studentId, studentName });
    setRetakeReason("Ustoz tomonidan ruxsat berildi");
    setIsRetakeModalOpen(true);
  };

  // Confirm Retake
  const handleConfirmRetake = async () => {
    if (!retakeTarget) return;
    setRetakeLoading(true);

    try {
      const res = await fetch(`/api/tests/${retakeTarget.testId}/reset-attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: retakeTarget.studentId,
          authorizedBy: user?.id,
          reason: retakeReason
        })
      });

      const data = await res.json();
      setRetakeLoading(false);

      if (res.ok) {
        showToast(data.message || "Qayta topshirishga ruxsat berildi!", 'success');
        setIsRetakeModalOpen(false);
        loadData();
      } else {
        showToast(data.error || "Xatolik yuz berdi.", 'error');
      }
    } catch (err) {
      setRetakeLoading(false);
      showToast("Tarmoq xatosi.", 'error');
    }
  };

  // Delete Result
  const handleDeleteResult = async (resultId: string, studentName: string) => {
    if (!window.confirm(`Haqiqatan ham ${studentName} ning natijasini o‘chirmoqchimisiz?`)) return;

    try {
      const res = await fetch(`/api/results/${resultId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Natija o‘chirildi.", 'info');
        loadData();
      }
    } catch (err) {
      showToast("Xatolik yuz berdi.", 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Top Header & Excel Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Imtihon Natijalari & Excel 📊
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Talabalar natijalarini monitoring qilish, filtrlash, qayta ochish va Excel eksporti
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportExcel(false)}
            className="px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Excel (.xlsx) Yuklab Olish
          </button>
          <button
            onClick={() => handleExportExcel(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all"
            title="Har bir savol bo'yicha berilgan javoblar bilan"
          >
            <FileSpreadsheet className="w-4 h-4" /> Batafsil Excel Eksport
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Section 18 & 37) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Group Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Guruh
            </label>
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha guruhlar</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Test Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Test
            </label>
            <select
              value={selectedTest}
              onChange={e => setSelectedTest(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha testlar</option>
              {tests.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Natija holati
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Barchasi</option>
              <option value="passed">O‘tganlar (O‘tdi)</option>
              <option value="failed">O‘tmaganlar (O‘tmadi)</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Qidiruv
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="O‘quvchi ismi yoki raqami..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center animate-pulse text-xs text-slate-400">
            Natijalar yuklanmoqda...
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <div className="font-bold text-slate-700 dark:text-slate-300">
              Hech qanday natija topilmadi
            </div>
            <p>Filtrlarni o‘zgartirib qayta qidirib ko‘ring.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">O‘quvchi</th>
                  <th className="py-3 px-4">Guruh</th>
                  <th className="py-3 px-4">Test</th>
                  <th className="py-3 px-4">Sana</th>
                  <th className="py-3 px-4">Ball</th>
                  <th className="py-3 px-4">Foiz</th>
                  <th className="py-3 px-4">Natija</th>
                  <th className="py-3 px-4">Vaqt</th>
                  <th className="py-3 px-4">Chiqishlar</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {r.studentName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {r.studentPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400">
                      {r.groupName}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                      {r.testTitle}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {r.earned_points}/{r.total_points}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      {r.percentage}%
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {Math.floor(r.time_spent_seconds / 60)}m {r.time_spent_seconds % 60}s
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      <span
                        className={
                          r.tab_exits_count > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'
                        }
                      >
                        {r.tab_exits_count} ta
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => onViewResult(r.id)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 transition-all inline-flex items-center gap-1"
                        title="Natija tahlili"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ko‘rish
                      </button>

                      <button
                        onClick={() => openRetakeModal(r.test_id, r.student_id, r.studentName || '')}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-100 transition-all inline-flex items-center gap-1"
                        title="Qayta topshirishga ruxsat"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Qayta ochish
                      </button>

                      <button
                        onClick={() => handleDeleteResult(r.id, r.studentName || '')}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Natijani o'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Retake System Modal (Section 22) */}
      {isRetakeModalOpen && retakeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Qayta Topshirishga Ruxsat Berish
                </h3>
              </div>
              <button onClick={() => setIsRetakeModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              O‘quvchi: <strong className="text-slate-900 dark:text-white">{retakeTarget.studentName}</strong>
              <br />
              Ushbu o‘quvchining oldingi urinishi qayta ochiladi va u testni qayta topshirishi mumkin bo‘ladi. Harakat audit jurnalida saqlanadi.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Ruxsat berish sababi (audit uchun)
              </label>
              <textarea
                value={retakeReason}
                onChange={e => setRetakeReason(e.target.value)}
                rows={2}
                placeholder="masalan: Internet uzilishi tufayli test yakunlanmay qolgan..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRetakeModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmRetake}
                disabled={retakeLoading}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5"
              >
                {retakeLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Ruxsat berish</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
