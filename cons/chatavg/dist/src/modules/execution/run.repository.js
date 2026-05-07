"use strict";
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
        stmt.run(id, runData.missionId, runData.state || 'queued', JSON.stringify(runData.metadata || {}), now, now);
        return this.findById(id);
    }
    findById(id, username) {
        const query = username
            ? `SELECT agent_runs.* FROM agent_runs 
         JOIN missions ON agent_runs.mission_id = missions.id 
         WHERE agent_runs.id = ? AND missions.username = ?`
            : 'SELECT * FROM agent_runs WHERE id = ?';
        const params = username ? [id, username] : [id];
        const run = db.prepare(query).get(...params);
        if (!run)
            return null;
        return {
            ...run,
            metadata: JSON.parse(run.metadata)
        };
    }
    findByMission(missionId, username) {
        const query = username
            ? `SELECT agent_runs.* FROM agent_runs 
         JOIN missions ON agent_runs.mission_id = missions.id 
         WHERE agent_runs.mission_id = ? AND missions.username = ? ORDER BY agent_runs.created_at DESC`
            : 'SELECT * FROM agent_runs WHERE mission_id = ? ORDER BY created_at DESC';
        const params = username ? [missionId, username] : [missionId];
        const runs = db.prepare(query).all(...params);
        return runs.map(r => ({
            ...r,
            metadata: JSON.parse(r.metadata)
        }));
    }
    updateState(id, state, metadata = {}, username) {
        const now = Date.now();
        const current = this.findById(id, username);
        if (!current)
            throw new Error('Run not found or unauthorized');
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
//# sourceMappingURL=run.repository.js.map