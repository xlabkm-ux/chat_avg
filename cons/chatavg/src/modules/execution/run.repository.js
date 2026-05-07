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

  findById(id, username) {
    const query = username 
      ? `SELECT agent_runs.* FROM agent_runs 
         JOIN missions ON agent_runs.mission_id = missions.id 
         WHERE agent_runs.id = ? AND missions.username = ?`
      : 'SELECT * FROM agent_runs WHERE id = ?';
    const params = username ? [id, username] : [id];
    const run = db.prepare(query).get(...params);
    if (!run) return null;

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
    if (!current) throw new Error('Run not found or unauthorized');

    const previousState = current.state;
    if (previousState === state) return current;

    // Strict State Machine Transitions
    const allowedTransitions = {
      'queued': ['running', 'cancelled'],
      'running': ['requires_action', 'waiting', 'completed', 'failed', 'cancelled'],
      'requires_action': ['running', 'cancelled'],
      'waiting': ['running', 'cancelled', 'expired'],
      'completed': [],
      'failed': [],
      'cancelled': [],
      'expired': []
    };

    if (!allowedTransitions[previousState] || !allowedTransitions[previousState].includes(state)) {
      throw new Error(`Invalid state transition: ${previousState} -> ${state}`);
    }

    const mergedMetadata = { ...current.metadata, ...metadata };

    db.prepare(`
      UPDATE agent_runs 
      SET state = ?, metadata = ?, updated_at = ? 
      WHERE id = ?
    `).run(state, JSON.stringify(mergedMetadata), now, id);

    return this.findById(id);
  }

  createEvent(runId, type, payload) {
    const id = uuidv4();
    const now = Date.now();
    db.prepare(`
      INSERT INTO agent_run_events (id, run_id, event_type, payload, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, runId, type, JSON.stringify(payload), now);
    
    return { id, runId, eventType: type, payload, createdAt: now };
  }

  getEvents(runId, sinceEventId = null, sinceTimestamp = null) {
    let query = 'SELECT * FROM agent_run_events WHERE run_id = ?';
    const params = [runId];

    if (sinceEventId) {
      // Find the timestamp of the sinceEventId
      const event = db.prepare('SELECT created_at FROM agent_run_events WHERE id = ?').get(sinceEventId);
      if (event) {
        query += ' AND created_at > ?';
        params.push(event.created_at);
      }
    } else if (sinceTimestamp) {
      query += ' AND created_at > ?';
      params.push(new Date(sinceTimestamp).getTime());
    }

    query += ' ORDER BY created_at ASC';
    const events = db.prepare(query).all(...params);
    return events.map(e => ({
      ...e,
      payload: JSON.parse(e.payload)
    }));
  }

  saveIdempotencyKey(key, responseCode, responseBody) {
    const now = Date.now();
    db.prepare(`
      INSERT OR REPLACE INTO idempotency_keys (key, response_code, response_body, created_at)
      VALUES (?, ?, ?, ?)
    `).run(key, responseCode, JSON.stringify(responseBody), now);
  }

  getIdempotencyKey(key) {
    const row = db.prepare('SELECT * FROM idempotency_keys WHERE key = ?').get(key);
    if (!row) return null;
    return {
      ...row,
      responseBody: JSON.parse(row.response_body)
    };
  }
}

module.exports = new AgentRunRepository();
