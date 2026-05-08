const db = require('../../core/sqlite');
const { v4: uuidv4 } = require('uuid');

const traceBus = require('../observability/trace.bus');

class ApprovalService {
  /**
   * Creates an approval request with enriched metadata for the preview.
   */
  static createRequest(runId, actionType, payload, metadata = {}, timeoutMs = 600000) {
    const id = uuidv4();
    const now = Date.now();
    const expiresAt = now + timeoutMs;

    const enrichedPayload = {
      ...payload,
      _preview: {
        summary: metadata.summary || `Approval required for ${actionType}`,
        riskReason: metadata.reason || 'High risk operation',
        affectedResources: metadata.affectedResources || [],
        estimatedCostUsd: metadata.estimatedCostUsd || 0,
        isIrreversible: metadata.isIrreversible || false
      }
    };

    const stmt = db.prepare(`
      INSERT INTO approval_requests (id, run_id, action_type, payload, risk_score, reason, state, expires_at, created_at, updated_at)
      VALUES (@id, @run_id, @action_type, @payload, @risk_score, @reason, @state, @expires_at, @created_at, @updated_at)
    `);

    stmt.run({
      id,
      run_id: runId,
      action_type: actionType,
      payload: JSON.stringify(enrichedPayload),
      risk_score: metadata.riskScore || 0,
      reason: metadata.reason || '',
      state: 'pending',
      expires_at: expiresAt,
      created_at: now,
      updated_at: now
    });

    traceBus.emitTrace('ApprovalService', 'approval.requested', { id, actionType, runId, riskScore: metadata.riskScore });

    return this.getRequest(id);
  }

  static getRequest(id) {
    const row = db.prepare('SELECT * FROM approval_requests WHERE id = ?').get(id);
    if (row && row.payload) {
      row.payload = JSON.parse(row.payload);
    }
    return row;
  }

  static resolveRequest(id, resolution, editedPayload = null) {
    const validResolutions = ['approved', 'rejected', 'edited', 'cancelled'];
    if (!validResolutions.includes(resolution)) {
      throw new Error('Invalid resolution');
    }

    const request = this.getRequest(id);
    if (!request) throw new Error('Approval request not found');

    if (request.state !== 'pending') {
      throw new Error(`Cannot resolve request in state ${request.state}`);
    }

    if (Date.now() > request.expires_at) {
      this.markExpired(id);
      throw new Error('Approval request has expired');
    }

    const finalPayload = editedPayload || request.payload;
    const finalState = resolution === 'edited' ? 'approved' : resolution;

    db.prepare(`
      UPDATE approval_requests 
      SET state = @state, payload = @payload, updated_at = @updated_at 
      WHERE id = @id
    `).run({
      state: finalState,
      payload: JSON.stringify(finalPayload),
      updated_at: Date.now(),
      id
    });

    traceBus.emitTrace('ApprovalService', 'approval.resolved', { id, resolution: finalState, runId: request.run_id });

    return this.getRequest(id);
  }

  static cancelRequest(id) {
    return this.resolveRequest(id, 'cancelled');
  }

  static markExpired(id) {
    db.prepare(`
      UPDATE approval_requests 
      SET state = 'expired', updated_at = ? 
      WHERE id = ?
    `).run(Date.now(), id);
    traceBus.emitTrace('ApprovalService', 'approval.expired', { id });
  }
}

module.exports = { ApprovalService };
