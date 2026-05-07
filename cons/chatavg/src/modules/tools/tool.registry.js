const crypto = require('crypto');

/**
 * Risk classes for Tool executions.
 */
const RiskClass = {
  READ: 'read',
  WRITE: 'write',
  EXTERNAL_SIDE_EFFECT: 'external_side_effect',
  CODE_EXEC: 'code_exec',
  BROWSER: 'browser',
  PRIVILEGED: 'privileged'
};

/**
 * Indicates if a risk class represents a side effect requiring idempotency.
 */
const isSideEffectRiskClass = (riskClass) => {
  return [
    RiskClass.WRITE,
    RiskClass.EXTERNAL_SIDE_EFFECT,
    RiskClass.CODE_EXEC,
    RiskClass.BROWSER,
    RiskClass.PRIVILEGED
  ].includes(riskClass);
};

/**
 * Definition of a tool version.
 */
class ToolDefinitionVersion {
  constructor({
    providerId,
    toolName,
    toolVersion,
    schema,
    riskClass = RiskClass.READ,
    authScope = [],
    approvalPolicyId = null,
    timeoutMs = 5000,
    retryPolicyId = null,
    isCanary = false
  }) {
    this.providerId = providerId;
    this.toolName = toolName;
    this.toolVersion = toolVersion;
    this.schema = schema;
    this.riskClass = riskClass;
    this.authScope = authScope;
    this.approvalPolicyId = approvalPolicyId;
    this.timeoutMs = timeoutMs;
    this.retryPolicyId = retryPolicyId;
    this.isCanary = isCanary;
    
    // Hash schema for deterministic identification
    const schemaString = JSON.stringify(schema || {});
    this.schemaHash = crypto.createHash('sha256').update(schemaString).digest('hex');
    
    this.cacheKey = `${providerId}:${toolName}:${toolVersion}:${this.schemaHash}`;
  }
}

/**
 * In-memory registry for tool definitions.
 */
class ToolRegistry {
  constructor() {
    // Map of cacheKey -> ToolDefinitionVersion
    this.definitions = new Map();
  }

  registerTool(definitionArgs) {
    const definition = new ToolDefinitionVersion(definitionArgs);
    this.definitions.set(definition.cacheKey, definition);
    return definition;
  }

  getTool(cacheKey) {
    return this.definitions.get(cacheKey);
  }

  findToolLatest(providerId, toolName) {
    let latest = null;
    for (const def of this.definitions.values()) {
      if (def.providerId === providerId && def.toolName === toolName && !def.isCanary) {
        if (!latest || def.toolVersion > latest.toolVersion) {
          latest = def;
        }
      }
    }
    return latest;
  }
  
  clear() {
    this.definitions.clear();
  }
}

module.exports = {
  RiskClass,
  isSideEffectRiskClass,
  ToolDefinitionVersion,
  ToolRegistry,
  toolRegistry: new ToolRegistry()
};
