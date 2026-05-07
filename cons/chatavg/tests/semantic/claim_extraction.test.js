/**
 * Tests: ClaimExtractor — извлечение утверждений из текста.
 * @see SPEC-005 Claim/DomainBoundary
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ClaimExtractor, STRENGTH_ORDER } = require('../../src/modules/semantic/claim.extractor');

describe('ClaimExtractor', () => {
  const extractor = new ClaimExtractor();
  const SESSION = 'test-session-1';

  describe('extractClaims()', () => {
    it('should return empty array for empty/null input', () => {
      assert.deepStrictEqual(extractor.extractClaims('', SESSION), []);
      assert.deepStrictEqual(extractor.extractClaims(null, SESSION), []);
      assert.deepStrictEqual(extractor.extractClaims(undefined, SESSION), []);
    });

    it('should extract observation from data-referenced text', () => {
      const text = 'Согласно данным исследования, 67% респондентов предпочли первый вариант.';
      const claims = extractor.extractClaims(text, SESSION);
      assert.ok(claims.length >= 1, 'Should extract at least 1 claim');
      assert.strictEqual(claims[0].type, 'observation');
      assert.strictEqual(claims[0].strength, 'fact');
    });

    it('should extract interpretation from conclusive text', () => {
      const text = 'Это означает, что компания существенно изменила свою стратегию.';
      const claims = extractor.extractClaims(text, SESSION);
      assert.ok(claims.length >= 1);
      assert.strictEqual(claims[0].type, 'interpretation');
      assert.strictEqual(claims[0].strength, 'strong_inference');
    });

    it('should extract hypothesis from uncertain text', () => {
      const text = 'Возможно, причина снижения связана с изменением рыночных условий.';
      const claims = extractor.extractClaims(text, SESSION);
      assert.ok(claims.length >= 1);
      assert.strictEqual(claims[0].type, 'hypothesis');
      assert.strictEqual(claims[0].strength, 'weak_hypothesis');
    });

    it('should extract recommendation', () => {
      const text = 'Рекомендуется провести дополнительный анализ перед принятием решения.';
      const claims = extractor.extractClaims(text, SESSION);
      assert.ok(claims.length >= 1);
      assert.strictEqual(claims[0].type, 'recommendation');
    });

    it('should detect questions as hypothesis/question strength', () => {
      const text = 'Может ли это быть связано с изменением конфигурации?';
      const claims = extractor.extractClaims(text, SESSION);
      assert.ok(claims.length >= 1);
      assert.strictEqual(claims[0].strength, 'question');
    });

    it('should generate unique claimIds', () => {
      const text = 'Первое утверждение тут. Второе утверждение тут рядом.';
      const claims = extractor.extractClaims(text, SESSION);
      if (claims.length >= 2) {
        assert.notStrictEqual(claims[0].claimId, claims[1].claimId);
      }
    });

    it('should set sessionId on all claims', () => {
      const text = 'По результатам тестирования, система работает стабильно.';
      const claims = extractor.extractClaims(text, SESSION);
      for (const c of claims) {
        assert.strictEqual(c.sessionId, SESSION);
      }
    });

    it('should detect reality levels', () => {
      const textFact = 'Доказано, что этот метод работает.';
      const claimsFact = extractor.extractClaims(textFact, SESSION);
      assert.ok(claimsFact.length >= 1);
      assert.strictEqual(claimsFact[0].level, 'fact');

      const textModel = 'Согласно теории систем, компоненты взаимосвязаны.';
      const claimsModel = extractor.extractClaims(textModel, SESSION);
      assert.ok(claimsModel.length >= 1);
      assert.strictEqual(claimsModel[0].level, 'model');
    });
  });

  describe('downgradeStrength()', () => {
    it('should downgrade fact → strong_inference (1 step)', () => {
      assert.strictEqual(ClaimExtractor.downgradeStrength('fact', 1), 'strong_inference');
    });

    it('should downgrade fact → weak_hypothesis (2 steps)', () => {
      assert.strictEqual(ClaimExtractor.downgradeStrength('fact', 2), 'weak_hypothesis');
    });

    it('should not go below question', () => {
      assert.strictEqual(ClaimExtractor.downgradeStrength('question', 1), 'question');
      assert.strictEqual(ClaimExtractor.downgradeStrength('weak_hypothesis', 5), 'question');
    });

    it('should handle unknown strength', () => {
      assert.strictEqual(ClaimExtractor.downgradeStrength('unknown', 1), 'question');
    });
  });

  describe('getStrengthOrder()', () => {
    it('should return correct order (lower = stronger)', () => {
      assert.ok(ClaimExtractor.getStrengthOrder('fact') < ClaimExtractor.getStrengthOrder('question'));
      assert.ok(ClaimExtractor.getStrengthOrder('strong_inference') < ClaimExtractor.getStrengthOrder('weak_hypothesis'));
    });
  });
});
