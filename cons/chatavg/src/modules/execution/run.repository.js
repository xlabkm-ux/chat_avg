const db = require('../../core/sqlite');
const { v4: uuidv4 } = require('uuid');

class AgentRunRepository {
  create(runData) {
    const id = runData.id || uuidv4();
    const now = Date.now();
    
    const stmt = db.prepare(`
      INSERT INTO agent_runs (
        id, mission_id, state, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      runData.missionId,
      runData.state || 'queued',
      JSON.stringify(runData.metadata || {}),
      now,
      now
    );

    return this.findById(id);
  }

  findById(id) {
    const run = db.prepare('SELECT * FROM agent_runs WHERE id = ?').get(id);
    if (!run) return null;

    return {
      ...run,
      metadata: JSON.parse(run.metadata)
    };
  }

  findByMission(missionId) {
    const runs = db.prepare('SELECT * FROM agent_runs WHERE mission_id = ? ORDER BY created_at DESC').all(missionId);
    return runs.map(r => ({
      ...r,
      metadata: JSON.parse(r.metadata)
    }));
  }

  updateState(id, state, metadata = {}) {
    const now = Date.now();
    const current = this.findById(id);
    if (!current) throw new Error('Run not found');

    const mergedMetadata = { ...current.metadata, ...metadata };

    db.prepare(`
      UPDATE agent_runs 
      SET state = ?, metadata = ?, updated_at = ? 
      WHERE id = ?
    `).run(state, JSON.stringify(mergedMetadata), now, id);

    return this.findById(id);
  }
}

module.exports = new AgentRunRepository();
