
const knowledgeRepository = require('../knowledge.repository');

class SQLiteFTSRetriever {
  /**
   * Search for relevant chunks.
   * @param {string} query 
   * @param {Object} config { limit, minScore }
   */
  async search(query, config = {}) {
    const limit = config.limit || 5;
    const minScore = config.minScore || 0.1;

    try {
      // Basic FTS5 search
      const results = knowledgeRepository.search(query, limit);
      
      // Filter by score if needed
      return results.filter(r => r.score >= minScore);
    } catch (error) {
      console.error(`[SQLiteFTSRetriever] Search error: ${error.message}`);
      return [];
    }
  }
}

module.exports = SQLiteFTSRetriever;
