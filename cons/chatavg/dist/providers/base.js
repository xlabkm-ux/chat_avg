"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = void 0;
class BaseProvider {
    id;
    name;
    models;
    defaultModel;
    capabilities;
    constructor(config) {
        if (!config.id || !config.name) {
            throw new Error('Provider must have an id and name');
        }
        this.id = config.id;
        this.name = config.name;
        this.models = config.models || [];
        this.defaultModel = config.defaultModel || '';
        this.capabilities = {
            stream: true,
            tools: false,
            ...config.capabilities
        };
    }
    async checkHealth(config) {
        return true;
    }
    buildChunk(model, text, finishReason = null, toolCalls = null) {
        const delta = {};
        if (finishReason) {
            // No delta content
        }
        else if (toolCalls) {
            delta.tool_calls = toolCalls;
        }
        else {
            delta.content = text;
        }
        return {
            id: `chatcmpl-${this.id}-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: model || this.defaultModel,
            choices: [{
                    index: 0,
                    delta,
                    finish_reason: finishReason,
                }],
        };
    }
    buildResponse(model, text, usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, toolCalls = null) {
        const message = { role: 'assistant', content: text };
        if (toolCalls)
            message.tool_calls = toolCalls;
        return {
            id: `chatcmpl-${this.id}-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: model || this.defaultModel,
            choices: [{
                    index: 0,
                    message,
                    finish_reason: toolCalls ? 'tool_calls' : 'stop',
                }],
            usage,
        };
    }
}
exports.BaseProvider = BaseProvider;
//# sourceMappingURL=base.js.map