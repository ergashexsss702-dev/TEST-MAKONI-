import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import {
  GraduationCap,
  BookOpen,
  Users,
  FileText,
  FileSpreadsheet,
  BarChart3,
  Shield,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  HelpCircle,
  FileUp,
  User,
  History,
  CheckCircle2
} from 'lucide-react';
import { QuickGuideModal } from './QuickGuideModal';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, activeRole, switchRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setRoleDropdownOpen(false);
    if (role === 'STUDENT') setCurrentTab('student-dashboard');
    else if (role === 'TEACHER') setCurrentTab('teacher-dashboard');
    else setCurrentTab('admin-dashboard');
  };

  const navLinks = () => {
    if (activeRole === 'STUDENT') {
      return [
        { id: 'student-dashboard', label: 'Bosh sahifa', icon: BookOpen },
        { id: 'student-tests', label: 'Testlarim', icon: FileText },
        { id: 'student-results', label: 'Natijalarim', icon: History },
        { id: 'student-profile', label: 'Profilim', icon: User }
      ];
    } else if (activeRole === 'TEACHER') {
      return [
        { id: 'teacher-dashboard', label: 'Bosh sahifa', icon: BarChart3 },
        { id: 'teacher-groups', label: 'Guruhlar', icon: Users },
        { id: 'teacher-tests', label: 'Testlar', icon: FileText },
        { id: 'teacher-import', label: 'Savol import', icon: FileUp },
        { id: 'teacher-results', label: 'Natijalar & Excel', icon: FileSpreadsheet },
        { id: 'teacher-stats', label: 'Statistika', icon: BarChart3 }
      ];
    } else {
      // ADMIN
      return [
        { id: 'admin-dashboard', label: 'Admin Boshqaruv', icon: Shield },
        { id: 'admin-users', label: 'Foydalanuvchilar', icon: Users },
        { id: 'teacher-groups', label: 'Guruhlar', icon: BookOpen },
        { id: 'teacher-tests', label: 'Barcha Testlar', icon: FileText },
        { id: 'teacher-results', label: 'Barcha Natijalar', icon: FileSpreadsheet },
        { id: 'admin-audit', label: 'Audit Jurnali', icon: History }
      ];
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeRole === 'STUDENT') setCurrentTab('student-dashboard');
                else if (activeRole === 'TEACHER') setCurrentTab('teacher-dashboard');
                else setCurrentTab('admin-dashboard');
              }}
              className="flex items-center gap-2.5 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="font-extrabold text-lg text-slate-900 dark:text-white leading-none tracking-tight flex items-center gap-1.5">
                  TestMakon
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    UZ
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Onlayn Imtihon Tizimi
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks().map(link => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setCurrentTab(link.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools: Role Selector, Guide, Theme, Profile */}
          <div className="flex items-center gap-2">
            
            {/* Quick Guide Trigger for Teachers & Admins */}
            {(activeRole === 'TEACHER' || activeRole === 'ADMIN') && (
              <button
                onClick={() => setGuideOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all shadow-sm"
                title="Qisqa qo'llanma"
              >
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Qo‘llanma</span>
              </button>
            )}

            {/* Instant Role Switcher (For live review convenience) */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-all"
                title="Rolni almashtirish"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {activeRole === 'STUDENT' ? 'Talaba' : activeRole === 'TEACHER' ? 'Ustoz' : 'Admin'}
                </span>
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Rolni tanlang
                  </div>
                  <button
                    onClick={() => handleRoleSelect('STUDENT')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                      activeRole === 'STUDENT'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>👤 Talaba (Student)</span>
                    {activeRole === 'STUDENT' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  <button
                    onClick={() => handleRoleSelect('TEACHER')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                      activeRole === 'TEACHER'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🎓 Ustoz (Teacher)</span>
                    {activeRole === 'TEACHER' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  <button
                    onClick={() => handleRoleSelect('ADMIN')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                      activeRole === 'ADMIN'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🛡️ Tizim Admini</span>
                    {activeRole === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Mavzuni o'zgartirish"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-5 space-y-1 shadow-lg animate-in slide-in-from-top-2">
            <div className="pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-[11px] text-slate-500">{user?.phone}</div>
              </div>
              <button
                onClick={() => {
                  setGuideOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1"
              >
                <HelpCircle className="w-4 h-4" /> Qo‘llanma
              </button>
            </div>

            {navLinks().map(link => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setCurrentTab(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Teacher Quick Guide Modal */}
      <QuickGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
};
