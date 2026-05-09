class RedactionService {
  /**
   * Redacts sensitive information from a string or object payload.
   * Enhanced implementation: regex to hide common secrets (Bearer tokens, api keys, passwords, etc.).
   * @param {any} payload 
   * @returns {any} redacted payload
   */
  static redact(payload) {
    if (payload === null || payload === undefined) return payload;

    // Regex for various secrets:
    // 1. Bearer tokens (JWT, etc)
    // 2. OpenAI keys (sk-...)
    // 3. Generic api/auth keys and passwords in key-value pairs
    // 4. Basic Auth headers
    const secretsRegex = [
      /(Bearer\s+)[A-Za-z0-9\-\._~\+\/]{10,}/gi,
      /(sk-[a-zA-Z0-9]{20,})/gi,
      /((api[_\-]?)?key[=:]\s*['"]?)[a-zA-Z0-9\-_]{16,}(['"]?)/gi,
      /(password[=:]\s*['"]?)[^'"\s]{4,}(['"]?)/gi,
      /(Authorization:\s*Basic\s+)[A-Za-z0-9\+/=]{5,}/gi
    ];

    if (typeof payload === 'string') {
      let result = payload;
      for (const regex of secretsRegex) {
        result = result.replace(regex, (match, group1) => {
          return group1 ? group1 + '[REDACTED]' : '[REDACTED_SECRET]';
        });
      }
      return result;
    }

    if (typeof payload === 'object') {
      const redacted = Array.isArray(payload) ? [] : {};
      for (const key in payload) {
        if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
        
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('password') || 
          lowerKey.includes('secret') || 
          lowerKey.includes('token') || 
          lowerKey.includes('key') ||
          lowerKey.includes('auth') ||
          lowerKey === 'api_key' ||
          lowerKey === 'apikey'
        ) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = this.redact(payload[key]);
        }
      }
      return redacted;
    }

    return payload;
  }
}

module.exports = { RedactionService };
