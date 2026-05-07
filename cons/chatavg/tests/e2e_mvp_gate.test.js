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
const { ApprovalService } = require('../src/modules/policy/approval.service');
const { ClaimExtractor } = require('../src/modules/semantic/claim.extractor');

let testServer;
let token = '';
let sessionId = 'test-e2e-session-' + Date.now();
let missionId;
let runId;

test('Sprint 9 MVP Release Gate - E2E Flow', async (t) => {
  const adminPass = 'TestAdminPass123!';

  t.before((done) => {
    const hash = bcrypt.hashSync(adminPass, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, 'admin');
    
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

  await t.test('1. Login', async () => {
    const res = await request(testServer)
      .post('/api/auth/login')
      .send({ username: 'admin', password: adminPass })
      .expect(200);

    assert.ok(res.body.access_token);
    token = res.body.access_token;
  });

  await t.test('2. Fast Chat', async () => {
    // Create session
    await request(testServer)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: sessionId, title: 'E2E Session', messages: [] })
      .expect(200);

    // Fast Chat
    const res = await request(testServer)
      .post('/api/chat/completions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        messages: [{ role: 'user', content: 'Fast chat check' }],
        stream: false
      })
      .expect(200);

    assert.ok(res.body.content || res.body.choices);
  });

  await t.test('3. Mission Creation', async () => {
    const res = await request(testServer)
      .post('/api/missions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionId,
        goal: 'E2E Mission Goal',
        mode: 'max_quality'
      })
      .expect(201);
    
    assert.strictEqual(res.body.goal, 'E2E Mission Goal');
    missionId = res.body.id;
  });

  await t.test('4. AgentRun', async () => {
    const res = await request(testServer)
      .post('/api/runs')
      .set('Authorization', `Bearer ${token}`)
      .send({ missionId })
      .expect(201);
    
    assert.strictEqual(res.body.state, 'queued');
    runId = res.body.id;
  });

  await t.test('5. Semantic Claim Extraction', async () => {
    const { DomainBoundary } = require('../src/modules/semantic/domain.boundary');
    const extractor = new ClaimExtractor();
    const rawClaims = extractor.extractClaims('Пользователь утверждает, что у него диагностирована депрессия.', sessionId);
    
    const boundary = new DomainBoundary();
    const result = boundary.enforceBoundaries(rawClaims);
    
    assert.ok(result.claims.length > 0);
    // Депрессия должна стриггерить psychological boundary.
    assert.ok(result.claims.some(c => c.domainBoundaryId === 'psychological'));
  });

  await t.test('6. Approval Pause', async () => {
    // Simulate AgentRun hitting an approval requirement
    const req = ApprovalService.createRequest(runId, 'tool_call', { name: 'write_file' }, 70, 'High risk action');
    assert.strictEqual(req.state, 'pending');

    const resolved = ApprovalService.resolveRequest(req.id, 'approved');
    assert.strictEqual(resolved.state, 'approved');
  });

  await t.test('7. MVP Dashboard Verification', async () => {
    const res = await request(testServer)
      .get('/api/admin/dashboard/mvp')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.ok(res.body.run_status);
    assert.ok(res.body.feature_flags);
    assert.strictEqual(typeof res.body.semantic_events, 'number');
    assert.strictEqual(typeof res.body.approval_events, 'number');
  });
});
