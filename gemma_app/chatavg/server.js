/**
 * Chat AVG Gateway — Entry Point
 * 
 * Multi-user LLM chat gateway with provider-agnostic architecture.
 * See config.js for settings, lib/ for core logic, routes/ for endpoints.
 */
const express = require('express');
const { PORT, WEBUI_DIR } = require('./config');
const { errorHandler } = require('./lib/errors');

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// ── Bootstrap ───────────────────────────────────────────
require('./lib/sqlite'); // Ensures DB and schema exist before anything else

const app = express();

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      workerSrc: ["'self'", "blob:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  }
}));

const allowedOrigins = process.env.CHATAVG_ALLOWED_ORIGINS 
  ? process.env.CHATAVG_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean) 
  : [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  }
}));

app.use(express.json({ limit: '5mb' }));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: { detail: 'Слишком много попыток входа, попробуйте позже' }
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 chat requests per windowMs
  message: { detail: 'Превышен лимит запросов' }
});

// ── API Routes ──────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/sessions',   require('./routes/sessions'));
app.use('/api/chat', chatLimiter, require('./routes/chat'));
app.use('/api/providers',  require('./routes/providers'));

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

function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  
  if (server.closeAllConnections) {
    server.closeAllConnections();
  }

  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Корректная обработка Ctrl+C в консоли Windows
if (process.platform === 'win32') {
  require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  }).on('SIGINT', () => {
    process.emit('SIGINT');
  });
}
