"use strict";
/**
 * ClaimLedger — реестр всех извлечённых claims per session.
 * PoC: in-memory Map. Персистенция в БД — Sprint 6+.
 * @module claim.ledger
 * @see SPEC-005 Claim/DomainBoundary
 */
class ClaimLedger {
    constructor() {
        /** @type {Map<string, Object[]>} sessionId → claims */
        this._store = new Map();
    }
    /**
     * Добавить claim в реестр.
     * @param {Object} claim
     */
    addClaim(claim) {
        if (!claim || !claim.sessionId)
            return;
        const list = this._store.get(claim.sessionId) || [];
        list.push(claim);
        this._store.set(claim.sessionId, list);
    }
    /**
     * Добавить массив claims.
     * @param {Object[]} claims
     */
    addClaims(claims) {
        for (const claim of claims) {
            this.addClaim(claim);
        }
    }
    /**
     * Получить все claims сессии.
     * @param {string} sessionId
     * @returns {Object[]}
     */
    getClaims(sessionId) {
        return this._store.get(sessionId) || [];
    }
    /**
     * Получить все понижённые claims (across all sessions).
     * @returns {Object[]}
     */
    getDowngradedClaims() {
        const result = [];
        for (const claims of this._store.values()) {
            for (const c of claims) {
                if (c.downgradedFrom)
                    result.push(c);
            }
        }
        return result;
    }
    /**
     * Получить claims с нарушениями (violations).
     * @returns {Object[]}
     */
    getViolations() {
        const result = [];
        for (const claims of this._store.values()) {
            for (const c of claims) {
                if (c.violations && c.violations.length > 0)
                    result.push(c);
            }
        }
        return result;
    }
    /**
     * Получить статистику по сессии.
     * @param {string} sessionId
     * @returns {Object}
     */
    getSummary(sessionId) {
        const claims = this.getClaims(sessionId);
        const byType = {};
        const byStrength = {};
        let downgradedCount = 0;
        let violationCount = 0;
        for (const c of claims) {
            byType[c.type] = (byType[c.type] || 0) + 1;
            byStrength[c.strength] = (byStrength[c.strength] || 0) + 1;
            if (c.downgradedFrom)
                downgradedCount++;
            if (c.violations && c.violations.length > 0)
                violationCount++;
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
     * Очистить claims для сессии.
     * @param {string} sessionId
     */
    clearSession(sessionId) {
        this._store.delete(sessionId);
    }
    /**
     * Очистить всё.
     */
    clearAll() {
        this._store.clear();
    }
}
module.exports = { ClaimLedger };
//# sourceMappingURL=claim.ledger.js.map