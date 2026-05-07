const { ClaimExtractor } = require('./claim.extractor');
const { DomainBoundary, REALITY_LEVELS, STRENGTH_POLICY } = require('./domain.boundary');
const { ClaimLedger } = require('./claim.ledger');
const SemanticEvents = require('./semantic.events');
const semanticRepository = require('./semantic.repository');

const PROTOCOL_VERSION = {
  protocolId: 'semantic-v0',
  version: '0.2.0',
  glossaryVersion: '1.0',
  strengthLevels: Object.keys(STRENGTH_POLICY),
  claimTypes: ['observation', 'interpretation', 'hypothesis', 'decision', 'recommendation'],
  realityLevels: REALITY_LEVELS,
  prohibitions: [
    'no_psychodiagnosis',
    'no_hidden_authority',
    'no_level_mixing',
    'no_depth_scoring',
    'no_pseudo_understanding',
  ],
};

class SemanticProtocol {
  constructor() {
    this.extractor = new ClaimExtractor();
    this.boundary = new DomainBoundary();
    this.ledger = new ClaimLedger();
    this.protocol = PROTOCOL_VERSION;
  }

  /**
   * Основной pipeline: извлечь claims → проверить boundaries → сохранить в ledger.
   * @param {string} text - Текст ответа LLM
   * @param {string} sessionId - ID сессии
   * @param {Object} [options]
   * @param {string[]} [options.sourceRefs]
   * @returns {Promise<{ claims: Object[], events: Object[], summary: Object, violations: Object[] }>}
   */
  async analyze(text, sessionId, options = {}) {
    // 1. Extract claims
    const rawClaims = await this.extractor.extractClaims(text, sessionId, options);
    const creationEvents = rawClaims.map(c => SemanticEvents.claimCreated(c));

    // 2. Enforce domain boundaries (downgrade + block)
    const { claims: processedClaims, events: boundaryEvents } = this.boundary.enforceBoundaries(rawClaims);

    // 3. Store in ledger
    this.ledger.addClaims(processedClaims);

    // 4. Collect violations
    const violations = processedClaims.filter(c => c.requiresUserDecision);

    // 5. Summary
    const summary = this.ledger.getSummary(sessionId, options.username);

    const allEvents = [...creationEvents, ...boundaryEvents];

    // 6. Persist events
    semanticRepository.logEvents(allEvents.map(evt => ({
      ...evt,
      sessionId,
      username: options.username || 'system',
      runId: options.runId || null
    })));

    // Log events for observability
    for (const evt of allEvents) {
      if (evt.type === 'authority.blocked') {
        console.warn(`[Semantic] BLOCKED: ${evt.violationType} — "${evt.claim.text.substring(0, 80)}..."`);
      } else if (evt.type === 'claim.downgraded') {
        console.log(`[Semantic] Downgrade: ${evt.fromStrength} → ${evt.toStrength} (${evt.reason})`);
      }
    }

    return {
      claims: processedClaims,
      events: allEvents,
      summary,
      violations,
    };
  }

  /**
   * Получить версию протокола.
   * @returns {Object}
   */
  getProtocol() {
    return this.protocol;
  }

  /**
   * Получить ledger summary для сессии.
   * @param {string} sessionId
   * @param {string} [username]
   * @returns {Object}
   */
  getSessionSummary(sessionId, username) {
    return this.ledger.getSummary(sessionId, username);
  }

  /**
   * Получить все violations для сессии.
   * @param {string} sessionId
   * @param {string} [username]
   * @returns {Object[]}
   */
  getSessionViolations(sessionId, username) {
    return this.ledger.getClaims(sessionId, username).filter(c => c.requiresUserDecision);
  }

  /**
   * Очистить данные сессии.
   * @param {string} sessionId
   */
  clearSession(sessionId) {
    this.ledger.clearSession(sessionId);
  }
}

module.exports = { SemanticProtocol, PROTOCOL_VERSION };
