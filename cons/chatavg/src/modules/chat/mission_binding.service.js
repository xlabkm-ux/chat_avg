const missionRepository = require('../mission/mission.repository');

let _missionService = null;
function getMissionService() {
  if (!_missionService) _missionService = require('../execution/mission.service');
  return _missionService;
}

class MissionBindingService {
  /**
   * Ensures a mission exists for the given ID or creates a new one.
   */
  ensureMission(body, user) {
    const missionId = body.mission_id || body.missionId || `m-${Date.now()}`;
    const ms = getMissionService();
    
    // Check in-memory first
    let mission = ms.getMission(missionId);
    if (!mission) {
      // Check DB
      const dbMission = missionRepository.findById(missionId);
      if (dbMission) {
        // Hydrate in-memory service if needed (PoC compatibility)
        mission = ms.startMission({ 
          id: dbMission.id, 
          goal: dbMission.goal, 
          sessionId: dbMission.session_id, 
          username: dbMission.username 
        });
      } else if (body.sessionId || body.session_id) {
        // Create new if session provided
        mission = ms.startMission({ 
          id: missionId, 
          goal: body.goal || 'Analysis',
          sessionId: body.sessionId || body.session_id,
          username: user?.username || 'admin'
        });
        // Also persist to DB to satisfy FKs for semantic layer
        try {
          missionRepository.create({
            id: missionId,
            sessionId: body.sessionId || body.session_id,
            username: user?.username || 'admin',
            goal: body.goal || 'Analysis'
          });
        } catch (err) {
          console.warn('[MissionBinding] Could not persist mission to DB:', err.message);
        }
      } else {
        // Fallback for fast path or mock
        mission = ms.startMission({ id: missionId, goal: body.goal || 'Analysis' });
      }
    }
    
    return missionId;
  }

  getSessionId(missionId) {
    const mission = getMissionService().getMission(missionId);
    if (mission && mission.sessionId) return mission.sessionId;
    
    const dbMission = missionRepository.findById(missionId);
    return dbMission ? dbMission.session_id : null;
  }

  addConflict(missionId, conflict) {
    getMissionService().addConflict(missionId, conflict);
  }

  addDistinction(missionId, distinction) {
    getMissionService().addDistinction(missionId, distinction);
  }
}

module.exports = new MissionBindingService();
