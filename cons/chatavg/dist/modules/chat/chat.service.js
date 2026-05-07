"use strict";
const categoryRepository = require('../admin/category.repository');
const policyRouter = require('./policyRouter');
const fallbackPolicy = require('./fallbackPolicy');
const { getProvider, adapters } = require('../providers/provider.factory');
const providersConfig = require('../../core/providers.config');
const { ALLOWED_EXTRA_PARAMS, PROVIDER_TIMEOUT, SEMANTIC_LAYER_ENABLED, AGENT_RUNS_ENABLED, KNOWLEDGE_GATEWAY_ENABLED } = require('../../core/config');
const { validateProviderUrl, sanitizePromptText } = require('../../core/utils');
// Agent Execution (lazy-loaded)
let _agentRunService = null;
function getAgentRunService() {
    if (!_agentRunService) {
        _agentRunService = require('../execution/run.service');
    }
    return _agentRunService;
}
// Semantic Layer (lazy-loaded, behind feature flag)
let _semanticProtocol = null;
function getSemanticProtocol() {
    if (!_semanticProtocol) {
        const { SemanticProtocol } = require('../semantic/semantic.protocol');
        _semanticProtocol = new SemanticProtocol();
    }
    return _semanticProtocol;
}
// Knowledge Gateway (lazy-loaded, behind feature flag)
let _knowledgeGateway = null;
function getKnowledgeGateway() {
    if (!_knowledgeGateway) {
        _knowledgeGateway = require('../knowledge/knowledge.gateway');
    }
    return _knowledgeGateway;
}
// Execution Services (lazy-loaded)
let _roleRegistry = null;
function getRoleRegistry() {
    if (!_roleRegistry)
        _roleRegistry = require('../execution/role_pass');
    return _roleRegistry;
}
let _artifactService = null;
function getArtifactService() {
    if (!_artifactService)
        _artifactService = require('../execution/artifact.service');
    return _artifactService;
}
let _missionService = null;
function getMissionService() {
    if (!_missionService)
        _missionService = require('../execution/mission.service');
    return _missionService;
}
function pickAllowedExtraParams(input, allowed) {
    const out = {};
    if (!input || typeof input !== 'object')
        return out;
    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
            out[key] = input[key];
        }
    }
    return out;
}
class ChatService {
    async handleCompletion({ user, body, res }) {
        const catSettings = await categoryRepository.findByName(user.category) || {};
        // Fast Path Isolation
        const isFastPath = !catSettings.mcp_gateway && !catSettings.rag_enabled && !catSettings.sandbox_enabled;
        if (isFastPath) {
            console.log(`[Chat] Fast Path execution for user=${user.username} (Direct to Gateway, No RAG/Sandboxes)`);
        }
        // Resolve route and provider via Policy Router
        const route = policyRouter.resolveRoute(catSettings);
        // Fetch Provider & Model configuration from static config
        const providerCfg = providersConfig[route.providerId] || {};
        const modelCfg = (providerCfg.models && providerCfg.models[catSettings.model_name]) || {};
        const effectiveEndpointUrl = providerCfg.endpoint_url || null;
        const effectiveApiKey = providerCfg.api_key || null;
        // SSRF Validation
        const isLocalProvider = ['llamacpp', 'ollama', 'mcp', 'deterministic'].includes(providerCfg.adapter);
        if (effectiveEndpointUrl) {
            try {
                validateProviderUrl(effectiveEndpointUrl, isLocalProvider);
            }
            catch (err) {
                throw new Error(`SSRF Blocked (Provider): ${err.message}`);
            }
        }
        if (catSettings.mcp_gateway) {
            try {
                // MCP Gateway is trusted, allow local access
                validateProviderUrl(catSettings.mcp_gateway, true);
            }
            catch (err) {
                throw new Error(`SSRF Blocked (MCP Gateway): ${err.message}`);
            }
        }
        const providersToTry = [{ id: route.providerId, provider: route.provider }];
        if (route.fallbackProviderId && route.fallbackProviderId !== route.providerId) {
            const fallbackProvider = getProvider(route.fallbackProviderId);
            if (fallbackProvider) {
                providersToTry.push({ id: route.fallbackProviderId, provider: fallbackProvider });
            }
        }
        // Security: non-admins cannot send 'system' role messages.
        // Also, sanitize all user message content to prevent prompt injection.
        let injectionDetected = false;
        let messages = (body.messages || []).map(m => {
            if (m.role === 'user' && typeof m.content === 'string') {
                const sanitized = sanitizePromptText(m.content);
                if (sanitized !== m.content)
                    injectionDetected = true;
                return { ...m, content: sanitized };
            }
            return m;
        });
        // Mission & Adequacy Covenant Initialization
        const missionId = body.mission_id || body.missionId || `m-${Date.now()}`;
        const ms = getMissionService();
        if (!ms.getMission(missionId)) {
            ms.startMission({ id: missionId, goal: body.goal || 'Analysis' });
        }
        const adequacyCovenant = `
### ADEQUACY COVENANT
1. Do not exceed domain boundaries (Medical/Legal/Financial/Psychological).
2. Do not mix logical levels (Fact vs Value).
3. Do not assume hidden authority over the user's inner state.
4. If retrieval fails or is low-quality, explicitly state your limitations.
`;
        // Inject Covenant into System Prompt
        const hasSystem = messages.some(m => m.role === 'system');
        if (hasSystem) {
            messages = messages.map(m => m.role === 'system' ? { ...m, content: m.content + adequacyCovenant } : m);
        }
        else {
            messages = [{ role: 'system', content: adequacyCovenant }, ...messages];
        }
        if (injectionDetected) {
            console.warn(`[Security] Prompt injection attempt detected and sanitized for user: ${user.username}`);
            ms.addConflict(missionId, { type: 'SECURITY_INJECTION', message: 'Prompt injection detected' });
        }
        if (user.category !== 'Администратор') {
            messages = messages.filter(m => m.role !== 'system');
        }
        // Filter out messages with empty content if they don't have tool calls
        messages = messages.filter(m => (m.content && m.content.trim().length > 0) || (m.tool_calls && m.tool_calls.length > 0) || m.role === 'assistant');
        // Optimization: avoid full array copy if not necessary
        if (catSettings.system_prompt?.trim()) {
            if (messages.length > 0 && messages[0].role === 'system') {
                // Concatenate with existing system prompt instead of creating a new entry
                messages = [{
                        ...messages[0],
                        content: `${catSettings.system_prompt}\n\n${messages[0].content}`
                    }, ...messages.slice(1)];
            }
            else {
                // Prepend system prompt
                messages = [{ role: 'system', content: catSettings.system_prompt }, ...messages];
            }
        }
        // AbortController for client disconnect and timeout
        const ac = new AbortController();
        const reqCloseHandler = () => ac.abort(new Error('Client disconnected'));
        res.req.on('close', reqCloseHandler);
        // Configurable timeout
        const timeoutId = setTimeout(() => ac.abort(new Error('Provider timeout')), PROVIDER_TIMEOUT);
        // Options mapping
        const options = {
            stream: !!body.stream,
            max_tokens: parseInt(catSettings.max_tokens) || 1024,
            signal: ac.signal
        };
        // Merged settings & Extra params
        // Combine base config -> provider config -> model config -> category config
        const mergedSettings = {
            ...catSettings,
            endpoint_url: effectiveEndpointUrl,
            api_key: effectiveApiKey,
            extra_params: {
                ...(providerCfg.extra_params || {}),
                ...(modelCfg.extra_params || {}),
            }
        };
        // Allow overriding from request
        if (body.temperature !== undefined)
            mergedSettings.temperature = body.temperature;
        if (body.top_p !== undefined)
            mergedSettings.top_p = body.top_p;
        if (body.extra_params) {
            const allowedKeys = user.category === 'Администратор' ? ALLOWED_EXTRA_PARAMS.ADMIN : ALLOWED_EXTRA_PARAMS.USER;
            const safeParams = pickAllowedExtraParams(body.extra_params, allowedKeys);
            mergedSettings.extra_params = { ...mergedSettings.extra_params, ...safeParams };
        }
        const runId = body.run_id || body.runId;
        if (runId && AGENT_RUNS_ENABLED) {
            await getAgentRunService().updateState(runId, 'running');
        }
        console.log(`[Chat] user=${user.username} primary_provider=${route.providerId} model=${catSettings.model_name || 'default'} runId=${runId || 'none'}`);
        // Knowledge Gateway Retrieval Phase
        let retrievalResult = null;
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
                const refusalMessage = "I don't have enough information in the provided context to answer this query.";
                if (runId && AGENT_RUNS_ENABLED) {
                    getAgentRunService().emitEvent(runId, 'model.delta', { content: refusalMessage, role: 'assistant' });
                    await getAgentRunService().updateState(runId, 'completed');
                }
                return res.json({
                    choices: [{
                            message: { role: 'assistant', content: refusalMessage },
                            finish_reason: 'stop'
                        }],
                    _retrieval: retrievalResult
                });
            }
            const contextText = kgw.formatContext(retrievalResult);
            if (contextText) {
                // Inject context into the message list. 
                // We find the last user message and prepend context to it.
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
        let lastError = null;
        let finalProviderId = route.providerId;
        let finalProviderName = route.provider?.name;
        try {
            for (const currentProviderObj of providersToTry) {
                let currentProviderId = currentProviderObj.id;
                let currentProvider = currentProviderObj.provider;
                let providerMergedSettings = { ...mergedSettings };
                // MCP Gateway Logic: If mcp_gateway is set for this category, 
                // we route the request through the MCP adapter instead of the native one.
                if (catSettings.mcp_gateway && catSettings.mcp_gateway.trim().length > 0) {
                    const mcpAdapter = adapters.mcp;
                    if (mcpAdapter) {
                        console.log(`[Chat] Routing via MCP Gateway: ${catSettings.mcp_gateway}`);
                        // Format model as "provider:model" for the MCP gateway
                        const originalModel = catSettings.model_name || 'default';
                        let mcpProviderId = currentProviderId;
                        if (mcpProviderId === 'openai_responses') {
                            mcpProviderId = 'openai';
                        }
                        const mcpModel = `${mcpProviderId}:${originalModel}`;
                        providerMergedSettings.endpoint_url = catSettings.mcp_gateway;
                        providerMergedSettings.model_name = mcpModel;
                        currentProvider = mcpAdapter;
                    }
                }
                if (currentProviderId !== route.providerId) {
                    console.log(`[Chat] Falling back to provider=${currentProviderId} for user=${user.username}`);
                }
                try {
                    let chatStream;
                    // Emulate streaming if provider doesn't support it natively but client wants it
                    if (options.stream && currentProvider.capabilities && !currentProvider.capabilities.stream) {
                        const fallbackOptions = { ...options, stream: false };
                        const tempStream = currentProvider.handleChat(messages, providerMergedSettings, fallbackOptions);
                        let fullText = '';
                        let finalUsage = null;
                        for await (const event of tempStream) {
                            if (event.type === 'error') {
                                throw Object.assign(new Error(event.message), { status: event.status, code: event.code, isRetryable: event.isRetryable, details: event.details });
                            }
                            if (event.type === 'delta')
                                fullText += event.text;
                            if (event.type === 'done')
                                finalUsage = event.usage;
                        }
                        chatStream = this._createEmulatedAsyncIterable(fullText, finalUsage);
                    }
                    else {
                        chatStream = currentProvider.handleChat(messages, providerMergedSettings, options);
                    }
                    // Pull the first chunk to test connection before writing headers
                    const iterator = chatStream[Symbol.asyncIterator]();
                    const firstResult = await iterator.next();
                    if (!firstResult.done && firstResult.value && firstResult.value.type === 'error') {
                        const event = firstResult.value;
                        throw Object.assign(new Error(event.message), { status: event.status, code: event.code, isRetryable: event.isRetryable, details: event.details });
                    }
                    // Connection is successful, we can commit to this provider
                    finalProviderId = currentProviderId;
                    finalProviderName = currentProvider.name;
                    // Reassemble the stream
                    async function* reassembleStream(firstRes, iter) {
                        if (!firstRes.done)
                            yield firstRes.value;
                        for await (const item of iter) {
                            yield item;
                        }
                    }
                    const activeStream = reassembleStream(firstResult, iterator);
                    if (options.stream) {
                        res.writeHead(200, {
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                        });
                        for await (const event of activeStream) {
                            if (event.type === 'delta') {
                                const chunk = currentProvider.buildChunk(catSettings.model_name, event.text);
                                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                                if (runId && AGENT_RUNS_ENABLED) {
                                    getAgentRunService().emitEvent(runId, 'model.delta', { content: event.text, role: 'assistant' });
                                }
                            }
                            else if (event.type === 'tool_call') {
                                const chunk = currentProvider.buildChunk(catSettings.model_name, null, null, event.toolCall);
                                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                                if (runId && AGENT_RUNS_ENABLED) {
                                    getAgentRunService().emitEvent(runId, 'tool.call_started', {
                                        toolName: event.toolCall.function?.name,
                                        arguments: event.toolCall.function?.arguments
                                    });
                                }
                            }
                            else if (event.type === 'done') {
                                const chunk = currentProvider.buildChunk(catSettings.model_name, '', event.finishReason || 'stop');
                                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                                res.write('data: [DONE]\n\n');
                                if (runId && AGENT_RUNS_ENABLED) {
                                    getAgentRunService().emitEvent(runId, 'model.step_completed', {
                                        finishReason: event.finishReason || 'stop',
                                        usage: event.usage
                                    });
                                }
                            }
                            else if (event.type === 'error') {
                                const errorPayload = {
                                    error: {
                                        message: event.message,
                                        code: event.code || 'provider_error',
                                        details: event.details || null
                                    }
                                };
                                res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
                                res.write('data: [DONE]\n\n');
                            }
                        }
                        res.end();
                    }
                    else {
                        let fullText = '';
                        let finalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
                        let finalFinishReason = 'stop';
                        for await (const event of activeStream) {
                            if (event.type === 'delta') {
                                fullText += event.text;
                            }
                            else if (event.type === 'done') {
                                if (event.usage)
                                    finalUsage = event.usage;
                                if (event.finishReason)
                                    finalFinishReason = event.finishReason;
                            }
                            else if (event.type === 'error') {
                                throw new Error(event.message);
                            }
                        }
                        const responseData = currentProvider.buildResponse(catSettings.model_name, fullText, finalUsage);
                        responseData.choices[0].finish_reason = finalFinishReason;
                        if (runId && AGENT_RUNS_ENABLED) {
                            const ars = getAgentRunService();
                            ars.emitEvent(runId, 'model.delta', { content: fullText, role: 'assistant' });
                            ars.emitEvent(runId, 'model.step_completed', {
                                finishReason: finalFinishReason,
                                usage: finalUsage
                            });
                        }
                        // Semantic Layer: analyze response (non-streaming only, behind flag)
                        if (SEMANTIC_LAYER_ENABLED && fullText) {
                            try {
                                const sp = getSemanticProtocol();
                                const sessionId = body.session_id || `chat-${Date.now()}`;
                                const result = sp.analyze(fullText, sessionId);
                                if (result.violations.length > 0) {
                                    console.warn(`[Semantic] ${result.violations.length} violation(s) detected in response`);
                                }
                                if (result.summary.downgradedCount > 0) {
                                    console.log(`[Semantic] ${result.summary.downgradedCount} claim(s) downgraded out of ${result.summary.total}`);
                                }
                                // Attach semantic metadata to response
                                responseData._semantic = {
                                    protocolId: sp.getProtocol().protocolId,
                                    claimsTotal: result.summary.total,
                                    downgradedCount: result.summary.downgradedCount,
                                    violationCount: result.summary.violationCount,
                                    missionId
                                };
                                // Record conflicts in Mission Room
                                if (result.violations.length > 0) {
                                    result.events.filter(e => e.type.includes('blocked') || e.type.includes('violation')).forEach(ev => {
                                        ms.addConflict(missionId, ev);
                                    });
                                }
                                // Add significant distinctions (simplified: first 3 claims)
                                result.claims.slice(0, 3).forEach(c => {
                                    if (c.strength === 'fact' || c.strength === 'strong_inference') {
                                        ms.addDistinction(missionId, c.text);
                                    }
                                });
                            }
                            catch (semErr) {
                                console.error('[Semantic] Analysis failed (non-blocking):', semErr.message);
                            }
                        }
                        if (retrievalResult) {
                            responseData._retrieval = retrievalResult;
                        }
                        res.json(responseData);
                    }
                    // Successfully completed, break the retry loop
                    if (runId && AGENT_RUNS_ENABLED) {
                        await getAgentRunService().updateState(runId, 'completed');
                    }
                    lastError = null;
                    break;
                }
                catch (err) {
                    if (err.message === 'Client disconnected')
                        throw err; // Throw to outer block
                    lastError = err;
                    finalProviderId = currentProviderId;
                    finalProviderName = currentProvider.name;
                    if (res.headersSent) {
                        // Cannot fallback if we already started sending the response
                        break;
                    }
                    if (fallbackPolicy.shouldFallback(err)) {
                        console.warn(`[Fallback] Provider "${currentProviderId}" failed (${err.message}). Policy allows fallback.`);
                        continue;
                    }
                    else {
                        // Non-retryable error
                        break;
                    }
                }
            }
            if (lastError) {
                throw lastError;
            }
        }
        catch (err) {
            if (err.message === 'Client disconnected')
                return; // Ignore early disconnect
            this._handleError(err, finalProviderId, finalProviderName, res);
        }
        finally {
            clearTimeout(timeoutId);
            res.req.off('close', reqCloseHandler);
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
            // Small delay to simulate "typing"
            await new Promise(r => setTimeout(r, 10));
        }
        yield ProviderEvents.done('stop', usage);
    }
    _handleError(err, providerId, providerName, res) {
        console.error(`[ChatService Error - ${providerId}]`, err.message);
        const status = err.status || 502;
        const code = err.code || 'provider_error';
        const message = `${providerName || providerId}: ${err.message}`;
        const details = err.details || null;
        const errorPayload = {
            error: { code, message, details }
        };
        const runId = res.req?.body?.run_id || res.req?.body?.runId;
        if (runId && AGENT_RUNS_ENABLED) {
            getAgentRunService().updateState(runId, 'failed', { error: errorPayload.error }).catch(console.error);
        }
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
        }
        else {
            res.status(status).json(errorPayload);
        }
    }
}
module.exports = new ChatService();
//# sourceMappingURL=chat.service.js.map