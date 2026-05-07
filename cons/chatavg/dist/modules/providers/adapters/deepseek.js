"use strict";
/**
 * Provider: DeepSeek
 * Models: deepseek-chat, deepseek-coder, deepseek-reasoner
 * Endpoint: https://api.deepseek.com
 */
const { createProvider } = require('./openai_compat');
module.exports = createProvider({
    id: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    models: [
        'deepseek-chat',
        'deepseek-coder',
        'deepseek-reasoner',
    ],
});
//# sourceMappingURL=deepseek.js.map