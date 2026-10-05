import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Group } from '../types';
import {
  FileText,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Calendar,
  Layers,
  Sliders
} from 'lucide-react';

interface TeacherTestCreatePageProps {
  onSuccess: (testId: string) => void;
  onCancel: () => void;
}

export const TeacherTestCreatePage: React.FC<TeacherTestCreatePageProps> = ({
  onSuccess,
  onCancel
}) => {
  const { user, showToast } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bookSource, setBookSource] = useState('');
  const [topic, setTopic] = useState('');
  const [groupId, setGroupId] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [passingPercentage, setPassingPercentage] = useState(60);

  // Dates
  const [openingTime, setOpeningTime] = useState(new Date().toISOString().slice(0, 16));
  const [closingTime, setClosingTime] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  // Switches
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/groups');
        if (res.ok) {
          const data = await res.json();
          setGroups(data.groups || []);
          if (data.groups && data.groups.length > 0) {
            setGroupId(data.groups[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Test sarlavhasini kiriting.", 'warning');
      return;
    }
    if (!groupId) {
      showToast("Test uchun guruhni tanlang.", 'warning');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          bookSource,
          topic,
          groupId,
          teacherId: user?.id,
          timeLimitMinutes: Number(timeLimitMinutes),
          attemptLimit: Number(attemptLimit),
          passingPercentage: Number(passingPercentage),
          openingTime: new Date(openingTime).toISOString(),
          closingTime: new Date(closingTime).toISOString(),
          randomizeQuestions,
          randomizeOptions,
          showCorrectAnswers,
          showExplanations,
          isActive
        })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.test) {
        showToast("Test yaratildi! Endi savollarni yuklang.", 'success');
        onSuccess(data.test.id);
      } else {
        showToast(data.error || "Xatolik yuz berdi.", 'error');
      }
    } catch (err) {
      setLoading(false);
      showToast("Tarmoq xatosi.", 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in">
      
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Testlar ro‘yxatiga qaytish
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Yangi Test Yaratish va Sozlash 🛠️
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Imtihon parametrlari, vaqt chegaralari va qatnashuvchi guruhni belgilang
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Main Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              1. Asosiy ma'lumotlar
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Test Sarlavhasi *
                </label>
                <input
                  type="text"
                  placeholder="masalan: Present Simple & Past Simple — Unit 3"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Mavzu / Fani
                </label>
                <input
                  type="text"
                  placeholder="masalan: Ingliz tili grammatikasi"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Darslik / Manba
                </label>
                <input
                  type="text"
                  placeholder="masalan: English Grammar in Use"
                  value={bookSource}
                  onChange={e => setBookSource(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Guruhni biriktirish *
                </label>
                <select
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Guruhni tanlang...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.memberCount || 0} ta o‘quvchi)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Tavsif / Ko‘rsatmalar
                </label>
                <textarea
                  placeholder="O‘quvchilar uchun qo‘shimcha ko‘rsatmalar..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Time & Scoring Configuration (Section 10) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              2. Vaqt va Baholash Sozlamalari
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Vaqt chegarasi (daqiqa)
                </label>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={timeLimitMinutes}
                  onChange={e => setTimeLimitMinutes(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Urinishlar soni
                </label>
                <select
                  value={attemptLimit}
                  onChange={e => setAttemptLimit(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value={1}>1 marta (Standart)</option>
                  <option value={2}>2 marta</option>
                  <option value={3}>3 marta</option>
                  <option value={0}>Cheksiz</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  O‘tish foizi (%)
                </label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={passingPercentage}
                  onChange={e => setPassingPercentage(parseInt(e.target.value, 10) || 60)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Ochilish vaqti
                </label>
                <input
                  type="datetime-local"
                  value={openingTime}
                  onChange={e => setOpeningTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Yopilish vaqti
                </label>
                <input
                  type="datetime-local"
                  value={closingTime}
                  onChange={e => setClosingTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Randomization and Security Options */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              3. Qoidalar va Xavfsizlik
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Savollarni aralashtirish (Randomize)
                </span>
                <input
                  type="checkbox"
                  checked={randomizeQuestions}
                  onChange={e => setRandomizeQuestions(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Variantlarni aralashtirish
                </span>
                <input
                  type="checkbox"
                  checked={randomizeOptions}
                  onChange={e => setRandomizeOptions(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tugagach to‘g‘ri javoblarni ko‘rsatish
                </span>
                <input
                  type="checkbox"
                  checked={showCorrectAnswers}
                  onChange={e => setShowCorrectAnswers(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tushuntirish/Izohlarni ko‘rsatish
                </span>
                <input
                  type="checkbox"
                  checked={showExplanations}
                  onChange={e => setShowExplanations(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-60"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Yaratish va Savollarni Yuklash →</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
