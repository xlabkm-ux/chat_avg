/**
 * ClaimLedger — реестр всех извлечённых claims per session.
 * PoC: in-memory Map. Персистенция в БД — Sprint 6+.
 * @module claim.ledger
 * @see SPEC-005 Claim/DomainBoundary
 */

const semanticRepository = require('./semantic.repository');

class ClaimLedger {
  /**
   * Добавить claim в реестр.
   * @param {Object} claim
   */
  addClaim(claim) {
    if (!claim || !claim.sessionId) return;
    semanticRepository.saveClaim(claim);
  }

  /**
   * Добавить массив claims.
   * @param {Object[]} claims
   */
  addClaims(claims) {
    semanticRepository.saveClaims(claims);
  }

  /**
   * Получить все claims сессии.
   * @param {string} sessionId
   * @param {string} [username]
   * @returns {Object[]}
   */
  getClaims(sessionId, username) {
    return semanticRepository.getClaimsBySession(sessionId, username);
  }

  /**
   * Получить все понижённые claims (across all sessions).
   * @returns {Object[]}
   */
  getDowngradedClaims() {
    // В v0.2 это может быть медленным, если записей много. 
    // В будущем добавить специальный метод в репозиторий.
    const rows = require('../../core/sqlite').prepare('SELECT * FROM claims WHERE downgraded_from IS NOT NULL').all();
    return rows.map(r => ({
      ...r,
      sourceRefs: JSON.parse(r.source_refs || '[]'),
      sourceSpan: JSON.parse(r.source_span || 'null'),
      distortionRisks: JSON.parse(r.distortion_risks || '[]')
    }));
  }

  /**
   * Получить claims с нарушениями (violations).
   * @returns {Object[]}
   */
  getViolations() {
    const rows = require('../../core/sqlite').prepare('SELECT * FROM claims WHERE requires_user_decision = 1').all();
    return rows.map(r => ({
      ...r,
      sourceRefs: JSON.parse(r.source_refs || '[]'),
      sourceSpan: JSON.parse(r.source_span || 'null'),
      distortionRisks: JSON.parse(r.distortion_risks || '[]')
    }));
  }

  /**
   * Получить статистику по сессии.
   * @param {string} sessionId
   * @param {string} [username]
   * @returns {Object}
   */
  getSummary(sessionId, username) {
    return semanticRepository.getSummary(sessionId, username);
  }

  /**
   * Очистить claims для сессии.
   * @param {string} sessionId
   */
  clearSession(sessionId) {
    semanticRepository.clearSession(sessionId);
  }

  /**
   * Очистить всё.
   */
  clearAll() {
    require('../../core/sqlite').exec('DELETE FROM claims; DELETE FROM semantic_events;');
  }
}

module.exports = { ClaimLedger };
