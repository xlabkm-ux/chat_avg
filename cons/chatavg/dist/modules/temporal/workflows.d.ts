export function agentRunWorkflow({ runId, missionId }: {
    runId: any;
    missionId: any;
}): Promise<{
    runId: any;
    finalState: string;
}>;
export const approvalSignal: import("@temporalio/workflow").SignalDefinition<[], "approvalSignal">;
