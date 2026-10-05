import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Test, Group } from '../types';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  Trash2,
  FileUp,
  BarChart3,
  Users,
  Search,
  BookOpen,
  AlertCircle
} from 'lucide-react';

interface TeacherTestsPageProps {
  onGoToCreateTest: () => void;
  onGoToImport: (testId?: string) => void;
  onGoToStats: (testId: string) => void;
  onGoToUnattempted: (testId: string) => void;
}

export const TeacherTestsPage: React.FC<TeacherTestsPageProps> = ({
  onGoToCreateTest,
  onGoToImport,
  onGoToStats,
  onGoToUnattempted
}) => {
  const { showToast } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [testsRes, groupsRes] = await Promise.all([
        fetch('/api/tests'),
        fetch('/api/groups')
      ]);

      if (testsRes.ok) {
        const tData = await testsRes.json();
        setTests(tData.tests || []);
      }
      if (groupsRes.ok) {
        const gData = await groupsRes.json();
        setGroups(gData.groups || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (test: Test) => {
    try {
      const res = await fetch(`/api/tests/${test.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !test.is_active })
      });
      if (res.ok) {
        showToast(
          `Test ${!test.is_active ? 'faollashtirildi' : 'to‘xtatildi'}!`,
          'success'
        );
        loadData();
      }
    } catch (err) {
      showToast("Xatolik yuz berdi.", 'error');
    }
  };

  const handleDeleteTest = async (testId: string, title: string) => {
    if (!window.confirm(`Haqiqatan ham "${title}" testini va barcha savollarini o‘chirmoqchimisiz?`)) return;

    try {
      const res = await fetch(`/api/tests/${testId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Test muvaffaqiyatli o‘chirildi.", 'info');
        loadData();
      }
    } catch (err) {
      showToast("Xatolik yuz berdi.", 'error');
    }
  };

  const filteredTests = tests.filter(t => {
    const matchesGroup = selectedGroup === 'all' || t.group_id === selectedGroup;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.topic || '').toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Testlar Boshqaruvi 📝
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Imtihonlarni yaratish, vaqt va guruh sozlamalari, Word importi va statistika
          </p>
        </div>

        <button
          onClick={onGoToCreateTest}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Yangi Test Yaratish
        </button>
      </div>

      {/* Filters: Group select and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedGroup('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedGroup === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Barcha guruhlar ({tests.length})
          </button>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedGroup === g.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Test yoki mavzuni qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-400" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">
            Hech qanday test topilmadi
          </h3>
          <p className="text-xs text-slate-500">
            Yangi test yaratib, unga savollarni Word orqali yuklang.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map(test => (
            <div
              key={test.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60">
                    {test.groupName}
                  </span>
                  
                  {/* Active / Inactive switch */}
                  <button
                    onClick={() => handleToggleActive(test)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                      test.is_active
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${test.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    {test.is_active ? 'Faol' : 'To‘xtatilgan'}
                  </button>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                    {test.title}
                  </h3>
                  {test.topic && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Mavzu: {test.topic}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{test.time_limit_minutes} daqiqa</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    <span>{test.questionsCount} ta savol</span>
                  </div>
                  <div>
                    O‘tish: <strong className="text-slate-700 dark:text-slate-300">{test.passing_percentage}%</strong>
                  </div>
                  <div>
                    Limit: <strong className="text-slate-700 dark:text-slate-300">{test.attempt_limit === 0 ? 'Cheksiz' : `${test.attempt_limit} marta`}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onGoToImport(test.id)}
                    className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-1 hover:bg-indigo-100 transition-all"
                  >
                    <FileUp className="w-3.5 h-3.5" /> Savollar ({test.questionsCount})
                  </button>

                  <button
                    onClick={() => onGoToStats(test.id)}
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> Tahlil
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => onGoToUnattempted(test.id)}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" /> Topshirmaganlar
                  </button>

                  <button
                    onClick={() => handleDeleteTest(test.id, test.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Testni o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
