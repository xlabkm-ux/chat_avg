
const db = require('../../core/sqlite');
const crypto = require('crypto');

class KnowledgeRepository {
  /**
   * Sources
   */
  createSource({ uri, title, type, metadata = {} }) {
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    const checksum = crypto.createHash('md5').update(uri + title).digest('hex');

    db.prepare(`
      INSERT INTO knowledge_sources (id, uri, title, type, checksum, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, uri, title, type, checksum, JSON.stringify(metadata), createdAt);

    return { id, uri, title, type, checksum, metadata, createdAt };
  }

  getSource(id) {
    const row = db.prepare('SELECT * FROM knowledge_sources WHERE id = ?').get(id);
    if (!row) return null;
    return { ...row, metadata: JSON.parse(row.metadata) };
  }

  listSources() {
    return db.prepare('SELECT * FROM knowledge_sources ORDER BY created_at DESC').all().map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata)
    }));
  }

  deleteSource(id) {
    db.prepare('DELETE FROM knowledge_sources WHERE id = ?').run(id);
  }

  /**
   * Chunks
   */
  addChunks(sourceId, chunks) {
    const insert = db.prepare(`
      INSERT INTO knowledge_chunks (uuid, source_id, text, metadata, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const createdAt = Date.now();
    const results = [];

    db.transaction(() => {
      for (const chunk of chunks) {
        const uuid = crypto.randomUUID();
        const metadata = JSON.stringify(chunk.metadata || {});
        insert.run(uuid, sourceId, chunk.text, metadata, createdAt);
        results.push({ uuid, sourceId, text: chunk.text, metadata: chunk.metadata, createdAt });
      }
    })();

    return results;
  }

  /**
   * Search
   */
  search(query, limit = 5) {
    // Basic FTS5 search
    const rows = db.prepare(`
      SELECT 
        c.uuid, 
        c.source_id, 
        c.text, 
        c.metadata, 
        s.title as source_title, 
        s.uri as source_uri,
        bm.rank as score
      FROM knowledge_chunks_fts f
      JOIN knowledge_chunks c ON c.id = f.rowid
      JOIN knowledge_sources s ON s.id = c.source_id
      JOIN (
        SELECT rowid, rank 
        FROM knowledge_chunks_fts 
        WHERE text MATCH ?
      ) bm ON bm.rowid = f.rowid
      ORDER BY bm.rank
      LIMIT ?
    `).all(query, limit);

    return rows.map(row => ({
      id: row.uuid,
      sourceId: row.source_id,
      text: row.text,
      score: this._normalizeScore(row.score),
      provenance: {
        uri: row.source_uri,
        title: row.source_title,
        ...JSON.parse(row.metadata)
      }
    }));
  }

  _normalizeScore(rank) {
    // SQLite FTS5 rank: lower is better (usually negative)
    // We want a score between 0 and 1.
    // This is a very rough normalization for MVP.
    const score = 1 / (1 + Math.exp(rank)); 
    return Math.max(0, Math.min(1, score));
  }
}

module.exports = new KnowledgeRepository();
