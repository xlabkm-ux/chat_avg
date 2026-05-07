declare const _exports: KnowledgeCache;
export = _exports;
/**
 * KnowledgeCache — simple in-memory cache for RetrievalResults.
 * Uses normalized query as key.
 */
declare class KnowledgeCache {
    constructor(options?: {});
    cache: Map<any, any>;
    ttl: any;
    maxSize: any;
    /**
     * Get cached result for a query.
     * @param {string} query
     * @returns {Object|null}
     */
    get(query: string): Object | null;
    /**
     * Set result in cache.
     * @param {string} query
     * @param {Object} result
     */
    set(query: string, result: Object): void;
    /**
     * Clear cache.
     */
    clear(): void;
    /**
     * Normalize query for better cache hits.
     * @private
     */
    private _normalize;
}
