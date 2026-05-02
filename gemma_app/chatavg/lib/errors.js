/**
 * Centralized Error Handling
 * Wraps async route handlers to avoid repetitive try/catch.
 */

/**
 * Wrap an async Express handler so thrown errors are forwarded to `next()`.
 * Usage: `router.get('/path', asyncHandler(async (req, res) => { ... }));`
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global Express error handler (mount as last middleware).
 */
function errorHandler(err, req, res, _next) {
  // Игнорируем ошибки при обрыве соединения клиентом (особенно во время стриминга)
  if (err.code === 'ECONNRESET' || err.code === 'ERR_STREAM_PREMATURE_CLOSE' || err.message.includes('Premature close')) {
    console.warn(`[Client Disconnect] Соединение прервано: ${req.method} ${req.path}`);
    return;
  }

  console.error(`[Error] ${req.method} ${req.path}:`, err.message);
  if (res.headersSent) return;

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Внутренняя ошибка сервера',
    code: err.code || 'server_error',
  });
}

module.exports = { asyncHandler, errorHandler };
