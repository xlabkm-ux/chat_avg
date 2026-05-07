const test = require('node:test');
const assert = require('node:assert');
const { SemanticProtocol } = require('../../src/modules/semantic/semantic.protocol');
const semanticRepository = require('../../src/modules/semantic/semantic.repository');
const db = require('../../src/core/sqlite');

test('Semantic Layer v0.2 Integration Test', async (t) => {
  const protocol = new SemanticProtocol();
  const sessionId = 'test-session-' + Date.now();
  const username = 'test-user';

  // Setup: satisfy FK constraints
  db.prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)').run(username, 'hash');
  db.prepare('INSERT OR IGNORE INTO sessions (id, username, title, messages, updatedAt) VALUES (?, ?, ?, ?, ?)').run(
    sessionId, username, 'Test Session', '[]', Date.now()
  );

  // Seed Domain Boundaries
  const { DEFAULT_BOUNDARIES } = require('../../src/modules/semantic/domain.boundary');
  const insertBoundary = db.prepare('INSERT OR IGNORE INTO domain_boundaries (id, name, description, level, max_allowed_strength, rules, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const b of DEFAULT_BOUNDARIES) {
    insertBoundary.run(b.boundaryId, b.name, b.description, b.level, b.maxAllowedStrength, JSON.stringify(b.rules), Date.now());
  }

  // Setup: clear data for this session
  protocol.clearSession(sessionId);

  await t.test('Should extract claims with source spans and persist them', async () => {
    const text = 'Согласно отчету, продажи выросли. Возможно, это приведет к прибыли.';
    const result = await protocol.analyze(text, sessionId, { username });

    assert.strictEqual(result.claims.length, 2);
    assert.ok(result.claims[0].sourceSpan, 'Claim 0 should have sourceSpan');
    assert.ok(result.claims[1].sourceSpan, 'Claim 1 should have sourceSpan');
    
    // Verify persistence
    const savedClaims = semanticRepository.getClaimsBySession(sessionId, username);
    assert.strictEqual(savedClaims.length, 2, 'Should have 2 claims in DB');
    assert.strictEqual(savedClaims[0].text, 'Согласно отчету, продажи выросли.');
  });

  await t.test('Should enforce medical boundary and downgrade strength', async () => {
    const text = 'Ваш диагноз — грипп. Вам следует принимать аспирин.';
    const result = await protocol.analyze(text, sessionId, { username });

    const medicalClaim = result.claims.find(c => c.text.includes('диагноз'));
    assert.strictEqual(medicalClaim.domainBoundaryId, 'medical');
    assert.strictEqual(medicalClaim.strength, 'weak');
    assert.ok(medicalClaim.downgradedFrom, 'Should be downgraded');
    
    // Check events
    const downgradeEvent = result.events.find(e => e.type === 'claim.downgraded');
    assert.ok(downgradeEvent, 'Should have downgrade event');
  });

  await t.test('Should block psychological diagnosis and set requiresUserDecision', async () => {
    const text = 'Я вижу, что у вас депрессия.';
    const result = await protocol.analyze(text, sessionId, { username });

    const psychClaim = result.claims.find(c => c.text.includes('депрессия'));
    assert.strictEqual(psychClaim.domainBoundaryId, 'psychological');
    assert.ok(psychClaim.requiresUserDecision, 'Should require user decision');
    assert.strictEqual(result.violations.length, 1);
    
    const blockedEvent = result.events.find(e => e.type === 'authority.blocked');
    assert.ok(blockedEvent, 'Should have blocked event');
  });

  await t.test('Should detect reality levels correctly', async () => {
    const text = 'Это физический объект. Я чувствую радость. Это социальная норма.';
    const result = await protocol.analyze(text, sessionId, { username });

    const materialClaim = result.claims.find(c => c.text.includes('физический'));
    const psychicClaim = result.claims.find(c => c.text.includes('чувствую'));
    const socialClaim = result.claims.find(c => c.text.includes('социальная'));

    assert.strictEqual(materialClaim.level, 'material');
    assert.strictEqual(psychicClaim.level, 'psychic');
    assert.strictEqual(socialClaim.level, 'social');
  });

  await t.test('Should handle downgrade for missing sources', async () => {
    // A claim with strong intent but no sourceRefs provided in options
    const text = 'Согласно данным статистики, инфляция выросла.';
    const result = await protocol.analyze(text, sessionId, { username, sourceRefs: [] });

    const claim = result.claims[0];
    // Rule-based extractor gives 'strong' for 'Согласно данным'
    // but _checkMissingSource should downgrade it to 'moderate'
    assert.strictEqual(claim.strength, 'moderate');
    assert.strictEqual(claim.downgradedReason, 'missing_source');
  });

  // Cleanup
  protocol.clearSession(sessionId);
});
