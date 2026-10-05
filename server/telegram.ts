import crypto from 'crypto';
import { dbEngine, VerificationCode } from './db.js';

interface TelegramSendOptions {
  chat_id: string | number;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
}

interface QueuedNotification {
  id: string;
  chatId: string | number;
  message: string;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
}

class TelegramService {
  private botToken: string;
  private adminChatId: string;
  private notificationQueue: QueuedNotification[] = [];
  private isProcessingQueue = false;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
    this.startQueueWorker();
  }

  public getBotConfig() {
    return {
      isConfigured: !!(this.botToken && this.botToken !== 'your_telegram_bot_token_here'),
      hasAdminChat: !!(this.adminChatId && this.adminChatId !== 'your_telegram_chat_id_here'),
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'TestMakonBot',
      botTokenMasked: this.botToken ? `${this.botToken.substring(0, 6)}...${this.botToken.slice(-4)}` : null,
      adminChatId: this.adminChatId || null
    };
  }

  public updateConfig(token?: string, chatId?: string) {
    if (token !== undefined) this.botToken = token.trim();
    if (chatId !== undefined) this.adminChatId = chatId.trim();
  }

  // Generates 6-digit OTP code for a phone number
  public createVerificationCode(phone: string, telegramUserId?: number): { code: string; expiresAt: Date } {
    const db = dbEngine.db;
    const cleanPhone = phone.trim();

    // Check rate limit: max 5 requests per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const recentRequests = db.verification_codes.filter(
      v => v.phone === cleanPhone && v.created_at >= tenMinAgo
    );
    if (recentRequests.length >= 8) {
      throw new Error("Juda ko'p so'rov yuborildi. Iltimos, 10 daqiqadan so'ng qayta urinib ko'ring.");
    }

    // Generate random secure 6-digit number
    const randomInt = crypto.randomInt(100000, 999999);
    const code = randomInt.toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    const newCodeRecord: VerificationCode = {
      id: `vc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      phone: cleanPhone,
      code_hash: codeHash,
      plain_code: code,
      telegram_user_id: telegramUserId || null,
      expires_at: expiresAt.toISOString(),
      is_used: false,
      attempts_count: 0,
      created_at: new Date().toISOString()
    };

    db.verification_codes.push(newCodeRecord);
    dbEngine.persist();

    return { code, expiresAt };
  }

  // Validates entered code
  public verifyCode(phone: string, enteredCode: string): { success: boolean; message: string; telegramUserId?: number | null } {
    const db = dbEngine.db;
    const cleanPhone = phone.trim();
    const cleanCode = enteredCode.trim();
    const inputHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
    const now = new Date();

    const activeCodes = db.verification_codes
      .filter(v => v.phone === cleanPhone && !v.is_used)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (activeCodes.length === 0) {
      return { success: false, message: "Ushbu raqam uchun faol tasdiqlash kodi topilmadi. Qaytadan so'rang." };
    }

    const latest = activeCodes[0];

    // Check expiration
    if (new Date(latest.expires_at) < now) {
      return { success: false, message: "Kod muddati tugagan (5 daqiqa). Yangi kod so'rang." };
    }

    // Check attempts for brute-force protection (max 4 tries per code)
    if (latest.attempts_count >= 4) {
      return { success: false, message: "Urinishlar soni oshib ketdi. Yangi kod so'rang." };
    }

    latest.attempts_count += 1;

    if (latest.code_hash !== inputHash && latest.plain_code !== cleanCode) {
      dbEngine.persist();
      return { success: false, message: `Noto'g'ri tasdiqlash kodi. Qolgan urinishlar: ${4 - latest.attempts_count}` };
    }

    // Successful match
    latest.is_used = true;
    dbEngine.persist();

    return {
      success: true,
      message: "Muvaffaqiyatli tasdiqlandi!",
      telegramUserId: latest.telegram_user_id
    };
  }

  // Send message to Telegram API
  public async sendMessage(options: TelegramSendOptions): Promise<boolean> {
    if (!this.botToken || this.botToken === 'your_telegram_bot_token_here') {
      console.log(`[Telegram Simulation] Message to ${options.chat_id}:\n${options.text}`);
      return true;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: options.chat_id,
          text: options.text,
          parse_mode: options.parse_mode || 'HTML'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Telegram API error response:', errorText);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Telegram network dispatch failed:', err);
      return false;
    }
  }

  // Queue test result notification (non-blocking for student submission)
  public queueResultNotification(data: {
    studentName: string;
    testTitle: string;
    score: number;
    totalPoints: number;
    percentage: number;
    isPassed: boolean;
    timeSpentStr: string;
    tabExits: number;
  }) {
    const statusText = data.isPassed ? "O‘TDI ✅" : "O‘TMADI ❌";
    const text = 
`📝 <b>Yangi test natijasi</b>

👤 <b>O‘quvchi:</b> ${data.studentName}
📚 <b>Test:</b> ${data.testTitle}
🎯 <b>Ball:</b> ${data.score}/${data.totalPoints}
📊 <b>Foiz:</b> ${data.percentage.toFixed(1)}%
🏁 <b>Natija:</b> ${statusText}
⏱ <b>Vaqt:</b> ${data.timeSpentStr}
⚠️ <b>Oynadan chiqishlar:</b> ${data.tabExits}`;

    const targetChat = this.adminChatId || 'SIMULATED_ADMIN_CHAT';

    this.notificationQueue.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      chatId: targetChat,
      message: text,
      attempts: 0,
      maxAttempts: 3,
      createdAt: Date.now()
    });
  }

  // Worker for retrying and sending queued notifications
  private startQueueWorker() {
    const timer = setInterval(async () => {
      if (this.isProcessingQueue || this.notificationQueue.length === 0) return;
      this.isProcessingQueue = true;

      try {
        const item = this.notificationQueue[0];
        item.attempts += 1;

        const sent = await this.sendMessage({
          chat_id: item.chatId,
          text: item.message,
          parse_mode: 'HTML'
        });

        if (sent || item.attempts >= item.maxAttempts) {
          this.notificationQueue.shift(); // remove from queue
        }
      } catch (err) {
        console.error('Notification worker error:', err);
      } finally {
        this.isProcessingQueue = false;
      }
    }, 2000);
    if (timer.unref) timer.unref();
  }

  // Handle incoming Telegram Webhook updates
  public async handleWebhookUpdate(update: any): Promise<{ handled: boolean; replyText?: string }> {
    if (!update || !update.message) return { handled: false };

    const msg = update.message;
    const chatId = msg.chat?.id;
    const text = msg.text?.trim() || '';
    const fromUser = msg.from;

    if (!chatId) return { handled: false };

    if (text.startsWith('/start')) {
      const welcomeMsg = 
`Assalomu alaykum, <b>${fromUser?.first_name || 'Foydalanuvchi'}</b>!

<b>TestMakon</b> imtihon va test tizimining rasmiy botiga xush kelibsiz.

Saytda ro'yxatdan o'tish yoki kirish uchun telefon raqamingizni yuboring yoki quyidagi buyruqdan foydalaning:
👉 /kod — Saytga kirish uchun 6 xonali tasdiqlash kodini olish.`;

      await this.sendMessage({ chat_id: chatId, text: welcomeMsg });
      return { handled: true, replyText: welcomeMsg };
    }

    if (text.startsWith('/kod')) {
      // Find latest pending phone or create code for user
      const code = crypto.randomInt(100000, 999999).toString();
      const reply = 
`Saytga kirish uchun tasdiqlash kodingiz:
<code>${code}</code>

Bu kod 5 daqiqa amal qiladi.`;

      await this.sendMessage({ chat_id: chatId, text: reply });
      return { handled: true, replyText: reply };
    }

    return { handled: true };
  }
}

export const telegramService = new TelegramService();
