
/**
 * Canonical types for the Knowledge Module.
 * Based on SPEC-015.
 */

class RetrievalChunk {
  constructor({ id, sourceId, text, score, provenance, boundaryNotes }) {
    this.id = id;
    this.sourceId = sourceId;
    this.text = text;
    this.score = score || 0;
    this.provenance = provenance || {};
    this.boundaryNotes = boundaryNotes || '';
  }

  validate() {
    if (!this.id) throw new Error('RetrievalChunk: Missing id');
    if (!this.sourceId) throw new Error('RetrievalChunk: Missing sourceId');
    if (!this.text) throw new Error('RetrievalChunk: Missing text');
    if (this.score < 0 || this.score > 1) {
      console.warn(`RetrievalChunk: Score ${this.score} out of range [0, 1]. Normalizing...`);
      this.score = Math.max(0, Math.min(1, this.score));
    }
  }
}

class RetrievalResult {
  constructor({ query, mode, chunks = [], metadata = {} }) {
    this.query = query;
    this.mode = mode || 'balanced';
    this.chunks = chunks.map(c => new RetrievalChunk(c));
    this.metadata = {
      latencyMs: metadata.latencyMs || 0,
      routerMs: metadata.routerMs || 0,
      retrieverMs: metadata.retrieverMs || 0,
      validationMs: metadata.validationMs || 0,
      retrieverId: metadata.retrieverId || 'unknown',
      policyAction: metadata.policyAction || 'none',
      shouldRefuse: metadata.shouldRefuse || false,
      error: metadata.error || null
    };
  }

  validate() {
    if (!this.query) throw new Error('RetrievalResult: Missing query');
    this.chunks.forEach(c => c.validate());
  }
}

module.exports = {
  RetrievalChunk,
  RetrievalResult
};
