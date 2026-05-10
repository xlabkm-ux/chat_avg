/**
 * Provider: Grok Responses API (xAI)
 * Uses openai.responses.create() via OpenAI SDK compatibility
 * Supports: file_search, tools
 * Models: grok-3, grok-3-mini
 * Endpoint: https://api.x.ai/v1
 */
const { createResponsesProvider } = require('./openai_responses_compat');

module.exports = createResponsesProvider({
  id: 'grok_responses',
  name: 'Grok Responses (xAI)',
  defaultBaseUrl: 'https://api.x.ai/v1',
  defaultModel: 'grok-3',
  models: [
    'grok-3',
    'grok-3-mini',
  ],
});
