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

let testServer;
let token = '';
let sessionId = 'test-session-' + Date.now();
let missionId;
let runId;

test('AgentRun & Mission API Tests', async (t) => {
  const adminPass = 'TestAdminPass123!';

  t.before((done) => {
    // Setup admin password for predictable testing
    const hash = bcrypt.hashSync(adminPass, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, 'admin');
    
    // Switch admin category to use the deterministic test provider
    db.prepare('UPDATE categories SET provider = ?, model_name = ? WHERE name = ?')
      .run('test', 'mock', 'Администратор');
      
    testServer = app.listen(0, done);
  });

  t.after((done) => {
    if (testServer) {
      testServer.closeAllConnections();
      testServer.close(done);
    } else {
      done();
    }
  });

  await t.test('Setup: Login as admin', async () => {
    const res = await request(testServer)
      .post('/api/auth/login')
      .send({ username: 'admin', password: adminPass })
      .expect(200);

    assert.ok(res.body.access_token);
    token = res.body.access_token;
  });

  await t.test('POST /api/missions - should create a mission', async () => {
    // 1. Create a session first to satisfy foreign key
    await request(testServer)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: sessionId,
        title: 'Test Session',
        messages: []
      })
      .expect(200);

    // 2. Create the mission
    const res = await request(testServer)
      .post('/api/missions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionId,
        goal: 'Test mission goal',
        mode: 'balanced'
      })
      .expect(201);
    
    assert.strictEqual(res.body.goal, 'Test mission goal');
    assert.ok(res.body.id);
    missionId = res.body.id;
  });

  await t.test('POST /api/runs - should create an agent run', async () => {
    const res = await request(testServer)
      .post('/api/runs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        missionId
      })
      .expect(201);
    
    assert.strictEqual(res.body.state, 'queued');
    runId = res.body.id;
  });

  await t.test('POST /api/chat/completions - should transition states during chat', async () => {
    const res = await request(testServer)
      .post('/api/chat/completions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        messages: [{ role: 'user', content: 'Hello' }],
        run_id: runId, // Use snake_case explicitly
        stream: false
      })
      .expect(200);
    
    // Check state after chat
    const runRes = await request(testServer)
      .get(`/api/runs/${runId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    assert.strictEqual(runRes.body.state, 'completed');
  });

  await t.test('POST /api/runs/:id/cancel - should allow cancelling a run', async () => {
    const newRunRes = await request(testServer)
      .post('/api/runs')
      .set('Authorization', `Bearer ${token}`)
      .send({ missionId })
      .expect(201);
    
    const newRunId = newRunRes.body.id;

    const cancelRes = await request(testServer)
      .post(`/api/runs/${newRunId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Test cancel' })
      .expect(200);
    
    assert.strictEqual(cancelRes.body.state, 'cancelled');
  });

  await t.test('GET /api/runs/:id/events - should provide an event stream', { skip: true }, async () => {
    // This test tends to hang in supertest because it waits for the stream to close.
    // Verifying it manually or with a more specialized SSE client is recommended.
  });
});
