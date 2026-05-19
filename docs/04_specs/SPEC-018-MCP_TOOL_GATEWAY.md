---
id: SPEC-018
title: MCP Tool Gateway and Versioned Tool Registry
version: 1.0.0
owner: Core Team
status: Active
last_updated: 2026-05-07
sprint: Sprint 15
---

# SPEC-018: MCP Tool Gateway and Versioned Tool Registry

## 1. Overview
The MCP Tool Gateway provides a secure, versioned, and standardized entry point for all external tools and connectors within the ChatAVG platform. It implements a Model Context Protocol (MCP) boundary, ensuring robust isolation, caching, schema versioning, and policy enforcement (timeouts, retries, idempotency).

## 2. Core Components

### 2.1 Tool Registry
The Tool Registry is responsible for cataloging and caching tool definitions.
- **Cache Key**: `providerId` + `toolName` + `toolVersion` + `schemaHash`
- **Purpose**: Enables strict version control, ensuring agent prompts are bound to deterministic schemas.

### 2.2 ToolDefinitionVersion
Defines the executable contract of a specific tool version.
- `schemas`: JSON schema for inputs/outputs.
- `riskClass`: Security classification (see 2.3).
- `authScope`: OAuth scopes or token requirements.
- `approvalPolicyId`: Link to `PolicyEngine` requirement (e.g., requires user approval).
- `timeoutMs`: Maximum execution time before termination.
- `retryPolicyId`: Configuration for exponential backoff and max retries.

### 2.3 Risk Classes
Strict classification of tool side-effects:
1. `read`: Safe, read-only operations (e.g., search, query).
2. `write`: Destructive or state-mutating operations inside the tenant scope.
3. `external_side_effect`: Operations affecting systems outside ChatAVG (e.g., API calls, emails).
4. `code_exec`: Execution of arbitrary scripts (e.g., Python, Bash).
5. `browser`: Headless browser control (e.g., Puppeteer).
6. `privileged`: Infrastructure-level actions (e.g., system management, user roles).

### 2.4 ToolCall State Machine
Tracks the lifecycle of a single tool execution:
- `requested`: Agent emitted a tool call.
- `validating`: Schema checking and risk scoring.
- `pending_approval`: Waiting for user or policy approval (for high-risk classes).
- `executing`: Payload dispatched via MCP transport.
- `retrying`: Transient error encountered, executing retry policy.
- `completed`: Execution finished successfully.
- `failed`: Execution failed, aborted, or timed out.

## 3. Execution Rules

### 3.1 Idempotency
- **Rule**: Any tool categorized as `write`, `external_side_effect`, `code_exec`, `browser`, or `privileged` MUST require an `idempotencyKey` provided by the Agent.
- **Enforcement**: Tool Gateway will reject calls to these risk classes if the key is missing or reused within an inappropriate time window.

### 3.2 Protocol & Transport
- **Protocol**: Standard MCP messages over JSON-RPC.
- **Transport**: SSE/HTTP for remote tools, STDIO for local binaries.
- **Error Mapping**: Map raw transport errors to standardized `ProviderError` types.

## 4. Code Examples

### Example 1: Tool Registry Implementation

```javascript
// src/services/toolRegistry.service.js
const crypto = require('crypto');

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.cache = new Map();
  }

  registerTool(toolDefinition) {
    const { providerId, toolName, version, schema } = toolDefinition;

    // Generate cache key
    const schemaHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(schema))
      .digest('hex');

    const cacheKey = `${providerId}:${toolName}:v${version}:${schemaHash}`;

    // Store tool definition
    this.tools.set(cacheKey, {
      ...toolDefinition,
      cacheKey,
      schemaHash,
      createdAt: new Date(),
      status: 'active',
    });

    console.log(`Registered tool: ${cacheKey}`);
    return cacheKey;
  }

  getTool(cacheKey) {
    return this.tools.get(cacheKey);
  }

  getLatestVersion(providerId, toolName) {
    // Find all versions of this tool
    const versions = Array.from(this.tools.values())
      .filter(t => t.providerId === providerId && t.toolName === toolName)
      .sort((a, b) => b.version - a.version);

    return versions[0] || null;
  }

  validateToolCall(cacheKey, input) {
    const tool = this.tools.get(cacheKey);

    if (!tool) {
      throw new Error(`Tool not found: ${cacheKey}`);
    }

    // Validate against JSON schema
    const Ajv = require('ajv');
    const ajv = new Ajv();
    const validate = ajv.compile(tool.schema.input);
    const valid = validate(input);

    if (!valid) {
      throw new Error(`Validation failed: ${ajv.errorsText(validate.errors)}`);
    }

    return true;
  }
}

module.exports = ToolRegistry;
```

### Example 2: MCP Tool Gateway

```javascript
// src/services/mcpToolGateway.service.js
const { Client: MCPClient } = require('@modelcontextprotocol/sdk');
const ToolRegistry = require('./toolRegistry.service');
const PolicyEngine = require('./policyEngine.service');

class MCPToolGateway {
  constructor() {
    this.registry = new ToolRegistry();
    this.policyEngine = new PolicyEngine();
    this.clients = new Map();
  }

  async executeToolCall(userId, toolCall) {
    const { toolCacheKey, arguments: input, idempotencyKey } = toolCall;

    // Step 1: Retrieve tool definition
    const tool = this.registry.getTool(toolCacheKey);
    if (!tool) {
      throw new Error(`Tool not found: ${toolCacheKey}`);
    }

    // Step 2: Validate input schema
    this.registry.validateToolCall(toolCacheKey, input);

    // Step 3: Check risk class and approval policy
    const riskAssessment = await this.policyEngine.assessRisk({
      userId,
      riskClass: tool.riskClass,
      toolName: tool.toolName,
    });

    if (riskAssessment.requiresApproval) {
      return this.handleApprovalRequired(toolCall, riskAssessment);
    }

    // Step 4: Enforce idempotency for high-risk tools
    if (this.requiresIdempotency(tool.riskClass)) {
      if (!idempotencyKey) {
        throw new Error(`Idempotency key required for ${tool.riskClass} tools`);
      }
      await this.checkIdempotency(idempotencyKey);
    }

    // Step 5: Execute with timeout and retry
    try {
      const result = await this.executeWithRetry(tool, input, {
        timeoutMs: tool.timeoutMs || 30000,
        maxRetries: tool.retryPolicy?.maxAttempts || 3,
      });

      return {
        status: 'completed',
        result,
        duration: result.duration,
      };

    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        errorType: this.classifyError(error),
      };
    }
  }

  async executeWithRetry(tool, input, options) {
    const { timeoutMs, maxRetries } = options;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Get or create MCP client
        const client = await this.getClient(tool.providerId);

        // Execute with timeout
        const result = await Promise.race([
          client.callTool(tool.toolName, input),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          ),
        ]);

        return result;

      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (error.code === 'VALIDATION_ERROR' || error.code === 'PERMISSION_DENIED') {
          throw error;
        }

        // Exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  requiresIdempotency(riskClass) {
    const highRiskClasses = [
      'write',
      'external_side_effect',
      'code_exec',
      'browser',
      'privileged',
    ];
    return highRiskClasses.includes(riskClass);
  }

  async checkIdempotency(idempotencyKey) {
    // Check if this key was used recently (prevent duplicate execution)
    const existing = await this.getIdempotencyRecord(idempotencyKey);

    if (existing) {
      // Return cached result if available
      if (existing.status === 'completed') {
        return existing.result;
      }
      throw new Error(`Idempotency key already in use: ${idempotencyKey}`);
    }

    // Record this key
    await this.recordIdempotencyKey(idempotencyKey);
  }

  async getClient(providerId) {
    if (this.clients.has(providerId)) {
      return this.clients.get(providerId);
    }

    // Create new MCP client
    const client = new MCPClient({
      serverUrl: process.env[`MCP_${providerId}_URL`],
      apiKey: process.env[`MCP_${providerId}_API_KEY`],
    });

    await client.connect();
    this.clients.set(providerId, client);

    return client;
  }

  classifyError(error) {
    if (error.message.includes('Timeout')) {
      return 'TIMEOUT';
    }
    if (error.code === 'VALIDATION_ERROR') {
      return 'VALIDATION_ERROR';
    }
    if (error.code === 'PERMISSION_DENIED') {
      return 'PERMISSION_DENIED';
    }
    return 'EXECUTION_ERROR';
  }
}

module.exports = MCPToolGateway;
```

### Example 3: Registering a Tool

```javascript
// scripts/registerTools.js
const MCPToolGateway = require('../src/services/mcpToolGateway.service');

async function registerGitHubTools() {
  const gateway = new MCPToolGateway();

  // Register GitHub repository search tool
  gateway.registry.registerTool({
    providerId: 'github',
    toolName: 'search_repositories',
    version: 1,
    description: 'Search GitHub repositories',
    schema: {
      input: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          language: { type: 'string', enum: ['javascript', 'python', 'go'] },
          stars: { type: 'number', minimum: 0 },
        },
        required: ['query'],
      },
      output: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                full_name: { type: 'string' },
                stargazers_count: { type: 'number' },
              },
            },
          },
        },
      },
    },
    riskClass: 'read',
    authScope: ['public_repo'],
    timeoutMs: 10000,
    retryPolicy: {
      maxAttempts: 3,
      backoffCoefficient: 2,
    },
  });

  // Register GitHub issue creation tool (higher risk)
  gateway.registry.registerTool({
    providerId: 'github',
    toolName: 'create_issue',
    version: 1,
    description: 'Create a GitHub issue',
    schema: {
      input: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } },
        },
        required: ['owner', 'repo', 'title'],
      },
      output: {
        type: 'object',
        properties: {
          html_url: { type: 'string' },
          number: { type: 'number' },
        },
      },
    },
    riskClass: 'external_side_effect',
    authScope: ['repo'],
    timeoutMs: 15000,
    approvalPolicyId: 'policy-github-write',
    retryPolicy: {
      maxAttempts: 2,
      backoffCoefficient: 2,
    },
  });

  console.log('Registered GitHub tools');
}

registerGitHubTools();
```

### Example 4: Tool Call State Machine

```javascript
// src/models/toolCall.model.js
class ToolCall {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.toolCacheKey = data.toolCacheKey;
    this.arguments = data.arguments;
    this.status = 'requested';
    this.attempts = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  transition(newState, metadata = {}) {
    const validTransitions = {
      requested: ['validating', 'failed'],
      validating: ['pending_approval', 'executing', 'failed'],
      pending_approval: ['executing', 'cancelled', 'failed'],
      executing: ['completed', 'retrying', 'failed'],
      retrying: ['executing', 'failed'],
      completed: [],
      failed: [],
      cancelled: [],
    };

    if (!validTransitions[this.status].includes(newState)) {
      throw new Error(
        `Invalid transition from ${this.status} to ${newState}`
      );
    }

    this.previousStatus = this.status;
    this.status = newState;
    this.updatedAt = new Date();

    if (metadata.error) {
      this.error = metadata.error;
    }

    if (metadata.result) {
      this.result = metadata.result;
    }

    this.attempts++;

    // Log state transition
    console.log(
      `ToolCall ${this.id}: ${this.previousStatus} → ${this.status}`
    );

    return this;
  }

  isTerminal() {
    return ['completed', 'failed', 'cancelled'].includes(this.status);
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      toolCacheKey: this.toolCacheKey,
      status: this.status,
      previousStatus: this.previousStatus,
      attempts: this.attempts,
      error: this.error,
      result: this.result,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = ToolCall;
```

### Example 5: Risk Classification

```javascript
// src/services/riskClassifier.service.js
class RiskClassifier {
  constructor() {
    this.riskLevels = {
      read: { level: 1, requiresApproval: false, idempotencyRequired: false },
      write: { level: 2, requiresApproval: false, idempotencyRequired: true },
      external_side_effect: { level: 3, requiresApproval: true, idempotencyRequired: true },
      code_exec: { level: 4, requiresApproval: true, idempotencyRequired: true },
      browser: { level: 4, requiresApproval: true, idempotencyRequired: true },
      privileged: { level: 5, requiresApproval: true, idempotencyRequired: true },
    };
  }

  classify(toolDefinition, context = {}) {
    const { riskClass } = toolDefinition;
    const riskConfig = this.riskLevels[riskClass];

    if (!riskConfig) {
      throw new Error(`Unknown risk class: ${riskClass}`);
    }

    // Adjust risk based on context
    let adjustedLevel = riskConfig.level;

    // Increase risk if operating on other users' data
    if (context.crossTenant) {
      adjustedLevel += 1;
    }

    // Increase risk for large-scale operations
    if (context.batchSize > 100) {
      adjustedLevel += 1;
    }

    // Cap at maximum level
    adjustedLevel = Math.min(adjustedLevel, 5);

    return {
      riskClass,
      level: adjustedLevel,
      requiresApproval: adjustedLevel >= 3 || riskConfig.requiresApproval,
      idempotencyRequired: riskConfig.idempotencyRequired,
      maxTimeout: this.getMaxTimeout(adjustedLevel),
      auditRequired: true,
    };
  }

  getMaxTimeout(level) {
    const timeouts = {
      1: 30000,   // 30 seconds for read
      2: 60000,   // 1 minute for write
      3: 120000,  // 2 minutes for external
      4: 300000,  // 5 minutes for code/browser
      5: 600000,  // 10 minutes for privileged
    };
    return timeouts[level] || 30000;
  }
}

module.exports = RiskClassifier;
```

### Example 6: Testing with Fake MCP Server

```javascript
// tests/integration/mcpToolGateway.test.js
const { MCPServer } = require('@modelcontextprotocol/sdk');
const MCPToolGateway = require('../../src/services/mcpToolGateway.service');

describe('MCP Tool Gateway', () => {
  let gateway;
  let fakeServer;

  beforeAll(async () => {
    // Start fake MCP server for testing
    fakeServer = new MCPServer({
      name: 'test-server',
      version: '1.0.0',
    });

    // Register test tools
    fakeServer.registerTool({
      name: 'echo',
      description: 'Echo back the input',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
      handler: async (args) => {
        return { result: args.message };
      },
    });

    await fakeServer.start(3001);

    gateway = new MCPToolGateway();
  });

  afterAll(async () => {
    await fakeServer.stop();
  });

  it('should execute a low-risk tool call successfully', async () => {
    const cacheKey = gateway.registry.registerTool({
      providerId: 'test',
      toolName: 'echo',
      version: 1,
      schema: {
        input: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
          required: ['message'],
        },
      },
      riskClass: 'read',
      timeoutMs: 5000,
    });

    const result = await gateway.executeToolCall('user-123', {
      toolCacheKey: cacheKey,
      arguments: { message: 'Hello, World!' },
    });

    expect(result.status).toBe('completed');
    expect(result.result).toEqual({ result: 'Hello, World!' });
  });

  it('should reject high-risk tool without idempotency key', async () => {
    const cacheKey = gateway.registry.registerTool({
      providerId: 'test',
      toolName: 'dangerous_operation',
      version: 1,
      schema: { input: { type: 'object' } },
      riskClass: 'write',
      timeoutMs: 5000,
    });

    await expect(
      gateway.executeToolCall('user-123', {
        toolCacheKey: cacheKey,
        arguments: {},
        // Missing idempotencyKey
      })
    ).rejects.toThrow('Idempotency key required');
  });

  it('should enforce timeout on slow tool calls', async () => {
    // Test timeout enforcement
    // ...
  });

  it('should retry on transient failures', async () => {
    // Test retry logic
    // ...
  });
});
```

---

## 5. Testing & Rollout
- Fake MCP tool servers must be used for deterministic testing.
- Canary version support: Tool definitions must support active/canary traffic splitting for safe rollout.
