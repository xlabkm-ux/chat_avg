declare const _exports: AgentRunRepository;
export = _exports;
declare class AgentRunRepository {
    create(runData: any): any;
    findById(id: any, username: any): any;
    findByMission(missionId: any, username: any): any;
    updateState(id: any, state: any, metadata: {} | undefined, username: any): any;
}
