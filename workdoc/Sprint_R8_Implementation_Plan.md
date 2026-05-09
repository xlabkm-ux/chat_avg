# Implementation Plan — Sprint R8: QA, Observability and Release Readiness

This plan outlines the final steps to move ChatAVG v2.3 to a production-ready state by replacing placeholders with real metrics, expanding observability, validating system resilience, and finalizing release documentation.

## 1. Trace Bus Expansion (Observability Hardening)
Inject missing trace events to ensure full visibility into the execution path.

- **Semantic Layer**:
    - `semantic.claim_created`
    - `semantic.claim_downgraded`
    - `semantic.authority_blocked`
- **Cost Service**:
    - `cost.estimated`
    - `cost.recorded`
- **Model Gateway**:
    - `model.failed` (add explicitly if missing)

## 2. Dashboard Refinement
Transition from hardcoded placeholders to dynamic data.

- Update `/api/admin/dashboard/mvp` to:
    - Read `rag_quality_score` and `semantic_quality_score` from `EVALS_REPORT.json`.
    - Ensure `MetricsService` and `SandboxManager` provide the most accurate real-time data.
    - Add a fallback mechanism for missing eval reports.

## 3. QA & Validation (Load/Chaos Testing)
Execute existing harnesses and document results.

- **Load Testing**:
    - Run `LoadHarness` with high concurrency.
    - Verify `MetricsService` correctly captures P95 latency and error rates under load.
- **Chaos Testing**:
    - Run `ChaosHarness` to simulate provider timeouts and worker restarts.
    - Verify `TraceBus` captures failures and the system recovers (Temporal persistence).

## 4. Release Readiness Package
Generate official documentation for the Release Candidate.

- `SPEC-024: Release Candidate Checklist`
- `RUNBOOK-003: Rollback Procedures`
- `EVALS_REPORT.json`: Generate a fresh evaluation report.
- `SECURITY_REVIEW.md`: Document the route security matrix and sandbox egress policy.

---

## Task List

### Phase 1: Observability Hardening
- [ ] Update `src/modules/semantic/semantic.protocol.js` to emit traces.
- [ ] Update `src/modules/execution/cost.service.js` to emit traces.
- [ ] Update `src/modules/chat/model.gateway.js` to emit `model.failed` trace.

### Phase 2: Dashboard & Metrics
- [ ] Refine `/api/admin/dashboard/mvp` in `src/modules/admin/admin.routes.js`.
- [ ] Create `dev_studio/generate_eval_report.js` to create `EVALS_REPORT.json` from test results.

### Phase 3: QA Execution
- [ ] Run `npm run test:load`.
- [ ] Run `npm run test:chaos`.
- [ ] Verify results in `EVALS_REPORT.json` and dashboard.

### Phase 4: Release Docs
- [ ] Create `docs/04_specs/SPEC-024-RELEASE_CHECKLIST.md`.
- [ ] Create `docs/09_runbooks/RUNBOOK-003-ROLLBACK.md`.
- [ ] Update `RELEASE_BLOCKERS.md` (check off RB-007).

---

## Testing Gate
- `node verify_dashboard.js` must pass.
- `EVALS_REPORT.json` must be present and contain non-placeholder values.
- All R8 deliverables present in the `docs` directory.
