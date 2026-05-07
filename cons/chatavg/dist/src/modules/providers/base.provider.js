"use strict";
/**
 * Base abstract class for LLM Providers
 * Formalizes the interface for all provider adapters.
 */
class BaseProvider {
    /**
     * @param {Object} config
     * @param {string} config.id - Provider unique ID
     * @param {string} config.name - Provider display name
     * @param {string[]} config.models - Supported models
     * @param {string} config.defaultModel - Default model to use
     * @param {Object} [config.capabilities] - Provider capabilities (stream, tools)
     */
    constructor(config) {
        if (!config.id || !config.name) {
            throw new Error('Provider must have an id and name');
        }
        this.id = config.id;
        this.name = config.name;
        this.models = config.models || [];
        this.defaultModel = config.defaultModel || '';
        this.capabilities = Object.assign({ stream: true, tools: false }, config.capabilities);
    }
    /**
     * Handle chat completion request. Must be implemented by subclasses.
     * Expected to return an AsyncIterable yielding CanonicalChatEvent:
     * - { type: 'delta', text: string }
     * - { type: 'done', finishReason: string, usage: object }
     * - { type: 'error', message: string, code: string }
     *
     * @param {Array} messages - Chat messages [{role, content}]
     * @param {Object} config  - Category config (api_key, endpoint_url, model_name, etc.)
     * @param {Object} options - Request options (stream, max_tokens)
     * @returns {AsyncIterable<Object>} Async generator yielding chat events
     */
    async *handleChat(messages, config, options) {
        throw new Error(`handleChat() not implemented for provider: ${this.id}`);
    }
    /**
     * Utility to build a standard OpenAI-compatible SSE chunk.
     */
    buildChunk(model, text, finishReason = null, toolCalls = null) {
        const delta = {};
        if (finishReason) {
            // No delta content/tools on final chunk
        }
        else if (toolCalls) {
            delta.tool_calls = toolCalls;
        }
        else {
            delta.content = text;
        }
        return {
            id: 'chatcmpl-' + this.id + '-' + Date.now(),
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
    /**
     * Utility to build a standard Chat Completion response object.
     */
    buildResponse(model, text, usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, toolCalls = null) {
        const message = { role: 'assistant', content: text };
        if (toolCalls)
            message.tool_calls = toolCalls;
        return {
            id: 'chatcmpl-' + this.id + '-' + Date.now(),
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
    /**
     * Check provider health/availability.
     * Default implementation tries to list models or similar ping.
     * @param {Object} config - Category config
     * @returns {Promise<boolean>}
     */
    async checkHealth(config) {
        return true; // Default to true if not specifically implemented
    }
    /**
     * Get dynamic list of models available from the provider.
     * Default implementation returns statically configured models.
     * @param {Object} config - Category config
     * @returns {Promise<string[]>}
     */
    async getModels(config) {
        return this.models;
    }
}
module.exports = BaseProvider;
//# sourceMappingURL=base.provider.js.map