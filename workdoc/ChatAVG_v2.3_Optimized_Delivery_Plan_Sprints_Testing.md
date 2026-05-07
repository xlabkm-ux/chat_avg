# ChatAVG Agent Platform v2.3
## Оптимизированный delivery-план, спринты, тестирование и release gates

**Версия:** 2.3  
**Дата:** 7 мая 2026  
**Статус:** Ready for Architecture Approval / Implementation Planning  
**Назначение:** заменить предыдущий план v2.1/v2.2 единым, более эффективным планом реализации ChatAVG Agent Platform с ранней проверкой ER Meaning Layer, production-ready runtime и управляемым rollout.

---

## 1. Executive summary

План v2.3 объединяет лучшее из последних документов и устраняет главный риск предыдущей дорожной карты: смысловой слой ChatAVG не должен появляться в конце проекта. Если ChatAVG позиционируется как meaning-first платформа, то `SemanticProtocol`, `Claim Ledger`, `DomainBoundary` и проверки языка должны быть проверены до тяжелых инвестиций в RAG, sandbox, tool mesh и enterprise hardening.

Главная корректировка v2.3: **Semantic Protocol Proof-of-Concept переносится в Sprint 5**. Это создает ранний product/USP gate: если система не умеет стабильно извлекать claims, понижать силу утверждений и удерживать domain boundaries, дальнейшая инфраструктура корректируется до того, как накоплен дорогой технический долг.

План сохраняет технически правильные решения последних документов:

- **Fast path first:** простой чат не проходит через sandbox, live tool discovery и heavy RAG.
- **Model Gateway:** inference отделен от MCP tools; LiteLLM Proxy используется как primary gateway-кандидат.
- **Durable Agent Runtime:** AgentRun реализуется через Temporal-first подход, без попытки построить полноценный workflow engine на SQLite.
- **MCP Tool Gateway:** MCP используется для tools/connectors, с versioned schemas и Tool Registry.
- **Risk-based sandbox / Forge:** E2B primary для code/browser/high-risk действий; no sandbox-per-chat default.
- **Policy / Cost / Audit control plane:** решения allow/deny/approval/downgrade входят в execution path.
- **ER Meaning Layer:** Claim Ledger, DomainBoundary, Role Passes и Artifact Workspace становятся продуктовым ядром, а не поздним украшением.

---

## 2. Что изменено относительно предыдущего плана

| Область | Было | Решение v2.3 | Зачем |
|---|---|---|---|
| ER Meaning Layer | Sprint 11-12 | Sprint 5 PoC + Sprint 11-12 углубление | Проверить USP рано, снизить риск поздней переделки. |
| Durable execution | SQLite outbox MVP с поздним Temporal | Temporal-first dev/staging; SQLite только app DB/audit/fallback | Не писать заново timers, saga, locks, approval waits. |
| Model layer | Existing provider factory + будущий gateway | LiteLLM pilot в Sprint 4 + compatibility adapter | Быстрее получить routing, budgeting, fallback, virtual keys. |
| Sandbox | Risk-based, но поздно | E2B primary в Sprint 14, policies уже в Sprint 8 | Не запускать sandbox на каждый чат, но подготовить control plane заранее. |
| RAG | Sprint 9-10 | Sprint 10-11 после Semantic PoC и MVP | Не строить retrieval до проверки смыслового слоя и event contracts. |
| Testing | Поздние evals | Semantic eval seed в Sprint 5, full evals Sprint 11 | Качество становится delivery gate, а не финальным отчетом. |
| Delivery | Линейный план | С Sprint 5 параллельные tracks | Инфраструктура и meaning/product track двигаются одновременно. |

---

## 3. Интеграция источников

| Источник | Что взято | Что изменено / отвергнуто |
|---|---|---|
| Google Doc “Анализ и оптимизация ChatAVG v2” | Shift-left ER-layer, ранний Semantic Protocol PoC, параллельные tracks, отказ от самописного SQLite workflow engine, high-stakes positioning. | `Sprint 4.5` преобразован в Sprint 5 для нормального sprint accounting. |
| v2.2 Detailed Backlog / ADR / Risk Register | Temporal primary, LiteLLM primary, E2B primary + Daytona alternative, risk register, detailed backlog artifacts. | Temporal переносится раньше; SQLite не считается полноценным DurableRuntime. |
| “Архитектурная реализация ChatAVG v2.0” | Meaning-first, Mission Lifecycle, Adequacy Engine, Role Passes, Artifact Workspace, semantic observability. | ER-layer становится P0/P1, не late-stage layer. |
| “Concept v2 / Architecture Review” | Fast path, provider-neutral core, Model/Knowledge/MCP Tool Gateways, latency budgets, cost/audit plane, migration/rollout. | OpenAI-first сохраняется как provider choice, но не как core semantics. |
| Старый Implementation Plan | Contract-first delivery, testing gates, runbooks, eval/load/chaos levels. | Отвергнуты big-bang rewrite, default sandbox-per-chat и “MCP для всего inference”. |
| Текущий репозиторий ChatAVG | Existing Node.js/Express gateway, SQLite, provider adapters, policyRouter/fallbackPolicy, MCP gateway, tests, UI audit. | План — evolutionary migration, не переписывание “с нуля”. |

---

## 4. Non-negotiable architecture decisions

1. **Simple chat stays simple:** no sandbox, live tool discovery or heavy retrieval in fast path.
2. **MCP is for tools, not model inference by default:** inference идет через ModelGateway.
3. **Core is provider-neutral:** provider-specific logic lives behind gateways/adapters.
4. **Durability is a platform property:** AgentRun survives restart, approval wait, retries, cancellation, provider failure.
5. **No custom workflow engine trap:** SQLite is not a replacement for Temporal signals/timers/replay.
6. **Semantic layer shifts left:** Claim Ledger and DomainBoundary are tested before RAG/sandbox expansion.
7. **Risk-based sandboxing:** full sandbox only for code/browser/write/high-risk.
8. **Policy/cost/audit are in the execution path:** not post-fact telemetry.
9. **Human sovereignty:** value/trajectory choices return to the human through ConflictCard/DecisionRecord.
10. **No hidden authority:** the system must not speak stronger than the evidence allows.

---

## 5. Delivery model

### 5.1. Tracks after Sprint 5

| Track | Фокус | Основные спринты | Owner |
|---|---|---|---|
| Track A — Platform Infrastructure | ModelGateway, AgentRun, Temporal, Policy, Sandbox, ToolGateway | 4, 6, 7, 8, 13, 14, 15 | Tech Lead / Backend Lead |
| Track B — Meaning/Product | SemanticProtocol, ClaimLedger, RolePasses, ArtifactWorkspace, Mission Room UX | 5, 9, 11, 12 | Product + Semantic Lead |
| Track C — Knowledge Quality | KnowledgeGateway, RAG modes, RAG evals, citation correctness | 10, 11, 15 | ML / Evals Lead |
| Track D — QA/Security/Ops | Test harness, security gates, load/chaos, release runbooks | 1, 8, 11, 15, 16 | QA/Security/SRE |
| Track E — Frontend/UX | AgentRun events, approvals, Mission Room, Artifact diffs, mobile UI | 6, 8, 9, 12, 16 | Frontend / UX Lead |

### 5.2. Critical path

```text
Sprint 0 → Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4
          → Sprint 5 Semantic PoC Gate
          → Sprint 6 AgentRun
          → Sprint 7 Temporal
          → Sprint 8 Policy/Approval
          → Sprint 9 MVP Gate
          → Sprint 10-14 Product/Tools/Forge expansion
          → Sprint 15 Hardening
          → Sprint 16 Release Candidate
```

### 5.3. MVP and release logic

- **MVP Gate:** Sprint 9. MVP must show fast chat, AgentRun, Semantic PoC, policy/approval and traceable artifact draft.
- **Beta Gate:** after Sprints 12-14. Beta must show KnowledgeGateway, RolePasses, ArtifactWorkspace, ToolGateway and Forge path.
- **Release Candidate:** Sprint 16. RC requires full regression, evals, security review, load/chaos, rollback dry-run and V1 fallback.

---

## 6. Roadmap overview

| Sprint | Название | Главный результат | Gate |
|---|---|---|---|
| 0 | Repo hygiene and architecture lock | Чистый repo, ADR pack, feature flags, baseline | Architecture lock |
| 1 | Regression baseline | Надежные tests + fixtures + latency/security baseline | Test harness gate |
| 2 | Fast path discipline | CanonicalChatEvent + simple chat guardrails | Fast path gate |
| 3 | Model Registry | Dynamic models list + provider health/admin | Registry gate |
| 4 | Model Gateway + LiteLLM pilot | Gateway boundary + cost/routing/fallback pilot | Gateway gate |
| 5 | Semantic Protocol PoC | Claim/Boundary PoC + semantic eval seed | USP viability gate |
| 6 | Mission + AgentRun API | AgentRun state/event stream + Mission context | Runtime API gate |
| 7 | Temporal DurableRuntime | Durable workflows, approval signals, replay | Durability gate |
| 8 | Policy/Cost/Audit/Approval | Control plane in execution path | Safety gate |
| 9 | MVP Release | Fast chat + AgentRun + Semantic PoC + approvals | MVP gate |
| 10 | Knowledge Gateway | RAG modes + Citation contract | RAG architecture gate |
| 11 | RAG + Semantic Evals | Quality thresholds and nightly evals | Quality gate |
| 12 | Role Passes + Artifact Workspace | Traceable artifacts and Mission Room UX | Meaning product gate |
| 13 | MCP Tool Gateway | Versioned tool contracts and registry | Tool contract gate |
| 14 | Hybrid Sandbox / Forge | E2B sandbox for high-risk execution | Forge safety gate |
| 15 | Observability + load/chaos | Performance, reliability, cost dashboards | Hardening gate |
| 16 | Release Candidate | Migration, rollback, security sign-off | RC gate |

---

## 7. Detailed sprint plan

### Sprint 0 — Repo hygiene, architecture lock and planning reset

**Длительность:** 1 неделя  
**Цель:** Очистить репозиторий, зафиксировать v2.3 и убрать конфликтующие направления.

**Scope / задачи:**

- Закрыть или переписать PR #1; не мержить нерелевантную console utility и сломанный `.gitignore`.
- Восстановить `.gitignore`: `*.gguf`, `models_cache/`, runtime data, secrets, env-файлы, временные артефакты.
- Обновить `PROJECT_BACKLOG.md`: новая линия — fast path + AgentRun + Temporal + risk-based Forge.
- Принять ADR pack: fast path, ModelGateway/LiteLLM, Temporal, E2B/Daytona, MCP Tool Gateway, Semantic shift-left.
- Зафиксировать feature flags: `agent_runs_enabled`, `model_gateway_enabled`, `litellm_enabled`, `semantic_layer_enabled`, `knowledge_gateway_enabled`, `tool_gateway_enabled`, `sandbox_forge_enabled`, `temporal_runtime_enabled`.
- Составить current baseline: endpoints, tests, adapters, DB schema, UI gaps, latency baseline.

**Deliverables:**

- ADR pack v2.3
- Обновленный `PROJECT_BACKLOG.md`
- Baseline checklist
- Decision record по PR #1
- Release branch strategy

**Testing Gate:**

- `cd cons/chatavg && npm test`
- Smoke: login → sessions → chat completion with mocked provider
- Manual UI smoke: desktop + mobile 375px
- `node dev_studio/refresh.js` обновляет `PROJECT_MAP.md`

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 1 — Regression baseline and test harness hardening

**Длительность:** 2 недели  
**Цель:** Сделать тесты надежным сигналом перед изменением runtime/gateways/semantic-layer.

**Scope / задачи:**

- Разделить тесты на unit/integration/security/contract/smoke.
- Изолировать test DB: отдельный каталог, deterministic seed, cleanup, fixtures.
- Починить CORS/SSRF/JSON-limit/prompt-sanitization assertions.
- Добавить synthetic provider для детерминированных latency/streaming тестов.
- Снять baseline P50/P95/P99 для simple chat, fallback, session load/save.
- Собрать CI matrix: PR, nightly, release.

**Deliverables:**

- Test Matrix v1
- Fixtures pack
- Synthetic provider
- Baseline latency/security report
- CI command plan

**Testing Gate:**

- Unit config/utils/repositories
- Integration auth/session/admin/chat
- Security CORS/SSRF/payload/prompt tests
- UI smoke no console errors

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 2 — Canonical contracts and fast path discipline

**Длительность:** 2 недели  
**Цель:** Защитить simple chat fast path и стабилизировать CanonicalChatEvent.

**Scope / задачи:**

- Опубликовать SPEC-001 `CanonicalChatEvent`: delta/done/error/tool_call/retrieval/usage/trace.
- Покрыть adapters contract tests на AsyncIterable semantics.
- Запретить sandbox/live tool discovery/heavy retrieval в simple path.
- Ввести latency budgets: auth/routing, context load, provider TTFT, total latency.
- Сохранить backward compatibility `/api/chat/completions`.
- Добавить guardrail test: heavy dependencies in fast path = failure.

**Deliverables:**

- SPEC-001 CanonicalChatEvent
- Fast Path Contract
- Provider adapter contract tests
- Latency budget dashboard draft

**Testing Gate:**

- Streaming event ordering
- Non-streaming mapper
- Retryable fallback only
- Synthetic latency smoke

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 3 — Model Registry and provider administration

**Длительность:** 2 недели  
**Цель:** Закрыть pending Model Registry и подготовить Model Gateway без SDK leakage.

**Scope / задачи:**

- Реализовать production-grade `ai.models.list`: cache TTL, partial failure, provider timeout, metadata.
- Добавить `ModelRegistry`: modelId/providerId/capabilities/cost class/health/fallback eligibility.
- Сделать admin endpoint для models list/provider health.
- Синхронизировать UI status-dot с health contract.
- Описать policy видимости моделей по категориям.
- Подготовить migration note для category settings.

**Deliverables:**

- SPEC-002 ModelRegistry
- Admin models endpoint
- Provider health/status contract
- UI health update plan

**Testing Gate:**

- Mocked `ai.models.list`
- Cache hit/miss/expiry
- Provider unavailable → partial result
- UI status regression

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 4 — Model Gateway boundary with LiteLLM pilot

**Длительность:** 2 недели  
**Цель:** Выделить inference/routing в ModelGateway и запустить LiteLLM как primary gateway-кандидат.

**Scope / задачи:**

- Опубликовать SPEC-003 ModelGateway: request/stream/normalized response/usage/latency/error mapping.
- Сделать thin adapter поверх existing provider factory для backward compatibility.
- Запустить LiteLLM Proxy в dev/staging: virtual keys, routing, fallback, cost tracking.
- Добавить trace events `model.requested`, `model.stream_started`, `model.completed`, `model.failed`, `cost.committed`.
- Развести терминологию: ModelGateway ≠ MCP ToolGateway.
- Подготовить cost mapping: modelId → token price/cost class → budget policy.

**Deliverables:**

- SPEC-003 ModelGateway
- LiteLLM dev integration
- Model trace mapper
- Cost mapping v0
- Compatibility report

**Testing Gate:**

- Model request/response contract
- Streaming via ModelGateway
- Timeout/fallback/error mapper
- Cost event assertions
- Backward compatibility tests

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 5 — Semantic Protocol Proof-of-Concept — shift-left USP validation

**Длительность:** 2 недели  
**Цель:** Рано доказать, что ER Meaning Layer работает до RAG/sandbox/tool-mesh инвестиций.

**Scope / задачи:**

- Принять ADR-005 Semantic shift-left.
- Создать `SemanticProtocol` v0: glossaryVersion, strength levels, domain boundary rules, no-hidden-authority rules.
- Реализовать Claim extraction pipeline: claim type, source span, strength, level, uncertainty.
- Реализовать DomainBoundary detector and strength downgrade.
- Создать seed dataset 50-100 кейсов: legal/compliance, consulting, scientific, ambiguous, adversarial.
- Добавить semantic eval runner: claim accuracy, boundary violation, no psychodiagnosis, no hidden authority.
- Сделать UX concept: показывать 3-5 главных различений, не всю механику.

**Deliverables:**

- SPEC-004 SemanticProtocol v0
- SPEC-005 Claim/DomainBoundary v0
- EVAL-001 Semantic seed set
- Semantic PoC report
- UX sketch

**Testing Gate:**

- Semantic golden tests
- Boundary downgrade tests
- No hidden authority regression
- No psychodiagnosis regression
- Manual review 20 cases

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 6 — Mission and AgentRun API foundation

**Длительность:** 2 недели  
**Цель:** Ввести AgentRun и Mission как execution единицы, привязанные к SemanticProtocol.

**Scope / задачи:**

- Опубликовать SPEC-006 AgentRun state machine: queued/running/requires_action/waiting/completed/failed/cancelled/expired.
- Добавить Mission: missionId, semanticProtocolId, glossaryVersion, mode, goal, constraints, open questions.
- Добавить endpoints: create run, status, cancel, event stream.
- Добавить `AgentRunEvent`: run/model/retrieval/tool/approval/semantic/artifact/cost events.
- Сделать bridge: simple chat fast path, complex/mission tasks through AgentRun.
- Не смешивать SessionRepository с execution history.

**Deliverables:**

- SPEC-006 AgentRun
- SPEC-007 Mission model
- SSE event stream MVP
- AgentRun API MVP
- Semantic context attached to run

**Testing Gate:**

- State transition tests
- Event ordering
- Cancel/reconnect
- No duplicate run
- Semantic context persistence

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 7 — Durable Runtime — Temporal-first implementation

**Длительность:** 2-3 недели  
**Цель:** Внедрить Temporal рано, не строя полноценный workflow engine на SQLite.

**Scope / задачи:**

- Опубликовать SPEC-008 DurableRuntime: start/signal/cancel/wait/checkpoint/replay/query.
- Запустить Temporal dev cluster и worker для AgentRun workflows.
- Реализовать workflow: model step, semantic step, wait-for-approval timer, cancellation, retry with idempotency.
- Оставить SQLite для app DB/audit/lightweight dev fallback, не для timers/sagas/locks.
- Добавить payload policy: small events in Temporal, large artifacts external storage.
- Написать RUNBOOK-001 restart/replay/recovery.

**Deliverables:**

- SPEC-008 DurableRuntime
- Temporal worker MVP
- AgentRun workflow v0
- RUNBOOK-001
- Temporal/local fallback decision

**Testing Gate:**

- Worker restart/replay
- Approval signal
- Cancellation
- Timer/timeout
- Idempotency
- Temporal unavailable degradation

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 8 — Policy, cost, audit and approval primitives

**Длительность:** 2 недели  
**Цель:** Сделать control plane частью execution path до большого расширения tools/sandbox.

**Scope / задачи:**

- Опубликовать SPEC-009 PolicyEngine: allow/deny/require_approval/require_step_up_auth/downgrade.
- Опубликовать SPEC-010 CostPolicy and AgentRunEstimate.
- Расширить AuditService v2: model/retrieval/tool/approval/sandbox/semantic/cost events.
- Добавить ApprovalRequest states: pending/approved/rejected/edited/timeout/expired.
- Ввести risk score 0-100 and riskClass.
- Добавить redaction: secrets/sensitive payloads не попадают в prompts или model-visible traces.

**Deliverables:**

- SPEC-009 PolicyEngine
- SPEC-010 CostPolicy
- SPEC-011 ApprovalRequest
- Audit schema v2
- Risk scoring matrix

**Testing Gate:**

- Policy unit tests
- Cost estimate tests
- Approval states
- Audit assertions
- Redaction/security tests
- Approval bypass tests

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 9 — MVP release gate — Fast chat + AgentRun + Semantic PoC + Policy/Approval

**Длительность:** 2 недели  
**Цель:** Собрать первый MVP, демонстрирующий инфраструктуру и смысловую ценность.

**Scope / задачи:**

- Собрать E2E: login → fast chat → mission → AgentRun → semantic claim extraction → approval pause → artifact draft.
- Включить feature flags для internal beta users.
- Сделать MVP dashboard: run status, latency, cost, semantic events, approval events.
- Провести product review ER-layer usefulness.
- Провести security review MVP.
- Подготовить MIGRATION-001: V1 fallback and rollback to fast path.

**Deliverables:**

- MVP release notes
- MIGRATION-001
- Internal beta checklist
- MVP quality report
- Known limitations list

**Testing Gate:**

- Full MVP E2E
- Auth/session/chat/admin regression
- Security abuse tests
- Semantic eval smoke
- Manual desktop/mobile UI
- Rollback dry-run

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 10 — Knowledge Gateway and RAG modes

**Длительность:** 2 недели  
**Цель:** Вывести retrieval в mode-driven KnowledgeGateway.

**Scope / задачи:**

- Опубликовать SPEC-012 KnowledgeGateway: no_retrieval/fast/balanced/max_quality.
- Реализовать router: query classification → mode → retriever → citation validation.
- Сохранить legacy/custom retrieval as adapter path, not ChatService logic.
- Подключить cost/trace events к RAG generation.
- Добавить answerability policy для empty retrieval.
- Добавить RetrievalResult and Citation contract: sourceId, chunkId, score, provenance, boundary notes.

**Deliverables:**

- SPEC-012 KnowledgeGateway
- SPEC-013 RetrievalResult/Citation
- RAG mode router
- Answerability policy

**Testing Gate:**

- Retrieval routing
- Citation schema validation
- Empty retrieval
- Latency per mode
- RAG smoke

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 11 — RAG evals, semantic evals and quality thresholds

**Длительность:** 2 недели  
**Цель:** Перевести качество RAG и ER-layer в измеряемые gates.

**Scope / задачи:**

- Создать EVAL-002 RAG dataset: answerable/unanswerable/citation-required/multi-source/adversarial.
- Интегрировать RAGAS/TruLens-compatible metrics где уместно.
- Расширить semantic evals: claim accuracy, boundary, strength downgrade, no hidden authority.
- Добавить nightly eval pipeline: small PR smoke + full nightly + release full.
- Определить quality gates по режимам.
- Сделать human spot review protocol.

**Deliverables:**

- EVAL-002 RAG dataset
- EVAL-003 Semantic expanded dataset
- Eval runner
- Quality dashboard spec
- Human review protocol

**Testing Gate:**

- CI eval smoke
- Nightly full eval
- Manual review sample
- Regression threshold tests
- Adversarial prompt suite

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 12 — Role Passes, Artifact Workspace and Mission Room UX

**Длительность:** 2-3 недели  
**Цель:** Связать ER Meaning Layer с видимыми артефактами и рабочим UX.

**Scope / задачи:**

- Опубликовать SPEC-014 RolePass: Observer/Boundary/Language/System/Trajectory/Builder.
- Ввести Adequacy Covenant: не превышать область определения, не смешивать уровни, не говорить от имени непроверяемого.
- Реализовать ArtifactWorkspace: Artifact/ArtifactPatch/version/source claims/decision records/export state.
- Сделать patch/diff viewer.
- Реализовать Mission Room MVP: goal, context, open questions, 3-5 distinctions, conflict cards.
- Скрыть debug-механику, показывать смысловые итоги.

**Deliverables:**

- SPEC-014 RolePass
- SPEC-015 ArtifactWorkspace
- Mission Room MVP
- Artifact patch viewer
- ConflictCard/DecisionRecord v0

**Testing Gate:**

- Role contract tests
- Artifact versioning/diff
- Patch references claim/decision
- Semantic UX smoke
- No hidden authority regression

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 13 — MCP Tool Gateway and versioned Tool Registry

**Длительность:** 2 недели  
**Цель:** Подключать tools/connectors через безопасный, версионированный MCP boundary.

**Scope / задачи:**

- Опубликовать SPEC-016 MCP Tool Gateway: protocol/transport/auth/schema versioning/timeout/retry/error semantics.
- Реализовать Tool Registry cache: providerId + toolName + toolVersion + schemaHash.
- Ввести ToolDefinitionVersion: schemas/riskClass/authScope/approvalPolicyId/timeoutMs/retryPolicyId.
- Разделить risk classes: read/write/external_side_effect/code_exec/browser/privileged.
- Добавить ToolCall state machine.
- Требовать idempotencyKey для side-effect tools.

**Deliverables:**

- SPEC-016 MCP Tool Gateway
- Tool Registry MVP
- ToolCall state machine
- Fake MCP tool server
- Canary tool rollout guide

**Testing Gate:**

- JSON schema contracts
- Tool timeout/retry
- Error mapping
- Idempotency required
- Canary version
- Secrets redaction

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 14 — Hybrid Sandbox / Forge with E2B primary

**Длительность:** 3 недели  
**Цель:** Материализовать code/browser/write/high-risk actions без sandbox-per-chat default.

**Scope / задачи:**

- Опубликовать SPEC-017 SandboxManager: assign/run/snapshot/freeze/terminate/cleanup/quarantine.
- Интегрировать E2B primary; Daytona/local as dev/alternative.
- Реализовать execution classes: low-risk text/retrieval/read/write/code/browser/privileged.
- Full sandbox только для code/browser/write/high-risk.
- Реализовать workspace mount, artifact extraction, TTL, idle timeout, cleanup, snapshots.
- Добавить egress policy: default deny, tenant allowlist, provider endpoints, signed URLs.
- Добавить quarantine for suspicious artifacts.

**Deliverables:**

- SPEC-017 SandboxManager
- E2B integration MVP
- Forge v0
- Egress policy
- RUNBOOK-002 sandbox cleanup/quarantine

**Testing Gate:**

- Sandbox create/run/cleanup
- Isolation tests
- Egress deny/allow
- Artifact extraction/quarantine
- Sandbox crash recovery
- Cost/TTL enforcement

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 15 — Observability, load, chaos, multi-provider fallback and operational hardening

**Длительность:** 3 недели  
**Цель:** Доказать надежность, стоимость, observability и graceful degradation.

**Scope / задачи:**

- Собрать dashboards: cost, P95 latency, approvals, sandbox warm/cold, RAG quality, semantic quality.
- Ввести Trace Bus as source of truth; external tools only overlay.
- Load tests: fast chats, RAG chats, AgentRun streams, long workflows, tools, sandbox.
- Chaos tests: provider timeout, LiteLLM unavailable, Temporal restart, vector store unavailable, MCP down, sandbox crash.
- Multi-provider fallback pilot.
- Backpressure вместо uncontrolled provider overload.

**Deliverables:**

- Observability dashboards
- Load test report
- Chaos report
- RUNBOOK-003 backpressure
- RUNBOOK-004 provider outage
- Fallback report

**Testing Gate:**

- Load harness
- Chaos fault injection
- Recovery/replay
- Fallback model tests
- Dashboard event completeness
- DR drill

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

### Sprint 16 — Release Candidate, migration, security review and controlled rollout

**Длительность:** 2 недели  
**Цель:** Закрыть architecture/security/performance/semantic/migration gates перед production rollout.

**Scope / задачи:**

- Full regression against V1 baseline.
- Security review: prompt injection, tool escalation, cross-tenant leakage, egress, secrets, approval bypass.
- Full eval: RAG, semantic, role passes, artifacts, tool approvals, refusal/recovery.
- Подготовить MIGRATION-002: feature flags, shadow, canary, rollback.
- Подготовить runbooks для Temporal/LiteLLM/E2B/Knowledge/ToolGateway/cost spike.
- Rollback dry-run and backup/restore drill.
- Release sign-off: Architecture, Backend, Frontend, QA/Evals, Security, DevOps, Product.

**Deliverables:**

- Release candidate report
- MIGRATION-002
- Security sign-off
- Full eval report
- Production checklist
- Post-release backlog

**Testing Gate:**

- Full E2E
- Security red-team suite
- Load/chaos release gate
- Backup/restore/rollback drill
- Manual visual UI gate

**Exit Criteria:** все deliverables приняты, testing gate прошел, `PROJECT_MAP.md` и `PROJECT_BACKLOG.md` обновлены, изменения закрыты за feature flags или documented migration boundary.

---

## 8. Testing strategy

Тестирование является частью архитектуры, а не финальной стадией. Агентская платформа имеет больше failure modes, чем request/response backend: provider timeouts, partial streams, workflow replay, approval waits, tool side effects, sandbox crashes, retrieval hallucinations and semantic overreach.

### 8.1. Test levels

| Уровень | Что проверяет | Где запускать | Blocking policy |
|---|---|---|---|
| Unit | Domain types, mappers, policies, state machines, cost estimator, semantic rules | PR | Блокирует PR |
| Contract | CanonicalChatEvent, ModelGateway, AgentRunEvent, ToolDefinitionVersion, MCP schemas | PR | Блокирует PR |
| Integration | Core → ModelGateway, Core → Temporal worker, DB, audit/cost events, KnowledgeGateway mock | PR / staging | Блокирует merge в release branch |
| E2E | login → session → fast chat → AgentRun → approval → artifact | PR smoke + release full | Блокирует release |
| Security | CORS, SSRF, prompt injection, tool output injection, approval bypass, secrets leakage, egress | PR smoke + release full | Zero critical allowed |
| RAG evals | answerability, context precision/recall, citation correctness, hallucination, latency/cost | nightly + release | Блокирует release по threshold |
| Semantic evals | Claim extraction, DomainBoundary, strength downgrade, no hidden authority, no psychodiagnosis | PR smoke + nightly | Блокирует MVP/RC gates |
| Load | concurrent chats, event-stream fanout, queue/backpressure, sandbox allocation | staging/release | Блокирует RC |
| Chaos | provider timeout, Temporal worker restart, vector store unavailable, MCP down, sandbox crash | staging/release | Блокирует RC |
| Visual/UI | desktop, mobile 375px, approval UI, Mission Room, artifact diff | sprint closure | Блокирует sprint closure |

### 8.2. CI pipeline

```text
PR pipeline:
  npm run lint
  npm run test:unit
  npm run test:contract
  npm run test:security:smoke
  npm run test:integration:smoke
  npm run eval:semantic:smoke

Nightly pipeline:
  npm run test:integration:full
  npm run eval:rag:full
  npm run eval:semantic:full
  npm run test:security:abuse
  npm run test:load:small

Release pipeline:
  full regression
  full RAG eval
  full Semantic eval
  full E2E browser suite
  load + chaos
  rollback dry-run
  security sign-off
```

### 8.3. Quality thresholds for release gates

| Area | MVP target | RC target |
|---|---:|---:|
| Fast path TTFT P95 on synthetic provider | no regression vs baseline | no regression vs baseline |
| Simple chat no sandbox/tool/RAG guardrail | 100% | 100% |
| AgentRun duplicate creation on reconnect | 0 | 0 |
| Approval bypass for high-risk actions | 0 | 0 |
| Claim extraction accuracy on golden set | ≥ 80-85% | ≥ 90% |
| DomainBoundary violation detection | ≥ 80% | ≥ 90% |
| No hidden authority critical violations | 0 | 0 |
| RAG citation correctness | smoke only | ≥ 90-95% after corpus calibration |
| Side-effect tool idempotency coverage | 100% for enabled tools | 100% |
| Sandbox isolation leakage | 0 | 0 |
| Cost event coverage for model/tool/sandbox | ≥ 95% | ≥ 99% |
| Rollback dry-run | documented | executed successfully |

---

## 9. Release gates

| Gate | Название | Exit criteria |
|---|---|---|
| A | Architecture Lock | ADR pack accepted, old sandbox-per-chat default removed, feature flags ready, V1 fallback documented. |
| B | Fast Path Safety | Simple chat route protected, backward compatibility proven, fallback does not bypass policy. |
| C | Semantic Viability | Claim/DomainBoundary PoC passes golden set, no hidden authority, product usefulness confirmed. |
| D | MVP | Fast chat + AgentRun + Semantic PoC + Policy/Approval works end-to-end with rollback. |
| E | Beta | KnowledgeGateway, RolePasses, ArtifactWorkspace, ToolGateway and Forge v0 pass gates. |
| F | Release Candidate | Security, evals, load/chaos, rollback dry-run and runbooks signed off. |

---

## 10. Risk register

| Risk | Вероятность | Влияние | Mitigation | Owner |
|---|---|---|---|---|
| Late USP risk: ER-layer проверяется слишком поздно | Высокая | Критическое | Sprint 5 Semantic PoC gate | Product + Semantic Lead |
| Команда застрянет на самописном SQLite workflow engine | Средняя | Высокое | Temporal-first Sprint 7, SQLite only app DB/audit/fallback | Tech Lead |
| LiteLLM интеграция задержит ModelGateway | Средняя | Среднее | Thin compatibility adapter first, LiteLLM feature flag | Backend Lead |
| Fast path замедлится из-за AgentRun/Temporal overhead | Средняя | Высокое | Guardrail tests: no sandbox/RAG/tool discovery in simple path | Performance Lead |
| Semantic evals требуют много ручной разметки | Высокая | Среднее | Seed dataset early, LLM-as-judge + human spot review | Evals Lead |
| Approval fatigue | Высокая | Высокое | Grouped approvals, edit-then-approve, smart defaults | UX Lead |
| RAG quality ниже ожиданий | Средняя | Высокое | RAGAS/TruLens metrics, nightly evals, no ensemble default | ML/Evals Lead |
| Tool schema drift | Средняя | Среднее | schemaHash, canary rollout, contract tests | Backend Lead |
| Prompt injection через tool output | Высокая | Высокое | Output validation, redaction, policy checks, adversarial tests | Security Lead |
| Sandbox cost explosion | Высокая | Среднее | Risk-based sandbox, TTL, budgets, warm-pool metrics | DevOps Lead |
| Cross-tenant leakage | Низкая | Критическое | Isolation tests, scoped credentials, audit review | Security Lead |
| Temporal operational complexity | Средняя | Среднее | Dev cluster early, runbooks, team training, fallback mode | SRE Lead |
| Model provider outage | Средняя | Высокое | ModelGateway fallback, second provider pilot Sprint 15 | Backend/SRE |
| UI exposes too much internal machinery | Средняя | Среднее | “3-5 distinctions” UX rule, usability review | UX Lead |
| Meaning layer becomes mystical/overconfident | Средняя | Критическое | No hidden authority evals, Adequacy Covenant, Language Pass | Semantic Lead |
| Release rollback fails | Низкая | Критическое | MIGRATION-002 + rollback dry-run before RC | DevOps Lead |

---

## 11. Backlog artifacts

### ADRs

- ADR-001: Fast path + evolutionary migration boundary.
- ADR-002: ModelGateway with LiteLLM primary and provider-neutral core.
- ADR-003: DurableRuntime with Temporal primary.
- ADR-004: Risk-based sandbox / E2B primary + Daytona alternative.
- ADR-005: Semantic shift-left and ER Meaning Layer viability gate.
- ADR-006: MCP ToolGateway scope and versioned Tool Registry.
- ADR-007: KnowledgeGateway modes and no ensemble default.
- ADR-008: Policy/Cost/Audit as execution control plane.

### SPECs

- SPEC-001: CanonicalChatEvent.
- SPEC-002: ModelRegistry.
- SPEC-003: ModelGateway.
- SPEC-004: SemanticProtocol.
- SPEC-005: ClaimLedger and DomainBoundary.
- SPEC-006: AgentRun state machine.
- SPEC-007: Mission model.
- SPEC-008: DurableRuntime interface.
- SPEC-009: PolicyEngine.
- SPEC-010: CostPolicy and AgentRunEstimate.
- SPEC-011: ApprovalRequest.
- SPEC-012: KnowledgeGateway.
- SPEC-013: RetrievalResult and Citation.
- SPEC-014: RolePass contract.
- SPEC-015: ArtifactWorkspace.
- SPEC-016: MCP ToolGateway and ToolDefinitionVersion.
- SPEC-017: SandboxManager and Forge.

### EVALs

- EVAL-001: Semantic seed set.
- EVAL-002: RAG answerability/citations dataset.
- EVAL-003: Semantic adversarial set.
- EVAL-004: Tool approval and bypass dataset.
- EVAL-005: Artifact traceability dataset.
- EVAL-006: Recovery/refusal/degradation dataset.

### RUNBOOKs and migrations

- RUNBOOK-001: Temporal restart/replay/recovery.
- RUNBOOK-002: Sandbox cleanup/quarantine failure.
- RUNBOOK-003: High queue depth/backpressure.
- RUNBOOK-004: Model provider outage / LiteLLM unavailable.
- RUNBOOK-005: KnowledgeGateway/vector store unavailable.
- RUNBOOK-006: Cost spike / quota exceeded.
- RUNBOOK-007: Security incident: tool escalation or data leakage.
- MIGRATION-001: MVP rollout with V1 fallback.
- MIGRATION-002: Production rollout and rollback.
- MIGRATION-003: Data migration for Mission/AgentRun/Semantic traces.
- MIGRATION-004: Provider configuration migration to ModelRegistry/ModelGateway.

---

## 12. Definition of Done

### Sprint DoD

Every sprint closes only when:

- Scope is merged behind feature flags where appropriate.
- Unit/contract/integration tests for affected area pass.
- Security smoke tests pass for changed boundaries.
- Manual UI smoke is done on desktop and 375px mobile.
- `PROJECT_MAP.md` is updated with `node dev_studio/refresh.js`.
- `PROJECT_BACKLOG.md` is updated with completed items, files touched and date.
- Any new public/internal contract has SPEC or ADR update.
- No new direct provider SDK leakage into Core without ADR.
- No hidden authority or unsafe depth handling introduced by semantic changes.

### Architecture DoD

- AgentRuntime, ModelGateway, KnowledgeGateway, MCP ToolGateway, SandboxManager and PolicyEngine are separated.
- AgentRun supports retry/resume/cancel/approval wait without duplicated side effects.
- Simple chat remains fast path and does not allocate sandbox.
- All side-effect ToolCalls have idempotencyKey.
- Model/cost/audit events are emitted consistently.

### Meaning-first DoD

- Every strong claim has type, level, strength and domain boundary.
- The system can downgrade claims when evidence is insufficient.
- Role passes produce bounded patches, not theatrical debate.
- ConflictCards return value/trajectory choices to the human.
- Artifacts contain traceable decisions and open boundaries.

### Security/Cost DoD

- High-risk actions require approval and audit.
- Sandbox egress is default-deny.
- Secrets are scoped and never model-visible.
- Budget policies can stop, downgrade or request approval.
- Cost per successful chat is a top-level dashboard metric.

---

## 13. Migration and rollout

### Rollout controls

- Feature flags by tenant, workspace, user and agent profile.
- V1 fallback for critical tenants and high-risk workflows.
- Shadow mode for ModelGateway routing and RAG answers before production use.
- A/B comparison on latency, cost, success rate, approval conversion, semantic quality and retention.
- Canary rollout for ToolDefinitionVersion and provider changes.
- Rollback procedure tested before production enablement.

### Migration phases

| Phase | Scope | Exit criteria |
|---|---|---|
| Phase 0 | Repo hygiene, tests, fast path, ModelGateway pilot | No regression vs V1 baseline |
| Phase 1 | Semantic PoC + AgentRun + Temporal + policy | MVP gate passed |
| Phase 2 | KnowledgeGateway + evals + Role/Artifact UX | Beta gate passed |
| Phase 3 | MCP ToolGateway + Forge/Sandbox | Tool/Forge gates passed |
| Phase 4 | Observability + load/chaos + multi-provider fallback | RC gate passed |
| Phase 5 | Tenant-by-tenant production rollout | Rollback ready, owner matrix active |

---

## 14. Team roles and ownership

| Role | Responsibilities |
|---|---|
| Tech Lead / Architect | ADRs, boundaries, critical reviews, release gate authority. |
| Backend Lead | ModelGateway, AgentRun API, PolicyEngine, ToolGateway contracts. |
| Runtime Engineer | Temporal workflows, worker lifecycle, replay/recovery. |
| Semantic Lead | SemanticProtocol, ClaimLedger, DomainBoundary, RolePass contracts. |
| ML/Evals Engineer | RAG evals, semantic evals, regression thresholds, human review protocol. |
| Frontend/UX Lead | AgentRun status, approvals, Mission Room, Artifact diffs, mobile UX. |
| Security Engineer | Threat model, approval bypass, prompt/tool injection, sandbox egress, secrets. |
| DevOps/SRE | CI/CD, Temporal/LiteLLM/E2B deployment, observability, rollback, runbooks. |
| Product Manager | Scope control, MVP/beta criteria, user feedback, prioritization. |

---

## 15. Immediate next actions

1. Update `PROJECT_BACKLOG.md` to v2.3 and mark old sandbox-per-chat default as superseded.
2. Close or rewrite PR #1; restore `.gitignore` protections before any feature work.
3. Create ADR-005 Semantic shift-left and make Sprint 5 a formal product/architecture gate.
4. Create `docs/specs/SPEC-001-canonical-chat-event.md` and `docs/specs/SPEC-004-semantic-protocol.md`.
5. Split tests into stable commands and introduce synthetic provider.
6. Create first 50 semantic golden cases before building advanced RAG.
7. Start LiteLLM dev proxy only behind feature flag.
8. Start Temporal dev cluster before implementing custom workflow logic.
9. Define MVP demo script for Sprint 9 now, not during Sprint 9.
10. Add a release gate dashboard skeleton early: latency, cost, failures, approvals, semantic quality.

---

## 16. Final planning formula

```text
ChatAVG v2.3 delivery =
  Repo discipline
  + reliable tests
  + protected fast path
  + ModelGateway/LiteLLM
  + early SemanticProtocol PoC
  + AgentRun/Temporal
  + Policy/Cost/Audit/Approval
  + KnowledgeGateway/Evals
  + RolePasses/ArtifactWorkspace
  + MCP ToolGateway
  + risk-based Forge/E2B
  + load/chaos/security rollout gates
```

Главный критерий успеха: ChatAVG не должен стать просто еще одной агентской платформой. Он должен доказать, что умеет работать с силой утверждений, границами применимости, человеческими развилками и traceable artifacts лучше, чем обычный чат или обычный tool-calling framework.
