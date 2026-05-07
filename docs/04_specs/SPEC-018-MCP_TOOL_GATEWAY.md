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

## 4. Testing & Rollout
- Fake MCP tool servers must be used for deterministic testing.
- Canary version support: Tool definitions must support active/canary traffic splitting for safe rollout.
