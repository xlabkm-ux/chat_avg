# 📋 Центральный бэклог (PROJECT_BACKLOG.md) - ChatAVG v2.3

Текущая стадия: **Sprint 7 — Durable Runtime — Temporal-first**
Эталонный план: [`workdoc/ChatAVG_v2.3_Optimized_Delivery_Plan_Sprints_Testing.md`](workdoc/ChatAVG_v2.3_Optimized_Delivery_Plan_Sprints_Testing.md)

---

## ✅ Завершённые спринты

### Sprint 0: Repo Hygiene and Architecture Lock — ✅ Завершён 2026-05-07
*Цель: Очистить репозиторий, зафиксировать v2.3 и убрать конфликтующие направления.*

**Задачи:**
- [x] ✅ Создать структуру документации (`docs/`) — 2026-05-07
- [x] ✅ Подготовить `ARCHITECTURE_OVERVIEW_V2_3.md`, `ADR_INDEX.md`, `GLOSSARY.md` — 2026-05-07
- [x] ✅ Обновить `AGENT.md` — 2026-05-07
- [x] ✅ Обновить `.gitignore` (добавить БД и временные файлы) — 2026-05-07
- [x] ✅ Обновить и проверить `PROJECT_MAP.md` (скриптом refresh.js) — 2026-05-07
- [x] ✅ Сформировать `REGRESSION_BASELINE.md` и `THREAT_MODEL.md` — 2026-05-07
- [x] ✅ Подготовить `LOCAL_DEVELOPMENT_SETUP.md` — 2026-05-07
- [x] ✅ Настроить базовые Feature Flags в коде — 2026-05-07

**Файлы:** `src/core/config.js` (8 feature flags: `SEMANTIC_LAYER_ENABLED`, `AGENT_RUNS_ENABLED`, `MODEL_GATEWAY_ENABLED`, `LITELLM_ENABLED`, `KNOWLEDGE_GATEWAY_ENABLED`, `TOOL_GATEWAY_ENABLED`, `SANDBOX_FORGE_ENABLED`, `TEMPORAL_RUNTIME_ENABLED`), `docs/*`, `.gitignore`
**Deliverables:** ADR pack v2.3, обновлённый `PROJECT_BACKLOG.md`, Baseline checklist, Feature Flags (все 8 флагов).
**Testing Gate:** `npm test` pass, `node dev_studio/refresh.js` обновляет `PROJECT_MAP.md` — pass.

---

### Sprint 1: Regression Baseline & Environment — ✅ Завершён 2026-05-07
*Цель: Сделать тесты надёжным сигналом перед изменением runtime/gateways/semantic-layer.*

**Задачи:**
- [x] ✅ Настройка базовых тестов и фикстур (Test harness) — 2026-05-07
- [x] ✅ Environment secrets config (правила работы с .env) — 2026-05-07
- [x] ✅ Обновление UI Audit (мобильная верстка, safe-area) — 2026-05-07
- [x] ✅ CORS/SSRF/JSON-limit/prompt-sanitization assertions — 2026-05-07
- [x] ✅ Synthetic provider для детерминированных тестов — 2026-05-07
- [x] ✅ Baseline P50/P95/P99 latency (через synthetic provider) — 2026-05-07
- [x] ✅ CI matrix: PR/nightly/release pipelines — 2026-05-07
- [x] ✅ Test Matrix v1 — 2026-05-07

**Файлы:** `tests/*.test.js`, `tests/mocks/deterministic_provider.js`, `tests/security_assertions.test.js`, `tests/latency_baseline.test.js`, `server.js`, `package.json`, `docs/07_security/ENVIRONMENT_SECRETS.md`, `docs/06_testing/TEST_MATRIX_V1.md`, `UI_AUDIT.md`
**Итог:** Исправлены зависания тестов (очистка event loop), создана документация для `.env`, реализованы SSRF/CORS/injection assertions (12 тестов), synthetic provider с замером P50/P95/P99, CI matrix с 14 npm scripts. Test Matrix v1 документирует все уровни тестирования.

**Deliverables:** Test harness, Environment secrets doc, Test Matrix v1, Fixtures pack, Synthetic provider, Baseline latency report, CI command plan.
**Testing Gate:** Unit (7) + contract (9) + security (24) + latency (4) + integration — all pass.
**Latency Baseline:** P50: 0.07ms, P95: 0.69ms, P99: 1.22ms (synthetic, zero-delay).

---

### Sprint 2: Fast Path Discipline — ✅ Завершён 2026-05-07
*Цель: Защитить simple chat fast path и стабилизировать CanonicalChatEvent.*

**Задачи:**
- [x] ✅ Зафиксировать `CanonicalChatEvent` (контракт потокового ответа) — 2026-05-07
- [x] ✅ Опубликовать SPEC-001 CanonicalChatEvent — 2026-05-07
- [x] ✅ Изолировать "Быстрый путь" чата от тяжелого RAG и песочниц — 2026-05-07
- [x] ✅ Реализовать контракт ошибок (Error Contract) — 2026-05-07
- [x] ✅ Contract tests на AsyncIterable semantics — 2026-05-07
- [x] ✅ Guardrail test: heavy dependencies in fast path = failure — 2026-05-07
- [x] ✅ Latency budgets определены — 2026-05-07

**Файлы:** `providerEvents.js`, `providerErrors.js`, `chat.service.js`, `tests/contract_canonical_event.test.js`, `tests/fast_path_guardrail.test.js`, `docs/04_specs/SPEC-001-CANONICAL_CHAT_EVENT.md`
**Итог:** Реализован строгий интерфейс потоковых событий (SPEC-001). 8 AsyncIterable contract tests + 7 fast path guardrail tests — все pass. Latency budgets: auth 10ms, context 20ms, TTFT 2000ms, total fast path 3000ms.

**Deliverables:** SPEC-001 CanonicalChatEvent, Fast Path Contract, Provider adapter contract tests (8), Latency budget definitions.
**Testing Gate:** Streaming event ordering — pass, AsyncIterable contract — pass, fast path guardrail — pass.

---

### Sprint 3: Model Registry — ✅ Завершён 2026-05-07
*Цель: Закрыть pending Model Registry и подготовить Model Gateway без SDK leakage.*

**Задачи:**
- [x] ✅ Разработать API динамического списка моделей (`MODEL_REGISTRY_API`)
- [x] ✅ Внедрить проверку "здоровья" (health) AI-провайдеров
- [x] ✅ Опубликовать SPEC-002 ModelRegistry — 2026-05-07

**Файлы:** `providers.routes.js`, `base.provider.js`, `openai_compat.js`, `openai_responses_compat.js`, `llamacpp.js`, `mcp.js`, `docs/04_specs/SPEC-002-MODEL_REGISTRY.md`
**Итог:** Реализованы API `/api/providers/:id/models` и `/api/providers/:id/health`. Добавлены методы `getModels` и обновлен `checkHealth`. Формализован SPEC-002 с описанием API endpoints, provider interface и health contract.

**Deliverables:** SPEC-002 ModelRegistry, Admin models endpoint, Provider health/status contract.
**Testing Gate:** Mocked `ai.models.list` — pass.

---

### Sprint 4: Model Gateway (LiteLLM Pilot) — ✅ Завершён 2026-05-07
*Цель: Выделить inference/routing в ModelGateway и запустить LiteLLM как primary gateway-кандидат.*

**Задачи:**
- [x] ✅ Развернуть LiteLLM Proxy как основной Model Gateway — 2026-05-07
- [x] ✅ Настроить routing, fallbacks и учет стоимости токенов — 2026-05-07
- [x] ✅ Опубликовать SPEC-003 ModelGateway — 2026-05-07
- [x] ✅ Задокументировать терминологию ModelGateway ≠ MCP ToolGateway — 2026-05-07

**Файлы:** `cons/litellm_gateway/litellm_config.yaml`, `cons/litellm_gateway/start_proxy.cmd`, `cons/chatavg/src/core/providers.config.js`, `docs/04_specs/SPEC-003-MODEL_GATEWAY.md`
**Документация:** ADR-002 (ModelGateway/LiteLLM), SPEC-003 ModelGateway
**Итог:** Развернута конфигурация LiteLLM Proxy, настроена маршрутизация с fallback. Провайдер `litellm` добавлен в ChatAVG. SPEC-003 формализует архитектуру gateway, терминологию и planned trace events.

**Deliverables:** SPEC-003 ModelGateway, LiteLLM dev integration, ADR-002, Compatibility report (в SPEC-003).
**Testing Gate:** Model request/response — pass, backward compatibility — pass.

**Planned for Sprint 6+:** Trace events (`model.requested`, `model.stream_started`, `model.completed`, `model.failed`, `cost.committed`).

---

### Sprint 5: Semantic Protocol PoC (Critical Gate) — ✅ Завершён 2026-05-07
*Цель: Рано доказать, что ER Meaning Layer работает до RAG/sandbox/tool-mesh инвестиций.*

**Задачи:**
- [x] ✅ Реализовать `Claim Ledger` (извлечение утверждений) — 2026-05-07
- [x] ✅ Внедрить `Domain Boundary Rules` (границы адекватности) — 2026-05-07
- [x] ✅ Подготовить `Semantic Eval Golden Set` (набор тестов) — 2026-05-07
- [x] ✅ Расширить Golden Set до 57 кейсов (с начальных 34) — 2026-05-07
- [x] ✅ Подготовить UX sketch (правило «3-5 различений») — 2026-05-07

**Файлы:** `src/modules/semantic/semantic.protocol.js`, `claim.extractor.js`, `domain.boundary.js`, `claim.ledger.js`, `semantic.events.js`, `src/core/config.js`, `src/modules/chat/chat.service.js`, `tests/semantic/golden_set.json`, `tests/semantic/semantic.eval.js`, `tests/semantic/claim_extraction.test.js`, `tests/semantic/domain_boundary.test.js`, `docs/08_ux/SEMANTIC_UX_SKETCH.md`
**Документация:** `ADR-005`, `SPEC-004`, `SPEC-005`, `SEMANTIC_POC_REPORT.md`, `SEMANTIC_UX_SKETCH.md`
**Итог:** Реализован PoC смыслового слоя (ER Meaning Layer). Claim extraction pipeline извлекает утверждения с типом/силой/уровнем. 5 Domain Boundaries с автоматическим strength downgrade. Блокировка психодиагностики и скрытого авторитета. Golden Set: 57 кейсов (включая научные, консалтинговые, неоднозначные и adversarial), accuracy 84.5% (49/58). Original 34 cases — 100%. Feature flag `SEMANTIC_LAYER_ENABLED`. 31 unit test + 21 regression test — все pass.

**Deliverables:** SPEC-004, SPEC-005, EVAL-001 (57 cases), ADR-005, Semantic PoC Report, UX Sketch.
**Testing Gate:** Semantic golden tests — pass (84.5% на 57 кейсах, ≥80% MVP target), boundary downgrade — pass, no hidden authority regression — pass, no psychodiagnosis regression — pass.

---

## 🏁 Текущий спринт

### Sprint 6: Mission + AgentRun API — ✅ Завершён 2026-05-07
*Цель: Ввести AgentRun и Mission как execution единицы, привязанные к SemanticProtocol.*

**Задачи:**
- [x] ✅ Опубликовать SPEC-006 AgentRun state machine (queued/running/requires_action/waiting/completed/failed/cancelled/expired) — 2026-05-07
- [x] ✅ Добавить Mission model: missionId, semanticProtocolId, glossaryVersion, mode, goal, constraints, open questions — 2026-05-07
- [x] ✅ Реализовать endpoints: create run, status, cancel, event stream — 2026-05-07
- [x] ✅ Добавить `AgentRunEvent` контракт: run/model/retrieval/tool/approval/semantic/artifact/cost events — 2026-05-07
- [x] ✅ Сделать bridge: simple chat → fast path, complex/mission tasks → AgentRun — 2026-05-07
- [x] ✅ Не смешивать SessionRepository с execution history — 2026-05-07

**Файлы:** `src/modules/mission/mission.repository.js`, `src/modules/mission/mission.routes.js`, `src/modules/execution/run.repository.js`, `src/modules/execution/run.service.js`, `src/modules/execution/execution.routes.js`, `src/modules/chat/chat.service.js`, `docs/04_specs/SPEC-006-AGENT_RUN_STATE_MACHINE.md`, `docs/04_specs/SPEC-007-AGENT_RUN_EVENT.md`, `docs/04_specs/SPEC-008-MISSION_MODEL.md`, `tests/agent_run.test.js`
**Итог:** Реализована архитектура Missions и AgentRuns. Missions служат контейнером контекста, AgentRuns управляют жизненным циклом исполнения (8 состояний). Реализован SSE-стрим событий. Сделан bridge в ChatService: если в запросе передан `runId`, события дублируются в стрим агента и обновляется его стейт.
**Deliverables:** SPEC-006, SPEC-007, SPEC-008, SSE event stream MVP, AgentRun API MVP, Semantic context attached to run.
**Testing Gate:** State transition tests (queued->running->completed) — pass, event stream accessibility — pass, cancel run — pass.

---

## 🔜 Дорожная карта (Roadmap)

### Sprint 7: Durable Runtime — Temporal-first — ✅ Завершён 2026-05-07
*Цель: Внедрить Temporal рано, не строя полноценный workflow engine на SQLite.*

- [x] ✅ Опубликовать SPEC-009 DurableRuntime: start/signal/cancel/wait/checkpoint/replay/query (переименовано с SPEC-008) — 2026-05-07
- [x] ✅ Запустить Temporal dev cluster и worker для AgentRun workflows — 2026-05-07
- [x] ✅ Реализовать workflow: model step → semantic step → wait-for-approval → cancellation → retry — 2026-05-07
- [x] ✅ SQLite только для app DB/audit/lightweight dev fallback (не для timers/sagas/locks) — 2026-05-07
- [x] ✅ Добавить payload policy: small events в Temporal, large artifacts → external storage — 2026-05-07
- [x] ✅ Написать RUNBOOK-001 restart/replay/recovery — 2026-05-07

**Файлы:** `src/modules/temporal/workflows.js`, `src/modules/temporal/activities.js`, `src/modules/temporal/worker.js`, `src/modules/temporal/client.js`, `src/modules/execution/run.service.js`, `package.json`, `docs/04_specs/SPEC-009-DURABLE_RUNTIME.md`, `docs/09_runbooks/RUNBOOK-001-TEMPORAL_RECOVERY.md`
**Deliverables:** SPEC-009, Temporal worker MVP, AgentRun workflow v0, RUNBOOK-001.
**Testing Gate:** Worker restart/replay, approval signal, cancellation, Temporal unavailable degradation.

---

### Sprint 8: Policy, Cost, Audit and Approval Primitives — ✅ Завершён 2026-05-07
*Цель: Сделать control plane частью execution path до расширения tools/sandbox.*

- [x] ✅ Опубликовать SPEC-011 PolicyEngine: allow/deny/require_approval/require_step_up_auth/downgrade — 2026-05-07
- [x] ✅ Опубликовать SPEC-012 CostPolicy and AgentRunEstimate — 2026-05-07
- [x] ✅ Опубликовать SPEC-013 ApprovalRequest states: pending/approved/rejected/edited/timeout/expired — 2026-05-07
- [x] ✅ Расширить AuditService v2: model/retrieval/tool/approval/sandbox/semantic/cost events — 2026-05-07
- [x] ✅ Ввести risk score 0-100 и riskClass — 2026-05-07
- [x] ✅ Добавить redaction: secrets/sensitive payloads не в prompts и не model-visible — 2026-05-07

**Файлы:** `src/modules/policy/policy.engine.js`, `src/modules/policy/redaction.service.js`, `src/modules/policy/approval.service.js`, `src/modules/execution/cost.service.js`, `src/modules/audit/audit.service.js`, `docs/04_specs/SPEC-011-POLICY_ENGINE.md`, `docs/04_specs/SPEC-012-COST_POLICY.md`, `docs/04_specs/SPEC-013-APPROVAL_REQUEST.md`, `tests/policy/*.test.js`
**Итог:** Реализованы Policy Engine (Risk scoring and classes), Cost Service, Approval Request state machine (pending/approved/rejected/edited/expired). Обновлен Audit Service с интеграцией RedactionService для автоматического маскирования ключей и токенов. Опубликованы соответствующие спецификации. Тесты политик проходят успешно.
**Deliverables:** SPEC-011 PolicyEngine, SPEC-012 CostPolicy, SPEC-013 ApprovalRequest, Audit schema v2, Risk scoring matrix.
**Testing Gate:** Policy unit tests, cost estimate tests, approval states, audit assertions, redaction/security, approval bypass tests — pass.

---

### Sprint 9: MVP Release Gate — ✅ Завершён 2026-05-07
*Цель: Собрать первый MVP — Fast chat + AgentRun + Semantic PoC + Policy/Approval.*

- [x] ✅ E2E: login → fast chat → mission → AgentRun → semantic claim extraction → approval pause → artifact draft — 2026-05-07
- [x] ✅ Включить feature flags для internal beta users — 2026-05-07
- [x] ✅ MVP dashboard: run status, latency, cost, semantic events, approval events — 2026-05-07
- [x] ✅ Product review ER-layer usefulness — 2026-05-07
- [x] ✅ Security review MVP — 2026-05-07
- [x] ✅ Подготовить MIGRATION-001: V1 fallback and rollback to fast path — 2026-05-07

**Файлы:** `tests/e2e_mvp_gate.test.js`, `src/modules/admin/admin.routes.js`, `docs/09_runbooks/MIGRATION-001-V1_FALLBACK.md`, `docs/05_delivery/MVP_SECURITY_REVIEW.md`, `docs/05_delivery/PRODUCT_REVIEW_ER_LAYER.md`
**Итог:** Завершён Release Gate MVP. Разработан MVP Dashboard, покрыт тестами E2E (auth, fast chat, mission, agent run, semantic extraction, approvals). Составлены отчеты об аудите продукта и безопасности. Готова инструкция по MIGRATION-001 (откат на V1).
**Deliverables:** MVP release notes, MIGRATION-001, internal beta checklist, MVP quality report, known limitations list.
**Testing Gate:** Full MVP E2E, auth/session/chat/admin regression, security abuse tests, semantic eval smoke, manual desktop/mobile UI, rollback dry-run.
**Release Gate:** MVP Gate (Gate D по Delivery Plan) — ✅ Пройден.

---

### Sprint 10: Knowledge Gateway and RAG Modes
*Цель: Вывести retrieval в mode-driven KnowledgeGateway.*

- [ ] 🔲 Опубликовать SPEC-014 KnowledgeGateway: no_retrieval/fast/balanced/max_quality
- [ ] 🔲 Реализовать router: query classification → mode → retriever → citation validation
- [ ] 🔲 Legacy/custom retrieval как adapter path, не ChatService logic
- [ ] 🔲 Cost/trace events для RAG generation
- [ ] 🔲 Answerability policy для empty retrieval
- [ ] 🔲 Опубликовать SPEC-015 RetrievalResult и Citation contract: sourceId, chunkId, score, provenance, boundary notes

**Deliverables:** SPEC-014 KnowledgeGateway, SPEC-015 RetrievalResult/Citation, RAG mode router, Answerability policy.
**Testing Gate:** Retrieval routing, citation schema validation, empty retrieval, latency per mode, RAG smoke.

---

### Sprint 11: RAG + Semantic Evals and Quality Thresholds
*Цель: Перевести качество RAG и ER-layer в измеряемые gates.*

- [ ] 🔲 Создать EVAL-002 RAG dataset: answerable/unanswerable/citation-required/multi-source/adversarial
- [ ] 🔲 Интегрировать RAGAS/TruLens-compatible metrics
- [ ] 🔲 Расширить semantic evals: claim accuracy, boundary, strength downgrade, no hidden authority
- [ ] 🔲 Расширить Golden Set до 100 кейсов (с текущих 57)
- [ ] 🔲 Добавить nightly eval pipeline: small PR smoke + full nightly + release full
- [ ] 🔲 Определить quality gates по режимам
- [ ] 🔲 Human spot review protocol

**Deliverables:** EVAL-002, EVAL-003 Semantic expanded dataset, Eval runner, Quality dashboard spec, Human review protocol.
**Testing Gate:** CI eval smoke, nightly full eval, manual review sample, regression threshold tests, adversarial prompt suite.
**Release Gate:** Quality Gate (блокирует MVP/RC).

---

### Sprint 12: Role Passes, Artifact Workspace and Mission Room UX
*Цель: Связать ER Meaning Layer с видимыми артефактами и рабочим UX.*

- [ ] 🔲 Опубликовать SPEC-016 RolePass: Observer/Boundary/Language/System/Trajectory/Builder
- [ ] 🔲 Ввести Adequacy Covenant: не превышать область определения, не смешивать уровни
- [ ] 🔲 Опубликовать SPEC-017 ArtifactWorkspace: Artifact/ArtifactPatch/version/source claims/decision records/export
- [ ] 🔲 Patch/diff viewer
- [ ] 🔲 Mission Room MVP: goal, context, open questions, 3-5 distinctions, conflict cards
- [ ] 🔲 Скрыть debug-механику, показывать смысловые итоги

**Deliverables:** SPEC-016 RolePass, SPEC-017 ArtifactWorkspace, Mission Room MVP, Artifact patch viewer, ConflictCard/DecisionRecord v0.
**Testing Gate:** Role contract tests, artifact versioning/diff, patch references claim/decision, semantic UX smoke, no hidden authority regression.

---

### Sprint 13: MCP Tool Gateway and Versioned Tool Registry
*Цель: Подключать tools/connectors через безопасный, версионированный MCP boundary.*

- [ ] 🔲 Опубликовать SPEC-018 MCP Tool Gateway: protocol/transport/auth/schema versioning/timeout/retry/error
- [ ] 🔲 Реализовать Tool Registry cache: providerId + toolName + toolVersion + schemaHash
- [ ] 🔲 ToolDefinitionVersion: schemas/riskClass/authScope/approvalPolicyId/timeoutMs/retryPolicyId
- [ ] 🔲 Разделить risk classes: read/write/external_side_effect/code_exec/browser/privileged
- [ ] 🔲 ToolCall state machine
- [ ] 🔲 Требовать idempotencyKey для side-effect tools

**Deliverables:** SPEC-018 MCP Tool Gateway, Tool Registry MVP, ToolCall state machine, Fake MCP tool server, Canary tool rollout guide.
**Testing Gate:** JSON schema contracts, tool timeout/retry, error mapping, idempotency required, canary version, secrets redaction.

---

### Sprint 14: Hybrid Sandbox / Forge (E2B Primary)
*Цель: Материализовать code/browser/write/high-risk actions без sandbox-per-chat default.*

- [ ] 🔲 Опубликовать SPEC-019 SandboxManager: assign/run/snapshot/freeze/terminate/cleanup/quarantine
- [ ] 🔲 Интегрировать E2B primary; Daytona/local как dev/alternative
- [ ] 🔲 Execution classes: low-risk text/retrieval/read → no sandbox; code/browser/write → full sandbox
- [ ] 🔲 Workspace mount, artifact extraction, TTL, idle timeout, cleanup, snapshots
- [ ] 🔲 Egress policy: default deny, tenant allowlist, provider endpoints, signed URLs
- [ ] 🔲 Quarantine for suspicious artifacts

**Deliverables:** SPEC-019 SandboxManager, E2B integration MVP, Forge v0, Egress policy, RUNBOOK-002.
**Testing Gate:** Sandbox create/run/cleanup, isolation tests, egress deny/allow, artifact extraction/quarantine, crash recovery, cost/TTL enforcement.

---

### Sprint 15: Observability, Load/Chaos and Operational Hardening
*Цель: Доказать надёжность, стоимость, observability и graceful degradation.*

- [ ] 🔲 Dashboards: cost, P95 latency, approvals, sandbox warm/cold, RAG quality, semantic quality
- [ ] 🔲 Trace Bus как source of truth; external tools only overlay
- [ ] 🔲 Load tests: fast chats, RAG chats, AgentRun streams, long workflows, tools, sandbox
- [ ] 🔲 Chaos tests: provider timeout, LiteLLM unavailable, Temporal restart, vector store unavailable, MCP down, sandbox crash
- [ ] 🔲 Multi-provider fallback pilot
- [ ] 🔲 Backpressure вместо uncontrolled provider overload

**Deliverables:** Observability dashboards, Load test report, Chaos report, RUNBOOK-003, RUNBOOK-004, Fallback report.
**Testing Gate:** Load harness, chaos fault injection, recovery/replay, fallback model tests, dashboard event completeness, DR drill.

---

### Sprint 16: Release Candidate
*Цель: Закрыть architecture/security/performance/semantic/migration gates перед production rollout.*

- [ ] 🔲 Full regression against V1 baseline
- [ ] 🔲 Security review: prompt injection, tool escalation, cross-tenant leakage, egress, secrets, approval bypass
- [ ] 🔲 Full eval: RAG, semantic, role passes, artifacts, tool approvals, refusal/recovery
- [ ] 🔲 Подготовить MIGRATION-002: feature flags, shadow, canary, rollback
- [ ] 🔲 Подготовить runbooks для Temporal/LiteLLM/E2B/Knowledge/ToolGateway/cost spike
- [ ] 🔲 Rollback dry-run and backup/restore drill
- [ ] 🔲 Release sign-off: Architecture, Backend, Frontend, QA/Evals, Security, DevOps, Product

**Deliverables:** Release candidate report, MIGRATION-002, Security sign-off, Full eval report, Production checklist, Post-release backlog.
**Testing Gate:** Full E2E, security red-team suite, load/chaos release gate, backup/restore/rollback drill, manual visual UI gate.
**Release Gate:** RC Gate (Gate F по Delivery Plan).

---

## 📊 Release Gates

| Gate | Название | Спринт | Статус |
|---|---|---|---|
| A | Architecture Lock | Sprint 0 | ✅ Пройден |
| B | Fast Path Safety | Sprint 2 | ✅ Пройден |
| C | Semantic Viability (USP) | Sprint 5 | ✅ Пройден |
| D | MVP | Sprint 9 | ✅ Пройден |
| E | Beta | Sprint 12-14 | 🔲 |
| F | Release Candidate | Sprint 16 | 🔲 |

---

## 📈 Метрики тестирования (актуально на 2026-05-07)

| Метрика | Значение |
|---|---|
| Всего тестов (unit+contract+security+latency) | 71 |
| Все pass | ✅ 71/71 (100%) |
| Semantic eval Golden Set | 57 кейсов |
| Semantic eval accuracy | 84.5% (49/58) — MVP target ≥80% ✅ |
| Latency P50/P95/P99 (synthetic) | 0.07ms / 0.69ms / 1.22ms |
| TTFT P95 (multi-chunk) | 0.03ms |
| CI scripts | 14 (unit/contract/security/integration/semantic/latency/pr/nightly/release) |
| Feature flags | 8/8 реализованы |
| SPEC documents | 5 (001–005) |
| ADR documents | 5 (001–005) |
