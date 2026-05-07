/**
 * E2BAdapter — primary sandbox adapter backed by E2B (e2b.dev).
 * SPEC-019 §9 Adapter Interface
 *
 * In production, this wraps the @e2b/sdk (or e2b npm package).
 * Without the SDK installed, it operates in "stub" mode — safe for
 * dev/test environments. The interface contract is stable; swap the
 * stub body for the real SDK calls when `E2B_API_KEY` is present.
 */

const crypto = require('crypto');
const { SandboxState } = require('../sandbox.types');

const E2B_AVAILABLE = (() => {
  try { require.resolve('@e2b/code-interpreter'); return true; } catch { return false; }
})();

class E2BAdapter {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.E2B_API_KEY || null;
    this.defaultTemplate = options.template || 'base';
    // In-memory registry for stub mode (dev/test)
    this._sandboxes = new Map();
  }

  get name() { return 'e2b'; }

  /**
   * Provision a new E2B sandbox for the given session.
   * @param {Object} session - SandboxSession
   * @returns {Promise<Object>} updated session with adapterHandle
   */
  async provision(session) {
    if (E2B_AVAILABLE && this.apiKey) {
      // Real E2B SDK path
      const { Sandbox } = require('@e2b/code-interpreter');
      const sbx = await Sandbox.create(this.defaultTemplate, { apiKey: this.apiKey });
      this._sandboxes.set(session.sandboxId, sbx);
      return { ...session, state: SandboxState.RUNNING, adapterHandle: { id: sbx.id } };
    }

    // Stub mode — isolated in-process (no real sandboxing, dev only)
    const handle = { id: `e2b-stub-${session.sandboxId}`, createdAt: Date.now() };
    this._sandboxes.set(session.sandboxId, handle);
    return { ...session, state: SandboxState.RUNNING, adapterHandle: handle };
  }

  /**
   * Execute a command inside the sandbox.
   * @param {Object} session
   * @param {string} command
   * @param {number} [timeoutMs=30000]
   * @returns {Promise<{exitCode: number, stdout: string, stderr: string}>}
   */
  async runCommand(session, command, timeoutMs = 30_000) {
    if (E2B_AVAILABLE && this.apiKey && session.adapterHandle) {
      const sbx = this._sandboxes.get(session.sandboxId);
      if (sbx && sbx.runCode) {
        const result = await sbx.runCode(command, { timeoutMs });
        return {
          exitCode: result.error ? 1 : 0,
          stdout: result.logs?.stdout?.join('\n') || '',
          stderr: result.error?.value || result.logs?.stderr?.join('\n') || '',
        };
      }
    }

    // Stub: simulate deterministic output for testing
    return {
      exitCode: 0,
      stdout: `[E2B-stub] Executed: ${command}`,
      stderr: '',
    };
  }

  /**
   * Create a filesystem snapshot.
   * @param {Object} session
   * @returns {Promise<{snapshotId: string}>}
   */
  async snapshot(session) {
    const snapshotId = `snap_${session.sandboxId}_${Date.now()}`;
    // Real E2B: pause + upload state
    return { snapshotId };
  }

  /**
   * Freeze (pause) the sandbox.
   * @param {Object} session
   */
  async freeze(session) {
    // Real E2B: pause()
    return { frozen: true };
  }

  /**
   * Terminate the sandbox and collect output.
   * @param {Object} session
   * @returns {Promise<{stdout: string, stderr: string, exitCode: number, artifacts: Array}>}
   */
  async terminate(session) {
    const sbx = this._sandboxes.get(session.sandboxId);
    if (E2B_AVAILABLE && this.apiKey && sbx && sbx.kill) {
      await sbx.kill();
    }
    this._sandboxes.delete(session.sandboxId);
    return { stdout: '', stderr: '', exitCode: 0, artifacts: [] };
  }

  /**
   * Release all resources for the sandbox.
   * @param {Object} session
   */
  async cleanup(session) {
    this._sandboxes.delete(session.sandboxId);
    return { cleaned: true };
  }

  /**
   * Get the current live state of the sandbox.
   * @param {string} sandboxId
   * @returns {Promise<string>} SandboxState value
   */
  async getState(sandboxId) {
    return this._sandboxes.has(sandboxId) ? SandboxState.RUNNING : SandboxState.TERMINATED;
  }
}

module.exports = { E2BAdapter };
