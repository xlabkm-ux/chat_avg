/**
 * Tests: DomainBoundary — проверка границ и strength downgrade.
 * @see SPEC-005 Claim/DomainBoundary
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { DomainBoundary } = require('../../src/modules/semantic/domain.boundary');
const { ClaimExtractor } = require('../../src/modules/semantic/claim.extractor');
const { SemanticProtocol } = require('../../src/modules/semantic/semantic.protocol');

describe('DomainBoundary', () => {
  const boundary = new DomainBoundary();

  /**
   * Helper: create a claim with specified properties.
   */
  function makeClaim(text, opts = {}) {
    return {
      claimId: 'test-' + Date.now() + Math.random(),
      sessionId: 'test-session',
      text,
      type: opts.type || 'observation',
      level: opts.level || 'text',
      strength: opts.strength || 'fact',
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
    it('should downgrade medical claims to weak_hypothesis', () => {
      const claim = makeClaim('Ваш диагноз — начальная стадия заболевания.', { strength: 'fact' });
      const { claims, events } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].domainBoundaryId, 'medical');
      assert.ok(
        ClaimExtractor.getStrengthOrder(claims[0].strength) >= ClaimExtractor.getStrengthOrder('weak_hypothesis'),
        `Strength should be <= weak_hypothesis, got ${claims[0].strength}`
      );
    });

    it('should detect medical keywords (лечение, препарат)', () => {
      const claim = makeClaim('Для лечения этого заболевания используется препарат X.', { strength: 'strong_inference' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].domainBoundaryId, 'medical');
    });
  });

  describe('Legal boundary', () => {
    it('should downgrade legal claims', () => {
      const claim = makeClaim('По закону, вы обязаны платить штраф.', { strength: 'fact' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].domainBoundaryId, 'legal');
      assert.ok(claims[0].downgradedFrom !== null, 'Should have been downgraded');
    });
  });

  describe('Psychological boundary (No Psychodiagnosis)', () => {
    it('should BLOCK psychodiagnosis: "у вас депрессия"', () => {
      const claim = makeClaim('У вас депрессия.', { strength: 'strong_inference' });
      const { claims, events } = boundary.enforceBoundaries([claim]);
      assert.ok(claims[0].violations.includes('no_psychodiagnosis'), 'Should have psychodiagnosis violation');
      assert.ok(events.some(e => e.type === 'authority.blocked'), 'Should emit authority.blocked event');
    });

    it('should BLOCK: "вы проявляете признаки тревожного расстройства"', () => {
      const claim = makeClaim('Вы проявляете признаки тревожного расстройства.', { strength: 'fact' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.ok(claims[0].violations.includes('no_psychodiagnosis'));
    });

    it('should BLOCK: "you suffer from anxiety disorder"', () => {
      const claim = makeClaim('You suffer from anxiety disorder.', { strength: 'fact' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.ok(claims[0].violations.includes('no_psychodiagnosis'));
    });
  });

  describe('No Hidden Authority', () => {
    it('should BLOCK: "на самом деле вы..."', () => {
      const claim = makeClaim('На самом деле вы просто боитесь перемен.', { strength: 'fact' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.ok(claims[0].violations.includes('no_hidden_authority'));
    });

    it('should BLOCK: "я понимаю, что вы чувствуете"', () => {
      const claim = makeClaim('Я понимаю, что вы чувствуете себя одиноким.', { strength: 'strong_inference' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.ok(claims[0].violations.includes('no_hidden_authority'));
    });

    it('should BLOCK: "ваше подсознание"', () => {
      const claim = makeClaim('Ваше подсознание говорит вам о необходимости перемен.', { strength: 'strong_inference' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.ok(claims[0].violations.includes('no_hidden_authority'));
    });

    it('should BLOCK: "deep down you feel..."', () => {
      const claim = makeClaim('Deep down you know this is wrong.', { strength: 'fact' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.ok(claims[0].violations.includes('no_hidden_authority'));
    });
  });

  describe('Financial boundary', () => {
    it('should downgrade investment advice', () => {
      const claim = makeClaim('Вам следует инвестировать в акции Tesla.', { strength: 'strong_inference' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].domainBoundaryId, 'financial');
    });
  });

  describe('Missing source downgrade', () => {
    it('should downgrade fact without sourceRefs to strong_inference', () => {
      const claim = makeClaim('Чистое утверждение без источников.', { strength: 'fact', sourceRefs: [] });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].strength, 'strong_inference');
      assert.strictEqual(claims[0].downgradedReason, 'missing_source');
    });

    it('should NOT downgrade fact with sourceRefs', () => {
      const claim = makeClaim('Утверждение с источником.', { strength: 'fact', sourceRefs: ['source-1'] });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].strength, 'fact');
    });
  });

  describe('Clean cases (no violations)', () => {
    it('should not trigger on technical programming text', () => {
      const claim = makeClaim('Для создания REST API на Node.js используется Express фреймворк.', { strength: 'strong_inference' });
      const { claims } = boundary.enforceBoundaries([claim]);
      assert.strictEqual(claims[0].violations.length, 0);
      assert.strictEqual(claims[0].domainBoundaryId, null);
    });
  });
});

describe('SemanticProtocol (full pipeline)', () => {
  it('should analyze text and return claims, events, summary, violations', () => {
    const sp = new SemanticProtocol();
    const result = sp.analyze(
      'Согласно данным исследования, рост составил 15%. Возможно, это связано с сезонностью.',
      'test-pipeline-1'
    );
    assert.ok(result.claims.length >= 1, 'Should extract claims');
    assert.ok(result.events.length >= 1, 'Should produce events');
    assert.ok(typeof result.summary === 'object', 'Should have summary');
    assert.ok(Array.isArray(result.violations), 'Should have violations array');
    sp.clearSession('test-pipeline-1');
  });

  it('should detect and block hidden authority in full pipeline', () => {
    const sp = new SemanticProtocol();
    const result = sp.analyze(
      'На самом деле вы просто не хотите менять свою жизнь.',
      'test-pipeline-2'
    );
    assert.ok(result.violations.length > 0, 'Should detect violations');
    assert.ok(result.events.some(e => e.type === 'authority.blocked'));
    sp.clearSession('test-pipeline-2');
  });

  it('should return protocol version info', () => {
    const sp = new SemanticProtocol();
    const proto = sp.getProtocol();
    assert.strictEqual(proto.protocolId, 'semantic-v0');
    assert.ok(proto.prohibitions.includes('no_hidden_authority'));
  });
});
