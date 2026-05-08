
const categoryRepository = require('../admin/category.repository');
const policyRouter = require('./policyRouter');
const modelGateway = require('./model.gateway');
const mapper = require('./chat_completion.mapper');
const missionBinding = require('./mission_binding.service');
const providersConfig = require('../../core/providers.config');
const { PROVIDER_TIMEOUT, SEMANTIC_LAYER_ENABLED, AGENT_RUNS_ENABLED, KNOWLEDGE_GATEWAY_ENABLED } = require('../../core/config');
const { validateProviderUrl } = require('../../core/utils');
const traceBus = require('../observability/trace.bus');

// Agent Execution (lazy-loaded)
let _agentRunService = null;
function getAgentRunService() {
  if (!_agentRunService) {
    _agentRunService = require('../execution/run.service');
  }
  return _agentRunService;
}

// Semantic Layer (lazy-loaded)
let _semanticProtocol = null;
function getSemanticProtocol() {
  if (!_semanticProtocol) {
    const { SemanticProtocol } = require('../semantic/semantic.protocol');
    _semanticProtocol = new SemanticProtocol();
  }
  return _semanticProtocol;
}

// Knowledge Gateway (lazy-loaded)
let _knowledgeGateway = null;
function getKnowledgeGateway() {
  if (!_knowledgeGateway) {
    _knowledgeGateway = require('../knowledge/knowledge.gateway');
  }
  return _knowledgeGateway;
}

class ChatService {
  /**
   * Heavy Path execution: RAG, AgentRuns, Semantic Layer.
   */
  async handleCompletion({ user, body, catSettings, res, missionId }) {
    const runId = body.run_id || body.runId;

    // 1. Resolve Route
    const route = policyRouter.resolveRoute(catSettings);
    const startTimestamp = Date.now();
    traceBus.emitTrace('ChatService', 'model.requested', { 
      providerId: route.providerId, 
      modelName: catSettings.model_name,
      runId 
    });
    // 2. Prepare Messages & Options
    const { messages: baseMessages, injectionDetected } = mapper.prepareMessages({ 
      messages: body.messages, 
      user, 
      categorySettings: catSettings 
    });
    
    const { options, mergedSettings } = mapper.mapOptions(body, catSettings, user);

    if (injectionDetected) {
      console.warn(`[Security] Prompt injection attempt detected for user: ${user.username}`);
      missionBinding.addConflict(missionId, { type: 'SECURITY_INJECTION', message: 'Prompt injection detected' });
    }

    if (runId && AGENT_RUNS_ENABLED) {
      await getAgentRunService().updateState(runId, 'running');
    }

    // 3. Knowledge Gateway Retrieval
    let retrievalResult = null;
    let messages = [...baseMessages];

    if (KNOWLEDGE_GATEWAY_ENABLED && catSettings.rag_enabled) {
      const kgw = getKnowledgeGateway();
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      const query = lastUserMessage?.content || '';
      
      retrievalResult = await kgw.retrieve(query, { settings: catSettings, sessionId: body.session_id || body.sessionId });
      
      if (runId && AGENT_RUNS_ENABLED) {
        getAgentRunService().emitEvent(runId, 'retrieval.completed', { 
          chunkCount: retrievalResult.chunks.length,
          mode: retrievalResult.mode,
          latencyMs: retrievalResult.metadata.latencyMs
        });
      }

      if (retrievalResult.metadata.shouldRefuse) {
        return this._handleRefusal(res, retrievalResult, runId);
      }

      const contextText = kgw.formatContext(retrievalResult);
      if (contextText) {
        let injected = false;
        messages = messages.map(m => {
          if (!injected && m.role === 'user' && m.content === query) {
            injected = true;
            return { ...m, content: `${contextText}\n\nUser Query: ${m.content}` };
          }
          return m;
        });
      }
    }

    // 4. SSRF Validation
    const providerCfg = providersConfig[route.providerId] || {};
    const effectiveEndpointUrl = providerCfg.endpoint_url || null;
    const isLocalProvider = ['llamacpp', 'ollama', 'mcp', 'deterministic'].includes(providerCfg.adapter);
    if (effectiveEndpointUrl) {
      validateProviderUrl(effectiveEndpointUrl, isLocalProvider);
    }

    // 5. Abort Control
    const ac = new AbortController();
    const reqCloseHandler = () => ac.abort(new Error('Client disconnected'));
    res.req.on('close', reqCloseHandler);
    const timeoutId = setTimeout(() => ac.abort(new Error('Provider timeout')), PROVIDER_TIMEOUT);

    try {
      // 6. Call ModelGateway
      const stream = await modelGateway.handleChat({
        messages,
        settings: {
          ...mergedSettings,
          endpoint_url: effectiveEndpointUrl,
          api_key: providerCfg.api_key
        },
        options: { ...options, signal: ac.signal },
        route
      });

      // 7. Stream Response & Intercept Events
      await this._processHeavyStream({ 
        stream, res, modelName: catSettings.model_name, isStreaming: options.stream, 
        runId, missionId, retrievalResult, body, user, startTimestamp 
      });

    } catch (err) {
      if (err.message !== 'Client disconnected') {
        this._handleError(err, route.providerId, res, runId);
      }
    } finally {
      clearTimeout(timeoutId);
      res.req.off('close', reqCloseHandler);
    }
  }

  async _processHeavyStream({ stream, res, modelName, isStreaming, runId, missionId, retrievalResult, body, user, startTimestamp }) {
    let fullText = '';
    let finalUsage = null;
    let finalFinishReason = 'stop';
    let providerId = 'unknown';

    for await (const event of stream) {
      if (event.type === 'provider_selected') {
        providerId = event.providerId;
        continue;
      }

      if (isStreaming) {
        if (!res.headersSent) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });
        }

        if (event.type === 'delta') {
          const chunk = mapper.buildChunk(modelName, event.text);
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          if (runId && AGENT_RUNS_ENABLED) {
            getAgentRunService().emitEvent(runId, 'model.delta', { content: event.text, role: 'assistant' });
          }
        } else if (event.type === 'tool_call') {
          const chunk = mapper.buildChunk(modelName, null, null, event.toolCall);
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          if (runId && AGENT_RUNS_ENABLED) {
            getAgentRunService().emitEvent(runId, 'tool.call_started', { 
              toolName: event.toolCall.function?.name,
              arguments: event.toolCall.function?.arguments
            });
          }
        } else if (event.type === 'done') {
          const chunk = mapper.buildChunk(modelName, '', event.finishReason || 'stop');
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          res.write('data: [DONE]\n\n');
          if (runId && AGENT_RUNS_ENABLED) {
             getAgentRunService().emitEvent(runId, 'model.step_completed', { 
               finishReason: event.finishReason || 'stop',
               usage: event.usage 
             });
          }
        }
      } else {
        if (event.type === 'delta') {
          fullText += event.text;
        } else if (event.type === 'done') {
          finalUsage = event.usage;
          finalFinishReason = event.finishReason || 'stop';
        }
      }
    }

    if (!isStreaming) {
      const responseData = mapper.buildResponse(modelName, fullText, finalUsage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
      responseData.choices[0].finish_reason = finalFinishReason;

      if (runId && AGENT_RUNS_ENABLED) {
        const ars = getAgentRunService();
        ars.emitEvent(runId, 'model.delta', { content: fullText, role: 'assistant' });
        ars.emitEvent(runId, 'model.step_completed', { finishReason: finalFinishReason, usage: finalUsage });
      }

      // Semantic Layer Analysis
      if (SEMANTIC_LAYER_ENABLED && fullText) {
        await this._applySemanticAnalysis(fullText, responseData, missionId, body.session_id, user);
      }

      if (retrievalResult) {
        responseData._retrieval = retrievalResult;
      }

      res.json(responseData);
    }

    if (runId && AGENT_RUNS_ENABLED) {
      await getAgentRunService().updateState(runId, 'completed');
    }

    traceBus.emitTrace('ChatService', 'model.completed', { 
      providerId, 
      modelName, 
      latencyMs: Date.now() - startTimestamp,
      runId 
    });
  }

  async _applySemanticAnalysis(text, responseData, missionId, sessionId, user) {
    try {
      const sp = getSemanticProtocol();
      const resolvedSessionId = sessionId || missionBinding.getSessionId(missionId) || `chat-${Date.now()}`;
      const result = await sp.analyze(text, resolvedSessionId, {
        username: user?.username || 'system',
        missionId
      });
      
      responseData._semantic = {
        protocolId: sp.getProtocol().protocolId,
        claimsTotal: result.summary.total,
        downgradedCount: result.summary.downgradedCount,
        violationCount: result.summary.violationCount,
        missionId
      };

      if (result.violations.length > 0) {
        result.events.filter(e => e.type.includes('blocked') || e.type.includes('violation')).forEach(ev => {
          missionBinding.addConflict(missionId, ev);
        });
      }
      
      result.claims.slice(0, 3).forEach(c => {
        if (c.strength === 'fact' || c.strength === 'strong_inference') {
          missionBinding.addDistinction(missionId, c.text);
        }
      });
    } catch (semErr) {
      console.error('[Semantic] Analysis failed (non-blocking):', semErr.message);
    }
  }

  _handleRefusal(res, retrievalResult, runId) {
    const refusalMessage = "I don't have enough information in the provided context to answer this query.";
    if (runId && AGENT_RUNS_ENABLED) {
      getAgentRunService().emitEvent(runId, 'model.delta', { content: refusalMessage, role: 'assistant' });
      getAgentRunService().updateState(runId, 'completed').catch(console.error);
    }
    const response = mapper.buildResponse(null, refusalMessage, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
    return res.json({
      ...response,
      _retrieval: retrievalResult
    });
  }

  _handleError(err, providerId, res, runId) {
    console.error(`[ChatService Error - ${providerId}]`, err.message);
    const status = err.status || 502;
    const errorPayload = {
      error: { code: err.code || 'provider_error', message: err.message, details: err.details || null }
    };

    if (runId && AGENT_RUNS_ENABLED) {
      getAgentRunService().updateState(runId, 'failed', { error: errorPayload.error }).catch(console.error);
    }
    
    traceBus.emitTrace('ChatService', 'model.failed', { providerId, error: err.message, code: err.code });

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(status).json(errorPayload);
    }
  }
}

module.exports = new ChatService();
