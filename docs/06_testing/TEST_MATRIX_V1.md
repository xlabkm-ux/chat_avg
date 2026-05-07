# Test Matrix v1

**Version:** 1.0  
**Sprint:** 1 (Regression Baseline & Environment)  
**Date:** 2026-05-07  

## Test Levels

| Level | Scripts | Trigger | Blocking |
|---|---|---|---|
| Unit | `npm run test:unit` | PR | Blocks PR merge |
| Contract | `npm run test:contract` | PR | Blocks PR merge |
| Security (smoke) | `npm run test:security:smoke` | PR | Blocks PR merge |
| Security (full) | `npm run test:security` | PR + nightly | Blocks release |
| Integration (smoke) | `npm run test:integration:smoke` | PR | Blocks merge |
| Integration (full) | `npm run test:integration` | Nightly | Blocks release branch |
| Semantic eval (smoke) | `npm run eval:semantic:smoke` | PR | Blocks merge |
| Semantic eval (full) | `npm run eval:semantic` | Nightly | Blocks MVP/RC |
| Latency baseline | `npm run test:latency` | Nightly | Advisory |
| Full suite | `npm run test:nightly` | Nightly | Reference |

## CI Pipeline Commands

### PR Pipeline
```bash
npm run test:unit
npm run test:contract
npm run test:security:smoke
npm run test:integration:smoke
npm run eval:semantic:smoke
```

### Nightly Pipeline
```bash
npm run test:nightly
npm run test:latency
```

### Release Pipeline
```bash
npm run test:release
npm run test:latency
# + manual visual UI gate
# + rollback dry-run
```

## Test File Inventory

| File | Level | What it tests |
|---|---|---|
| `provider_events.test.js` | Unit | CanonicalChatEvent factory functions |
| `errors.test.js` | Unit | Error handler, AppError class |
| `deterministic_provider.test.js` | Unit | Synthetic provider modes |
| `contract_canonical_event.test.js` | Contract | AsyncIterable semantics, event ordering |
| `fast_path_guardrail.test.js` | Contract | No sandbox/RAG in simple chat path |
| `security.test.js` | Security | Prompt sanitization, system message filter |
| `security_assertions.test.js` | Security | SSRF, CORS, JSON limit, injection tokens |
| `baseline_security.test.js` | Security | CORS enforcement, payload limit, 404 fallback |
| `api.test.js` | Integration | Auth, sessions, admin CRUD |
| `health.test.js` | Integration | Health endpoints, readiness check |
| `latency_baseline.test.js` | Performance | P50/P95/P99 latency, TTFT |
| `semantic/claim_extraction.test.js` | Semantic | Claim type/strength extraction |
| `semantic/domain_boundary.test.js` | Semantic | Domain boundary detection/downgrade |
| `semantic/semantic.eval.js` | Semantic | Golden set evaluation runner |

## Fixtures

| File | Purpose |
|---|---|
| `fixtures/users.json` | Test user accounts (admin, consultant) |
| `fixtures/categories.json` | Category settings for providers |
| `fixtures/sessions.json` | Pre-populated chat sessions |
| `mocks/deterministic_provider.js` | Synthetic provider (latency, errors, chunks) |

## Quality Thresholds

| Metric | Current | MVP Target | RC Target |
|---|---|---|---|
| Fast path TTFT P95 (synthetic) | < 20ms | No regression | No regression |
| Simple chat no sandbox guardrail | 100% | 100% | 100% |
| Claim extraction accuracy | 100% (34 cases) | ≥ 85% (50+ cases) | ≥ 90% |
| DomainBoundary detection | 100% | ≥ 80% | ≥ 90% |
| No hidden authority violations | 0 | 0 | 0 |
| Security assertion pass rate | 100% | 100% | 100% |
