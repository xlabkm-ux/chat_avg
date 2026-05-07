# RUNBOOK-003: Observability and Load Management

## 1. Trace Bus
The **Trace Bus** (`trace.bus.js`) acts as the single source of truth for all telemetry in the ChatAVG backend.
It holds the latest 1000 events in memory and broadcasts them internally. External systems (Datadog, Prometheus) act only as overlays.
- View recent traces on the Admin MVP Dashboard (`GET /api/admin/dashboard/mvp`).

## 2. Handling High Load (Backpressure)
If the system hits the hard limit for concurrent requests to a specific provider (e.g., 50 active requests for `openai`):
1. **Symptom:** Clients receive `429 Too Many Requests` or auto-fallback to a secondary provider.
2. **Action:** 
   - Check the Admin Dashboard to confirm `run_status` and active requests.
   - If acceptable, the system is gracefully degrading.
   - If unacceptable, increase `MAX_CONCURRENT_PER_PROVIDER` in `chat.service.js` ONLY IF the downstream API limits permit it.

## 3. Interpreting P95 Latency Spikes
- **Semantic Layer:** If latency spikes, check if `knowledge_gateway` is taking too long to extract claims.
- **Provider Layer:** If a model provider spikes, check `fallbackPolicy` logic to ensure fast timeouts are triggered.
