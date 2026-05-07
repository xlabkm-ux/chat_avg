const { ProviderError } = require('../providers/providerErrors');
const { isSideEffectRiskClass } = require('./tool.registry');

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
  constructor(definition, args, idempotencyKey = null) {
    this.definition = definition;
    this.args = args;
    this.idempotencyKey = idempotencyKey;
    this.state = ToolCallState.REQUESTED;
    this.result = null;
    this.error = null;
    this.attempts = 0;
    
    // Idempotency check
    if (isSideEffectRiskClass(this.definition.riskClass) && !this.idempotencyKey) {
      this.state = ToolCallState.FAILED;
      this.error = new ProviderError('IdempotencyKey is required for side-effect tools', 400, 'BAD_REQUEST');
    }
  }

  transition(newState) {
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
  }
}

class ToolGateway {
  constructor(toolRegistry) {
    this.registry = toolRegistry;
  }

  /**
   * Dispatches a tool call, managing its state and idempotency.
   */
  async executeTool(cacheKey, args, idempotencyKey = null, mcpExecutorFn = null) {
    const definition = this.registry.getTool(cacheKey);
    if (!definition) {
      throw new ProviderError(`Tool not found in registry: ${cacheKey}`, 404, 'NOT_FOUND');
    }

    const call = new ToolCall(definition, args, idempotencyKey);
    if (call.state === ToolCallState.FAILED) {
      throw call.error;
    }

    try {
      call.transition(ToolCallState.VALIDATING);
      // Here we could add schema validation (AJV etc)

      if (definition.approvalPolicyId) {
        call.transition(ToolCallState.PENDING_APPROVAL);
        // Simulation of approval check
      }

      call.transition(ToolCallState.EXECUTING);
      call.attempts += 1;

      // Ensure executor function is provided
      if (!mcpExecutorFn) {
        throw new Error('mcpExecutorFn is required to execute the tool.');
      }

      // Execute with timeout
      const executePromise = mcpExecutorFn(definition, args);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new ProviderError('Tool execution timed out', 408, 'TIMEOUT')), definition.timeoutMs);
      });

      const result = await Promise.race([executePromise, timeoutPromise]);

      call.result = result;
      call.transition(ToolCallState.COMPLETED);
      return call;

    } catch (err) {
      call.error = err;
      // Basic retry logic simulation
      if (definition.retryPolicyId && call.attempts < 3) {
        call.transition(ToolCallState.RETRYING);
        // Retry logic could be implemented here or delegated
      } else {
        call.transition(ToolCallState.FAILED);
      }
      throw err;
    }
  }
}

module.exports = {
  ToolCallState,
  ToolCall,
  ToolGateway
};
