import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyTelegramPage } from './pages/VerifyTelegramPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentTestPage } from './pages/StudentTestPage';
import { StudentResultPage } from './pages/StudentResultPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherGroupsPage } from './pages/TeacherGroupsPage';
import { TeacherTestsPage } from './pages/TeacherTestsPage';
import { TeacherTestCreatePage } from './pages/TeacherTestCreatePage';
import { TeacherImportPage } from './pages/TeacherImportPage';
import { TeacherResultsPage } from './pages/TeacherResultsPage';
import { TeacherStatisticsPage } from './pages/TeacherStatisticsPage';
import { TeacherUnattemptedTestsPage } from './pages/TeacherUnattemptedTestsPage';
import { AdminPanelPage } from './pages/AdminPanelPage';

export function App() {
  const { user, loading, activeRole } = useAuth();

  // Auth sub-pages: 'login' | 'register' | 'verify'
  const [authView, setAuthView] = useState<'login' | 'register' | 'verify'>('login');
  const [pendingPhone, setPendingPhone] = useState('+998 99 111 22 33');
  const [pendingSimulatedCode, setPendingSimulatedCode] = useState<string | undefined>(undefined);

  // Main navigation tab
  const [currentTab, setCurrentTab] = useState<string>('student-dashboard');

  // Active Test and Result states
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [selectedParamTestId, setSelectedParamTestId] = useState<string | undefined>(undefined);

  // Auto-switch default tab when role changes
  React.useEffect(() => {
    if (activeRole === 'STUDENT') {
      setCurrentTab('student-dashboard');
    } else if (activeRole === 'TEACHER') {
      setCurrentTab('teacher-dashboard');
    } else if (activeRole === 'ADMIN') {
      setCurrentTab('admin-dashboard');
    }
  }, [activeRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            TestMakon yuklanmoqda...
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, render Auth flow
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
        <ToastContainer />
        <main className="flex-1">
          {authView === 'login' && (
            <LoginPage
              onGoToRegister={() => setAuthView('register')}
              onGoToVerify={(phone, code) => {
                setPendingPhone(phone);
                setPendingSimulatedCode(code);
                setAuthView('verify');
              }}
            />
          )}

          {authView === 'register' && (
            <RegisterPage
              onGoToLogin={() => setAuthView('login')}
              onGoToVerify={(phone, code) => {
                setPendingPhone(phone);
                setPendingSimulatedCode(code);
                setAuthView('verify');
              }}
            />
          )}

          {authView === 'verify' && (
            <VerifyTelegramPage
              phone={pendingPhone}
              simulatedCode={pendingSimulatedCode}
              onSuccess={() => {
                setAuthView('login');
              }}
              onBack={() => setAuthView('login')}
            />
          )}
        </main>
      </div>
    );
  }

  // If student is solving an active test (Fullscreen focus mode)
  if (activeTestId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <ToastContainer />
        <StudentTestPage
          testId={activeTestId}
          onFinishTest={(resultId) => {
            setActiveTestId(null);
            setActiveResultId(resultId);
          }}
          onCancel={() => setActiveTestId(null)}
        />
      </div>
    );
  }

  // If viewing a single test result
  if (activeResultId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <ToastContainer />
        <main className="flex-1">
          <StudentResultPage
            resultId={activeResultId}
            onGoHome={() => setActiveResultId(null)}
            onGoProfile={() => {
              setActiveResultId(null);
              setCurrentTab('student-profile');
            }}
          />
        </main>
      </div>
    );
  }

  // Logged-in full application layout
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <ToastContainer />

      <main className="flex-1 pb-16">
        {/* STUDENT VIEWS */}
        {currentTab === 'student-dashboard' && (
          <StudentDashboard
            onStartTest={(tId) => setActiveTestId(tId)}
            onViewResult={(rId) => setActiveResultId(rId)}
            onGoToTests={() => setCurrentTab('student-tests')}
            onGoToResults={() => setCurrentTab('student-results')}
          />
        )}

        {currentTab === 'student-tests' && (
          <StudentDashboard
            onStartTest={(tId) => setActiveTestId(tId)}
            onViewResult={(rId) => setActiveResultId(rId)}
            onGoToTests={() => setCurrentTab('student-tests')}
            onGoToResults={() => setCurrentTab('student-results')}
          />
        )}

        {currentTab === 'student-results' && (
          <StudentProfilePage onViewResult={(rId) => setActiveResultId(rId)} />
        )}

        {currentTab === 'student-profile' && (
          <StudentProfilePage onViewResult={(rId) => setActiveResultId(rId)} />
        )}

        {/* TEACHER VIEWS */}
        {currentTab === 'teacher-dashboard' && (
          <TeacherDashboard
            onGoToTests={() => setCurrentTab('teacher-tests')}
            onGoToCreateTest={() => setCurrentTab('teacher-create-test')}
            onGoToImport={() => setCurrentTab('teacher-import')}
            onGoToGroups={() => setCurrentTab('teacher-groups')}
            onGoToResults={() => setCurrentTab('teacher-results')}
            onGoToStats={() => setCurrentTab('teacher-stats')}
            onViewResult={(rId) => setActiveResultId(rId)}
            onOpenRetake={(testId, studentId, studentName) => {
              setCurrentTab('teacher-results');
            }}
          />
        )}

        {currentTab === 'teacher-groups' && <TeacherGroupsPage />}

        {currentTab === 'teacher-tests' && (
          <TeacherTestsPage
            onGoToCreateTest={() => setCurrentTab('teacher-create-test')}
            onGoToImport={(testId) => {
              setSelectedParamTestId(testId);
              setCurrentTab('teacher-import');
            }}
            onGoToStats={(testId) => {
              setSelectedParamTestId(testId);
              setCurrentTab('teacher-stats');
            }}
            onGoToUnattempted={(testId) => {
              setSelectedParamTestId(testId);
              setCurrentTab('teacher-unattempted');
            }}
          />
        )}

        {currentTab === 'teacher-create-test' && (
          <TeacherTestCreatePage
            onSuccess={(newTestId) => {
              setSelectedParamTestId(newTestId);
              setCurrentTab('teacher-import');
            }}
            onCancel={() => setCurrentTab('teacher-tests')}
          />
        )}

        {currentTab === 'teacher-import' && (
          <TeacherImportPage
            initialTestId={selectedParamTestId}
            onSuccess={() => setCurrentTab('teacher-tests')}
            onCancel={() => setCurrentTab('teacher-tests')}
          />
        )}

        {currentTab === 'teacher-results' && (
          <TeacherResultsPage onViewResult={(rId) => setActiveResultId(rId)} />
        )}

        {currentTab === 'teacher-stats' && (
          <TeacherStatisticsPage
            initialTestId={selectedParamTestId}
            onCancel={() => setCurrentTab('teacher-tests')}
          />
        )}

        {currentTab === 'teacher-unattempted' && (
          <TeacherUnattemptedTestsPage
            initialTestId={selectedParamTestId}
            onCancel={() => setCurrentTab('teacher-tests')}
          />
        )}

        {/* ADMIN VIEWS */}
        {(currentTab === 'admin-dashboard' ||
          currentTab === 'admin-users' ||
          currentTab === 'admin-audit') && <AdminPanelPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>TestMakon</strong> — O‘zbekiston talabalari uchun professional onlayn test platformasi
          </div>
          <div className="text-[11px] text-slate-400">
            500+ bir vaqtda talaba • Server-side baholash • Telegram Bot integratsiyasi
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
