/**
 * Provider: Google Gemini
 * Models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash
 * Uses native @google/generative-ai SDK
 * Converts Gemini streaming format → OpenAI SSE format for frontend compatibility
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = {
  id: 'google',
  name: 'Google Gemini',
  defaultModel: 'gemini-2.5-flash',
  models: [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
  ],
  capabilities: { stream: true, tools: true },

  /**
   * Convert OpenAI-format messages to Gemini format
   */
  _convertMessages(messages) {
    let systemInstruction = '';
    const history = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += (systemInstruction ? '\n' : '') + msg.content;
      } else {
        history.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    return { systemInstruction, history };
  },

  /**
   * Build an OpenAI-compatible SSE chunk from Gemini text
   */
  _buildChunk(text, finishReason) {
    return {
      id: 'chatcmpl-gemini-' + Date.now(),
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: 'gemini',
      choices: [{
        index: 0,
        delta: finishReason ? {} : { content: text },
        finish_reason: finishReason || null,
      }],
    };
  },

  async handleChat(messages, config, options) {
    const genAI = new GoogleGenerativeAI(config.api_key);

    const { systemInstruction, history } = this._convertMessages(messages);

    // Extract last user message (Gemini sendMessage needs it separately)
    const lastMsg = history.pop();
    const userText = lastMsg?.parts?.[0]?.text || '';

    const generationConfig = {};
    if (options.max_tokens) generationConfig.maxOutputTokens = options.max_tokens;
    if (config.temperature !== undefined) generationConfig.temperature = config.temperature;
    if (config.top_p !== undefined) generationConfig.topP = config.top_p;
    if (config.top_k !== undefined) generationConfig.topK = config.top_k;

    const modelConfig = {
      model: config.model_name || this.defaultModel,
      generationConfig,
    };
    if (systemInstruction) modelConfig.systemInstruction = systemInstruction;

    // Merge extra_params into model config
    if (config.extra_params && typeof config.extra_params === 'object') {
      if (config.extra_params.generationConfig) {
        Object.assign(generationConfig, config.extra_params.generationConfig);
      }
      // Tools, safety settings, etc.
      const { generationConfig: _, ...rest } = config.extra_params;
      Object.assign(modelConfig, rest);
    }

    const model = genAI.getGenerativeModel(modelConfig);

    if (options.stream) {
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(userText);
      
      const buildChunk = this._buildChunk.bind(this);
      async function* transformStream() {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            yield buildChunk(text, null);
          }
        }
        yield buildChunk('', 'stop');
      }

      return { isStream: true, stream: transformStream(), isRawSse: false };
    } else {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userText);
      const text = result.response.text();

      // Return OpenAI-compatible response format
      return {
        isStream: false,
        data: {
          id: 'chatcmpl-gemini-' + Date.now(),
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: config.model_name || this.defaultModel,
          choices: [{
            index: 0,
            message: { role: 'assistant', content: text },
            finish_reason: 'stop',
          }],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
        }
      };
    }
  },
};
