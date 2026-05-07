declare const _exports: KnowledgeGateway;
export = _exports;
declare class KnowledgeGateway {
    retrievers: Map<any, any>;
    /**
     * Main retrieval entry point.
     * @param {string} query
     * @param {Object} options { settings, sessionId }
     */
    retrieve(query: string, options?: Object): Promise<any>;
    /**
     * Registers a new retriever adapter.
     */
    registerRetriever(id: any, adapter: any): void;
    /**
     * Internal mock retriever for testing and initial development.
     * @private
     */
    private _setupDefaultRetriever;
    /**
     * Enforces answerability policy (SPEC-014).
     * @private
     */
    private _applyPolicy;
    /**
     * Wraps retrieved chunks into a system-visible prompt block (SPEC-015).
     */
    formatContext(result: any): string;
}
