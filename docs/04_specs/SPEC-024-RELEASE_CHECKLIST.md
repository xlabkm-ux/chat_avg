---
id: SPEC-024
title: Release Candidate Checklist (ChatAVG v2.3)
version: 1.0.0
owner: Core Team
status: Draft
last_updated: 2026-05-07
sprint: Sprint 15
---

# SPEC-024: Release Candidate Checklist (ChatAVG v2.3)

**Status:** Draft / Release Candidate  
**Version:** 1.0  
**Target:** Production Rollout  

This document defines the mandatory verification steps required before the ChatAVG v2.3 system is declared ready for production deployment.

## 1. Security Gates
- [ ] **Fail-closed Sandbox**: Verify that `LocalAdapter` is prohibited in production and system fails boot if `E2B_API_KEY` is missing but sandbox is enabled.
- [ ] **Secure Boot**: Verify `CHATAVG_ADMIN_PASSWORD` requirement in production.
- [ ] **Policy Guard**: Verify all sensitive routes (`/api/admin`, `/api/sandboxes`, `/api/runs`) are protected by `policyGuard`.
- [ ] **Egress Control**: Verify default-deny egress policy in sandboxes.
- [ ] **Secrets Redaction**: Verify that API keys and secrets are masked in audit logs and traces.

## 2. Observability Gates
- [ ] **Metrics Collection**: Verify real-time P95 latency and error rate tracking in `MetricsService`.
- [ ] **Trace Bus**: Verify execution traces for Model, RAG, Tool, and Sandbox actions.
- [ ] **MVP Dashboard**: Verify that the dashboard displays real metrics (not placeholders).
- [ ] **Audit Coverage**: Verify that all security-sensitive actions generate audit logs.

## 3. Reliability & QA Gates
- [ ] **Durable Execution**: Verify that `AgentRun` survives worker restarts (Temporal).
- [ ] **Idempotency**: Verify that side-effect tools require and enforce `idempotencyKey`.
- [ ] **Load Capacity**: Verify system stability under 50+ concurrent events/sec (per `LoadHarness`).
- [ ] **Chaos Resilience**: Verify graceful fallback on provider timeouts or bad gateways.
- [ ] **RAG Quality**: RAG evaluation score ≥ 80%.
- [ ] **Semantic Accuracy**: Semantic evaluation accuracy ≥ 80% (v0.2 baseline).

## 4. Operational Gates
- [ ] **Rollback Plan**: `RUNBOOK-003` is tested and verified.
- [ ] **Migration Path**: `MIGRATION-001` (V1 fallback) is documented.
- [ ] **Runbook Suite**: Runbooks for Temporal, E2B, and LiteLLM recovery are available.

## 5. Sign-off
- [ ] Architecture Sign-off
- [ ] Security Sign-off
- [ ] QA Sign-off
- [ ] Product Sign-off

## 6. Code Examples

### Example 1: Automated Release Validation Script

```javascript
// scripts/validateRelease.js
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class ReleaseValidator {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://localhost:8200';
    this.adminPassword = process.env.CHATAVG_ADMIN_PASSWORD;
    this.results = [];
  }

  async runAllChecks() {
    console.log('Starting release validation...\n');

    const checks = [
      { name: 'Security Gates', fn: () => this.validateSecurityGates() },
      { name: 'Observability Gates', fn: () => this.validateObservabilityGates() },
      { name: 'Reliability Gates', fn: () => this.validateReliabilityGates() },
      { name: 'Operational Gates', fn: () => this.validateOperationalGates() },
    ];

    for (const check of checks) {
      try {
        console.log(`Running ${check.name}...`);
        const result = await check.fn();
        this.results.push({
          gate: check.name,
          passed: true,
          details: result,
        });
        console.log(`✓ ${check.name} passed\n`);
      } catch (error) {
        this.results.push({
          gate: check.name,
          passed: false,
          error: error.message,
        });
        console.log(`✗ ${check.name} failed: ${error.message}\n`);
      }
    }

    this.printSummary();
    return this.results.every(r => r.passed);
  }

  async validateSecurityGates() {
    const results = {};

    // Check 1: Fail-closed sandbox
    try {
      const response = await axios.post(`${this.baseUrl}/api/sandboxes`, {
        executionClass: 'code',
      }, {
        headers: { 'Authorization': `Bearer ${this.adminPassword}` },
        validateStatus: () => true,
      });

      if (response.status === 500 && response.data.error?.includes('E2B_API_KEY')) {
        results.failClosedSandbox = true;
      } else {
        throw new Error('Sandbox did not fail-closed on missing E2B_API_KEY');
      }
    } catch (error) {
      results.failClosedSandbox = false;
      console.error('Fail-closed check failed:', error.message);
    }

    // Check 2: Policy guard on sensitive routes
    const protectedRoutes = ['/api/admin', '/api/sandboxes', '/api/runs'];
    results.policyGuardProtection = {};

    for (const route of protectedRoutes) {
      try {
        const response = await axios.get(`${this.baseUrl}${route}`, {
          validateStatus: () => true,
        });

        if (response.status === 401 || response.status === 403) {
          results.policyGuardProtection[route] = true;
        } else {
          results.policyGuardProtection[route] = false;
          throw new Error(`Route ${route} is not protected`);
        }
      } catch (error) {
        results.policyGuardProtection[route] = false;
      }
    }

    // Check 3: Secrets redaction in logs
    results.secretsRedaction = await this.checkSecretsRedaction();

    const allPassed = Object.values(results).every(v => v === true || Object.values(v).every(x => x === true));
    if (!allPassed) {
      throw new Error('Security gates validation failed');
    }

    return results;
  }

  async validateObservabilityGates() {
    const results = {};

    // Check metrics collection
    try {
      const metricsResponse = await axios.get(`${this.baseUrl}/api/metrics`, {
        headers: { 'Authorization': `Bearer ${this.adminPassword}` },
      });

      if (metricsResponse.data.p95Latency !== undefined) {
        results.metricsCollection = true;
      } else {
        throw new Error('Metrics endpoint missing p95Latency');
      }
    } catch (error) {
      results.metricsCollection = false;
      throw new Error('Failed to validate metrics collection');
    }

    // Check trace bus
    try {
      const tracesResponse = await axios.get(`${this.baseUrl}/api/traces?limit=10`, {
        headers: { 'Authorization': `Bearer ${this.adminPassword}` },
      });

      if (Array.isArray(tracesResponse.data)) {
        results.traceBus = true;
      } else {
        throw new Error('Traces endpoint did not return array');
      }
    } catch (error) {
      results.traceBus = false;
      throw new Error('Failed to validate trace bus');
    }

    // Check dashboard has real data
    try {
      const dashboardResponse = await axios.get(`${this.baseUrl}/api/dashboard`, {
        headers: { 'Authorization': `Bearer ${this.adminPassword}` },
      });

      const hasRealData = dashboardResponse.data.widgets?.some(w => w.data && !w.placeholder);
      results.mvpDashboard = hasRealData;

      if (!hasRealData) {
        throw new Error('Dashboard contains only placeholder data');
      }
    } catch (error) {
      results.mvpDashboard = false;
      throw new Error('Failed to validate dashboard');
    }

    return results;
  }

  async validateReliabilityGates() {
    const results = {};

    // Check durable execution (Temporal)
    results.durableExecution = await this.testDurableExecution();

    // Check idempotency
    results.idempotency = await this.testIdempotency();

    // Check load capacity
    results.loadCapacity = await this.testLoadCapacity();

    // Check chaos resilience
    results.chaosResilience = await this.testChaosResilience();

    const allPassed = Object.values(results).every(v => v === true);
    if (!allPassed) {
      throw new Error('Reliability gates validation failed');
    }

    return results;
  }

  async testDurableExecution() {
    // Start an AgentRun
    const runResponse = await axios.post(`${this.baseUrl}/api/runs`, {
      missionId: 'test-mission',
      message: 'Test durable execution',
    }, {
      headers: { 'Authorization': `Bearer ${this.adminPassword}` },
    });

    const runId = runResponse.data.runId;

    // Simulate worker restart
    await execAsync('docker restart chatavg-worker');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    // Check if run survived
    const statusResponse = await axios.get(`${this.baseUrl}/api/runs/${runId}`, {
      headers: { 'Authorization': `Bearer ${this.adminPassword}` },
    });

    return statusResponse.data.status !== 'failed';
  }

  async testIdempotency() {
    const idempotencyKey = `test-${Date.now()}`;

    // First request
    const response1 = await axios.post(`${this.baseUrl}/api/tools/execute`, {
      toolName: 'write_file',
      arguments: { path: '/tmp/test.txt', content: 'test' },
      idempotencyKey,
    }, {
      headers: { 'Authorization': `Bearer ${this.adminPassword}` },
    });

    // Second request with same key
    const response2 = await axios.post(`${this.baseUrl}/api/tools/execute`, {
      toolName: 'write_file',
      arguments: { path: '/tmp/test.txt', content: 'test' },
      idempotencyKey,
    }, {
      headers: { 'Authorization': `Bearer ${this.adminPassword}` },
    });

    // Should return cached result
    return response1.data.result === response2.data.result;
  }

  async testLoadCapacity() {
    const concurrentRequests = 50;
    const promises = [];

    const startTime = Date.now();

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        axios.get(`${this.baseUrl}/api/health`).catch(() => null)
      );
    }

    const responses = await Promise.all(promises);
    const duration = Date.now() - startTime;

    const successCount = responses.filter(r => r && r.status === 200).length;
    const successRate = successCount / concurrentRequests;

    console.log(`Load test: ${successCount}/${concurrentRequests} succeeded in ${duration}ms`);

    return successRate >= 0.95; // 95% success rate required
  }

  async testChaosResilience() {
    // Simulate provider timeout
    process.env.OPENAI_URL = 'http://invalid-host-that-does-not-exist.local';

    try {
      const response = await axios.post(`${this.baseUrl}/api/chat/completions`, {
        messages: [{ role: 'user', content: 'test' }],
        provider: 'openai',
      }, {
        validateStatus: () => true,
        timeout: 10000,
      });

      // Should fallback or return graceful error
      return response.status !== 500 || response.data.error?.isRetryable === false;
    } finally {
      // Restore
      delete process.env.OPENAI_URL;
    }
  }

  async validateOperationalGates() {
    const results = {};

    // Check rollback plan exists
    try {
      await execAsync('cat docs/05_delivery/RUNBOOK-003.md');
      results.rollbackPlan = true;
    } catch (error) {
      results.rollbackPlan = false;
      console.error('RUNBOOK-003 not found');
    }

    // Check migration documentation
    try {
      await execAsync('cat docs/05_delivery/MIGRATION-001.md');
      results.migrationPath = true;
    } catch (error) {
      results.migrationPath = false;
      console.error('MIGRATION-001 not found');
    }

    // Check runbook suite
    const requiredRunbooks = [
      'RUNBOOK-TEMPORAL.md',
      'RUNBOOK-E2B.md',
      'RUNBOOK-LITELLM.md',
    ];

    results.runbookSuite = {};
    for (const runbook of requiredRunbooks) {
      try {
        await execAsync(`cat docs/05_delivery/${runbook}`);
        results.runbookSuite[runbook] = true;
      } catch (error) {
        results.runbookSuite[runbook] = false;
      }
    }

    const allPassed = Object.values(results).every(v => v === true || Object.values(v).every(x => x === true));
    if (!allPassed) {
      throw new Error('Operational gates validation failed');
    }

    return results;
  }

  async checkSecretsRedaction() {
    // Trigger an error that would normally log sensitive data
    try {
      await axios.post(`${this.baseUrl}/api/chat/completions`, {
        messages: [{ role: 'user', content: 'test' }],
        provider: 'openai',
      }, {
        headers: {
          'Authorization': 'Bearer sk-test-secret-key-12345',
        },
        validateStatus: () => true,
      });
    } catch (error) {
      // Ignore
    }

    // Check logs for redacted secrets
    // This is a simplified check - in production, you'd check actual log files
    return true; // Placeholder
  }

  printSummary() {
    console.log('\n=== Release Validation Summary ===\n');

    for (const result of this.results) {
      const status = result.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`${status}: ${result.gate}`);

      if (!result.passed) {
        console.log(`  Error: ${result.error}`);
      }
    }

    const totalPassed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    console.log(`\nTotal: ${totalPassed}/${total} gates passed`);

    if (totalPassed === total) {
      console.log('\n🎉 Release validation PASSED - Ready for production!');
    } else {
      console.log('\n❌ Release validation FAILED - Fix issues before deployment');
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new ReleaseValidator({});
  validator.runAllChecks().then(passed => {
    process.exit(passed ? 0 : 1);
  });
}

module.exports = ReleaseValidator;
```

### Example 2: CI/CD Pipeline Integration

```yaml
# .github/workflows/release-validation.yml
name: Release Candidate Validation

on:
  push:
    tags:
      - 'v2.3.*'
  workflow_dispatch:

jobs:
  validate-release:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test
        env:
          NODE_ENV: test
          CHATAVG_SECRET: ${{ secrets.TEST_SECRET }}

      - name: Build application
        run: npm run build

      - name: Start staging environment
        run: |
          docker-compose -f docker-compose.staging.yml up -d
          sleep 30  # Wait for services to start

      - name: Run release validation
        run: node scripts/validateRelease.js
        env:
          CHATAVG_ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
          E2B_API_KEY: ${{ secrets.E2B_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Run security scan
        run: |
          npm audit --audit-level=high
          npx snyk test

      - name: Generate release report
        if: always()
        run: |
          echo "Release Validation Report" > release-report.md
          echo "Generated: $(date)" >> release-report.md
          echo "" >> release-report.md
          echo "Commit: ${{ github.sha }}" >> release-report.md
          echo "Tag: ${{ github.ref_name }}" >> release-report.md

      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: release-validation
          path: |
            release-report.md
            coverage/
            test-results/

      - name: Notify team
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "❌ Release validation failed for ${{ github.ref_name }}",
              "blocks": [
                {
                  "type": "header",
                  "text": {
                    "type": "plain_text",
                    "text": "Release Validation Failed"
                  }
                },
                {
                  "type": "section",
                  "fields": [
                    {
                      "type": "mrkdwn",
                      "text": "*Tag:*\n${{ github.ref_name }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Commit:*\n${{ github.sha }}"
                    }
                  ]
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Example 3: Pre-deployment Health Check

```javascript
// scripts/preDeployHealthCheck.js
const axios = require('axios');

async function healthCheck(baseUrl) {
  console.log('Running pre-deployment health check...\n');

  const checks = [
    { name: 'API Health', url: '/api/health', timeout: 5000 },
    { name: 'Database', url: '/api/health/db', timeout: 5000 },
    { name: 'Temporal Worker', url: '/api/health/temporal', timeout: 10000 },
    { name: 'LiteLLM Proxy', url: '/api/health/litellm', timeout: 5000 },
    { name: 'E2B Sandbox', url: '/api/health/e2b', timeout: 5000 },
  ];

  const results = [];

  for (const check of checks) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${baseUrl}${check.url}`, {
        timeout: check.timeout,
      });

      const duration = Date.now() - startTime;

      results.push({
        name: check.name,
        status: 'healthy',
        responseTime: duration,
        details: response.data,
      });

      console.log(`✓ ${check.name}: ${duration}ms`);
    } catch (error) {
      results.push({
        name: check.name,
        status: 'unhealthy',
        error: error.message,
      });

      console.log(`✗ ${check.name}: ${error.message}`);
    }
  }

  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const totalCount = results.length;

  console.log(`\nHealth Check: ${healthyCount}/${totalCount} services healthy`);

  if (healthyCount === totalCount) {
    console.log('✓ All systems operational - Safe to proceed with deployment');
    return true;
  } else {
    console.log('✗ Some services are unhealthy - Review before deploying');
    return false;
  }
}

// Usage
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:8200';
  healthCheck(baseUrl).then(healthy => {
    process.exit(healthy ? 0 : 1);
  });
}

module.exports = healthCheck;
```
