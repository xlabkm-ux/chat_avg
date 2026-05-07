export class DomainBoundary {
    constructor(boundaries?: ({
        boundaryId: string;
        name: string;
        description: string;
        level: string;
        maxAllowedStrength: string;
        rules: {
            ruleId: string;
            name: string;
            category: string;
            keywords: string[];
            patterns: RegExp[];
            action: {
                type: string;
                targetStrength: string;
                message: string;
            };
        }[];
    } | {
        boundaryId: string;
        name: string;
        description: string;
        level: string;
        maxAllowedStrength: string;
        rules: {
            ruleId: string;
            name: string;
            category: string;
            keywords: string[];
            patterns: RegExp[];
            action: {
                type: string;
                targetStrength: null;
                message: string;
            };
        }[];
    })[]);
    boundaries: ({
        boundaryId: string;
        name: string;
        description: string;
        level: string;
        maxAllowedStrength: string;
        rules: {
            ruleId: string;
            name: string;
            category: string;
            keywords: string[];
            patterns: RegExp[];
            action: {
                type: string;
                targetStrength: string;
                message: string;
            };
        }[];
    } | {
        boundaryId: string;
        name: string;
        description: string;
        level: string;
        maxAllowedStrength: string;
        rules: {
            ruleId: string;
            name: string;
            category: string;
            keywords: string[];
            patterns: RegExp[];
            action: {
                type: string;
                targetStrength: null;
                message: string;
            };
        }[];
    })[];
    /**
     * Проверить массив claims на нарушение domain boundaries.
     * Возвращает обновлённые claims с downgrade/violation информацией и массив events.
     * @param {Object[]} claims
     * @returns {{ claims: Object[], events: Object[] }}
     */
    enforceBoundaries(claims: Object[]): {
        claims: Object[];
        events: Object[];
    };
    /** @private */
    private _checkClaim;
    /** @private - Check claims with strength=fact but no sources */
    private _checkMissingSource;
    /** @private */
    private _isRuleTriggered;
    /** Get all registered boundaries */
    getBoundaries(): ({
        boundaryId: string;
        name: string;
        description: string;
        level: string;
        maxAllowedStrength: string;
        rules: {
            ruleId: string;
            name: string;
            category: string;
            keywords: string[];
            patterns: RegExp[];
            action: {
                type: string;
                targetStrength: string;
                message: string;
            };
        }[];
    } | {
        boundaryId: string;
        name: string;
        description: string;
        level: string;
        maxAllowedStrength: string;
        rules: {
            ruleId: string;
            name: string;
            category: string;
            keywords: string[];
            patterns: RegExp[];
            action: {
                type: string;
                targetStrength: null;
                message: string;
            };
        }[];
    })[];
}
/**
 * Предопределённые Domain Boundaries для PoC.
 */
export const DEFAULT_BOUNDARIES: ({
    boundaryId: string;
    name: string;
    description: string;
    level: string;
    maxAllowedStrength: string;
    rules: {
        ruleId: string;
        name: string;
        category: string;
        keywords: string[];
        patterns: RegExp[];
        action: {
            type: string;
            targetStrength: string;
            message: string;
        };
    }[];
} | {
    boundaryId: string;
    name: string;
    description: string;
    level: string;
    maxAllowedStrength: string;
    rules: {
        ruleId: string;
        name: string;
        category: string;
        keywords: string[];
        patterns: RegExp[];
        action: {
            type: string;
            targetStrength: null;
            message: string;
        };
    }[];
})[];
