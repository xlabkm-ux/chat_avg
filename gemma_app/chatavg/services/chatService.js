const categoryRepository = require('../storage/categoryRepository');
const { getProvider } = require('../providers');

const USER_ALLOWED_EXTRA_PARAMS = ['response_format'];
const ADMIN_ALLOWED_EXTRA_PARAMS = ['tools', 'tool_choice', 'reasoning', 'response_format', 'metadata'];

function pickAllowedExtraParams(input, allowed) {
  const out = {};
  for (const key of allowed) {
    if (input && Object.prototype.hasOwnProperty.call(input, key)) {
      out[key] = input[key];
    }
  }
  return out;
}

class ChatService {
  async handleCompletion({ user, body, res }) {
    const catSettings = await categoryRepository.findByName(user.category) || {};

    // Resolve provider
    const providerId = catSettings.provider || 'llamacpp';
    const provider = getProvider(providerId);
    if (!provider) {
      const err = new Error(`Провайдер "${providerId}" не найден`);
      err.status = 500;
      throw err;
    }

    // Build messages with system prompt injection
    let messages = body.messages || [];
    if (catSettings.system_prompt && catSettings.system_prompt.trim() !== '') {
      if (messages.length > 0 && messages[0].role === 'system') {
        messages = [...messages];
        messages[0] = { ...messages[0], content: catSettings.system_prompt + '\n\n' + messages[0].content };
      } else {
        messages = [{ role: 'system', content: catSettings.system_prompt }, ...messages];
      }
    }

    // Request options
    const options = {
      stream: !!body.stream,
      max_tokens: parseInt(catSettings.max_tokens) || 1024,
    };

    // Merge frontend overrides into category settings
    const mergedSettings = { ...catSettings };
    if (body.temperature !== undefined) mergedSettings.temperature = body.temperature;
    if (body.top_p !== undefined) mergedSettings.top_p = body.top_p;
    if (body.extra_params && typeof body.extra_params === 'object') {
      const allowedKeys = user.category === 'Администратор' ? ADMIN_ALLOWED_EXTRA_PARAMS : USER_ALLOWED_EXTRA_PARAMS;
      const safeParams = pickAllowedExtraParams(body.extra_params, allowedKeys);
      mergedSettings.extra_params = { ...(mergedSettings.extra_params || {}), ...safeParams };
    }

    console.log(`[Chat] user=${user.username} provider=${providerId} model=${catSettings.model_name || provider.defaultModel}`);

    try {
      let result;
      
      // Emulate streaming if requested but not supported by provider
      if (options.stream && provider.capabilities && !provider.capabilities.stream) {
        const fallbackOptions = { ...options, stream: false };
        const rawResult = await provider.handleChat(messages, mergedSettings, fallbackOptions);
        
        const data = rawResult.data || {};
        const text = data?.choices?.[0]?.message?.content || '';
        
        const buildChunk = (content, finishReason) => ({
          id: data.id || 'chatcmpl-' + Date.now(),
          object: 'chat.completion.chunk',
          created: data.created || Math.floor(Date.now() / 1000),
          model: data.model || 'emulated',
          choices: [{
            index: 0,
            delta: finishReason ? {} : { content },
            finish_reason: finishReason || null,
          }],
        });

        async function* emulateStream() {
          const chunkSize = 20; // chars per tick
          for (let i = 0; i < text.length; i += chunkSize) {
            yield buildChunk(text.slice(i, i + chunkSize), null);
            await new Promise(r => setTimeout(r, 10));
          }
          yield buildChunk('', 'stop');
        }
        
        result = { isStream: true, stream: emulateStream(), isRawSse: false };
      } else {
        result = await provider.handleChat(messages, mergedSettings, options);
      }

      if (result.isStream) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        for await (const chunk of result.stream) {
          if (result.isRawSse) {
            // Chunk is already an SSE-formatted string (e.g. "data: {...}\n\n")
            res.write(chunk);
          } else {
            // Chunk is a raw JS object, needs serialization
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
        }

        if (!result.isRawSse) {
          res.write('data: [DONE]\n\n');
        }
        res.end();
      } else {
        res.json(result.data);
      }
    } catch (err) {
      console.error(`[ChatService Error - ${providerId}]`, err.message);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: err.message, code: err.code || 'provider_error' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        res.status(err.status || 502).json({
          error: `${provider.name || providerId}: ${err.message}`,
          code: err.code || 'provider_error',
        });
      }
    }
  }
}

module.exports = new ChatService();
