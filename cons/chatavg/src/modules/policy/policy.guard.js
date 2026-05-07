const { PolicyEngine } = require('./policy.engine');
const { AuditService } = require('../audit/audit.service');

/**
 * PolicyGuard middleware.
 * Evaluates an action (e.g., sandbox.run, tool_call) against the PolicyEngine.
 * If resolution is 'allow', proceeds.
 * If resolution is 'require_approval', it should ideally create an approval request,
 * but for R1 we will just log and allow if the user is admin, or deny if not.
 * (Sprint R6 will implement the full approval lifecycle).
 */
function policyGuard(actionType) {
  return (req, res, next) => {
    const action = {
      type: actionType,
      payload: req.body,
      context: {
        user: req.user,
        ip: req.ip || req.connection.remoteAddress
      }
    };

    const decision = PolicyEngine.evaluateAction(action);

    // Log security decision
    if (decision.resolution !== 'allow') {
      AuditService.log(
        req.user?.username || 'system',
        'POLICY_DECISION',
        { 
          action_type: actionType, 
          resolution: decision.resolution, 
          reason: decision.reason,
          risk_class: decision.riskClass
        },
        req.ip || req.connection.remoteAddress
      ).catch(() => {});
    }

    if (decision.resolution === 'deny') {
      return res.status(403).json({
        error: 'POLICY_DENIED',
        message: decision.reason,
        risk_class: decision.riskClass
      });
    }

    // For R1, we treat 'require_approval' as 'allow' for admins, but with a warning in logs.
    // In production, we might want to be stricter even for admins.
    if (decision.resolution === 'require_approval') {
      if (req.user && req.user.username === 'admin') {
         // Allow admin for now, but it's audited
         return next();
      } else {
        return res.status(403).json({
          error: 'APPROVAL_REQUIRED',
          message: 'This action requires explicit approval.',
          risk_class: decision.riskClass
        });
      }
    }

    next();
  };
}

module.exports = { policyGuard };
