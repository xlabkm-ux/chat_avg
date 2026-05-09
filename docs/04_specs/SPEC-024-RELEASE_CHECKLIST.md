# SPEC-024: Release Candidate Checklist (ChatAVG v2.3)

**Status:** Draft / Release Candidate  
**Version:** 1.0  
**Target:** Production Rollout  

This document defines the mandatory verification steps required before the ChatAVG v2.3 system is declared ready for production deployment.

## 1. Security Gates
- [ ] **Fail-closed Sandbox**: Verify that `LocalAdapter` is prohibited in production and system fails boot if `E2B_API_KEY` is missing but sandbox is enabled.
- [ ] **Secure Boot**: Verify `CHATAVG_ADMIN_PASSWORD` requirement in production.
- [ ] **Policy Guard**: Verify all sensitive routes (`/api/admin`, `/api/sandboxes`, `/api/runs`) are protected by `policyGuard`.
- [ ] **Egress Control**: Verify default-deny egress policy in sandboxes.
- [ ] **Secrets Redaction**: Verify that API keys and secrets are masked in audit logs and traces.

## 2. Observability Gates
- [ ] **Metrics Collection**: Verify real-time P95 latency and error rate tracking in `MetricsService`.
- [ ] **Trace Bus**: Verify execution traces for Model, RAG, Tool, and Sandbox actions.
- [ ] **MVP Dashboard**: Verify that the dashboard displays real metrics (not placeholders).
- [ ] **Audit Coverage**: Verify that all security-sensitive actions generate audit logs.

## 3. Reliability & QA Gates
- [ ] **Durable Execution**: Verify that `AgentRun` survives worker restarts (Temporal).
- [ ] **Idempotency**: Verify that side-effect tools require and enforce `idempotencyKey`.
- [ ] **Load Capacity**: Verify system stability under 50+ concurrent events/sec (per `LoadHarness`).
- [ ] **Chaos Resilience**: Verify graceful fallback on provider timeouts or bad gateways.
- [ ] **RAG Quality**: RAG evaluation score ≥ 80%.
- [ ] **Semantic Accuracy**: Semantic evaluation accuracy ≥ 80% (v0.2 baseline).

## 4. Operational Gates
- [ ] **Rollback Plan**: `RUNBOOK-003` is tested and verified.
- [ ] **Migration Path**: `MIGRATION-001` (V1 fallback) is documented.
- [ ] **Runbook Suite**: Runbooks for Temporal, E2B, and LiteLLM recovery are available.

## 5. Sign-off
- [ ] Architecture Sign-off
- [ ] Security Sign-off
- [ ] QA Sign-off
- [ ] Product Sign-off
