"use strict";
/**
 * KnowledgeRouter
 * Selects the optimal retrieval mode based on query characteristics and user settings.
 */
class KnowledgeRouter {
    /**
     * Resolves the retrieval mode and configuration for a given query.
     * @param {string} query The user query.
     * @param {Object} settings Category or session RAG settings.
     * @returns {Object} { mode, config }
     */
    resolveMode(query, settings = {}) {
        // 0. Fast Path: Skip retrieval for trivial queries
        const normalized = query.trim().toLowerCase();
        const trivialWords = ['hi', 'hello', 'thanks', 'thank you', 'ok', 'yes', 'no', 'bye'];
        if (normalized.length < 5 || trivialWords.includes(normalized)) {
            return { mode: 'no_retrieval', config: {} };
        }
        // 1. Explicit override in settings takes priority
        if (settings.rag_mode && settings.rag_mode !== 'auto') {
            return {
                mode: settings.rag_mode,
                config: this._getConfigForMode(settings.rag_mode)
            };
        }
        // 2. Simple classification logic for 'auto' mode
        const mode = this._classifyQuery(query);
        return {
            mode,
            config: this._getConfigForMode(mode)
        };
    }
    /**
     * Simple rule-based query classifier.
     * @private
     */
    _classifyQuery(query) {
        if (!query || query.length < 10)
            return 'fast';
        const complexKeywords = ['compare', 'analyze', 'summarize', 'difference', 'relationship', 'history'];
        const isComplex = complexKeywords.some(k => query.toLowerCase().includes(k));
        if (isComplex || query.length > 100) {
            return 'balanced'; // We don't default to max_quality in auto mode to save costs
        }
        return 'fast';
    }
    /**
     * Returns default configuration parameters for each mode.
     * @private
     */
    _getConfigForMode(mode) {
        switch (mode) {
            case 'max_quality':
                return { topK: 10, searchDepth: 'deep', rerank: true, expansion: true };
            case 'balanced':
                return { topK: 5, searchDepth: 'standard', rerank: true, expansion: false };
            case 'fast':
            default:
                return { topK: 2, searchDepth: 'shallow', rerank: false, expansion: false };
        }
    }
}
module.exports = new KnowledgeRouter();
//# sourceMappingURL=knowledge.router.js.map