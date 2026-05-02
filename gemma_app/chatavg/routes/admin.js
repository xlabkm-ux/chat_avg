/**
 * Routes: Admin Panel
 * /api/admin/users, /api/admin/categories, /api/admin/stats
 */
const { Router } = require('express');
const os = require('os');
const { authenticate, requireAdmin } = require('../lib/auth');
const { asyncHandler } = require('../lib/errors');
const { assertSafeIdentifier, mergeFields } = require('../lib/utils');
const userRepository = require('../storage/userRepository');
const categoryRepository = require('../storage/categoryRepository');
const sessionRepository = require('../storage/sessionRepository');
const { getProvider } = require('../providers');

const router = Router();

// All admin routes require auth + admin
router.use(authenticate, requireAdmin);

// ── Users ───────────────────────────────────────────────

const USER_FIELDS = ['category', 'expiration_date', 'n_ctx', 'system_prompt'];

router.get('/users', asyncHandler(async (req, res) => {
  const users = await userRepository.listAll();
  const safe = {};
  for (const [k, v] of Object.entries(users)) {
    safe[k] = { ...v, password_hash: undefined };
  }
  res.json(safe);
}));

const { z } = require('zod');

const adminUserSchema = z.object({
  password: z.string().min(8).max(128).optional(),
  email: z.string().email().max(254).optional().or(z.literal('')),
  category: z.string().max(64).optional(),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  n_ctx: z.number().int().positive().optional(),
  system_prompt: z.string().max(4000).optional(),
}).strict();

router.post('/users/:username', asyncHandler(async (req, res) => {
  let username;
  try {
    username = assertSafeIdentifier(req.params.username, 'username');
  } catch (err) {
    return res.status(400).json({ detail: err.message });
  }

  const parseResult = adminUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ detail: 'Некорректный формат данных пользователя', errors: parseResult.error.errors });
  }
  const data = parseResult.data;
  
  let user = await userRepository.findByUsername(username);

  if (!user) {
    if (!data.password) {
      return res.status(400).json({ detail: 'Пароль обязателен для нового пользователя' });
    }
    user = { password_hash: await userRepository.hashPassword(data.password) };
  } else if (data.password) {
    user.password_hash = await userRepository.hashPassword(data.password);
  }
  
  if (data.email !== undefined) user.email = data.email;
  if (data.category !== undefined) user.category = data.category;
  if (data.expiration_date !== undefined) user.expiration_date = data.expiration_date;
  if (data.n_ctx !== undefined) user.n_ctx = data.n_ctx;
  if (data.system_prompt !== undefined) user.system_prompt = data.system_prompt;

  await userRepository.save(username, user);
  res.json({ status: 'success' });
}));

router.delete('/users/:username', asyncHandler(async (req, res) => {
  let username;
  try {
    username = assertSafeIdentifier(req.params.username, 'username');
  } catch (err) {
    return res.status(400).json({ detail: err.message });
  }

  if (username === 'admin') {
    return res.status(400).json({ detail: 'Нельзя удалить основного администратора' });
  }

  await userRepository.delete(username);
  res.json({ status: 'success' });
}));

// ── Categories ──────────────────────────────────────────

const CATEGORY_FIELDS = [
  'provider', 'endpoint_url', 'model_name', 'api_key',
  'temperature', 'top_p', 'top_k', 'min_p', 'repeat_penalty',
  'max_tokens', 'system_prompt', 'extra_params',
];

router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await categoryRepository.listAll();
  const safeCats = {};
  for (const [k, v] of Object.entries(categories)) {
    safeCats[k] = { ...v };
    if (safeCats[k].api_key) {
      safeCats[k].api_key = '********';
    }
  }
  res.json(safeCats);
}));

const categorySchema = z.object({
  provider: z.string().max(64).optional(),
  endpoint_url: z.string().url().or(z.literal('')).optional(),
  model_name: z.string().max(128).optional(),
  api_key: z.string().max(256).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  top_k: z.number().int().min(0).max(100).optional(),
  min_p: z.number().min(0).max(1).optional(),
  repeat_penalty: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  system_prompt: z.string().max(4000).optional(),
  extra_params: z.record(z.any()).optional().nullable(),
}).strict();

router.post('/categories/:category_name', asyncHandler(async (req, res) => {
  let catName;
  try {
    // Allows spaces and cyrillic for category names, unlike usernames
    catName = req.params.category_name;
    if (!catName || catName.length < 2 || catName.length > 64 || catName.includes('..') || catName.includes('/')) {
      return res.status(400).json({ detail: 'Invalid category_name' });
    }
  } catch (err) {
    return res.status(400).json({ detail: err.message });
  }
  
  const parseResult = categorySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ detail: 'Некорректный формат данных категории', errors: parseResult.error.errors });
  }

  let category = await categoryRepository.findByName(catName) || {};
  
  if (parseResult.data.api_key === '********') {
    delete parseResult.data.api_key;
  }
  
  mergeFields(category, parseResult.data, CATEGORY_FIELDS);

  await categoryRepository.save(catName, category);
  res.json({ status: 'success' });
}));

router.post('/categories/:category_name/test', asyncHandler(async (req, res) => {
  let catName;
  try {
    catName = req.params.category_name;
    if (!catName || catName.includes('..') || catName.includes('/')) {
      return res.status(400).json({ detail: 'Invalid category_name' });
    }
  } catch (err) {
    return res.status(400).json({ detail: err.message });
  }

  const savedCat = await categoryRepository.findByName(catName) || {};
  const data = req.body || {};

  const providerId = data.provider || savedCat.provider || 'llamacpp';
  const endpointUrl = (data.endpoint_url || savedCat.endpoint_url || 'http://127.0.0.1:8081/v1').replace(/\/$/, '');
  
  if (process.env.ALLOW_CUSTOM_PROVIDER_URLS !== 'true') {
    try {
      const urlObj = new URL(endpointUrl);
      const host = urlObj.hostname;
      const allowList = ['127.0.0.1', 'localhost', 'api.openai.com', 'api.anthropic.com', 'generativelanguage.googleapis.com', 'api.deepseek.com', 'api.x.ai', 'api.qwen.ai'];
      if (!allowList.includes(host)) {
        return res.status(403).json({ error: 'SSRF Protection: Host not in allowlist. Set ALLOW_CUSTOM_PROVIDER_URLS=true to disable.' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
  }

  const apiKey = data.api_key || savedCat.api_key || '';

  const provider = getProvider(providerId);
  if (!provider) return res.status(500).json({ error: 'Провайдер не найден' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  const headers = {};
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  try {
    const r = await fetch(`${endpointUrl}/models`, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (r.ok) {
      res.json({ status: 'success', message: 'Соединение установлено успешно' });
    } else {
      const errText = await r.text();
      res.status(r.status).json({ error: `Ошибка сервера (${r.status}): ${errText.slice(0, 100)}` });
    }
  } catch (e) {
    clearTimeout(timeout);
    res.status(502).json({ error: `Ошибка подключения: ${e.message}` });
  }
}));

// ── Stats ───────────────────────────────────────────────

router.get('/stats', asyncHandler(async (req, res) => {
  console.log(`[Admin] Stats requested by ${req.user.username}`);

  const totalUsers = await userRepository.countTotal();
  const expiredUsers = await userRepository.countExpired();
  const totalSessions = await sessionRepository.countTotal();
  const totalCategories = await categoryRepository.countTotal();

  res.json({
    users: {
      total: totalUsers,
      active_today: 0,
      expired: expiredUsers,
    },
    sessions: {
      total: totalSessions,
    },
    system: {
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      os_load: os.loadavg(),
      os_free_mem: os.freemem(),
      os_total_mem: os.totalmem(),
      platform: os.platform(),
      node_version: process.version,
    },
    categories: totalCategories,
  });
}));

module.exports = router;
