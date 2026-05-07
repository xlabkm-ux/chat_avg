const db = require('../../core/sqlite');
const { v4: uuidv4 } = require('uuid');

/**
 * SemanticRepository — персистенция для ClaimLedger и SemanticProtocol.
 * Реализует хранение claims, событий и связанных сущностей в SQLite.
 */
class SemanticRepository {
  /**
   * Сохранить claim в БД.
   * @param {Object} claim
   */
  saveClaim(claim) {
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO claims (
        id, session_id, username, claim_text, claim_type, reality_level, strength,
        evidence_basis, source_refs, source_span, domain_boundary_id,
        allowed_strength, downgraded_from, distortion_risks,
        requires_user_decision, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      claim.claimId || claim.id,
      claim.sessionId,
      claim.username || 'system',
      claim.text || claim.claimText,
      claim.type || claim.claimType,
      claim.level || claim.realityLevel,
      claim.strength,
      claim.evidenceBasis || null,
      JSON.stringify(claim.sourceRefs || []),
      JSON.stringify(claim.sourceSpan || null),
      claim.domainBoundaryId || null,
      claim.allowedStrength || null,
      claim.downgradedFrom || null,
      JSON.stringify(claim.distortionRisks || []),
      claim.requiresUserDecision ? 1 : 0,
      claim.createdAt ? new Date(claim.createdAt).getTime() : now
    );
  }

  /**
   * Сохранить массив claims.
   * @param {Object[]} claims
   */
  saveClaims(claims) {
    if (!claims || !claims.length) return;
    const transaction = db.transaction((list) => {
      for (const claim of list) {
        this.saveClaim(claim);
      }
    });
    transaction(claims);
  }

  /**
   * Получить claims сессии.
   * @param {string} sessionId
   * @param {string} [username]
   * @returns {Object[]}
   */
  getClaimsBySession(sessionId, username = null) {
    let query = 'SELECT * FROM claims WHERE session_id = ?';
    const params = [sessionId];
    if (username) {
      query += ' AND username = ?';
      params.push(username);
    }
    query += ' ORDER BY created_at ASC';

    const rows = db.prepare(query).all(...params);

    return rows.map(r => ({
      claimId: r.id,
      sessionId: r.session_id,
      username: r.username,
      text: r.claim_text,
      type: r.claim_type,
      level: r.reality_level,
      strength: r.strength,
      evidenceBasis: r.evidence_basis,
      sourceRefs: JSON.parse(r.source_refs || '[]'),
      sourceSpan: JSON.parse(r.source_span || 'null'),
      domainBoundaryId: r.domain_boundary_id,
      allowedStrength: r.allowed_strength,
      downgradedFrom: r.downgraded_from,
      distortionRisks: JSON.parse(r.distortion_risks || '[]'),
      requiresUserDecision: !!r.requires_user_decision,
      createdAt: new Date(r.created_at).toISOString()
    }));
  }

  /**
   * Логировать семантическое событие.
   * @param {Object} event
   */
  logEvent(event) {
    const id = uuidv4();
    const now = Date.now();
    db.prepare(`
      INSERT INTO semantic_events (id, session_id, username, run_id, event_type, claim_id, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      event.sessionId,
      event.username || 'system',
      event.runId || null,
      event.type,
      event.claimId || (event.claim ? (event.claim.claimId || event.claim.id) : null),
      JSON.stringify(event.payload || event.claim || {}),
      now
    );
  }

  /**
   * Логировать массив событий.
   * @param {Object[]} events
   */
  logEvents(events) {
    if (!events || !events.length) return;
    const transaction = db.transaction((list) => {
      for (const event of list) {
        this.logEvent(event);
      }
    });
    transaction(events);
  }

  /**
   * Получить сводку по сессии.
   * @param {string} sessionId
   * @param {string} [username]
   */
  getSummary(sessionId, username = null) {
    const claims = this.getClaimsBySession(sessionId, username);
    const byType = {};
    const byStrength = {};
    let downgradedCount = 0;
    let violationCount = 0;

    for (const c of claims) {
      byType[c.type] = (byType[c.type] || 0) + 1;
      byStrength[c.strength] = (byStrength[c.strength] || 0) + 1;
      if (c.downgradedFrom) downgradedCount++;
      if (c.requiresUserDecision) violationCount++;
    }

    return {
      sessionId,
      total: claims.length,
      byType,
      byStrength,
      downgradedCount,
      violationCount,
    };
  }

  /**
   * Очистить данные сессии.
   * @param {string} sessionId
   */
  clearSession(sessionId) {
    db.prepare('DELETE FROM claims WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM semantic_events WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM conflict_cards WHERE session_id = ?').run(sessionId);
  }
}

module.exports = new SemanticRepository();
