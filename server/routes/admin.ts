import express from 'express';
import { dbEngine, UserRole } from '../db.js';
import { telegramService } from '../telegram.js';

export const adminRouter = express.Router();

// 1. GET SYSTEM STATS
adminRouter.get('/system-stats', (req, res) => {
  const db = dbEngine.db;

  const totalUsers = db.profiles.length;
  const totalStudents = db.profiles.filter(p => p.role === 'STUDENT').length;
  const totalTeachers = db.profiles.filter(p => p.role === 'TEACHER').length;
  const activeGroups = db.groups.filter(g => g.is_active).length;
  const totalTests = db.tests.length;
  const totalResults = db.test_results.length;

  const todayStr = new Date().toISOString().substring(0, 10);
  const testsCompletedToday = db.test_results.filter(r => r.created_at.startsWith(todayStr)).length;

  const passedCount = db.test_results.filter(r => r.is_passed).length;
  const averageScore = totalResults > 0
    ? db.test_results.reduce((acc, r) => acc + r.percentage, 0) / totalResults
    : 0;

  return res.json({
    totalUsers,
    totalStudents,
    totalTeachers,
    activeGroups,
    totalTests,
    totalResults,
    testsCompletedToday,
    averageScore: Math.round(averageScore * 10) / 10,
    overallPassRate: totalResults > 0 ? Math.round((passedCount / totalResults) * 100) : 0
  });
});

// 2. GET USERS LIST
adminRouter.get('/users', (req, res) => {
  const db = dbEngine.db;
  const { role, search } = req.query;

  let users = [...db.profiles];

  if (role) {
    users = users.filter(u => u.role === role);
  }

  if (search) {
    const s = (search as string).toLowerCase();
    users = users.filter(u => 
      u.first_name.toLowerCase().includes(s) ||
      u.last_name.toLowerCase().includes(s) ||
      u.phone.includes(s)
    );
  }

  const enriched = users.map(u => {
    const groupCount = db.group_members.filter(gm => gm.student_id === u.id).length;
    const resultsCount = db.test_results.filter(r => r.student_id === u.id).length;
    return {
      ...u,
      groupCount,
      resultsCount
    };
  });

  return res.json({ users: enriched });
});

// 3. UPDATE USER ROLE
adminRouter.put('/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: "Noto'g'ri foydalanuvchi roli." });
  }

  const db = dbEngine.db;
  const user = db.profiles.find(p => p.id === id);
  if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi." });

  const oldRole = user.role;
  user.role = role as UserRole;
  user.updated_at = new Date().toISOString();

  db.audit_logs.push({
    id: `log-${Date.now()}`,
    user_id: null,
    user_name: 'Admin',
    action: 'USER_ROLE_CHANGED',
    target_type: 'USER',
    target_id: id,
    metadata_json: { oldRole, newRole: role, userName: `${user.first_name} ${user.last_name}` },
    created_at: new Date().toISOString()
  });

  dbEngine.persist();
  return res.json({ success: true, user });
});

// 4. AUDIT LOGS (Section 25)
adminRouter.get('/audit-logs', (req, res) => {
  const db = dbEngine.db;
  const { search, limit = '100', offset = '0' } = req.query;

  let logs = [...db.audit_logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (search) {
    const s = (search as string).toLowerCase();
    logs = logs.filter(l => 
      l.user_name.toLowerCase().includes(s) ||
      l.action.toLowerCase().includes(s) ||
      l.target_type.toLowerCase().includes(s)
    );
  }

  const l = parseInt(limit as string, 10) || 100;
  const o = parseInt(offset as string, 10) || 0;
  const paginated = logs.slice(o, o + l);

  return res.json({
    total: logs.length,
    logs: paginated
  });
});

// 5. TELEGRAM STATUS & CONFIG
adminRouter.get('/telegram-status', (req, res) => {
  const config = telegramService.getBotConfig();
  return res.json(config);
});

// 6. SEND TEST NOTIFICATION TO TELEGRAM
adminRouter.post('/telegram-test', async (req, res) => {
  const { chatId } = req.body;
  const targetChat = chatId || process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!targetChat) {
    return res.status(400).json({ error: "Telegram Chat ID ko'rsatilmadi." });
  }

  const testMessage = 
`🔔 <b>TestMakon — Sinov Xabari</b>

Tizim: TestMakon Online Examination Platform
Holat: Telegram bot aloqasi muvaffaqiyatli o'rnatildi!
Vaqt: ${new Date().toLocaleString('uz-UZ')}

Ushbu xabar platforma sozlamalarining to'g'ri ishlayotganligini tasdiqlaydi.`;

  const success = await telegramService.sendMessage({
    chat_id: targetChat,
    text: testMessage,
    parse_mode: 'HTML'
  });

  return res.json({
    success,
    message: success 
      ? "Sinov xabari Telegram orqali muvaffaqiyatli yuborildi!" 
      : "Xabar yuborishda xatolik. Bot token va Chat ID ni tekshiring."
  });
});
