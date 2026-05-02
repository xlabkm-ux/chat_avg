/**
 * OpenAI Responses API Provider Factory
 * Works with: OpenAI, Grok (xAI) — any provider supporting openai.responses.create()
 * 
 * Converts chat messages ↔ Responses API format
 * Converts Responses streaming events → Chat Completions SSE for frontend
 */
const OpenAI = require('openai');

function createResponsesProvider({ id, name, defaultBaseUrl, models, defaultModel }) {
  return {
    id,
    name,
    models,
    defaultModel,
    capabilities: { stream: true, tools: true },

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
    },

    /**
     * Build a Chat Completions SSE chunk from text delta
     * (frontend expects this format)
     */
    _buildChunk(text, finishReason) {
      return {
        id: 'chatcmpl-resp-' + Date.now(),
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'responses',
        choices: [{
          index: 0,
          delta: finishReason ? {} : { content: text },
          finish_reason: finishReason || null,
        }],
      };
    },

    async handleChat(messages, config, options) {
      const client = new OpenAI({
        apiKey: config.api_key,
        baseURL: config.endpoint_url || defaultBaseUrl,
      });

      const { instructions, input } = this._convertMessages(messages);

      // Build Responses API params
      const params = {
        model: config.model_name || defaultModel,
        input,
        stream: !!options.stream,
      };

      // Add instructions (system prompt) if present
      if (instructions) params.instructions = instructions;

      // Standard generation parameters
      if (options.max_tokens) params.max_output_tokens = options.max_tokens;
      if (config.temperature !== undefined) params.temperature = config.temperature;
      if (config.top_p !== undefined) params.top_p = config.top_p;

      // Merge extra_params (tools, reasoning, store, include, etc.)
      if (config.extra_params && typeof config.extra_params === 'object') {
        Object.assign(params, config.extra_params);
      }

      if (params.stream) {
        const stream = await client.responses.create(params);
        
        const buildChunk = this._buildChunk;
        async function* transformStream() {
          let inReasoning = false;
          for await (const event of stream) {
            if (event.type === 'response.reasoning_summary_text.delta') {
              let text = event.delta;
              if (!inReasoning) {
                text = '<think>\n' + text;
                inReasoning = true;
              }
              yield buildChunk(text, null);
            } else if (event.type === 'response.output_text.delta') {
              let text = event.delta;
              if (inReasoning) {
                text = '\n</think>\n\n' + text;
                inReasoning = false;
              }
              yield buildChunk(text, null);
            } else if (event.type === 'response.tool_call.created') {
              const toolName = event.tool_call.name;
              yield buildChunk(`\n<tool name="${toolName}">\n`, null);
            } else if (event.type === 'response.tool_call.output') {
              yield buildChunk(`\n</tool>\n\n`, null);
            }
          }
          yield buildChunk('', 'stop');
        }

        return { isStream: true, stream: transformStream(), isRawSse: false };
      } else {
        const response = await client.responses.create(params);

        // Extract text from Responses API output
        let text = '';
        if (response.output) {
          for (const item of response.output) {
            if (item.type === 'message' && item.content) {
              for (const part of item.content) {
                if (part.type === 'output_text') text += part.text;
              }
            }
          }
        }

        // Return in Chat Completions format for frontend compatibility
        return {
          isStream: false,
          data: {
            id: response.id || 'resp-' + Date.now(),
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: config.model_name || defaultModel,
            choices: [{
              index: 0,
              message: { role: 'assistant', content: text },
              finish_reason: 'stop',
            }],
            usage: response.usage ? {
              prompt_tokens: response.usage.input_tokens || 0,
              completion_tokens: response.usage.output_tokens || 0,
              total_tokens: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0),
            } : { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          }
        };
      }
    },
  };
}

module.exports = { createResponsesProvider };
