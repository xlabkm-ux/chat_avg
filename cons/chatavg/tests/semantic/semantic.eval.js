/**
 * Semantic Eval Runner v0.2 — запуск golden set тестов.
 * Загружает golden_set.json, прогоняет каждый кейс через SemanticProtocol, собирает метрики.
 * @module semantic.eval
 */
const { SemanticProtocol } = require('../../src/modules/semantic/semantic.protocol');
const { ClaimExtractor } = require('../../src/modules/semantic/claim.extractor');
const goldenSet = require('./golden_set.json');
const db = require('../../src/core/sqlite');

class SemanticEvalRunner {
  constructor() {
    this.protocol = new SemanticProtocol();
    this.results = [];
    this.username = 'eval-runner';
  }

  /**
   * Запустить все кейсы из golden set.
   * @returns {Promise<{ total, passed, failed, accuracy, details }>}
   */
  async runAll() {
    this.results = [];
    
    // Setup user
    db.prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)').run(this.username, 'hash');
    
    // Seed boundaries
    const { DEFAULT_BOUNDARIES } = require('../../src/modules/semantic/domain.boundary');
    const insertBoundary = db.prepare('INSERT OR IGNORE INTO domain_boundaries (id, name, description, level, max_allowed_strength, rules, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const b of DEFAULT_BOUNDARIES) {
      insertBoundary.run(b.boundaryId, b.name, b.description, b.level, b.maxAllowedStrength, JSON.stringify(b.rules), Date.now());
    }

    const cases = Array.isArray(goldenSet) ? goldenSet : (goldenSet.cases || []);

    for (const testCase of cases) {
      const result = await this.runCase(testCase);
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
  async runCase(testCase) {
    const sessionId = `eval-${testCase.id}`;
    
    // Create session
    db.prepare('INSERT OR IGNORE INTO sessions (id, username, title, messages, updatedAt) VALUES (?, ?, ?, ?, ?)').run(
      sessionId, this.username, `Eval ${testCase.id}`, '[]', Date.now()
    );

    const result = await this.protocol.analyze(testCase.text, sessionId, { username: this.username });
    const { claims, events, violations } = result;

    const checks = [];
    let passed = true;

    // Check: expected type
    if (testCase.expected_type) {
      const found = claims.some(c => c.type === testCase.expected_type);
      if (!found) {
        checks.push({ check: `type:${testCase.expected_type}`, expected: true, actual: false });
        passed = false;
      } else {
        checks.push({ check: `type:${testCase.expected_type}`, expected: true, actual: true });
      }
    }

    // Check: expected level
    if (testCase.expected_level) {
      const found = claims.some(c => c.level === testCase.expected_level);
      if (!found) {
        checks.push({ check: `level:${testCase.expected_level}`, expected: true, actual: false });
        passed = false;
      } else {
        checks.push({ check: `level:${testCase.expected_level}`, expected: true, actual: true });
      }
    }

    // Check: expected boundary
    if (testCase.boundary) {
      const found = claims.some(c => c.domainBoundaryId === testCase.boundary);
      if (!found) {
        checks.push({ check: `boundary:${testCase.boundary}`, expected: true, actual: false });
        passed = false;
      } else {
        checks.push({ check: `boundary:${testCase.boundary}`, expected: true, actual: true });
      }
    }

    // Check: expected action (block/downgrade)
    if (testCase.expected_action === 'block') {
      const hasBlock = events.some(e => e.type === 'authority.blocked');
      if (!hasBlock) {
        checks.push({ check: 'block', expected: true, actual: false });
        passed = false;
      } else {
        checks.push({ check: 'block', expected: true, actual: true });
      }
    } else if (testCase.expected_action === 'downgrade') {
      const hasDowngrade = claims.some(c => c.downgradedFrom !== null);
      if (!hasDowngrade) {
        checks.push({ check: 'downgrade', expected: true, actual: false });
        passed = false;
      } else {
        checks.push({ check: 'downgrade', expected: true, actual: true });
        
        if (testCase.target_strength) {
          const targetMet = claims.some(c => c.strength === testCase.target_strength);
          if (!targetMet) {
            checks.push({ check: `target_strength:${testCase.target_strength}`, expected: true, actual: false });
            passed = false;
          } else {
            checks.push({ check: `target_strength:${testCase.target_strength}`, expected: true, actual: true });
          }
        }
      }
    }

    this.protocol.clearSession(sessionId);
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);

    return {
      id: testCase.id,
      text: testCase.text,
      passed,
      claimsCount: claims.length,
      checks,
    };
  }
}

// CLI runner
if (require.main === module) {
  (async () => {
    try {
      const runner = new SemanticEvalRunner();
      const report = await runner.runAll();
      console.log('\n=== Semantic Eval Report v0.2 ===');
      console.log(`Total: ${report.total} | Passed: ${report.passed} | Failed: ${report.failed} | Accuracy: ${report.accuracy}`);
      console.log('');
      for (const r of report.details) {
        const icon = r.passed ? '✅' : '❌';
        const failedChecks = r.checks.filter(c => !c.actual).map(c => c.check).join(', ');
        console.log(`${icon} ${r.id} claims=${r.claimsCount}${failedChecks ? ' FAILED: ' + failedChecks : ''}`);
        if (!r.passed) {
          console.log(`   Text: "${r.text.substring(0, 100)}..."`);
        }
      }
      console.log('\n=======================================\n');
      process.exit(report.failed > 0 ? 1 : 0);
    } catch (e) {
      console.error('Eval runner failed:', e);
      process.exit(1);
    }
  })();
}

module.exports = { SemanticEvalRunner };
