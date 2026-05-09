import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import OpenAI from 'openai';
import { z } from 'zod';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 8202;

// 1. Load and Initialize Providers
const providers = new Map();

function initProviders() {
  const envKeys = Object.keys(process.env);
  const providerNames = new Set();
  
  // Find all provider names from various conventions:
  // 1. MCP_PROVIDER_<NAME>_KEY
  // 2. MCP_<NAME>_KEY
  // 3. <NAME>_API_KEY (e.g. QWEN_API_KEY)
  for (const key of envKeys) {
    let match = key.match(/^MCP_PROVIDER_([A-Z0-9_]+)_KEY$/i);
    if (!match) match = key.match(/^MCP_([A-Z0-9_]+)_KEY$/i);
    if (!match) match = key.match(/^([A-Z0-9_]+)_API_KEY$/i);
    
    if (match) {
      providerNames.add(match[1].toUpperCase());
    }
  }

  for (const name of providerNames) {
    const apiKey = process.env[`MCP_${name}_KEY`] || 
                   process.env[`MCP_PROVIDER_${name}_KEY`] ||
                   process.env[`${name}_API_KEY`];
                   
    const baseURL = process.env[`MCP_${name}_URL`] || 
                    process.env[`MCP_PROVIDER_${name}_URL`] ||
                    process.env[`${name}_URL`];
    
    if (apiKey) {
      console.log(`[Init] Registering provider: ${name} (URL: ${baseURL || 'default'})`);
      const client = new OpenAI({
        apiKey,
        baseURL: baseURL || undefined
      });
      providers.set(name.toLowerCase(), client);
    }
  }

  // 1.5. Special handling for openai_responses: 
  // If it wasn't explicitly added via env vars, we can alias it from 'openai' as a fallback
  if (!providers.has('openai_responses') && providers.has('openai')) {
    console.log("[Init] Aliasing 'openai_responses' to 'openai' client (no dedicated key found)");
    providers.set('openai_responses', providers.get('openai'));
  }

  // Fallback if no providers configured
  if (providers.size === 0) {
    console.warn("[Init] No MCP providers found in .env. Using default dummy provider.");
    const dummyClient = new OpenAI({ apiKey: 'sk-dummy' });
    providers.set('default', dummyClient);
    providers.set('openai_responses', dummyClient);
  } else {
    console.log(`[Init] Total providers registered: ${Array.from(providers.keys()).join(', ')}`);
  }
}

initProviders();

// --- MCP Tool Definitions ---
const TOOLS = [
  {
    name: 'ai.chat',
    description: "Multi-provider chat completions proxy. Use model ID directly or with provider prefix (e.g. 'llama:model-id').",
    schema: {
      messages: z.array(
        z.object({
          role: z.string(),
          content: z.string()
        })
      ).describe("Array of chat messages"),
      model: z.string().describe("Model name (optionally prefixed with provider name, e.g. 'llama:gemma')"),
      temperature: z.number().optional().describe("Sampling temperature"),
      max_tokens: z.number().optional().describe("Maximum tokens to generate"),
      stream: z.boolean().optional().describe("Stream output"),
      extra_params: z.any().optional().describe("Additional provider-specific parameters")
    },
    handler: async ({ messages, model, temperature, max_tokens, extra_params }) => {
      try {
        let providerName = 'llama'; // Default if not specified
        let modelId = model;

        if (model.includes(':')) {
          [providerName, modelId] = model.split(':');
        }

        const client = providers.get(providerName.toLowerCase());
        if (!client) {
          throw new Error(`Provider "${providerName}" not found in MCP Gateway config.`);
        }

        console.log(`[ai.chat] Routing to ${providerName} | Model: ${modelId}`);
        
        let finalExtraParams = { ...extra_params };

        if (finalExtraParams?.tools) {
          console.log(`[ai.chat] Tools detected: ${JSON.stringify(finalExtraParams.tools)}`);
          
          // Proactive fix for Qwen: if web_search tool is present, use enable_search instead to avoid 400
          if (providerName.toLowerCase() === 'qwen' && Array.isArray(finalExtraParams.tools) && finalExtraParams.tools.some(t => t.type === 'web_search')) {
            console.log(`[ai.chat] Converting web_search tool to enable_search for Qwen`);
            finalExtraParams.enable_search = true;
            delete finalExtraParams.tools;
            delete finalExtraParams.tool_choice;
          }
        }
        
        const params = {
          messages,
          model: modelId,
          temperature,
          max_tokens,
          stream: false,
          ...finalExtraParams
        };

        let response;
        if (providerName.toLowerCase() === 'openai_responses' || finalExtraParams.prompt) {
          console.log(`[ai.chat] Using responses.create API for ${providerName}`);
          
          // Build params exactly as OpenAI Responses API expects
          const respParams = {};
          
          // Model (omit if prompt is provided, as model is baked into the prompt)
          if (modelId && modelId !== 'default' && !finalExtraParams.prompt) {
            respParams.model = modelId;
          }
          
          // Managed prompt
          if (finalExtraParams.prompt) {
            respParams.prompt = finalExtraParams.prompt;
            delete finalExtraParams.prompt;
          }
          
          // Input: use from extra_params, or convert messages, or empty array
          if (finalExtraParams.input !== undefined) {
            respParams.input = finalExtraParams.input;
            delete finalExtraParams.input;
          } else if (messages && messages.length > 0) {
            const instructions = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
            const input = messages.filter(m => m.role !== 'system').map(m => {
              const role = m.role === 'assistant' ? 'assistant' : 'user';
              return {
                role,
                content: [{ 
                  type: role === 'assistant' ? 'output_text' : 'input_text', 
                  text: m.content 
                }]
              };
            });
            if (instructions && !finalExtraParams.prompt) respParams.instructions = instructions;
            respParams.input = input;
          } else {
            respParams.input = [];
          }
          
          // Reasoning
          if (finalExtraParams.reasoning) {
            respParams.reasoning = finalExtraParams.reasoning;
            delete finalExtraParams.reasoning;
          }
          
          // Tools (file_search, web_search, etc.)
          if (finalExtraParams.tools) {
            respParams.tools = finalExtraParams.tools;
            delete finalExtraParams.tools;
          }
          
          // Store
          if (finalExtraParams.store !== undefined) {
            respParams.store = finalExtraParams.store;
            delete finalExtraParams.store;
          }
          
          // Include
          if (finalExtraParams.include) {
            respParams.include = finalExtraParams.include;
            delete finalExtraParams.include;
          }
          
          // Temperature
          if (temperature !== undefined) respParams.temperature = temperature;
          
          // Max tokens
          if (max_tokens) respParams.max_output_tokens = max_tokens;
          
          // Pass through any remaining extra_params
          delete finalExtraParams.messages;
          delete finalExtraParams.max_tokens;
          delete finalExtraParams.stream;
          delete finalExtraParams.model;
          Object.assign(respParams, finalExtraParams);

          console.log(`[ai.chat] Responses params:`, JSON.stringify(respParams, null, 2));
          
          const rawResponse = await client.responses.create(respParams);
          
          // Convert Responses format back to Chat Completion format
          let text = '';
          if (rawResponse.output) {
            for (const item of rawResponse.output) {
              if (item.type === 'message' && item.content) {
                for (const part of item.content) {
                  if (part.type === 'output_text') text += part.text;
                  if (part.type === 'reasoning_text') text = `<think>\n${part.text}\n</think>\n\n` + text;
                  if (part.type === 'reasoning_summary_text') text = `<think_summary>\n${part.text}\n</think_summary>\n\n` + text;
                }
              }
            }
          }

          response = {
            choices: [{
              message: { content: text || `Response completed (status: ${rawResponse.status})` }
            }]
          };
        } else {
          response = await client.chat.completions.create(params);
        }

        console.log(`[ai.chat] Response received from ${providerName}`);

        return {
          content: [
            {
              type: "text",
              text: `[MCP_GATEWAY_DEBUG] Provider: ${providerName} | Model: ${modelId}\n` + response.choices[0].message.content
            }
          ]
        };
      } catch (error) {
        console.error("[ai.chat] MCP Proxy error:", error.message);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `MCP Gateway Error: ${error.message}`
            }
          ]
        };
      }
    }
  },
  {
    name: 'ai.responses',
    description: "OpenAI Responses API (supports managed prompts, reasoning, and tools).",
    schema: {
      provider: z.string().describe("Provider name (e.g. 'openai' or 'openai_responses')"),
      model: z.string().optional().describe("Model name"),
      prompt: z.object({
        id: z.string(),
        version: z.string().optional()
      }).optional().describe("Managed prompt ID and version"),
      input: z.array(z.any()).optional().describe("Input array for the response"),
      instructions: z.string().optional().describe("Instructions for the response"),
      max_output_tokens: z.number().optional().describe("Maximum output tokens"),
      reasoning: z.any().optional().describe("Reasoning configuration (e.g. { summary: 'auto' })"),
      tools: z.array(z.any()).optional().describe("Tools configuration (including file_search)"),
      store: z.boolean().optional().describe("Whether to store the response"),
      include: z.array(z.string()).optional().describe("Fields to include in the response"),
      extra_params: z.any().optional().describe("Additional provider-specific parameters")
    },
    handler: async ({ provider, model, prompt, input, instructions, max_output_tokens, reasoning, tools, store, include, extra_params }) => {
      try {
        const providerName = (provider || 'openai_responses').toLowerCase();
        const client = providers.get(providerName);
        if (!client) {
          throw new Error(`Provider "${providerName}" not found in MCP Gateway config.`);
        }

        console.log(`[ai.responses] Routing to ${providerName} | Model: ${model || 'default'} | Prompt ID: ${prompt?.id || 'none'}`);

        const params = {
          model,
          prompt,
          input,
          instructions,
          max_output_tokens,
          reasoning,
          tools,
          store,
          include,
          ...extra_params
        };

        // Clean up undefined and handle prompt/model exclusion
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        
        if (params.prompt && params.model) {
          console.log(`[ai.responses] Removing model "${params.model}" because managed prompt is present.`);
          delete params.model;
        }

        const response = await client.responses.create(params);
        console.log(`[ai.responses] Response received from ${providerName}`);

        // Format response content
        let text = '';
        if (response.output) {
          for (const item of response.output) {
            if (item.type === 'message' && item.content) {
              for (const part of item.content) {
                if (part.type === 'output_text') text += part.text;
                if (part.type === 'reasoning_text') text = `<think>\n${part.text}\n</think>\n\n` + text;
                if (part.type === 'reasoning_summary_text') text = `<think_summary>\n${part.text}\n</think_summary>\n\n` + text;
              }
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: `[MCP_GATEWAY_DEBUG] Responses API | Provider: ${providerName} | Model: ${params.model || 'baked-in'}\n` + (text || `Response completed (status: ${response.status})`)
            }
          ]
        };
      } catch (error) {
        console.error("[ai.responses] Error:", error.message);
        return {
          isError: true,
          content: [{ type: "text", text: `MCP Responses Error: ${error.message}` }]
        };
      }
    }
  },
  {
    name: 'ai.models.list',
    description: "List available models from all configured proxy providers",
    schema: {},
    handler: async () => {
      try {
        console.log(`[ai.models.list] Aggregating models from ${providers.size} providers...`);
        const allModels = [];

        for (const [name, client] of providers.entries()) {
          try {
            const response = await client.models.list();
            const models = response.data.map(m => ({
              id: `${name}:${m.id}`,
              original_id: m.id,
              provider: name
            }));
            allModels.push(...models);
          } catch (err) {
            console.error(`[ai.models.list] Failed to fetch from ${name}:`, err.message);
          }
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(allModels, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error("[ai.models.list] Aggregation error:", error.message);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error aggregating models: ${error.message}`
            }
          ]
        };
      }
    }
  }
];

function createMcpServer() {
  const mcp = new McpServer({
    name: "mcp-gateway-server",
    version: "1.1.0"
  });
  for (const tool of TOOLS) {
    mcp.tool(tool.name, tool.description, tool.schema, tool.handler);
  }
  return mcp;
}

const transports = new Map();

// MCP Endpoint (SSE Stream)
app.get('/mcp', async (req, res) => {
  const sessionId = randomUUID();
  console.log(`[MCP] New connection, session: ${sessionId}`);
  
  const transport = new SSEServerTransport(`/mcp/message/${sessionId}`, res);
  transports.set(sessionId, transport);
  
  res.on('close', () => {
    console.log(`[MCP] Connection closed, session: ${sessionId}`);
    transports.delete(sessionId);
  });
  
  const mcpServer = createMcpServer();
  await mcpServer.connect(transport);
});

// MCP Endpoint (Message Post)
app.post('/mcp/message/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;
  console.log(`[MCP] POST message received for session: ${sessionId}. Active sessions: ${Array.from(transports.keys()).join(', ')}`);
  const transport = transports.get(sessionId);
  
  if (!transport) {
    console.error(`[MCP] Session ${sessionId} NOT FOUND!`);
    return res.status(404).json({ error: "Session not found" });
  }
  
  try {
    await transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error("[MCP] Error handling message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` MCP Gateway Server running on port ${PORT}`);
  console.log(` Endpoint: http://localhost:${PORT}/mcp`);
  console.log(`=========================================`);
});
