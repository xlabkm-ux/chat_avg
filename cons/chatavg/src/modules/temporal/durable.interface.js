/**
 * DurableRuntime Interface Specification (v2.3)
 * 
 * This file defines the contract for durable execution adapters.
 * In production, this is implemented by the Temporal Adapter.
 */

class DurableRuntime {
  /**
   * Starts a new durable execution (workflow).
   * @param {string} workflowId Unique ID for the workflow instance.
   * @param {string} taskQueue Task queue to use.
   * @param {string} workflowType Name of the workflow function/type.
   * @param {any[]} args Arguments to pass to the workflow.
   * @returns {Promise<{ workflowId: string, runId: string }>}
   */
  async start(workflowId, taskQueue, workflowType, args) {
    throw new Error('Not implemented');
  }

  /**
   * Sends a signal to a running workflow.
   * @param {string} workflowId
   * @param {string} signalName
   * @param {any} payload
   */
  async signal(workflowId, signalName, payload) {
    throw new Error('Not implemented');
  }

  /**
   * Queries a running workflow.
   * @param {string} workflowId
   * @param {string} queryName
   * @param {any[]} args
   */
  async query(workflowId, queryName, args = []) {
    throw new Error('Not implemented');
  }

  /**
   * Terminates or cancels a workflow.
   * @param {string} workflowId
   * @param {string} reason
   */
  async terminate(workflowId, reason) {
    throw new Error('Not implemented');
  }
}

module.exports = DurableRuntime;
