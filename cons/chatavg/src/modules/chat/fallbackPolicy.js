const { ProviderError } = require('../providers/providerErrors');

class FallbackPolicy {
  /**
   * Determines if the given error allows for a fallback to another provider.
   * Only retryable errors (like network timeout, 502, connection refused) should trigger fallback.
   * 
   * @param {Error|Object} err - The error object or event
   * @returns {boolean} True if fallback is allowed
   */
  shouldFallback(err) {
    if (!err) return false;
    
    // Explicit retryable flag from our ProviderError
    if (err.isRetryable === true) return true;
    
    // Event-based error check
    if (err.type === 'error' && err.isRetryable === true) return true;

    // HTTP Status codes for retryable errors
    const status = err.status || err.statusCode;
    if (status) {
      if ([408, 429, 500, 502, 503, 504].includes(status)) return true;
      if (status < 500) return false; // Client errors like 400, 401, 403 should not be retried
    }
    
    // Specific error codes typically seen in network issues
    const code = err.code || err.cause?.code || '';
    if (['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'fetch failed'].includes(code)) {
      return true;
    }
    
    // Heuristic on message text
    const message = (err.message || '').toLowerCase();
    if (
      message.includes('timeout') || 
      message.includes('network error') || 
      message.includes('fetch failed') ||
      message.includes('connection refused')
    ) {
      return true;
    }

    return false;
  }
}

module.exports = new FallbackPolicy();
