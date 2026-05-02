const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Set env for tests
process.env.NODE_ENV = 'test';
if (!process.env.CHATAVG_SECRET) {
  process.env.CHATAVG_SECRET = 'test_secret_that_is_at_least_32_characters_long';
}

const { app, server } = require('../server');
const db = require('../lib/sqlite');

test('API Integration Tests', async (t) => {
  let adminToken = '';
  let testUserId = 'test_user_' + Date.now();
  let testUserToken = '';

  t.after(() => {
    // Cleanup
    if (server) {
      server.close();
    }
    db.close();
    // Optionally remove the test database file
    const dataTestDir = path.join(__dirname, '..', 'data_test');
    if (fs.existsSync(dataTestDir)) {
      try {
        fs.rmSync(dataTestDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Could not remove test database: ', e.message);
      }
    }
  });

  await t.test('POST /api/auth/login - should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' })
      .expect(401);
      
    assert.strictEqual(res.body.detail, 'Неверный логин или пароль');
  });

  await t.test('POST /api/auth/login - should succeed as admin', async () => {
    // Because we use a random admin password when initializing a new db, we might not know it.
    // However, we can manually set the admin password for testing directly in the DB
    const adminPass = 'TestAdminPass123!';
    const hash = bcrypt.hashSync(adminPass, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, 'admin');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: adminPass })
      .expect(200);

    assert.ok(res.body.access_token);
    adminToken = res.body.access_token;
  });

  await t.test('GET /api/users/me - should fetch own profile', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    assert.strictEqual(res.body.username, 'admin');
    assert.strictEqual(res.body.category, 'Администратор');
  });

  await t.test('POST /api/admin/users/:username - should create a new user', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        password: 'TestUserPass123!',
        category: 'Консультант',
        n_ctx: 2048
      })
      .expect(200);

    assert.strictEqual(res.body.status, 'success');
  });

  await t.test('POST /api/auth/login - should login as new user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUserId, password: 'TestUserPass123!' })
      .expect(200);

    assert.ok(res.body.access_token);
    testUserToken = res.body.access_token;
  });

  await t.test('POST /api/sessions - should save session', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        id: 'sess-123',
        title: 'My Session',
        messages: [{ role: 'user', content: 'hello' }],
        updatedAt: Date.now()
      })
      .expect(200);

    assert.strictEqual(res.body.status, 'success');
  });

  await t.test('GET /api/sessions - should list sessions', async () => {
    const res = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200);

    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].id, 'sess-123');
    assert.strictEqual(res.body[0].title, 'My Session');
  });

  await t.test('GET /api/sessions/:id - should get session details', async () => {
    const res = await request(app)
      .get('/api/sessions/sess-123')
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200);

    assert.strictEqual(res.body.id, 'sess-123');
    assert.strictEqual(res.body.messages.length, 1);
    assert.strictEqual(res.body.messages[0].content, 'hello');
  });

  await t.test('DELETE /api/sessions/:id - should delete session', async () => {
    const res = await request(app)
      .delete('/api/sessions/sess-123')
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200);

    assert.strictEqual(res.body.status, 'success');
  });

  await t.test('PATCH /api/users/me - should update password and invalidate old token', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        password: 'NewUserPass123!'
      })
      .expect(200);

    assert.strictEqual(res.body.status, 'success');

    // Old token should be invalid
    await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(401);
  });
});
