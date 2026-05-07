"use strict";
const db = require('../../core/sqlite');
const { v4: uuidv4 } = require('uuid');
class MissionRepository {
    create(missionData) {
        const id = missionData.id || uuidv4();
        const now = Date.now();
        const stmt = db.prepare(`
      INSERT INTO missions (
        id, session_id, username, semantic_protocol_id, glossary_version, 
        mode, goal, constraints, open_questions, context, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, missionData.sessionId, missionData.username, missionData.semanticProtocolId || null, missionData.glossaryVersion || null, missionData.mode || 'balanced', missionData.goal, JSON.stringify(missionData.constraints || []), JSON.stringify(missionData.openQuestions || []), JSON.stringify(missionData.context || {}), now, now);
        return this.findById(id);
    }
    findById(id, username) {
        const query = username
            ? 'SELECT * FROM missions WHERE id = ? AND username = ?'
            : 'SELECT * FROM missions WHERE id = ?';
        const params = username ? [id, username] : [id];
        const mission = db.prepare(query).get(...params);
        if (!mission)
            return null;
        return {
            ...mission,
            constraints: JSON.parse(mission.constraints),
            openQuestions: JSON.parse(mission.open_questions),
            context: JSON.parse(mission.context)
        };
    }
    findBySession(sessionId, username) {
        const missions = db.prepare('SELECT * FROM missions WHERE session_id = ? AND username = ? ORDER BY created_at DESC').all(sessionId, username);
        return missions.map(m => ({
            ...m,
            constraints: JSON.parse(m.constraints),
            openQuestions: JSON.parse(m.open_questions),
            context: JSON.parse(m.context)
        }));
    }
    update(id, missionData, username) {
        const now = Date.now();
        const fields = [];
        const values = [];
        if (missionData.goal !== undefined) {
            fields.push('goal = ?');
            values.push(missionData.goal);
        }
        if (missionData.mode !== undefined) {
            fields.push('mode = ?');
            values.push(missionData.mode);
        }
        if (missionData.constraints !== undefined) {
            fields.push('constraints = ?');
            values.push(JSON.stringify(missionData.constraints));
        }
        if (missionData.openQuestions !== undefined) {
            fields.push('open_questions = ?');
            values.push(JSON.stringify(missionData.openQuestions));
        }
        if (missionData.context !== undefined) {
            fields.push('context = ?');
            values.push(JSON.stringify(missionData.context));
        }
        if (fields.length === 0)
            return this.findById(id, username);
        fields.push('updated_at = ?');
        values.push(now);
        values.push(id);
        let query = `UPDATE missions SET ${fields.join(', ')} WHERE id = ?`;
        if (username) {
            query += ` AND username = ?`;
            values.push(username);
        }
        db.prepare(query).run(...values);
        return this.findById(id, username);
    }
}
module.exports = new MissionRepository();
//# sourceMappingURL=mission.repository.js.map