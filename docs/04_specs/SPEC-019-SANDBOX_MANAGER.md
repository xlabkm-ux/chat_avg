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

## 9. Adapter Interface

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

## 10. Audit Events

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
