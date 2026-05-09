# 🎯 ChatAVG v2.3 — Final Release Path

**Версия документа:** 2.0 (2026-05-09)
**Статус:** Активный план — текущий спринт F1
**Контекст:** Система находится в стадии Skeleton/MVP PoC (53 коммита). Завершённые спринты 0–R9 означают архитектурную готовность скелета, но не Production-readiness.

> Все задачи данного плана — только **фиксация в коде после отдельного согласования**. Этот документ — план, а не разрешение на выполнение.

---

## 📊 Общий статус: Что реально работает

| Компонент | Статус | Проблема |
|---|---|---|
| Chat (Fast Path) | ✅ Работает | — |
| Admin UI + Categories | ✅ Работает | — |
| MCP Gateway | ⚠️ Частично | Нет стриминга, теряет tool events |
| openai_prompt_file_search | ⚠️ Частично | Нет web_search, sys-messages теряются |
| openai_responses_compat | 🐛 Баг | Дублирующаяся ветка `reasoning_summary` |
| AgentRun / Temporal | 🚧 Скелет | Activities — моки, нет replay |
| Knowledge Gateway | 🚧 Скелет | Mock-retriever, citations не работают |
| Semantic Protocol | 🚧 Скелет | In-memory, слабая персистентность |
| Sandbox | 🚨 Риск | LocalAdapter → sh -c без guard; policy проверяет пустой operation |
| Streaming close | 🐛 Баг | После `[DONE]` нет `res.end()` — соединение висит |
| State Machine | 🐛 Баг | `requires_action → completed` — нелегальный переход |
| Тестовый контур | ⚠️ Неполный | tests/policy, tests/knowledge и др. не охвачены scripts |
| ROOT package.json | ❌ Отсутствует | Нет точки входа для проекта |
| ROOT README.md | ✅ Создан | — |

---

## 🏁 Sprint F1: Критические баги кода (P0)

> **Цель:** Устранить ошибки, которые приводят к неправильному поведению в runtime прямо сейчас, до начала любого hardening.

### F1.1 — Sandbox: policyGuard проверяет пустой `operation`
**Файл:** `cons/chatavg/src/modules/sandbox/sandbox.routes.js`
**Проблема:** `req.body.operation = 'run'` устанавливается *после* `policyGuard`, поэтому PolicyEngine проверяет пустое значение и может пропустить опасные операции.
**Исправление:** Установить `req.body.operation` в отдельном middleware *перед* `policyGuard` для маршрутов `/run`, `/snapshot`, `/terminate`, `/quarantine`.

### F1.2 — Streaming: соединение зависает после `[DONE]`
**Файлы:** `cons/chatavg/src/modules/chat/chat.service.js`, `cons/chatavg/src/modules/chat/chat.controller.js`
**Проблема:** В `_processHeavyStream` после записи `data: [DONE]` не вызывается `res.end()`. SSE-соединение остаётся открытым до таймаута клиента.
**Исправление:** Добавить `res.end()` в ветку `else` (streaming) после завершения цикла обработки событий.

### F1.3 — AgentRun: нелегальный переход состояний
**Файл:** `cons/chatavg/src/modules/execution/run.service.js`
**Проблема:** `inMemoryExecution()` делает переход `requires_action → completed`. State machine в `run.repository.js` разрешает из `requires_action` только → `['running', 'cancelled']`. Dev-run падает и зависает в состоянии `requires_action`.
**Исправление:** Добавить промежуточный переход `requires_action → running → completed` в `inMemoryExecution`.

### F1.4 — `openai_responses_compat.js`: недостижимая ветка кода
**Файл:** `cons/chatavg/src/modules/providers/adapters/openai_responses_compat.js`
**Проблема:** Дублирующийся `else if (event.type === 'response.reasoning_summary_text.delta')` (строки ~81 и ~95) — вторая ветка никогда не выполнится.
**Исправление:** Удалить дублирующийся блок. Поведение `<think_summary>` должно быть в первой ветке.

### F1.5 — LocalAdapter: выполнение команд через `sh -c` без защиты
**Файл:** `cons/chatavg/src/modules/sandbox/adapters/local.adapter.js`
**Проблема:** `execFile(shell, [flag, command])` выполняет любую строку из `req.body.command` на хост-системе. Совместно с багом F1.1 (пустой `operation`) — критический вектор атаки.
**Исправление:** Добавить env-флаг `ALLOW_LOCAL_COMMAND_EXECUTION=true` как обязательное условие для выполнения команд в LocalAdapter. По умолчанию — отказ с ошибкой.

---

## 🔒 Sprint F2: Безопасность ядра (P0 Security)

> **Цель:** Закрыть критические уязвимости безопасности, не исправленные в F1.

### F2.1 — Secure Admin Boot
**Файл:** `cons/chatavg/src/core/config.js`, `server.js`
**Проблема:** Пароль администратора может быть виден в логах инициализации. Нет обязательной проверки `CHATAVG_ADMIN_PASSWORD` из ENV.
**Исправление:** Реализовать fail-fast при старте в production без `CHATAVG_ADMIN_PASSWORD`. Удалить все `console.log` с паролями/секретами.

### F2.2 — Sandbox fail-closed в production
**Файл:** `cons/chatavg/src/modules/sandbox/sandbox.manager.js`
**Проблема:** Существует `_selectAdapter()`, который при отсутствии E2B_API_KEY в production должен бросать ошибку, но логика требует проверки. Убедиться, что `LocalAdapter` **никогда** не используется при `NODE_ENV=production`.
**Исправление:** Аудит и усиление `_selectAdapter()`: явный throw при `isProduction && !hasE2BKey`.

### F2.3 — SSRF Guard
**Файл:** `cons/chatavg/src/core/utils.js` (`validateProviderUrl`)
**Проблема:** Проверить, что `validateProviderUrl` правильно блокирует приватные диапазоны IP (127.x, 10.x, 172.16-31.x, 192.168.x) при `ALLOW_CUSTOM_PROVIDER_URLS=false`.
**Исправление:** Добавить unit-тест с граничными случаями. При обнаружении пробелов — исправить регулярку.

### F2.4 — Idempotency keys TTL
**Файл:** `cons/chatavg/src/modules/execution/run.repository.js`
**Проблема:** Ключи идемпотентности хранятся без TTL. Таблица `idempotency_keys` может расти неограниченно, а старые ключи могут конфликтовать.
**Исправление:** Добавить колонку `expires_at` и job очистки устаревших ключей (24h TTL).

---

## 🏗️ Sprint F3: Проектная гигиена и тестовый контур

> **Цель:** Устранить структурные проблемы проекта (точка входа, тест-контур).

### F3.1 — ROOT package.json
**Проблема:** Корень репозитория не имеет `package.json`. Новый разработчик не понимает, как запустить систему.
**Исправление:** Создать `package.json` в корне с npm-скриптами: `start`, `gateway`, `worker`, `test`, `setup`.

### F3.2 — Расширение тестовых скриптов
**Файл:** `cons/chatavg/package.json`
**Проблема:** Scripts `test:nightly` и `test:release` не покрывают `tests/policy/*.test.js`, `tests/knowledge/*.test.js`, `tests/execution/*.test.js`, `tests/tools/*.test.js`, `tests/remediation/*.test.js`.
**Исправление:** Добавить отдельные target-скрипты (`test:policy`, `test:knowledge`, `test:execution`, `test:tools`) и включить их в `test:nightly` и `test:release`.

### F3.3 — Документация точки входа
**Проблема:** Нет инструкции "как запустить с нуля". `LOCAL_DEVELOPMENT_SETUP.md` существует, но README не указывает на него явно.
**Исправление:** Обновить `README.md` с секцией "Quick Start" и ссылкой на `docs/05_delivery/LOCAL_DEVELOPMENT_SETUP.md`.

### F3.4 — README для `cons/chatavg`
**Проблема:** Нет отдельного README внутри основного модуля.
**Исправление:** Создать `cons/chatavg/README.md` с описанием запуска, переменных окружения и структуры модулей.

---

## 🌊 Sprint F4: MCP Gateway — полноценная интеграция

> **Цель:** Устранить архитектурные проблемы при работе через MCP-шлюз.

### F4.1 — Streaming через MCP
**Файл:** `cons/mcp_gateway/server.js` (инструменты `ai.chat`, `ai.responses`)
**Проблема:** Оба инструмента принудительно используют `stream: false`. Блокирующий запрос к OpenAI — нет "живой" печати.
**Исправление:** Реализовать поддержку SSE-стриминга внутри инструментов MCP-сервера. Обновить `mcp.js` адаптер в ChatAVG для корректной обработки потоковых дельт.

### F4.2 — Tool Call события теряются
**Файл:** `cons/mcp_gateway/server.js`
**Проблема:** Форматтер ответа в шлюзе извлекает только `output_text`. События `file_search_call` и `web_search_call` полностью игнорируются.
**Исправление:** Добавить в форматтер поддержку всех типов output_item. Пробрасывать статусы инструментов в основной поток текста (например, `[🔍 Searching documents...]`).

### F4.3 — Системные сообщения теряются
**Файл:** `cons/chatavg/src/modules/providers/adapters/openai_prompt_file_search.js`
**Проблема:** `_convertMessages` жёстко пропускает `role === 'system'`. При наличии системного промпта в категории он не передаётся в API.
**Исправление:** Если нет `prompt.id` — конвертировать `system` сообщения в `instructions`. Если есть `prompt.id` — документировать поведение явно.

### F4.4 — `openai_prompt_file_search`: web_search_call не обрабатывается
**Файл:** `cons/chatavg/src/modules/providers/adapters/openai_prompt_file_search.js`
**Проблема:** В `include` по умолчанию включён `web_search_call.action.sources`, но stream-хендлер не обрабатывает события `web_search_call`. Тишина вместо прогресса.
**Исправление:** Добавить обработку `response.output_item.added` для типа `web_search_call`.

---

## ⚙️ Sprint F5: Durable Runtime (Temporal hardening)

> **Цель:** Заменить мок-activities реальной логикой и обеспечить replay safety.

### F5.1 — Hardened Temporal Activities
**Файл:** `cons/chatavg/src/modules/temporal/activities.js`
**Проблема:** Activities являются заглушками. Нет реальной устойчивости к сбоям.
**Исправление:** Заменить все mock-activities реальным кодом: обращение к репозиториям, обработка ошибок, поддержка Heartbeat для длительных операций.

### F5.2 — Workflow Replay Safety
**Файл:** `cons/chatavg/src/modules/temporal/workflows.js`
**Проблема:** Детерминизм ворклоува не проверялся. Использование `Date.now()` или `Math.random()` внутри workflow нарушает replay.
**Исправление:** Аудит workflow-кода на нарушения детерминизма. Заменить недетерминированные вызовы на Temporal-safe аналоги.

### F5.3 — AgentRun Events 100% coverage
**Файл:** `cons/chatavg/src/modules/execution/run.service.js`
**Проблема:** Не все переходы состояний порождают события в `agent_run_events`.
**Исправление:** Убедиться, что каждый state transition порождает событие `run.status_changed` с полным контекстом.

---

## 🧠 Sprint F6: Knowledge Gateway — реальный RAG

> **Цель:** Перейти от mock-retriever к реальному поиску.

### F6.1 — Production SQLite FTS5 Retriever
**Файл:** `cons/chatavg/src/modules/knowledge/knowledge.gateway.js`
**Проблема:** Mock-retriever возвращает фиктивные данные. Реальный поиск по документам отсутствует.
**Исправление:** Реализовать полноценный SQLite FTS5 ретривер с индексацией и поиском по реальным документам.

### F6.2 — Ingestion Pipeline
**Проблема:** Отсутствует механизм добавления документов в Knowledge Base.
**Исправление:** Создать API и CLI для загрузки, чанкинга и индексации документов.

### F6.3 — Answerability Policy
**Проблема:** Нет проверки качества найденного контекста перед формированием ответа.
**Исправление:** Реализовать логику отказа от ответа при score ниже порога (configurable threshold).

### F6.4 — Citation Validation
**Проблема:** Ссылки на источники в ответе LLM не верифицируются против реально найденных чанков.
**Исправление:** Реализовать post-processing проверку цитат в `citation_validation.js`.

---

## 🧬 Sprint F7: Semantic Layer — стабилизация

> **Цель:** Сделать Semantic Protocol устойчивым и персистентным.

### F7.1 — Persistent Claim Ledger
**Файл:** `cons/chatavg/src/modules/semantic/semantic.protocol.js`
**Проблема:** Claim Ledger слабо персистентен. При рестарте сервиса семантические данные могут теряться.
**Исправление:** Убедиться, что все claims, boundaries и events 100% пишутся в SQLite через `SemanticRepository`.

### F7.2 — Artifact Versioning
**Файл:** `cons/chatavg/src/modules/execution/artifact.service.js`
**Проблема:** ArtifactService не поддерживает полноценное версионирование и diff.
**Исправление:** Доработать versioning: хранить историю патчей, поддерживать `diffView`.

### F7.3 — Hybrid Extraction stabilization
**Проблема:** Rule-based экстрактор имеет точность ~30-40%. LLM-fallback — скелет.
**Исправление:** Настроить правила и пороги. Задокументировать текущие ограничения в `SEMANTIC_POC_REPORT.md`.

---

## 🎨 Sprint F8: UX/UI — доводка

> **Цель:** Финализация интерфейса и качество ошибок.

### F8.1 — Error UI/UX (Canonical Error Contract)
**Проблема:** Ошибки провайдеров и таймауты отображаются в сыром виде.
**Исправление:** Унифицировать отображение ошибок в WebUI через Canonical Error Contract из `providerErrors.js`.

### F8.2 — Latency Optimization
**Цель:** TTFT < 500ms для Fast Path запросов.
**Исправление:** Профилирование и устранение лишних await в критическом пути. Проверить через `test:latency`.

### F8.3 — Admin Dashboard: Cost + Quality charts
**Проблема:** Dashboard показывает метрики без исторических графиков.
**Исправление:** Добавить time-series вид для latency/cost/quality метрик.

### F8.4 — Mobile Audit
**Проблема:** WebUI не проверялась на мобильных устройствах после последних изменений.
**Исправление:** Провести тест на iOS Safari и Android Chrome. Исправить safe-area и touch-target issues.

---

## 🧪 Sprint F9: Full QA & Release Candidate

> **Цель:** Полная проверка системы перед передачей.

### F9.1 — Full Regression Suite
Запустить весь тестовый контур (после F3.2): `npm run test:release`.
Цель: 100% pass на всех 12+ test categories.

### F9.2 — Security Red-Teaming
- Prompt Injection через `extra_params`
- Попытка обхода `policyGuard` через пустой operation (проверить исправление F1.1)
- Cross-tenant data leakage через sessions
- Tool escalation через MCP

### F9.3 — Load & Chaos Testing
- 100 одновременных SSE-сессий
- Отключение OpenAI в процессе стриминга
- Рестарт сервера при активных AgentRun
- Temporal cluster недоступен

### F9.4 — Release Candidate Report
Подготовить `RELEASE_CANDIDATE_REPORT_RC_v2.md` с результатами всех gate-тестов.

---

## 🚀 Sprint F10: Production Handover

> **Цель:** Деплой и передача системы в эксплуатацию.

### F10.1 — MIGRATION-002: DB migration
Выполнить план миграции БД с V1 на V2.3 по `RUNBOOK-003`.

### F10.2 — Shadow Deployment
Запустить V2.3 параллельно с V1 для проверки стабильности на реальном трафике (canary 10%).

### F10.3 — Production Environment Checklist
- [ ] `NODE_ENV=production`
- [ ] `E2B_API_KEY` задан
- [ ] `CHATAVG_ADMIN_PASSWORD` из ENV
- [ ] `ALLOW_LOCAL_COMMAND_EXECUTION` НЕ задан
- [ ] SSL/TLS настроен
- [ ] Rate limiting активен
- [ ] Логирование в production mode (нет debug-логов)

### F10.4 — Final Operations Handover
Передача документации, ранбуков и ключей доступа команде эксплуатации.

---

## 📊 Release Gates Matrix

| Gate | Sprint | Критерий | Статус |
|---|---|---|---|
| G0: Code Safety | F1 | Все P0 баги исправлены | 🔲 |
| G1: Security | F2 | Sandbox fail-closed, no secrets in logs | 🔲 |
| G2: Structure | F3 | Root entry point, full test coverage | 🔲 |
| G3: MCP | F4 | Streaming работает, tool events видны | 🔲 |
| G4: Runtime | F5 | Temporal activities не моки | 🔲 |
| G5: RAG | F6 | Real retriever, citations validated | 🔲 |
| G6: Semantic | F7 | Claim Ledger persistent | 🔲 |
| G7: UX | F8 | Error UX, TTFT < 500ms | 🔲 |
| G8: QA | F9 | 100% test pass, red-team pass | 🔲 |
| G9: Production | F10 | Shadow deploy stable | 🔲 |

---

## 🚨 Приоритеты для немедленного согласования

Следующие задачи требуют немедленного согласования и выполнения в первую очередь:

1. **F1.1** — policyGuard получает пустой operation (Security P0)
2. **F1.2** — SSE соединение зависает (UX P0)
3. **F1.3** — AgentRun state machine deadlock (Functional P0)
4. **F1.4** — Дублирующийся код в openai_responses_compat (Logic Bug)
5. **F1.5** — LocalAdapter выполняет команды без guard (Security P0)

---

*Документ создан: 2026-05-09 | Версия: 2.0*
*Источник аудита: внешний review, 53 commits, main branch*
