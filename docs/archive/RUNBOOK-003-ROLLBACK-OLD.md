# Rollback Runbook (RUNBOOK-003)

## Objective
Provide clear instructions for rolling back ChatAVG from v2.3 to v2.2 or a previous stable state in case of critical failures.

## Trigger Criteria
- P99 latency exceeds 5000ms for more than 5 minutes.
- Error rate exceeds 10% on critical paths.
- Data corruption detected in SQLite.
- Security breach or unauthorized access.

## Rollback Procedure

### 1. Application Rollback
If deploying via Docker/Kubernetes:
```bash
docker rollout undo deployment/chatavg
```
If manual deployment:
1. Stop current service: `npm stop`
2. Checkout previous version: `git checkout v2.2-stable`
3. Install dependencies: `npm install`
4. Start service: `npm start`

### 2. Database Rollback
**Caution: Database rollbacks can lead to data loss of events generated during the new version.**

1. Identify the last successful migration before v2.3 (Migration 10).
2. Restore from backup (recommended):
   ```bash
   cp backups/sqlite_pre_v2.3.db data/chatavg.db
   ```
3. If no backup, manual downgrade (not recommended for complex schema changes):
   `DROP TABLE tool_calls; DROP TABLE budget_records;` etc.

### 3. Gateway Fallback
If LiteLLM or MCP Gateway is the cause:
1. Disable gateway in `src/core/config.js`: `MODEL_GATEWAY_ENABLED=false`
2. Restart service.

## Verification after Rollback
- Run `npm test` to ensure core functionality is restored.
- Verify user login and session history.
- Check logs for any residual errors from the failed version.
