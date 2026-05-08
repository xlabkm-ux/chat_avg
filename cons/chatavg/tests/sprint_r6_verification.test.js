const test = require('node:test');
const assert = require('node:assert');
const { PolicyEngine, RiskClass } = require('../src/modules/policy/policy.engine');
const { ToolGateway, ToolCallState } = require('../src/modules/tools/tool.gateway');
const { toolRegistry } = require('../src/modules/tools/tool.registry');
const { ApprovalService } = require('../src/modules/policy/approval.service');
const { CostService } = require('../src/modules/policy/cost.service');
const db = require('../src/core/sqlite');

// Helper to setup dummy data
function setupTestData() {
  const missionId = 'test-mission-' + Date.now();
  const runId = 'test-run-' + Date.now();
  const username = 'admin';
  const sessionId = 'test-session-' + Date.now();

  // Ensure session exists
  db.prepare('INSERT OR IGNORE INTO sessions (id, username, title, messages, updatedAt) VALUES (?, ?, ?, ?, ?)').run(
    sessionId, username, 'Test Session', '[]', Date.now()
  );

  db.prepare('INSERT INTO missions (id, session_id, username, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
    missionId, sessionId, username, Date.now(), Date.now()
  );

  db.prepare('INSERT INTO agent_runs (id, mission_id, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
    runId, missionId, 'running', Date.now(), Date.now()
  );

  return { runId, missionId };
}

test('Sprint R6 — Policy Engine Enrichment', async (t) => {
  await t.test('should return enriched policy decision for tool call', () => {
    const action = { type: 'tool_call', payload: { name: 'run_command' } };
    const decision = PolicyEngine.evaluateAction(action);
    
    assert.ok(decision.decisionId);
    assert.strictEqual(decision.resolution, 'require_approval');
    assert.strictEqual(decision.riskClass, RiskClass.CODE_EXECUTION);
    assert.strictEqual(decision.auditLevel, 'security');
    assert.ok(decision.requiredApproval);
  });

  await t.test('should handle budget limits', () => {
    const action = { type: 'model_call' };
    const limits = { maxCostUsd: 0.005, currentCostUsd: 0 };
    const decision = PolicyEngine.evaluateAction(action, limits);
    
    assert.strictEqual(decision.resolution, 'deny');
    assert.strictEqual(decision.reason, 'Cost limit exceeded.');
  });
});

test('Sprint R6 — Tool Call Persistence', async (t) => {
  // Setup: Register a dummy tool
  const tool = toolRegistry.registerTool({
    providerId: 'test-p',
    toolName: 'test_tool',
    toolVersion: '1.0.0',
    schema: {},
    riskClass: RiskClass.READ
  });

  const { runId } = setupTestData();
  const gateway = new ToolGateway(toolRegistry);
  
  await t.test('should persist tool call in requested state', async () => {
    // Mock executor
    const executor = async () => ({ success: true });
    
    const call = await gateway.executeTool(tool.cacheKey, { arg1: 'val' }, runId, null, executor);
    
    assert.strictEqual(call.state, ToolCallState.COMPLETED);
    
    // Verify in DB
    const row = db.prepare('SELECT * FROM tool_calls WHERE id = ?').get(call.id);
    assert.ok(row);
    assert.strictEqual(row.state, 'completed');
    assert.strictEqual(row.run_id, runId);
  });
});

test('Sprint R6 — Approval Preview Enrichment', async (t) => {
  const { runId } = setupTestData();
  const metadata = {
    summary: 'Delete database',
    reason: 'Critical operation',
    affectedResources: ['db.sqlite'],
    estimatedCostUsd: 0,
    isIrreversible: true,
    riskScore: 95
  };

  await t.test('should create approval request with preview data', () => {
    const request = ApprovalService.createRequest(runId, 'system_write', { op: 'delete' }, metadata);
    
    assert.ok(request.payload._preview);
    assert.strictEqual(request.payload._preview.summary, 'Delete database');
    assert.strictEqual(request.payload._preview.isIrreversible, true);
    assert.strictEqual(request.state, 'pending');
  });
});

test('Sprint R6 — Cost Tracking', async (t) => {
  const { runId } = setupTestData();
  
  await t.test('should record cost and update budget', () => {
    CostService.recordCost(runId, 'model_call', 'msg-1', 0.05);
    
    const budget = CostService.getBudget('run', runId);
    assert.ok(budget);
    assert.strictEqual(budget.current_cost_usd, 0.05);
  });
});
