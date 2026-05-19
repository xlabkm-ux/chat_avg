---
id: SPEC-019
title: SandboxManager - Hybrid Sandbox / Forge (E2B Primary)
version: 1.0.0
owner: Antigravity / ChatAVG Architecture Team
status: Active
last_updated: 2026-05-07
sprint: Sprint 15
---

# SPEC-019 — SandboxManager: Hybrid Sandbox / Forge (E2B Primary)

**Version:** 1.0  
**Sprint:** 15  
**Status:** Approved  
**Date:** 2026-05-07  
**Authors:** Antigravity / ChatAVG Architecture Team

---

## 1. Purpose

Define the **SandboxManager** subsystem that materialises code execution, browser automation, write operations, and other high-risk agent actions inside isolated, auditable, and resource-bounded sandboxes.

Key design principles:
- **No sandbox by default** — low-risk text/retrieval/read actions bypass sandbox entirely (fast path preserved)
- **E2B as primary runtime** — Daytona and local-process as dev/alternative adapters
- **Execution class routing** — runtime decides sandbox tier based on PolicyEngine risk class
- **Egress-deny by default** — tenant allowlist + signed URLs for controlled outbound traffic
- **Quarantine** — suspicious artifacts trigger automatic containment before extraction

---

## 2. Execution Classes

| Class | Sandbox Required | Adapter | Notes |
|-------|-----------------|---------|-------|
| `text` | ❌ No | — | Simple chat, summarisation |
| `retrieval` | ❌ No | — | RAG/KnowledgeGateway reads |
| `read` | ❌ No | — | File/DB read-only tool calls |
| `write` | ✅ Yes | E2B / Local | File mutations, DB writes |
| `code` | ✅ Yes | E2B primary | Code execution (any language) |
| `browser` | ✅ Yes | E2B primary | Headless browser automation |
| `high_risk` | ✅ Yes (isolated) | E2B primary | Privileged / multi-step actions |

---

## 3. SandboxSession Lifecycle

```
assign → provisioning → running → [snapshot?] → [freeze?] → terminating → terminated
                                                                       ↓
                                                              quarantine (on suspicion)
                                                                       ↓
                                                                  cleanup
```

### States

| State | Description |
|-------|-------------|
| `provisioning` | Adapter is creating the sandbox environment |
| `running` | Active; code/browser commands may be sent |
| `frozen` | Paused; no commands; state preserved |
| `snapshotting` | Creating a point-in-time snapshot |
| `terminating` | Graceful shutdown in progress |
| `terminated` | Fully stopped; resources released |
| `quarantined` | Suspicious artifact detected; locked down pending review |
| `error` | Unrecoverable failure |

### Operations

| Operation | Description |
|-----------|-------------|
| `assign` | Allocate a session for an AgentRun |
| `run` | Execute a command / code block |
| `snapshot` | Persist current filesystem state |
| `freeze` | Pause execution (preserve state) |
| `terminate` | Graceful shutdown + artifact extraction |
| `cleanup` | Remove sandbox + temporary data |
| `quarantine` | Lock session; flag artifacts for security review |

---

## 4. Egress Policy

Default stance: **deny all outbound traffic**.

### Allowlist Tiers

| Tier | Scope | Mechanism |
|------|-------|-----------|
| `provider_endpoints` | LiteLLM/model endpoints | Config-level whitelist |
| `tenant_allowlist` | Per-tenant domain/IP list | DB-backed, admin-managed |
| `signed_urls` | Short-lived pre-signed S3/GCS URLs | HMAC-signed, TTL ≤ 5min |
| `deny_all` | Everything else | Default |

### Egress Events (emitted to Audit)
- `sandbox.egress.allowed` — request matched allowlist
- `sandbox.egress.denied` — request blocked
- `sandbox.egress.suspicious` — pattern matched threat signature

---

## 5. Artifact Extraction

After `terminate`, the SandboxManager:
1. Scans the output directory for produced artifacts
2. Runs quarantine checks (size limits, MIME type, content hash blocklist)
3. Passes clean artifacts to `ArtifactService` for versioning
4. Quarantines suspicious artifacts; emits `sandbox.quarantine` audit event
5. Returns `SandboxResult` with `artifacts[]`, `exitCode`, `stdout`, `stderr`, `cost`

---

## 6. TTL & Resource Policy

| Parameter | Default | Override |
|-----------|---------|----------|
| `maxTtlMs` | 300 000 ms (5 min) | Per-category admin config |
| `idleTimeoutMs` | 60 000 ms (1 min) | Per-category admin config |
| `maxOutputBytes` | 10 MB | Hard limit |
| `maxArtifacts` | 20 | Hard limit |

Sandbox is force-terminated when TTL or idle timeout expires. Costs are committed to `CostService`.

---

## 7. API Endpoints

### `POST /api/sandboxes`
Assign a new sandbox session for an AgentRun.

**Request:**
```json
{
  "runId": "run_abc123",
  "executionClass": "code",
  "workspaceMount": { "type": "ephemeral" },
  "egressPolicy": { "allowlist": ["api.example.com"] }
}
```

**Response:**
```json
{
  "sandboxId": "sbx_xyz789",
  "state": "provisioning",
  "adapter": "e2b",
  "assignedAt": "2026-05-07T11:00:00Z"
}
```

### `POST /api/sandboxes/:sandboxId/run`
Execute a command inside the sandbox.

### `POST /api/sandboxes/:sandboxId/snapshot`
Create a filesystem snapshot.

### `POST /api/sandboxes/:sandboxId/freeze`
Pause execution.

### `POST /api/sandboxes/:sandboxId/terminate`
Terminate and extract artifacts.

### `POST /api/sandboxes/:sandboxId/quarantine`
Lock sandbox; flag for security review.

### `DELETE /api/sandboxes/:sandboxId`
Cleanup all resources.

### `GET /api/sandboxes/:sandboxId`
Get current session state and metadata.

---

## 8. SandboxResult Contract

```js
/**
 * @typedef {Object} SandboxResult
 * @property {string} sandboxId
 * @property {string} runId
 * @property {number} exitCode
 * @property {string} stdout
 * @property {string} stderr
 * @property {SandboxArtifact[]} artifacts
 * @property {SandboxCost} cost
 * @property {boolean} quarantined
 * @property {string} terminatedAt
 */

/**
 * @typedef {Object} SandboxArtifact
 * @property {string} artifactId
 * @property {string} name
 * @property {string} mimeType
 * @property {number} sizeBytes
 * @property {string} contentHash  - SHA-256
 * @property {boolean} clean       - passed quarantine check
 */

/**
 * @typedef {Object} SandboxCost
 * @property {number} cpuMs
 * @property {number} memoryMbMs
 * @property {number} egressBytes
 * @property {number} estimatedUsd
 */
```

---

## 9. Code Examples

### Example 1: SandboxManager Usage

```javascript
// src/services/sandboxManager.service.js
const { E2BAdapter } = require('../adapters/e2b.adapter');
const { LocalProcessAdapter } = require('../adapters/local.adapter');
const SandboxSession = require('../models/sandboxSession');

class SandboxManager {
  constructor() {
    this.enabled = process.env.SANDBOX_FORGE_ENABLED === 'true';
    this.adapter = this.enabled ? this.createAdapter() : null;
  }

  createAdapter() {
    // Use E2B in production, LocalProcess in development
    const useE2B = process.env.NODE_ENV === 'production';

    if (useE2B) {
      return new E2BAdapter({
        apiKey: process.env.E2B_API_KEY,
        defaultTemplate: 'base',
      });
    } else {
      return new LocalProcessAdapter({
        workingDir: '/tmp/chatavg-sandboxes',
      });
    }
  }

  async executeCode(userId, code, language = 'python') {
    if (!this.enabled) {
      return { skipped: true, reason: 'SANDBOX_FORGE_DISABLED' };
    }

    // Create sandbox session
    const session = await SandboxSession.create({
      userId,
      executionClass: 'code',
      language,
      ttl: 300, // 5 minutes
    });

    try {
      // Provision sandbox
      await this.adapter.provision(session);

      // Execute code
      const result = await this.adapter.runCommand(session, {
        command: `${language} -c "${code}"`,
        timeoutMs: 30000, // 30 seconds
      });

      // Terminate and collect results
      const sandboxResult = await this.adapter.terminate(session);

      return {
        success: result.exitCode === 0,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        duration: sandboxResult.duration,
        cost: sandboxResult.cost, // E2B pricing: $0.008/min
      };

    } catch (error) {
      await this.adapter.cleanup(session);
      throw error;
    }
  }

  async runBrowserAutomation(userId, script) {
    if (!this.enabled) {
      return { skipped: true, reason: 'SANDBOX_FORGE_DISABLED' };
    }

    const session = await SandboxSession.create({
      userId,
      executionClass: 'browser',
      ttl: 600, // 10 minutes for browser tasks
    });

    try {
      await this.adapter.provision(session);

      // Run Playwright/Puppeteer script
      const result = await this.adapter.runCommand(session, {
        command: `node -e "${script}"`,
        env: {
          DISPLAY: ':99', // Headless display
        },
        timeoutMs: 60000, // 60 seconds
      });

      return result;

    } finally {
      await this.adapter.terminate(session);
    }
  }
}

module.exports = SandboxManager;
```

### Example 2: E2B Adapter Implementation

```javascript
// src/adapters/e2b.adapter.js
const { Sandbox } = require('e2b');

class E2BAdapter {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.defaultTemplate = config.defaultTemplate || 'base';
  }

  async provision(session) {
    // Create E2B sandbox instance
    const sandbox = await Sandbox.create({
      template: this.defaultTemplate,
      apiKey: this.apiKey,
      metadata: {
        sessionId: session.id,
        userId: session.userId,
      },
    });

    session.sandboxId = sandbox.sandboxId;
    session.status = 'provisioned';
    session.metadata = {
      e2bUrl: `https://${sandbox.sandboxId}.e2b.dev`,
      createdAt: new Date(),
    };

    await session.save();

    return session;
  }

  async runCommand(session, options) {
    const { command, timeoutMs = 30000, env = {} } = options;

    // Get sandbox instance
    const sandbox = await Sandbox.connect(session.sandboxId, this.apiKey);

    // Execute command with timeout
    const execution = await sandbox.commands.run(command, {
      env,
      timeout: timeoutMs / 1000, // Convert to seconds
    });

    return {
      exitCode: execution.exitCode,
      stdout: execution.stdout,
      stderr: execution.stderr,
      duration: execution.duration,
    };
  }

  async snapshot(session) {
    const sandbox = await Sandbox.connect(session.sandboxId, this.apiKey);

    // Create snapshot for later resumption
    const snapshotId = await sandbox.snapshot();

    return { snapshotId };
  }

  async freeze(session) {
    // Pause sandbox to save costs
    const sandbox = await Sandbox.connect(session.sandboxId, this.apiKey);
    await sandbox.pause();

    session.status = 'frozen';
    await session.save();
  }

  async terminate(session) {
    const startTime = session.metadata?.createdAt || new Date();
    const endTime = new Date();
    const durationMinutes = (endTime - startTime) / 60000;

    // Calculate cost (E2B: $0.008 per minute)
    const cost = durationMinutes * 0.008;

    // Terminate sandbox
    try {
      const sandbox = await Sandbox.connect(session.sandboxId, this.apiKey);
      await sandbox.kill();
    } catch (error) {
      console.warn(`Failed to terminate sandbox ${session.sandboxId}:`, error.message);
    }

    session.status = 'terminated';
    session.result = {
      duration: durationMinutes,
      cost,
      terminatedAt: endTime,
    };

    await session.save();

    return session.result;
  }

  async cleanup(session) {
    // Ensure all resources are released
    try {
      await this.terminate(session);
    } catch (error) {
      console.error(`Cleanup failed for session ${session.id}:`, error.message);
    }
  }

  async getState(sandboxId) {
    try {
      const sandbox = await Sandbox.connect(sandboxId, this.apiKey);
      const info = await sandbox.getInfo();

      return {
        status: info.status,
        cpuUsage: info.cpuUsage,
        memoryUsage: info.memoryUsage,
        uptime: info.uptime,
      };
    } catch (error) {
      return { status: 'unknown', error: error.message };
    }
  }
}

module.exports = E2BAdapter;
```

### Example 3: Execution Class Routing

```javascript
// src/services/executionRouter.service.js
const PolicyEngine = require('./policyEngine.service');
const SandboxManager = require('./sandboxManager.service');

class ExecutionRouter {
  constructor() {
    this.policyEngine = new PolicyEngine();
    this.sandboxManager = new SandboxManager();
  }

  async routeAction(userId, action) {
    const { type, payload } = action;

    // Determine execution class based on action type
    const executionClass = this.classifyAction(type, payload);

    // Check if sandbox is required
    if (this.requiresSandbox(executionClass)) {
      return this.executeWithSandbox(userId, executionClass, payload);
    } else {
      return this.executeDirectly(userId, executionClass, payload);
    }
  }

  classifyAction(type, payload) {
    switch (type) {
      case 'chat':
      case 'summarize':
        return 'text';

      case 'search':
      case 'retrieve':
        return 'retrieval';

      case 'read_file':
      case 'read_db':
        return 'read';

      case 'write_file':
      case 'update_db':
        return 'write';

      case 'execute_code':
        return 'code';

      case 'browser_automation':
        return 'browser';

      case 'system_admin':
      case 'deploy':
        return 'high_risk';

      default:
        // Use policy engine for uncertain cases
        return this.policyEngine.classifyRisk(payload);
    }
  }

  requiresSandbox(executionClass) {
    const sandboxRequired = ['write', 'code', 'browser', 'high_risk'];
    return sandboxRequired.includes(executionClass);
  }

  async executeWithSandbox(userId, executionClass, payload) {
    switch (executionClass) {
      case 'code':
        return this.sandboxManager.executeCode(userId, payload.code, payload.language);

      case 'browser':
        return this.sandboxManager.runBrowserAutomation(userId, payload.script);

      case 'write':
        return this.sandboxManager.executeWriteOperation(userId, payload);

      case 'high_risk':
        // Require approval before execution
        const approved = await this.requestApproval(userId, payload);
        if (!approved) {
          return { status: 'rejected', reason: 'user_denied' };
        }
        return this.sandboxManager.executeHighRiskAction(userId, payload);

      default:
        throw new Error(`Unknown execution class: ${executionClass}`);
    }
  }

  async executeDirectly(userId, executionClass, payload) {
    // Fast path - no sandbox overhead
    switch (executionClass) {
      case 'text':
        return this.executeChat(userId, payload);

      case 'retrieval':
        return this.executeRetrieval(userId, payload);

      case 'read':
        return this.executeRead(userId, payload);

      default:
        throw new Error(`Cannot execute ${executionClass} directly`);
    }
  }

  async requestApproval(userId, payload) {
    // Integration with approval flow
    // Returns true/false based on user response
    // ...
  }
}

module.exports = ExecutionRouter;
```

### Example 4: Egress Control

```javascript
// src/services/egressController.service.js
const crypto = require('crypto');

class EgressController {
  constructor() {
    this.allowedDomains = new Set([
      'api.openai.com',
      'cdn.e2b.dev',
      'github.com',
    ]);

    this.signedUrlSecret = process.env.EGRESS_SIGNING_SECRET;
  }

  async checkEgressRequest(sessionId, url) {
    const domain = new URL(url).hostname;

    // Check if domain is allowed
    if (!this.isAllowedDomain(domain)) {
      return {
        allowed: false,
        reason: `Domain ${domain} not in allowlist`,
      };
    }

    // Check if signed URL is valid (for temporary access)
    if (this.requiresSignedUrl(domain)) {
      const isValid = this.validateSignedUrl(url);
      if (!isValid) {
        return {
          allowed: false,
          reason: 'Invalid or expired signed URL',
        };
      }
    }

    return { allowed: true };
  }

  isAllowedDomain(domain) {
    return this.allowedDomains.has(domain);
  }

  requiresSignedUrl(domain) {
    // Certain domains require time-limited signed URLs
    const restrictedDomains = ['storage.googleapis.com', 's3.amazonaws.com'];
    return restrictedDomains.includes(domain);
  }

  generateSignedUrl(baseUrl, expirationMinutes = 60) {
    const expiry = Date.now() + expirationMinutes * 60 * 1000;
    const data = `${baseUrl}:${expiry}`;

    const signature = crypto
      .createHmac('sha256', this.signedUrlSecret)
      .update(data)
      .digest('hex');

    return `${baseUrl}?expiry=${expiry}&signature=${signature}`;
  }

  validateSignedUrl(url) {
    const urlObj = new URL(url);
    const expiry = parseInt(urlObj.searchParams.get('expiry'));
    const signature = urlObj.searchParams.get('signature');

    // Check expiration
    if (Date.now() > expiry) {
      return false;
    }

    // Verify signature
    const baseUrl = url.replace(/\?.*/, '');
    const expectedSignature = crypto
      .createHmac('sha256', this.signedUrlSecret)
      .update(`${baseUrl}:${expiry}`)
      .digest('hex');

    return signature === expectedSignature;
  }
}

module.exports = EgressController;
```

### Example 5: Quarantine Handling

```javascript
// src/services/quarantine.service.js
class QuarantineService {
  constructor() {
    this.quarantinedSessions = new Map();
  }

  async quarantineSession(sessionId, reason, evidence) {
    console.warn(`Quarantining session ${sessionId}: ${reason}`);

    this.quarantinedSessions.set(sessionId, {
      reason,
      evidence,
      quarantinedAt: new Date(),
      status: 'under_review',
    });

    // Notify security team
    await this.notifySecurityTeam(sessionId, reason, evidence);

    // Block further execution
    await this.blockSession(sessionId);

    return {
      status: 'quarantined',
      sessionId,
      reviewRequired: true,
    };
  }

  async notifySecurityTeam(sessionId, reason, evidence) {
    // Send alert to Slack/email
    // Create ticket in security system
    // ...
  }

  async blockSession(sessionId) {
    // Prevent any further commands from executing
    // Mark session as blocked in database
    // ...
  }

  async reviewQuarantine(sessionId, decision, reviewerId) {
    const quarantine = this.quarantinedSessions.get(sessionId);

    if (!quarantine) {
      throw new Error(`Session ${sessionId} not in quarantine`);
    }

    if (decision === 'release') {
      quarantine.status = 'released';
      quarantine.reviewedBy = reviewerId;
      quarantine.reviewedAt = new Date();

      // Unblock session
      await this.unblockSession(sessionId);

    } else if (decision === 'terminate') {
      quarantine.status = 'terminated';
      quarantine.reviewedBy = reviewerId;
      quarantine.reviewedAt = new Date();

      // Permanently terminate and cleanup
      await this.terminateSession(sessionId);
    }

    return quarantine;
  }
}

module.exports = QuarantineService;
```

### Example 6: Cost Tracking

```javascript
// src/services/sandboxCost.service.js
class SandboxCostTracker {
  constructor() {
    // E2B pricing: $0.008 per sandbox-minute
    this.pricePerMinute = 0.008;
  }

  calculateCost(durationMinutes) {
    return durationMinutes * this.pricePerMinute;
  }

  async getMonthlyCost(userId, month = new Date().getMonth()) {
    // Query database for all sandbox sessions this month
    const sessions = await this.getUserSessions(userId, month);

    const totalCost = sessions.reduce((sum, session) => {
      return sum + this.calculateCost(session.duration);
    }, 0);

    return {
      userId,
      month,
      totalSessions: sessions.length,
      totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
      totalCost,
      breakdown: sessions.map(s => ({
        sessionId: s.id,
        executionClass: s.executionClass,
        duration: s.duration,
        cost: this.calculateCost(s.duration),
      })),
    };
  }

  async checkBudgetExceeded(userId, budgetLimit = 100) {
    const monthlyCost = await this.getMonthlyCost(userId);

    if (monthlyCost.totalCost > budgetLimit) {
      return {
        exceeded: true,
        currentCost: monthlyCost.totalCost,
        budgetLimit,
        overage: monthlyCost.totalCost - budgetLimit,
      };
    }

    return { exceeded: false, currentCost: monthlyCost.totalCost };
  }
}

module.exports = SandboxCostTracker;
```

---

## 10. Adapter Interface

All sandbox adapters implement:

```js
class BaseSandboxAdapter {
  async provision(session)  {}  // → SandboxSession
  async runCommand(session, command, timeoutMs)  {}  // → { exitCode, stdout, stderr }
  async snapshot(session)  {}   // → { snapshotId }
  async freeze(session)  {}
  async terminate(session)  {}  // → SandboxResult (partial)
  async cleanup(session)  {}
  async getState(sandboxId)  {}
}
```

---

## 11. Audit Events

| Event | Description |
|-------|-------------|
| `sandbox.assigned` | Session allocated |
| `sandbox.provisioned` | Adapter ready |
| `sandbox.command.run` | Command dispatched |
| `sandbox.snapshot` | Snapshot created |
| `sandbox.frozen` | Execution paused |
| `sandbox.terminated` | Graceful shutdown |
| `sandbox.quarantine` | Suspicious artifact detected |
| `sandbox.cleanup` | Resources removed |
| `sandbox.ttl_exceeded` | Force-terminated due to TTL |
| `sandbox.egress.allowed` | Egress request permitted |
| `sandbox.egress.denied` | Egress request blocked |

---

## 11. Feature Flag

`SANDBOX_FORGE_ENABLED` (existing flag in `config.js`).

When `false`: all sandbox calls return `{ skipped: true, reason: 'SANDBOX_FORGE_DISABLED' }` — fast path is unaffected.

---

## 12. References

- SPEC-006 AgentRun State Machine
- SPEC-008 Mission Model
- SPEC-011 PolicyEngine (risk classes)
- SPEC-017 ArtifactWorkspace
- SPEC-018 MCP Tool Gateway (risk class `code_exec`)
- RUNBOOK-002 Sandbox Recovery
