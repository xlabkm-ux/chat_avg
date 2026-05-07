/**
 * Routes: Admin Panel
 * /api/admin/users, /api/admin/categories, /api/admin/stats
 */
const { Router } = require('express');
const os = require('os');
const { authenticate, requireAdmin } = require('../auth/auth.middleware');
const { asyncHandler } = require('../../core/errors');
const { assertSafeIdentifier, mergeFields, validateProviderUrl } = require('../../core/utils');
const userRepository = require('../auth/user.repository');
const categoryRepository = require('./category.repository');
const sessionRepository = require('../chat/session.repository');
const { getProvider } = require('../providers/provider.factory');
const AuditService = require('../audit/audit.service');
const crypto = require('../../core/crypto');
const { TEST_TIMEOUT } = require('../../core/config');

const router = Router();

// All admin routes require auth + admin
router.use(authenticate, requireAdmin);

// ── Users ───────────────────────────────────────────────

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
  password: z.string().min(8).max(128).optional().nullable().or(z.literal('')),
  email: z.string().max(254).optional().nullable().or(z.literal('')),
  category: z.string().max(64).optional().nullable().or(z.literal('')),
  expiration_date: z.string().optional().nullable().or(z.literal('')),
  n_ctx: z.any().optional().nullable(),
  system_prompt: z.string().max(4000).optional().nullable().or(z.literal('')),
});

router.post('/users/:username', asyncHandler(async (req, res) => {
  let username;
  try {
    username = assertSafeIdentifier(req.params.username, 'username');
  } catch (err) {
    return res.status(400).json({ detail: err.message });
  }

  const parseResult = adminUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.error('[Admin] User validation failed:', JSON.stringify(parseResult.error.format(), null, 2));
    return res.status(400).json({ detail: 'Некорректный формат данных пользователя', errors: parseResult.error.errors });
  }
  const data = parseResult.data;
  
  let user = await userRepository.findByUsername(username);

  const isNew = !user;
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
  
  AuditService.log(
    req.user.username,
    isNew ? 'USER_CREATE' : 'USER_UPDATE',
    { target_user: username },
    req.ip || req.connection.remoteAddress
  );

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
  
  AuditService.log(
    req.user.username,
    'USER_DELETE',
    { target_user: username },
    req.ip || req.connection.remoteAddress
  );

  res.json({ status: 'success' });
}));

// ── Categories ──────────────────────────────────────────

const CATEGORY_FIELDS = [
  'provider', 'model_name',
  'temperature', 'top_p', 'top_k', 'min_p', 'repeat_penalty',
  'max_tokens', 'system_prompt', 'routing_mode', 'fallback_provider', 'mcp_gateway'
];

router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await categoryRepository.listAll();
  const safeCats = {};
  for (const [k, v] of Object.entries(categories)) {
    safeCats[k] = { ...v };
    if (safeCats[k].api_key) {
      safeCats[k].api_key = crypto.maskKey(safeCats[k].api_key);
    }
  }
  res.json(safeCats);
}));

const categorySchema = z.object({
  provider: z.string().max(64).optional().nullable(),
  model_name: z.string().max(128).optional().nullable(),
  temperature: z.number().min(0).max(2).optional().nullable(),
  top_p: z.number().min(0).max(1).optional().nullable(),
  top_k: z.number().int().min(0).max(100).optional().nullable(),
  min_p: z.number().min(0).max(1).optional().nullable(),
  repeat_penalty: z.number().min(0).max(2).optional().nullable(),
  max_tokens: z.number().int().positive().optional().nullable(),
  system_prompt: z.string().max(4000).optional().nullable(),
  routing_mode: z.string().max(32).optional().nullable(),
  fallback_provider: z.string().max(64).optional().nullable(),
  mcp_gateway: z.string().max(256).optional().nullable(),
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
    console.error('[Admin] Category validation failed:', parseResult.error.format());
    return res.status(400).json({ detail: 'Некорректный формат данных категории', errors: parseResult.error.errors });
  }

  let category = await categoryRepository.findByName(catName) || {};
  
  mergeFields(category, parseResult.data, CATEGORY_FIELDS);

  await categoryRepository.save(catName, category);
  
  AuditService.log(
    req.user.username,
    'CATEGORY_UPDATE',
    { target_category: catName },
    req.ip || req.connection.remoteAddress
  );

  res.json({ status: 'success' });
}));

router.delete('/categories/:category_name', asyncHandler(async (req, res) => {
  let catName;
  try {
    catName = req.params.category_name;
    if (!catName || catName.includes('..') || catName.includes('/')) {
      return res.status(400).json({ detail: 'Invalid category_name' });
    }
  } catch (err) {
    return res.status(400).json({ detail: err.message });
  }

  const existingCat = await categoryRepository.findByName(catName);
  if (!existingCat) {
    return res.status(404).json({ detail: 'Категория не найдена' });
  }

  // Optional: check if users are linked to this category
  const users = await userRepository.listAll();
  for (const u of Object.values(users)) {
    if (u.category === catName) {
      return res.status(400).json({ detail: 'Нельзя удалить категорию, к которой привязаны пользователи' });
    }
  }

  await categoryRepository.delete(catName);
  
  AuditService.log(
    req.user.username,
    'CATEGORY_DELETE',
    { target_category: catName },
    req.ip || req.connection.remoteAddress
  );

  res.json({ status: 'success' });
}));

const providersConfig = require('../../core/providers.config');

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
  const providerCfg = providersConfig[providerId] || {};
  
  let endpointUrl = (providerCfg.endpoint_url || 'http://127.0.0.1:8201').replace(/\/$/, '');
  const mcpGateway = data.mcp_gateway || savedCat.mcp_gateway;
  let isMcpGatewayUsed = false;
  
  if (mcpGateway && mcpGateway.trim().length > 0) {
    endpointUrl = mcpGateway.trim().replace(/\/$/, '');
    isMcpGatewayUsed = true;
  }
  
  const isLocalProvider = isMcpGatewayUsed || ['llamacpp', 'ollama', 'mcp'].includes(providerCfg.adapter || providerId);
  try {
    validateProviderUrl(endpointUrl, isLocalProvider);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const apiKey = providerCfg.api_key || '';

  const provider = getProvider(providerId);
  if (!provider) return res.status(500).json({ error: 'Провайдер не найден' });

  // Use provider-specific health check if available or if testing through MCP Gateway
  if (isMcpGatewayUsed || provider.checkHealth) {
    try {
      const healthChecker = isMcpGatewayUsed ? getProvider('mcp') : provider;
      const ok = await healthChecker.checkHealth({ endpoint_url: endpointUrl, api_key: apiKey });
      if (ok) {
        return res.json({ status: 'success', message: 'Соединение установлено успешно' });
      } else {
        return res.status(502).json({ error: 'Не удалось установить соединение через MCP Gateway' });
      }
    } catch (e) {
      return res.status(502).json({ error: `Ошибка тестирования шлюза: ${e.message}` });
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TEST_TIMEOUT);

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

// ── Audit ───────────────────────────────────────────────

router.get('/audit', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = parseInt(req.query.offset, 10) || 0;
  const username = req.query.username || null;
  const action = req.query.action || null;

  const logs = AuditService.getLogs({ limit, offset, username, action });
  res.json(logs);
}));

// ── MVP Dashboard ───────────────────────────────────────

router.get('/dashboard/mvp', asyncHandler(async (req, res) => {
  const db = require('../../core/sqlite');
  const traceBus = require('../observability/trace.bus');
  
  const runStatusRows = db.prepare('SELECT state, count(*) as count FROM agent_runs GROUP BY state').all();
  const runStatus = {};
  for (const row of runStatusRows) {
    runStatus[row.state] = row.count;
  }

  const semanticEvents = db.prepare('SELECT count(*) as count FROM audit_logs WHERE action = @action').get({ action: 'semantic' }).count;
  const approvalEvents = db.prepare('SELECT count(*) as count FROM approval_requests').get().count;
  
  // Approximate cost from cost audit logs
  let totalCostUsd = 0;
  try {
    const costRow = db.prepare('SELECT SUM(json_extract(details, "$.costUsd")) as total FROM audit_logs WHERE action = @action').get({ action: 'cost' });
    totalCostUsd = costRow.total || 0;
  } catch (e) {
    // ignore if json_extract is missing or error
  }

  // Feature flags
  const { FEATURE_FLAGS } = require('../../core/config');

  // Traces
  const traces = traceBus.getRecentTraces(100);

  res.json({
    run_status: runStatus,
    semantic_events: semanticEvents,
    approval_events: approvalEvents,
    total_cost_usd: totalCostUsd,
    feature_flags: FEATURE_FLAGS,
    latency_p95: 0.69, // from baseline metrics
    sandbox_warm_count: 0, // Placeholder for sprint 16
    sandbox_cold_count: 0, // Placeholder for sprint 16
    rag_quality_score: 1.0, // Placeholder
    semantic_quality_score: 0.845, // Placeholder from MVP
    recent_traces: traces
  });
}));

module.exports = router;
