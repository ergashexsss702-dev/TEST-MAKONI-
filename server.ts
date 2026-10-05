import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { authRouter } from './server/routes/auth.js';
import { groupsRouter } from './server/routes/groups.js';
import { testsRouter } from './server/routes/tests.js';
import { resultsRouter } from './server/routes/results.js';
import { adminRouter } from './server/routes/admin.js';
import { telegramService } from './server/telegram.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Basic JSON & Cookie middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Anti-spam lightweight rate limiter for high-concurrency 500+ students
const requestCounters = new Map<string, { count: number; resetAt: number }>();
app.use('/api/', (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = requestCounters.get(ip);

  if (!record || now > record.resetAt) {
    requestCounters.set(ip, { count: 1, resetAt: now + 60000 });
  } else {
    record.count++;
    if (record.count > 1200) { // high limit for active test autosave polling
      return res.status(429).json({ error: "Juda ko'p so'rovlar yuborildi. Biroz kuting." });
    }
  }
  next();
});

// Telegram Bot Webhook endpoint
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const result = await telegramService.handleWebhookUpdate(req.body);
    return res.json({ ok: true, result });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Mount modular API routes
app.use('/api/auth', authRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/tests', testsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/admin', adminRouter);

// System health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'TestMakon Online Examination Platform',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TestMakon Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
