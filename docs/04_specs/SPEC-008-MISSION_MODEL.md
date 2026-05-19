---
id: SPEC-008
title: Mission Model
version: 1.0.0
owner: Core Team
status: Draft
last_updated: 2026-05-07
sprint: Sprint 5
---

# SPEC-008: Mission Model

**Status:** Draft | **Version:** 1.0 | **Date:** 2026-05-07

## 1. Introduction
A `Mission` represents the high-level intent and context for a set of `AgentRuns`. While a `Session` is a loose collection of messages, a `Mission` is a structured objective with associated constraints, semantic rules, and success criteria.

## 2. Mission Schema

| Field | Type | Description |
|---|---|---|
| `missionId` | UUID | Unique identifier. |
| `semanticProtocolId` | string | ID of the ER Meaning Layer protocol to apply. |
| `glossaryVersion` | string | Version of the project glossary to use for disambiguation. |
| `mode` | "fast" \| "balanced" \| "thorough" | Execution mode (affects RAG and model selection). |
| `goal` | string | The primary objective of the mission. |
| `constraints` | Array<string> | Explicit constraints (e.g., "no external APIs", "legal tone only"). |
| `openQuestions` | Array<string> | Questions that need to be answered to complete the mission. |
| `context` | object | Additional metadata (user profile, project state, etc.). |
| `createdAt` | ISO-8601 | Creation timestamp. |
| `updatedAt` | ISO-8601 | Last update timestamp. |

## 3. Relationships
- **Session:** A Mission is typically associated with one Session, but a Session can have multiple Missions over time.
- **AgentRun:** Multiple runs can be executed within the context of a single Mission. Each run inherits the Mission's context and constraints.
- **Artifact:** Missions often result in one or more Artifacts.

## 4. Mission Persistence
Missions MUST be persisted in the `MissionRepository`.
- **Primary Store:** SQLite (during v2.3 development).
- **Audit Store:** All mission changes must be recorded in the audit log.

## 5. Lifecycle
1. **Definition:** User or system defines a Mission based on a prompt or project template.
2. **Execution:** One or more `AgentRuns` are started to fulfill the Mission.
3. **Refinement:** The Mission goal or constraints may be updated as the agent discovers new information.
4. **Completion:** The Mission is marked as completed when the goal is reached or the user closes it.

## 6. Code Examples

### Example 1: Creating a Mission

```javascript
// src/services/mission.service.js
const { v4: uuidv4 } = require('uuid');

class MissionService {
  constructor(missionRepository) {
    this.repository = missionRepository;
  }

  async createMission(userId, missionData) {
    const mission = {
      missionId: uuidv4(),
      userId,
      semanticProtocolId: missionData.semanticProtocolId || 'semantic-v0',
      glossaryVersion: missionData.glossaryVersion || '1.0.0',
      mode: missionData.mode || 'balanced',
      goal: missionData.goal,
      constraints: missionData.constraints || [],
      openQuestions: missionData.openQuestions || [],
      context: missionData.context || {},
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Validate required fields
    if (!mission.goal) {
      throw new Error('Mission goal is required');
    }

    // Persist to repository
    await this.repository.save(mission);

    console.log(`Mission created: ${mission.missionId}`);
    return mission;
  }
}

module.exports = MissionService;
```

### Example 2: Updating Mission Constraints

```javascript
// Updating mission as agent discovers new information
async function refineMission(missionService, missionId, updates) {
  const mission = await missionService.getMission(missionId);

  if (!mission) {
    throw new Error(`Mission not found: ${missionId}`);
  }

  // Update constraints
  if (updates.constraints) {
    mission.constraints = [
      ...mission.constraints,
      ...updates.constraints.filter(c => !mission.constraints.includes(c))
    ];
  }

  // Add open questions discovered during execution
  if (updates.openQuestions) {
    mission.openQuestions = [
      ...mission.openQuestions,
      ...updates.openQuestions.filter(q => !mission.openQuestions.includes(q))
    ];
  }

  // Update glossary version if needed
  if (updates.glossaryVersion) {
    mission.glossaryVersion = updates.glossaryVersion;
  }

  mission.updatedAt = new Date().toISOString();

  await missionService.updateMission(missionId, mission);

  return mission;
}

// Usage
await refineMission(missionService, 'mission-123', {
  constraints: ['legal tone only', 'cite sources'],
  openQuestions: ['What jurisdiction applies?', 'Are there precedents?']
});
```

### Example 3: Linking AgentRun to Mission

```javascript
// src/services/agentRun.service.js
class AgentRunService {
  async startAgentRun(userId, missionId, initialMessage) {
    // Retrieve mission context
    const mission = await this.missionService.getMission(missionId);

    if (!mission) {
      throw new Error(`Mission not found: ${missionId}`);
    }

    if (mission.status !== 'active') {
      throw new Error(`Mission is not active: ${mission.status}`);
    }

    // Create AgentRun with mission context
    const agentRun = {
      runId: uuidv4(),
      userId,
      missionId,
      mode: mission.mode,
      semanticProtocolId: mission.semanticProtocolId,
      constraints: mission.constraints,
      status: 'pending',
      messages: [{
        role: 'user',
        content: initialMessage,
        timestamp: new Date().toISOString(),
      }],
      startedAt: new Date().toISOString(),
    };

    // Start workflow in Temporal (see SPEC-009)
    const handle = await this.temporalClient.workflow.start('agentWorkflow', {
      args: [agentRun],
      taskQueue: 'chatavg-tasks',
      workflowExecutionTimeout: 3600000, // 1 hour
    });

    agentRun.workflowId = handle.workflowId;
    agentRun.status = 'running';

    await this.runRepository.save(agentRun);

    return agentRun;
  }
}
```

### Example 4: Completing a Mission

```javascript
// Marking mission as complete with artifacts
async function completeMission(missionService, missionId, artifacts) {
  const mission = await missionService.getMission(missionId);

  if (!mission) {
    throw new Error(`Mission not found: ${missionId}`);
  }

  // Verify all open questions are addressed
  const unanswered = mission.openQuestions.filter(q => 
    !artifacts.some(a => a.addressesQuestion(q))
  );

  if (unanswered.length > 0) {
    console.warn(`Mission has ${unanswered.length} unanswered questions`);
    // Optionally prevent completion or mark as partial
  }

  // Update mission status
  mission.status = 'completed';
  mission.completedAt = new Date().toISOString();
  mission.artifacts = artifacts.map(a => ({
    artifactId: a.id,
    type: a.type,
    title: a.title,
  }));
  mission.updatedAt = new Date().toISOString();

  await missionService.updateMission(missionId, mission);

  // Emit completion event
  emitEvent('mission.completed', {
    missionId: mission.missionId,
    userId: mission.userId,
    artifactCount: artifacts.length,
    duration: new Date(mission.completedAt) - new Date(mission.createdAt),
  });

  return mission;
}
```
