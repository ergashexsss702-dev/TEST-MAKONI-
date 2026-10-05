import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Test } from '../types';
import {
  FileUp,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Edit2,
  Trash2,
  Save,
  X
} from 'lucide-react';

interface TeacherImportPageProps {
  initialTestId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TeacherImportPage: React.FC<TeacherImportPageProps> = ({
  initialTestId,
  onSuccess,
  onCancel
}) => {
  const { showToast } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState(initialTestId || '');

  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preview state (Section 9: never save immediately!)
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

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

  // Handle parsing (either text or DOCX)
  const handleParseAndPreview = async () => {
    if (!selectedTestId) {
      showToast("Iltimos, avval testni tanlang.", 'warning');
      return;
    }

    if (!rawText.trim() && !file) {
      showToast("Word (.docx) faylini yuklang yoki savollar matnini kiriting.", 'warning');
      return;
    }

    setParsing(true);

    try {
      const formData = new FormData();
      formData.append('previewOnly', 'true');
      if (rawText) formData.append('text', rawText);
      if (file) formData.append('file', file);

      const res = await fetch(`/api/tests/${selectedTestId}/import-questions`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      setParsing(false);

      if (res.ok) {
        setPreviewResult(data);
        showToast(`${data.totalParsed} ta savol muvaffaqiyatli tahlil qilindi!`, 'success');
      } else {
        showToast(data.error || "Tahlilda xatolik yuz berdi.", 'error');
      }
    } catch (err: any) {
      setParsing(false);
      showToast("Faylni tahlil qilishda xatolik yuz berdi.", 'error');
    }
  };

  // Save parsed questions
  const handleSaveToDatabase = async () => {
    if (!selectedTestId || !previewResult) return;

    if (previewResult.errorCount > 0) {
      if (!window.confirm(`Savollarda ${previewResult.errorCount} ta xatolik aniqlangan. Shunda ham saqlashni xohlaysizmi?`)) {
        return;
      }
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('previewOnly', 'false');
      if (rawText) formData.append('text', rawText);
      if (file) formData.append('file', file);

      const res = await fetch(`/api/tests/${selectedTestId}/import-questions`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok) {
        showToast("Barcha savollar testga muvaffaqiyatli saqlandi!", 'success');
        onSuccess();
      } else {
        showToast(data.error || "Saqlashda xatolik yuz berdi.", 'error');
      }
    } catch (err: any) {
      setSaving(false);
      showToast("Tarmoq xatosi.", 'error');
    }
  };

  // Toggle option correct state in preview
  const handleToggleCorrect = (qIndex: number, optIndex: number) => {
    if (!previewResult) return;
    const updated = { ...previewResult };
    const q = updated.questions[qIndex];
    q.options.forEach((o: any, idx: number) => {
      o.isCorrect = idx === optIndex;
    });
    // Re-evaluate errors for that question
    q.errors = q.errors.filter((e: string) => !e.includes("To'g'ri javob"));
    setPreviewResult(updated);
  };

  // Sample template insertion helper
  const handleInsertSampleTemplate = () => {
    const sample = `1. O'zbekiston Respublikasi Konstitutsiyasi qachon qabul qilingan?
A) 1991-yil 31-avgust
*B) 1992-yil 8-dekabr
C) 1993-yil 1-sentyabr
D) 1990-yil 20-iyun
[Ball: 2]
[Izoh: O'zbekiston Konstitutsiyasi 1992-yil 8-dekabrda qabul qilingan]

2. Alisher Navoiy qaysi asrda yashab ijod etgan?
A) XIII asr
B) XIV asr
*C) XV asr
D) XVI asr
[Ball: 2]
[Izoh: Alisher Navoiy 1441-1501 yillarda (XV asr) yashagan]

3. Quyosh nuri Yerga taxminan 8 daqiqada yetib keladi.
*A) To‘g‘ri
B) Noto‘g‘ri
[Ball: 1]

4. 25 ning 20 foizini hisoblang.
A) 4
*B) 5
C) 6
D) 10
[Ball: 2.5]
[Izoh: 25 * 0.20 = 5]`;

    setRawText(sample);
    setFile(null);
  };

  const displayedQuestions = previewResult
    ? showOnlyErrors
      ? previewResult.questions.filter((q: any) => q.errors.length > 0)
      : previewResult.questions
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Savollarni Tezkor Import Qilish 📥
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Word (.docx) faylini yuklang yoki matnni nusxalab joylashtiring. Xatolar oldindan ko‘rsatiladi.
          </p>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Ortga qaytish
        </button>
      </div>

      {/* Target Test Selection */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Qaysi testga savollar yuklanadi?
        </label>
        <select
          value={selectedTestId}
          onChange={e => setSelectedTestId(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {tests.map(t => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.groupName} • {t.questionsCount || 0} ta mavjud savol)
            </option>
          ))}
        </select>
      </div>

      {/* Input Mode: File Upload or Text Paste */}
      {!previewResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Method 1: DOCX File Upload */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
                  W
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  1-usul: Word (.docx) fayl yuklash
                </h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Word faylidagi barcha savollar avtomatik ravishda ajratib olinadi. Standart shrift va formatlar qo‘llab-quvvatlanadi.
              </p>

              {/* Drag & drop dropzone */}
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/40 transition-colors">
                <FileUp className="w-10 h-10 text-indigo-500 mb-2" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {file ? file.name : "Faylni tanlang yoki shu yerga sudrab tashlang"}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Format: .docx yoki .txt (10MB gacha)
                </span>
                <input
                  type="file"
                  accept=".docx,.txt"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      setRawText(''); // clear text
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {file && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold truncate max-w-xs">{file.name}</span>
                <button
                  onClick={() => setFile(null)}
                  className="text-rose-500 font-bold ml-2 hover:underline"
                >
                  Bekor qilish
                </button>
              </div>
            )}
          </div>

          {/* Method 2: Text Paste */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  2-usul: Matnni nusxalab kiritish
                </h3>
                <button
                  type="button"
                  onClick={handleInsertSampleTemplate}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Namunaviy test
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Format: To‘g‘ri javob oldiga <strong className="text-amber-500">*</strong> belgisi qo‘yiladi (masalan: *B) To'g'ri variant).
              </p>

              <textarea
                value={rawText}
                onChange={e => {
                  setRawText(e.target.value);
                  setFile(null);
                }}
                rows={9}
                placeholder={`1. Savol matni?
A) Variant
*B) To‘g‘ri variant
C) Variant
D) Variant
[Ball: 2]
[Izoh: Tushuntirish matni]`}
                className="w-full p-3 font-mono text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Parse Action Button when not yet parsed */}
      {!previewResult && (
        <div className="text-center pt-2">
          <button
            onClick={handleParseAndPreview}
            disabled={parsing || (!rawText.trim() && !file)}
            className="py-3.5 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/25 transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {parsing ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Tahlil qilish va Oldindan Ko‘rish (Preview) <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* PREVIEW SCREEN (Section 9: Preview Screen before Saving) */}
      {previewResult && (
        <div className="space-y-6 animate-in slide-in-from-bottom-3 duration-300">
          
          {/* Preview Statistics Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Tahlil natijalari: {previewResult.totalParsed} ta savol
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ {previewResult.validCount} ta to‘liq to‘g‘ri
                </span>
                {previewResult.errorCount > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    ✗ {previewResult.errorCount} ta xatolik
                  </span>
                )}
                {previewResult.warningCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    ⚠ {previewResult.warningCount} ta ogohlantirish
                  </span>
                )}
              </div>
            </div>

            {/* Actions: Save, Cancel, Toggle Errors */}
            <div className="flex flex-wrap items-center gap-2">
              {previewResult.errorCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowOnlyErrors(!showOnlyErrors)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    showOnlyErrors
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {showOnlyErrors ? "Barchasini ko'rsatish" : "Faqat xatolarni ko'rsatish"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setPreviewResult(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={handleSaveToDatabase}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Saqlash va Testga Biriktirish
                  </>
                )}
              </button>
            </div>
          </div>

          {/* List of Parsed Questions */}
          <div className="space-y-4">
            {displayedQuestions.map((q: any, qIdx: number) => {
              const hasErrors = q.errors && q.errors.length > 0;
              const hasWarnings = q.warnings && q.warnings.length > 0;

              return (
                <div
                  key={qIdx}
                  className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border space-y-3 transition-all ${
                    hasErrors
                      ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20'
                      : hasWarnings
                      ? 'border-amber-300 dark:border-amber-900'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Savol #{q.orderNum}
                    </span>
                    <span className="text-slate-400 font-semibold">
                      Ball: {q.points}
                    </span>
                  </div>

                  {/* Question text */}
                  <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {q.questionText}
                  </div>

                  {/* Errors / Warnings notice */}
                  {hasErrors && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Aniqlangan xatoliklar:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {q.errors.map((err: string, eIdx: number) => (
                          <li key={eIdx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Options List with Interactive Correct Answer Picker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt: any, optIdx: number) => (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleToggleCorrect(qIdx, optIdx)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                          opt.isCorrect
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] ${
                              opt.isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {opt.letter}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        {opt.isCorrect && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> To‘g‘ri
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <strong>Izoh:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
