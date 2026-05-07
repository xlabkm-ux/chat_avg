"use strict";
/**
 * Provider Registry
 * Loads all available LLM providers and provides lookup by ID.
 */
const providersConfig = require('../../core/providers.config');
const adapters = {};
// Register all built-in adapters
const builtins = [
    require('./adapters/llamacpp'),
    require('./adapters/openai'),
    require('./adapters/openai_responses'),
    require('./adapters/deepseek'),
    require('./adapters/google'),
    require('./adapters/qwen'),
    require('./adapters/grok'),
    require('./adapters/grok_responses'),
    require('./adapters/mcp'),
];
for (const p of builtins) {
    adapters[p.id] = p;
}
// Register testing mocks
if (process.env.NODE_ENV === 'test') {
    try {
        const { DeterministicProvider } = require('../../../tests/mocks/deterministic_provider');
        const mock = new DeterministicProvider();
        mock.id = 'deterministic'; // Ensure ID matches
        adapters['deterministic'] = mock;
    }
    catch (err) {
        console.warn('[ProviderFactory] Could not load DeterministicProvider for tests:', err.message);
    }
}
/**
 * Get provider adapter by provider ID from config
 * @param {string} configProviderId - Provider ID from providers.config.js
 * @returns {Object|null} Provider adapter or null
 */
function getProvider(configProviderId) {
    const cfg = providersConfig[configProviderId];
    if (!cfg)
        return null;
    return adapters[cfg.adapter] || null;
}
/**
 * List all configured providers (for admin UI)
 * @returns {Array} [{id, name, models: [modelId1, modelId2, ...]}]
 */
function listProviders() {
    return Object.entries(providersConfig).map(([id, cfg]) => ({
        id,
        name: cfg.name || id,
        models: Object.keys(cfg.models || {}),
    }));
}
module.exports = { getProvider, listProviders, adapters };
//# sourceMappingURL=provider.factory.js.map