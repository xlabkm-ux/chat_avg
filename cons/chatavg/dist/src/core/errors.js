"use strict";
/**
 * Centralized Error Handling
 */
const crypto = require('crypto');
class AppError extends Error {
    constructor(message, status = 500, code = 'server_error', details = null) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
class AuthError extends AppError {
    constructor(message = 'Аутентификация не удалась', details = null) {
        super(message, 401, 'auth_error', details);
    }
}
class ValidationError extends AppError {
    constructor(message = 'Ошибка валидации данных', details = null) {
        super(message, 400, 'validation_error', details);
    }
}
class NotFoundError extends AppError {
    constructor(message = 'Ресурс не найден') {
        super(message, 404, 'not_found');
    }
}
/**
 * Wrap an async Express handler so thrown errors are forwarded to `next()`.
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * Global Express error handler.
 */
function errorHandler(err, req, res, _next) {
    // Handle client disconnects (ECONNRESET)
    if (err.code === 'ECONNRESET' || err.code === 'ERR_STREAM_PREMATURE_CLOSE' || err.message.includes('Premature close')) {
        console.warn(`[Client Disconnect] ${req.method} ${req.path}`);
        return;
    }
    const isDev = process.env.NODE_ENV === 'development';
    const status = err.status || 500;
    const code = err.code || 'server_error';
    const message = err.message || 'Внутренняя ошибка сервера';
    if (status === 500) {
        console.error(`[CRITICAL] ${req.method} ${req.path}:`, err);
    }
    else {
        console.warn(`[Warning] ${req.method} ${req.path}: ${message}`);
    }
    if (res.headersSent)
        return;
    res.status(status).json({
        error: {
            code,
            message,
            details: err.details || null,
            traceId: req.headers['x-trace-id'] || crypto.randomUUID(),
            runId: err.runId || req.runId || undefined,
            stack: isDev ? err.stack : undefined
        }
    });
}
module.exports = {
    AppError,
    AuthError,
    ValidationError,
    NotFoundError,
    asyncHandler,
    errorHandler
};
//# sourceMappingURL=errors.js.map