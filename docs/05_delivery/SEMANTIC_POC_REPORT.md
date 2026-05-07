# Semantic Protocol PoC — Sprint 5 Report

**ID:** REPORT-S5 | **Версия:** 1.0 | **Статус:** ✅ Complete  
**Sprint:** 5 — Semantic Protocol Proof-of-Concept  
**Gate:** C — USP Viability Gate  
**Дата:** 7 мая 2026

---

## 1. Executive Summary

Sprint 5 успешно завершён. Реализован Proof-of-Concept смыслового слоя (ER Meaning Layer), включающий:
- **Claim Extraction Pipeline** — извлечение утверждений из текста с классификацией по типу, силе и уровню реальности
- **Domain Boundary Engine** — 5 предопределённых границ с автоматическим strength downgrade
- **No Hidden Authority** — блокировка психодиагностики и скрытого авторитета
- **Semantic Eval Golden Set** — 34 тестовых кейса с **100% accuracy**

Все результаты подтверждают жизнеспособность USP: система стабильно извлекает claims, понижает силу утверждений за пределами области определения и блокирует скрытый авторитет.

---

## 2. Deliverables

| # | Deliverable | Статус | Файл(ы) |
|---|------------|:------:|---------|
| 1 | ADR-005 Semantic Shift-Left | ✅ | `docs/03_adr/ADR-005-semantic-shift-left.md` |
| 2 | SPEC-004 SemanticProtocol v0 | ✅ | `docs/04_specs/SPEC-004-SEMANTIC_PROTOCOL.md` |
| 3 | SPEC-005 Claim/DomainBoundary v0 | ✅ | `docs/04_specs/SPEC-005-CLAIM_DOMAIN_BOUNDARY.md` |
| 4 | SemanticProtocol module | ✅ | `src/modules/semantic/semantic.protocol.js` |
| 5 | ClaimExtractor | ✅ | `src/modules/semantic/claim.extractor.js` |
| 6 | DomainBoundary | ✅ | `src/modules/semantic/domain.boundary.js` |
| 7 | ClaimLedger | ✅ | `src/modules/semantic/claim.ledger.js` |
| 8 | SemanticEvents | ✅ | `src/modules/semantic/semantic.events.js` |
| 9 | Feature Flag (SEMANTIC_LAYER_ENABLED) | ✅ | `src/core/config.js` |
| 10 | ChatService integration | ✅ | `src/modules/chat/chat.service.js` |
| 11 | EVAL-001 Golden Set (34 cases) | ✅ | `tests/semantic/golden_set.json` |
| 12 | Semantic Eval Runner | ✅ | `tests/semantic/semantic.eval.js` |
| 13 | Unit Tests (31 tests) | ✅ | `tests/semantic/claim_extraction.test.js`, `tests/semantic/domain_boundary.test.js` |

---

## 3. Testing Gate Results

| Критерий | Target | Результат | Статус |
|----------|--------|-----------|:------:|
| Semantic golden tests accuracy | ≥ 80% | **100%** (34/34) | ✅ |
| Boundary downgrade detection | ≥ 80% | **100%** | ✅ |
| No hidden authority violations | 0 | **0** (all blocked) | ✅ |
| No psychodiagnosis violations | 0 | **0** (all blocked) | ✅ |
| Unit tests passing | 100% | **31/31** | ✅ |
| Regression tests (existing) | 100% | **21/21** | ✅ |

---

## 4. Architecture

```
src/modules/semantic/
├── semantic.protocol.js    ← Orchestrator: extract → boundary → ledger
├── claim.extractor.js      ← Rule-based sentence → Claim pipeline
├── claim.ledger.js         ← In-memory claim registry (Map per session)
├── domain.boundary.js      ← 5 boundary domains + strength downgrade
└── semantic.events.js      ← Event type factories
```

### Domain Boundaries Implemented

| Domain | Max Strength | Action |
|--------|:-----------:|--------|
| Medical | `weak_hypothesis` | Downgrade |
| Legal | `weak_hypothesis` | Downgrade |
| Psychological | `question` | **BLOCK** |
| Financial | `weak_hypothesis` | Downgrade |
| Personal/Inner | `question` | **BLOCK** |

### Integration

- Feature flag: `SEMANTIC_LAYER_ENABLED` (default: `false`)
- ChatService: non-streaming responses analyzed with `_semantic` metadata attached
- Zero overhead on Fast Path when disabled
- Lazy-loaded module (no import cost when flag is off)

---

## 5. Known Limitations (PoC)

1. **Rule-based extraction** — pattern matching, not NLP/LLM-as-judge. Sufficient for PoC.
2. **In-memory storage** — no SQLite persistence for claims. Planned for Sprint 6+.
3. **No UI** — backend + logs + tests only. Mission Room UX in Sprint 12.
4. **5 domains** — extensible, but limited coverage. More domains as product needs emerge.
5. **Conservative blocking** — "тревожность" in any context triggers psychological boundary. Acceptable for PoC (err on side of safety).
6. **Streaming path** — semantic analysis only on non-streaming responses. Async post-analysis for streaming in future sprints.

---

## 6. Recommendations for Next Sprints

1. **Sprint 6+**: Persist claims to SQLite, attach to AgentRun.
2. **Sprint 9 (MVP)**: Include semantic PoC in E2E demo.
3. **Sprint 11**: Expand eval dataset to 200+ cases, add LLM-as-judge extraction.
4. **Sprint 12**: Build Mission Room UX to display 3-5 key distinctions.
