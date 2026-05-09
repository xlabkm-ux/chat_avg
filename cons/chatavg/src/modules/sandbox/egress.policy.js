/**
 * EgressPolicy — default-deny outbound traffic control for sandboxes.
 * SPEC-019 §4 Egress Policy
 *
 * Tiers (evaluated in order):
 *   1. provider_endpoints  — LiteLLM/model gateway whitelist (config-level)
 *   2. tenant_allowlist    — per-tenant domain/IP list
 *   3. signed_urls         — HMAC-signed short-lived URLs (TTL ≤ 5min)
 *   4. deny_all            — everything else (default)
 */

const crypto = require('crypto');

/** Built-in provider endpoint patterns (always permitted) */
const PROVIDER_ENDPOINT_PATTERNS = [
  /^https:\/\/api\.openai\.com\//,
  /^https:\/\/api\.anthropic\.com\//,
  /^https:\/\/generativelanguage\.googleapis\.com\//,
  /^https:\/\/api\.x\.ai\//,
  /^https:\/\/dashscope\.aliyuncs\.com\//,
  /^https:\/\/api\.deepseek\.com\//,
];

// Local endpoints are only permitted in development/test
if (process.env.NODE_ENV !== 'production') {
  PROVIDER_ENDPOINT_PATTERNS.push(/^http:\/\/127\.0\.0\.1:/);
  PROVIDER_ENDPOINT_PATTERNS.push(/^http:\/\/localhost:/);
}

class EgressPolicy {
  /**
   * @param {Object} options
   * @param {string[]} [options.tenantAllowlist]  - Domains/IP prefixes allowed for this tenant
   * @param {string}   [options.signingSecret]    - HMAC secret for signed URL validation
   */
  constructor(options = {}) {
    this.tenantAllowlist = (options.tenantAllowlist || []).map(h => h.toLowerCase());
    this.signingSecret = options.signingSecret || null;
  }

  /**
   * Evaluate an outbound URL against the egress policy.
   * @param {string} url
   * @returns {{ allowed: boolean, tier: string, reason: string }}
   */
  evaluate(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return { allowed: false, tier: 'deny_all', reason: 'INVALID_URL' };
    }

    // 1. Provider endpoints
    if (PROVIDER_ENDPOINT_PATTERNS.some(p => p.test(url))) {
      return { allowed: true, tier: 'provider_endpoints', reason: 'PROVIDER_ENDPOINT' };
    }

    // 2. Tenant allowlist (exact host or suffix match)
    const host = parsed.hostname.toLowerCase();
    const matchedTenant = this.tenantAllowlist.find(
      allowed => host === allowed || host.endsWith(`.${allowed}`)
    );
    if (matchedTenant) {
      return { allowed: true, tier: 'tenant_allowlist', reason: `TENANT_ALLOWLIST:${matchedTenant}` };
    }

    // 3. Signed URLs (query param ?sig=<hmac>&exp=<unix_ts>)
    if (this.signingSecret) {
      const sigResult = this._validateSignedUrl(parsed);
      if (sigResult.valid) {
        return { allowed: true, tier: 'signed_urls', reason: 'SIGNED_URL' };
      }
    }

    // 4. Default deny
    return { allowed: false, tier: 'deny_all', reason: `EGRESS_DENIED:${host}` };
  }

  /**
   * Generate a signed URL with a short TTL.
   * @param {string} url
   * @param {number} [ttlMs=300000]  - Default 5 minutes
   * @returns {string}
   */
  sign(url, ttlMs = 300_000) {
    if (!this.signingSecret) throw new Error('No signing secret configured');
    const exp = Math.floor((Date.now() + ttlMs) / 1000);
    const payload = `${url}|${exp}`;
    const sig = crypto.createHmac('sha256', this.signingSecret).update(payload).digest('hex');
    const signed = new URL(url);
    signed.searchParams.set('sig', sig);
    signed.searchParams.set('exp', String(exp));
    return signed.toString();
  }

  /** @private */
  _validateSignedUrl(parsed) {
    const sig = parsed.searchParams.get('sig');
    const exp = parseInt(parsed.searchParams.get('exp') || '0', 10);
    if (!sig || !exp) return { valid: false, reason: 'MISSING_SIG_PARAMS' };
    if (exp < Math.floor(Date.now() / 1000)) return { valid: false, reason: 'EXPIRED' };

    // Reconstruct the canonical URL without sig/exp for verification
    const canonical = new URL(parsed.toString());
    canonical.searchParams.delete('sig');
    canonical.searchParams.delete('exp');
    const payload = `${canonical.toString()}|${exp}`;
    const expected = crypto.createHmac('sha256', this.signingSecret).update(payload).digest('hex');
    const valid = crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
    return { valid, reason: valid ? 'OK' : 'SIG_MISMATCH' };
  }
}

module.exports = { EgressPolicy, PROVIDER_ENDPOINT_PATTERNS };
