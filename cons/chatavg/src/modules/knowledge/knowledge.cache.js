
/**
 * KnowledgeCache — simple in-memory cache for RetrievalResults.
 * Uses normalized query as key.
 */
class KnowledgeCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 3600000; // 1 hour
    this.maxSize = options.maxSize || 1000;
  }

  /**
   * Get cached result for a query.
   * @param {string} query 
   * @returns {Object|null}
   */
  get(query) {
    const key = this._normalize(query);
    const cached = this.cache.get(key);

    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  /**
   * Set result in cache.
   * @param {string} query 
   * @param {Object} result 
   */
  set(query, result) {
    if (this.cache.size >= this.maxSize) {
      // Simple LRU: delete first key
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const key = this._normalize(query);
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + this.ttl
    });
  }

  /**
   * Clear cache.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Normalize query for better cache hits.
   * @private
   */
  _normalize(query) {
    return query.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}

module.exports = new KnowledgeCache();
