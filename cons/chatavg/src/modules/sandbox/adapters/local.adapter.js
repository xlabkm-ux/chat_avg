/**
 * LocalAdapter — dev/fallback sandbox adapter using Node.js child_process.
 * SPEC-019 §9 Adapter Interface
 *
 * WARNING: This adapter provides NO true isolation. It runs commands in the
 * host OS process as the current user. Use ONLY in development/test.
 * In production, `SANDBOX_FORGE_ENABLED` should only route to E2B.
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const { SandboxState } = require('../sandbox.types');

class LocalAdapter {
  constructor() {
    this._sessions = new Map();
  }

  get name() { return 'local'; }

  async provision(session) {
    const handle = { pid: process.pid, createdAt: Date.now() };
    this._sessions.set(session.sandboxId, handle);
    return { ...session, state: SandboxState.RUNNING, adapterHandle: handle };
  }

  async runCommand(session, command, timeoutMs = 30_000) {
    try {
      const shell = process.platform === 'win32' ? 'cmd' : 'sh';
      const flag  = process.platform === 'win32' ? '/c' : '-c';
      const { stdout, stderr } = await execFileAsync(shell, [flag, command], {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024, // 10 MB
      });
      return { exitCode: 0, stdout: stdout || '', stderr: stderr || '' };
    } catch (err) {
      return {
        exitCode: err.code ?? 1,
        stdout: err.stdout || '',
        stderr: err.stderr || err.message,
      };
    }
  }

  async snapshot(_session) {
    // Local adapter does not support snapshots — no-op
    return { snapshotId: null, warning: 'LocalAdapter does not support snapshots' };
  }

  async freeze(_session) {
    // No-op for local
    return { frozen: false, warning: 'LocalAdapter does not support freeze' };
  }

  async terminate(session) {
    this._sessions.delete(session.sandboxId);
    return { stdout: '', stderr: '', exitCode: 0, artifacts: [] };
  }

  async cleanup(session) {
    this._sessions.delete(session.sandboxId);
    return { cleaned: true };
  }

  async getState(sandboxId) {
    return this._sessions.has(sandboxId) ? SandboxState.RUNNING : SandboxState.TERMINATED;
  }
}

module.exports = { LocalAdapter };
