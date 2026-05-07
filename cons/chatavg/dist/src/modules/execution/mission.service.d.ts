declare const _exports: MissionService;
export = _exports;
/**
 * MissionService — tracks goals, distinctions, and conflicts.
 */
declare class MissionService {
    missions: Map<any, any>;
    /**
     * Initializes a mission.
     */
    startMission(data: any): {
        id: any;
        goal: any;
        context: any;
        distinctions: never[];
        conflicts: never[];
        decisions: never[];
        status: string;
    };
    /**
     * Adds a distinction (insight).
     */
    addDistinction(missionId: any, text: any): void;
    /**
     * Generates a ConflictCard from a semantic event.
     */
    addConflict(missionId: any, event: any): {
        id: string;
        type: any;
        message: any;
        claim: any;
        timestamp: Date;
    } | null;
    getMission(id: any): any;
}
