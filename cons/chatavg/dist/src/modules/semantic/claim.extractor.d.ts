export class ClaimExtractor {
    static getStrengthOrder(strength: any): number;
    static downgradeStrength(currentStrength: any, steps?: number): string;
    /**
     * Извлечь claims из текста ответа LLM.
     * @param {string} text - Текст для анализа
     * @param {string} sessionId - ID сессии
     * @param {Object} [options]
     * @param {string[]} [options.sourceRefs] - Ссылки на источники
     * @returns {Object[]} Массив Claims
     */
    extractClaims(text: string, sessionId: string, options?: {
        sourceRefs?: string[] | undefined;
    }): Object[];
    /** @private */
    private _analyzeSentence;
    /** @private */
    private _detectLevel;
    /** @private */
    private _splitIntoSentences;
}
export const STRENGTH_ORDER: string[];
