const test = require('node:test');
const assert = require('node:assert/strict');
const temporalClient = require('../../src/modules/temporal/client');
const activities = require('../../src/modules/temporal/activities');
const db = require('../../src/core/sqlite');
const runRepository = require('../../src/modules/execution/run.repository');
const missionRepository = require('../../src/modules/mission/mission.repository');


const { loadFixtures } = require('../setup_fixtures');

test('Temporal Workflow R3 Implementation Tests', async (t) => {
  let missionId;
  let runId;

  t.before(() => {
    loadFixtures();
    
    // Ensure test session exists (fixtures might already provide it, but let's be sure)
    db.prepare("INSERT OR IGNORE INTO sessions (id, username, title, messages, updatedAt) VALUES (?, ?, ?, ?, ?)").run(
      'test-session', 'admin', 'Test Session', '[]', Date.now()
    );


    // Setup mock data
    const mission = missionRepository.create({
      sessionId: 'test-session',
      username: 'admin',
      goal: 'Test Goal',
      context: { info: 'test context' }
    });
    missionId = mission.id;
  });


  await t.test('Activity: loadMissionContext should return mission data', async () => {
    const context = await activities.loadMissionContext(missionId);
    assert.strictEqual(context.goal, 'Test Goal');
    assert.strictEqual(context.id, missionId);
  });

  await t.test('Activity: updateRunState should persist state and emit event', async () => {
    const run = runRepository.create({ missionId, state: 'queued' });
    runId = run.id;
    
    await activities.updateRunState(runId, 'running', { step: 'init' });
    
    const updated = runRepository.findById(runId);
    assert.strictEqual(updated.state, 'running');
    assert.strictEqual(updated.metadata.step, 'init');
    
    const events = runRepository.getEvents(runId);
    assert.ok(events.some(e => e.event_type === 'run.status_changed' && e.payload.currentState === 'running'));
  });

  await t.test('Activity: runModelStep should emit events', async () => {
    const modelResultId = await activities.runModelStep({
      runId,
      missionId,
      context: { goal: 'Test Goal' },
      mode: 'balanced'
    });
    
    assert.ok(modelResultId.startsWith('model_out_'));
    const events = runRepository.getEvents(runId);
    assert.ok(events.some(e => e.event_type === 'model.requested'));
    assert.ok(events.some(e => e.event_type === 'model.delta'));
    assert.ok(events.some(e => e.event_type === 'model.step_completed'));
  });

  await t.test('Activity: runSemanticStep should return risk assessment', async () => {
    const result = await activities.runSemanticStep({
      runId,
      modelResultId: 'mock-ref',
      semanticProtocolId: 'v1'
    });
    
    assert.ok(typeof result.requiresApproval === 'boolean');
    assert.ok(typeof result.riskScore === 'number');
    assert.ok(Array.isArray(result.findings));
  });

  await t.test('Activity: createApprovalRequest should use ApprovalService', async () => {
    const details = { riskScore: 0.85, riskClass: 'SYSTEM_WRITE', findings: ['Test'] };
    const request = await activities.createApprovalRequest({
      runId,
      type: 'semantic_boundary',
      details
    });
    
    assert.strictEqual(request.run_id, runId);
    assert.strictEqual(request.state, 'pending');
    assert.strictEqual(request.risk_score, 85);
  });

  await t.test('Client: signalApproval should map to correct signal names', async () => {
    // This test ensures the client logic for signal naming is correct
    // We'll mock the signal method since we don't have a cluster
    const originalSignal = temporalClient.signal;
    let lastSignalName = null;
    
    temporalClient.signal = async (id, name, payload) => {
      lastSignalName = name;
    };
    
    await temporalClient.signalApproval('run1', 'approve');
    assert.strictEqual(lastSignalName, 'approveAction');
    
    await temporalClient.signalApproval('run1', 'reject');
    assert.strictEqual(lastSignalName, 'rejectAction');
    
    await temporalClient.signalApproval('run1', 'cancel');
    assert.strictEqual(lastSignalName, 'cancelRun');
    
    temporalClient.signal = originalSignal;
  });
});
