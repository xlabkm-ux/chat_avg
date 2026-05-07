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
    it('should return empty array for empty/null input', async () => {
      assert.deepStrictEqual(await extractor.extractClaims('', SESSION), []);
      assert.deepStrictEqual(await extractor.extractClaims(null, SESSION), []);
      assert.deepStrictEqual(await extractor.extractClaims(undefined, SESSION), []);
    });

    it('should extract observation from data-referenced text', async () => {
      const text = 'Согласно данным исследования, 67% респондентов предпочли первый вариант.';
      const claims = await extractor.extractClaims(text, SESSION);
      assert.ok(claims.length >= 1, 'Should extract at least 1 claim');
      assert.strictEqual(claims[0].type, 'observation');
      assert.strictEqual(claims[0].strength, 'strong');
    });

    it('should extract interpretation from conclusive text', async () => {
      const text = 'Это означает, что компания существенно изменила свою стратегию.';
      const claims = await extractor.extractClaims(text, SESSION);
      assert.ok(claims.length >= 1);
      assert.strictEqual(claims[0].type, 'interpretation');
      assert.strictEqual(claims[0].strength, 'moderate');
    });

    it('should extract hypothesis from uncertain text', async () => {
      const text = 'Возможно, причина снижения связана с изменением рыночных условий.';
      const claims = await extractor.extractClaims(text, SESSION);
      assert.ok(claims.length >= 1);
      assert.strictEqual(claims[0].type, 'hypothesis');
      assert.strictEqual(claims[0].strength, 'weak');
    });

    it('should extract recommendation', async () => {
      const text = 'Рекомендуется провести дополнительный анализ перед принятием решения.';
      const claims = await extractor.extractClaims(text, SESSION);
      assert.ok(claims.length >= 1);
      assert.strictEqual(claims[0].type, 'recommendation');
    });

    it('should detect questions as hypothesis/question_only strength', async () => {
      const text = 'Может ли это быть связано с изменением конфигурации?';
      const claims = await extractor.extractClaims(text, SESSION);
      assert.ok(claims.length >= 1);
      assert.strictEqual(claims[0].strength, 'question_only');
    });

    it('should generate unique claimIds', async () => {
      const text = 'Первое утверждение тут. Второе утверждение тут рядом.';
      const claims = await extractor.extractClaims(text, SESSION);
      if (claims.length >= 2) {
        assert.notStrictEqual(claims[0].claimId, claims[1].claimId);
      }
    });

    it('should set sessionId on all claims', async () => {
      const text = 'По результатам тестирования, система работает стабильно.';
      const claims = await extractor.extractClaims(text, SESSION);
      for (const c of claims) {
        assert.strictEqual(c.sessionId, SESSION);
      }
    });

    it('should detect reality levels', async () => {
      const textFact = 'Доказано, что этот метод работает.';
      const claimsFact = await extractor.extractClaims(textFact, SESSION);
      assert.ok(claimsFact.length >= 1);
      assert.strictEqual(claimsFact[0].level, 'material');

      const textModel = 'Согласно теории систем, компоненты взаимосвязаны.';
      const claimsModel = await extractor.extractClaims(textModel, SESSION);
      assert.ok(claimsModel.length >= 1);
      assert.strictEqual(claimsModel[0].level, 'systemic');
    });
  });

  describe('downgradeStrength()', () => {
    it('should downgrade strong → moderate (1 step)', () => {
      assert.strictEqual(ClaimExtractor.downgradeStrength('strong', 1), 'moderate');
    });

    it('should downgrade strong → weak (2 steps)', () => {
      assert.strictEqual(ClaimExtractor.downgradeStrength('strong', 2), 'weak');
    });

    it('should not go below question_only', () => {
      assert.strictEqual(ClaimExtractor.downgradeStrength('question_only', 1), 'question_only');
      assert.strictEqual(ClaimExtractor.downgradeStrength('weak', 5), 'question_only');
    });

    it('should handle unknown strength', () => {
      assert.strictEqual(ClaimExtractor.downgradeStrength('unknown', 1), 'question_only');
    });
  });

  describe('getStrengthOrder()', () => {
    it('should return correct order (lower = stronger)', () => {
      assert.ok(ClaimExtractor.getStrengthOrder('strong') < ClaimExtractor.getStrengthOrder('question_only'));
      assert.ok(ClaimExtractor.getStrengthOrder('moderate') < ClaimExtractor.getStrengthOrder('weak'));
    });
  });
});
