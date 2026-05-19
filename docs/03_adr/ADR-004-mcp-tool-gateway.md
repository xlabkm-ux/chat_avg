# ADR-004: MCP Only as Tool Gateway

**Status:** Accepted  
**Version:** 1.0  
**Owner:** Backend Team  
**Last Updated:** 2026-05-19  
**Reviewers:** Architect, Security Lead  
**Related:** [SPEC-018](../04_specs/SPEC-018-MCP_TOOL_GATEWAY.md), [SPEC-023](../04_specs/SPEC-023-MCP_TOOL_GATEWAY.md), [ADR-002](./ADR-002-litellm-model-gateway.md)

---

## Context

ChatAVG agents need to interact with external systems through tools (e.g., database queries, API calls, file operations, code execution). These tool interactions require:

1. **Standardized interface**: A consistent protocol for discovering, invoking, and monitoring tool executions across diverse providers
2. **Schema validation**: Strict input/output contracts to prevent malformed requests and ensure type safety
3. **Risk classification**: Categorize tools by side-effect severity (read, write, external_side_effect, code_exec, browser, privileged) for policy enforcement
4. **Version control**: Track tool schema changes over time; enable canary deployments and rollback for breaking changes
5. **Authorization**: Enforce OAuth scopes, tenant permissions, and approval policies before tool execution
6. **Observability**: Log all tool calls with timing, cost, and outcome data for auditing and debugging

The Model Context Protocol (MCP) is an emerging open standard for connecting AI models to external data sources and tools. However, MCP's scope could theoretically extend to both **tool execution** and **model inference**. We needed to clarify MCP's role in our architecture.

## Decision

**Selected: MCP exclusively as a Tool Gateway protocol; model inference handled separately via LiteLLM (ADR-002)**

MCP is used ONLY for:
- Tool discovery and registration
- Schema definition (JSON Schema for inputs/outputs)
- Tool invocation via JSON-RPC over SSE/HTTP or STDIO
- Versioned tool definitions with canary support
- Risk classification and policy enforcement

MCP is NOT used for:
- Model inference (LLM API calls) → Handled by LiteLLM Proxy (ADR-002)
- Workflow orchestration → Handled by Temporal (ADR-001)
- Knowledge retrieval/RAG → Handled by KnowledgeGateway (SPEC-014)

### Architecture:

1. **Tool Registry**: Caches tool definitions keyed by `providerId + toolName + toolVersion + schemaHash`
2. **ToolCall State Machine**: Tracks lifecycle from `requested` → `validating` → `pending_approval` → `executing` → `completed`/`failed`
3. **Risk Classes**: Six severity levels determine approval requirements and idempotency enforcement
4. **MCP Transport**: JSON-RPC messages over SSE/HTTP (remote tools) or STDIO (local binaries)
5. **Idempotency Enforcement**: Write/external/code_exec/browser/privileged tools require `idempotencyKey` to prevent duplicate executions

### Protocol Separation:

```
┌─────────────────────────────────────────────┐
│         ChatAVG Agent Runtime               │
├──────────────┬──────────────────────────────┤
│ Inference    │ Tools & Connectors           │
├──────────────┼──────────────────────────────┤
│ LiteLLM      │ MCP Tool Gateway             │
│ (OpenAI API) │ (JSON-RPC / SSE)             │
└──────────────┴──────────────────────────────┘
```

This separation ensures each protocol specializes in its domain:
- **LiteLLM**: Optimized for LLM routing, fallbacks, token counting, cost tracking
- **MCP**: Optimized for tool discovery, schema validation, risk classification, authorization

## Consequences

### Positive

1. **Clean architecture**: Clear separation of concerns between inference (LiteLLM) and tools (MCP); no protocol overlap or confusion.
2. **Standardization**: MCP is an open standard with growing ecosystem support (Anthropic, Slack, GitHub tools); avoids vendor lock-in to custom protocols.
3. **Schema evolution**: Versioned tool definitions enable backward-compatible changes; canary deployments allow safe rollout of breaking changes.
4. **Policy enforcement**: Risk classes integrate with PolicyEngine to require user approval for high-risk tools (write, code_exec, browser).
5. **Observability**: All tool calls are logged with structured events (tool.requested, tool.executing, tool.completed, tool.failed) for auditing and cost analysis.
6. **Idempotency guarantees**: Mandatory idempotency keys for destructive operations prevent duplicate charges, double-posts, or data corruption on retries.

### Negative

1. **Learning curve**: Developers must understand MCP protocol semantics (JSON-RPC, SSE transport, tool schemas) in addition to OpenAI API patterns.
2. **Protocol overhead**: JSON-RPC adds serialization/deserialization latency (~5-10ms per tool call) compared to direct function invocation.
3. **Limited tool ecosystem**: MCP is relatively new (2024); fewer pre-built tool servers compared to mature frameworks like LangChain tools.
4. **Debugging complexity**: Tracing tool calls across MCP transport (SSE/STDIO) → Tool Server → External API requires distributed tracing setup.
5. **Version management burden**: Maintaining multiple tool versions (for backward compatibility) increases registry storage and testing matrix.

## Alternatives Considered

### 1. Custom Internal Protocol

**Description**: Design a proprietary protocol for tool discovery and execution specific to ChatAVG.

**Why Rejected**:
- **Reinventing the wheel**: MCP already solves tool standardization; building custom protocol wastes engineering effort
- **Ecosystem isolation**: Custom protocol would lack community support, third-party tools, and integration examples
- **Maintenance burden**: Would need to design, document, version, and maintain the protocol indefinitely
- **Interoperability loss**: Cannot leverage existing MCP tool servers or contribute to/open-source efforts

### 2. LangChain Tools

**Description**: Use LangChain's tool abstraction (BaseTool class) for defining and executing agent tools.

**Why Rejected**:
- **Framework lock-in**: Tightly coupled to LangChain ecosystem; difficult to use tools outside LangChain agents
- **No standardized protocol**: LangChain tools are Python/JavaScript classes, not a network protocol; cannot expose tools as independent services
- **Limited schema evolution**: No built-in versioning or canary deployment support for tool changes
- **Performance overhead**: LangChain's abstraction layer adds latency; not optimized for high-throughput tool execution

### 3. OpenAPI/Swagger for Tools

**Description**: Define tools as REST endpoints with OpenAPI schemas; use standard HTTP calls for execution.

**Why Rejected**:
- **Verbosity**: OpenAPI specs are verbose for simple tool definitions; JSON Schema in MCP is more concise
- **No streaming**: OpenAPI lacks native SSE/streaming support; MCP supports real-time tool output streaming
- **Discovery complexity**: OpenAPI requires separate service discovery mechanism; MCP has built-in tool listing via `list_tools` RPC call
- **Stateless limitation**: REST is stateless; MCP sessions can maintain context across multiple tool calls (useful for multi-step workflows)

### 4. gRPC for Tool Execution

**Description**: Use gRPC with Protocol Buffers for high-performance tool calls with strong typing.

**Why Rejected**:
- **Complexity overhead**: gRPC requires .proto file compilation, code generation, and stub management; overkill for simple tool calls
- **Browser incompatibility**: gRPC-Web is required for browser clients; adds proxy layer and complexity
- **Schema rigidity**: Protocol Buffers are less flexible than JSON Schema for dynamic tool definitions
- **Ecosystem mismatch**: Most AI tool providers (Slack, GitHub, Notion) offer REST/JSON APIs, not gRPC

## Validation

Success criteria for MCP Tool Gateway adoption:

1. **Tool Discovery Test**: Register 10+ tools from different providers; verify Tool Registry caches definitions with correct versioning.
2. **Schema Validation Test**: Send malformed tool input; verify validation error returned before execution (fail-fast).
3. **Risk Classification Test**: Invoke a `code_exec` tool; verify PolicyEngine requires user approval before execution.
4. **Idempotency Test**: Send duplicate tool calls with same `idempotencyKey`; verify second call returns cached result (not re-executed).
5. **Canary Deployment Test**: Deploy v2 of a tool with 10% traffic split; verify metrics show correct distribution between v1/v2.
6. **Egress Security Test**: Attempt tool call to non-allowlisted external API; verify request blocked by egress policy.

Current status (Sprint 15): MCP Tool Gateway skeleton implemented with fake tool servers for testing. Real MCP integration pending provider onboarding (Slack, GitHub, Google Drive).

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [SPEC-018: MCP Tool Gateway](../04_specs/SPEC-018-MCP_TOOL_GATEWAY.md)
- [SPEC-023: MCP Tool Gateway and Registry](../04_specs/SPEC-023-MCP_TOOL_GATEWAY.md)
- [ADR-002: LiteLLM as Model Gateway](./ADR-002-litellm-model-gateway.md)
- [LangChain Tools Documentation](https://python.langchain.com/docs/modules/tools/)

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-19 | AI Assistant | Initial ADR completion for Sprint F3 |
