const { RedactionService } = require('./redaction.service');
const { v4: uuidv4 } = require('uuid');

const RiskClass = {
  READ_ONLY: 'READ_ONLY',
  EXTERNAL_API: 'EXTERNAL_API',
  SYSTEM_WRITE: 'SYSTEM_WRITE',
  CODE_EXECUTION: 'CODE_EXECUTION',
  PRIVILEGED: 'PRIVILEGED'
};

class PolicyEngine {
  /**
   * Evaluates an action and returns a PolicyDecision.
   * @param {Object} action - { type, payload, context }
   * @param {Object} limits - current session limits
   * @returns {Object} PolicyDecision
   */
  static evaluateAction(action, limits = {}) {
    const decisionId = uuidv4();
    let riskScore = 0;
    let riskClass = RiskClass.READ_ONLY;
    let resolution = 'allow';
    let reason = 'Action evaluated as safe.';
    let auditLevel = 'standard';
    let requiredApproval = null;
    let redactionPlan = null;
    let budgetImpact = { estimateUsd: 0, currency: 'USD' };

    // Base scoring rules
    if (action.type === 'tool_call') {
      const toolName = action.payload?.name || '';
      if (['read_file', 'list_dir'].includes(toolName)) {
        riskScore = 10;
        riskClass = RiskClass.READ_ONLY;
      } else if (['fetch_url', 'search_web'].includes(toolName)) {
        riskScore = 20;
        riskClass = RiskClass.EXTERNAL_API;
        auditLevel = 'high';
      } else if (['write_file', 'delete_file'].includes(toolName)) {
        riskScore = 50;
        riskClass = RiskClass.SYSTEM_WRITE;
        resolution = 'require_approval';
        reason = 'System write operations require user approval.';
        auditLevel = 'high';
        requiredApproval = { type: 'explicit', role: 'admin' };
      } else if (['run_command', 'execute_code'].includes(toolName)) {
        riskScore = 75;
        riskClass = RiskClass.CODE_EXECUTION;
        resolution = 'require_approval';
        reason = 'Code execution requires user approval.';
        auditLevel = 'security';
        requiredApproval = { type: 'explicit', role: 'admin' };
      } else {
        // Unknown tools default to privileged
        riskScore = 90;
        riskClass = RiskClass.PRIVILEGED;
        resolution = 'require_approval';
        reason = 'Unknown or privileged actions require approval.';
        auditLevel = 'security';
        requiredApproval = { type: 'explicit', role: 'admin' };
      }
    } else if (action.type === 'model_call') {
      riskScore = 5;
      riskClass = RiskClass.READ_ONLY;
      budgetImpact.estimateUsd = 0.01; // Mock estimate
      // Check limits
      if (limits.maxCostUsd && (limits.currentCostUsd + budgetImpact.estimateUsd) >= limits.maxCostUsd) {
        resolution = 'deny';
        reason = 'Cost limit exceeded.';
      }
    } else if (action.type === 'semantic_operation') {
      // Check for psychodiagnosis or hidden authority in payload
      if (action.payload?.hasHiddenAuthority) {
        resolution = 'deny';
        reason = 'Hidden authority detected (Semantic Boundary violation).';
        auditLevel = 'security';
      } else if (action.payload?.containsSecrets) {
        resolution = 'downgrade';
        reason = 'Sensitive data detected. Payload must be redacted.';
        redactionPlan = { type: 'mask_secrets' };
      }
    } else if (action.type === 'sandbox_operation') {
      const op = action.payload?.operation || '';
      if (['run', 'snapshot'].includes(op)) {
        riskScore = 80;
        riskClass = RiskClass.CODE_EXECUTION;
        resolution = 'require_approval';
        reason = 'Sandbox execution requires user approval.';
        auditLevel = 'security';
      } else if (['terminate', 'quarantine'].includes(op)) {
        riskScore = 30;
        riskClass = RiskClass.PRIVILEGED;
        resolution = 'allow'; // termination is generally safe but privileged
        reason = 'Sandbox lifecycle operation allowed.';
      }
    } else if (action.type === 'agent_run') {
      riskScore = 40;
      riskClass = RiskClass.SYSTEM_WRITE;
      resolution = 'allow'; // creating a run is allowed by default but logged
      reason = 'Agent run creation allowed.';
    } else if (action.type === 'provider_operation') {
      riskScore = 25;
      riskClass = RiskClass.EXTERNAL_API;
      resolution = 'allow'; // listing models or health check is usually safe
      reason = 'Provider metadata operation allowed.';
    }

    return {
      decisionId,
      resolution,
      riskScore,
      riskClass,
      reason,
      requiredApproval,
      redactionPlan,
      budgetImpact,
      auditLevel
    };
  }

  static applyDowngrade(payload) {
    return RedactionService.redact(payload);
  }
}

module.exports = { PolicyEngine, RiskClass };
