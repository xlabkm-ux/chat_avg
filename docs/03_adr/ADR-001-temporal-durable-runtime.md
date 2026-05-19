# ADR-001: Temporal as Durable Runtime

**Status:** Accepted  
**Version:** 1.0  
**Owner:** Backend Team  
**Last Updated:** 2026-05-19  
**Reviewers:** Architect, Tech Lead  
**Related:** [SPEC-009](../04_specs/SPEC-009-DURABLE_RUNTIME.md), [RUNBOOK-001](../09_runbooks/RUNBOOK-001-TEMPORAL_RECOVERY.md)

---

## Context

ChatAVG platform requires durable execution for long-running agent workflows with the following characteristics:

1. **Human-in-the-loop approval**: Agent runs may pause for hours or days waiting for user approval/rejection of proposed actions
2. **Crash resilience**: Workflows must survive server restarts, process crashes, and network failures without losing state
3. **Automatic retries**: Failed LLM calls, tool executions, and database operations should retry with exponential backoff
4. **Compensation logic**: On rejection, workflows must execute cleanup/rollback activities (e.g., revert database changes, delete artifacts)
5. **State visibility**: Operators need to query workflow state at any time for debugging and monitoring

The naive approach of storing workflow state in-memory or in SQLite with polling loops fails under production conditions:
- In-memory state is lost on restart
- Polling loops consume resources and introduce latency
- Manual retry logic is error-prone and hard to test
- Compensation on failure requires complex transaction management

We evaluated several approaches to solve this problem.

## Decision

**Selected: Temporal.io as the Durable Runtime engine**

Temporal provides a workflow-as-code abstraction where business logic is written as regular functions, but executed with durability guarantees through event sourcing and replay semantics.

### How it works in ChatAVG:

1. **Workflow Definition**: `AgentRun` workflow orchestrates the entire lifecycle: model inference → semantic processing → policy check → approval wait → next iteration
2. **Activities**: Non-deterministic operations (LLM API calls, SQLite writes, sandbox execution) are wrapped in Activities with automatic retries
3. **Signals**: External events (user approval, cancellation) are sent as Signals to paused workflows
4. **Queries**: Current workflow state can be queried synchronously for UI display
5. **Feature Flag**: `TEMPORAL_RUNTIME_ENABLED` allows fallback to in-memory execution for local development

### Payload Policy:

To prevent workflow history bloat, Temporal workflows only carry lightweight identifiers (`runId`, `missionId`). Large payloads (chat history, generated artifacts) are stored in SQLite, and Activities read/write by reference.

## Consequences

### Positive

1. **Crash-proof execution**: Workflows survive any infrastructure failure. State is persisted via event sourcing.
2. **Clean code**: Business logic is written as synchronous-looking functions, no callback hell or state machine boilerplate.
3. **Built-in observability**: Temporal Web UI provides workflow tracing, history inspection, and replay debugging out-of-the-box.
4. **Automatic retries**: Activity failures are retried with configurable policies (exponential backoff, max attempts, timeouts).
5. **Deterministic replay**: Workflows can be replayed from history for debugging or testing, ensuring reproducibility.
6. **Scalability**: Temporal Workers can scale horizontally; workflows are distributed across workers automatically.

### Negative

1. **Infrastructure complexity**: Requires running Temporal Server (frontend, matching, history, worker services) + Cassandra/PostgreSQL for persistence. Adds operational burden.
2. **Learning curve**: Developers must understand Temporal primitives (Workflow, Activity, Signal, Query) and determinism constraints (no randomness, no direct I/O in workflows).
3. **Latency overhead**: Workflow decisions add ~10-50ms latency per step due to event logging and task queue routing.
4. **Vendor lock-in risk**: Migrating away from Temporal would require rewriting all workflow logic.
5. **Resource consumption**: Temporal Server requires ~2GB RAM minimum for a single-node dev cluster.

## Alternatives Considered

### 1. Self-written SQLite Workflow Engine

**Description**: Build a custom workflow engine using SQLite tables for state persistence, with a scheduler loop polling for pending tasks.

**Why Rejected**:
- High development effort (~2-3 months to build a reliable engine)
- No built-in retry logic, compensation, or observability
- Race conditions and concurrency bugs likely
- Would need to reinvent event sourcing, saga patterns, and deadlock detection
- Maintenance burden for a non-core component

### 2. AWS Step Functions

**Description**: Use AWS managed orchestration service with state machines defined in Amazon States Language (JSON).

**Why Rejected**:
- Vendor lock-in to AWS ecosystem (project aims for cloud-agnostic deployment)
- Limited flexibility: state machines are declarative JSON, not imperative code
- Debugging is difficult (no local replay, limited visibility into intermediate states)
- Cost at scale: $25 per million state transitions vs. Temporal's flat infrastructure cost
- Latency: Cold starts and API Gateway overhead add 100-500ms per transition

### 3. Cadence (Temporal Fork Predecessor)

**Description**: Cadence is the open-source predecessor to Temporal, created by Uber.

**Why Rejected**:
- Temporal has better developer experience, improved SDKs, and active community
- Cadence development has slowed since Temporal Technologies was founded
- Temporal offers better observability (Web UI, metrics, tracing)
- No compelling reason to choose the older project

### 4. Node.js Worker Threads + Redis Queue

**Description**: Use BullMQ or similar job queue with Redis for persistence, executing long-running tasks in worker threads.

**Why Rejected**:
- No deterministic replay: if a worker crashes mid-task, the task must restart from scratch
- No built-in compensation: rollback logic must be manually implemented
- State management is ad-hoc: no standard way to query "what step is this workflow on?"
- Human approval waits would require complex timeout/cancellation handling

## Validation

Success criteria for Temporal adoption:

1. **Crash Recovery Test**: Kill the Node.js process mid-workflow; verify workflow resumes from last completed activity after restart.
2. **Approval Wait Test**: Pause workflow for 24+ hours waiting for user approval; verify low resource consumption and correct resumption.
3. **Retry Test**: Simulate LLM API failure; verify automatic retry with exponential backoff succeeds within configured attempts.
4. **Observability Test**: Use Temporal Web UI to inspect workflow history, identify failed activities, and replay execution.
5. **Performance Benchmark**: Measure p95 latency added by Temporal orchestration; target <100ms overhead per workflow decision.

Current status (Sprint 7): Workflow skeleton implemented with mock activities. Full Temporal cluster integration pending Docker Compose setup.

## References

- [Temporal Documentation](https://docs.temporal.io/)
- [SPEC-009: Durable Runtime](../04_specs/SPEC-009-DURABLE_RUNTIME.md)
- [RUNBOOK-001: Temporal Recovery](../09_runbooks/RUNBOOK-001-TEMPORAL_RECOVERY.md)
- [Temporal vs Step Functions Comparison](https://temporal.io/blog/temporal-vs-step-functions)
- [Workflow Engine Pattern](https://microservices.io/patterns/data/workflow-engine.html)

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-19 | AI Assistant | Initial ADR completion for Sprint F3 |
