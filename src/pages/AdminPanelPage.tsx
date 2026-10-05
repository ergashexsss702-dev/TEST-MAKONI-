import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, AuditLog, TelegramConfig } from '../types';
import {
  Shield,
  Users,
  Bot,
  History,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  Settings,
  Database
} from 'lucide-react';

export const AdminPanelPage: React.FC = () => {
  const { user, showToast } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'telegram' | 'audit'>('users');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig | null>(null);

  const [searchUsers, setSearchUsers] = useState('');
  const [searchLogs, setSearchLogs] = useState('');
  const [testChatId, setTestChatId] = useState('');
  const [sendingTestMessage, setSendingTestMessage] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes, tgRes] = await Promise.all([
        fetch('/api/admin/system-stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/telegram-status')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users || []);
      }
      if (logsRes.ok) {
        const l = await logsRes.json();
        setAuditLogs(l.logs || []);
      }
      if (tgRes.ok) setTelegramConfig(await tgRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        showToast("Foydalanuvchi roli muvaffaqiyatli yangilandi!", 'success');
        loadAdminData();
      } else {
        showToast("Rolni o'zgartirishda xatolik.", 'error');
      }
    } catch (err) {
      showToast("Tarmoq xatosi.", 'error');
    }
  };

  const handleSendTelegramTest = async () => {
    setSendingTestMessage(true);
    try {
      const res = await fetch('/api/admin/telegram-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: testChatId })
      });
      const data = await res.json();
      setSendingTestMessage(false);

      if (data.success) {
        showToast("Sinov xabari Telegram orqali muvaffaqiyatli yuborildi!", 'success');
      } else {
        showToast(data.message || "Xatolik yuz berdi.", 'error');
      }
    } catch (err) {
      setSendingTestMessage(false);
      showToast("Tarmoq xatosi.", 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.phone}`.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(l =>
    `${l.user_name} ${l.action} ${l.target_type}`.toLowerCase().includes(searchLogs.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            Tizim Admin Paneli 🛡️
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Foydalanuvchilar, rollar, xavfsizlik audit jurnallari va Telegram integratsiyasi
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Foydalanuvchilar ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('telegram')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'telegram'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Telegram Integratsiyasi
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Audit Jurnali ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jami a'zolar</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{stats?.totalUsers || 0}</div>
          <div className="text-[11px] text-slate-500">{stats?.totalStudents || 0} talaba, {stats?.totalTeachers || 0} ustoz</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faol guruhlar</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono">{stats?.activeGroups || 0}</div>
          <div className="text-[11px] text-slate-500">{stats?.totalTests || 0} ta faol test</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Topshirilgan testlar</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{stats?.totalResults || 0}</div>
          <div className="text-[11px] text-emerald-600 font-medium">{stats?.overallPassRate || 0}% o‘tish ko‘rsatkichi</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ma'lumotlar bazasi</span>
          <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 pt-1">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>PostgreSQL / JSON</span>
          </div>
          <div className="text-[11px] text-slate-400">RLS faol</div>
        </div>
      </div>

      {/* Tab 1: Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Foydalanuvchilar va Rollar Boshqaruvi
              </h2>
              <p className="text-xs text-slate-500">
                Talaba, Ustoz yoki Admin huquqlarini o‘zgartirish
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Foydalanuvchini qidirish..."
                value={searchUsers}
                onChange={e => setSearchUsers(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3">Foydalanuvchi</th>
                  <th className="py-3 px-3">Telefon</th>
                  <th className="py-3 px-3">Telegram</th>
                  <th className="py-3 px-3">Guruhlar</th>
                  <th className="py-3 px-3">Joriy Rol</th>
                  <th className="py-3 px-3 text-right">Rolni o‘zgartirish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ID: {u.id}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {u.phone}
                    </td>
                    <td className="py-3.5 px-3">
                      {u.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> Tasdiqlangan
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Tasdiqlanmagan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-600 dark:text-slate-400">
                      {u.groupCount || 0} ta guruh
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : u.role === 'TEACHER'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <select
                        value={u.role}
                        onChange={e => handleChangeRole(u.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="TEACHER">TEACHER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Telegram Bot Integration Settings (Section 5 & 23) */}
      {activeTab === 'telegram' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-[#2aabee]" />
              Telegram Bot Integratsiyasi Sozlamalari
            </h2>
            <p className="text-xs text-slate-500">
              O‘quvchilar bir martalik OTP kod oladigan va imtihon natijalari avtomatik yuboriladigan bot holati
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block uppercase font-bold">Bot holati:</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {telegramConfig?.isConfigured ? "Haqiqiy Telegram Bot Ulangan" : "Simulyator & Demo Rejim Faol"}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bot foydalanuvchi nom: <strong>@{telegramConfig?.botUsername || 'TestMakonBot'}</strong>
                <br />
                Token: <span className="font-mono text-[11px]">{telegramConfig?.botTokenMasked || 'Simulated runtime'}</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs text-slate-400 block uppercase font-bold">
                Telegram Sinov Xabari Yuborish:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Telegram Chat ID (masalan: 123456789)"
                  value={testChatId}
                  onChange={e => setTestChatId(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleSendTelegramTest}
                  disabled={sendingTestMessage}
                  className="px-4 py-2 rounded-xl bg-[#2aabee] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#2aabee]/20 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Yuborish
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Ushbu tugma orqali imtihon yakunlanganida adminga keladigan Telegram xabarnomasi sinovdan o‘tkaziladi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs (Section 25) */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Xavfsizlik Audit Jurnali (Audit Logs)
              </h2>
              <p className="text-xs text-slate-500">
                Tizimda bajarilgan barcha muhim harakatlar qaydnomasi
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Amal yoki foydalanuvchini qidirish..."
                value={searchLogs}
                onChange={e => setSearchLogs(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3">Vaqt</th>
                  <th className="py-3 px-3">Foydalanuvchi</th>
                  <th className="py-3 px-3">Amal</th>
                  <th className="py-3 px-3">Obyekt</th>
                  <th className="py-3 px-3">Qo‘shimcha Tafsilotlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('uz-UZ')}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {log.user_name}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {log.action}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono">
                      {log.target_type}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                      {JSON.stringify(log.metadata_json)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
