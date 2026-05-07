/**
 * SandboxManager — orchestrates sandbox lifecycle for high-risk agent actions.
 * SPEC-019 SandboxManager
 *
 * Adapter priority: E2B (primary) → Local (dev/fallback).
 * When SANDBOX_FORGE_ENABLED=false, all methods return a skip sentinel.
 */

const crypto = require('crypto');
const {
  SandboxState,
  ExecutionClass,
  SandboxAdapter,
  SANDBOX_REQUIRED_CLASSES,
  VALID_TRANSITIONS,
} = require('./sandbox.types');
const { EgressPolicy } = require('./egress.policy');
const { E2BAdapter } = require('./adapters/e2b.adapter');
const { LocalAdapter } = require('./adapters/local.adapter');

// Resource limits (defaults, can be overridden per-session)
const DEFAULT_MAX_TTL_MS    = 300_000; // 5 min
const DEFAULT_IDLE_TIMEOUT  = 60_000;  // 1 min

const { scanArtifacts, estimateCost, MAX_OUTPUT_BYTES } = require('./sandbox.utils');

class SandboxManager {
  /**
   * @param {Object} options
   * @param {boolean} [options.enabled]       - Feature flag
   * @param {string}  [options.preferAdapter] - Force a specific adapter (for tests)
   * @param {Object}  [options.auditService]  - AuditService instance
   */
  constructor(options = {}) {
    this.enabled = options.enabled ?? false;
    this.auditService = options.auditService || null;

    // Adapter registry — E2B primary, local fallback
    this._adapters = {
      [SandboxAdapter.E2B]: new E2BAdapter({
        apiKey: process.env.E2B_API_KEY,
        template: process.env.E2B_TEMPLATE || 'base',
      }),
      [SandboxAdapter.LOCAL]: new LocalAdapter(),
    };

    this._preferAdapter = options.preferAdapter || null;

    // In-memory session store (in production, persist to DB)
    this._sessions = new Map();

    // TTL watchdog — checks all sessions every 30s
    this._ttlInterval = setInterval(() => this._sweepExpiredSessions(), 30_000);
    this._ttlInterval.unref(); // Don't prevent process exit
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Assign a new sandbox session to an AgentRun.
   * @param {Object} params
   * @param {string} params.runId
   * @param {string} params.executionClass      - ExecutionClass value
   * @param {Object} [params.workspaceMount]    - Mount configuration
   * @param {Object} [params.egressPolicy]      - Egress configuration
   * @param {number} [params.maxTtlMs]
   * @param {number} [params.idleTimeoutMs]
   * @returns {Promise<Object>} SandboxSession
   */
  async assign({ runId, executionClass, workspaceMount = {}, egressPolicy = {}, maxTtlMs, idleTimeoutMs } = {}) {
    if (!this.enabled) return this._skipped('assign');

    if (!SANDBOX_REQUIRED_CLASSES.has(executionClass)) {
      return { skipped: true, reason: 'EXECUTION_CLASS_NO_SANDBOX_REQUIRED', executionClass };
    }

    const sandboxId = `sbx_${crypto.randomBytes(8).toString('hex')}`;
    const adapter   = this._selectAdapter();
    const egress    = new EgressPolicy({
      tenantAllowlist: egressPolicy.allowlist || [],
      signingSecret: egressPolicy.signingSecret || null,
    });

    let session = {
      sandboxId,
      runId,
      executionClass,
      state: SandboxState.PROVISIONING,
      adapter: adapter.name,
      assignedAt: new Date().toISOString(),
      terminatedAt: null,
      maxTtlMs: maxTtlMs || DEFAULT_MAX_TTL_MS,
      idleTimeoutMs: idleTimeoutMs || DEFAULT_IDLE_TIMEOUT,
      lastActivityAt: Date.now(),
      workspaceMount,
      egressPolicy: egress,
      adapterHandle: null,
    };

    this._sessions.set(sandboxId, session);
    this._emit('sandbox.assigned', { sandboxId, runId, executionClass, adapter: adapter.name });

    try {
      session = await adapter.provision(session);
      this._sessions.set(sandboxId, session);
      this._emit('sandbox.provisioned', { sandboxId, adapter: adapter.name });
    } catch (err) {
      session = { ...session, state: SandboxState.ERROR };
      this._sessions.set(sandboxId, session);
      throw err;
    }

    return session;
  }

  /**
   * Execute a command inside a running sandbox.
   * @param {string} sandboxId
   * @param {string} command
   * @param {Object} [options]
   * @param {number} [options.timeoutMs=30000]
   * @param {string[]} [options.egressUrls]    - URLs the command may reach (checked against policy)
   * @returns {Promise<{exitCode: number, stdout: string, stderr: string}>}
   */
  async run(sandboxId, command, { timeoutMs = 30_000, egressUrls = [] } = {}) {
    if (!this.enabled) return this._skipped('run');

    const session = this._requireSession(sandboxId, SandboxState.RUNNING);

    // Egress pre-check
    for (const url of egressUrls) {
      const decision = session.egressPolicy.evaluate(url);
      this._emit(
        decision.allowed ? 'sandbox.egress.allowed' : 'sandbox.egress.denied',
        { sandboxId, url, tier: decision.tier, reason: decision.reason }
      );
      if (!decision.allowed) {
        throw Object.assign(new Error(`Egress denied: ${url} — ${decision.reason}`), { code: 'EGRESS_DENIED' });
      }
    }

    session.lastActivityAt = Date.now();
    const adapter = this._adapters[session.adapter];
    const result  = await adapter.runCommand(session, command, timeoutMs);

    this._emit('sandbox.command.run', { sandboxId, exitCode: result.exitCode });
    return result;
  }

  /**
   * Create a filesystem snapshot of the sandbox.
   * @param {string} sandboxId
   * @returns {Promise<{snapshotId: string}>}
   */
  async snapshot(sandboxId) {
    if (!this.enabled) return this._skipped('snapshot');
    const session = this._requireSession(sandboxId, SandboxState.RUNNING);
    this._transition(session, SandboxState.SNAPSHOTTING);
    const adapter = this._adapters[session.adapter];
    const result  = await adapter.snapshot(session);
    this._transition(session, SandboxState.RUNNING);
    this._emit('sandbox.snapshot', { sandboxId, snapshotId: result.snapshotId });
    return result;
  }

  /**
   * Freeze (pause) the sandbox.
   * @param {string} sandboxId
   */
  async freeze(sandboxId) {
    if (!this.enabled) return this._skipped('freeze');
    const session = this._requireSession(sandboxId, SandboxState.RUNNING);
    this._transition(session, SandboxState.FROZEN);
    const adapter = this._adapters[session.adapter];
    await adapter.freeze(session);
    this._emit('sandbox.frozen', { sandboxId });
    return { sandboxId, state: SandboxState.FROZEN };
  }

  /**
   * Terminate the sandbox and extract artifacts.
   * @param {string} sandboxId
   * @returns {Promise<SandboxResult>}
   */
  async terminate(sandboxId) {
    if (!this.enabled) return this._skipped('terminate');
    const session = this._getSession(sandboxId);
    if (!session) throw new Error(`Sandbox not found: ${sandboxId}`);

    if (![SandboxState.RUNNING, SandboxState.FROZEN, SandboxState.QUARANTINED].includes(session.state)) {
      throw new Error(`Cannot terminate sandbox in state: ${session.state}`);
    }

    this._transition(session, SandboxState.TERMINATING);
    const adapter = this._adapters[session.adapter];
    const raw     = await adapter.terminate(session);

    // Artifact quarantine scan
    const { artifacts, quarantined } = scanArtifacts(raw.artifacts || []);

    this._transition(session, SandboxState.TERMINATED);
    session.terminatedAt = new Date().toISOString();
    this._sessions.set(sandboxId, session);

    const result = {
      sandboxId,
      runId: session.runId,
      exitCode: raw.exitCode,
      stdout: (raw.stdout || '').slice(0, MAX_OUTPUT_BYTES),
      stderr: (raw.stderr || '').slice(0, MAX_OUTPUT_BYTES),
      artifacts,
      cost: estimateCost(session),
      quarantined,
      terminatedAt: session.terminatedAt,
    };

    this._emit('sandbox.terminated', { sandboxId, runId: session.runId, quarantined });
    if (quarantined) {
      this._emit('sandbox.quarantine', { sandboxId, artifactCount: artifacts.filter(a => !a.clean).length });
    }

    return result;
  }

  /**
   * Quarantine a running sandbox (lock it; flag for security review).
   * @param {string} sandboxId
   * @param {string} [reason]
   */
  async quarantine(sandboxId, reason = 'MANUAL') {
    if (!this.enabled) return this._skipped('quarantine');
    const session = this._getSession(sandboxId);
    if (!session) throw new Error(`Sandbox not found: ${sandboxId}`);
    this._transition(session, SandboxState.QUARANTINED);
    this._sessions.set(sandboxId, session);
    this._emit('sandbox.quarantine', { sandboxId, reason });
    return { sandboxId, state: SandboxState.QUARANTINED, reason };
  }

  /**
   * Cleanup and release all resources for a sandbox.
   * @param {string} sandboxId
   */
  async cleanup(sandboxId) {
    if (!this.enabled) return this._skipped('cleanup');
    const session = this._getSession(sandboxId);
    if (!session) return { cleaned: false, reason: 'NOT_FOUND' };

    const adapter = this._adapters[session.adapter];
    await adapter.cleanup(session);
    this._sessions.delete(sandboxId);
    this._emit('sandbox.cleanup', { sandboxId });
    return { cleaned: true, sandboxId };
  }

  /**
   * Get current session state.
   * @param {string} sandboxId
   * @returns {Object|null}
   */
  getSession(sandboxId) {
    const s = this._sessions.get(sandboxId);
    if (!s) return null;
    // Strip non-serialisable adapter handle
    const { egressPolicy, adapterHandle, ...rest } = s;
    return rest;
  }

  // ── Internal helpers ─────────────────────────────────────────────────────

  _selectAdapter() {
    if (this._preferAdapter && this._adapters[this._preferAdapter]) {
      return this._adapters[this._preferAdapter];
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const hasE2BKey = !!process.env.E2B_API_KEY;

    if (hasE2BKey) {
      return this._adapters[SandboxAdapter.E2B];
    }

    if (isProduction) {
      throw new Error('[Security] E2B_API_KEY is missing. LocalAdapter is prohibited in production.');
    }

    // development/test fallback
    return this._adapters[SandboxAdapter.LOCAL];
  }

  _getSession(sandboxId) {
    return this._sessions.get(sandboxId) || null;
  }

  _requireSession(sandboxId, requiredState) {
    const session = this._getSession(sandboxId);
    if (!session) throw new Error(`Sandbox not found: ${sandboxId}`);
    if (session.state !== requiredState) {
      throw new Error(`Sandbox ${sandboxId} is in state '${session.state}', expected '${requiredState}'`);
    }
    return session;
  }

  _transition(session, newState) {
    const valid = VALID_TRANSITIONS[session.state];
    if (!valid || !valid.includes(newState)) {
      throw new Error(`Invalid sandbox state transition: ${session.state} → ${newState}`);
    }
    session.state = newState;
    this._sessions.set(session.sandboxId, session);
  }



  _emit(event, data = {}) {
    if (this.auditService && typeof this.auditService.log === 'function') {
      this.auditService.log({ action: event, ...data }).catch(() => {});
    }
  }

  _skipped(op) {
    return { skipped: true, reason: 'SANDBOX_FORGE_DISABLED', operation: op };
  }

  async _sweepExpiredSessions() {
    const now = Date.now();
    for (const [id, session] of this._sessions) {
      if (session.state !== SandboxState.RUNNING && session.state !== SandboxState.FROZEN) continue;
      const age  = now - new Date(session.assignedAt).getTime();
      const idle = now - session.lastActivityAt;
      if (age > session.maxTtlMs || idle > session.idleTimeoutMs) {
        this._emit('sandbox.ttl_exceeded', { sandboxId: id, age, idle });
        try { await this.terminate(id); } catch {}
        try { await this.cleanup(id);   } catch {}
      }
    }
  }

  /** Stop the TTL watchdog (for clean test teardown). */
  destroy() {
    clearInterval(this._ttlInterval);
  }
}

module.exports = { SandboxManager };
