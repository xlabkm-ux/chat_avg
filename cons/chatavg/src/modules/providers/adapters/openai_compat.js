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
  async handleChat(messages, config, options) {
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
    if (options.max_tokens) params.max_tokens = options.max_tokens;
    if (config.temperature !== undefined) params.temperature = config.temperature;
    if (config.top_p !== undefined) params.top_p = config.top_p;

    // Merge extra_params (tools, reasoning, response_format, etc.)
    if (config.extra_params && typeof config.extra_params === 'object') {
      Object.assign(params, config.extra_params);
    }

    if (params.stream) {
      const stream = await client.chat.completions.create(params);
      return { isStream: true, stream, isRawSse: false };
    } else {
      const response = await client.chat.completions.create(params);
      return { isStream: false, data: response };
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
    } catch (e) {
      return false;
    }
  }
}

function createProvider(config) {
  return new OpenAICompatProvider(config);
}

module.exports = { OpenAICompatProvider, createProvider };
