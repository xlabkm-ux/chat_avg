"use strict";
const { v4: uuidv4 } = require('uuid');
/**
 * MissionService — tracks goals, distinctions, and conflicts.
 */
class MissionService {
    constructor() {
        this.missions = new Map();
    }
    /**
     * Initializes a mission.
     */
    startMission(data) {
        const mission = {
            id: data.id || uuidv4(),
            goal: data.goal || 'General Analysis',
            context: data.context || '',
            distinctions: [], // Significant semantic insights
            conflicts: [], // Semantic conflicts or boundary violations
            decisions: [], // DecisionRecords
            status: 'active'
        };
        this.missions.set(mission.id, mission);
        return mission;
    }
    /**
     * Adds a distinction (insight).
     */
    addDistinction(missionId, text) {
        const mission = this.missions.get(missionId);
        if (mission) {
            mission.distinctions.push({ id: uuidv4(), text, timestamp: new Date() });
        }
    }
    /**
     * Generates a ConflictCard from a semantic event.
     */
    addConflict(missionId, event) {
        const mission = this.missions.get(missionId);
        if (mission) {
            const card = {
                id: uuidv4(),
                type: event.type,
                message: event.message || 'Semantic conflict detected',
                claim: event.claim,
                timestamp: new Date()
            };
            mission.conflicts.push(card);
            return card;
        }
        return null;
    }
    getMission(id) {
        return this.missions.get(id);
    }
}
module.exports = new MissionService();
//# sourceMappingURL=mission.service.js.map