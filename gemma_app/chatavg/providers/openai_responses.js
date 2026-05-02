/**
 * Provider: OpenAI Responses API
 * Uses openai.responses.create() — supports tools, reasoning, file_search, web_search
 * Models: gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, o4-mini, gpt-4o
 * Endpoint: https://api.openai.com/v1
 */
const { createResponsesProvider } = require('./openai_responses_compat');

module.exports = createResponsesProvider({
  id: 'openai_responses',
  name: 'OpenAI Responses',
  defaultBaseUrl: 'https://api.openai.com/v1',
  defaultModel: 'gpt-4.1',
  models: [
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'o4-mini',
    'gpt-4o',
    'gpt-4o-mini',
  ],
});
