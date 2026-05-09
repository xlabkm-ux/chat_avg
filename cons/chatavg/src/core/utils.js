/**
 * Helper Utilities
 */

function assertSafeIdentifier(value, field) {
  if (!value || !/^[a-zA-Z0-9_-]{3,64}$/.test(value)) {
    const err = new Error(`${field} contains invalid characters or has invalid length`);
    err.status = 400;
    throw err;
  }
  return value;
}

/**
 * Merge only defined (not `undefined`) fields from `source` into `target`.
 * Avoids repetitive `if (x !== undefined) target.x = x;` blocks.
 */
function mergeFields(target, source, keys) {
  for (const key of keys) {
    if (source[key] !== undefined) {
      target[key] = source[key];
    }
  }
}

/**
 * Strict URL validation for SSRF Protection.
 * @param {string} endpointUrl - The URL to validate
 * @param {boolean} allowLocal - Whether to allow private IPs/localhost (for local providers)
 */
function validateProviderUrl(endpointUrl, allowLocal = false) {
  if (process.env.ALLOW_CUSTOM_PROVIDER_URLS === 'true') return;
  if (!endpointUrl) return;

  try {
    const urlObj = new URL(endpointUrl);
    const host = urlObj.hostname.toLowerCase();

    // 1. Check common public providers allowlist
    const publicAllowList = [
      'api.openai.com',
      'api.anthropic.com',
      'generativelanguage.googleapis.com',
      'api.deepseek.com',
      'api.x.ai',
      'api.qwen.ai',
      'api.groq.com',
      'api.mistral.ai'
    ];
    if (publicAllowList.includes(host)) return;

    // 2. Check for private/localhost if not explicitly allowed
    if (!allowLocal) {
      // Basic hostname checks
      const isLocalhost = host === 'localhost' || host === 'localhost.localdomain' || host.endsWith('.localhost');
      
      // IPv4 private ranges and loopback
      const isIPv4Private = 
        host === '127.0.0.1' || 
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);

      // IPv6 private ranges and loopback
      const isIPv6Private = 
        host === '::1' || 
        host === '[::1]' ||
        host.startsWith('fe80:') || 
        host.startsWith('fc00:') || 
        host.startsWith('fd00:') ||
        host.includes(':ffff:127.0.0.1') ||
        host.includes(':ffff:7f00:1');

      // Common DNS-based bypasses (nip.io, sslip.io, etc.)
      const isDnsBypass = 
        host.includes('.127.0.0.1.') || 
        host.includes('.10.0.0.') || 
        host.endsWith('.nip.io') || 
        host.endsWith('.sslip.io');

      if (isLocalhost || isIPv4Private || isIPv6Private || isDnsBypass) {
        const err = new Error(`SSRF Protection: Host ${host} is forbidden for external providers.`);
        err.status = 403;
        err.code = 'ssrf_blocked';
        throw err;
      }
    }
  } catch (e) {
    if (e.code === 'ssrf_blocked') throw e;
    const err = new Error('Invalid URL format or SSRF block');
    err.status = 400;
    throw err;
  }
}

function sanitizePromptText(text) {
  if (typeof text !== 'string') return '';
  
  const controlTokens = /<\|im_start\|>|<\|im_end\|>|<\|system\|>|<\|user\|>|<\|assistant\|>|<\|endoftext\|>|\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>>/gi;
  return text.replace(controlTokens, '').trim();
}

module.exports = {
  assertSafeIdentifier,
  mergeFields,
  validateProviderUrl,
  sanitizePromptText,
};
