const ProviderEvents = {
  delta: (text) => ({ type: 'delta', text }),
  done: (finishReason = 'stop', usage = null) => ({ type: 'done', finishReason, usage }),
  error: (message, code = 'provider_error') => ({ type: 'error', message, code })
};

module.exports = ProviderEvents;
