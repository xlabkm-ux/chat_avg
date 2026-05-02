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

  async handleChat(messages, config, options) {
    const endpointUrl = (config.endpoint_url || 'http://127.0.0.1:8081/v1').replace(/\/$/, '');

    // Build request body with llama.cpp-specific params
    const body = {
      messages,
      stream: !!options.stream,
    };

    if (options.max_tokens) body.max_tokens = options.max_tokens;
    if (config.model_name) body.model = config.model_name;
    if (config.temperature !== undefined) body.temperature = config.temperature;
    if (config.top_p !== undefined) body.top_p = config.top_p;

    // llama.cpp-specific parameters
    if (config.top_k !== undefined) body.top_k = config.top_k;
    if (config.min_p !== undefined) body.min_p = config.min_p;
    if (config.repeat_penalty !== undefined) body.repeat_penalty = config.repeat_penalty;
    if (config.n_predict !== undefined) body.n_predict = config.n_predict;

    // Merge extra_params
    if (config.extra_params && typeof config.extra_params === 'object') {
      Object.assign(body, config.extra_params);
    }

    let targetUrl;
    try {
      targetUrl = new URL(endpointUrl + '/chat/completions');
    } catch (e) {
      targetUrl = new URL('http://127.0.0.1:8081/v1/chat/completions');
    }

    const headers = {
      'Content-Type': 'application/json',
    };
    if (config.api_key) headers['Authorization'] = `Bearer ${config.api_key}`;

    const r = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text();
      const err = new Error(errText);
      err.status = r.status;
      err.code = 'backend_error';
      throw err;
    }

    if (body.stream) {
      async function* streamSse() {
        if (!r.body) return;
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield decoder.decode(value, { stream: true });
        }
      }
      return { isStream: true, stream: streamSse(), isRawSse: true };
    } else {
      const data = await r.json();
      return { isStream: false, data };
    }
  }
}

module.exports = new LlamaCppProvider();
