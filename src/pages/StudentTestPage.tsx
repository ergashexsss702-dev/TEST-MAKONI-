import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Test, Question, TestAttempt, TestResult } from '../types';
import {
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  Eye,
  ShieldAlert,
  Loader2
} from 'lucide-react';

interface StudentTestPageProps {
  testId: string;
  onFinishTest: (resultId: string) => void;
  onCancel: () => void;
}

export const StudentTestPage: React.FC<StudentTestPageProps> = ({
  testId,
  onFinishTest,
  onCancel
}) => {
  const { user, showToast } = useAuth();

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<Test | null>(null);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers map: questionId -> selectedOptionLetter
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tabExits, setTabExits] = useState(0);

  // Real-time synchronization & autosave status
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Dialog state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exitWarningModal, setExitWarningModal] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const tabExitsRef = useRef(tabExits);
  tabExitsRef.current = tabExits;

  // 1. Initialize Test Session & Start/Resume Attempt
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const startTestSession = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tests/${testId}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: user.id })
        });

        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Testni boshlashda xatolik.", 'error');
          onCancel();
          return;
        }

        if (!isMounted) return;

        setTest(data.test);
        setAttempt(data.attempt);
        setQuestions(data.test.questions || []);

        // Load existing answers from server or localStorage
        const serverAnswers = data.attempt.current_answers_json || {};
        const localKey = `testmakon_cache_${data.attempt.id}`;
        let cachedAnswers: Record<string, string> = {};
        try {
          const stored = localStorage.getItem(localKey);
          if (stored) cachedAnswers = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }

        const merged = { ...serverAnswers, ...cachedAnswers };
        setAnswers(merged);
        setTabExits(data.attempt.tab_exits_count || 0);

        // Calculate timer expiration from server's expires_at
        const expiresAtTime = new Date(data.attempt.expires_at).getTime();
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.floor((expiresAtTime - now) / 1000));
        setSecondsRemaining(diffSeconds);

        if (data.resumed) {
          showToast("Oldingi urinishingiz davom ettirilmoqda.", 'info');
        }
      } catch (err: any) {
        showToast("Tarmoq xatosi.", 'error');
        onCancel();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    startTestSession();

    return () => {
      isMounted = false;
    };
  }, [testId, user]);

  // 2. Online / Offline Recovery Watcher (Section 34)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Internet tiklandi. Javoblar sinxronlashtirilmoqda...", 'info');
      // Trigger sync
      syncAnswersWithServer(answersRef.current, tabExitsRef.current);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setAutosaveStatus('offline');
      showToast("Internet aloqasi uzildi. Javoblaringiz qurilmada saqlanmoqda.", 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 3. Tab / Window Switch Detection (Section 14)
  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordTabExit();
      }
    };

    const handleBlur = () => {
      recordTabExit();
    };

    const recordTabExit = () => {
      setTabExits(prev => {
        const next = prev + 1;
        tabExitsRef.current = next;

        // Post to server asynchronously
        fetch(`/api/tests/attempts/${attempt.id}/tab-exit`, { method: 'POST' }).catch(() => {});

        return next;
      });
      setExitWarningModal(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [attempt]);

  // 4. Server-Authoritative Sticky Timer (Section 13)
  useEffect(() => {
    if (loading || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, secondsRemaining]);

  // 5. Debounced Autosave to Server (Section 12)
  const syncAnswersWithServer = useCallback(async (currentAnswers: Record<string, string>, currentExits: number) => {
    if (!attempt) return;

    // Cache locally first for instant offline safety
    try {
      localStorage.setItem(`testmakon_cache_${attempt.id}`, JSON.stringify(currentAnswers));
    } catch (e) {
      console.error(e);
    }

    if (!navigator.onLine) {
      setAutosaveStatus('offline');
      return;
    }

    try {
      setAutosaveStatus('saving');
      const res = await fetch(`/api/tests/attempts/${attempt.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: currentAnswers,
          tabExitsCount: currentExits
        })
      });
      if (res.ok) {
        setAutosaveStatus('saved');
      } else {
        setAutosaveStatus('offline');
      }
    } catch (err) {
      setAutosaveStatus('offline');
    }
  }, [attempt]);

  // User selects an option
  const handleSelectOption = (questionId: string, optionLetter: string) => {
    const updated = { ...answers, [questionId]: optionLetter };
    setAnswers(updated);
    answersRef.current = updated;

    // Debounce save request (500ms)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      syncAnswersWithServer(updated, tabExitsRef.current);
    }, 500);
  };

  // 6. Submit Test (Server-Side Scoring)
  const submitTest = async () => {
    if (!attempt) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tests/attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalAnswers: answers,
          tabExitsCount: tabExits
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Testni yakunlashda xatolik yuz berdi.", 'error');
        setSubmitting(false);
        return;
      }

      // Clear local cache
      try {
        localStorage.removeItem(`testmakon_cache_${attempt.id}`);
      } catch (e) {}

      showToast("Test muvaffaqiyatli yakunlandi!", 'success');
      onFinishTest(data.result.id);
    } catch (err) {
      showToast("Server bilan aloqa uzildi. Iltimos qayta urinib ko'ring.", 'error');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    showToast("Vaqt tugadi! Test avtomatik tarzda yakunlanmoqda...", 'warning');
    submitTest();
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <div className="text-base font-bold text-slate-800 dark:text-slate-200">
          Imtihon savollari yuklanmoqda...
        </div>
        <p className="text-xs text-slate-500">
          Xavfsiz sessiya o‘rnatilmoqda va taymer sinxronlanmoqda
        </p>
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" />
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
          Ushbu testda hali savollar yo‘q
        </h3>
        <p className="text-xs text-slate-500">
          Ustoz tomonidan testga savollar yuklanishi kutilmoqda.
        </p>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
        >
          Ortga qaytish
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  // Time format
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const isTimeCritical = secondsRemaining < 180; // Less than 3 minutes

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 selection:bg-indigo-500 selection:text-white">
      
      {/* 1. Offline Recovery Warning Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 text-center sticky top-0 z-50 shadow-md">
          <WifiOff className="w-4 h-4 shrink-0 animate-bounce" />
          Internet aloqasi uzildi. Xavotir olmang, javoblaringiz qurilmada saqlanmoqda!
        </div>
      )}

      {/* 2. Top Sticky Header: Progress, Questions Count, Sticky Timer, Autosave Status */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Test Title & Progress */}
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
              {test.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {progressPercent}% bajarildi
              </span>
            </div>
          </div>

          {/* Autosave Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {autosaveStatus === 'saving' && (
              <>
                <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                <span>Saqlanmoqda...</span>
              </>
            )}
            {autosaveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Saqlandi</span>
              </>
            )}
            {autosaveStatus === 'offline' && (
              <>
                <WifiOff className="w-3 h-3 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">Qurilmada</span>
              </>
            )}
          </div>

          {/* Sticky Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm sm:text-base font-extrabold shadow-sm transition-colors ${
              isTimeCritical
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse border border-rose-300 dark:border-rose-800'
                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-indigo-600 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Solving Container */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Tab Exits Alert Notice if any */}
        {tabExits > 0 && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Test davomida oynadan chiqishlar: <strong>{tabExits} ta</strong>
              </span>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase tracking-wider font-bold">
              Ustozga ko‘rinadi
            </span>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Question Header: Order and Points */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 font-mono">
              Savol #{currentIndex + 1}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {currentQ.points} ball
            </span>
          </div>

          {/* Question Text */}
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.question_text}
          </div>

          {/* Answer Options - Touch Target 44px+ strictly enforced */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map(opt => {
              const isSelected = answers[currentQ.id] === opt.option_letter;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, opt.option_letter)}
                  className={`w-full min-h-[52px] p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-100 shadow-md shadow-indigo-600/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {/* Option Letter Circle */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 font-mono transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.option_letter}
                  </div>

                  {/* Option Text */}
                  <div className="flex-1 text-sm sm:text-base font-medium leading-relaxed">
                    {opt.option_text}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Palette / Navigator (Grid of questions: 1 ✓, 2 —, etc.) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Savollar jadvali</span>
            <span className="text-[11px] font-mono">
              {answeredCount}/{questions.length} belgilandi
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;

              let style = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent';
              if (isAnswered) {
                style = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
              }
              if (isCurrent) {
                style = 'bg-indigo-600 text-white ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 border-transparent font-bold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-xl border text-xs font-mono font-semibold flex items-center justify-center gap-0.5 transition-all ${style}`}
                >
                  <span>{idx + 1}</span>
                  {isAnswered && !isCurrent && <span className="text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions: Previous, Next, Finish */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Oldingi
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
            >
              Keyingi <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Send className="w-4 h-4" /> Testni yakunlash
            </button>
          )}

          {/* Quick finish trigger at any time */}
          {currentIndex < questions.length - 1 && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 transition-all"
            >
              Tugatish
            </button>
          )}
        </div>
      </div>

      {/* 7. Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Testni yakunlaysizmi?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Jami savollar: <strong>{questions.length} ta</strong>
                <br />
                Javob berildi: <strong className="text-emerald-600">{answeredCount} ta</strong>
                {answeredCount < questions.length && (
                  <>
                    <br />
                    Belgilanmagan: <strong className="text-rose-600">{questions.length - answeredCount} ta</strong>
                  </>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Savollarga qaytish
              </button>
              <button
                type="button"
                onClick={submitTest}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Ha, yakunlash</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Tab / Window Exit Warning Notification Modal */}
      {exitWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Diqqat! Oynadan chiqish aniqlandi
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Test paytida boshqa ilovaga yoki brauzer vkladkasiga o‘tish qayd etildi.
              <br />
              <strong className="text-amber-600 font-mono">
                Jami chiqishlar soni: {tabExits} ta
              </strong>
              <br />
              Ushbu ma'lumot natijangiz bilan birga ustozingizga yuboriladi.
            </p>
            <button
              onClick={() => setExitWarningModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              Testni davom ettirish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
