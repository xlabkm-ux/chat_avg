const { proxyActivities, defineSignal, setHandler, condition } = require('@temporalio/workflow');

const activities = proxyActivities({
  startToCloseTimeout: '1 minute',
});

const approvalSignal = defineSignal('approvalSignal');

async function agentRunWorkflow({ runId, missionId }) {
  await activities.updateRunState(runId, 'running');

  // Step 1: Model
  await activities.updateRunState(runId, 'requires_action', { step: 'model' });
  const modelResultId = await activities.executeModelStep(missionId);
  
  // Step 2: Semantic
  await activities.updateRunState(runId, 'requires_action', { step: 'semantic' });
  await activities.processSemanticStep(modelResultId);

  // Step 3: Wait for approval
  await activities.updateRunState(runId, 'waiting', { reason: 'approval_required' });
  
  let approvedAction = null;
  setHandler(approvalSignal, (action) => {
    approvedAction = action;
  });

  await condition(() => approvedAction !== null);

  if (approvedAction === 'approve') {
    await activities.updateRunState(runId, 'completed');
  } else {
    await activities.updateRunState(runId, 'cancelled', { reason: 'User rejected or cancelled' });
  }

  return { runId, finalState: approvedAction === 'approve' ? 'completed' : 'cancelled' };
}

module.exports = {
  agentRunWorkflow,
  approvalSignal
};
