# Стратегия тестирования ChatAVG v2.3

**ID:** QA-01  
**Версия:** 1.0  
**Статус:** Active  
**Владелец:** QA Lead  
**Reviewers:** Tech Lead, Architect, Security Lead  
**Последнее обновление:** 7 мая 2026  
**Источники:** SRC-01 (v2.3 Delivery Plan), SRC-02 (Technical Concept), SRC-03 (Backlog/ADR)  
**Следующий review:** Sprint 2 Gate

---

## 1. Введение

Стратегия определяет **уровни тестирования**, **инструменты**, **ответственных** и **критерии прохождения** (gates) для платформы ChatAVG v2.3. Цель — обеспечить доказуемое качество на каждом спринте без замедления Fast Path и без регрессий V1-функционала.

### Принципы
1. **Shift-left**: Максимум проверок происходит на уровне Unit/Integration до merge в `main`.  
2. **Детерминизм**: Тесты не зависят от реальных LLM-провайдеров (используются моки/синтетические провайдеры).  
3. **Контрактность**: Каждый публичный интерфейс (API, Event, Schema) покрыт контрактным тестом.  
4. **Fail-fast**: CI блокирует merge при любом сломанном тесте, пороге покрытия или security-нарушении.
5. **Regression baseline**: Существующий V1-функционал (см. `REGRESSION_BASELINE.md`) защищён и проверяется в каждом CI-запуске.

---

## 2. Уровни тестирования

### 2.1. Unit-тесты
- **Область:** Чистые функции, утилиты, валидаторы, error classes, policy logic.
- **Инструмент:** `node:test` (встроенный Node.js test runner).
- **Требование к покрытию:** ≥ 80% строк для core modules (`src/core/*`).
- **Запуск:** `npm test` → `node --test tests/*.test.js`.
- **Ответственный:** Разработчик модуля.

### 2.2. Integration-тесты
- **Область:** HTTP-эндпоинты через `supertest`, middleware chains, DB-операции.
- **Инструмент:** `node:test` + `supertest`.
- **Среда:** SQLite `data_test/` (изолированная от production).
- **Фикстуры:** `tests/fixtures/*.json`, загрузка через `tests/setup_fixtures.js`.
- **Ответственный:** QA + Backend.

### 2.3. Contract-тесты
- **Область:** CanonicalChatEvent, ProviderEvents, API response schemas, Error contract.
- **Подход:** Проверка, что ответы эндпоинтов соответствуют Zod-схемам из `04_specs/`.
- **Инструмент:** Zod assertions в `node:test`.
- **Ответственный:** Backend + QA.
- **Документ:** `CONTRACT_TEST_PLAN.md` (QA-03).

### 2.4. Security-тесты
- **Область:** CORS, payload limits, prompt injection, auth bypass, SSRF vectors.
- **Инструмент:** `supertest` + custom payloads из `tests/fixtures/security_payloads.json`.
- **Существующие:** `baseline_security.test.js`, `security.test.js`.
- **Документ:** `SECURITY_TEST_PLAN.md` (QA-05) — дополняется по итогам Sprint 1-8.
- **Ответственный:** Security + QA.

### 2.5. E2E-тесты (End-to-End)
- **Область:** Full user flows — login → chat → stream → session save → admin.
- **Инструмент:** `supertest` (API E2E) + browser-based (Playwright, Sprint 9+).
- **Среда:** Локальный сервер с test DB и синтетическим провайдером.
- **Ответственный:** QA.

### 2.6. RAG Evaluation (Sprint 10+)
- **Область:** Context precision, recall, citation correctness, hallucination rate.
- **Документ:** `RAG_EVAL_PLAN.md` (QA-08).
- **Ответственный:** ML + QA.

### 2.7. Semantic Evaluation (Sprint 5 seed, Sprint 11 full)
- **Область:** Claim extraction, domain boundaries, hidden authority, role discipline.
- **Документ:** `SEMANTIC_EVAL_PLAN.md` (QA-09).
- **Ответственный:** Semantic Lead + QA.

### 2.8. Load / Chaos (Sprint 15)
- **Область:** P50/P95/P99, concurrent chats, provider timeout, Temporal worker restart.
- **Документы:** `PERFORMANCE_LOAD_TEST_PLAN.md` (QA-06), `CHAOS_TEST_PLAN.md` (QA-07).
- **Ответственный:** SRE + QA.

---

## 3. Тестовая инфраструктура

### Среда исполнения
| Параметр | Значение |
|---|---|
| Runtime | Node.js ≥ 20.x |
| Test runner | `node:test` (native) |
| HTTP testing | `supertest` (dev dependency) |
| DB (test) | SQLite, каталог `data_test/` |
| Env trigger | `NODE_ENV=test` |

### Синтетические провайдеры и моки
Для детерминированных тестов без внешних API-зависимостей используется **DeterministicProvider** — синтетический адаптер, возвращающий предсказуемые `ProviderEvents`.

Подробнее: `MOCKS_AND_SYNTHETIC_PROVIDERS.md` (DEV-07).

### Фикстуры данных
Стандартные наборы тестовых пользователей, сессий и категорий.  
Подробнее: `TEST_DATA_FIXTURES.md` (QA-11).

---

## 4. CI/CD Pipeline (тестовые gates)

```
PR → [lint] → [unit tests] → [integration tests] → [security tests] → [coverage check] → ✅ Merge
                                                                                            ↓
Nightly → [E2E regression] → [contract tests] → [report]
                                                                                            ↓
Release → [full regression] → [load test] → [security scan] → [sign-off] → ✅ Deploy
```

### Gate: PR Merge
- Все unit/integration/security тесты green.
- Coverage ≥ 80% для изменённых файлов.
- Нет `CRITICAL`/`HIGH` из security scan.

### Gate: Sprint Close
- Regression baseline (REGRESSION_BASELINE.md) не сломлена.
- Новые фичи покрыты тестами на уровне ≥ 80%.
- Обновлены: PROJECT_BACKLOG, PROJECT_MAP, TEST_MATRIX.

### Gate: MVP / Beta / RC
- См. `RELEASE_GATES_AND_DOD.md` (QA-12).

---

## 5. Метрики качества

| Метрика | Целевое значение | Измерение |
|---|---|---|
| Unit test coverage (core) | ≥ 80% | CI report |
| Integration test pass rate | 100% | CI |
| TTFT regression (Fast Path) | < 1.5s | Nightly perf test |
| Security vulnerabilities (HIGH/CRIT) | 0 | npm audit + custom |
| Contract violations | 0 | Contract tests |
| RAG accuracy (Sprint 10+) | ≥ 85% | Eval pipeline |

---

## 6. Связанные документы

| ID | Документ | Статус |
|---|---|---|
| QA-02 | TEST_MATRIX.md | Active |
| QA-03 | CONTRACT_TEST_PLAN.md | Planned (Sprint 2) |
| QA-04 | REGRESSION_BASELINE.md | Active |
| QA-05 | SECURITY_TEST_PLAN.md | Planned (Sprint 1-8) |
| QA-11 | TEST_DATA_FIXTURES.md | Active |
| QA-12 | RELEASE_GATES_AND_DOD.md | Active |
| DEV-07 | MOCKS_AND_SYNTHETIC_PROVIDERS.md | Active |
| SPEC-014 | ERROR_CONTRACT.md | Active |
