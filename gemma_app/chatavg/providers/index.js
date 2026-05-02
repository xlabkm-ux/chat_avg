/**
 * Provider Registry
 * Loads all available LLM providers and provides lookup by ID.
 */
const providers = {};

// Register all built-in providers
const builtins = [
  require('./llamacpp'),
  require('./openai'),
  require('./openai_responses'),
  require('./deepseek'),
  require('./google'),
  require('./qwen'),
  require('./grok'),
  require('./grok_responses'),
];

for (const p of builtins) {
  providers[p.id] = p;
}

/**
 * Get provider by ID
 * @param {string} id - Provider ID (e.g. 'openai', 'llamacpp')
 * @returns {Object|null} Provider adapter or null
 */
function getProvider(id) {
  return providers[id] || null;
}

/**
 * List all registered providers (for admin UI)
 * @returns {Array} [{id, name, models, defaultModel}]
 */
function listProviders() {
  return Object.values(providers).map(p => ({
    id: p.id,
    name: p.name,
    models: p.models || [],
    defaultModel: p.defaultModel || '',
  }));
}

module.exports = { getProvider, listProviders };
