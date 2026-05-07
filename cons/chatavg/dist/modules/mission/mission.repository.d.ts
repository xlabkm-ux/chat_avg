declare const _exports: MissionRepository;
export = _exports;
declare class MissionRepository {
    create(missionData: any): any;
    findById(id: any, username: any): any;
    findBySession(sessionId: any, username: any): any;
    update(id: any, missionData: any, username: any): any;
}
