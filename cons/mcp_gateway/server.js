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
      providers.set(name.toLowerCase(), new OpenAI({
        apiKey,
        baseURL: baseURL || undefined
      }));
    }
  }

  // Fallback if no providers configured
  if (providers.size === 0) {
    console.warn("[Init] No MCP providers found in .env. Using default dummy provider.");
    providers.set('default', new OpenAI({ apiKey: 'sk-dummy' }));
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

        const response = await client.chat.completions.create(params);

        console.log(`[ai.chat] Response received from ${providerName}`);

        return {
          content: [
            {
              type: "text",
              text: response.choices[0].message.content
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
