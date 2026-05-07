"use strict";
/**
 * OpenAI-Compatible Provider Factory
 * Shared logic for all providers that use the OpenAI API format:
 * OpenAI, DeepSeek, Qwen, Grok (xAI)
 */
const OpenAI = require('openai');
const BaseProvider = require('../base.provider');
class OpenAICompatProvider extends BaseProvider {
    constructor(config) {
        super({
            ...config,
            capabilities: Object.assign({ stream: true, tools: true }, config.capabilities)
        });
        this.defaultBaseUrl = config.defaultBaseUrl;
    }
    /**
     * Handle chat completion request
     * @param {Array} messages - Chat messages [{role, content}]
     * @param {Object} config  - Category config (api_key, model_name, temperature, etc.)
     * @param {Object} options - Request options (stream, max_tokens)
     * @returns {Object} ProviderResult
     */
    async *handleChat(messages, config, options) {
        const ProviderEvents = require('./../providerEvents');
        const client = new OpenAI({
            apiKey: config.api_key,
            baseURL: config.endpoint_url || this.defaultBaseUrl,
        });
        // Build request params (only standard OpenAI-compatible fields)
        const params = {
            model: config.model_name || this.defaultModel,
            messages,
            stream: !!options.stream,
        };
        // Generation parameters
        if (options.max_tokens)
            params.max_tokens = options.max_tokens;
        if (config.temperature !== undefined)
            params.temperature = config.temperature;
        if (config.top_p !== undefined)
            params.top_p = config.top_p;
        // Merge extra_params (tools, reasoning, response_format, etc.)
        if (config.extra_params && typeof config.extra_params === 'object') {
            Object.assign(params, config.extra_params);
        }
        // Log the full request parameters for debugging and sandbox testing
        const isProd = process.env.NODE_ENV === 'production';
        const debugPayloads = process.env.DEBUG_PROVIDER_PAYLOADS === 'true';
        if (!isProd || debugPayloads) {
            console.log(`\n[${this.id}] --- OUTGOING REQUEST PAYLOAD ---`);
            console.log(JSON.stringify(params, null, 2));
            console.log(`--------------------------------------\n`);
        }
        try {
            if (params.stream) {
                const stream = await client.chat.completions.create(params);
                for await (const chunk of stream) {
                    const choice = chunk.choices[0];
                    if (!choice)
                        continue;
                    // 1. Content delta
                    const content = choice.delta?.content;
                    if (content) {
                        yield ProviderEvents.delta(content);
                    }
                    // 2. Tool calls delta
                    const toolCalls = choice.delta?.tool_calls;
                    if (toolCalls) {
                        yield ProviderEvents.toolCall(toolCalls);
                    }
                    // 3. Completion metadata
                    if (choice.finish_reason) {
                        yield ProviderEvents.done(choice.finish_reason, chunk.usage || null);
                    }
                }
            }
            else {
                const response = await client.chat.completions.create(params);
                const choice = response.choices[0];
                const content = choice?.message?.content;
                if (content) {
                    yield ProviderEvents.delta(content);
                }
                if (choice?.message?.tool_calls) {
                    yield ProviderEvents.toolCall(choice.message.tool_calls);
                }
                yield ProviderEvents.done(choice?.finish_reason || 'stop', response.usage);
            }
        }
        catch (err) {
            const { ProviderError } = require('./../providerErrors');
            throw new ProviderError(err.message, err.status || 502);
        }
    }
    async checkHealth(config) {
        const client = new OpenAI({
            apiKey: config.api_key || 'dummy',
            baseURL: config.endpoint_url || this.defaultBaseUrl,
            timeout: 2000,
            maxRetries: 0,
        });
        try {
            // List models is a lightweight check for most OpenAI-compatible APIs
            await client.models.list();
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async getModels(config) {
        const client = new OpenAI({
            apiKey: config.api_key || 'dummy',
            baseURL: config.endpoint_url || this.defaultBaseUrl,
            timeout: 5000,
            maxRetries: 1,
        });
        try {
            const response = await client.models.list();
            if (response && response.data && Array.isArray(response.data)) {
                return response.data.map(m => m.id);
            }
            return this.models;
        }
        catch (e) {
            console.error(`[${this.id}] Error fetching models dynamically:`, e.message);
            return this.models;
        }
    }
}
function createProvider(config) {
    return new OpenAICompatProvider(config);
}
module.exports = { OpenAICompatProvider, createProvider };
//# sourceMappingURL=openai_compat.js.map