/**
 * Chat AVG Gateway — Entry Point
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { PORT, WEBUI_DIR, allowedOrigins, isDev } = require('./config');
const { errorHandler } = require('./lib/errors');

// ── Bootstrap ───────────────────────────────────────────
require('./lib/sqlite'); // Ensures DB and schema exist

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

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isDev) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  }
}));

app.use(express.json({ limit: '5mb' }));

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
