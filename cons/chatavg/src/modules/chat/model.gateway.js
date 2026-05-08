
const { getProvider, adapters } = require('../providers/provider.factory');
const providersConfig = require('../../core/providers.config');
const { PROVIDER_TIMEOUT } = require('../../core/config');
const { validateProviderUrl } = require('../../core/utils');
const fallbackPolicy = require('./fallbackPolicy');
const traceBus = require('../observability/trace.bus');

// Backpressure state
const activeRequests = new Map();
const MAX_CONCURRENT_PER_PROVIDER = 50;

class ModelGateway {
  /**
   * Main entry point for LLM orchestration.
   * Handles provider selection, fallback, backpressure, and streaming.
   * 
   * @param {Object} params
   * @param {Array} params.messages - Prepared messages for the LLM
   * @param {Object} params.settings - Category and request settings
   * @param {Object} params.options - Execution options (stream, signal, etc)
   * @param {Object} params.route - Resolved route from PolicyRouter
   * @returns {AsyncIterable} A stream of normalized events (delta, tool_call, done, error)
   */
  async* handleChat({ messages, settings, options, route }) {
    const startTimeMs = Date.now();
    const providersToTry = [ { id: route.providerId, provider: route.provider } ];
    
    if (route.fallbackProviderId && route.fallbackProviderId !== route.providerId) {
      const fallbackProvider = getProvider(route.fallbackProviderId);
      if (fallbackProvider) {
        providersToTry.push({ id: route.fallbackProviderId, provider: fallbackProvider });
      }
    }

    let lastError = null;

    for (const currentProviderObj of providersToTry) {
      const currentProviderId = currentProviderObj.id;
      let currentProvider = currentProviderObj.provider;
      const providerMergedSettings = { ...settings };

      // Backpressure check
      const currentActive = activeRequests.get(currentProviderId) || 0;
      if (currentActive >= MAX_CONCURRENT_PER_PROVIDER) {
         const bpError = new Error(`Provider ${currentProviderId} is overloaded.`);
         bpError.status = 429;
         bpError.isRetryable = true;
         
         if (fallbackPolicy.shouldFallback(bpError)) {
           console.warn(`[ModelGateway] Provider ${currentProviderId} overloaded, falling back.`);
           continue;
         } else {
           throw bpError;
         }
      }

      activeRequests.set(currentProviderId, currentActive + 1);

      // MCP Gateway Logic
      if (settings.mcp_gateway && settings.mcp_gateway.trim().length > 0) {
        const mcpAdapter = adapters.mcp;
        if (mcpAdapter) {
          const originalModel = settings.model_name || 'default';
          let mcpProviderId = currentProviderId;
          if (mcpProviderId === 'openai_responses') mcpProviderId = 'openai';
          
          providerMergedSettings.endpoint_url = settings.mcp_gateway;
          providerMergedSettings.model_name = `${mcpProviderId}:${originalModel}`;
          currentProvider = mcpAdapter;
        }
      }

      try {
        let chatStream;
        
        // Emulate streaming if needed
        if (options.stream && currentProvider.capabilities && !currentProvider.capabilities.stream) {
          const fallbackOptions = { ...options, stream: false };
          const tempStream = currentProvider.handleChat(messages, providerMergedSettings, fallbackOptions);
          
          let fullText = '';
          let finalUsage = null;
          for await (const event of tempStream) {
            if (event.type === 'error') throw event;
            if (event.type === 'delta') fullText += event.text;
            if (event.type === 'done') finalUsage = event.usage;
          }
          chatStream = this._createEmulatedAsyncIterable(fullText, finalUsage);
        } else {
          chatStream = currentProvider.handleChat(messages, providerMergedSettings, options);
        }

        // Test connection
        const iterator = chatStream[Symbol.asyncIterator]();
        const firstResult = await iterator.next();

        if (!firstResult.done && firstResult.value && firstResult.value.type === 'error') {
          throw firstResult.value;
        }

        // Yield provider info first (meta event)
        yield { 
          type: 'provider_selected', 
          providerId: currentProviderId, 
          providerName: currentProvider.name,
          model: settings.model_name
        };

        // Reassemble and yield the rest
        if (!firstResult.done) yield firstResult.value;
        for await (const item of iterator) {
          yield item;
        }

        traceBus.emitTrace('ModelGateway', 'model.completed', {
           providerId: currentProviderId,
           model: settings.model_name,
           latencyMs: Date.now() - startTimeMs
        });

        activeRequests.set(currentProviderId, Math.max(0, (activeRequests.get(currentProviderId) || 1) - 1));
        return; // Success

      } catch (err) {
        activeRequests.set(currentProviderId, Math.max(0, (activeRequests.get(currentProviderId) || 1) - 1));
        
        traceBus.emitTrace('ModelGateway', 'model.failed', { 
          providerId: currentProviderId, 
          model: settings.model_name,
          error: err.message,
          latencyMs: Date.now() - startTimeMs
        });

        if (err.message === 'Client disconnected') throw err;
        
        lastError = err;
        if (fallbackPolicy.shouldFallback(err)) {
          console.warn(`[ModelGateway] Provider "${currentProviderId}" failed (${err.message}). Falling back.`);
          continue;
        } else {
          break;
        }
      }
    }

    if (lastError) {
      throw lastError;
    }
  }

  async *_createEmulatedAsyncIterable(text, usage) {
    const ProviderEvents = require('../providers/providerEvents');
    const chunkSize = 20;
    let i = 0;
    while (i < text.length) {
      const content = text.slice(i, i + chunkSize);
      i += chunkSize;
      yield ProviderEvents.delta(content);
      await new Promise(r => setTimeout(r, 10));
    }
    yield ProviderEvents.done('stop', usage);
  }
}

module.exports = new ModelGateway();
