const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { SSEClientTransport } = require("@modelcontextprotocol/sdk/client/sse.js");
const BaseProvider = require('../base.provider');
const ProviderEvents = require('../providerEvents');
const { ProviderError } = require('../providerErrors');

class MCPProvider extends BaseProvider {
  constructor(config) {
    super({
      id: 'mcp',
      name: 'MCP Gateway Provider',
      models: config.models || ['mcp-default'],
      defaultModel: config.defaultModel || 'mcp-default',
      capabilities: { stream: true, tools: false }
    });
  }

  async *handleChat(messages, config, options) {
    const endpointUrl = config.endpoint_url;
    if (!endpointUrl) {
      throw new ProviderError("MCP provider requires an endpoint_url configured in the category settings", 400);
    }

    const transport = new SSEClientTransport(new URL(endpointUrl));
    const client = new Client(
      {
        name: "chatavg-gateway",
        version: "1.0.0"
      },
      {
        capabilities: {}
      }
    );

    try {
      console.log(`[MCP Adapter] Connecting to ${endpointUrl}...`);
      await client.connect(transport);
      console.log(`[MCP Adapter] Connected.`);
      
      const args = {
        messages,
        model: config.model_name || this.defaultModel,
        stream: !!options.stream,
      };
      
      if (config.temperature !== undefined) args.temperature = config.temperature;
      if (options.max_tokens) args.max_tokens = options.max_tokens;

      // Call the ai.chat tool on the MCP server
      const result = await client.callTool({
        name: "ai.chat",
        arguments: {
          ...args,
          extra_params: config.extra_params
        }
      });

      // Map response to CanonicalChatEvent
      if (result && result.content) {
        for (const block of result.content) {
          if (block.type === 'text') {
            yield ProviderEvents.delta(block.text);
          }
        }
      }
      
      yield ProviderEvents.done('stop', { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });

    } catch (err) {
      throw new ProviderError(`MCP Error: ${err.message}`, 502);
    } finally {
      if (transport.close) {
        try { await transport.close(); } catch(e){}
      }
    }
  }

  async checkHealth(config) {
    if (!config.endpoint_url) return false;
    try {
      const transport = new SSEClientTransport(new URL(config.endpoint_url));
      const client = new Client({ name: "health-check", version: "1.0.0" }, { capabilities: {} });
      await client.connect(transport);
      
      // Use the ai.models.list tool to check health and verify it's a valid gateway
      const result = await client.callTool({
        name: "ai.models.list",
        arguments: {}
      });

      // Optionally parse the response to dynamically update models list
      if (result && result.content && result.content[0]?.text) {
        try {
          const models = JSON.parse(result.content[0].text);
          if (Array.isArray(models) && models.length > 0) {
            this.models = models.map(m => m.id || m);
            if (!this.models.includes(this.defaultModel)) {
              this.defaultModel = this.models[0];
            }
          }
        } catch (e) {
          // ignore parsing errors
        }
      }

      if (transport.close) await transport.close();
      return true;
    } catch(e) {
      return false;
    }
  }
}

module.exports = new MCPProvider({
  id: 'mcp',
  name: 'MCP Gateway Provider',
  defaultModel: 'mcp-default',
  models: ['mcp-default']
});
