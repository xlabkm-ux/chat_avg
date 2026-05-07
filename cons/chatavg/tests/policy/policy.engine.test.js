const { describe, it } = require('node:test');
const assert = require('node:assert');
const { PolicyEngine, RiskClass } = require('../../src/modules/policy/policy.engine');

describe('PolicyEngine', () => {
  it('should allow read-only tool calls', () => {
    const decision = PolicyEngine.evaluateAction({ type: 'tool_call', payload: { name: 'read_file' } });
    assert.strictEqual(decision.resolution, 'allow');
    assert.strictEqual(decision.riskClass, RiskClass.READ_ONLY);
  });

  it('should require approval for system write tool calls', () => {
    const decision = PolicyEngine.evaluateAction({ type: 'tool_call', payload: { name: 'write_file' } });
    assert.strictEqual(decision.resolution, 'require_approval');
    assert.strictEqual(decision.riskClass, RiskClass.SYSTEM_WRITE);
  });

  it('should deny when cost limit exceeded', () => {
    const decision = PolicyEngine.evaluateAction({ type: 'model_call' }, { maxCostUsd: 1.0, currentCostUsd: 1.5 });
    assert.strictEqual(decision.resolution, 'deny');
  });

  it('should deny semantic operations with hidden authority', () => {
    const decision = PolicyEngine.evaluateAction({ type: 'semantic_operation', payload: { hasHiddenAuthority: true } });
    assert.strictEqual(decision.resolution, 'deny');
  });

  it('should downgrade semantic operations with secrets', () => {
    const decision = PolicyEngine.evaluateAction({ type: 'semantic_operation', payload: { containsSecrets: true } });
    assert.strictEqual(decision.resolution, 'downgrade');
  });
});
