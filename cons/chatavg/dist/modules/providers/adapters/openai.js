"use strict";
/**
 * Provider: OpenAI
 * Models: gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, o4-mini, gpt-4o, gpt-4o-mini
 * Endpoint: https://api.openai.com/v1
 */
const { createProvider } = require('./openai_compat');
module.exports = createProvider({
    id: 'openai',
    name: 'OpenAI',
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
//# sourceMappingURL=openai.js.map