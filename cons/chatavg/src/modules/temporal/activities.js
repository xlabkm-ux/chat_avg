const runRepository = require('../execution/run.repository');
const missionRepository = require('../mission/mission.repository');
const { ApprovalService } = require('../policy/approval.service');
const { v4: uuidv4 } = require('uuid');

async function updateRunState(runId, state, metadata = {}) {
  // This activity is heartbeat-aware by nature in Temporal, but we just call the repo
  runRepository.updateState(runId, state, metadata);
  
  runRepository.createEvent(runId, 'run.status_changed', {
    currentState: state,
    ...metadata
  });
  
  return true;
}

async function loadMissionContext(missionId) {
  const mission = missionRepository.findById(missionId);
  if (!mission) throw new Error(`Mission ${missionId} not found`);
  return mission;
}

async function runModelStep({ runId, missionId, context, mode }) {
  // Record the start of model inference
  runRepository.createEvent(runId, 'model.requested', { 
    missionId, 
    mode,
    contextSummary: context.goal 
  });

  // Mock latency
  await new Promise(r => setTimeout(r, 1000));

  const resultId = `model_out_${uuidv4()}`;
  const mockContent = `Based on the mission goal "${context.goal}", here is the analysis step...`;

  runRepository.createEvent(runId, 'model.delta', { 
    content: mockContent, 
    role: 'assistant' 
  });

  runRepository.createEvent(runId, 'model.step_completed', { 
    resultId,
    usage: { prompt_tokens: 150, completion_tokens: 45, total_tokens: 195 }
  });

  return resultId;
}

async function runSemanticStep({ runId, modelResultId, semanticProtocolId }) {
  runRepository.createEvent(runId, 'semantic.analysis_started', { 
    modelResultId, 
    semanticProtocolId 
  });

  // Simulation logic for remediation sprint
  // In a real implementation, this calls SemanticProtocol.analyze()
  const riskScore = Math.random();
  const requiresApproval = riskScore > 0.6; // High probability for testing
  
  const result = {
    requiresApproval,
    riskScore,
    riskClass: requiresApproval ? 'SYSTEM_WRITE' : 'READ_ONLY',
    isTerminal: Math.random() > 0.8,
    findings: requiresApproval ? ['Domain boundary breach detected', 'Unsupported strong claim'] : []
  };

  runRepository.createEvent(runId, 'semantic.analysis_completed', result);
  
  return result;
}

async function createApprovalRequest({ runId, type, details }) {
  // Use the existing ApprovalService
  const request = ApprovalService.createRequest(
    runId, 
    type, 
    details, 
    Math.floor(details.riskScore * 100), 
    `Automated policy gate: ${details.riskClass}. Findings: ${details.findings?.join(', ')}`
  );

  runRepository.createEvent(runId, 'approval.created', { 
    approvalId: request.id, 
    type,
    riskScore: request.risk_score
  });

  return request;
}

async function recordDecision(runId, decision) {
  runRepository.createEvent(runId, 'run.decision_recorded', decision);
  return true;
}

async function applyArtifactPatch(runId, { target, patch }) {
  runRepository.createEvent(runId, 'run.artifact_patched', { 
    target, 
    patch: typeof patch === 'string' ? (patch.substring(0, 50) + '...') : 'binary/object' 
  });
  return true;
}

async function finalizeRun(runId) {
  const now = Date.now();
  runRepository.updateState(runId, 'completed');
  
  runRepository.createEvent(runId, 'run.completed', { 
    finalState: 'completed',
    timestamp: now,
    summary: 'Workflow execution finished successfully.'
  });

  return { success: true, runId, completedAt: now };
}

module.exports = {
  updateRunState,
  loadMissionContext,
  runModelStep,
  runSemanticStep,
  createApprovalRequest,
  recordDecision,
  applyArtifactPatch,
  finalizeRun
};

