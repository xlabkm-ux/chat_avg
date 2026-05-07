/**
 * ClaimLedger — реестр всех извлечённых claims per session.
 * PoC: in-memory Map. Персистенция в БД — Sprint 6+.
 * @module claim.ledger
 * @see SPEC-005 Claim/DomainBoundary
 */
export class ClaimLedger {
    /** @type {Map<string, Object[]>} sessionId → claims */
    _store: Map<string, Object[]>;
    /**
     * Добавить claim в реестр.
     * @param {Object} claim
     */
    addClaim(claim: Object): void;
    /**
     * Добавить массив claims.
     * @param {Object[]} claims
     */
    addClaims(claims: Object[]): void;
    /**
     * Получить все claims сессии.
     * @param {string} sessionId
     * @returns {Object[]}
     */
    getClaims(sessionId: string): Object[];
    /**
     * Получить все понижённые claims (across all sessions).
     * @returns {Object[]}
     */
    getDowngradedClaims(): Object[];
    /**
     * Получить claims с нарушениями (violations).
     * @returns {Object[]}
     */
    getViolations(): Object[];
    /**
     * Получить статистику по сессии.
     * @param {string} sessionId
     * @returns {Object}
     */
    getSummary(sessionId: string): Object;
    /**
     * Очистить claims для сессии.
     * @param {string} sessionId
     */
    clearSession(sessionId: string): void;
    /**
     * Очистить всё.
     */
    clearAll(): void;
}
