# 📋 Центральный бэклог (PROJECT_BACKLOG.md) - ChatAVG v2.3

Текущая стадия: **Sprint 0 — Repo Hygiene and Architecture Lock**

## 🏁 Текущий спринт (Sprint 0)
*Цель: Очистить репозиторий, зафиксировать v2.3 и убрать конфликтующие направления.*

- [x] ✅ Создать структуру документации (`docs/`) — 2026-05-07
- [x] ✅ Подготовить `ARCHITECTURE_OVERVIEW_V2_3.md`, `ADR_INDEX.md`, `GLOSSARY.md` — 2026-05-07
- [x] ✅ Обновить `AGENT_INSTRUCTIONS.md` — 2026-05-07
- [x] ✅ Обновить `.gitignore` (добавить БД и временные файлы) — 2026-05-07
- [x] ✅ Обновить и проверить `PROJECT_MAP.md` (скриптом refresh.js) — 2026-05-07
- [x] ✅ Сформировать `REGRESSION_BASELINE.md` и `THREAT_MODEL.md` — 2026-05-07
- [x] ✅ Подготовить `LOCAL_DEVELOPMENT_SETUP.md` — 2026-05-07
- [ ] 🔲 Настроить базовые Feature Flags в коде

## 🔜 Дорожная карта (Roadmap)

### Sprint 1: Regression Baseline & Environment
- [x] ✅ Настройка базовых тестов и фикстур (Test harness) — 2026-05-07
- [x] ✅ Environment secrets config (правила работы с .env) — 2026-05-07
- [x] ✅ Обновление UI Audit (мобильная верстка, safe-area) — 2026-05-07
      Файлы: `tests/*.test.js`, `server.js`, `docs/07_security/ENVIRONMENT_SECRETS.md`, `UI_AUDIT.md`
      Итог: Исправлены зависания тестов при выполнении через node --test (очистка event loop и закрытие БД/сервера), создана документация для работы с .env, актуализирован UI_AUDIT.md.

### Sprint 2: Fast Path Discipline
- [x] ✅ Зафиксировать `CanonicalChatEvent` (контракт потокового ответа) — 2026-05-07
- [x] ✅ Изолировать "Быстрый путь" чата от тяжелого RAG и песочниц — 2026-05-07
- [x] ✅ Реализовать контракт ошибок (Error Contract) — 2026-05-07
      Файлы: `providerEvents.js`, `providerErrors.js`, `chat.service.js`
      Итог: Реализован строгий интерфейс потоковых событий. Добавлен обход сложных проверок для "быстрого пути". Стандартизирована отправка SSE-ошибок.


### Sprint 3: Model Registry
- [x] ✅ Разработать API динамического списка моделей (`MODEL_REGISTRY_API`)
- [x] ✅ Внедрить проверку "здоровья" (health) AI-провайдеров
      Файлы: `providers.routes.js`, `base.provider.js`, `openai_compat.js`, `openai_responses_compat.js`, `llamacpp.js`, `mcp.js`
      Итог: Реализованы API `/api/providers/:id/models` и `/api/providers/:id/health`. Добавлены методы `getModels` и обновлен `checkHealth` для динамического опроса моделей AI-провайдеров.

### Sprint 4: Model Gateway (LiteLLM Pilot)
- [x] ✅ Развернуть LiteLLM Proxy как основной Model Gateway — 2026-05-07
- [x] ✅ Настроить routing, fallbacks и учет стоимости токенов — 2026-05-07
      Файлы: `cons/litellm_gateway/litellm_config.yaml`, `cons/litellm_gateway/start_proxy.cmd`, `cons/chatavg/src/core/providers.config.js`
      Итог: Развернута конфигурация LiteLLM Proxy, настроена маршрутизация с fallback механизмами и создан стартовый скрипт. Провайдер `litellm` успешно добавлен в ChatAVG.

### Sprint 5: Semantic Protocol PoC (Critical Gate)
- [ ] 🔲 Реализовать `Claim Ledger` (извлечение утверждений)
- [ ] 🔲 Внедрить `Domain Boundary Rules` (границы адекватности)
- [ ] 🔲 Подготовить `Semantic Eval Golden Set` (набор тестов)

### Sprint 6-9: AgentRun, Temporal & MVP Release
- [ ] 🔲 API долгих миссий (AgentRun API)
- [ ] 🔲 Внедрение Temporal для Durable Runtime
- [ ] 🔲 Policy & Cost Control Plane (система одобрений Approval UX)
- [ ] 🔲 Запуск MVP-версии (Fast Chat + AgentRun + Approvals)

### Sprint 10-14: Beta Expansion (Knowledge, Tools, Forge)
- [ ] 🔲 Knowledge Gateway (различные режимы RAG)
- [ ] 🔲 MCP Tool Gateway (реестр версионированных инструментов)
- [ ] 🔲 Hybrid Sandbox / Forge (интеграция E2B для безопасного выполнения кода)
- [ ] 🔲 Role Passes & Artifact Workspace

### Sprint 15-16: Hardening & Release Candidate
- [ ] 🔲 Нагрузочное тестирование (Performance / Chaos testing)
- [ ] 🔲 Дашборды Observability
- [ ] 🔲 Аудит безопасности и Release Candidate (RC)
