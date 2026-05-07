const { Connection, Client } = require('@temporalio/client');
const { TEMPORAL_URL } = require('../../core/config');

let client = null;

async function getClient() {
  if (client) return client;
  const connection = await Connection.connect({ address: TEMPORAL_URL });
  client = new Client({ connection });
  return client;
}

async function startAgentRun(runId, missionId) {
  const c = await getClient();
  const handle = await c.workflow.start('agentRunWorkflow', {
    taskQueue: 'agent-runs-queue',
    workflowId: `agent-run-${runId}`,
    args: [{ runId, missionId }]
  });
  return handle;
}

async function signalApproval(runId, action) {
  const c = await getClient();
  const handle = c.workflow.getHandle(`agent-run-${runId}`);
  await handle.signal('approvalSignal', action);
}

async function disconnect() {
  if (client) {
    await client.connection.close();
    client = null;
  }
}

module.exports = {
  startAgentRun,
  signalApproval,
  disconnect
};
