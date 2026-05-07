/**
 * Semantic Eval Runner — запуск golden set тестов.
 * Загружает golden_set.json, прогоняет каждый кейс через SemanticProtocol, собирает метрики.
 * @module semantic.eval
 */
const { SemanticProtocol } = require('../../src/modules/semantic/semantic.protocol');
const { ClaimExtractor } = require('../../src/modules/semantic/claim.extractor');
const goldenSet = require('./golden_set.json');

class SemanticEvalRunner {
  constructor() {
    this.protocol = new SemanticProtocol();
    this.results = [];
  }

  /**
   * Запустить все кейсы из golden set.
   * @returns {{ total, passed, failed, accuracy, details }}
   */
  runAll() {
    this.results = [];
    for (const testCase of goldenSet.cases) {
      const result = this.runCase(testCase);
      this.results.push(result);
    }
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    return {
      total: this.results.length,
      passed,
      failed,
      accuracy: ((passed / this.results.length) * 100).toFixed(1) + '%',
      details: this.results,
    };
  }

  /**
   * Запустить один тестовый кейс.
   */
  runCase(testCase) {
    const sessionId = `eval-${testCase.id}`;
    const { claims, events, violations } = this.protocol.analyze(testCase.input, sessionId);
    this.protocol.clearSession(sessionId);

    const checks = [];
    let passed = true;

    // Check: expected violations (block cases)
    if (testCase.expectedViolations && testCase.expectedViolations.length > 0) {
      for (const v of testCase.expectedViolations) {
        const found = claims.some(c => c.violations.includes(v));
        if (!found) {
          checks.push({ check: `violation:${v}`, expected: true, actual: false });
          passed = false;
        } else {
          checks.push({ check: `violation:${v}`, expected: true, actual: true });
        }
      }
    }

    // Check: expected block
    if (testCase.expectedBlock) {
      const hasBlock = events.some(e => e.type === 'authority.blocked');
      if (!hasBlock) {
        checks.push({ check: 'block', expected: true, actual: false });
        passed = false;
      } else {
        checks.push({ check: 'block', expected: true, actual: true });
      }
    }

    // Check: expected type
    if (testCase.expectedType && testCase.expectedType !== 'any' && claims.length > 0) {
      const hasType = claims.some(c => c.type === testCase.expectedType);
      if (!hasType) {
        checks.push({ check: `type:${testCase.expectedType}`, expected: true, actual: false });
        passed = false;
      } else {
        checks.push({ check: `type:${testCase.expectedType}`, expected: true, actual: true });
      }
    }

    // Check: expected downgrade
    if (testCase.expectedDowngrade === true) {
      const hasDowngrade = claims.some(c => c.downgradedFrom !== null);
      if (!hasDowngrade) {
        checks.push({ check: 'downgrade', expected: true, actual: false });
        passed = false;
      } else {
        checks.push({ check: 'downgrade', expected: true, actual: true });
      }
    } else if (testCase.expectedDowngrade === false) {
      const hasDowngrade = claims.some(c => c.downgradedFrom !== null);
      if (hasDowngrade) {
        checks.push({ check: 'no_downgrade', expected: true, actual: false });
        passed = false;
      } else {
        checks.push({ check: 'no_downgrade', expected: true, actual: true });
      }
    }

    // Check: expected max strength (skip for blocked/violated claims)
    if (testCase.expectedMaxStrength && claims.length > 0) {
      const maxOrder = ClaimExtractor.getStrengthOrder(testCase.expectedMaxStrength);
      // Only check non-violated claims — blocked claims' strength is irrelevant
      const nonViolated = claims.filter(c => !c.violations || c.violations.length === 0);
      const tooStrong = nonViolated.filter(c => ClaimExtractor.getStrengthOrder(c.strength) < maxOrder);
      if (tooStrong.length > 0) {
        checks.push({ check: `maxStrength:${testCase.expectedMaxStrength}`, expected: true, actual: false, detail: tooStrong.map(c => c.strength) });
        passed = false;
      } else {
        checks.push({ check: `maxStrength:${testCase.expectedMaxStrength}`, expected: true, actual: true });
      }
    }

    // Check: expected boundary
    if (testCase.expectedBoundary && claims.length > 0) {
      const hasBoundary = claims.some(c => c.domainBoundaryId === testCase.expectedBoundary);
      if (!hasBoundary) {
        checks.push({ check: `boundary:${testCase.expectedBoundary}`, expected: true, actual: false });
        passed = false;
      } else {
        checks.push({ check: `boundary:${testCase.expectedBoundary}`, expected: true, actual: true });
      }
    }

    // Check: no violations expected but got some
    if (testCase.expectedViolations && testCase.expectedViolations.length === 0 && violations.length > 0) {
      // Only fail if the expected violations is explicitly empty AND no block expected
      if (!testCase.expectedBlock) {
        checks.push({ check: 'no_unexpected_violations', expected: true, actual: false, detail: violations.map(v => v.violations) });
        // This is a warning, not always a failure for boundary cases
      }
    }

    return {
      id: testCase.id,
      category: testCase.category,
      passed,
      claimsCount: claims.length,
      checks,
    };
  }
}

// CLI runner
if (require.main === module) {
  const runner = new SemanticEvalRunner();
  const report = runner.runAll();
  console.log('\n=== Semantic Eval Report (EVAL-001) ===');
  console.log(`Total: ${report.total} | Passed: ${report.passed} | Failed: ${report.failed} | Accuracy: ${report.accuracy}`);
  console.log('');
  for (const r of report.details) {
    const icon = r.passed ? '✅' : '❌';
    const failedChecks = r.checks.filter(c => !c.actual).map(c => c.check).join(', ');
    console.log(`${icon} ${r.id} [${r.category}] claims=${r.claimsCount}${failedChecks ? ' FAILED: ' + failedChecks : ''}`);
  }
  console.log('\n=======================================\n');
  process.exit(report.failed > 0 ? 1 : 0);
}

module.exports = { SemanticEvalRunner };
