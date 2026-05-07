# ChatAVG Agent Platform v2.2
## Детальный Backlog, Архитектурные Решения (ADR) и Risk Register

**Версия:** 2.2  
**Дата:** 6 мая 2026  
**Статус:** Ready for Implementation  
**На основе:** Аудит + исследование лучших практик 2025–2026 (Temporal, LiteLLM, E2B, RAGAS, multi-agent patterns)

---

## Введение

План v2.2 — эволюция v2.1 с учётом актуальных трендов 2026 года:
- Готовые компоненты вместо полного custom (LiteLLM, Temporal, E2B)
- Ранний MVP после Sprint 9
- Параллельный UI-трек
- Усиленная observability и multi-agent пилот

**Ключевые технологии (решения ниже):**
- **Model Gateway** → LiteLLM Proxy
- **Durable Execution** → Temporal
- **Sandbox** → E2B (primary) + Daytona (alternative)

---

## Архитектурные Решения (ADR)

### ADR-001: Durable Execution Platform — Temporal (Primary)

**Статус:** Accepted  
**Дата:** 6 мая 2026  
**Авторы:** Архитектурная команда

**Контекст**  
AgentRun требует надёжного восстановления после рестартов, long-running workflows (дни/недели), human-in-the-loop пауз и exactly-once семантики. Чистые чекпоинты LangGraph недостаточны для production (потеря состояния внутри ноды).

**Решение**  
Использовать **Temporal** как целевую платформу для всех AgentRun workflows.  
- Реализовать `DurableRuntime` интерфейс с адаптером под Temporal.  
- MVP: SQLite transactional outbox + worker (Sprint 6).  
- Полный переход: Sprint 14–15.  
- Поддерживать fallback на custom worker для dev.

**Альтернативы**  
- Inngest (TS-first, но дороже при большом количестве шагов)  
- Restate (лёгкий, но менее зрелый)  
- LangGraph + Postgres checkpoints (только для dev)  
- Чистый custom outbox (не масштабируется)

**Последствия**  
**Положительные:**  
- Production-grade durability, автоматическое восстановление, отличная observability.  
- Нативная поддержка human approval workflows.  
- Используется OpenAI для Codex.

**Отрицательные:**  
- Дополнительная инфраструктура (Temporal cluster).  
- Кривая обучения для команды.  
- Стоимость (но оправдана для enterprise).

**Риски и Mitigation**  
- Vendor lock → абстракция через интерфейс.  
- История workflow большая → payload codecs + external storage.

---

### ADR-002: Model Gateway — LiteLLM Proxy (Primary)

**Статус:** Accepted  
**Дата:** 6 мая 2026

**Контекст**  
Нужно единое управление 100+ моделями, cost tracking, load balancing, fallback, guardrails и virtual keys без написания всего с нуля.

**Решение**  
**LiteLLM Proxy** как основа ModelGateway.  
- Адаптер поверх LiteLLM для кастомных trace events и интеграции с PolicyEngine.  
- Полная поддержка OpenAI-совместимого API.  
- Встроенные возможности: routing, budgeting, logging, caching.

**Альтернативы**  
- Полностью custom gateway (дольше, дороже).  
- Portkey / Helicone (cloud-only).  
- Kong AI Gateway (слишком тяжёлый).

**Последствия**  
**Положительные:**  
- Быстрый time-to-market.  
- Готовый cost tracking и virtual keys.  
- 100+ провайдеров из коробки.

**Отрицательные:**  
- Нужно поддерживать fork/адаптер для специфических trace событий.  
- Дополнительный сервис в инфраструктуре.

**Риски и Mitigation**  
- Зависимость от open-source → мониторить forks и иметь fallback на прямые SDK внутри adapter.

---

### ADR-003: Sandbox Platform — E2B (Primary) + Daytona (Alternative)

**Статус:** Accepted  
**Дата:** 6 мая 2026

**Контекст**  
Нужна изоляция для code execution, browser use и high-risk инструментов. Полный sandbox только для рискованных операций.

**Решение**  
- **Primary:** E2B (Firecracker microVM) — лучший SDK для AI-агентов, ~150мс cold start.  
- **Alternative / Dev:** Daytona (быстрый Docker-based, stateful).  
- Гибридная модель: lightweight path для простого чата, full sandbox для write/code/browser.

**Альтернативы**  
- Чистый Docker / gVisor (слабая изоляция).  
- Northflank / Modal (менее специализированы под агентов).

**Последствия**  
**Положительные:**  
- Отличная изоляция и производительность.  
- Готовые SDK для Node.js/Python.  
- Соответствует лучшим практикам 2026 года.

**Отрицательные:**  
- Дополнительные расходы на облачные sandbox'ы.  
- Нужно управлять TTL и cleanup.

**Риски и Mitigation**  
- Vendor costs → мониторинг + budget limits в PolicyEngine.  
- Session limits → автоматический snapshot + resume.

---

## Risk Register (по спринтам)

| Sprint | Риск | Вероятность | Влияние | Mitigation | Владелец |
|--------|------|-------------|---------|------------|----------|
| 0 | Нестабильный репозиторий после PR #1 | Средняя | Высокое | Жёсткий `.gitignore`, clean branch | Tech Lead |
| 1–2 | Тесты не дают надёжного сигнала | Низкая | Высокое | Изолированная test DB + fixtures | QA Lead |
| 3–4 | Задержка с LiteLLM интеграцией | Средняя | Среднее | Параллельный custom adapter | Backend Lead |
| 5 | AgentRun API ломает backward compat | Низкая | Высокое | Строгий contract test + feature flag | Backend |
| 6 | Temporal cluster нестабилен на старте | Средняя | Высокое | Сначала dev Temporal + fallback worker | DevOps |
| 7 | PolicyEngine слишком строгий → UX деградация | Средняя | Среднее | A/B тесты + gradual rollout | Product |
| 8 | Approval fatigue у пользователей | Высокая | Высокое | Группировка + smart defaults + preview | UX Lead |
| 9 (MVP) | MVP не готов к релизу | Средняя | Критическое | Жёсткий scope freeze + weekly demos | PM |
| 10–11 | RAG качество ниже ожидаемого | Средняя | Высокое | RAGAS + ежедневные evals + human review | ML Engineer |
| 12 | Semantic слой слишком сложный для пользователей | Средняя | Среднее | UX упрощение + 3–5 главных различений | UX + Semantic Lead |
| 13 | Tool Registry version drift | Низкая | Среднее | Canary + schema hash validation | Backend |
| 14 | Sandbox costs взлетают | Высокая | Среднее | Policy budget limits + TTL enforcement | DevOps |
| 15 | Load тесты показывают bottlenecks | Средняя | Высокое | Ранние load тесты (Sprint 5) + autoscaling | Performance |
| 16 | Rollback не работает | Низкая | Критическое | Полный MIGRATION-002 + dry-run | DevOps |
| Общий | Ключевой разработчик уходит | Средняя | Высокое | Документация + pair programming + bus factor 3 | Tech Lead |
| Общий | Prompt injection через tool output | Высокая | Высокое | Output sanitization + policy checks | Security |

---

## Детальный Backlog по спринтам

### Sprint 0 — Repo hygiene, architecture lock and backlog reset
**Длительность:** 1 неделя  
**Цель:** Зафиксировать новую архитектуру и очистить репозиторий.

**Задачи:**
1. **Закрыть/переписать PR #1 + восстановить .gitignore**
   - Acceptance Criteria:
     - Все `*.gguf`, `models_cache/`, runtime данные и secrets в `.gitignore`
     - Репозиторий чистый, нет случайных коммитов
2. **Обновить PROJECT_BACKLOG.md и зафиксировать ADR-001**
   - Acceptance Criteria:
     - Новый roadmap v2.2 опубликован
     - ADR-001, ADR-002, ADR-003 приняты и задокументированы
3. **Зафиксировать feature flags**
   - Acceptance Criteria:
     - Флаги: `agent_runs_enabled`, `model_gateway_enabled`, `knowledge_gateway_enabled`, `tool_gateway_enabled`, `semantic_layer_enabled`, `sandbox_forge_enabled`
4. **Baseline checklist текущей версии**
   - Acceptance Criteria:
     - Документ с текущим состоянием endpoints, тестов и UI

**Deliverables:** ADR-001/002/003, обновлённый PROJECT_BACKLOG, release branch `release/v2.2`  
**Testing Gate:** `npm test` + smoke login → chat  
**Exit Criteria:** Архитектура зафиксирована, ветка чистая

---

### Sprint 1 — Regression baseline and test harness hardening
**Длительность:** 2 недели

**Задачи:**
1. **Разделить тесты на unit/integration/security/contract/smoke**
2. **Сделать test DB полностью изолированной (testcontainers + fixtures)**
3. **Починить security assertions (CORS, SSRF, JSON limits)**
4. **Добавить baseline latency measurement (P50/P95/P99)**
5. **Настроить OpenTelemetry + Langfuse tracing**

**Acceptance Criteria (примеры):**
- Все тесты проходят в CI
- Latency baseline сохранён в `docs/baselines/`
- Tracing работает на всех эндпоинтах

**Deliverables:** Test matrix v1, CI commands, Regression report  
**Exit Criteria:** Тесты дают надёжный сигнал

---

### Sprint 2 — Canonical contracts and fast path discipline
**Длительность:** 2 недели

**Задачи:**
1. **Задокументировать CanonicalChatEvent (SPEC-001)**
2. **Проверить все provider adapters на AsyncIterable contract**
3. **Добавить latency budget guardrails**
4. **Отделить simple chat route от AgentRun**

**Acceptance Criteria:**
- SPEC-001 опубликован
- Streaming event ordering тесты зелёные
- P95 simple path < 800 мс на synthetic provider

---

### Sprint 3–4 (объединён) — Model Registry + Model Gateway
**Длительность:** 3 недели

**Задачи:**
1. **Реализовать ModelRegistry (cache, health, fallback)**
2. **Интегрировать LiteLLM Proxy как основу ModelGateway**
3. **Добавить trace events: model.requested, model.stream_started и т.д.**
4. **Admin endpoint для models без SDK leakage**
5. **Provider health UI синхронизация**

**Acceptance Criteria:**
- `ai.models.list` работает с partial failure
- LiteLLM routing + cost tracking активны
- Backward compatibility `/api/chat/completions` 100%

**Deliverables:** SPEC-002, SPEC-003, Model trace mapper

---

### Sprint 5 — AgentRun API and event stream foundation
**Длительность:** 2 недели

**Задачи:**
1. **Добавить AgentRun data model и state machine**
2. **Endpoints:** create, get, cancel, event stream (SSE)
3. **AgentRunEvent contract**
4. **Bridge: simple chat → fast path / complex → AgentRun**

**Acceptance Criteria:**
- State transitions тесты 100%
- SSE stream работает при client disconnect/reconnect
- Нет дублирования runs

---

### Sprint 6 — Durable execution MVP (Temporal)
**Длительность:** 3 недели

**Задачи:**
1. **Настроить Temporal cluster (dev + staging)**
2. **Реализовать DurableRuntime интерфейс + Temporal adapter**
3. **Transactional outbox + worker loop (idempotent)**
4. **Recovery после process restart**
5. **RUNBOOK-001: restart recovery**

**Acceptance Criteria:**
- Worker restart/replay тесты зелёные
- Нет duplicated side effects
- Run возобновляется с последнего checkpoint < 5 сек

---

### Sprint 7 — Policy, cost and audit control plane
**Длительность:** 2 недели

**Задачи:**
1. **PolicyDecision engine (allow/deny/require_approval)**
2. **CostPolicy + AgentRunEstimate**
3. **Расширенный AuditService v2**
4. **Data sensitivity + resourceScope**

**Acceptance Criteria:**
- Budget exceeded → автоматический downgrade/stop
- Audit события для каждого model/tool call

---

### Sprint 8 — Approval UX and risk-based tool actions
**Длительность:** 2 недели (параллельно с UI-треком)

**Задачи:**
1. **ApprovalRequest модель и state machine**
2. **UI approval panel MVP**
3. **Preview/diff + группировка approvals**
4. **Risk classification для инструментов**

**Acceptance Criteria:**
- High-risk tools требуют approval
- Approval conversion > 80%
- Нет approval fatigue (группировка работает)

---

### Sprint 9 — MVP Release (Fast chat + AgentRun + Policy + Approvals)
**Длительность:** 2 недели

**Задачи:**
1. **Полный E2E flow:** login → fast chat → AgentRun → approval → artifact
2. **Feature flags rollout**
3. **Internal beta + feedback**

**Acceptance Criteria:**
- E2E тест проходит
- Zero critical bugs
- Готов к controlled rollout

**Deliverables:** MVP release notes, MIGRATION-001

---

### Sprint 10 — Knowledge Gateway and RAG modes
**Длительность:** 2 недели

**Задачи:**
1. **KnowledgeGateway facade + modes (no_retrieval/fast/balanced/max_quality)**
2. **RetrievalResult + Citation contract**
3. **RAG mode router**

**Acceptance Criteria:**
- Latency per mode измерена
- Citation schema валиден

---

### Sprint 11 — RAG evals and quality regression
**Длительность:** 2 недели

**Задачи:**
1. **EVAL-001 датасет (answerable/unanswerable/adversarial)**
2. **Интеграция RAGAS + custom scoring**
3. **Nightly eval pipeline**
4. **Пороги качества для каждого режима**

**Acceptance Criteria:**
- Context precision/recall > 85%
- Hallucination rate < 5%
- Regression threshold не превышен

---

### Sprint 12 — ER Meaning Layer and Adequacy Engine v0
**Длительность:** 3 недели

**Задачи:**
1. **Claim + DomainBoundary модели**
2. **ClaimLedger + semantic trace events**
3. **Role Pass contracts (Observer, Boundary и т.д.)**

**Acceptance Criteria:**
- Claim extraction accuracy > 90% на golden set
- Нет hidden authority language

---

### Sprint 13 — Artifact Workspace and Role Passes
**Длительность:** 2 недели

**Задачи:**
1. **ArtifactWorkspace + ArtifactPatch**
2. **Diff/patch viewer с ссылками на claims**
3. **UX: 3–5 главных различений**

**Acceptance Criteria:**
- Artifact versioning работает
- Patch references decision records

---

### Sprint 14 — MCP Tool Gateway + Sandbox (E2B)
**Длительность:** 3 недели

**Задачи:**
1. **ToolDefinitionVersion + Registry**
2. **ToolCall state machine + idempotency**
3. **Интеграция E2B как primary sandbox**
4. **Egress policy + workspace mount**

**Acceptance Criteria:**
- High-risk tools запускаются только в sandbox
- Cleanup и quarantine работают
- Isolation тесты зелёные

---

### Sprint 15 — Observability, Load, Chaos + Multi-agent Pilot
**Длительность:** 3 недели

**Задачи:**
1. **Дашборды:** cost, latency, approvals, sandbox usage
2. **Load тесты (k6/Artillery)**
3. **Chaos engineering (provider timeout, sandbox crash)**
4. **Multi-agent pilot** (supervisor pattern)

**Acceptance Criteria:**
- P95 latency thresholds met
- Recovery после chaos < 10 сек
- Multi-agent pilot работает

---

### Sprint 16 — Release Candidate and Rollout
**Длительность:** 2 недели

**Задачи:**
1. **Полный security review + pen-test**
2. **MIGRATION-002 + rollback procedure**
3. **Production rollout (tenant-by-tenant)**
4. **Final sign-off**

**Acceptance Criteria:**
- Все gates пройдены
- Rollback протестирован
- v2.2 в production

---

## Заключение

План v2.2 готов к старту.  
MVP ожидается через ~12–14 недель (Sprint 9).  
Полный релиз — через ~22–24 недели.

**Следующие шаги:**
1. Утвердить ADR и Risk Register
2. Создать Jira/Linear board по этому backlog
3. Kick-off Sprint 0

---

*Документ сгенерирован автоматически на основе аудита и лучших практик 2026 года.*