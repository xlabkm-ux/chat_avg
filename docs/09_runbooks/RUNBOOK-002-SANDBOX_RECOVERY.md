# RUNBOOK-002 — Sandbox Recovery

**Service:** SandboxManager (E2B / Local)  
**SPEC:** SPEC-019 SandboxManager  
**Sprint:** 15  
**Owner:** Platform / DevOps  
**Date:** 2026-05-07

---

## 1. Overview

This runbook covers operational recovery for the ChatAVG **Sandbox / Forge** subsystem.
The primary adapter is **E2B** (cloud-isolated sandboxes); the **local** adapter is used in dev and as last-resort fallback.

---

## 2. Diagnosing Sandbox Issues

### Check Feature Flag

```bash
# Is SANDBOX_FORGE_ENABLED=true ?
curl -s http://localhost:8200/health | jq .
# All sandbox endpoints return 503 if flag is false
```

### Check Session State

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8200/api/sandboxes/<sandboxId>
```

Expected states: `provisioning | running | frozen | snapshotting | terminating | terminated | quarantined | error`

---

## 3. Recovery Procedures

### 3.1 Sandbox Stuck in `provisioning`

**Cause:** E2B API timeout, missing API key, or network issue.

```bash
# 1. Check E2B connectivity
curl https://api.e2b.dev/v1/health

# 2. Verify E2B_API_KEY is set
echo $E2B_API_KEY  # must not be empty

# 3. Force-quarantine the session (prevents it from blocking the run)
curl -X POST http://localhost:8200/api/sandboxes/<sandboxId>/quarantine \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "STUCK_PROVISIONING"}'

# 4. Cleanup
curl -X DELETE http://localhost:8200/api/sandboxes/<sandboxId> \
  -H "Authorization: Bearer <admin_token>"
```

### 3.2 Sandbox Stuck in `running` (TTL Exceeded)

**Cause:** TTL watchdog didn't fire (process restart?) or session leaked.

The TTL watchdog runs every 30 seconds. After process restart, sessions in the in-memory store are lost.

```bash
# Force terminate via API
curl -X POST http://localhost:8200/api/sandboxes/<sandboxId>/terminate \
  -H "Authorization: Bearer <admin_token>"

# If 404 (session not in memory after restart), cleanup at E2B level:
# Log into E2B dashboard → Sandboxes → Force kill <sandboxId>
```

### 3.3 Quarantined Sandbox — Security Review

**Cause:** Artifact scan detected blocked MIME type or oversized output.

```bash
# 1. Review audit logs for sandbox.quarantine events
curl http://localhost:8200/api/admin/audit?action=sandbox.quarantine \
  -H "Authorization: Bearer <admin_token>"

# 2. Inspect flagged artifacts (check contentHash against blocklist)
# 3. Decide: release → terminate normally, or maintain quarantine
# 4. If false positive — terminate then cleanup
curl -X POST http://localhost:8200/api/sandboxes/<sandboxId>/terminate ...
curl -X DELETE http://localhost:8200/api/sandboxes/<sandboxId> ...
```

### 3.4 Egress Block — Legitimate Request Denied

**Cause:** Domain not on tenant allowlist; or signed URL expired.

**Option A:** Add domain to tenant allowlist (admin config).

**Option B:** Issue a signed URL:

```js
const { EgressPolicy } = require('./src/modules/sandbox/egress.policy');
const ep = new EgressPolicy({ signingSecret: process.env.EGRESS_SIGNING_SECRET });
const signedUrl = ep.sign('https://partner.example.com/data.json', 300_000); // 5 min TTL
console.log(signedUrl);
```

### 3.5 E2B Adapter Unavailable (API Down)

**Cause:** E2B service outage.

```bash
# 1. Unset E2B_API_KEY to force fallback to local adapter
unset E2B_API_KEY  # or set to empty string in .env

# 2. Restart the server
npm run dev

# 3. Monitor: adapter field in /api/sandboxes/<id> should read "local"
```

> ⚠️ **Local adapter provides NO isolation.** Use only as temporary measure.
> Restore E2B as soon as available. File incident in ops channel.

### 3.6 Process Crash — In-Flight Sandbox Sessions

After a server crash, all in-memory session records are lost.
Orphaned E2B sandboxes continue to incur costs until their own TTL expires.

**Recovery:**

```bash
# 1. Log into E2B dashboard
# 2. Filter sandboxes by template (default: 'base')
# 3. Kill any sandboxes older than the configured maxTtlMs (default 5 min)

# 4. For the affected AgentRuns, transition them to 'failed' state:
# (use the AgentRun API — SPEC-006)
curl -X POST http://localhost:8200/api/runs/<runId>/cancel \
  -H "Authorization: Bearer <admin_token>"
```

---

## 4. Monitoring Checklist

| Signal | Source | Threshold |
|--------|--------|-----------|
| `sandbox.ttl_exceeded` events | Audit log | > 5/hour → investigate resource leak |
| `sandbox.egress.denied` events | Audit log | Spike → possible exfiltration attempt |
| `sandbox.quarantine` events | Audit log | Any → immediate security review |
| E2B cost spike | E2B Dashboard | > $X/day → check for runaway sessions |
| Sandbox stuck in `provisioning` > 60s | App logs | Immediate → check E2B API key |

---

## 5. Environment Variables (Sandbox)

| Variable | Default | Purpose |
|----------|---------|---------|
| `SANDBOX_FORGE_ENABLED` | `false` | Master feature flag |
| `E2B_API_KEY` | — | E2B authentication (required for primary adapter) |
| `E2B_TEMPLATE` | `base` | Default E2B environment template |
| `EGRESS_SIGNING_SECRET` | — | HMAC secret for signed URL generation |

---

## 6. Related Resources

- **SPEC-019** — SandboxManager specification
- **SPEC-006** — AgentRun State Machine
- **SPEC-011** — PolicyEngine (risk classes)
- **RUNBOOK-001** — Temporal Recovery
- E2B Dashboard: https://e2b.dev/dashboard
