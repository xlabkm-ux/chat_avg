export class ApprovalService {
    static createRequest(runId: any, actionType: any, payload: any, riskScore: any, reason: any, timeoutMs?: number): any;
    static getRequest(id: any): any;
    static resolveRequest(id: any, resolution: any, editedPayload?: null): any;
    static markExpired(id: any): void;
}
