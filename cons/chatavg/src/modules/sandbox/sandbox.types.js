/**
 * Canonical types for the Sandbox / Forge module.
 * SPEC-019 SandboxManager
 */

/**
 * Sandbox lifecycle states.
 */
const SandboxState = {
  PROVISIONING: 'provisioning',
  RUNNING: 'running',
  FROZEN: 'frozen',
  SNAPSHOTTING: 'snapshotting',
  TERMINATING: 'terminating',
  TERMINATED: 'terminated',
  QUARANTINED: 'quarantined',
  ERROR: 'error',
};

/**
 * Execution classes — determines if/how a sandbox is required.
 * text/retrieval/read → no sandbox (fast path preserved).
 * write/code/browser/high_risk → full sandbox required.
 */
const ExecutionClass = {
  TEXT: 'text',
  RETRIEVAL: 'retrieval',
  READ: 'read',
  WRITE: 'write',
  CODE: 'code',
  BROWSER: 'browser',
  HIGH_RISK: 'high_risk',
};

/** Execution classes that require a sandbox. */
const SANDBOX_REQUIRED_CLASSES = new Set([
  ExecutionClass.WRITE,
  ExecutionClass.CODE,
  ExecutionClass.BROWSER,
  ExecutionClass.HIGH_RISK,
]);

/**
 * Adapter names (priority order).
 */
const SandboxAdapter = {
  E2B: 'e2b',       // Primary
  DAYTONA: 'daytona', // Future
  LOCAL: 'local',   // Dev/fallback
};

/**
 * Valid state transitions for SandboxSession.
 */
const VALID_TRANSITIONS = {
  [SandboxState.PROVISIONING]: [SandboxState.RUNNING, SandboxState.ERROR],
  [SandboxState.RUNNING]: [
    SandboxState.FROZEN,
    SandboxState.SNAPSHOTTING,
    SandboxState.TERMINATING,
    SandboxState.QUARANTINED,
    SandboxState.ERROR,
  ],
  [SandboxState.FROZEN]: [SandboxState.RUNNING, SandboxState.TERMINATING, SandboxState.ERROR],
  [SandboxState.SNAPSHOTTING]: [SandboxState.RUNNING, SandboxState.ERROR],
  [SandboxState.TERMINATING]: [SandboxState.TERMINATED, SandboxState.ERROR],
  [SandboxState.TERMINATED]: [],
  [SandboxState.QUARANTINED]: [SandboxState.TERMINATING, SandboxState.TERMINATED],
  [SandboxState.ERROR]: [],
};

/**
 * @typedef {Object} SandboxSession
 * @property {string} sandboxId
 * @property {string} runId
 * @property {string} executionClass       - ExecutionClass value
 * @property {string} state                - SandboxState value
 * @property {string} adapter              - SandboxAdapter value
 * @property {string} assignedAt           - ISO timestamp
 * @property {string|null} terminatedAt    - ISO timestamp
 * @property {number} maxTtlMs
 * @property {number} idleTimeoutMs
 * @property {Object} workspaceMount
 * @property {Object} egressPolicy
 * @property {Object|null} adapterHandle   - Internal adapter reference
 */

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
 * @property {string} contentHash   - SHA-256
 * @property {boolean} clean        - passed quarantine check
 */

/**
 * @typedef {Object} SandboxCost
 * @property {number} cpuMs
 * @property {number} memoryMbMs
 * @property {number} egressBytes
 * @property {number} estimatedUsd
 */

module.exports = {
  SandboxState,
  ExecutionClass,
  SandboxAdapter,
  SANDBOX_REQUIRED_CLASSES,
  VALID_TRANSITIONS,
};
