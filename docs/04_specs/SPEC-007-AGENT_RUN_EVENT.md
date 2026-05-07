# SPEC-007: AgentRun Event Contract

**Status:** Draft | **Version:** 1.0 | **Date:** 2026-05-07

## 1. Introduction
All execution updates in an `AgentRun` are communicated via a Server-Sent Events (SSE) stream. This document defines the payload structure for these events to ensure consistency across the backend, Temporal workers, and frontend clients.

## 2. Event Envelope
All events MUST follow this basic JSON structure:

```json
{
  "runId": "uuid",
  "eventId": "uuid",
  "timestamp": "ISO-8601",
  "type": "event_type",
  "payload": { ... }
}
```

## 3. Event Types

### 3.1. `run.status_changed`
Emitted when the `AgentRun` transitions between states.
- **Payload:**
  - `previousState`: string
  - `currentState`: string
  - `reason`: string (optional)

### 3.2. `model.step_started` / `model.delta` / `model.step_completed`
Emitted during LLM inference.
- **Payload (`delta`):**
  - `content`: string (chunk)
  - `role`: "assistant"
- **Payload (`completed`):**
  - `fullContent`: string
  - `usage`: { "promptTokens": int, "completionTokens": int }

### 3.3. `retrieval.started` / `retrieval.results`
Emitted during knowledge retrieval.
- **Payload (`results`):**
  - `results`: Array<{ sourceId, content, score, citation }>

### 3.4. `tool.call_started` / `tool.call_completed` / `tool.call_failed`
Emitted during tool execution.
- **Payload (`started`):**
  - `toolName`: string
  - `arguments`: object
- **Payload (`completed`):**
  - `result`: any

### 3.5. `approval.requested` / `approval.received`
Emitted when human-in-the-loop is required.
- **Payload (`requested`):**
  - `action`: "tool_call" | "semantic_clarification" | "high_cost"
  - `context`: object

### 3.6. `semantic.claim_extracted` / `semantic.boundary_hit`
Emitted by the Semantic Protocol.
- **Payload (`claim_extracted`):**
  - `claim`: { text, type, strength, level }
- **Payload (`boundary_hit`):**
  - `boundary`: string
  - `actionTaken`: "block" | "downgrade" | "warn"

### 3.7. `artifact.created` / `artifact.updated`
Emitted when the agent produces or modifies an artifact.
- **Payload:**
  - `artifactId`: string
  - `version`: int
  - `content`: string

### 3.8. `cost.committed`
Emitted to track real-time cost.
- **Payload:**
  - `amount`: float
  - `currency`: "USD"
  - `category`: "model" | "retrieval" | "sandbox"

## 4. SSE Stream Details
- **Endpoint:** `GET /api/runs/:runId/events`
- **Content-Type:** `text/event-stream`
- **Reconnection:** Clients SHOULD use the `Last-Event-Id` header to resume streams. The server MUST replay events from that ID if they are still in the buffer/cache.
