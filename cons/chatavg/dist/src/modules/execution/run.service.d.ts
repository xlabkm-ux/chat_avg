declare const _exports: AgentRunService;
export = _exports;
declare class AgentRunService extends EventEmitter<any> {
    constructor();
    activeStreams: Map<any, any>;
    createRun(missionId: any, metadata?: {}): Promise<any>;
    inMemoryExecution(runId: any, missionId: any): Promise<void>;
    getRun(runId: any): Promise<any>;
    cancelRun(runId: any, reason?: string): Promise<any>;
    updateState(runId: any, newState: any, metadata?: {}, reason?: null): Promise<any>;
    emitEvent(runId: any, type: any, payload: any): void;
    addStream(runId: any, res: any): void;
}
import EventEmitter = require("node:events");
