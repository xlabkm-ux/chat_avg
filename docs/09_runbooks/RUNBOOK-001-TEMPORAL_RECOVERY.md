# RUNBOOK-001: Temporal Restart, Replay & Recovery

## 1. Objective
This runbook provides operational procedures for managing the Temporal local development cluster, handling worker crashes, and recovering stalled `AgentRun` workflows.

## 2. Cluster & Worker Initialization
For local development, ChatAVG utilizes the Temporal CLI to run a lightweight, ephemeral cluster.

### Starting the Cluster
```bash
temporal server start-dev
```
*Note: The Web UI is available at `http://localhost:8233`.*

### Starting the Worker
From the `cons/chatavg` directory:
```bash
node src/modules/temporal/worker.js
```
*(Ensure `TEMPORAL_RUNTIME_ENABLED=true` in your `.env` or `config.js`)*

## 3. Crash Recovery (Workers)
If the Node.js worker process crashes or is restarted:
1.  **Do nothing to the workflows.**
2.  Simply restart the worker process.
3.  **Temporal Guarantee:** Temporal will automatically reassign pending tasks to the new worker. Running workflows will seamlessly resume, replaying their deterministic history to reach their last known state before continuing.

## 4. Activity Failures & Retries
Activities (like API calls to the Model Gateway) are configured with automatic retry policies.
*   **Transient Failures:** If an API is temporarily down, the Activity will automatically retry with exponential backoff.
*   **Permanent Failures:** If an Activity throws a `NonRetryableError` or exhausts its retry limits, the workflow will catch the exception. Depending on the workflow logic, it will either transition the `AgentRun` to `failed` or attempt a fallback.

## 5. Graceful Degradation (Temporal Outage)
If the Temporal cluster experiences an unrecoverable outage during development or you need to run the application in a constrained environment:
1.  Open `cons/chatavg/.env` (or override the environment variable).
2.  Set `TEMPORAL_RUNTIME_ENABLED=false`.
3.  Restart the Node.js application server.
4.  **Result:** `AgentRun` executions will automatically fallback to the legacy in-memory executor. 
*Warning: In-flight workflows that were executing in Temporal will remain paused in the Temporal cluster until it is restored.*
