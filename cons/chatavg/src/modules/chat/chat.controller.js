
const categoryRepository = require('../admin/category.repository');
const chatService = require('./chat.service');
const fastChatService = require('./fast_chat.service');
const missionBinding = require('./mission_binding.service');
const { AGENT_RUNS_ENABLED } = require('../../core/config');

function getAgentRunService() {
  return require('../execution/run.service');
}

class ChatController {
  async handleCompletion(req, res) {
    const { user, body } = req;
    const catSettings = await categoryRepository.findByName(user.category) || {};

    // 1. Determine Path (Fast Path Isolation)
    const isFastPath = !catSettings.mcp_gateway && !catSettings.rag_enabled && !catSettings.sandbox_enabled && !body.run_id && !body.runId;
    
    // 2. Mission Binding (always needed for tracking)
    let missionId = body.mission_id || body.missionId;
    const runId = body.run_id || body.runId;

    if (!missionId && runId && AGENT_RUNS_ENABLED) {
      const run = await getAgentRunService().getRun(runId);
      if (run) missionId = run.mission_id || run.missionId;
    }

    missionId = missionBinding.ensureMission({ ...body, missionId }, user);

    if (isFastPath) {
      console.log(`[ChatController] Routing to Fast Path for user=${user.username}`);
      try {
        const stream = await fastChatService.handleFastCompletion({ user, body, catSettings });
        return this._streamToResponse(stream, res, catSettings.model_name, body.stream);
      } catch (err) {
        return this._handleError(err, res);
      }
    }

    // 3. Heavy Path (AgentRuns, RAG, etc.)
    console.log(`[ChatController] Routing to Heavy Path for user=${user.username}`);
    return chatService.handleCompletion({ user, body, catSettings, res, missionId });
  }

  async _streamToResponse(stream, res, modelName, isStreaming) {
    let providerInfo = null;
    let fullText = '';
    let finalUsage = null;
    let finalFinishReason = 'stop';

    // Set up AbortController for the stream
    const ac = new AbortController();
    const reqCloseHandler = () => ac.abort();
    res.req.on('close', reqCloseHandler);

    try {
      for await (const event of stream) {
        if (event.type === 'provider_selected') {
          providerInfo = event;
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
            const chunk = this._buildChunk(modelName, event.text);
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          } else if (event.type === 'tool_call') {
            const chunk = this._buildChunk(modelName, null, null, event.toolCall);
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          } else if (event.type === 'done') {
            const chunk = this._buildChunk(modelName, '', event.finishReason || 'stop');
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            res.write('data: [DONE]\n\n');
          }
        } else {
          // Buffering for JSON response
          if (event.type === 'delta') {
            fullText += event.text;
          } else if (event.type === 'done') {
            finalUsage = event.usage;
            finalFinishReason = event.finishReason || 'stop';
          }
        }
      }

      if (!isStreaming) {
        const responseData = this._buildResponse(modelName, fullText, finalUsage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
        responseData.choices[0].finish_reason = finalFinishReason;
        res.json(responseData);
      } else {
        res.end();
      }
    } catch (err) {
      this._handleError(err, res, providerInfo?.providerId);
    } finally {
      res.req.off('close', reqCloseHandler);
    }
  }

  _buildChunk(model, text, finishReason = null, toolCall = null) {
    return {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: model || 'default',
      choices: [{
        index: 0,
        delta: toolCall ? { tool_calls: [toolCall] } : (text !== null ? { content: text } : {}),
        finish_reason: finishReason
      }]
    };
  }

  _buildResponse(model, text, usage) {
    return {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || 'default',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: text },
        finish_reason: 'stop'
      }],
      usage: usage
    };
  }

  _handleError(err, res, providerId = 'unknown') {
    console.error(`[ChatController Error]`, err.message);
    const status = err.status || 502;
    const errorPayload = {
      error: {
        code: err.code || 'provider_error',
        message: err.message,
        details: err.details || null
      }
    };

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(status).json(errorPayload);
    }
  }
}

module.exports = new ChatController();
