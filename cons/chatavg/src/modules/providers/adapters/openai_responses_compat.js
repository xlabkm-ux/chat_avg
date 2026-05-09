/**
 * OpenAI Responses API Provider Factory
 * Works with: OpenAI, Grok (xAI) — any provider supporting openai.responses.create()
 * 
 * Converts chat messages ↔ Responses API format
 * Converts Responses streaming events → Chat Completions SSE for frontend
 */
const OpenAI = require('openai');
const BaseProvider = require('../base.provider');

class OpenAIResponsesProvider extends BaseProvider {
  constructor(config) {
    super({
      ...config,
      capabilities: Object.assign({ stream: true, tools: true }, config.capabilities)
    });
    this.defaultBaseUrl = config.defaultBaseUrl;
  }

  /**
   * Convert OpenAI chat messages to Responses API format
   * system → instructions, user/assistant → input array
   */
  _convertMessages(messages) {
    let instructions = '';
    const input = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        instructions += (instructions ? '\n' : '') + msg.content;
      } else if (msg.role === 'user') {
        input.push({
          role: 'user',
          content: [{ type: 'input_text', text: msg.content }],
        });
      } else if (msg.role === 'assistant') {
        input.push({
          role: 'assistant',
          content: [{ type: 'output_text', text: msg.content }],
        });
      }
    }

    return { instructions, input };
  }

  async *handleChat(messages, config, options) {
    const ProviderEvents = require('./../providerEvents');
    const client = new OpenAI({
      apiKey: config.api_key,
      baseURL: config.endpoint_url || this.defaultBaseUrl,
    });

    const { instructions, input } = this._convertMessages(messages);

    // Build Responses API params
    const params = {
      model: config.model_name || this.defaultModel,
      stream: !!options.stream,
    };

    // Standard generation parameters
    if (options.max_tokens) params.max_output_tokens = options.max_tokens;
    if (config.temperature !== undefined) params.temperature = config.temperature;
    if (config.top_p !== undefined) params.top_p = config.top_p;

    // Merge extra_params (prompt, tools, reasoning, store, include, etc.)
    if (config.extra_params && typeof config.extra_params === 'object') {
      Object.assign(params, config.extra_params);
    }

    if (instructions) params.instructions = instructions;
    params.input = input;

    // Debug logging (only when debug_mode is enabled for this category)
    if (config.debug_mode) {
      try {
        const { RedactionService } = require('../../policy/redaction.service');
        const safeParams = RedactionService.redact({ ...params });
        delete safeParams.stream;
        this._pushDebugLog(config, 'debug', `REQUEST PARAMS:\n${JSON.stringify(safeParams, null, 2)}`);
      } catch (e) { /* non-critical */ }
    }

    try {
      if (params.stream) {
        const stream = await client.responses.create(params, { signal: options.signal });
        
        let inReasoning = false;
        let finalUsage = null;
        for await (const event of stream) {
          if (event.type === 'response.reasoning_summary_text.delta') {
            let text = event.delta;
            if (!inReasoning) {
              text = '<think>\n' + text;
              inReasoning = true;
            }
            yield ProviderEvents.delta(text);
          } else if (event.type === 'response.output_text.delta') {
            let text = event.delta;
            if (inReasoning) {
              text = '\n</think>\n\n' + text;
              inReasoning = false;
            }
            yield ProviderEvents.delta(text);
          } else if (event.type === 'response.tool_call.created') {
            const toolName = event.tool_call.name;
            yield ProviderEvents.delta(`\n<tool name="${toolName}">\n`);
          } else if (event.type === 'response.tool_call.output') {
            yield ProviderEvents.delta(`\n</tool>\n\n`);
          } else if (event.type === 'response.output_item.added') {
             // Safe ignore search/etc calls if they appear here
             if (config.debug_mode && event.item?.type) {
               this._pushDebugLog(config, 'debug', `ITEM ADDED (ignored): ${event.item.type} ${event.item.id || ''}`);
             }
          } else if (event.type === 'response.failed') {
             throw new Error(event.response?.error?.message || 'OpenAI response failed');
          } else {
            // Catch-all to avoid breaking stream
            const noisyEvents = [
              'response.created', 
              'response.output_item.done', 
              'response.done',
              'response.content_part.added',
              'response.content_part.done'
            ];
            if (config.debug_mode && event.type && !noisyEvents.includes(event.type)) {
              this._pushDebugLog(config, 'debug', `UNHANDLED EVENT: ${event.type}`);
            }
            if (event.type === 'response.done' && event.response?.usage) {
              const u = event.response.usage;
              finalUsage = {
                prompt_tokens: u.input_tokens || 0,
                completion_tokens: u.output_tokens || 0,
                total_tokens: (u.input_tokens || 0) + (u.output_tokens || 0),
              };
            }
          }
        }
        yield ProviderEvents.done('stop', finalUsage);
      } else {
        const response = await client.responses.create(params, { signal: options.signal });

        // Extract text from Responses API output
        let text = '';
        if (response.output) {
          for (const item of response.output) {
            if (item.type === 'message' && item.content) {
              for (const part of item.content) {
                if (part.type === 'output_text') text += part.text;
                if (part.type === 'reasoning_text') text = `<think>\n${part.text}\n</think>\n\n` + text;
                if (part.type === 'reasoning_summary_text') text = `<think_summary>\n${part.text}\n</think_summary>\n\n` + text;
              }
            }
          }
        }

        const usage = response.usage ? {
          prompt_tokens: response.usage.input_tokens || 0,
          completion_tokens: response.usage.output_tokens || 0,
          total_tokens: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0),
        } : { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        if (text) {
          yield ProviderEvents.delta(text);
        }
        yield ProviderEvents.done('stop', usage);
      }
    } catch (err) {
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
      await client.models.list();
      return true;
    } catch (e) {
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
    } catch (e) {
      console.error(`[${this.id}] Error fetching models dynamically:`, e.message);
      return this.models;
    }
  }
}

function createResponsesProvider(config) {
  return new OpenAIResponsesProvider(config);
}

module.exports = { OpenAIResponsesProvider, createResponsesProvider };
