/**
 * MCP Gateway Server v2.0
 * 
 * Refactored modular architecture:
 *   src/config.js    — Environment & provider config loading
 *   src/providers.js — OpenAI client registry (init, lookup)
 *   src/responses.js — Responses API conversion helpers
 *   src/tools.js     — MCP tool definitions (ai.chat, ai.responses, ai.models.list)
 *   server.js        — Express + MCP transport wiring (this file)
 */
import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import config from './src/config.js';
import logger from './src/logger.js';
import { initProviders } from './src/providers.js';
import { TOOLS } from './src/tools.js';
import { requestLogger } from './src/middleware/requestLogger.js';


// ─── Initialize Providers ───────────────────────────────────────────────
const registered = initProviders();
logger.info(`Initialized with ${registered.length} providers: ${registered.join(', ')}`);

// ─── Express App ────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// ─── MCP Server Factory ────────────────────────────────────────────────
function createMcpServer() {
  const mcp = new McpServer({
    name: 'mcp-gateway-server',
    version: '2.0.0',
  });
  for (const tool of TOOLS) {
    mcp.tool(tool.name, tool.description, tool.schema, tool.handler);
  }
  return mcp;
}

// ─── Session Management ────────────────────────────────────────────────
const sessions = new Map();

app.get('/mcp', async (req, res) => {
  const sessionId = randomUUID();
  logger.info(`New MCP session created: ${sessionId}`);

  const transport = new SSEServerTransport(`/mcp/message/${sessionId}`, res);
  sessions.set(sessionId, transport);

  res.on('close', () => {
    logger.info(`MCP session closed: ${sessionId}`);
    sessions.delete(sessionId);
  });

  const mcpServer = createMcpServer();
  await mcpServer.connect(transport);
});

app.post('/mcp/message/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const transport = sessions.get(sessionId);

  if (!transport) {
    logger.warn(`Session not found for message: ${sessionId}`);
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    await transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    logger.error(`Error handling MCP message for session ${sessionId}:`, error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Health & Info ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    providers: registered.length,
    activeSessions: sessions.size,
  });
});

// ─── Start ──────────────────────────────────────────────────────────────
const PORT = config.port;

app.listen(PORT, () => {
  logger.info('=========================================');
  logger.info(` MCP Gateway v2.0 — port ${PORT}`);
  logger.info(` SSE:    http://localhost:${PORT}/mcp`);
  logger.info(` Health: http://localhost:${PORT}/health`);
  logger.info('=========================================');
});
