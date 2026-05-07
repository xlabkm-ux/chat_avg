export class PolicyEngine {
    /**
     * Evaluates an action and returns a PolicyDecision.
     * @param {Object} action - { type, payload, context }
     * @param {Object} limits - current session limits
     * @returns {Object} PolicyDecision
     */
    static evaluateAction(action: Object, limits?: Object): Object;
    static applyDowngrade(payload: any): any;
}
export namespace RiskClass {
    let READ_ONLY: string;
    let EXTERNAL_API: string;
    let SYSTEM_WRITE: string;
    let CODE_EXECUTION: string;
    let PRIVILEGED: string;
}
