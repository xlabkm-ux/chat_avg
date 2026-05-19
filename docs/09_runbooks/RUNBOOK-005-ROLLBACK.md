# RUNBOOK-003: Rollback Procedures (ChatAVG v2.3)

**Category:** Operational Recovery  
**Severity:** Critical  
**Target:** Rapid recovery from failed deployment or system-wide regression.

## 1. Scenario: Failed v2.3 Deployment
If the v2.3 deployment fails to boot or exhibits immediate critical failures.

### Action: Rollback to v1 (Baseline)
1. **Revert Binary**: Deploy the previous stable v1 container/binary.
2. **Environment**: Ensure `AGENT_RUNS_ENABLED` and `KNOWLEDGE_GATEWAY_ENABLED` are set to `false` in `.env` if the previous version doesn't support them.
3. **Database**: ChatAVG v2.3 uses a compatible schema with v1, but if migrations were applied, verify forward-compatibility. (v2.3 schema is additive).
4. **Proxy**: If using a reverse proxy (Nginx/IIS), point traffic back to the v1 instance.

## 2. Scenario: Critical Component Failure (Graceful Degradation)
If specific components like Temporal or E2B fail, but the core chat remains functional.

### Action: Feature Flag Lockdown
1. Identify the failing component.
2. Update `.env` to disable the component:
   - `TEMPORAL_RUNTIME_ENABLED=false` (switches to synchronous execution)
   - `SANDBOX_FORGE_ENABLED=false` (disables sandbox tools)
   - `KNOWLEDGE_GATEWAY_ENABLED=false` (disables RAG)
3. Restart the application.
4. System will fallback to "Fast Path" mode automatically.

## 3. Scenario: Provider / LiteLLM Failure
If the primary AI provider or LiteLLM proxy is down.

### Action: Fallback Routing
1. Update `providers.config.js` or `litellm_config.yaml` to point to a healthy provider.
2. If LiteLLM is down, update `category.repository` or `.env` to bypass the gateway and connect directly to a backup provider (e.g., Llama.cpp or OpenAI).

## 4. Scenario: Database Corruption
1. **Stop Service**: `npm stop`
2. **Backup Current**: `cp data/chatavg.db data/chatavg.db.corrupt`
3. **Restore**: `cp data/chatavg.db.bak data/chatavg.db`
4. **Restart**: `npm start`

## 5. Verification after Rollback
1. Run smoke tests: `npm run test:integration:smoke`
2. Check logs: `tail -f logs/app.log`
3. Verify dashboard metrics are stable.
