/**
 * MCP Gateway — OpenAI Responses API helpers
 * Shared utilities for converting between Chat Completions and Responses API formats.
 * Eliminates the ~60 lines of duplicated conversion logic from the old monolith.
 */

/**
 * Convert standard chat messages [{role, content}] to Responses API format.
 * system messages → instructions string, user/assistant → input array.
 * 
 * @param {Array<{role: string, content: string}>} messages
 * @returns {{ instructions: string, input: Array }}
 */
export function convertMessagesToResponsesInput(messages) {
  let instructions = '';
  const input = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      instructions += (instructions ? '\n' : '') + msg.content;
    } else {
      const role = msg.role === 'assistant' ? 'assistant' : 'user';
      const contentType = role === 'assistant' ? 'output_text' : 'input_text';
      input.push({
        role,
        content: [{ type: contentType, text: msg.content }],
      });
    }
  }

  return { instructions, input };
}

/**
 * Build OpenAI Responses API params from a unified request object.
 * Handles prompt/model exclusion, message conversion, and extra_params passthrough.
 * 
 * @param {Object} opts
 * @param {string} [opts.model]
 * @param {Array}  [opts.messages] - Standard chat messages (will be converted)
 * @param {Object} [opts.prompt] - Managed prompt {id, version}
 * @param {Array}  [opts.input] - Pre-formatted Responses API input
 * @param {string} [opts.instructions]
 * @param {number} [opts.temperature]
 * @param {number} [opts.max_tokens]
 * @param {Object} [opts.extra_params] - All remaining Responses-specific params
 * @returns {Object} Ready-to-send params for client.responses.create()
 */
export function buildResponsesParams(opts) {
  const {
    model,
    messages,
    prompt,
    input: rawInput,
    instructions: rawInstructions,
    temperature,
    max_tokens,
    extra_params = {},
  } = opts;

  const params = {};

  // 1. Model — omit when managed prompt is provided (model is baked in)
  if (model && model !== 'default' && !prompt && !extra_params.prompt) {
    params.model = model;
  }

  // 2. Managed prompt
  const promptObj = prompt || extra_params.prompt;
  if (promptObj) {
    params.prompt = promptObj;
  }

  // 3. Input — use pre-formatted, or convert from chat messages
  if (rawInput !== undefined) {
    params.input = rawInput;
  } else if (messages && messages.length > 0) {
    const { instructions, input } = convertMessagesToResponsesInput(messages);
    if (instructions && !params.prompt) {
      params.instructions = instructions;
    }
    params.input = input;
  } else {
    params.input = [];
  }

  // 4. Override instructions if explicitly provided
  if (rawInstructions) {
    params.instructions = rawInstructions;
  }

  // 5. Generation params — omit when managed prompt is provided
  if (!params.prompt) {
    if (temperature !== undefined) params.temperature = temperature;
    if (max_tokens) params.max_output_tokens = max_tokens;
  }

  // 6. Pass through known Responses-specific fields
  const PASSTHROUGH_KEYS = ['reasoning', 'tools', 'store', 'include', 'tool_choice'];
  for (const key of PASSTHROUGH_KEYS) {
    const val = extra_params[key];
    if (val !== undefined) params[key] = val;
  }

  return params;
}

/**
 * Extract readable text from an OpenAI Responses API response object.
 * Handles output_text, reasoning_text, and reasoning_summary_text parts.
 * 
 * @param {Object} response - Raw response from client.responses.create()
 * @returns {string} Extracted text
 */
export function extractResponseText(response) {
  let text = '';
  let reasoning = '';

  if (!response?.output) return text;

  for (const item of response.output) {
    if (item.type === 'message' && item.content) {
      for (const part of item.content) {
        if (part.type === 'output_text') {
          text += part.text;
        } else if (part.type === 'reasoning_text') {
          reasoning = `<think>\n${part.text}\n</think>\n\n`;
        } else if (part.type === 'reasoning_summary_text') {
          reasoning = `<think_summary>\n${part.text}\n</think_summary>\n\n`;
        }
      }
    }
  }

  return reasoning + text;
}

/** Provider names that should use Responses API instead of Chat Completions */
const RESPONSES_PROVIDERS = new Set([
  'openai_responses',
  'openai_prompt_file_search',
]);

/**
 * Should this request use the Responses API?
 * @param {string} providerName
 * @param {Object} extra_params
 * @returns {boolean}
 */
export function shouldUseResponsesAPI(providerName, extra_params = {}) {
  return RESPONSES_PROVIDERS.has(providerName.toLowerCase()) || !!extra_params.prompt;
}
