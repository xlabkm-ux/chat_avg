# Матрица тестирования (Test Matrix)

**ID:** QA-02  
**Версия:** 1.0  
**Статус:** Active  
**Владелец:** QA Lead  
**Reviewers:** Tech Lead, Backend Lead, Security Lead  
**Последнее обновление:** 7 мая 2026  
**Следующий review:** Sprint 2 Gate

---

## 1. Компонент × Уровень тестов

| Компонент | Unit | Integration | Contract | Security | E2E | Load | Owner | CI Job | Coverage Target |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|---|---|
| **src/core/config.js** | ✅ | — | — | ✅ | — | — | Backend | PR | 90% |
| **src/core/errors.js** | ✅ | — | ✅ | — | — | — | Backend | PR | 90% |
| **src/core/crypto.js** | ✅ | — | — | ✅ | — | — | Security | PR | 95% |
| **src/core/sqlite.js** | ✅ | ✅ | — | — | — | — | Backend | PR | 80% |
| **src/core/utils.js** | ✅ | — | — | ✅ | — | — | Backend | PR | 90% |
| **src/core/providers.config.js** | ✅ | — | — | ✅ | — | — | Backend | PR | 80% |
| **auth.middleware.js** | ✅ | ✅ | — | ✅ | — | — | Security | PR | 90% |
| **auth.routes.js** | — | ✅ | ✅ | ✅ | ✅ | — | Backend | PR | 85% |
| **users.routes.js** | — | ✅ | ✅ | ✅ | ✅ | — | Backend | PR | 85% |
| **admin.routes.js** | — | ✅ | ✅ | ✅ | ✅ | — | Backend | PR | 80% |
| **chat.routes.js** | — | ✅ | ✅ | ✅ | ✅ | ✅ | Backend | PR + Nightly | 80% |
| **chat.service.js** | ✅ | ✅ | ✅ | — | ✅ | ✅ | Backend | PR + Nightly | 80% |
| **session.repository.js** | ✅ | ✅ | — | — | ✅ | — | Backend | PR | 85% |
| **sessions.routes.js** | — | ✅ | ✅ | ✅ | ✅ | — | Backend | PR | 80% |
| **category.repository.js** | ✅ | ✅ | — | — | — | — | Backend | PR | 85% |
| **user.repository.js** | ✅ | ✅ | — | — | — | — | Backend | PR | 85% |
| **audit.service.js** | ✅ | ✅ | — | — | — | — | Backend | PR | 80% |
| **base.provider.js** | ✅ | — | ✅ | — | — | — | Backend | PR | 80% |
| **openai_compat.js** | ✅ | ✅ | ✅ | — | — | ✅ | Backend | PR | 75% |
| **openai_responses_compat.js** | ✅ | ✅ | ✅ | — | — | ✅ | Backend | PR | 75% |
| **llamacpp.js** | ✅ | ✅ | ✅ | — | — | ✅ | Backend | PR | 75% |
| **google.js** | ✅ | ✅ | ✅ | — | — | — | Backend | PR | 75% |
| **grok.js** | ✅ | ✅ | ✅ | — | — | — | Backend | PR | 75% |
| **mcp.js** | ✅ | ✅ | ✅ | ✅ | — | — | Backend | PR | 75% |
| **provider.factory.js** | ✅ | ✅ | — | — | — | — | Backend | PR | 85% |
| **providerEvents.js** | ✅ | — | ✅ | — | — | — | Backend | PR | 100% |
| **providerErrors.js** | ✅ | — | ✅ | — | — | — | Backend | PR | 100% |
| **policyRouter.js** | ✅ | ✅ | — | — | — | — | Backend | PR | 80% |
| **fallbackPolicy.js** | ✅ | ✅ | — | — | — | — | Backend | PR | 80% |
| **providers.routes.js** | — | ✅ | ✅ | ✅ | — | — | Backend | PR | 75% |
| **server.js** (main) | — | ✅ | — | ✅ | ✅ | ✅ | Backend | PR + Nightly | 70% |
| **MCP Gateway** | — | ✅ | ✅ | ✅ | ✅ | — | Backend | PR | 75% |

---

## 2. Существующие тест-файлы

| Тест-файл | Тип | Покрываемые компоненты | Статус |
|---|---|---|---|
| `api.test.js` | Integration | auth, users, sessions, admin | ✅ Active |
| `baseline_security.test.js` | Security | CORS, payload limit, API fallback, static | ✅ Active |
| `health.test.js` | Integration | provider health endpoint | ✅ Active |
| `security.test.js` | Unit + Security | sanitizePromptText, prompt injection | ✅ Active |

---

## 3. Тесты, требующие создания (Sprint 1-2)

| Приоритет | Файл | Тип | Область |
|---|---|---|---|
| P0 | `config.test.js` | Unit | Валидация Zod-схемы env, defaults, fail-fast |
| P0 | `errors.test.js` | Unit + Contract | Error classes, errorHandler format, SPEC-014 |
| P0 | `provider_events.test.js` | Unit + Contract | ProviderEvents contract (delta, done, error, tool_call) |
| P0 | `deterministic_provider.test.js` | Unit | DeterministicProvider (mock) |
| P1 | `crypto.test.js` | Unit | AES-256-GCM encrypt/decrypt round-trip |
| P1 | `chat_service.test.js` | Integration | ChatService с DeterministicProvider |
| P1 | `category_repository.test.js` | Integration | CRUD categories |
| P1 | `session_repository.test.js` | Integration | CRUD sessions |
| P2 | `fallback_policy.test.js` | Unit | Retry/fallback logic |
| P2 | `policy_router.test.js` | Unit + Integration | Provider routing |

---

## 4. Release Gate: Какие тесты блокируют выход

| Gate | Обязательные тестовые уровни |
|---|---|
| **PR Merge** | Unit ✅, Integration ✅, Security (baseline) ✅ |
| **Sprint Close** | + Regression Baseline ✅, Contract ✅ |
| **MVP (Sprint 9)** | + E2E ✅, Full Security ✅ |
| **Beta** | + RAG Eval ✅, Semantic Eval ✅, Load (baseline) ✅ |
| **RC** | + Chaos ✅, Full Load ✅, Security Sign-off ✅ |
