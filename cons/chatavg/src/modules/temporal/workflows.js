const { proxyActivities, defineSignal, setHandler, condition, defineQuery } = require('@temporalio/workflow');

const activities = proxyActivities({
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '2 seconds',
    maximumInterval: '1 minute',
    backoffCoefficient: 2,
    maximumAttempts: 10,
  }
});

// Signals
const approveActionSignal = defineSignal('approveAction');
const rejectActionSignal = defineSignal('rejectAction');
const editAndApproveActionSignal = defineSignal('editAndApproveAction');
const cancelRunSignal = defineSignal('cancelRun');
const resumeRunSignal = defineSignal('resumeRun');
const updateBudgetSignal = defineSignal('updateBudget');

// Queries
const getRunStatusQuery = defineQuery('getRunStatus');
const getCurrentStageQuery = defineQuery('getCurrentStage');
const getPendingApprovalsQuery = defineQuery('getPendingApprovals');
const getCostSoFarQuery = defineQuery('getCostSoFar');

async function agentRunWorkflow(input) {
  const { 
    runId, 
    missionId, 
    mode = 'balanced', 
    budgetPolicyId = 'default', 
    semanticProtocolId = 'v1', 
    requestContextRef 
  } = input;

  let state = 'running';
  let stage = 'initializing';
  let pendingApprovals = [];
  let costSoFar = 0;
  let isCancelled = false;
  let finalResult = null;

  // Signal Handlers
  setHandler(cancelRunSignal, () => {
    isCancelled = true;
  });

  let approvalDecision = null;
  setHandler(approveActionSignal, (data) => {
    approvalDecision = { type: 'approved', ...data };
  });

  setHandler(rejectActionSignal, (data) => {
    approvalDecision = { type: 'rejected', ...data };
  });

  setHandler(editAndApproveActionSignal, (data) => {
    approvalDecision = { type: 'edit_approved', ...data };
  });

  setHandler(updateBudgetSignal, (newBudget) => {
    // Logic to update budget if needed
  });

  // Query Handlers
  setHandler(getRunStatusQuery, () => state);
  setHandler(getCurrentStageQuery, () => stage);
  setHandler(getPendingApprovalsQuery, () => pendingApprovals);
  setHandler(getCostSoFarQuery, () => costSoFar);

  try {
    // 1. Initial State Update
    await activities.updateRunState(runId, 'running');

    // 2. Load Mission Context
    stage = 'loading_mission_context';
    const missionContext = await activities.loadMissionContext(missionId);

    // 3. Execution Loop
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (iterations < MAX_ITERATIONS && !isCancelled) {
      iterations++;
      
      // Step A: Model Inference
      stage = 'model_step';
      const modelResultId = await activities.runModelStep({
        runId,
        missionId,
        context: missionContext,
        mode
      });

      // Step B: Semantic Check
      stage = 'semantic_step';
      const semanticResult = await activities.runSemanticStep({
        runId,
        modelResultId,
        semanticProtocolId
      });

      // Step C: Check for Approval Requirement
      if (semanticResult.requiresApproval || semanticResult.riskScore > 0.7) {
        stage = 'waiting_for_approval';
        state = 'waiting';
        await activities.updateRunState(runId, 'waiting', { 
          reason: 'approval_required',
          riskScore: semanticResult.riskScore,
          riskClass: semanticResult.riskClass
        });

        const approvalReq = await activities.createApprovalRequest({
          runId,
          type: 'semantic_boundary',
          details: semanticResult
        });

        pendingApprovals.push(approvalReq.id);
        
        // Wait for signal or cancellation
        approvalDecision = null;
        await condition(() => approvalDecision !== null || isCancelled);

        pendingApprovals = pendingApprovals.filter(id => id !== approvalReq.id);

        if (isCancelled) break;

        if (approvalDecision.type === 'rejected') {
          await activities.recordDecision(runId, {
            type: 'approval_rejected',
            approvalId: approvalReq.id
          });
          break; // Exit loop on rejection
        }

        // Apply any edits if it was edit_approved
        if (approvalDecision.type === 'edit_approved' && approvalDecision.editedContent) {
          await activities.applyArtifactPatch(runId, {
            target: 'model_output',
            patch: approvalDecision.editedContent
          });
        }

        await activities.recordDecision(runId, {
          type: 'approval_granted',
          approvalId: approvalReq.id
        });
        
        state = 'running';
        await activities.updateRunState(runId, 'running');
      }

      // Step D: Cost tracking (simplified)
      costSoFar += 0.05; // Mock increment

      // Check if finished
      if (semanticResult.isTerminal) break;
    }

    // 4. Finalization
    if (isCancelled) {
      state = 'cancelled';
      await activities.updateRunState(runId, 'cancelled', { reason: 'User signal' });
    } else {
      stage = 'finalizing';
      state = 'completed';
      finalResult = await activities.finalizeRun(runId);
    }

  } catch (error) {
    state = 'failed';
    stage = 'error';
    await activities.updateRunState(runId, 'failed', { error: error.message });
    throw error;
  }

  return { 
    runId, 
    finalState: state,
    costSummary: { total: costSoFar },
    iterations
  };
}

module.exports = {
  agentRunWorkflow,
  approveActionSignal,
  rejectActionSignal,
  editAndApproveActionSignal,
  cancelRunSignal,
  resumeRunSignal,
  updateBudgetSignal,
  getRunStatusQuery,
  getCurrentStageQuery,
  getPendingApprovalsQuery,
  getCostSoFarQuery
};

