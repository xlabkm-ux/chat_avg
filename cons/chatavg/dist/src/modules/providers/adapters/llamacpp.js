"use strict";
/**
 * Provider: llama.cpp (Local)
 * Direct HTTP proxy to local llama-server.
 * Supports llama.cpp-specific parameters: top_k, min_p, repeat_penalty, n_predict
 */
const http = require('http');
const https = require('https');
const BaseProvider = require('../base.provider');
class LlamaCppProvider extends BaseProvider {
    constructor() {
        super({
            id: 'llamacpp',
            name: 'llama.cpp (Local)',
            defaultModel: 'local-model',
            models: [],
            capabilities: { stream: true, tools: false },
        });
    }
    async *handleChat(messages, config, options) {
        const ProviderEvents = require('./../providerEvents');
        const endpointUrl = (config.endpoint_url || 'http://127.0.0.1:8201').replace(/\/$/, '');
        // Build request body with llama.cpp-specific params
        const body = {
            messages,
            stream: !!options.stream,
        };
        if (options.max_tokens)
            body.max_tokens = options.max_tokens;
        if (config.model_name)
            body.model = config.model_name;
        if (config.temperature !== null && config.temperature !== undefined)
            body.temperature = config.temperature;
        if (config.top_p !== null && config.top_p !== undefined)
            body.top_p = config.top_p;
        // llama.cpp-specific parameters
        if (config.top_k !== null && config.top_k !== undefined)
            body.top_k = config.top_k;
        if (config.min_p !== null && config.min_p !== undefined)
            body.min_p = config.min_p;
        if (config.repeat_penalty !== null && config.repeat_penalty !== undefined)
            body.repeat_penalty = config.repeat_penalty;
        if (config.n_predict !== null && config.n_predict !== undefined)
            body.n_predict = config.n_predict;
        // Merge extra_params
        if (config.extra_params && typeof config.extra_params === 'object') {
            Object.assign(body, config.extra_params);
        }
        let targetUrl;
        try {
            targetUrl = new URL(endpointUrl + '/chat/completions');
        }
        catch (e) {
            targetUrl = new URL('http://127.0.0.1:8201/chat/completions');
        }
        const headers = {
            'Content-Type': 'application/json',
        };
        if (config.api_key)
            headers['Authorization'] = `Bearer ${config.api_key}`;
        const r = await fetch(targetUrl.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!r.ok) {
            const errText = await r.text();
            const { ProviderError } = require('./../providerErrors');
            throw new ProviderError(errText, r.status);
        }
        if (body.stream) {
            if (!r.body)
                return;
            const reader = r.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // keep the last incomplete line
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]') {
                            yield ProviderEvents.done();
                            continue;
                        }
                        try {
                            const data = JSON.parse(dataStr);
                            const content = data.choices?.[0]?.delta?.content;
                            if (content) {
                                yield ProviderEvents.delta(content);
                            }
                            if (data.choices?.[0]?.finish_reason) {
                                yield ProviderEvents.done(data.choices[0].finish_reason, data.usage);
                            }
                        }
                        catch (e) {
                            // ignore parse errors
                        }
                    }
                }
            }
        }
        else {
            const data = await r.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
                yield ProviderEvents.delta(content);
            }
            yield ProviderEvents.done(data.choices?.[0]?.finish_reason || 'stop', data.usage);
        }
    }
    async checkHealth(config) {
        const endpointUrl = (config.endpoint_url || 'http://127.0.0.1:8201').replace(/\/$/, '');
        try {
            const r = await fetch(`${endpointUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            return r.ok;
        }
        catch (e) {
            return false;
        }
    }
    async getModels(config) {
        const endpointUrl = (config.endpoint_url || 'http://127.0.0.1:8201').replace(/\/$/, '');
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (config.api_key)
                headers['Authorization'] = `Bearer ${config.api_key}`;
            const r = await fetch(`${endpointUrl}/v1/models`, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(5000)
            });
            if (r.ok) {
                const data = await r.json();
                if (data && data.data && Array.isArray(data.data)) {
                    return data.data.map(m => m.id);
                }
            }
            return this.models;
        }
        catch (e) {
            console.error(`[${this.id}] Error fetching models dynamically:`, e.message);
            return this.models;
        }
    }
}
module.exports = new LlamaCppProvider();
//# sourceMappingURL=llamacpp.js.map