const ProviderEvents = {
  delta: (text) => ({ type: 'delta', text }),
  toolCall: (toolCall) => ({ type: 'tool_call', toolCall }),
  done: (finishReason = 'stop', usage = null) => ({ type: 'done', finishReason, usage }),
  error: (message, code = 'provider_error') => ({ type: 'error', message, code })
};

module.exports = ProviderEvents;
