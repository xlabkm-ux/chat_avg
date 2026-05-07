# RUNBOOK-004: Chaos and Fallback Recovery

## 1. Provider Unavailability
If the primary provider (e.g., LiteLLM or OpenAI) goes down (Timeout, 502, 503):
1. The **FallbackPolicy** will detect a retryable error.
2. `chat.service.js` will immediately transparently route the request to the `fallback_provider` configured for the category.
3. No manual intervention is needed for the end user.

## 2. Infrastructure Outages
- **Temporal Restart:** Temporal workflows will suspend and wait for the Temporal worker to come back online. The AgentRun state will remain `running` or `queued`.
- **MCP Gateway Down:** Local provider fallback will fail if no alternative tool-handling system is available. Ensure redundant MCP nodes.
- **Vector Store (RAG) Unavailable:** Knowledge gateway will fail gracefully and downgrade to `no_retrieval` mode if possible.

## 3. Sandbox Crashes
If the E2B sandbox crashes mid-execution:
- The SandboxManager will flag the environment as `error` or `terminated`.
- The AgentRun will fail and emit a `model.failed` trace to the TraceBus.
- Operators can check `RUNBOOK-002-SANDBOX_RECOVERY.md` for cleanup steps.
