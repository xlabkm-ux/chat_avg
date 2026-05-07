/**
 * Semantic Events — канонические типы событий семантического слоя.
 * Аналог providerEvents.js, но для Claim Ledger / Domain Boundary.
 * 
 * @module semantic.events
 * @see SPEC-005 Claim/DomainBoundary
 */

const SemanticEvents = {
  /**
   * Новый claim извлечён из текста.
   * @param {Object} claim - Полный объект Claim
   * @returns {{ type: 'claim.created', claim: Object }}
   */
  claimCreated: (claim) => ({ type: 'claim.created', claim }),

  /**
   * Сила claim понижена (strength downgrade).
   * @param {Object} claim - Claim после downgrade
   * @param {string} fromStrength - Исходная сила
   * @param {string} toStrength - Новая (пониженная) сила
   * @param {string} reason - Причина понижения
   * @returns {{ type: 'claim.downgraded', claim, fromStrength, toStrength, reason }}
   */
  claimDowngraded: (claim, fromStrength, toStrength, reason) => ({
    type: 'claim.downgraded', claim, fromStrength, toStrength, reason
  }),

  /**
   * Обнаружено нарушение границы области определения.
   * @param {Object} claim - Проблемный claim
   * @param {string} boundaryId - ID нарушенной границы
   * @param {string} rule - ID правила
   * @param {string} action - Применённое действие (block/downgrade/flag)
   * @returns {{ type: 'boundary.violation', claim, boundaryId, rule, action }}
   */
  boundaryViolation: (claim, boundaryId, rule, action) => ({
    type: 'boundary.violation', claim, boundaryId, rule, action
  }),

  /**
   * Скрытый авторитет заблокирован.
   * @param {Object} claim - Заблокированный claim
   * @param {string} violationType - Тип нарушения (no_psychodiagnosis, no_hidden_authority, etc.)
   * @returns {{ type: 'authority.blocked', claim, violationType }}
   */
  authorityBlocked: (claim, violationType) => ({
    type: 'authority.blocked', claim, violationType
  }),
};

module.exports = SemanticEvents;
