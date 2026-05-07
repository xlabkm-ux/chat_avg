const { Connection, Client } = require('@temporalio/client');
const { TEMPORAL_URL } = require('../../core/config');
const DurableRuntime = require('./durable.interface');

class TemporalAdapter extends DurableRuntime {
  constructor() {
    super();
    this.client = null;
  }

  async getClient() {
    if (this.client) return this.client;
    try {
      const connection = await Connection.connect({ address: TEMPORAL_URL });
      this.client = new Client({ connection });
      return this.client;
    } catch (err) {
      console.error('Failed to connect to Temporal:', err.message);
      throw err;
    }
  }

  async start(workflowId, taskQueue, workflowType, args) {
    const c = await this.getClient();
    const handle = await c.workflow.start(workflowType, {
      taskQueue,
      workflowId,
      args
    });
    return { 
      workflowId: handle.workflowId, 
      runId: handle.firstExecutionRunId 
    };
  }

  async signal(workflowId, signalName, payload) {
    const c = await this.getClient();
    const handle = c.workflow.getHandle(workflowId);
    await handle.signal(signalName, payload);
  }

  async query(workflowId, queryName, args = []) {
    const c = await this.getClient();
    const handle = c.workflow.getHandle(workflowId);
    return await handle.query(queryName, ...args);
  }

  async terminate(workflowId, reason = 'Terminated by user') {
    const c = await this.getClient();
    const handle = c.workflow.getHandle(workflowId);
    await handle.terminate(reason);
  }

  // Helper for starting AgentRun specifically
  async startAgentRun(runId, missionId, options = {}) {
    return this.start(
      `agent-run-${runId}`,
      'agent-runs-queue',
      'agentRunWorkflow',
      [{ 
        runId, 
        missionId,
        mode: options.mode,
        budgetPolicyId: options.budgetPolicyId,
        semanticProtocolId: options.semanticProtocolId
      }]
    );
  }

  async signalApproval(runId, action, data = {}) {
    const signalName = action === 'approve' ? 'approveAction' : 
                      action === 'reject' ? 'rejectAction' : 
                      action === 'edit' ? 'editAndApproveAction' : 
                      action === 'cancel' ? 'cancelRun' : 'approveAction';
    
    await this.signal(`agent-run-${runId}`, signalName, data);
  }

  async disconnect() {
    if (this.client) {
      await this.client.connection.close();
      this.client = null;
    }
  }
}

module.exports = new TemporalAdapter();

