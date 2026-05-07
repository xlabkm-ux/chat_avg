export function updateRunState(runId: any, state: any, metadata?: {}): Promise<boolean>;
export function executeModelStep(missionId: any): Promise<string>;
export function processSemanticStep(modelResultId: any): Promise<string>;
