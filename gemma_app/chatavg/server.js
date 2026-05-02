/**
 * Chat AVG Gateway — Entry Point
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { PORT, WEBUI_DIR, allowedOrigins, isDev } = require('./src/core/config');
const { errorHandler } = require('./src/core/errors');

// ── Bootstrap ───────────────────────────────────────────
require('./src/core/sqlite'); // Ensures DB and schema exist

const app = express();

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      workerSrc: ["'self'", "blob:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  }
}));

app.use(cors({
  origin: function (origin, callback) {
    // Same-origin (no origin header) is allowed
    if (!origin) return callback(null, true);
    
    const originStr = String(origin);
    const isAllowed = allowedOrigins.some(o => originStr === o || originStr.startsWith(o));

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[Security] CORS Blocked origin: ${origin}`);
      callback(new Error('CORS policy violation'));
    }
  }
}));

app.use(express.json({ limit: '2mb' }));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      error: { code: 'rate_limit', message: options.message }
    });
  },
  message: 'Слишком много попыток входа, попробуйте позже'
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      error: { code: 'rate_limit', message: options.message }
    });
  },
  message: 'Превышен лимит запросов'
});

// ── API Routes ──────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./src/modules/auth/auth.routes'));
app.use('/api/users',      require('./src/modules/auth/users.routes'));
app.use('/api/admin',      require('./src/modules/admin/admin.routes'));
app.use('/api/sessions',   require('./src/modules/chat/sessions.routes'));
app.use('/api/chat', chatLimiter, require('./src/modules/chat/chat.routes'));
app.use('/api/providers',  require('./src/modules/providers/providers.routes'));

// 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'API route not found' } });
});

// ── Static Files (serve Web UI) ─────────────────────────
app.use(express.static(WEBUI_DIR));

app.get('*', (req, res) => {
  res.sendFile('index.html', { root: WEBUI_DIR });
});

// ── Global Error Handler ────────────────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────
let server;
if (require.main === module) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Starting Chat AVG Gateway on http://127.0.0.1:${PORT}`);
  });
}

module.exports = { app, server };

// ── Graceful Shutdown ───────────────────────────────────
function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  
  if (server && server.closeAllConnections) {
    server.closeAllConnections();
  }

  if (server) {
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
  
  setTimeout(() => {
    console.error('Forcefully shutting down');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

if (process.platform === 'win32') {
  require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  }).on('SIGINT', () => {
    process.emit('SIGINT');
  });
}
