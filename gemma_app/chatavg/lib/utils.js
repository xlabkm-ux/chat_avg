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

function validateProviderUrl(endpointUrl) {
  if (process.env.ALLOW_CUSTOM_PROVIDER_URLS === 'true') return;
  
  try {
    const urlObj = new URL(endpointUrl);
    const host = urlObj.hostname;
    const allowList = ['127.0.0.1', 'localhost', 'api.openai.com', 'api.anthropic.com', 'generativelanguage.googleapis.com', 'api.deepseek.com', 'api.x.ai', 'api.qwen.ai'];
    if (!allowList.includes(host)) {
      const err = new Error('SSRF Protection: Host not in allowlist. Set ALLOW_CUSTOM_PROVIDER_URLS=true to disable.');
      err.status = 403;
      err.code = 'ssrf_blocked';
      throw err;
    }
  } catch (e) {
    if (e.code === 'ssrf_blocked') throw e;
    const err = new Error('Invalid URL format');
    err.status = 400;
    throw err;
  }
}

module.exports = {
  assertSafeIdentifier,
  mergeFields,
  validateProviderUrl,
};
