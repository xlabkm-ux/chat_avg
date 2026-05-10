
const modelGateway = require('./model.gateway');
const mapper = require('./chat_completion.mapper');
const policyRouter = require('./policyRouter');
const { validateProviderUrl } = require('../../core/utils');
const providersConfig = require('../../core/providers.config');

class FastChatService {
  /**
   * Optimized path for simple chat completions.
   * Bypasses RAG, Sandboxes, and heavy AgentRun orchestration.
   */
  async handleFastCompletion({ user, body, catSettings }) {
    // 1. Resolve Route
    const route = policyRouter.resolveRoute(catSettings);
    
    // 2. Prepare Messages & Options
    const { messages, injectionDetected } = mapper.prepareMessages({ 
      messages: body.messages, 
      user, 
      categorySettings: catSettings 
    });
    
    const { options, mergedSettings } = mapper.mapOptions(body, catSettings, user);

    // 3. Simple SSRF check for the resolved provider
    const providerCfg = providersConfig[route.providerId] || {};
    const effectiveEndpointUrl = providerCfg.endpoint_url || null;
    const isLocalProvider = ['llamacpp', 'ollama', 'mcp', 'deterministic'].includes(providerCfg.adapter);
    if (effectiveEndpointUrl) {
      validateProviderUrl(effectiveEndpointUrl, isLocalProvider);
    }

    // 4. Call ModelGateway
    return modelGateway.handleChat({
      messages,
      settings: {
        // 1. Start with provider defaults from env
        ...providerCfg,
        // 2. Override with category explicit fields (model_name, temperature, etc.)
        ...mergedSettings,
        // 3. Override with Additional parameters (JSON) - highest priority for specific keys
        endpoint_url: mergedSettings.extra_params?.endpoint_url || mergedSettings.endpoint_url || providerCfg.endpoint_url,
        api_key: mergedSettings.extra_params?.api_key || mergedSettings.api_key || providerCfg.api_key
      },
      options,
      route
    });
  }
}

module.exports = new FastChatService();
