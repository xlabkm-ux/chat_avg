/**
 * Provider: Grok (xAI)
 * Models: grok-3, grok-3-mini, grok-2
 * Endpoint: https://api.x.ai/v1
 */
const { createProvider } = require('./openai_compat');

module.exports = createProvider({
  id: 'grok',
  name: 'Grok (xAI)',
  defaultBaseUrl: 'https://api.x.ai/v1',
  defaultModel: 'grok-3',
  models: [
    'grok-3',
    'grok-3-mini',
    'grok-2',
  ],
});
