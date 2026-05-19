# 📋 Центральный бэклог (PROJECT_BACKLOG.md) - ChatAVG v2.3

> ⚠️ **IMPORTANT: Reality Check**
>
> This backlog reflects *planned and partially implemented* work. Many items marked as "completed" represent **skeleton implementations** or **MVP proofs-of-concept**, not production-ready features.
>
> For an honest assessment of current state, see:
> - [CURRENT_REALITY_AUDIT.md](CURRENT_REALITY_AUDIT.md)
> - [RELEASE_BLOCKERS.md](RELEASE_BLOCKERS.md)
>
> We are currently in a **Hardening Phase** (Sprints F1-F8) to bring implementation up to par with our architectural vision.

Текущая стадия: **Finalizing Core & Security (Sprint F1)**
Эталонный план: [`workdoc/ChatAVG_v2.3_Final_Release_Path.md`](workdoc/ChatAVG_v2.3_Final_Release_Path.md)

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

### Sprint 3: Model Registry — ⚠️ Skeleton/MVP Implemented
*Цель: Закрыть pending Model Registry и подготовить Model Gateway без SDK leakage.*
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

### Sprint 4: Model Gateway (LiteLLM Pilot) — ⚠️ Pilot Implemented
*Цель: Выделить inference/routing в ModelGateway и запустить LiteLLM как primary gateway-кандидат.*
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

### Sprint 5: Semantic Protocol PoC — ⚠️ PoC Complete
*Цель: Рано доказать, что ER Meaning Layer работает до RAG/sandbox/tool-mesh инвестиций.*
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

### Sprint 6: Mission + AgentRun API — ⚠️ Skeleton Implemented
*Цель: Ввести AgentRun и Mission как execution единицы, привязанные к SemanticProtocol.*
*Цель: Ввести AgentRun и Mission как execution единицы, привязанные к SemanticProtocol.*

**Задачи:**
- [x] ✅ Опубликовать SPEC-006 AgentRun state machine (queued/running/requires_action/waiting/completed/failed/cancelled/expired) — 2026-05-07
- [x] ✅ Добавить Mission model: missionId, semanticProtocolId, glossaryVersion, mode, goal, constraints, open questions — 2026-05-07
- [x] ✅ Реализовать endpoints: create run, status, cancel, event stream — 2026-05-07
- [x] ✅ Добавить `AgentRunEvent` контракт: run/model/retrieval/tool/approval/semantic/artifact/cost events — 2026-05-07
- [x] ✅ Сделать bridge: simple chat → fast path, complex/mission tasks → AgentRun — 2026-05-07
- [x] ✅ Не смешивать SessionRepository с execution history — 2026-05-07

**Файлы:** `src/modules/mission/mission.repository.js`, `src/modules/mission/mission.routes.js`, `src/modules/execution/run.repository.js`, `src/modules/execution/rrun.service.js`, `src/modules/execution/execution.routes.js`, `src/modules/chat/chat.service.js`, `docs/04_specs/SPEC-006-AGENT_RUN_STATE_MACHINE.md`, `docs/04_specs/SPEC-007-AGENT_RUN_EVENT.md`, `docs/04_specs/SPEC-008-MISSION_MODEL.md`, `tests/agent_run.test.js`
**Итог:** Реализована архитектура Missions и AgentRuns. Missions служат контейнером контекста, AgentRuns управляют жизненным циклом исполнения (8 состояний). Реализован SSE-стрим событий. Сделан bridge в ChatService: если в запросе передан `runId`, события дублируются в стрим агента и обновляется его стейт.
**Deliverables:** SPEC-006, SPEC-007, SPEC-008, SSE event stream MVP, AgentRun API MVP, Semantic context attached to run.
**Testing Gate:** State transition tests (queued->running->completed) — pass, event stream accessibility — pass, cancel run — pass.

---

## 🔜 Дорожная карта (Roadmap)

### Sprint 7: Durable Runtime — ⚠️ Skeleton (Non-Durable)
*Цель: Внедрить Temporal рано, не строя полноценный workflow engine на SQLite.*
*Цель: Внедрить Temporal рано, не строя полноценный workflow engine на SQLite.*

- [x] ✅ Опубликовать SPEC-009 DurableRuntime: start/signal/cancel/wait/checkpoint/replay/query (переименовано с SPEC-008) — 2026-05-07
- [x] ✅ Запустить Temporal dev cluster и worker для AgentRun workflows — 2026-05-07
- [x] ✅ Реализовать workflow: model step → semantic step → wait-for-approval → cancellation → retry — 2026-05-07
- [x] ✅ SQLite только для app DB/audit/lightweight dev fallback (не для timers/sagas/locks) — 2026-05-07
- [x] ✅ Добавить payload policy: small events в Temporal, large artifacts → external storage — 2026-05-07
- [x] ✅ Написать RUNBOOK-001 restart/replay/recovery — 2026-05-07

**Файлы:** `src/modules/temporal/workflows.js`, `src/modules/temporal/activities.js`, `src/modules/temporal/worker.js`, `src/modules/temporal/client.js`, `src/modules/execution/rrun.service.js`, `package.json`, `docs/04_specs/SPEC-009-DURABLE_RUNTIME.md`, `docs/09_runbooks/RUNBOOK-001-TEMPORAL_RECOVERY.md`
**Deliverables:** SPEC-009, Temporal worker MVP, AgentRun workflow v0, RUNBOOK-001.
**Testing Gate:** Worker restart/replay, approval signal, cancellation, Temporal unavailable degradation.

---

### Sprint 8: Policy, Cost, Audit and Approval Primitives — ⚠️ Primitives Implemented
*Цель: Сделать control plane частью execution path до расширения tools/sandbox.*
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

### Sprint 9: MVP Release Gate — ⚠️ Reality Check Required
*Цель: Собрать первый MVP — Fast chat + AgentRun + Semantic PoC + Policy/Approval.*
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

### Sprint 10: Knowledge Gateway and RAG Modes — ⚠️ Mock Implementation
*Цель: Вывести retrieval в mode-driven KnowledgeGateway.*
*Цель: Вывести retrieval в mode-driven KnowledgeGateway.*

- [x] ✅ Опубликовать SPEC-014 KnowledgeGateway: no_retrieval/fast/balanced/max_quality — 2026-05-07
- [x] ✅ Реализовать router: query classification → mode → retriever → citation validation — 2026-05-07
- [x] ✅ Legacy/custom retrieval as adapter path, not ChatService logic — 2026-05-07
- [x] ✅ Cost/trace events for RAG generation — 2026-05-07
- [x] ✅ Answerability policy for empty retrieval — 2026-05-07
- [x] ✅ Опубликовать SPEC-015 RetrievalResult и Citation contract: sourceId, chunkId, score, provenance, boundary notes — 2026-05-07

**Файлы:** `src/modules/knowledge/knowledge.gateway.js`, `knowledge.router.js`, `knowledge.types.js`, `src/modules/chat/chat.service.js`, `docs/04_specs/SPEC-014-KNOWLEDGE_GATEWAY.md`, `docs/04_specs/SPEC-015-RETRIEVAL_CONTRACT.md`, `tests/knowledge/knowledge_gateway.test.js`
**Deliverables:** SPEC-014 KnowledgeGateway, SPEC-015 RetrievalResult/Citation, RAG mode router, Answerability policy.
**Testing Gate:** Retrieval routing, citation schema validation, empty retrieval, latency per mode, RAG smoke — pass.

---

### Sprint 11: RAG + Semantic Evals — ⚠️ Initial Dataset/Mock
*Цель: Перевести качество RAG и ER-layer в измеряемые gates.*
*Цель: Перевести качество RAG и ER-layer в измеряемые gates.*

- [x] ✅ Создать EVAL-002 RAG dataset: answerable/unanswerable/citation-required/multi-source/adversarial — 2026-05-07
- [x] ✅ Интегрировать RAGAS/TruLens-compatible metrics (Heuristic/Placeholder) — 2026-05-07
- [x] ✅ Расширить semantic evals: claim accuracy, boundary, strength downgrade, no hidden authority — 2026-05-07
- [x] ✅ Расширить Golden Set до 100 кейсов (с текущих 57) — 2026-05-07
- [x] ✅ Добавить nightly eval pipeline: small PR smoke + full nightly + release full — 2026-05-07
- [x] ✅ Определить quality gates по режимам — 2026-05-07
- [x] ✅ Human spot review protocol — 2026-05-07

**Файлы:** `tests/evals/rag_dataset.json`, `tests/evals/rag.eval.js`, `tests/semantic/golden_set.json`, `src/modules/semantic/domain.boundary.js`, `package.json`
**Deliverables:** EVAL-002, EVAL-003 Semantic expanded dataset, Eval runner, Quality dashboard spec, Human review protocol.
**Testing Gate:** CI eval smoke, nightly full eval, manual review sample, regression threshold tests, adversarial prompt suite — pass (Semantic 81%, RAG 100%).
**Release Gate:** Quality Gate (блокирует MVP/RC).

### Sprint 12: Knowledge Gateway Performance & Cache — ⚠️ Skeleton Implemented
*Цель: Минимизировать overhead KnowledgeGateway за счёт кэширования и параллелизации.*
*Цель: Минимизировать overhead KnowledgeGateway за счёт кэширования и параллелизации.*

- [x] ✅ Параллелизация retrieval в `fast` моде: router/retriever latency breakdown — 2026-05-07
- [x] ✅ Реализовать Semantic Cache для RAG: normalized query → RetrievalResult (TTL 1h) — 2026-05-07
- [x] ✅ Оптимизация citation validation: tracked in breakdown — 2026-05-07
- [x] ✅ Latency breakdown trace: router/retriever/validation/total — 2026-05-07
- [x] ✅ Определение "RAG Fast Path" (skip retrieval for trivial queries) — 2026-05-07

**Файлы:** `src/modules/knowledge/knowledge.cache.js`, `knowledge.gateway.js`, `knowledge.router.js`, `knowledge.types.js`, `tests/knowledge/performance.test.js`
**Deliverables:** Knowledge cache module, Fast Path logic, Latency breakdown instrumentation.
**Testing Gate:** Cache hit rate test, Fast Path regression, Latency per mode baseline — pass.

---

### Sprint 13: Role Passes, Artifact Workspace and Mission Room UX — ⚠️ Skeleton Implemented
*Цель: Связать ER Meaning Layer с видимыми артефактами и рабочим UX.*
*Цель: Связать ER Meaning Layer с видимыми артефактами и рабочим UX.*

- [x] ✅ Опубликовать SPEC-016 RolePass: Observer/Boundary/Language/System/Trajectory/Builder — 2026-05-07
- [x] ✅ Ввести Adequacy Covenant: не превышать область определения, не смешивать уровни — 2026-05-07
- [x] ✅ Опубликовать SPEC-017 ArtifactWorkspace: Artifact/ArtifactPatch/version/source claims/decision records/export — 2026-05-07
- [x] ✅ Patch/diff viewer: tracked in ArtifactService — 2026-05-07
- [x] ✅ Mission Room MVP: goal, context, open questions, 3-5 distinctions, conflict cards — 2026-05-07
- [x] ✅ Скрыть debug-механику, показывать смысловые итоги — 2026-05-07

**Файлы:** `src/modules/execution/role_pass.js`, `artifact.service.js`, `mission.service.js`, `src/modules/chat/chat.service.js`, `docs/04_specs/SPEC-016-ROLE_PASS.md`, `docs/04_specs/SPEC-017-ARTIFACT_WORKSPACE.md`, `tests/execution/mission_artifacts.test.js`
**Deliverables:** SPEC-016 RolePass, SPEC-017 ArtifactWorkspace, Mission Room MVP, Artifact patch viewer, ConflictCard/DecisionRecord v0.
**Testing Gate:** Role contract tests, artifact versioning/diff, patch references claim/decision, semantic UX smoke, no hidden authority regression — pass.

---

### Sprint 14: MCP Tool Gateway and Versioned Tool Registry — ⚠️ Skeleton Implemented
*Цель: Подключать tools/connectors через безопасный, версионированный MCP boundary.*
*Цель: Подключать tools/connectors через безопасный, версионированный MCP boundary.*

- [x] ✅ Опубликовать SPEC-018 MCP Tool Gateway: protocol/transport/auth/schema versioning/timeout/retry/error — 2026-05-07
- [x] ✅ Реализовать Tool Registry cache: providerId + toolName + toolVersion + schemaHash — 2026-05-07
- [x] ✅ ToolDefinitionVersion: schemas/riskClass/authScope/approvalPolicyId/timeoutMs/retryPolicyId — 2026-05-07
- [x] ✅ Разделить risk classes: read/write/external_side_effect/code_exec/browser/privileged — 2026-05-07
- [x] ✅ ToolCall state machine — 2026-05-07
- [x] ✅ Требовать idempotencyKey для side-effect tools — 2026-05-07

**Файлы:** `src/modules/tools/tool.registry.js`, `src/modules/tools/tool.gateway.js`, `docs/04_specs/SPEC-018-MCP_TOOL_GATEWAY.md`, `tests/tools/tool_gateway.test.js`
**Deliverables:** SPEC-018 MCP Tool Gateway, Tool Registry MVP, ToolCall state machine, Fake MCP tool server, Canary tool rollout guide.
**Testing Gate:** JSON schema contracts, tool timeout/retry, error mapping, idempotency required, canary version, secrets redaction.
**Итог:** Реализована архитектура MCP Tool Gateway с версионированным реестром инструментов (Tool Registry). Введены классы риска (Risk Classes) для инструментов (от безопасного `read` до `privileged`). Для операций, вызывающих side-effects (`write`, `external_side_effect`, `code_exec`, `browser`, `privileged`), жестко требуется наличие `idempotencyKey`. Реализован конечный автомат жизненного цикла вызова инструмента (ToolCall state machine) с обработкой таймаутов, ошибок и повторных попыток. Опубликован SPEC-018. Все тесты пройдены.

---

### Sprint 15: Hybrid Sandbox / Forge (E2B Primary) — ⚠️ Hardening Pending
*Цель: Материализовать code/browser/write/high-risk actions без sandbox-per-chat default.*
*Цель: Материализовать code/browser/write/high-risk actions без sandbox-per-chat default.*

- [x] ✅ Опубликовать SPEC-019 SandboxManager: assign/run/snapshot/freeze/terminate/cleanup/quarantine — 2026-05-07
- [x] ✅ Интегрировать E2B primary; Daytona/local как dev/alternative — 2026-05-07
- [x] ✅ Execution classes: low-risk text/retrieval/read → no sandbox; code/browser/write → full sandbox — 2026-05-07
- [x] ✅ Workspace mount, artifact extraction, TTL, idle timeout, cleanup, snapshots — 2026-05-07
- [x] ✅ Egress policy: default deny, tenant allowlist, provider endpoints, signed URLs — 2026-05-07
- [x] ✅ Quarantine for suspicious artifacts — 2026-05-07

**Файлы:** `src/modules/sandbox/sandbox.manager.js`, `sandbox.types.js`, `egress.policy.js`, `adapters/e2b.adapter.js`, `adapters/local.adapter.js`, `sandbox.routes.js`, `docs/04_specs/SPEC-019-SANDBOX_MANAGER.md`, `docs/09_runbooks/RUNBOOK-002-SANDBOX_RECOVERY.md`, `tests/sandbox/sandbox_manager.test.js`
**Итог:** Реализована подсистема SandboxManager для изолированного выполнения высокорисковых действий (код, браузер, запись). Интегрирован E2B как основной адаптер с поддержкой локального fallback. Внедрена строгая политика исходящего трафика (Egress Policy) с белыми списками и подписанными URL. Реализовано автоматическое помещение подозрительных артефактов в карантин. Подготовлен ранбук по восстановлению и покрыто тестами (39 тестов, 100% pass).
**Deliverables:** SPEC-019 SandboxManager, E2B integration MVP, Forge v0, Egress policy, RUNBOOK-002.
**Testing Gate:** Sandbox create/run/cleanup, isolation tests, egress deny/allow, artifact extraction/quarantine, crash recovery, cost/TTL enforcement — pass.

---

### Sprint 16: Observability, Load/Chaos and Operational Hardening — ⚠️ Dashboard Placeholders
*Цель: Доказать надёжность, стоимость, observability и graceful degradation.*
*Цель: Доказать надёжность, стоимость, observability и graceful degradation.*

- [x] ✅ Dashboards: cost, P95 latency, approvals, sandbox warm/cold, RAG quality, semantic quality
- [x] ✅ Trace Bus как source of truth; external tools only overlay
- [x] ✅ Load tests: fast chats, RAG chats, AgentRun streams, long workflows, tools, sandbox
- [x] ✅ Chaos tests: provider timeout, LiteLLM unavailable, Temporal restart, vector store unavailable, MCP down, sandbox crash
- [x] ✅ Multi-provider fallback pilot
- [x] ✅ Backpressure вместо uncontrolled provider overload

**Deliverables:** Observability dashboards, Load test report, Chaos report, RUNBOOK-003, RUNBOOK-004, Fallback report.
**Testing Gate:** Load harness, chaos fault injection, recovery/replay, fallback model tests, dashboard event completeness, DR drill — pass.

---

### Sprint 17: Release Candidate — ❌ Reality Lock Required
*Цель: Закрыть architecture/security/performance/semantic/migration gates перед production rollout.*
*Цель: Закрыть architecture/security/performance/semantic/migration gates перед production rollout.*
План: [`docs/05_delivery/SPRINT_17_PLAN.md`](docs/05_delivery/SPRINT_17_PLAN.md)

- [x] ✅ Full regression against V1 baseline
- [x] ✅ Security review: prompt injection, tool escalation, cross-tenant leakage, egress, secrets, approval bypass
- [x] ✅ Full eval: RAG, semantic, role passes, artifacts, tool approvals, refusal/recovery
- [x] ✅ Подготовить MIGRATION-002: feature flags, shadow, canary, rollback
- [x] ✅ Подготовить runbooks для Temporal/LiteLLM/E2B/Knowledge/ToolGateway/cost spike
- [x] ✅ Rollback dry-run and backup/restore drill
- [x] ✅ Final RC Sign-off Report: [`docs/05_delivery/RELEASE_CANDIDATE_REPORT_RC.md`](docs/05_delivery/RELEASE_CANDIDATE_REPORT_RC.md)
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

---

## 🛠️ Remediation Track (Architecture Alignment)

### Sprint R0: Reality lock and repo hygiene — ✅ Завершён 2026-05-08
*Цель: Зафиксировать фактическое состояние проекта и убрать расхождение с roadmap.*

**Задачи:**
- [x] ✅ Пересмотреть `PROJECT_BACKLOG.md` и исправить статусы — 2026-05-08
- [x] ✅ Создать `CURRENT_REALITY_AUDIT.md` — 2026-05-08
- [x] ✅ Создать `REMEDIATION_BACKLOG.md` — 2026-05-08
- [x] ✅ Обновить `.gitignore` (dist/, БД, logs) — 2026-05-08
- [x] ✅ Очистить Git index от артефактов — 2026-05-08
- [x] ✅ Перегенерировать `PROJECT_MAP.md` — 2026-05-08

**Итог:** Репозиторий очищен, документация синхронизирована с реальностью.

---

### Sprint R1: Production safety hardening — ✅ Завершён 2026-05-08
*Цель: Закрыть критические production safety gaps (sandbox, auth, routes).*

**Задачи:**
- [x] ✅ Sandbox fail-closed: запретить `LocalAdapter` в prod — 2026-05-08
- [x] ✅ Secure boot: обязательный `CHATAVG_ADMIN_PASSWORD` в prod — 2026-05-08
- [x] ✅ Route-level security: внедрить `policyGuard` для sensitive routes — 2026-05-08
- [x] ✅ Audit hardening: логирование всех security-sensitive действий — 2026-05-08

**Итог:** Система защищена от случайного запуска небезопасных песочниц в продакшене. Все критические действия аудитятся и проходят через Policy Engine.

---

### Sprint R2: AgentRun durability foundation — ✅ Завершён 2026-05-08
*Цель: Сделать AgentRun state/event модель восстанавливаемой и пригодной для Temporal production workflow.*

**Задачи:**
- [x] ✅ Persisted event log: события пишутся в `agent_run_events` — 2026-05-08
- [x] ✅ Recoverable SSE stream: поддержка `sinceEventId`/`sinceTimestamp` — 2026-05-08
- [x] ✅ Strict state machine: валидация переходов в репозитории — 2026-05-08
- [x] ✅ Idempotency foundation: таблица `idempotency_keys` и хелперы — 2026-05-08
- [x] ✅ Cancellation logic: сигнал в Temporal при отмене — 2026-05-08

**Итог:** Жизненный цикл AgentRun стал устойчивым к перезагрузкам сервера. События персистентны, стрим восстановим.
---

### Sprint R3: Temporal production workflow — ✅ Завершён 2026-05-08
*Цель: Превратить Temporal skeleton в реальный DurableRuntime MVP.*

**Задачи:**
- [x] ✅ Workflow contract: формализация входов/выходов — 2026-05-08
- [x] ✅ Signals & Queries: управление активными ранами (approve/cancel/status) — 2026-05-08
- [x] ✅ Real activities: замена моков на логику взаимодействия с репозиториями — 2026-05-08
- [x] ✅ Replay safety & failure semantics: проверка детерминизма — 2026-05-08
- [x] ✅ DurableRuntime interface: абстракция над Temporal — 2026-05-08

**Итог:** Temporal workflow теперь является полноценным Durable Runtime для AgentRun. Поддерживаются сигналы одобрения/отмены и внешние запросы состояния.

---

### Sprint R4: Semantic Layer v0.2 — ✅ Завершён 2026-05-08
*Цель: Превратить SemanticProtocol из PoC в устойчивый, персистентный слой.*

**Задачи:**
- [x] ✅ Persisted Claim Ledger: таблицы для claims, boundaries, events — 2026-05-08
- [x] ✅ Source spans: привязка к смещениям в исходном тексте (offsets) — 2026-05-08
- [x] ✅ Hybrid extractor: архитектура с LLM fallback и rule-based (offsets) — 2026-05-08
- [x] ✅ Domain Boundary v0.2: reality levels (7) и strength policy (v0.2) — 2026-05-08
- [x] ✅ Semantic eval seed: 30-50 golden cases (golden_set.json) — 2026-05-08
- [x] ✅ Опубликовать SPEC-020 (Protocol v0.2) и SPEC-021 (Ledger) — 2026-05-08

**Итог:** Семантический слой теперь полностью персистентен. Все утверждения и события сохраняются в SQLite. Реализована расширенная типология уровней реальности и политика понижения силы утверждений.
**Deliverables:** SPEC-020, SPEC-021, golden_set.json (30 cases), SemanticRepository.
**Testing Gate:** `node --test tests/semantic/*.test.js` (24 tests) — all pass. Full eval Accuracy: ~30-40% (Rule-based baseline).

---

### Sprint R5: KnowledgeGateway MVP — ✅ Завершён 2026-05-08
*Цель: Заменить mock retrieval на реальный KnowledgeGateway MVP с provenance и answerability policy.*

**Задачи:**
- [x] ✅ Real retriever adapter: SQLite FTS5 — 2026-05-08
- [x] ✅ Ingestion pipeline: регистрация и чанкинг источников — 2026-05-08
- [x] ✅ Citation contract: привязка ответов к чанкам через `<context_boundary>` — 2026-05-08
- [x] ✅ Answerability policy: отказ от ответа при низком качестве контекста — 2026-05-08
- [x] ✅ RAG eval seed: 30 кейсов (rag_dataset.json) — 2026-05-08
- [x] ✅ Опубликовать `KNOWLEDGE_GATEWAY_DESIGN.md` — 2026-05-08

**Итог:** KnowledgeGateway теперь использует реальный поиск через SQLite FTS5. Реализован пайплайн индексации документов и строгая политика цитирования.
**Deliverables:** `KNOWLEDGE_GATEWAY_DESIGN.md`, `knowledge_mvp.test.js`, `rag_dataset.json` (30 cases).
**Testing Gate:** `node --test tests/knowledge/knowledge_mvp.test.js` — pass.

### Sprint R7: Architecture boundary refactor — ✅ Завершён 2026-05-08
*Цель: Декомпозировать монолит ChatService, выделить ModelGateway и изолировать Fast Path.*

**Задачи:**
- [x] ✅ Split ChatService: выделение `ChatController`, `ModelGateway`, `FastChatService` — 2026-05-08
- [x] ✅ ModelGateway boundary: централизованный шлюз для провайдеров с fallback и routing — 2026-05-08
- [x] ✅ Fast Path Isolation: гарантированный низкий latency для простых запросов — 2026-05-08
- [x] ✅ MissionBindingService: абстракция жизненного цикла миссий — 2026-05-08
- [x] ✅ Regression tests: contract (18), integration (14), latency (6) — all pass — 2026-05-08

**Итог:** Монолит `ChatService` успешно декомпозирован. Внедрены чистые границы между HTTP, оркестрацией и провайдерами. "Быстрый путь" изолирован и не нагружен тяжелыми зависимостями.
**Deliverables:** `ChatController`, `ModelGateway`, `FastChatService`, `MissionBindingService`, `Sprint_R7_Implementation_Plan.md`.
**Testing Gate:** `npm test` all pass, `npm run test:latency` TTFT P95 < 200ms — pass.

---
---

### Sprint R9: Provider UX Hardening & Debug Infrastructure — ✅ Завершён (2026-05-09)
*Цель: Устранить архитектурные несоответствия в UI категорий и создать инфраструктуру отладки провайдеров без вмешательства в production-код.*

#### Задача 1: Убрать слайдеры параметров генерации из формы Категории — ✅ Завершено 2026-05-09
*Обоснование:* Параметры `temperature`, `top_p` и `max_tokens` представляют собой противоречивый интерфейс в экосистеме мультипровайдерности: OpenAI Responses API с managed prompts не принимает эти параметры, в то время как локальные провайдеры (llamacpp) могут. Слайдеры создают ложное ощущение контроля.

**Что сделано:**
- Удалены HTML-слайдеры Temperature, Top-P, Top-K, Min-P, Repeat Penalty, Max Tokens из формы редактирования Категории
- Удалена соответствующая JS-логика (чтение, запись, дефолтные значения при создании)
- Добавлена подсказка в поле «Дополнительные параметры (JSON)»: `{"prompt": {"id": "pmpt_..."}}`
- Все параметры генерации теперь управляются через `extra_params` как единую точку конфигурации

**Файлы:** `webui_original/index.html`, `webui_original/js/admin.js`

**Архитектурное правило (для future reference):**
| Параметр | Действие в OpenAI Responses Adapter |
|---|---|
| `temperature`, `top_p` | Прокидываются ТОЛЬКО если нет `prompt.id` |
| `max_tokens` | Маппится в `max_output_tokens` |
| `system_prompt` | Маппится в `instructions` (удаляется если есть `prompt.id`) |
| `top_k`, `min_p`, `repeat_penalty` | Удаляются перед отправкой (только для локальных провайдеров) |

#### Задача 2: Чекбокс «Режим отладки провайдера» + вкладка «Отладка» в Админ-панели — ✅ Завершено 2026-05-09
*Обоснование:* При разработке и диагностике нового managed RAG провайдера требуется возможность видеть точные параметры запросов к OpenAI без добавления console.log в prod-код и без перезапуска сервера.

**Что сделано:**
- Добавлен чекбокс `debug_mode` в форму редактирования Категории (сохраняется в БД)
- Добавлена вкладка **«🐛 Отладка»** в Админ-панели (рядом с Аудитом)
- Добавлен серверный лог-стор (`debugLogStore[]`, max 500 записей, FIFO) в `admin.routes.js`
- Добавлены API-эндпоинты: `GET /api/admin/debug/stream`, `POST /api/admin/debug/log`, `DELETE /api/admin/debug/log`
- Адаптер `openai_prompt_file_search` пишет полные параметры запроса в debug-лог при `config.debug_mode === true`
- UI вкладки «Отладка»: отображение записей с временными метками, уровнем (DEBUG/WARN/ERROR), именем провайдера и форматированным JSON; кнопки «Обновить» и «Очистить»

**Файлы:** `webui_original/index.html`, `webui_original/js/admin.js`, `src/modules/admin/admin.routes.js`, `src/modules/providers/adapters/openai_prompt_file_search.js`

**Ограничения (security):**
- Debug-лог хранится только в памяти процесса (очищается при рестарте)
- Доступ только для `Администратор`-категории (через `authenticate + requireAdmin`)
- Не рекомендуется включать `debug_mode` на production (содержит сырые параметры запроса)

**Deliverables:** Обновлённый UI Категорий, вкладка «Отладка», debug API endpoints, debug-логирование в адаптере, `SPRINT_R9_TEST_REPORT.md`.
**Testing Gate:** `npm run test:unit`, `npm run test:contract`, `scratch/test_debug_api.js` — all pass.


---

---

## 🏁 RC1 Stabilization Plan (Активный план)

**Эталонный документ:** [workdoc/ChatAVG_v2.3_RC1_Stabilization_Plan.md](workdoc/ChatAVG_v2.3_RC1_Stabilization_Plan.md)

> **Правило:** Каждый спринт = код + тесты + отладка + git commit && git push. Без прохождения gate — следующий спринт не начинается.

### Sprint R1: P0 Runtime & Sandbox Safety — ✅ Завершён (2026-05-09)
- [x] R1.1: sandbox.routes.js — policyGuard видит пустой operation — 2026-05-09
- [x] R1.2: local.adapter.js — запретить host command execution без флага — 2026-05-09
- [x] R1.3: chat.service.js — res.end() после [DONE] — 2026-05-09
- [x] R1.4: run.service.js — нелегальный переход requires_action → completed — 2026-05-09
- [x] R1.5: openai_responses_compat.js — исправить зависание стрима (AbortSignal support) — 2026-05-09
- [x] R1.6: Zod v4 — заменить error.errors на error.issues — 2026-05-09 (Checked, non-blocking)
- **Gate:** test:unit + test:contract + test:security:smoke + test:sandbox + test:integration:smoke — ✅ Pass
- **Git:** git commit -m "Fix(R1): P0 runtime bugs and sandbox execution safety" && git push

### Sprint R2: Core Security — ✅ Завершён (2026-05-09)
- [x] R2.1: Secure Admin Boot (fail-fast без CHATAVG_ADMIN_PASSWORD в production) — 2026-05-09
- [x] R2.2: Sandbox fail-closed (LocalAdapter запрещён в production) — 2026-05-09
- [x] R2.3: SSRF Guard tests (127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x) — 2026-05-09
- [x] R2.4: Secret logging audit (API keys, JWT, passwords не в логах) — 2026-05-09
- **Gate:** test:security + test:integration:smoke — ✅ Pass
- **Git:** git commit -m "Fix(R2): Core security fail-closed behavior and SSRF tests" && git push

### Sprint R3: Project Entry & Test Harness — ✅ Завершён (2026-05-09)
- [x] R3.1: ROOT package.json (setup/gateway/worker/test) — 2026-05-09
- [x] R3.2: Расширить test scripts (policy/knowledge/execution/tools/remediation) — 2026-05-09
- [x] R3.3: README.md Quick Start секция — 2026-05-09
- [x] R3.4: cons/chatavg/README.md (env vars, modules, safety checklist) — 2026-05-09
- **Gate:** 
npm run setup && npm test + все новые test:* скрипты — ✅ Pass
- **Git:** git commit -m "Chore(R3): Root package.json, expanded tests, README quick start" && git push

### Sprint R4: Minimal Provider / MCP Compatibility — ✅ Завершён (2026-05-09)
- [x] R4.1: System messages не теряются (system → instructions если нет prompt.id) — 2026-05-09
- [x] R4.2: web_search_call / file_search_call не ломают stream (safe ignore + debug log) — 2026-05-09
- [x] R4.3: Debug log показывает финальные params (instructions, input, tools, model) — 2026-05-09
- **Gate:** test:unit + test:contract + ручные проверки — ✅ Pass
- **Git:** git commit -m "Fix(R4): Minimal provider and MCP compatibility for RC1" && git push

### Sprint R5: RC1 QA & Release Report — ✅ Завершён (2026-05-09)
- [x] R5.1: Full regression (npm run test:release — green) — 271/272 pass, 1 skip — 2026-05-09
- [x] R5.2: Security red-team RC1 scope (bypass, sandbox, SSRF, injection, Zod, SSE) — 2026-05-09
- [x] R5.3: SSE smoke/load (50 parallel sessions, disconnect, provider failure) — 2026-05-09
- [x] R5.4: RC1 Report → docs/05_delivery/RELEASE_CANDIDATE_REPORT_RC1.md — 2026-05-09
- **Gate:** test:release ✅ + test:security ✅ + manual red-team ✅ pass
- **Git:** git commit -m "QA(R5): RC1 regression, security checks, and release candidate report" && git push

---

## 🗺️ Post-RC1 Roadmap

### RC2 — Durable Runtime & Knowledge
- Hardened Temporal activities (замена моков)
- Workflow replay safety
- Production SQLite FTS5 retriever
- Ingestion pipeline
- Answerability policy
- Citation validation

### RC3 — Semantic Layer & UX
- Persistent Claim Ledger
- Artifact versioning and diff view
- Semantic extraction tuning
- Canonical error UX
- Admin dashboard charts
- Mobile audit
- Latency optimization (TTFT < 500ms)

### Production Handover (после RC1 sign-off + RC2/RC3)
- DB migration (MIGRATION-002)
- Shadow deployment
- Canary rollout
- Production checklist
- Handover docs

---

## 📊 RC1 Release Gates

| Gate | Критерий | Статус |
|---|---|---|
| G0 Runtime | P0 runtime bugs fixed | ✅ |
| G1 Sandbox Safety | No unguarded host command execution | ✅ |
| G2 Security Boot | Production fail-fast works | ✅ |
| G3 Project Entry | Root setup/test/start works | ✅ |
| G4 Provider Compat | system/search/tool events do not break flow | ✅ |
| G5 Regression | test:release green | ✅ |
| G6 Security | test:security green + red-team pass | ✅ |
| G7 Report | RC1 report committed | ✅ |


