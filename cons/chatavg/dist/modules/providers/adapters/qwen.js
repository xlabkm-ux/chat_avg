"use strict";
/**
 * Provider: Qwen (Alibaba Cloud / DashScope)
 * Models: qwen-plus, qwen-turbo, qwen-max, qwen-long
 * Endpoint: https://dashscope.aliyuncs.com/compatible-mode/v1
 */
const { createProvider } = require('./openai_compat');
module.exports = createProvider({
    id: 'qwen',
    name: 'Qwen',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: [
        'qwen-plus',
        'qwen-turbo',
        'qwen-max',
        'qwen-long',
    ],
});
//# sourceMappingURL=qwen.js.map