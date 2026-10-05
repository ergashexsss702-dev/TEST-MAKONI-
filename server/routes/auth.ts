import express from 'express';
import { dbEngine, Profile, UserRole } from '../db.js';
import { telegramService } from '../telegram.js';

export const authRouter = express.Router();

// Strict phone normalization and validation: +998 XX XXX XX XX
export function normalizePhone(raw: string): { valid: boolean; normalized: string; formatted: string } {
  if (!raw) return { valid: false, normalized: '', formatted: '' };

  // Remove all non-digits except +
  const digits = raw.replace(/\D/g, '');

  // Must be 12 digits starting with 998, or 9 digits (local)
  let clean = digits;
  if (clean.length === 9) {
    clean = '998' + clean;
  }

  if (clean.length !== 12 || !clean.startsWith('998')) {
    return { valid: false, normalized: '', formatted: '' };
  }

  // Format: +998 XX XXX XX XX
  const code = clean.substring(3, 5);
  const p1 = clean.substring(5, 8);
  const p2 = clean.substring(8, 10);
  const p3 = clean.substring(10, 12);
  const formatted = `+998 ${code} ${p1} ${p2} ${p3}`;

  return { valid: true, normalized: `+${clean}`, formatted };
}

// 1. REGISTER
authRouter.post('/register', (req, res) => {
  try {
    const { firstName, lastName, phone, role } = req.body;

    if (!firstName || firstName.trim().length < 2) {
      return res.status(400).json({ error: "Ism kamida 2 ta belgidan iborat bo'lishi kerak." });
    }
    if (!lastName || lastName.trim().length < 2) {
      return res.status(400).json({ error: "Familiya kamida 2 ta belgidan iborat bo'lishi kerak." });
    }

    const phoneCheck = normalizePhone(phone);
    if (!phoneCheck.valid) {
      return res.status(400).json({ error: "Telefon raqami noto'g'ri. Shakli: +998 XX XXX XX XX" });
    }

    const db = dbEngine.db;
    const existing = db.profiles.find(p => p.phone === phoneCheck.formatted);

    if (existing && existing.is_verified) {
      return res.status(400).json({ error: "Ushbu telefon raqami bilan hisob allaqachon mavjud. Kirish bo'limiga o'ting." });
    }

    let profile = existing;
    if (!profile) {
      const assignedRole: UserRole = role === 'TEACHER' ? 'TEACHER' : role === 'ADMIN' ? 'ADMIN' : 'STUDENT';
      profile = {
        id: `prof-${Date.now()}`,
        user_id: `usr-${Date.now()}`,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phoneCheck.formatted,
        role: assignedRole,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.profiles.push(profile);
      dbEngine.persist();
    } else {
      profile.first_name = firstName.trim();
      profile.last_name = lastName.trim();
      dbEngine.persist();
    }

    // Generate Telegram verification OTP
    const { code, expiresAt } = telegramService.createVerificationCode(phoneCheck.formatted);

    // Audit log
    db.audit_logs.push({
      id: `log-${Date.now()}`,
      user_id: profile.id,
      user_name: `${profile.first_name} ${profile.last_name}`,
      action: 'USER_REGISTER_INITIATED',
      target_type: 'USER',
      target_id: profile.id,
      metadata_json: { phone: phoneCheck.formatted },
      created_at: new Date().toISOString()
    });
    dbEngine.persist();

    return res.json({
      success: true,
      message: "Telegram orqali tasdiqlash kodi yuborildi.",
      phone: phoneCheck.formatted,
      expiresAt,
      // For immediate convenience in developer sandbox / simulation
      simulatedCode: code
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Serverda xatolik yuz berdi." });
  }
});

// 2. REQUEST TELEGRAM CODE
authRouter.post('/request-code', (req, res) => {
  try {
    const { phone } = req.body;
    const phoneCheck = normalizePhone(phone);
    if (!phoneCheck.valid) {
      return res.status(400).json({ error: "Telefon raqami noto'g'ri. Shakli: +998 XX XXX XX XX" });
    }

    const { code, expiresAt } = telegramService.createVerificationCode(phoneCheck.formatted);

    return res.json({
      success: true,
      message: "Yangi tasdiqlash kodi Telegram botga yo'naltirildi.",
      phone: phoneCheck.formatted,
      expiresAt,
      simulatedCode: code
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 3. VERIFY TELEGRAM CODE
authRouter.post('/verify-code', (req, res) => {
  try {
    const { phone, code } = req.body;
    const phoneCheck = normalizePhone(phone);
    if (!phoneCheck.valid) {
      return res.status(400).json({ error: "Telefon raqami noto'g'ri." });
    }

    if (!code || code.trim().length !== 6) {
      return res.status(400).json({ error: "6 xonali tasdiqlash kodini kiriting." });
    }

    const verificationResult = telegramService.verifyCode(phoneCheck.formatted, code);
    if (!verificationResult.success) {
      return res.status(400).json({ error: verificationResult.message });
    }

    const db = dbEngine.db;
    const profile = db.profiles.find(p => p.phone === phoneCheck.formatted);
    if (!profile) {
      return res.status(404).json({ error: "Foydalanuvchi profili topilmadi." });
    }

    profile.is_verified = true;
    if (verificationResult.telegramUserId) {
      profile.telegram_user_id = verificationResult.telegramUserId;
    }
    profile.updated_at = new Date().toISOString();

    // 30-day session token
    const sessionToken = `sess-${profile.id}-${Date.now()}`;
    res.cookie('testmakon_session', sessionToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax'
    });

    db.audit_logs.push({
      id: `log-${Date.now()}`,
      user_id: profile.id,
      user_name: `${profile.first_name} ${profile.last_name}`,
      action: 'USER_VERIFIED_TELEGRAM',
      target_type: 'USER',
      target_id: profile.id,
      metadata_json: { phone: profile.phone },
      created_at: new Date().toISOString()
    });
    dbEngine.persist();

    return res.json({
      success: true,
      message: "Hisob muvaffaqiyatli tasdiqlandi!",
      user: profile,
      token: sessionToken
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. LOGIN WITH PHONE & OTP
authRouter.post('/login', (req, res) => {
  try {
    const { phone } = req.body;
    const phoneCheck = normalizePhone(phone);
    if (!phoneCheck.valid) {
      return res.status(400).json({ error: "Telefon raqami noto'g'ri. Shakli: +998 XX XXX XX XX" });
    }

    const db = dbEngine.db;
    const profile = db.profiles.find(p => p.phone === phoneCheck.formatted);
    if (!profile) {
      return res.status(404).json({ error: "Bu raqam bilan ro'yxatdan o'tilmagan. Iltimos, ro'yxatdan o'ting." });
    }

    // Generate code for Telegram login
    const { code, expiresAt } = telegramService.createVerificationCode(phoneCheck.formatted);

    return res.json({
      success: true,
      message: "Telegram orqali tasdiqlash kodi yuborildi.",
      phone: phoneCheck.formatted,
      expiresAt,
      simulatedCode: code,
      role: profile.role
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. GET CURRENT USER
authRouter.get('/me', (req, res) => {
  const phoneParam = req.query.phone as string;
  const db = dbEngine.db;

  if (phoneParam) {
    const phoneCheck = normalizePhone(phoneParam);
    const profile = db.profiles.find(p => p.phone === phoneCheck.formatted);
    if (profile) return res.json({ user: profile });
  }

  // Fallback: check authorization or return default active demo student Muhammad Aliyev
  const firstStudent = db.profiles.find(p => p.role === 'STUDENT' && p.is_verified) || db.profiles[0];
  return res.json({ user: firstStudent });
});

// 6. LOGOUT
authRouter.post('/logout', (req, res) => {
  res.clearCookie('testmakon_session');
  return res.json({ success: true, message: "Tizimdan muvaffaqiyatli chiqildi." });
});

// 7. SWITCH ACTIVE PROFILE (Development & Review convenience)
authRouter.post('/switch-role', (req, res) => {
  const { role } = req.body; // 'STUDENT' | 'TEACHER' | 'ADMIN'
  const db = dbEngine.db;
  const target = db.profiles.find(p => p.role === role);
  if (!target) {
    return res.status(404).json({ error: "Bunday roldagi profil topilmadi." });
  }
  return res.json({ success: true, user: target });
});
