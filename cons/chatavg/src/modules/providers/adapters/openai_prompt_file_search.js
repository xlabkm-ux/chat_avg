/**
 * Provider: OpenAI Prompt + File Search Responses API
 *
 * Calls openai.responses.create() with a stored prompt and OpenAI-managed
 * file_search/vector stores. This adapter is separate from the generic
 * openai_responses adapter so prompt/vector-store defaults can be configured
 * as a named provider without changing the existing Responses path.
 */
const OpenAI = require('openai');
const BaseProvider = require('../base.provider');

class OpenAIPromptFileSearchProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: config.id || 'openai_prompt_file_search',
      name: config.name || 'OpenAI Prompt File Search',
      models: config.models || ['prompt'],
      defaultModel: config.defaultModel || 'prompt',
      capabilities: Object.assign(
        { stream: true, tools: true, retrieval: true },
        config.capabilities
      ),
    });
    this.defaultBaseUrl = config.defaultBaseUrl || 'https://api.openai.com/v1';
  }

  _convertMessages(messages = []) {
    const input = [];
    let instructions = '';

    for (const msg of messages) {
      if (!msg || !msg.role) continue;

      const text = Array.isArray(msg.content)
        ? msg.content.map(part => part.text || part.content || '').join('\n')
        : String(msg.content || '');

      if (msg.role === 'system') {
        instructions += (instructions ? '\n' : '') + text;
        continue;
      }

      if (!text) continue;

      if (msg.role === 'assistant') {
        input.push({
          role: 'assistant',
          content: [{ type: 'output_text', text }],
        });
      } else {
        input.push({
          role: 'user',
          content: [{ type: 'input_text', text }],
        });
      }
    }

    return { input, instructions };
  }

  _normalizeVectorStoreIds(extraParams = {}) {
    if (Array.isArray(extraParams.vector_store_ids) && extraParams.vector_store_ids.length > 0) {
      return extraParams.vector_store_ids;
    }

    const tools = Array.isArray(extraParams.tools) ? extraParams.tools : [];
    const fileSearchTool = tools.find(t => t && t.type === 'file_search');

    if (fileSearchTool && Array.isArray(fileSearchTool.vector_store_ids)) {
      return fileSearchTool.vector_store_ids;
    }

    return [];
  }

  _buildParams(messages, config = {}, options = {}) {
    const extraParams =
      config.extra_params && typeof config.extra_params === 'object'
        ? { ...config.extra_params }
        : {};

    const prompt = extraParams.prompt || config.prompt;
    const vectorStoreIds = this._normalizeVectorStoreIds(extraParams);

    const { input, instructions: systemFromHistory } = this._convertMessages(messages);

    const params = {
      input: Object.prototype.hasOwnProperty.call(extraParams, 'input')
        ? extraParams.input
        : input,

      reasoning: extraParams.reasoning || { summary: 'auto' },

      tools:
        extraParams.tools ||
        (vectorStoreIds.length > 0
          ? [{ type: 'file_search', vector_store_ids: vectorStoreIds }]
          : []),

      store: Object.prototype.hasOwnProperty.call(extraParams, 'store')
        ? extraParams.store
        : true,

      include: extraParams.include || [
        'reasoning.encrypted_content',
        'web_search_call.action.sources',
      ],

      stream: !!options.stream,
    };

    if (systemFromHistory) params.instructions = systemFromHistory;

    // 1. Mapping from config/options
    const maxTokens = options.max_tokens || config.max_tokens;
    if (maxTokens) params.max_output_tokens = maxTokens;

    if (config.system_prompt) params.instructions = config.system_prompt;
    if (config.temperature !== undefined) params.temperature = config.temperature;
    if (config.top_p !== undefined) params.top_p = config.top_p;

    // 2. Handle prompt vs model
    if (prompt) {
      params.prompt = prompt;
      // OpenAI Responses API: instructions and prompt are mutually exclusive
      delete params.instructions;
    } else {
      params.model = config.model_name || this.defaultModel;
    }

    // 3. Merge other extra_params (metadata, tool_choice, etc.)
    if (extraParams.metadata) params.metadata = extraParams.metadata;
    if (extraParams.tool_choice) params.tool_choice = extraParams.tool_choice;
    if (extraParams.response_format) params.response_format = extraParams.response_format;

    for (const [key, value] of Object.entries(extraParams)) {
      if (
        [
          'prompt',
          'input',
          'reasoning',
          'tools',
          'store',
          'include',
          'vector_store_ids',
          'max_tokens',
          'system_prompt',
          'top_k',
          'min_p',
          'repeat_penalty',
        ].includes(key)
      ) {
        continue;
      }

      if (value !== undefined && params[key] === undefined) {
        params[key] = value;
      }
    }

    // 4. Explicit removal of forbidden/mapped keys to avoid 400
    delete params.top_k;
    delete params.min_p;
    delete params.repeat_penalty;
    delete params.max_tokens;
    delete params.system_prompt;

    if (prompt) {
      delete params.temperature;
      delete params.top_p;
    }

    return params;
  }

  _extractText(response) {
    if (!response) return '';
    if (typeof response.output_text === 'string') return response.output_text;

    let text = '';

    if (Array.isArray(response.output)) {
      for (const item of response.output) {
        if (item.type !== 'message' || !Array.isArray(item.content)) continue;

        for (const part of item.content) {
          if (part.type === 'output_text' && part.text) {
            text += part.text;
          }
        }
      }
    }

    return text;
  }

  _normalizeUsage(usage) {
    if (!usage) {
      return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    }

    const promptTokens = usage.input_tokens || usage.prompt_tokens || 0;
    const completionTokens = usage.output_tokens || usage.completion_tokens || 0;

    return {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: usage.total_tokens || promptTokens + completionTokens,
    };
  }

  async *handleChat(messages, config, options = {}) {
    const ProviderEvents = require('./../providerEvents');

    const client = new OpenAI({
      apiKey: config.api_key,
      baseURL: config.endpoint_url || this.defaultBaseUrl,
    });

    const params = this._buildParams(messages, config, options);

    // Debug logging (only when debug_mode is enabled for this category)
    if (config.debug_mode) {
      const { RedactionService } = require('../../policy/redaction.service');
      const safeParams = RedactionService.redact({ ...params });
      delete safeParams.stream;
      this._pushDebugLog(config, 'debug', `REQUEST PARAMS:\n${JSON.stringify(safeParams, null, 2)}`);
    }

    try {
      if (params.stream) {
        const stream = await client.responses.create(params);
        let inReasoning = false;

        for await (const event of stream) {
          if (event.type === 'response.reasoning_summary_text.delta') {
            let text = event.delta || '';
            if (!text) continue;

            if (!inReasoning) {
              text = '<think>\n' + text;
              inReasoning = true;
            }

            yield ProviderEvents.delta(text);
          } else if (event.type === 'response.output_text.delta') {
            let text = event.delta || '';
            if (!text) continue;

            if (inReasoning) {
              text = '\n</think>\n\n' + text;
              inReasoning = false;
            }

            yield ProviderEvents.delta(text);
          } else if (
            event.type === 'response.output_item.added' &&
            event.item?.type === 'file_search_call'
          ) {
            yield ProviderEvents.toolCall({
              id: event.item.id,
              name: 'file_search',
              arguments: JSON.stringify({ status: event.item.status || 'started' }),
            });
          } else if (
            event.type === 'response.output_item.added' &&
            event.item?.type === 'web_search_call'
          ) {
            // R4.2: web_search_call safe ignore + debug log
            if (config.debug_mode) {
              this._pushDebugLog(config, 'debug', `WEB_SEARCH_CALL (ignored): ${event.item.id}`);
            }
            yield ProviderEvents.toolCall({
              id: event.item.id,
              name: 'web_search',
              arguments: JSON.stringify({ status: event.item.status || 'started' }),
            });
          } else if (event.type === 'response.completed') {
            yield ProviderEvents.done('stop', this._normalizeUsage(event.response?.usage));
            return;
          } else if (event.type === 'response.failed') {
            throw new Error(event.response?.error?.message || 'OpenAI response failed');
          } else {
            // R4.2: Catch-all for other events to avoid breaking stream
            const noisyEvents = [
              'response.created', 
              'response.output_item.done', 
              'response.done',
              'response.content_part.added',
              'response.content_part.done'
            ];
            if (config.debug_mode && event.type && !noisyEvents.includes(event.type)) {
              this._pushDebugLog(config, 'debug', `UNHANDLED EVENT: ${event.type}\n${JSON.stringify(event, null, 2)}`);
            }
          }
        }

        yield ProviderEvents.done('stop');
        return;
      }

      const response = await client.responses.create(params);
      const text = this._extractText(response);

      if (text) {
        yield ProviderEvents.delta(text);
      }

      yield ProviderEvents.done('stop', this._normalizeUsage(response.usage));
    } catch (err) {
      const { ProviderError } = require('./../providerErrors');
      throw new ProviderError(err.message, err.status || 502);
    }
  }

  async checkHealth(config = {}) {
    const client = new OpenAI({
      apiKey: config.api_key || 'dummy',
      baseURL: config.endpoint_url || this.defaultBaseUrl,
      timeout: 2000,
      maxRetries: 0,
    });

    try {
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async getModels() {
    return this.models;
  }
}

module.exports = new OpenAIPromptFileSearchProvider();
module.exports.OpenAIPromptFileSearchProvider = OpenAIPromptFileSearchProvider;
