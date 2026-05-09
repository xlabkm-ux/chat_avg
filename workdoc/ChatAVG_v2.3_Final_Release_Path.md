# 🎯 ChatAVG v2.3 — Release Candidate 1: Sprint Plan

**Версия документа:** 3.0 (2026-05-09)
**Текущий статус:** 🔴 **RC1 — Finalizing Core & Security (Sprint F1)**
**Контекст:** 53 коммита. Skeleton/MVP PoC → Production hardening.

> **Правило:** Каждый спринт завершается блоком Testing & Debug + Git commit + Git push. Без прохождения gate — следующий спринт не начинается.

---

## 📊 Компонентный статус (RC1 baseline)

| Компонент | Статус | Ключевая проблема |
|---|---|---|
| Chat Fast Path | ✅ | — |
| Admin UI / Categories | ✅ | — |
| MCP Gateway | ⚠️ | Нет SSE-стриминга, теряет tool events |
| openai_prompt_file_search | ⚠️ | sys-messages теряются, нет web_search handling |
| openai_responses_compat | 🐛 | Дублирующаяся ветка reasoning_summary |
| AgentRun / Temporal | 🚧 | Activities — моки, state machine deadlock |
| Knowledge Gateway | 🚧 | Mock-retriever, citations не работают |
| Semantic Protocol | 🚧 | In-memory, слабая персистентность |
| Sandbox | 🚨 | policyGuard видит пустой operation; LocalAdapter → sh -c без guard |
| SSE Streaming | 🐛 | Нет res.end() после [DONE] — соединение зависает |
| ROOT package.json | ❌ | Нет точки входа проекта |
| Test coverage | ⚠️ | tests/policy, knowledge, execution, tools не в scripts |

---

## Sprint F1: Критические баги кода (P0 Bugs)

**Цель:** Устранить баги, которые ломают runtime прямо сейчас.

### Задачи разработки

**F1.1 — sandbox.routes.js: policyGuard видит пустой operation**
- Файл: `cons/chatavg/src/modules/sandbox/sandbox.routes.js`
- Проблема: `req.body.operation = 'run'` ставится *после* `policyGuard` → PolicyEngine пропускает опасные операции.
- Исправление: Выделить отдельный middleware установки `operation` *перед* `policyGuard` на всех маршрутах `/run`, `/snapshot`, `/terminate`, `/quarantine`.

**F1.2 — chat.service.js: SSE-соединение зависает**
- Файлы: `chat.service.js`, `chat.controller.js`
- Проблема: После `data: [DONE]` не вызывается `res.end()`.
- Исправление: Добавить `res.end()` в streaming-ветке после завершения цикла событий.

**F1.3 — run.service.js: нелегальный переход состояний**
- Файл: `cons/chatavg/src/modules/execution/run.service.js`
- Проблема: `inMemoryExecution()` делает `requires_action → completed`, что запрещено state machine.
- Исправление: Промежуточный шаг `requires_action → running → completed`.

**F1.4 — openai_responses_compat.js: недостижимая ветка**
- Файл: `cons/chatavg/src/modules/providers/adapters/openai_responses_compat.js`
- Проблема: Дублирующийся `else if` для `response.reasoning_summary_text.delta` (строки ~81 и ~95) — вторая ветка мертва.
- Исправление: Удалить дублирующийся блок, оставить логику в первой ветке.

**F1.5 — local.adapter.js: выполнение sh -c без защиты**
- Файл: `cons/chatavg/src/modules/sandbox/adapters/local.adapter.js`
- Проблема: `execFile(shell, [flag, command])` выполняет любую строку на хосте. Совместно с F1.1 — критический RCE-вектор.
- Исправление: Добавить env-флаг `ALLOW_LOCAL_COMMAND_EXECUTION=true` как обязательное условие. По умолчанию — throw.

### 🧪 Testing & Debug Gate F1

```
# Запустить после всех исправлений F1:
npm run test:unit
npm run test:contract
npm run test:security:smoke
npm run test:sandbox
npm run test:integration:smoke

# Ручная проверка:
# 1. Отправить chat-запрос → убедиться что SSE закрывается (F1.2)
# 2. Создать AgentRun без Temporal → убедиться что статус достигает 'completed' (F1.3)
# 3. Вызвать POST /api/sandboxes/:id/run без E2B → должна быть ошибка, не выполнение (F1.5)
# 4. Проверить sandbox/run через curl → policyGuard должен видеть operation='run' (F1.1)
```

**Git:**
```bash
git add -A
git commit -m "Fix(F1): P0 bugs — policyGuard operation order, SSE res.end(), state machine, duplicate branch, LocalAdapter guard"
git push origin main
```

---

## Sprint F2: Безопасность ядра (P0 Security)

**Цель:** Закрыть критические уязвимости, выявленные внешним аудитом.

### Задачи разработки

**F2.1 — Secure Admin Boot**
- Файлы: `cons/chatavg/server.js`, `src/core/config.js`
- Проблема: Пароль администратора может попасть в логи. Нет fail-fast без `CHATAVG_ADMIN_PASSWORD` в prod.
- Исправление: Fail-fast при `NODE_ENV=production` без пароля из ENV. Аудит всех `console.log` на секреты.

**F2.2 — Sandbox fail-closed**
- Файл: `cons/chatavg/src/modules/sandbox/sandbox.manager.js`
- Проблема: Убедиться, что `_selectAdapter()` при `isProduction && !hasE2BKey` всегда бросает ошибку.
- Исправление: Аудит логики, явный `throw new Error('[Security] E2B required in production')`.

**F2.3 — SSRF Guard аудит**
- Файл: `cons/chatavg/src/core/utils.js`
- Проблема: Проверить блокировку приватных IP (127.x, 10.x, 172.16-31.x, 192.168.x) в `validateProviderUrl`.
- Исправление: Добавить unit-тест с граничными случаями. Исправить регулярку при обнаружении пробелов.

**F2.4 — Idempotency keys TTL**
- Файл: `cons/chatavg/src/modules/execution/run.repository.js`
- Проблема: Ключи хранятся без TTL, таблица растёт неограниченно.
- Исправление: Добавить `expires_at` (24h) и SQLite-migration, job очистки устаревших ключей.

### 🧪 Testing & Debug Gate F2

```
# Запустить после F2:
npm run test:security
npm run test:integration:smoke

# Ручная проверка:
# 1. Запустить сервер без CHATAVG_ADMIN_PASSWORD в NODE_ENV=production → должен упасть (F2.1)
# 2. Запустить sandbox без E2B_API_KEY в production → должен упасть с ошибкой (F2.2)
# 3. Вызвать validateProviderUrl('http://169.254.169.254') → должен блокировать (F2.3)
```

**Git:**
```bash
git add -A
git commit -m "Fix(F2): Security hardening — admin boot, sandbox fail-closed, SSRF guard, idempotency TTL"
git push origin main
```

---

## Sprint F3: Проектная гигиена и тестовый контур

**Цель:** Устранить структурные проблемы — точка входа, документация, покрытие тестов.

### Задачи разработки

**F3.1 — ROOT package.json**
- Создать `package.json` в корне репозитория со скриптами: `start`, `gateway`, `worker`, `test`, `setup`.

**F3.2 — Расширение test scripts**
- Файл: `cons/chatavg/package.json`
- Добавить: `test:policy`, `test:knowledge`, `test:execution`, `test:tools`, `test:remediation`.
- Включить их в `test:nightly` и `test:release`.

**F3.3 — README Quick Start**
- Файл: `README.md`
- Добавить секцию "Quick Start" с командами и ссылкой на `docs/05_delivery/LOCAL_DEVELOPMENT_SETUP.md`.

**F3.4 — cons/chatavg/README.md**
- Создать README с описанием запуска, переменных окружения, структуры модулей.

### 🧪 Testing & Debug Gate F3

```
# Проверить что все новые скрипты работают:
cd cons/chatavg
npm run test:policy
npm run test:knowledge
npm run test:execution
npm run test:tools

# Из корня:
npm run setup   # должен поставить deps в обоих cons/
npm test        # должен вызвать test:release в cons/chatavg
```

**Git:**
```bash
git add -A
git commit -m "Chore(F3): Root package.json, expanded test scripts, README Quick Start, cons/chatavg README"
git push origin main
```

---

## Sprint F4: MCP Gateway hardening

**Цель:** Полноценная интеграция через MCP-шлюз — стриминг, tool events, корректная передача контекста.

### Задачи разработки

**F4.1 — SSE Streaming в ai.chat и ai.responses**
- Файл: `cons/mcp_gateway/server.js`
- Проблема: `stream: false` принудительно на всех инструментах. Нет "живой" печати.
- Исправление: Реализовать SSE-стриминг в обоих инструментах. Обновить `mcp.js` адаптер для обработки потоковых дельт.

**F4.2 — Tool Call события в ответе шлюза**
- Файл: `cons/mcp_gateway/server.js`
- Проблема: `file_search_call`, `web_search_call` игнорируются форматтером.
- Исправление: Добавить обработку всех типов output_item. Пробрасывать статусы как текст `[🔍 Searching...]`.

**F4.3 — System messages не теряются**
- Файл: `cons/chatavg/src/modules/providers/adapters/openai_prompt_file_search.js`
- Проблема: `_convertMessages` пропускает `role === 'system'`.
- Исправление: При отсутствии `prompt.id` — конвертировать `system` в `instructions`.

**F4.4 — web_search_call обработка в stream**
- Файл: `openai_prompt_file_search.js`
- Проблема: Stream-хендлер не обрабатывает `web_search_call` события.
- Исправление: Добавить ветку `response.output_item.added` для типа `web_search_call`.

### 🧪 Testing & Debug Gate F4

```
# Unit:
npm run test:unit
npm run test:contract

# Ручная проверка (требует запущенного MCP Gateway):
# 1. Отправить запрос через категорию с mcp_gateway → убедиться что стриминг работает (F4.1)
# 2. Отправить запрос openai_prompt_file_search с system_prompt → убедиться что не теряется (F4.3)
# 3. Проверить debug-лог (вкладка «Отладка») — параметры должны включать instructions (F4.3)
```

**Git:**
```bash
git add -A
git commit -m "Feat(F4): MCP Gateway SSE streaming, tool call events, system message fix, web_search_call handling"
git push origin main
```

---

## Sprint F5: Durable Runtime (Temporal hardening)

**Цель:** Заменить мок-activities реальной логикой, обеспечить replay safety.

### Задачи разработки

**F5.1 — Hardened Temporal Activities**
- Файл: `cons/chatavg/src/modules/temporal/activities.js`
- Исправление: Реализовать все activities: обращение к репозиториям, Heartbeat для длительных операций, обработка ошибок.

**F5.2 — Workflow Replay Safety**
- Файл: `cons/chatavg/src/modules/temporal/workflows.js`
- Исправление: Аудит на `Date.now()`, `Math.random()` внутри workflow. Заменить на Temporal-safe аналоги (`workflow.now()`).

**F5.3 — AgentRun Events 100% coverage**
- Файл: `run.service.js`
- Исправление: Каждый state transition → событие `run.status_changed` с полным контекстом в `agent_run_events`.

### 🧪 Testing & Debug Gate F5

```
npm run test:execution
npm run test:integration

# Ручная проверка (с запущенным Temporal dev cluster):
# 1. Создать AgentRun → убедиться что все state transitions логируются в agent_run_events
# 2. Перезапустить worker → убедиться что workflow корректно воспроизводится (replay)
```

**Git:**
```bash
git add -A
git commit -m "Feat(F5): Temporal activities hardened, workflow replay safety, AgentRun events 100% coverage"
git push origin main
```

---

## Sprint F6: Knowledge Gateway — реальный RAG

**Цель:** Перейти от mock-retriever к реальному поиску по документам.

### Задачи разработки

**F6.1 — Production SQLite FTS5 Retriever**
- Файл: `cons/chatavg/src/modules/knowledge/knowledge.gateway.js`
- Исправление: Реализовать реальный FTS5-ретривер — индексация, полнотекстовый поиск, ранжирование.

**F6.2 — Ingestion Pipeline**
- Исправление: API + CLI для загрузки документов: chunking, embedding (если нужно), запись в FTS5-индекс.

**F6.3 — Answerability Policy**
- Исправление: Логика отказа от ответа при релевантности ниже configurable threshold.

**F6.4 — Citation Validation**
- Исправление: Post-processing проверка цитат в ответе против реально найденных чанков.

### 🧪 Testing & Debug Gate F6

```
npm run test:knowledge
npm run eval:rag

# Ручная проверка:
# 1. Загрузить тестовый документ через Ingestion Pipeline
# 2. Задать вопрос по документу → убедиться что ответ содержит реальный контент из документа
# 3. Задать нерелевантный вопрос → должен получить отказ (answerability policy)
```

**Git:**
```bash
git add -A
git commit -m "Feat(F6): Real SQLite FTS5 retriever, ingestion pipeline, answerability policy, citation validation"
git push origin main
```

---

## Sprint F7: Semantic Layer — стабилизация

**Цель:** Персистентный Claim Ledger, стабильная экстракция.

### Задачи разработки

**F7.1 — Persistent Claim Ledger**
- Исправление: Все claims, boundaries и events — 100% в SQLite через SemanticRepository. Проверить при рестарте сервера.

**F7.2 — Artifact Versioning & Diff**
- Исправление: ArtifactService хранит историю патчей, поддерживает `diffView`.

**F7.3 — Hybrid Extraction стабилизация**
- Исправление: Настроить пороги rule-based экстрактора. Задокументировать ограничения.

### 🧪 Testing & Debug Gate F7

```
npm run eval:semantic
npm run eval:semantic:full

# Ручная проверка:
# 1. Выполнить несколько chat-запросов → перезапустить сервер → claims должны сохраниться в БД
# 2. Проверить accuracy на golden_set (цель: > 40% для rule-based)
```

**Git:**
```bash
git add -A
git commit -m "Feat(F7): Persistent Claim Ledger, Artifact versioning, Semantic extraction tuning"
git push origin main
```

---

## Sprint F8: UX/UI — доводка

**Цель:** Качество ошибок, latency, dashboard, mobile.

### Задачи разработки

**F8.1 — Canonical Error UI/UX:** Унифицировать отображение ошибок через `providerErrors.js`.
**F8.2 — Latency Optimization:** TTFT < 500ms Fast Path. Профилирование критического пути.
**F8.3 — Admin Dashboard:** Time-series графики для cost/latency/quality.
**F8.4 — Mobile Audit:** iOS Safari + Android Chrome. Safe-area, touch targets.

### 🧪 Testing & Debug Gate F8

```
npm run test:latency   # цель: TTFT P95 < 500ms

# Ручная проверка:
# 1. Симулировать ошибку провайдера → проверить UX отображения
# 2. Открыть Admin Dashboard → убедиться что графики показывают реальные данные
# 3. Открыть WebUI на мобильном устройстве → проверить layout
```

**Git:**
```bash
git add -A
git commit -m "Feat(F8): Canonical error UX, latency optimization, dashboard charts, mobile audit fixes"
git push origin main
```

---

## Sprint F9: Full QA & Release Candidate

**Цель:** Полное тестирование перед RC1 sign-off.

### Задачи

**F9.1 — Full Regression Suite**
```
npm run test:release   # все 12+ категорий тестов, цель: 100% pass
```

**F9.2 — Security Red-Teaming**
- Prompt Injection через `extra_params`
- Обход `policyGuard` через пустой operation (проверить F1.1)
- Cross-tenant leakage через sessions
- Tool escalation через MCP

**F9.3 — Load & Chaos Testing**
- 100 одновременных SSE-сессий (скрипт из `tests/load/`)
- Отключение OpenAI в процессе стриминга
- Рестарт сервера при активных AgentRun
- Temporal cluster недоступен (проверить degradation)

**F9.4 — Release Candidate Report**
Создать `docs/05_delivery/RELEASE_CANDIDATE_REPORT_RC1.md` с результатами всех gate-тестов.

### 🧪 Testing & Debug Gate F9

```
npm run test:release
npm run test:security
# + ручной red-team сценарий
# + load test (chaos harness)
```

**Git:**
```bash
git add -A
git commit -m "QA(F9): RC1 full regression, security red-team, load/chaos results, RC1 report"
git push origin main
```

---

## Sprint F10: Production Handover

**Цель:** Деплой RC1 в production и передача системы.

### Задачи

**F10.1 — MIGRATION-002:** Выполнить план миграции БД по `RUNBOOK-003`.
**F10.2 — Shadow Deployment:** V2.3 параллельно с V1, canary 10% трафика.
**F10.3 — Production Checklist:**
- [ ] `NODE_ENV=production`
- [ ] `E2B_API_KEY` задан
- [ ] `CHATAVG_ADMIN_PASSWORD` из ENV
- [ ] `ALLOW_LOCAL_COMMAND_EXECUTION` **не задан**
- [ ] SSL/TLS настроен
- [ ] Rate limiting активен
- [ ] Debug-логи отключены

**F10.4 — Handover:** Передача документации, ранбуков, ключей команде эксплуатации.

### 🧪 Testing & Debug Gate F10

```
# На production-окружении:
# 1. Smoke test: health check, login, fast chat, admin panel
# 2. Shadow deploy: 10% трафика → мониторинг ошибок и latency 24h
# 3. Canary rollout: 50% → 100% при стабильности
```

**Git:**
```bash
git add -A
git commit -m "Release(F10): RC1 production handover — migration, shadow deploy, final checklist"
git push origin main
```

---

## 📊 Release Gates Matrix (RC1)

| Gate | Sprint | Критерий | Статус |
|---|---|---|---|
| G0: Code Safety | F1 | Все P0 баги исправлены, тесты green | 🔴 |
| G1: Security | F2 | Sandbox fail-closed, no secrets in logs | 🔴 |
| G2: Structure | F3 | Root entry point, full test scripts | 🔴 |
| G3: MCP | F4 | SSE streaming, tool events видны | 🔴 |
| G4: Runtime | F5 | Temporal activities реальные | 🔴 |
| G5: RAG | F6 | Real retriever, citations validated | 🔴 |
| G6: Semantic | F7 | Claim Ledger persistent | 🔴 |
| G7: UX | F8 | Error UX, TTFT P95 < 500ms | 🔴 |
| G8: QA | F9 | 100% test:release, red-team pass | 🔴 |
| G9: Production | F10 | Shadow deploy 24h stable | 🔴 |

---

*Документ: ChatAVG v2.3 RC1 Sprint Plan | Версия: 3.0 | 2026-05-09*
*Источник: внешний аудит (53 commits, main branch)*
