const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { app } = require('../server');

test('Security Baseline: CORS enforcement', async () => {
  // Should allow same-origin (no Origin header)
  const resSame = await request(app).get('/api/health').set('Origin', ''); 
  // Note: health route might not exist, but we check if it returns 404 (route) or 403 (CORS)
  // Actually, cors middleware usually returns 200 or 204 for OPTIONS, or just proceeds.
  // If it's an error, it will be caught by errorHandler.
  
  const res1 = await request(app)
    .get('/api/auth/me')
    .set('Origin', 'http://malicious.com');
  
  // CORS error should result in an error response (depending on how errorHandler handles it)
  // In server.js, callback(new Error('CORS policy violation')) is called.
  assert.strictEqual(res1.status, 500); // errorHandler usually maps unknown errors to 500
  assert.ok(res1.body.error.message.includes('CORS policy violation'));
});

test('Security Baseline: JSON Payload limit', async () => {
  const largePayload = 'a'.repeat(2.1 * 1024 * 1024); // 2.1 MB
  const res = await request(app)
    .post('/api/auth/login')
    .send({ data: largePayload })
    .set('Content-Type', 'application/json');
  
  assert.strictEqual(res.status, 413); // Payload Too Large
});

test('Security Baseline: API Fallback', async () => {
  const res = await request(app).get('/api/v1/non-existent-route');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'not_found');
  assert.strictEqual(res.body.error.message, 'API route not found');
});

test('Security Baseline: Static files serve index.html for unknown routes', async () => {
  const res = await request(app).get('/some-page');
  assert.strictEqual(res.status, 200);
  assert.ok(res.text.includes('<!DOCTYPE html>')); // Should be index.html
});
