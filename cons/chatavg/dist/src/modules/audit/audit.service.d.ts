export = AuditService;
declare class AuditService {
    /**
     * Log an action to the audit log.
     * @param {string} username - The user who performed the action (can be null for system actions or failed logins).
     * @param {string} action - The action performed (e.g., 'LOGIN', 'model', 'retrieval', 'tool', 'approval', 'sandbox', 'semantic', 'cost').
     * @param {any} details - Additional details. Will be redacted and JSON stringified.
     * @param {string} ip_address - The IP address of the request.
     */
    static log(username: string, action: string, details?: any, ip_address?: string): void;
    /**
     * Get audit logs, with optional filtering and pagination.
     * @param {Object} options
     * @param {number} options.limit
     * @param {number} options.offset
     * @param {string} options.username
     * @param {string} options.action
     */
    static getLogs({ limit, offset, username, action }?: {
        limit: number;
        offset: number;
        username: string;
        action: string;
    }): any;
}
