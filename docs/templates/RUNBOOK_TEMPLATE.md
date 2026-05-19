---
id: RUNBOOK-XXX
title: Procedure Name (What this runbook addresses)
severity: P0 | P1 | P2
owner: [Team responsible for this procedure]
last_tested: YYYY-MM-DD
next_review: YYYY-MM-DD
---

# RUNBOOK-XXX: Procedure Title

**Severity:** P0 (Critical) | P1 (High) | P2 (Medium)
**Owner:** [Team Name]
**Last Tested:** YYYY-MM-DD
**Next Review:** YYYY-MM-DD

## When to Use

Clear triggers that indicate this runbook should be used:

- Alert: "[Specific alert name]" fires
- Symptom: [Observable symptom 1]
- Symptom: [Observable symptom 2]
- User reports: [Type of user complaint]

**Example:**
```
Use this runbook when:
- Temporal worker health check fails (alert: temporal_worker_down)
- AgentRun workflows are stuck in "running" state for > 30 minutes
- Error rate on /api/chat endpoint exceeds 10% for 5 minutes
```

## Symptoms

What you will observe when this issue occurs:

**Monitoring:**
- Grafana dashboard: [Dashboard name] shows [specific metric] > [threshold]
- Logs contain: `[specific error pattern]`
- Alerts: `[Alert name]` fires

**User Impact:**
- Users experience: [Description of impact]
- Affected endpoints: [List of affected APIs]
- Severity: [Percentage of users affected]

## Diagnosis

Step-by-step process to confirm this is the issue:

### Step 1: Verify the Issue

```bash
# Check service health
curl http://localhost:3000/health

# Check logs for errors
tail -f cons/chatavg/logs/error.log | grep "ERROR"

# Check database connections
sqlite3 cons/chatavg/data/chatavg.db "SELECT count(*) FROM agent_runs WHERE status='running';"
```

**Expected output if issue is present:**
```
Health check: {"status":"unhealthy","checks":{"temporal":"down"}}
Logs: ERROR: Temporal connection refused
Database: 47
```

### Step 2: Identify Root Cause

Check each potential cause:

**Cause 1: Temporal server down**
```bash
# Check if Temporal is running
docker ps | grep temporal

# Check Temporal health
curl http://localhost:7233/health
```

**Cause 2: Network connectivity issue**
```bash
# Test connectivity to Temporal
nc -zv localhost 7233

# Check for firewall rules
iptables -L | grep 7233
```

**Cause 3: Configuration error**
```bash
# Check environment variables
cat cons/chatavg/.env | grep TEMPORAL

# Verify configuration matches expected values
echo $TEMPORAL_ADDRESS
```

## Resolution

### Immediate Actions (Restore Service)

#### Action 1: Restart Temporal Worker

```bash
# Stop the worker
pkill -f "npm run worker"

# Wait for graceful shutdown
sleep 5

# Start the worker
cd cons/chatavg && npm run worker &

# Verify it started successfully
tail -f logs/worker.log
```

**Verification:**
```bash
# Check worker is running
ps aux | grep worker

# Check health endpoint
curl http://localhost:3000/health
```

#### Action 2: Restart Temporal Server (if needed)

```bash
# If using Docker
docker restart temporal-server

# If using local installation
brew services restart temporal

# Verify Temporal is healthy
curl http://localhost:7233/health
```

#### Action 3: Clear Stuck Workflows

If workflows are stuck, clear them:

```javascript
// Run this script to reset stuck workflows
const { Client } = require('@temporalio/client');
const client = new Client({ address: 'localhost:7233' });

async function resetStuckWorkflows() {
  const executions = await client.workflow.list().toArray();

  for (const exec of executions) {
    if (exec.status === 'RUNNING' && exec.startTime < Date.now() - 30 * 60 * 1000) {
      console.log(`Terminating stuck workflow: ${exec.workflowId}`);
      await client.workflow.getHandle(exec.workflowId).terminate('Stuck > 30 min');
    }
  }
}

resetStuckWorkflows();
```

### Long-term Fix (Prevent Recurrence)

After service is restored, implement permanent fix:

1. **Update monitoring:** Add better alerts for early detection
2. **Fix root cause:** [Specific code/config change needed]
3. **Add retry logic:** Implement exponential backoff for Temporal connections
4. **Update runbook:** Document lessons learned

## Verification

Confirm the issue is fully resolved:

### Service Health Checks

```bash
# Check all services are healthy
curl http://localhost:3000/health
# Expected: {"status":"healthy","checks":{"temporal":"ok","database":"ok"}}

# Check API endpoints
curl http://localhost:3000/api/chat -X POST -H "Content-Type: application/json" -d '{"message":"test"}'
# Expected: 200 OK with response

# Check worker is processing workflows
curl http://localhost:3000/api/admin/workflows
# Expected: List of active workflows
```

### Monitoring Dashboards

- [ ] Grafana: Error rate < 1% for 10 minutes
- [ ] Grafana: Workflow completion time < 30 seconds
- [ ] Logs: No ERROR messages for 5 minutes
- [ ] Alerts: All alerts cleared

### User Impact Verification

- [ ] Test chat functionality end-to-end
- [ ] Verify no data loss occurred
- [ ] Check user-facing dashboards show normal operation

## Escalation

### When to Escalate

Escalate if:
- Issue persists after following all resolution steps
- More than 50% of users affected for > 15 minutes
- Data loss or corruption suspected
- Security breach suspected

### Who to Contact

| Role | Name | Contact | When to Contact |
|------|------|---------|-----------------|
| On-call Engineer | [Name] | Slack: @oncall | First escalation |
| Backend Lead | [Name] | Slack: @backend-lead | If code changes needed |
| DevOps Engineer | [Name] | Slack: @devops | Infrastructure issues |
| Tech Lead | [Name] | Phone: [number] | Critical decisions |
| CTO | [Name] | Phone: [number] | Business-critical outages |

### Escalation Path

1. **T+0 min:** Issue detected, on-call engineer starts diagnosis
2. **T+15 min:** If not resolved, notify Backend Lead and DevOps
3. **T+30 min:** If not resolved, notify Tech Lead
4. **T+60 min:** If not resolved, notify CTO and initiate incident response

## Post-mortem

After incident is resolved, complete post-mortem within 48 hours:

**Template:** `docs/templates/POSTMORTEM_TEMPLATE.md`

**Key questions to answer:**
1. What happened? (Timeline of events)
2. What was the impact? (Users affected, duration)
3. What was the root cause?
4. How was it fixed?
5. What can we do to prevent recurrence?
6. What went well in our response?
7. What could have gone better?

**Action items:**
- [ ] Action item 1 (Owner: [Name], Due: [Date])
- [ ] Action item 2 (Owner: [Name], Due: [Date])

## Related Documents

- [ARCHITECTURE_OVERVIEW_V2_3.md](../02_architecture/ARCHITECTURE_OVERVIEW_V2_3.md)
- [SPEC-009: Durable Runtime](../04_specs/SPEC-009-DURABLE_RUNTIME.md)
- [THREAT_MODEL.md](../08_security/THREAT_MODEL.md)

## Appendix

### Useful Commands

```bash
# View recent workflow executions
temporal workflow list --namespace default

# Get workflow execution details
temporal workflow describe --workflow-id [workflow-id]

# Replay workflow for debugging
temporal workflow reset --workflow-id [workflow-id] --event-id [event-id]

# View Temporal server logs
docker logs temporal-server --tail 100 --follow
```

### Configuration Reference

```javascript
// Expected Temporal configuration in .env
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=chatavg-tasks
TEMPORAL_WORKFLOW_EXECUTION_TIMEOUT=3600000  // 1 hour
TEMPORAL_WORKFLOW_TASK_TIMEOUT=10000         // 10 seconds
```

### Known Issues

| Issue | Symptoms | Workaround | Permanent Fix |
|-------|----------|------------|---------------|
| Temporal connection timeout | Workflows stuck | Restart worker | Increase timeout in config |
| Database lock | Writes fail | Kill old processes | Optimize queries |

---

*This runbook should be tested quarterly. Last test date: [YYYY-MM-DD]*
*If any steps are outdated, update immediately and notify the team.*
