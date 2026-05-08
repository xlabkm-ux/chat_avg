# Release Candidate Checklist (SPEC-024)

## 1. Security Baseline
- [ ] CHATAVG_ADMIN_PASSWORD is set in production.
- [ ] LocalAdapter is prohibited in production.
- [ ] Route-level security (policyGuard) is applied to all sensitive endpoints.
- [ ] RedactionService masks all keys and tokens in audit logs.
- [ ] Egress policy blocks all non-allowlisted outbound traffic from sandboxes.

## 2. Observability & Performance
- [ ] MetricsService provides P50/P95/P99 latency data.
- [ ] TraceBus captures all major execution events (model, retrieval, tool, sandbox).
- [ ] MVP Dashboard displays real data (no placeholders).
- [ ] TTFT P95 is below 200ms for fast-path chats.

## 3. Reliability & Durability
- [ ] AgentRun state machine enforces valid transitions.
- [ ] Temporal workflows handle approval pauses and worker restarts.
- [ ] SQLite migrations (1-11) are applied.
- [ ] Idempotency keys are required for side-effect tools.

## 4. Quality & Evaluation
- [ ] Semantic Eval accuracy is above 80% (v0.2).
- [ ] RAG citation contract is enforced.
- [ ] Answerability policy handles empty retrieval results.

## 5. Deployment & Operations
- [ ] Rollback Runbook is verified.
- [ ] Backup/Restore procedure is documented.
- [ ] Load and Chaos testing reports are generated and signed off.
