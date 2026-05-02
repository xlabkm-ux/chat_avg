const { Readable } = require('node:stream');
const categoryRepository = require('../admin/category.repository');
const { getProvider } = require('../providers/provider.factory');
const { ALLOWED_EXTRA_PARAMS } = require('../../core/config');
const { validateProviderUrl, sanitizePromptText } = require('../../core/utils');

function pickAllowedExtraParams(input, allowed) {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
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
      err.status = 502;
      throw err;
    }

    // SSRF Validation
    if (catSettings.endpoint_url) {
      try {
        validateProviderUrl(catSettings.endpoint_url);
      } catch (err) {
        throw new Error(`SSRF Blocked: ${err.message}`);
      }
    }

    // Security: non-admins cannot send 'system' role messages.
    // Also, sanitize all user message content to prevent prompt injection.
    let injectionDetected = false;
    let messages = (body.messages || []).map(m => {
      if (m.role === 'user' && typeof m.content === 'string') {
        const sanitized = sanitizePromptText(m.content);
        if (sanitized !== m.content.trim()) {
          injectionDetected = true;
        }
        return { ...m, content: sanitized };
      }
      return m;
    });

    if (injectionDetected) {
      console.warn(`[Security] Prompt injection attempt detected and sanitized for user: ${user.username}`);
    }
    
    if (user.category !== 'Администратор') {
      messages = messages.filter(m => m.role !== 'system');
    }

    // Filter out messages with empty content if they don't have tool calls
    messages = messages.filter(m => (m.content && m.content.trim().length > 0) || (m.tool_calls && m.tool_calls.length > 0) || m.role === 'assistant');

    // Optimization: avoid full array copy if not necessary
    if (catSettings.system_prompt?.trim()) {
      if (messages.length > 0 && messages[0].role === 'system') {
        // Concatenate with existing system prompt instead of creating a new entry
        messages = [{ 
          ...messages[0], 
          content: `${catSettings.system_prompt}\n\n${messages[0].content}` 
        }, ...messages.slice(1)];
      } else {
        // Prepend system prompt
        messages = [{ role: 'system', content: catSettings.system_prompt }, ...messages];
      }
    }

    // AbortController for client disconnect and timeout
    const ac = new AbortController();
    const reqCloseHandler = () => ac.abort(new Error('Client disconnected'));
    res.req.on('close', reqCloseHandler);

    // 60 seconds timeout
    const timeoutId = setTimeout(() => ac.abort(new Error('Provider timeout')), 60000);

    // Options mapping
    const options = {
      stream: !!body.stream,
      max_tokens: parseInt(catSettings.max_tokens) || 1024,
      signal: ac.signal
    };

    // Merged settings & Extra params
    const mergedSettings = { ...catSettings };
    if (body.temperature !== undefined) mergedSettings.temperature = body.temperature;
    if (body.top_p !== undefined) mergedSettings.top_p = body.top_p;
    
    if (body.extra_params) {
      const allowedKeys = user.category === 'Администратор' ? ALLOWED_EXTRA_PARAMS.ADMIN : ALLOWED_EXTRA_PARAMS.USER;
      const safeParams = pickAllowedExtraParams(body.extra_params, allowedKeys);
      mergedSettings.extra_params = { ...(mergedSettings.extra_params || {}), ...safeParams };
    }

    console.log(`[Chat] user=${user.username} provider=${providerId} model=${catSettings.model_name || 'default'}`);

    try {
      let result;
      
      // Emulate streaming using Native Streams if provider doesn't support it
      if (options.stream && provider.capabilities && !provider.capabilities.stream) {
        const fallbackOptions = { ...options, stream: false };
        const rawResult = await provider.handleChat(messages, mergedSettings, fallbackOptions);
        
        const data = rawResult.data || {};
        const text = data?.choices?.[0]?.message?.content || '';
        
        const stream = this._createEmulatedStream(text, data);
        result = { isStream: true, stream, isRawSse: false };
      } else {
        result = await provider.handleChat(messages, mergedSettings, options);
      }

      if (result.isStream) {
        await this._pipeStreamToResponse(result, res);
      } else {
        res.json(result.data);
      }
    } catch (err) {
      if (err.message === 'Client disconnected') return; // Ignore early disconnect
      this._handleError(err, providerId, provider.name, res);
    } finally {
      clearTimeout(timeoutId);
      res.req.off('close', reqCloseHandler);
    }
  }

  _createEmulatedStream(text, metadata) {
    const chunkSize = 20;
    let i = 0;
    
    return new Readable({
      objectMode: true,
      async read() {
        if (i >= text.length) {
          this.push({
            id: metadata.id || `emulated-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: metadata.created || Math.floor(Date.now() / 1000),
            choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
          });
          this.push(null);
          return;
        }

        const content = text.slice(i, i + chunkSize);
        i += chunkSize;

        this.push({
          id: metadata.id || `emulated-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: metadata.created || Math.floor(Date.now() / 1000),
          choices: [{ index: 0, delta: { content }, finish_reason: null }]
        });

        // Small delay to simulate "typing"
        await new Promise(r => setTimeout(r, 10));
      }
    });
  }

  async _pipeStreamToResponse(result, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    try {
      for await (const chunk of result.stream) {
        if (result.isRawSse) {
          res.write(chunk);
        } else {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      }
      if (!result.isRawSse) {
        res.write('data: [DONE]\n\n');
      }
      res.end();
    } catch (err) {
      console.error('[Chat Stream Error]', err);
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }

  _handleError(err, providerId, providerName, res) {
    console.error(`[ChatService Error - ${providerId}]`, err.message);
    const status = err.status || 502;
    const message = `${providerName || providerId}: ${err.message}`;

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: message, code: 'provider_error' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(status).json({
        error: {
          code: 'provider_error',
          message: message
        }
      });
    }
  }
}

module.exports = new ChatService();
