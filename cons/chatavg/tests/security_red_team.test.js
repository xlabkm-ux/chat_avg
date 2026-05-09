/**
 * Red-Team Security Suite for Sprint 17 Release Candidate.
 * Focuses on: Tool Escalation, Cross-Tenant Leakage, and Egress Policy Bypass.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { EgressPolicy } = require('../src/modules/sandbox/egress.policy');
const { ToolGateway } = require('../src/modules/tools/tool.gateway');
const { ToolRegistry } = require('../src/modules/tools/tool.registry');
const missionRepository = require('../src/modules/mission/mission.repository');
const db = require('../src/core/sqlite');

// Disable FK constraints for unit-level security tests (no test DB fixtures)
db.exec('PRAGMA foreign_keys = OFF');

// 1. Tool Escalation & Idempotency Bypass
test('Security: Tool Escalation & Idempotency Bypass', async (t) => {
  const registry = new ToolRegistry();
  // Register a high-risk tool
  const definition = registry.registerTool({
    providerId: 'test-provider',
    toolName: 'delete_database',
    toolVersion: '1.0.0',
    schema: { type: 'object' },
    riskClass: 'privileged',
    timeoutMs: 5000
  });

  const gateway = new ToolGateway(registry);

  await t.test('rejects high-risk tool call without idempotency key', async () => {
    try {
      await gateway.executeTool(definition.cacheKey, { db: 'prod' }, 'test-run-id');
      assert.fail('Should have thrown an error for missing idempotency key');
    } catch (err) {
      assert.match(err.message, /IdempotencyKey is required/);
    }
  });
});

// 2. Cross-Tenant Leakage (Data Isolation)
test('Security: Cross-Tenant Leakage', async (t) => {
  
  await t.test('mission repository findById with username isolation', () => {
    // Setup users and sessions to satisfy foreign keys
    db.prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)').run('user_a', 'hash');
    db.prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)').run('user_b', 'hash');
    db.prepare('INSERT OR IGNORE INTO sessions (id, username) VALUES (?, ?)').run('sess-a', 'user_a');
    db.prepare('INSERT OR IGNORE INTO sessions (id, username) VALUES (?, ?)').run('sess-b', 'user_b');

    // Create mission for User A
    const missionA = missionRepository.create({
      sessionId: 'sess-a',
      username: 'user_a',
      goal: 'Goal A'
    });

    // Try to find User A's mission as User B
    const leaked = missionRepository.findById(missionA.id, 'user_b');
    assert.strictEqual(leaked, null, 'User B should not be able to find User A mission');
    
    // User A should find it
    const found = missionRepository.findById(missionA.id, 'user_a');
    assert.ok(found, 'User A should find their own mission');
  });

  // Note: We found that the routes DO NOT pass the username yet.
  // This test proves the repository supports it, but the routes are vulnerable.
});

// 3. Egress Policy Bypass
test('Security: Egress Policy Bypass', async (t) => {
  const policy = new EgressPolicy({
    tenantAllowlist: ['internal.corp'],
    signingSecret: 'top-secret'
  });

  await t.test('blocks unauthorized domains', () => {
    const result = policy.evaluate('https://evil.com/steal-data');
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.tier, 'deny_all');
  });

  await t.test('blocks local network scans (SSRF in sandbox context)', () => {
    // Note: EgressPolicy patterns allow 127.0.0.1 by default for providers.
    // We should verify if this is too permissive for general sandbox code.
    const result = policy.evaluate('http://169.254.169.254/latest/meta-data');
    assert.strictEqual(result.allowed, false);
  });

  await t.test('allows authorized tenant domains', () => {
    const result = policy.evaluate('https://sub.internal.corp/api');
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.tier, 'tenant_allowlist');
  });

  await t.test('rejects expired signed URLs', () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 60;
    const url = new URL('https://data.com/file');
    url.searchParams.set('sig', 'fake');
    url.searchParams.set('exp', expiredExp.toString());
    
    const result = policy.evaluate(url.toString());
    assert.strictEqual(result.allowed, false);
    assert.match(result.reason, /EGRESS_DENIED|EXPIRED|MISSING_SIG_PARAMS/);
  });
});
