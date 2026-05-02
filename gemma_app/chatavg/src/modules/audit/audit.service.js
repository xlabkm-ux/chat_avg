const db = require('../../core/sqlite');

class AuditService {
  /**
   * Log an action to the audit log.
   * @param {string} username - The user who performed the action (can be null for system actions or failed logins).
   * @param {string} action - The action performed (e.g., 'LOGIN', 'LOGIN_FAILED', 'USER_CREATED').
   * @param {string} details - Additional details (can be JSON stringified).
   * @param {string} ip_address - The IP address of the request.
   */
  static log(username, action, details = null, ip_address = null) {
    try {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (username, action, details, ip_address, created_at)
        VALUES (@username, @action, @details, @ip_address, @created_at)
      `);
      stmt.run({
        username: username || null,
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ip_address: ip_address || null,
        created_at: Date.now()
      });
    } catch (error) {
      console.error('[AuditService] Failed to insert audit log:', error);
    }
  }

  /**
   * Get audit logs, with optional filtering and pagination.
   * @param {Object} options 
   * @param {number} options.limit 
   * @param {number} options.offset
   * @param {string} options.username
   * @param {string} options.action
   */
  static getLogs({ limit = 50, offset = 0, username = null, action = null } = {}) {
    let query = 'SELECT * FROM audit_logs';
    const params = {};
    const conditions = [];

    if (username) {
      conditions.push('username = @username');
      params.username = username;
    }

    if (action) {
      conditions.push('action = @action');
      params.action = action;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT @limit OFFSET @offset';
    params.limit = limit;
    params.offset = offset;

    const stmt = db.prepare(query);
    return stmt.all(params);
  }
}

module.exports = AuditService;
