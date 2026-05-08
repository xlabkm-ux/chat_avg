
const knowledgeRouter = require('./knowledge.router');
const { RetrievalResult } = require('./knowledge.types');
const knowledgeCache = require('./knowledge.cache');
const { KNOWLEDGE_GATEWAY_ENABLED } = require('../../core/config');
const SQLiteFTSRetriever = require('./adapters/sqlite_fts.adapter');

const traceBus = require('../observability/trace.bus');

class KnowledgeGateway {
  constructor() {
    this.retrievers = new Map();
    this._setupDefaultRetriever();
  }

  /**
   * Main retrieval entry point.
   * @param {string} query 
   * @param {Object} options { settings, sessionId }
   */
  async retrieve(query, options = {}) {
    const startTime = Date.now();
    traceBus.emitTrace('KnowledgeGateway', 'retrieval.started', { query: query.substring(0, 100) });

    if (!KNOWLEDGE_GATEWAY_ENABLED) {
      const res = new RetrievalResult({ query, mode: 'no_retrieval' });
      traceBus.emitTrace('KnowledgeGateway', 'retrieval.completed', { mode: 'no_retrieval', latencyMs: Date.now() - startTime });
      return res;
    }

    const { settings = {} } = options;
    
    // 1. Resolve mode (Router)
    const routerStart = Date.now();
    const { mode, config } = knowledgeRouter.resolveMode(query, settings);
    const routerMs = Date.now() - routerStart;
    
    if (mode === 'no_retrieval') {
      const res = new RetrievalResult({ query, mode, metadata: { routerMs, latencyMs: Date.now() - startTime } });
      traceBus.emitTrace('KnowledgeGateway', 'retrieval.completed', { mode: 'no_retrieval', latencyMs: Date.now() - startTime });
      return res;
    }

    // 1.1 Check Cache
    const cachedResult = knowledgeCache.get(query);
    if (cachedResult) {
      console.log(`[KnowledgeGW] Cache HIT for query="${query.substring(0, 50)}..."`);
      cachedResult.metadata.cacheHit = true;
      cachedResult.metadata.latencyMs = Date.now() - startTime;
      traceBus.emitTrace('KnowledgeGateway', 'retrieval.completed', { mode: cachedResult.mode, cacheHit: true, latencyMs: Date.now() - startTime });
      return cachedResult;
    }

    console.log(`[KnowledgeGW] Retrieving for query="${query.substring(0, 50)}..." mode=${mode}`);

    try {
      // 2. Execute retrieval (Retriever)
      const retrieverId = settings.retriever_id || 'default';
      let retriever = this.retrievers.get(retrieverId);
      
      if (!retriever) {
        console.warn(`[KnowledgeGW] Retriever not found: ${retrieverId}. Falling back to default.`);
        retriever = this.retrievers.get('default');
      }

      const retrieverStart = Date.now();
      const chunks = await retriever.search(query, config);
      const retrieverMs = Date.now() - retrieverStart;
      
      // 3. Validation (SPEC-015)
      const validationStart = Date.now();
      const result = new RetrievalResult({
        query,
        mode,
        chunks,
        metadata: {
          routerMs,
          retrieverMs,
          retrieverId
        }
      });
      result.validate();
      const validationMs = Date.now() - validationStart;

      // 4. Apply Answerability Policy (SPEC-014)
      result.metadata.validationMs = validationMs;
      result.metadata.latencyMs = Date.now() - startTime;
      
      const finalResult = this._applyPolicy(result, settings.rag_answerability_policy || 'balanced');
      
      // 5. Cache Result (only if not an error)
      if (!finalResult.metadata.error) {
        knowledgeCache.set(query, finalResult);
      }

      traceBus.emitTrace('KnowledgeGateway', 'retrieval.completed', { 
        mode: finalResult.mode, 
        chunkCount: finalResult.chunks.length, 
        latencyMs: finalResult.metadata.latencyMs 
      });

      return finalResult;

    } catch (error) {
      console.error(`[KnowledgeGW] Retrieval failed: ${error.message}`);
      traceBus.emitTrace('KnowledgeGateway', 'retrieval.failed', { error: error.message, latencyMs: Date.now() - startTime });
      // Fallback to empty result instead of crashing the chat
      return new RetrievalResult({
        query,
        mode,
        metadata: { error: error.message, latencyMs: Date.now() - startTime }
      });
    }
  }

  /**
   * Registers a new retriever adapter.
   */
  registerRetriever(id, adapter) {
    this.retrievers.set(id, adapter);
  }

  /**
   * Setup default retriever (SQLite FTS5).
   * @private
   */
  _setupDefaultRetriever() {
    this.registerRetriever('default', new SQLiteFTSRetriever());
    this.registerRetriever('mock', {
      search: async () => []
    });
  }

  /**
   * Enforces answerability policy (SPEC-014).
   * @private
   */
  _applyPolicy(result, policy = 'balanced') {
    const RAG_MIN_SCORE = 0.3; // Lowered for FTS5 MVP
    const maxScore = result.chunks.length > 0 ? Math.max(...result.chunks.map(c => c.score)) : 0;
    
    if (result.chunks.length === 0 || maxScore < RAG_MIN_SCORE) {
      result.metadata.policyAction = result.chunks.length === 0 ? 'empty_context' : 'low_quality_context';
      
      if (policy === 'refusal') {
        result.metadata.shouldRefuse = true;
      } else if (policy === 'fast') {
        // Fast policy might allow answering even with low quality if mode is fast
        result.metadata.shouldRefuse = false;
      }
    }
    return result;
  }

  /**
   * Wraps retrieved chunks into a system-visible prompt block (SPEC-015).
   */
  formatContext(result) {
    if (!result || result.chunks.length === 0) return '';

    let output = "\n--- RETRIEVED CONTEXT START ---\n";
    output += `The following information was retrieved from the knowledge base (Mode: ${result.mode}).\n\n`;
    
    result.chunks.forEach((chunk, index) => {
      output += `<context_boundary index="${index}">\n`;
      output += `Source: ${chunk.provenance.title || 'Untitled'} (${chunk.provenance.uri || 'no-uri'})\n`;
      output += `Relevance: ${(chunk.score * 100).toFixed(1)}%\n`;
      output += `---\n`;
      output += chunk.text;
      output += `\n</context_boundary>\n\n`;
    });
    
    output += "--- RETRIEVED CONTEXT END ---\n";
    return output;
  }
}

module.exports = new KnowledgeGateway();
