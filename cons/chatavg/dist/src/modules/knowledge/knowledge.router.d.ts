declare const _exports: KnowledgeRouter;
export = _exports;
/**
 * KnowledgeRouter
 * Selects the optimal retrieval mode based on query characteristics and user settings.
 */
declare class KnowledgeRouter {
    /**
     * Resolves the retrieval mode and configuration for a given query.
     * @param {string} query The user query.
     * @param {Object} settings Category or session RAG settings.
     * @returns {Object} { mode, config }
     */
    resolveMode(query: string, settings?: Object): Object;
    /**
     * Simple rule-based query classifier.
     * @private
     */
    private _classifyQuery;
    /**
     * Returns default configuration parameters for each mode.
     * @private
     */
    private _getConfigForMode;
}
