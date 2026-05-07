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

## 5. Lightweight Dev Fallback
Temporal is a heavy dependency for simple local development. The system enforces a graceful degradation strategy via the `TEMPORAL_RUNTIME_ENABLED` feature flag. 
*   If `true`: `run.service.js` dispatches work to the Temporal Cluster.
*   If `false`: `run.service.js` falls back to the legacy `in-memory` execution path, leveraging SQLite purely for audit and basic state storage, but without durability guarantees across restarts.
