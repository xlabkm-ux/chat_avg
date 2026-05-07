"use strict";
/**
 * SemanticProtocol v0 — оркестратор смыслового слоя.
 * Связывает ClaimExtractor, DomainBoundary и ClaimLedger в единый pipeline.
 * @module semantic.protocol
 * @see SPEC-004 SemanticProtocol
 */
const { ClaimExtractor } = require('./claim.extractor');
const { DomainBoundary } = require('./domain.boundary');
const { ClaimLedger } = require('./claim.ledger');
const SemanticEvents = require('./semantic.events');
const PROTOCOL_VERSION = {
    protocolId: 'semantic-v0',
    version: '0.1.0',
    glossaryVersion: '1.0',
    strengthLevels: ['fact', 'strong_inference', 'weak_hypothesis', 'question'],
    claimTypes: ['observation', 'interpretation', 'hypothesis', 'decision', 'recommendation'],
    realityLevels: ['text', 'fact', 'model', 'value', 'trajectory', 'system'],
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
     * @returns {{ claims: Object[], events: Object[], summary: Object, violations: Object[] }}
     */
    analyze(text, sessionId, options = {}) {
        // 1. Extract claims
        const rawClaims = this.extractor.extractClaims(text, sessionId, options);
        const creationEvents = rawClaims.map(c => SemanticEvents.claimCreated(c));
        // 2. Enforce domain boundaries (downgrade + block)
        const { claims: processedClaims, events: boundaryEvents } = this.boundary.enforceBoundaries(rawClaims);
        // 3. Store in ledger
        this.ledger.addClaims(processedClaims);
        // 4. Collect violations
        const violations = processedClaims.filter(c => c.violations && c.violations.length > 0);
        // 5. Summary
        const summary = this.ledger.getSummary(sessionId);
        const allEvents = [...creationEvents, ...boundaryEvents];
        // Log events for observability
        for (const evt of allEvents) {
            if (evt.type === 'authority.blocked') {
                console.warn(`[Semantic] BLOCKED: ${evt.violationType} — "${evt.claim.text.substring(0, 80)}..."`);
            }
            else if (evt.type === 'claim.downgraded') {
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
     * @returns {Object}
     */
    getSessionSummary(sessionId) {
        return this.ledger.getSummary(sessionId);
    }
    /**
     * Получить все violations для сессии.
     * @param {string} sessionId
     * @returns {Object[]}
     */
    getSessionViolations(sessionId) {
        return this.ledger.getClaims(sessionId).filter(c => c.violations.length > 0);
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
//# sourceMappingURL=semantic.protocol.js.map