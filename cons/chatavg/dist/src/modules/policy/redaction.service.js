"use strict";
class RedactionService {
    /**
     * Redacts sensitive information from a string or object payload.
     * Basic implementation: regex to hide common secrets (Bearer tokens, api keys, passwords).
     * @param {any} payload
     * @returns {any} redacted payload
     */
    static redact(payload) {
        if (!payload)
            return payload;
        const secretsRegex = /(Bearer\s+[A-Za-z0-9\-\._~\+\/]+)|((api[_\-]?)?key[=:]\s*['"]?[a-zA-Z0-9\-_]{16,}['"]?)|(password[=:]\s*['"]?[^'"\s]+['"]?)/gi;
        if (typeof payload === 'string') {
            return payload.replace(secretsRegex, '[REDACTED_SECRET]');
        }
        if (typeof payload === 'object') {
            const redacted = Array.isArray(payload) ? [] : {};
            for (const key in payload) {
                if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token') || key.toLowerCase().includes('key')) {
                    redacted[key] = '[REDACTED]';
                }
                else {
                    redacted[key] = this.redact(payload[key]);
                }
            }
            return redacted;
        }
        return payload;
    }
}
module.exports = { RedactionService };
//# sourceMappingURL=redaction.service.js.map