/**
 * Tests: DomainBoundary — проверка границ и strength downgrade.
 * @see SPEC-005 Claim/DomainBoundary
 */
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { DomainBoundary } = require('../../src/modules/semantic/domain.boundary');
const { ClaimExtractor } = require('../../src/modules/semantic/claim.extractor');
const { SemanticProtocol } = require('../../src/modules/semantic/semantic.protocol');
const db = require('../../src/core/sqlite');

describe('DomainBoundary', () => {
  const boundary = new DomainBoundary();
  const username = 'test-user-db';
  const sessionId = 'test-session-db';

  before(() => {
    // Satisfy FK constraints for persistence
    db.prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)').run(username, 'hash');
    db.prepare('INSERT OR IGNORE INTO sessions (id, username, title, messages, updatedAt) VALUES (?, ?, ?, ?, ?)').run(
      sessionId, username, 'Test Session', '[]', Date.now()
    );

    // Seed boundaries
    const { DEFAULT_BOUNDARIES } = require('../../src/modules/semantic/domain.boundary');
    const insertBoundary = db.prepare('INSERT OR IGNORE INTO domain_boundaries (id, name, description, level, max_allowed_strength, rules, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const b of DEFAULT_BOUNDARIES) {
      insertBoundary.run(b.boundaryId, b.name, b.description, b.level, b.maxAllowedStrength, JSON.stringify(b.rules), Date.now());
    }
  });

  /**
   * Helper: create a claim with specified properties.
   */
  function makeClaim(text, opts = {}) {
    return {
      claimId: 'test-' + Date.now() + Math.random(),
      sessionId: sessionId,
      username: username,
      text,
      type: opts.type || 'observation',
      level: opts.level || 'unknown',
      strength: opts.strength || 'strong',
      domainBoundaryId: null,
      sourceRefs: opts.sourceRefs || [],
      downgradedFrom: null,
      downgradedReason: null,
      violations: [],
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    };
  }

  describe('Medical boundary', () => {
    it('should downgrade medical claims to weak', () => {
      const claim = makeClaim('Ваш диагноз — начальная стадия заболевания.', { strength: 'strong' });
      const { claims, events } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].domainBoundaryId, 'medical');
      assert.ok(
        ClaimExtractor.getStrengthOrder(claims[0].strength) >= ClaimExtractor.getStrengthOrder('weak'),
        `Strength should be <= weak, got ${claims[0].strength}`
      );
    });

    it('should detect medical keywords (лечение, препарат)', () => {
      const claim = makeClaim('Для лечения этого заболевания используется препарат X.', { strength: 'moderate' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].domainBoundaryId, 'medical');
    });
  });

  describe('Legal boundary', () => {
    it('should downgrade legal claims', () => {
      const claim = makeClaim('По закону, вы обязаны платить штраф.', { strength: 'strong' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].domainBoundaryId, 'legal');
      assert.ok(claims[0].downgradedFrom !== null, 'Should have been downgraded');
    });
  });

  describe('Psychological boundary (No Psychodiagnosis)', () => {
    it('should BLOCK psychodiagnosis: "у вас депрессия"', () => {
      const claim = makeClaim('У вас депрессия.', { strength: 'moderate' });
      const { claims, events } = boundary.enforceBoundaries([claim]);
      assert.ok(claims[0].violations.includes('no_psychodiagnosis'), 'Should have psychodiagnosis violation');
      assert.ok(events.some(e => e.type === 'authority.blocked'), 'Should emit authority.blocked event');
    });
  });

  describe('No Hidden Authority', () => {
    it('should BLOCK: "на самом деле вы..."', () => {
      const claim = makeClaim('На самом деле вы просто боитесь перемен.', { strength: 'strong' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.ok(claims[0].violations.includes('no_hidden_authority'));
    });
  });

  describe('Financial boundary', () => {
    it('should downgrade investment advice', () => {
      const claim = makeClaim('Вам следует инвестировать в акции Tesla.', { strength: 'moderate' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].domainBoundaryId, 'financial');
    });
  });

  describe('Missing source downgrade', () => {
    it('should downgrade strong without sourceRefs to moderate', () => {
      const claim = makeClaim('Чистое утверждение без источников.', { strength: 'strong', sourceRefs: [] });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].strength, 'moderate');
      assert.strictEqual(claims[0].downgradedReason, 'missing_source');
    });

    it('should NOT downgrade strong with sourceRefs', () => {
      const claim = makeClaim('Утверждение с источником.', { strength: 'strong', sourceRefs: ['source-1'] });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].strength, 'strong');
    });
  });
});

describe('SemanticProtocol (full pipeline)', () => {
  const username = 'test-user-sp';
  const sessionId = 'test-session-sp';

  before(() => {
    db.prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)').run(username, 'hash');
    db.prepare('INSERT OR IGNORE INTO sessions (id, username, title, messages, updatedAt) VALUES (?, ?, ?, ?, ?)').run(
      sessionId, username, 'Test Session', '[]', Date.now()
    );
  });

  it('should analyze text and return claims, events, summary, violations', async () => {
    const sp = new SemanticProtocol();
    const result = await sp.analyze(
      'Согласно данным исследования, рост составил 15%. Возможно, это связано с сезонностью.',
      sessionId,
      { username }
    );
    assert.ok(result.claims.length >= 1, 'Should extract claims');
    assert.ok(result.events.length >= 1, 'Should produce events');
    assert.ok(typeof result.summary === 'object', 'Should have summary');
    assert.ok(Array.isArray(result.violations), 'Should have violations array');
    sp.clearSession(sessionId);
  });

  it('should detect and block hidden authority in full pipeline', async () => {
    const sp = new SemanticProtocol();
    const result = await sp.analyze(
      'На самом деле вы просто не хотите менять свою жизнь.',
      sessionId,
      { username }
    );
    assert.ok(result.violations.length > 0, 'Should detect violations');
    assert.ok(result.events.some(e => e.type === 'authority.blocked'));
    sp.clearSession(sessionId);
  });
});
