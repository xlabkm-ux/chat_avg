/**
 * MCP Gateway — Request Logger Middleware
 * Logs incoming HTTP requests and their durations.
 */
import logger from '../logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    logger.debug(`${method} ${url} ${statusCode} - ${duration}ms`);
  });

  next();
}
