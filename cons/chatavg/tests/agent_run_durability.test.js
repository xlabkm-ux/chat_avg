const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcryptjs');

// Set env for tests
process.env.NODE_ENV = 'test';
if (!process.env.CHATAVG_SECRET) {
  process.env.CHATAVG_SECRET = 'test_secret_that_is_at_least_32_characters_long';
}

const { app } = require('../server');
const db = require('../src/core/sqlite');
const runRepository = require('../src/modules/execution/run.repository');
const runService = require('../src/modules/execution/run.service');

let testServer;
let token = '';
let sessionId = 'durability-session-' + Date.now();
let missionId;
const adminPass = 'TestAdminPass123!';

// Mock background execution to prevent interference with state machine tests
runService.inMemoryExecution = async () => { /* do nothing */ };

test('AgentRun Durability & State Machine Tests', async (t) => {
  t.before((done) => {
    const hash = bcrypt.hashSync(adminPass, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, 'admin');
    db.prepare('UPDATE categories SET provider = ?, model_name = ? WHERE name = ?')
      .run('test', 'mock', 'Администратор');
    testServer = app.listen(0, done);
  });

  t.after(async () => {
    if (testServer) {
      testServer.closeAllConnections();
      await new Promise(r => testServer.close(r));
    }
    db.close();
  });

  await t.test('Setup: Login and Create Mission', async () => {
    const loginRes = await request(testServer)
      .post('/api/auth/login')
      .send({ username: 'admin', password: adminPass });
    token = loginRes.body.access_token;

    await request(testServer)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: sessionId, title: 'Durability Test', messages: [] });

    const missionRes = await request(testServer)
      .post('/api/missions')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId, goal: 'Durability Goal' });
    missionId = missionRes.body.id;
  });

  await t.test('Strict State Machine: valid transitions', async () => {
    const run = await runService.createRun(missionId, {}, 'admin');
    assert.strictEqual(run.state, 'queued');

    await runService.updateState(run.id, 'running', {}, 'test', 'admin');
    const r1 = runRepository.findById(run.id);
    assert.strictEqual(r1.state, 'running');

    await runService.updateState(run.id, 'waiting', {}, 'test', 'admin');
    const r2 = runRepository.findById(run.id);
    assert.strictEqual(r2.state, 'waiting');

    await runService.updateState(run.id, 'running', {}, 'test', 'admin');
    const r3 = runRepository.findById(run.id);
    assert.strictEqual(r3.state, 'running');

    await runService.updateState(run.id, 'completed', {}, 'test', 'admin');
    const r4 = runRepository.findById(run.id);
    assert.strictEqual(r4.state, 'completed');
  });

  await t.test('Strict State Machine: invalid transitions', async () => {
    const run = await runService.createRun(missionId, {}, 'admin');
    
    // queued -> completed is invalid
    await assert.rejects(
      runService.updateState(run.id, 'completed', {}, 'test', 'admin'),
      /Invalid state transition: queued -> completed/
    );

    await runService.updateState(run.id, 'running', {}, 'test', 'admin');
    
    // running -> queued is invalid
    await assert.rejects(
      runService.updateState(run.id, 'queued', {}, 'test', 'admin'),
      /Invalid state transition: running -> queued/
    );

    await runService.updateState(run.id, 'completed', {}, 'test', 'admin');
    
    // terminal -> anything is invalid
    await assert.rejects(
      runService.updateState(run.id, 'running', {}, 'test', 'admin'),
      /Invalid state transition: completed -> running/
    );
  });

  await t.test('Persisted Event Log: events should be in DB', async () => {
    const run = await runService.createRun(missionId, {}, 'admin');
    runService.emitEvent(run.id, 'test.event', { foo: 'bar' });

    const events = runRepository.getEvents(run.id);
    // Should have 2 events: status_changed (queued) and test.event
    assert.strictEqual(events.length, 2);
    assert.strictEqual(events[0].event_type, 'run.status_changed');
    assert.strictEqual(events[1].event_type, 'test.event');
    assert.strictEqual(events[1].payload.foo, 'bar');
  });

  await t.test('Idempotency: createRun should be idempotent', async () => {
    const ikey = 'test-idempotency-' + Date.now();
    const run1 = await runService.createRun(missionId, { tag: 'first' }, 'admin', ikey);
    const run2 = await runService.createRun(missionId, { tag: 'second' }, 'admin', ikey);

    assert.strictEqual(run1.id, run2.id);
    assert.strictEqual(run1.metadata.tag, 'first');
    assert.strictEqual(run2.metadata.tag, 'first'); // Should return the same object
  });

  await t.test('SSE Recoverability: sinceEventId', async () => {
    const run = await runService.createRun(missionId, {}, 'admin');
    await new Promise(r => setTimeout(r, 50));
    runService.emitEvent(run.id, 'event.1', { n: 1 });
    await new Promise(r => setTimeout(r, 50));
    runService.emitEvent(run.id, 'event.2', { n: 2 });
    await new Promise(r => setTimeout(r, 50));
    runService.emitEvent(run.id, 'event.3', { n: 3 });

    const allEvents = runRepository.getEvents(run.id);
    const firstEventId = allEvents[0].id;

    // Request events since the first one
    const sinceFirst = runRepository.getEvents(run.id, firstEventId);
    assert.strictEqual(sinceFirst.length, 3); // event.1, event.2, event.3
    assert.strictEqual(sinceFirst[0].event_type, 'event.1');
  });
});
