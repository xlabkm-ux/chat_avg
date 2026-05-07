export class SemanticProtocol {
    extractor: ClaimExtractor;
    boundary: DomainBoundary;
    ledger: ClaimLedger;
    protocol: {
        protocolId: string;
        version: string;
        glossaryVersion: string;
        strengthLevels: string[];
        claimTypes: string[];
        realityLevels: string[];
        prohibitions: string[];
    };
    /**
     * Основной pipeline: извлечь claims → проверить boundaries → сохранить в ledger.
     * @param {string} text - Текст ответа LLM
     * @param {string} sessionId - ID сессии
     * @param {Object} [options]
     * @param {string[]} [options.sourceRefs]
     * @returns {{ claims: Object[], events: Object[], summary: Object, violations: Object[] }}
     */
    analyze(text: string, sessionId: string, options?: {
        sourceRefs?: string[] | undefined;
    }): {
        claims: Object[];
        events: Object[];
        summary: Object;
        violations: Object[];
    };
    /**
     * Получить версию протокола.
     * @returns {Object}
     */
    getProtocol(): Object;
    /**
     * Получить ledger summary для сессии.
     * @param {string} sessionId
     * @returns {Object}
     */
    getSessionSummary(sessionId: string): Object;
    /**
     * Получить все violations для сессии.
     * @param {string} sessionId
     * @returns {Object[]}
     */
    getSessionViolations(sessionId: string): Object[];
    /**
     * Очистить данные сессии.
     * @param {string} sessionId
     */
    clearSession(sessionId: string): void;
}
export namespace PROTOCOL_VERSION {
    let protocolId: string;
    let version: string;
    let glossaryVersion: string;
    let strengthLevels: string[];
    let claimTypes: string[];
    let realityLevels: string[];
    let prohibitions: string[];
}
import { ClaimExtractor } from "./claim.extractor";
import { DomainBoundary } from "./domain.boundary";
import { ClaimLedger } from "./claim.ledger";
