const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const { ApprovalService } = require('../../src/modules/policy/approval.service');
const db = require('../../src/core/sqlite');

describe('ApprovalService', () => {
  before(() => {
    db.exec('DELETE FROM approval_requests');
    db.exec('DELETE FROM agent_runs');
    db.exec('DELETE FROM missions');
    db.exec('DELETE FROM sessions');
    db.exec('DELETE FROM users');
    
    // Setup FK deps
    db.prepare("INSERT INTO users (username, password_hash) VALUES ('test', 'hash')").run();
    db.prepare("INSERT INTO sessions (id, username) VALUES ('sess1', 'test')").run();
    db.prepare("INSERT INTO missions (id, session_id, username, created_at, updated_at) VALUES ('miss1', 'sess1', 'test', 0, 0)").run();
    db.prepare("INSERT INTO agent_runs (id, mission_id, state, created_at, updated_at) VALUES ('run1', 'miss1', 'running', 0, 0)").run();
  });

  it('should create and retrieve a request', () => {
    const req = ApprovalService.createRequest('run1', 'tool_call', { name: 'write_file' }, 50, 'System write');
    assert.ok(req.id);
    assert.strictEqual(req.state, 'pending');

    const fetched = ApprovalService.getRequest(req.id);
    assert.strictEqual(fetched.action_type, 'tool_call');
  });

  it('should resolve a request', () => {
    const req = ApprovalService.createRequest('run1', 'tool_call', { name: 'write_file' }, 50, 'System write');
    const resolved = ApprovalService.resolveRequest(req.id, 'approved');
    assert.strictEqual(resolved.state, 'approved');
  });

  it('should prevent resolving an already resolved request', () => {
    const req = ApprovalService.createRequest('run1', 'tool_call', { name: 'write_file' }, 50, 'System write');
    ApprovalService.resolveRequest(req.id, 'rejected');
    
    assert.throws(() => {
      ApprovalService.resolveRequest(req.id, 'approved');
    }, /Cannot resolve request in state rejected/);
  });
});
