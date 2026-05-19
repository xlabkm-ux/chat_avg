---
id: SPEC-009
title: Durable Runtime (Temporal-first)
version: 1.0.0
owner: Core Team
status: Active
last_updated: 2026-05-07
sprint: Sprint 15
---

# SPEC-009: Durable Runtime (Temporal-first)

## 1. Overview
This specification defines the migration of long-running operations (like `AgentRun`) from HTTP-bound execution paths to a Durable Runtime using Temporal. The goal is to ensure high availability, robustness against process crashes, and reliable state tracking across complex multi-step interactions.

## 2. Core Primitives
The Durable Runtime utilizes the following Temporal primitives:
*   **Workflow:** The deterministic orchestration function. For `AgentRun`, this coordinates the model inference, semantic processing, and user approval waits.
*   **Activity:** Non-deterministic business logic (calling LLM APIs, interacting with SQLite). Activities have automatic retries and timeouts.
*   **Signal:** Asynchronous messages sent to a running workflow. Used for external interventions like `approve`, `reject`, or `cancel`.
*   **Query:** Synchronous requests to retrieve the internal state of a workflow (e.g., "What step is currently running?").

## 3. Workflow Lifecycle (AgentRun)
1.  **Start:** The `ChatService` or API layer initiates a workflow via the Temporal Client, passing lightweight identifiers (`runId`, `missionId`).
2.  **Execution Loop:**
    *   **Model Step:** Execute an Activity to fetch LLM responses.
    *   **Semantic Step:** Execute an Activity to pass the LLM response through the ER Meaning Layer.
    *   **Checkpoint:** The workflow state is updated and can be queried.
3.  **Wait for Approval (Signal):** If the policy demands user intervention, the workflow pauses execution (`workflow.condition`) until an `approve` or `cancel` signal is received.
4.  **Resumption / Termination:**
    *   On `approve`, the workflow proceeds to the next iteration or completion.
    *   On `cancel`, the workflow runs cleanup activities and terminates with a `cancelled` state.
5.  **Completion:** The workflow returns a final status, which is recorded in the operational database.

## 4. Payload Policy (CRITICAL)
Temporal's event history size is limited and should be kept as small as possible to ensure fast replay and low overhead.
*   **ALLOWED in Workflow History (Small Data):** Control metadata, identifiers (`runId`, `userId`, `missionId`), status enums, and tiny configurations.
*   **FORBIDDEN in Workflow History (Large Data):** Full chat histories, large generated artifacts, deep semantic graphs, or massive JSON schemas.
*   **Offloading Pattern:** Activities must read/write large payloads directly to the persistent storage (e.g., SQLite app DB) and return only references (IDs or URIs) to the Workflow.

## 5. Code Examples

### Example 1: Starting an AgentRun Workflow

```javascript
// src/services/run.service.js
const { Client } = require('@temporalio/client');
const { v4: uuidv4 } = require('uuid');

class RunService {
  constructor() {
    this.temporalEnabled = process.env.TEMPORAL_RUNTIME_ENABLED === 'true';
    this.client = this.temporalEnabled
      ? new Client({ address: process.env.TEMPORAL_ADDRESS || 'localhost:7233' })
      : null;
  }

  async startAgentRun(userId, missionId, message) {
    const runId = uuidv4();

    if (this.temporalEnabled) {
      // Start durable workflow
      const handle = await this.client.workflow.start('agentWorkflow', {
        args: [{ runId, userId, missionId, message }],
        taskQueue: 'chatavg-tasks',
        workflowId: `agent-run-${runId}`,
        workflowExecutionTimeout: 3600000, // 1 hour
      });

      console.log(`Started workflow: ${handle.workflowId}`);
      return { runId, mode: 'durable' };
    } else {
      // Fallback to in-memory execution
      console.warn('Temporal disabled, using in-memory execution');
      return this.executeInMemory(runId, userId, missionId, message);
    }
  }

  async executeInMemory(runId, userId, missionId, message) {
    // Legacy execution without durability guarantees
    const agentRun = new AgentRun({ runId, userId, missionId });
    await agentRun.processMessage(message);
    return { runId, mode: 'in-memory' };
  }
}
```

### Example 2: AgentRun Workflow Definition

```javascript
// src/workflows/agentWorkflow.js
const { proxyActivities, sleep, condition } = require('@temporalio/workflow');

const {
  inferenceActivity,
  extractClaimsActivity,
  checkPolicyActivity,
  saveStateActivity,
} = proxyActivities({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumAttempts: 5,
  },
});

exports.agentWorkflow = async function agentWorkflow({ runId, userId, missionId, message }) {
  let currentStep = 'initialized';
  let requiresApproval = false;
  let approved = false;

  try {
    // Step 1: Model Inference
    currentStep = 'inference';
    await saveStateActivity(runId, currentStep);
    const llmResponse = await inferenceActivity({ userId, message });

    // Step 2: Semantic Processing (Claim Extraction)
    currentStep = 'semantic_processing';
    await saveStateActivity(runId, currentStep);
    const claims = await extractClaimsActivity(llmResponse.text);

    // Step 3: Policy Check
    currentStep = 'policy_check';
    await saveStateActivity(runId, currentStep);
    const policyResult = await checkPolicyActivity({ claims, userId });

    requiresApproval = policyResult.requiresApproval;

    // Step 4: Wait for Approval (if required)
    if (requiresApproval) {
      currentStep = 'waiting_approval';
      await saveStateActivity(runId, currentStep, { requiresApproval: true });

      // Pause workflow until signal received or timeout
      const timeout = sleep(86400000); // 24 hours
      await condition(() => approved || timeout.finished());

      if (!approved) {
        currentStep = 'cancelled';
        await saveStateActivity(runId, currentStep);
        return { status: 'cancelled', reason: 'approval_timeout' };
      }
    }

    // Step 5: Complete
    currentStep = 'completed';
    await saveStateActivity(runId, currentStep);

    return {
      status: 'completed',
      response: llmResponse,
      claims: claims,
      steps: currentStep,
    };

  } catch (error) {
    currentStep = 'failed';
    await saveStateActivity(runId, currentStep, { error: error.message });
    throw error;
  }
};
```

### Example 3: Sending Signals to Workflow

```javascript
// src/services/approval.service.js
const { Client } = require('@temporalio/client');

class ApprovalService {
  constructor() {
    this.client = new Client({ address: process.env.TEMPORAL_ADDRESS });
  }

  async approveAgentRun(runId, userId) {
    const workflowId = `agent-run-${runId}`;
    const handle = this.client.workflow.getHandle(workflowId);

    // Send approval signal
    await handle.signal('approve', { userId, timestamp: Date.now() });

    console.log(`Sent approval signal to workflow ${workflowId}`);
  }

  async rejectAgentRun(runId, userId, reason) {
    const workflowId = `agent-run-${runId}`;
    const handle = this.client.workflow.getHandle(workflowId);

    // Send rejection signal
    await handle.signal('reject', { userId, reason, timestamp: Date.now() });

    console.log(`Sent rejection signal to workflow ${workflowId}`);
  }

  async cancelAgentRun(runId) {
    const workflowId = `agent-run-${runId}`;
    const handle = this.client.workflow.getHandle(workflowId);

    // Cancel workflow
    await handle.cancel();

    console.log(`Cancelled workflow ${workflowId}`);
  }
}
```

### Example 4: Querying Workflow State

```javascript
// src/services/monitoring.service.js
const { Client } = require('@temporalio/client');

class MonitoringService {
  constructor() {
    this.client = new Client({ address: process.env.TEMPORAL_ADDRESS });
  }

  async getAgentRunStatus(runId) {
    const workflowId = `agent-run-${runId}`;
    const handle = this.client.workflow.getHandle(workflowId);

    try {
      // Query current state
      const status = await handle.query('getStatus');
      const description = await handle.describe();

      return {
        runId,
        status,
        workflowStatus: description.status,
        startTime: description.startTime,
        closeTime: description.closeTime,
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        return { runId, status: 'not_found' };
      }
      throw error;
    }
  }

  async listActiveAgentRuns() {
    const workflows = await this.client.workflow.list({
      query: 'WorkflowType="agentWorkflow" AND ExecutionStatus="Running"',
    });

    return workflows.map(wf => ({
      workflowId: wf.workflowId,
      runId: wf.workflowId.replace('agent-run-', ''),
      startTime: wf.startTime,
    }));
  }
}
```

### Example 5: Activity Implementation with Retry Logic

```javascript
// src/activities/inference.activity.js
const LiteLLM = require('../services/litellm.service');

exports.inferenceActivity = async function inferenceActivity({ userId, message }) {
  const litellm = new LiteLLM({
    apiKey: process.env.LITELLM_API_KEY,
    baseUrl: process.env.LITELLM_BASE_URL,
  });

  try {
    const response = await litellm.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      text: response.choices[0].message.content,
      model: response.model,
      tokens: response.usage.total_tokens,
      cost: response._metadata?.cost || 0,
    };

  } catch (error) {
    // Activity will automatically retry based on workflow config
    console.error(`Inference failed for user ${userId}:`, error.message);
    throw error;
  }
};

// src/activities/extractClaims.activity.js
const AdequacyEngine = require('../services/adequacyEngine');

exports.extractClaimsActivity = async function extractClaimsActivity(text) {
  const engine = new AdequacyEngine();

  try {
    const claims = await engine.extractClaims(text);

    return claims.map(claim => ({
      text: claim.text,
      type: claim.type, // 'fact', 'opinion', 'hypothesis'
      strength: claim.strength, // 'strong', 'weak', 'uncertain'
      domain: claim.domain, // 'material', 'procedural', 'conceptual'
    }));

  } catch (error) {
    console.error('Claim extraction failed:', error.message);
    // Don't fail the whole workflow if claim extraction fails
    return [];
  }
};
```

### Example 6: Configuration (.env)

```bash
# Temporal Configuration
TEMPORAL_RUNTIME_ENABLED=true
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=chatavg-tasks

# Workflow Timeouts (milliseconds)
TEMPORAL_WORKFLOW_EXECUTION_TIMEOUT=3600000  # 1 hour
TEMPORAL_WORKFLOW_TASK_TIMEOUT=10000         # 10 seconds
TEMPORAL_ACTIVITY_START_TO_CLOSE_TIMEOUT=30000  # 30 seconds

# Retry Configuration
TEMPORAL_RETRY_MAX_ATTEMPTS=5
TEMPORAL_RETRY_BACKOFF_COEFFICIENT=2
TEMPORAL_RETRY_INITIAL_INTERVAL=1000  # 1 second
```

## 7. Testing Examples

### Unit Test for Workflow

```javascript
// tests/unit/agentWorkflow.test.js
const { TestWorkflowEnvironment } = require('@temporalio/testing');
const { Worker } = require('@temporalio/worker');
const { agentWorkflow } = require('../../src/workflows/agentWorkflow');

describe('AgentRun Workflow', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  afterAll(async () => {
    await testEnv.teardown();
  });

  it('should complete successfully with valid input', async () => {
    const { client, nativeConnection } = testEnv;

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('../../src/workflows/agentWorkflow'),
    });

    const result = await client.workflow.execute(agentWorkflow, {
      args: [{
        runId: 'test-run-123',
        userId: 'user-456',
        missionId: 'mission-789',
        message: 'What is the capital of France?',
      }],
      taskQueue: 'test',
      workflowId: 'test-workflow-123',
    });

    expect(result.status).toBe('completed');
    expect(result.response).toBeDefined();
  });

  it('should wait for approval when policy requires it', async () => {
    // Test implementation with signals
    // ...
  });
});
```

## 8. Lightweight Dev Fallback
Temporal is a heavy dependency for simple local development. The system enforces a graceful degradation strategy via the `TEMPORAL_RUNTIME_ENABLED` feature flag. 
*   If `true`: `run.service.js` dispatches work to the Temporal Cluster.
*   If `false`: `run.service.js` falls back to the legacy `in-memory` execution path, leveraging SQLite purely for audit and basic state storage, but without durability guarantees across restarts.
