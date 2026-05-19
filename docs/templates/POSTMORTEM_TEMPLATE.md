---
id: POSTMORTEM-XXX
title: Incident Post-mortem [YYYY-MM-DD]
date_of_incident: YYYY-MM-DD
severity: P0 | P1 | P2
author: [Name]
status: Draft | Reviewed | Completed
---

# POSTMORTEM-XXX: [Brief Incident Title]

**Date of Incident:** YYYY-MM-DD
**Duration:** [Start time] to [End time] ([X hours Y minutes])
**Severity:** P0 (Critical) | P1 (High) | P2 (Medium)
**Author:** [Name]
**Status:** Draft | Reviewed | Completed

## Executive Summary

Brief (2-3 sentence) summary of what happened, the impact, and the root cause.

**Example:**
```
On 2026-05-19, ChatAVG experienced a 45-minute outage affecting all users.
The root cause was a memory leak in the Temporal worker that caused it to crash.
Service was restored by restarting the worker and deploying a fix for the memory leak.
```

## Impact

**Duration:** [X hours Y minutes]

**User Impact:**
- Percentage of users affected: [X%]
- Number of failed requests: [count]
- User complaints received: [count]

**Business Impact:**
- Revenue loss (if applicable): $[amount]
- SLA violations: [yes/no, details]
- Customer escalations: [count]

**Technical Impact:**
- Services affected: [list services]
- Data loss: [yes/no, describe]
- Cascading failures: [yes/no, describe]

## Timeline

All times in [timezone]:

| Time | Event | Detected By |
|------|-------|-------------|
| HH:MM | Issue began (root cause triggered) | - |
| HH:MM | First alert fired | Monitoring |
| HH:MM | On-call engineer acknowledged | [Name] |
| HH:MM | Diagnosis began | [Name] |
| HH:MM | Mitigation attempted (describe) | [Name] |
| HH:MM | Mitigation failed, escalated | [Name] |
| HH:MM | Second mitigation attempted | [Name] |
| HH:MM | Service partially restored | Monitoring |
| HH:MM | Full service restored | Monitoring |
| HH:MM | All alerts cleared | Monitoring |

## Root Cause Analysis

### What was the root cause?

Detailed technical explanation of what went wrong.

**Example:**
```
A memory leak in the claim extraction logic caused the Temporal worker to consume
increasing amounts of RAM over time. The leak occurred because extracted claims were
being cached in memory without any eviction policy. After ~6 hours of operation, the
worker process exceeded its 512MB memory limit and was killed by the OS OOM killer.
```

### Why did it happen?

Use "5 Whys" technique to drill down:

1. **Why did the service go down?**
   - Temporal worker crashed

2. **Why did the Temporal worker crash?**
   - Out of memory (OOM)

3. **Why did it run out of memory?**
   - Memory leak in claim extraction cache

4. **Why was there a memory leak?**
   - Cache had no size limit or eviction policy

5. **Why was there no size limit?**
   - Code review missed this issue; no memory usage monitoring in place

### Contributing Factors

- **Code quality:** Missing input validation and resource limits
- **Monitoring:** No alerts for memory usage trends
- **Testing:** Load tests didn't run long enough to catch memory leaks
- **Documentation:** No guidance on cache size limits in coding standards

## Resolution

### How was it fixed?

**Immediate mitigation:**
```bash
# Restarted Temporal worker
pkill -f "npm run worker"
cd cons/chatavg && npm run worker &
```

**Permanent fix:**
- Added LRU cache with 10,000 item limit to claim extractor
- Implemented memory usage monitoring and alerts
- Added memory leak detection to CI test suite

**Code changes:**
- PR #[number]: Add cache eviction to adequacyEngine.js
- PR #[number]: Add memory monitoring to worker health check

## Lessons Learned

### What went well?

- Alert system detected the issue quickly (within 2 minutes)
- On-call engineer responded within 5 minutes
- Runbook provided clear steps for diagnosis
- Team communication was effective during incident

### What went wrong?

- No monitoring for memory usage trends (only absolute thresholds)
- Runbook didn't cover memory-related issues
- Took 15 minutes to identify root cause (could be faster with better tooling)
- No automated rollback mechanism

### Where did we get lucky?

- Issue occurred during low-traffic period (would have been worse at peak)
- Engineer who wrote the buggy code was on-call and knew exactly where to look
- No data corruption occurred (could have if crash happened during write)

## Action Items

| ID | Action | Owner | Priority | Due Date | Status |
|----|--------|-------|----------|----------|--------|
| 1 | Add memory usage monitoring to Grafana dashboard | [Name] | High | YYYY-MM-DD | In Progress |
| 2 | Implement LRU cache with size limits | [Name] | High | YYYY-MM-DD | Completed |
| 3 | Update runbooks with memory troubleshooting section | [Name] | Medium | YYYY-MM-DD | Not Started |
| 4 | Add memory leak detection to CI test suite | [Name] | Medium | YYYY-MM-DD | Not Started |
| 5 | Conduct load testing with 24+ hour duration | [Name] | Low | YYYY-MM-DD | Not Started |
| 6 | Add memory usage guidelines to coding standards | [Name] | Low | YYYY-MM-DD | Not Started |

**Tracking:** All action items should be tracked in [project management tool] with labels `postmortem` and `POSTMORTEM-XXX`.

## Prevention

### How can we prevent this from happening again?

**Short-term (1-2 weeks):**
- Implement cache size limits across all services
- Add memory monitoring alerts
- Update coding standards

**Medium-term (1-2 months):**
- Implement automated performance regression testing
- Add chaos engineering experiments for memory pressure scenarios
- Create memory profiling runbook

**Long-term (3-6 months):**
- Migrate to containerized deployment with automatic memory limits
- Implement circuit breakers for resource exhaustion scenarios
- Build self-healing infrastructure

## Supporting Evidence

### Graphs and Charts

*[Insert graphs showing:]*
- Memory usage over time (showing the leak)
- Request error rate during incident
- Response time degradation

### Logs

Key log entries that show the issue:

```
2026-05-19T10:15:23Z ERROR adequacyEngine: Claim cache size: 50000 items (growing)
2026-05-19T10:30:45Z WARN worker: Memory usage: 480MB/512MB (93%)
2026-05-19T10:32:12Z ERROR worker: Memory usage: 510MB/512MB (99%) - CRITICAL
2026-05-19T10:33:01Z FATAL worker: Process killed by OOM killer
```

### Configuration

Relevant configuration at time of incident:

```javascript
// Before fix: No cache limit
const claimCache = new Map();

// After fix: LRU cache with limit
const claimCache = new LRUCache({ max: 10000 });
```

## References

- [RUNBOOK_COMMON_ISSUES.md](../09_ops/RUNBOOK_COMMON_ISSUES.md)
- [THREAT_MODEL.md](../08_security/THREAT_MODEL.md)
- Link to monitoring dashboard: [URL]
- Link to incident recording (if call was recorded): [URL]
- Related GitHub issues: #[numbers]
- Related PRs: #[numbers]

## Appendix

### Team Members Involved

- [Name] - On-call engineer, first responder
- [Name] - Backend engineer, implemented fix
- [Name] - DevOps engineer, assisted with deployment
- [Name] - Tech lead, escalation point

### Communication Log

Key communications during incident:

```
10:35 AM - Posted in #chatavg-help: "Investigating Temporal worker crash"
10:42 AM - Updated: "Root cause identified as memory leak, working on fix"
10:55 AM - Updated: "Fix deployed, monitoring for stability"
11:00 AM - Posted: "Service fully restored, will conduct post-mortem"
```

### Cost Analysis

- Engineering time spent: [X] hours × [Y] engineers = [Z] engineer-hours
- Infrastructure cost during incident: $[amount] (if applicable)
- Estimated revenue impact: $[amount] (if applicable)

---

*This post-mortem was completed within 48 hours of incident resolution.*
*Review meeting scheduled for [YYYY-MM-DD].*
*Next steps: Schedule follow-up to verify action items are complete.*
