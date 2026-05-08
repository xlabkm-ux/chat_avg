const { ProviderError } = require('../providers/providerErrors');
const { isSideEffectRiskClass } = require('./tool.registry');
const db = require('../../core/sqlite');
const { v4: uuidv4 } = require('uuid');

/**
 * ToolCall states for the state machine.
 */
const ToolCallState = {
  REQUESTED: 'requested',
  VALIDATING: 'validating',
  PENDING_APPROVAL: 'pending_approval',
  EXECUTING: 'executing',
  RETRYING: 'retrying',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

class ToolCall {
  constructor(definition, args, runId, idempotencyKey = null) {
    this.id = uuidv4();
    this.runId = runId;
    this.definition = definition;
    this.args = args;
    this.idempotencyKey = idempotencyKey;
    this.state = ToolCallState.REQUESTED;
    this.policyDecision = null;
    this.approvalId = null;
    this.result = null;
    this.error = null;
    this.attempts = 0;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    
    // Idempotency check
    if (isSideEffectRiskClass(this.definition.riskClass) && !this.idempotencyKey) {
      this.state = ToolCallState.FAILED;
      this.error = new ProviderError('IdempotencyKey is required for side-effect tools', 400, 'BAD_REQUEST');
    }

    this.save();
  }

  save() {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO tool_calls (id, run_id, tool_name, args, state, idempotency_key, policy_decision, approval_id, result_ref, error, created_at, updated_at)
      VALUES (@id, @run_id, @tool_name, @args, @state, @idempotency_key, @policy_decision, @approval_id, @result_ref, @error, @created_at, @updated_at)
    `);

    stmt.run({
      id: this.id,
      run_id: this.runId,
      tool_name: this.definition.toolName,
      args: JSON.stringify(this.args),
      state: this.state,
      idempotency_key: this.idempotencyKey,
      policy_decision: this.policyDecision ? JSON.stringify(this.policyDecision) : null,
      approval_id: this.approvalId,
      result_ref: this.result ? JSON.stringify(this.result) : null,
      error: this.error ? (this.error.message || String(this.error)) : null,
      created_at: this.createdAt,
      updated_at: Date.now()
    });
    this.updatedAt = Date.now();
  }

  transition(newState, metadata = {}) {
    const validTransitions = {
      [ToolCallState.REQUESTED]: [ToolCallState.VALIDATING, ToolCallState.FAILED],
      [ToolCallState.VALIDATING]: [ToolCallState.PENDING_APPROVAL, ToolCallState.EXECUTING, ToolCallState.FAILED],
      [ToolCallState.PENDING_APPROVAL]: [ToolCallState.EXECUTING, ToolCallState.FAILED],
      [ToolCallState.EXECUTING]: [ToolCallState.COMPLETED, ToolCallState.FAILED, ToolCallState.RETRYING],
      [ToolCallState.RETRYING]: [ToolCallState.EXECUTING, ToolCallState.FAILED],
      [ToolCallState.COMPLETED]: [],
      [ToolCallState.FAILED]: []
    };

    if (!validTransitions[this.state].includes(newState)) {
      throw new Error(`Invalid state transition from ${this.state} to ${newState}`);
    }

    this.state = newState;
    if (metadata.policyDecision) this.policyDecision = metadata.policyDecision;
    if (metadata.approvalId) this.approvalId = metadata.approvalId;
    if (metadata.result) this.result = metadata.result;
    if (metadata.error) this.error = metadata.error;
    
    this.save();
  }
}

const traceBus = require('../observability/trace.bus');

class ToolGateway {
  constructor(toolRegistry) {
    this.registry = toolRegistry;
  }

  /**
   * Dispatches a tool call, managing its state and idempotency.
   */
  async executeTool(cacheKey, args, runId, idempotencyKey = null, mcpExecutorFn = null) {
    const startTime = Date.now();
    const definition = this.registry.getTool(cacheKey);
    if (!definition) {
      throw new ProviderError(`Tool not found in registry: ${cacheKey}`, 404, 'NOT_FOUND');
    }

    traceBus.emitTrace('ToolGateway', 'tool.requested', { toolName: definition.toolName, runId });

    const call = new ToolCall(definition, args, runId, idempotencyKey);
    if (call.state === ToolCallState.FAILED) {
      traceBus.emitTrace('ToolGateway', 'tool.failed', { toolName: definition.toolName, error: call.error.message, runId });
      throw call.error;
    }

    try {
      call.transition(ToolCallState.VALIDATING);
      
      // Basic Schema Validation Placeholder
      if (definition.schema) {
        // In a real implementation, use Ajv or Zod here
        // For now, we assume validation passes or fails with error
      }

      // Policy Evaluation Integration (simplified for now)
      // const decision = PolicyEngine.evaluateAction({ type: 'tool_call', payload: { name: definition.toolName } });
      // call.transition(ToolCallState.VALIDATING, { policyDecision: decision });

      if (definition.approvalPolicyId) {
        call.transition(ToolCallState.PENDING_APPROVAL);
        traceBus.emitTrace('ToolGateway', 'tool.waiting_approval', { toolName: definition.toolName, runId });
        // Wait for external approval signal...
        // For MVP, we throw or wait
        throw new ProviderError('Tool call requires approval', 403, 'APPROVAL_REQUIRED', { toolCallId: call.id });
      }

      call.transition(ToolCallState.EXECUTING);
      call.attempts += 1;

      if (!mcpExecutorFn) {
        throw new Error('mcpExecutorFn is required to execute the tool.');
      }

      const executePromise = mcpExecutorFn(definition, args);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new ProviderError('Tool execution timed out', 408, 'TIMEOUT')), definition.timeoutMs);
      });

      const result = await Promise.race([executePromise, timeoutPromise]);

      call.transition(ToolCallState.COMPLETED, { result });
      traceBus.emitTrace('ToolGateway', 'tool.completed', { 
        toolName: definition.toolName, 
        latencyMs: Date.now() - startTime,
        runId 
      });
      return call;

    } catch (err) {
      call.transition(ToolCallState.FAILED, { error: err });
      traceBus.emitTrace('ToolGateway', 'tool.failed', { 
        toolName: definition.toolName, 
        error: err.message, 
        latencyMs: Date.now() - startTime,
        runId 
      });
      throw err;
    }
  }
}

module.exports = {
  ToolCallState,
  ToolCall,
  ToolGateway
};
