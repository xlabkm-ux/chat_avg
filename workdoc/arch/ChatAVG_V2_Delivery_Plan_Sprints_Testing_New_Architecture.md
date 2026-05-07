# ChatAVG Agent Platform v2.1
## Новый подробный план реализации, спринты и тестирование с учетом последних доработок архитектуры

- Версия: 2.1
- Дата: 7 мая 2026
- Статус: Draft for Implementation Planning / Architecture-aligned Roadmap

## Executive summary

План пересобирает delivery ChatAVG v2.0/v2.1 вокруг fast path, durable AgentRun, gateway boundaries, risk-based sandboxing, policy/cost/audit и ЭР-слоя. Это migration/evolution plan поверх текущего Node.js Gateway, а не big-bang rewrite.

## Дорожная карта по спринтам

### Sprint 0 — Repo hygiene, architecture lock and backlog reset

**Цель:** Остановить хаотичные изменения и зафиксировать новую delivery-модель v2.1.

**Scope:**
- Принять решение по PR #1: закрыть либо переписать; восстановить `.gitignore` для `*.gguf`, `models_cache/`, runtime data и secrets.
- Обновить `PROJECT_BACKLOG.md`: новый roadmap должен заменить старый `sandbox-per-chat by default` подход.
- Зафиксировать ADR-001: V2.1 target architecture and migration boundary.
- Зафиксировать feature flags: `agent_runs_enabled`, `model_gateway_enabled`, `knowledge_gateway_enabled`, `tool_gateway_enabled`, `semantic_layer_enabled`, `sandbox_forge_enabled`.
- Описать V1-compatible endpoints, которые нельзя ломать: auth, sessions, chat completions, admin, provider health.

**Deliverables:**
- ADR-001, MIGRATION-001, обновленный PROJECT_BACKLOG, release branch strategy.
- Decision record по PR #1.
- Baseline checklist текущей версии.

**Testing gate:**
- `cd cons/chatavg && npm test` проходит локально.
- Smoke: login -> create session -> send chat request with mocked provider -> save session.
- `node dev_studio/refresh.js` обновляет PROJECT_MAP после любых изменений.
- Manual UI smoke: desktop + 375px mobile.

**Exit criteria:** Архитектурная цель зафиксирована; старый план не конфликтует с новой документацией; рабочая ветка чистая.

### Sprint 1 — Regression baseline and test harness hardening

**Цель:** Сделать тестовую базу надежной перед архитектурным расширением.

**Scope:**
- Разделить tests на `unit`, `integration`, `security`, `contract`, `smoke` без смены test runner.
- Сделать test DB полностью изолированной и воспроизводимой.
- Добавить fixtures для providers, category settings, sessions and user roles.
- Починить спорные security assertions так, чтобы ошибки CORS мапились в ожидаемый status/code, а не случайный 500.
- Завести baseline latency measurement для simple chat и provider fallback.

**Deliverables:**
- Test matrix v1.
- CI command set: `test:unit`, `test:integration`, `test:security`, `test:smoke`.
- Regression baseline report.

**Testing gate:**
- Auth/session/admin/security tests.
- Provider config validation tests.
- SSRF/private IP, JSON limit, CORS, XSS prompt sanitization regression.
- UI smoke на текущих сценариях.

**Exit criteria:** Тесты дают надежный сигнал; следующие спринты не слепые.

### Sprint 2 — Canonical contracts and fast path discipline

**Цель:** Закрепить fast path для простого чата и стабилизировать CanonicalChatEvent.

**Scope:**
- Задокументировать `CanonicalChatEvent`: delta, done, error, tool_call, retrieval, usage, trace.
- Проверить все provider adapters на единый AsyncIterable contract.
- Явно отделить simple chat route от будущих AgentRun/tool/RAG режимов.
- Добавить latency budget: auth/routing, context load, provider TTFT, total latency.
- Сохранить backward compatibility для `/api/chat/completions`.

**Deliverables:**
- SPEC-001 CanonicalChatEvent.
- Provider contract tests.
- Fast path guardrails: no sandbox, no live tool discovery, no heavy retrieval.

**Testing gate:**
- Streaming event ordering.
- Non-streaming response mapper.
- Fallback only for retryable errors.
- Latency smoke: P95 simple path budget на synthetic provider.

**Exit criteria:** Simple chat остается быстрым и не тащит будущую agent-complexity.

### Sprint 3 — Model Registry and provider administration

**Цель:** Завершить pending Sprint 2.3 из текущего backlog на новой основе.

**Scope:**
- Довести `ai.models.list` до production-grade поведения: cache TTL, provider timeout, partial failure, source provider metadata.
- Добавить `ModelRegistry` в Core: доступные модели, provider health, category eligibility, fallback model.
- Сделать admin endpoint для models list без прямого SDK leakage.
- Синхронизировать provider health UI/status-dot с реальным состоянием.
- Запланировать light theme как UI P1, не блокирующий архитектурный rollout.

**Deliverables:**
- SPEC-002 ModelRegistry.
- Admin models endpoint.
- Provider health/status contract.

**Testing gate:**
- MCP mocked `ai.models.list`.
- Cache hit/miss/expiry tests.
- Provider unavailable -> partial result, no hard failure.
- UI status indicator regression.

**Exit criteria:** Модели доступны динамически, но Core не становится provider-monolith.

### Sprint 4 — Model Gateway boundary

**Цель:** Отделить inference/model routing от MCP tool semantics.

**Scope:**
- Ввести `ModelGateway` contract: request, stream, normalized response, usage, provider, latency, error mapping.
- Сделать adapter over existing provider factory вместо немедленного переписывания providers.
- Переименовать концептуально текущий `mcp_gateway ai.chat` в model-proxy path; не смешивать с будущим MCP Tool Gateway.
- Ограничить новые direct OpenAI SDK imports: они допустимы только внутри gateway/adapter boundary.
- Добавить trace events: model.requested, model.stream_started, model.completed, model.failed.

**Deliverables:**
- SPEC-003 ModelGateway contract.
- `src/modules/gateways/model` MVP.
- Model trace event mapper.

**Testing gate:**
- Contract tests for model request/response.
- Backward compatibility tests for `/api/chat/completions`.
- Timeout/fallback/error mapper tests.
- Streaming disconnect/reconnect behavior documented.

**Exit criteria:** Model inference становится gateway boundary, а не distributed MCP-monolith.

### Sprint 5 — AgentRun API and event stream foundation

**Цель:** Ввести исполняемую единицу AgentRun без ломки текущего чата.

**Scope:**
- Добавить `AgentRun` data model: queued, running, requires_action, waiting, completed, failed, cancelled, expired.
- Добавить endpoints: create run, get status, cancel, event stream.
- Добавить `AgentRunEvent`: run.created, run.started, model.*, retrieval.*, tool.*, approval.*, cost.*, run.completed/failed.
- Сделать bridge: simple chat может исполняться как fast path, а сложные сценарии — как AgentRun.
- Сохранить SessionRepository как источник пользовательской истории.

**Deliverables:**
- SPEC-004 AgentRun state machine.
- AgentRun API MVP.
- SSE event stream MVP.

**Testing gate:**
- State transition unit tests.
- Event ordering tests.
- Cancellation tests.
- Client disconnect no duplicate run.

**Exit criteria:** Платформа получает run abstraction, но простой чат не замедляется.

### Sprint 6 — Durable execution MVP

**Цель:** Сделать AgentRun восстанавливаемым без немедленного внедрения тяжелого workflow engine.

**Scope:**
- Ввести transactional outbox/event log в SQLite как P0 durable MVP.
- Определить interface для будущего Temporal/Restate/Inngest без жесткой зависимости.
- Реализовать worker loop с idempotent run steps.
- Добавить retry policy только для idempotent operations.
- Добавить recovery after process restart: run resumes from last safe checkpoint.

**Deliverables:**
- SPEC-005 DurableRuntime interface.
- SQLite-backed event log and worker MVP.
- RUNBOOK-001 runtime restart recovery.

**Testing gate:**
- Worker restart/replay tests.
- Retry/no-retry semantics.
- No duplicated side effects.
- Expired/cancelled run behavior.

**Exit criteria:** AgentRun переживает рестарт процесса на уровне MVP.

### Sprint 7 — Policy, cost and audit control plane

**Цель:** Сделать policy/cost/audit частью execution path, а не постфактум логами.

**Scope:**
- Ввести `PolicyDecision`: allow, deny, require_approval, require_step_up_auth, downgrade.
- Ввести `CostPolicy` и `AgentRunEstimate`: model calls, retrieval queries, tool calls, sandbox seconds, estimated cost.
- Расширить AuditService: run/tool/model/retrieval/cost events.
- Добавить dataSensitivity and resourceScope на уровне request/run/tool.
- Добавить top-level dashboards schema, даже если UI будет позже.

**Deliverables:**
- SPEC-006 PolicyEngine.
- SPEC-007 CostPolicy and Estimate.
- Audit event schema v2.

**Testing gate:**
- Policy unit tests for risk/cost/data sensitivity.
- Budget exceeded -> stop/downgrade path.
- Audit events emitted for each model call.
- Sensitive fields redaction.

**Exit criteria:** Execution не может обойти policy/cost/audit.

### Sprint 8 — Approval UX and risk-based tool actions

**Цель:** Ввести human-in-the-loop для high-risk actions без approval fatigue.

**Scope:**
- Добавить `ApprovalRequest`: pending, approved, rejected, edited, timeout, expired.
- Поддержать choices: approve_once, approve_for_this_run, edit_then_approve, reject_and_explain.
- Сделать preview/diff для write/send/delete/admin actions.
- Группировать approvals по run, чтобы не спрашивать 3-4 раза на один пользовательский intent.
- Запретить high-risk tools без approval + audit.

**Deliverables:**
- SPEC-008 ApprovalRequest.
- Approval event stream.
- UI approval panel MVP.

**Testing gate:**
- Approval bypass tests.
- Timeout/expired behavior.
- Edited approval validation.
- Security regression for prompt injection via tool output.

**Exit criteria:** Опасные действия не исполняются без осознанного пользовательского решения.

### Sprint 9 — Knowledge Gateway and RAG modes

**Цель:** Выделить retrieval в mode-driven Knowledge Gateway.

**Scope:**
- Ввести modes: no_retrieval, fast, balanced, max_quality.
- Сделать `KnowledgeGateway` facade: query classification, retriever, reranker hook, citation validation.
- Сохранить legacy/custom retrieval как adapter path, не встраивая алгоритмы в ChatService.
- Реализовать answerability policy для empty retrieval.
- Добавить trace events: retrieval.started, retrieval.completed, rerank.completed.

**Deliverables:**
- SPEC-009 KnowledgeGateway.
- RetrievalResult and Citation contract.
- RAG mode router.

**Testing gate:**
- Retrieval routing tests.
- Empty retrieval behavior.
- Citation schema validation.
- Latency/cost measurement per mode.

**Exit criteria:** RAG становится управляемым trade-off, а не скрытым heavy default.

### Sprint 10 — RAG evals and quality regression

**Цель:** Доказать качество retrieval до расширения max_quality/ensemble.

**Scope:**
- Собрать eval dataset: answerable, unanswerable, citation-required, multi-source, adversarial.
- Ввести automated scoring: relevance, context precision/recall, citation correctness, hallucination rate, latency, cost.
- Добавить human spot review протокол.
- Определить thresholds для fast/balanced/max_quality.
- Запретить включение ensemble default без измеримого выигрыша.

**Deliverables:**
- EVAL-001 RAG dataset.
- EVAL-002 RAG runner in Node.js.
- RAG quality dashboard spec.

**Testing gate:**
- Eval smoke in CI for small fixture set.
- Nightly/full eval outside PR gate.
- Regression threshold: no quality drop vs baseline.
- Citation coverage target for answerable KB cases.

**Exit criteria:** RAG decisions принимаются по evals, не по вкусу.

### Sprint 11 — ER Meaning Layer and Adequacy Engine v0

**Цель:** Ввести смысловые структуры, которые отличают ChatAVG от обычного agent backend.

**Scope:**
- Добавить `SemanticProtocolId` and `glossaryVersion` to Mission/AgentRun context.
- Ввести `Claim`: type, level, strength, domainBoundaryId, sourceRefs.
- Ввести `DomainBoundary`: где claim имеет право на силу.
- Ввести `ConflictCard`, `DecisionRecord`, `DistortionHypothesis` без психодиагностики.
- Добавить semantic trace events: claim.created, claim.downgraded, boundary.violation_detected.

**Deliverables:**
- SPEC-010 SemanticProtocol.
- SPEC-011 ClaimLedger and DomainBoundary.
- Semantic eval seed set.

**Testing gate:**
- Claim extraction unit tests.
- Strength downgrade tests.
- Domain boundary violation tests.
- No hidden authority language regression.

**Exit criteria:** Система начинает хранить не только ответы, но и силу/границы утверждений.

### Sprint 12 — Role Passes and Artifact Workspace

**Цель:** Связать ЭР-протокол с production artifacts.

**Scope:**
- Описать Role Pass contracts: Observer, Boundary, Language, System, Trajectory, Builder/Synthesizer.
- Каждый pass обязан соблюдать Adequacy Covenant: не превышать область определения и не говорить сильнее данных.
- Ввести `ArtifactWorkspace`, `Artifact`, `ArtifactPatch`, `DecisionRecord` links.
- Сделать diff/patch trace: почему текст изменен и на какие claims опирается.
- UX показывает 3-5 главных различений и открытых границ, не всю внутреннюю механику.

**Deliverables:**
- SPEC-012 RolePass contract.
- SPEC-013 ArtifactWorkspace.
- Artifact patch viewer MVP.

**Testing gate:**
- Role contract tests.
- Artifact versioning/diff tests.
- Patch references claim/decision records.
- Semantic UX smoke.

**Exit criteria:** Артефакт становится traceable result, а не просто красивым текстом.

### Sprint 13 — MCP Tool Gateway and versioned Tool Registry

**Цель:** Отделить внешние инструменты от model inference и сделать tool contracts управляемыми.

**Scope:**
- Ввести `ToolDefinitionVersion`: providerId, toolName, toolVersion, schemaHash, riskClass, authScope, timeoutMs, retryPolicy.
- Кэшировать tool definitions; не делать live discovery на каждый run.
- Разделить read-only, write, external_side_effect, code_exec, browser, privileged.
- Добавить idempotencyKey для side-effect tool calls.
- Добавить provider auth scoped by tenant/workspace.

**Deliverables:**
- SPEC-014 MCP Tool Gateway.
- Tool Registry MVP.
- ToolCall state machine.

**Testing gate:**
- JSON schema contract tests.
- Tool timeout/retry/error mapping.
- Idempotency required for side effects.
- Canary rollout for tool schema version.

**Exit criteria:** Tool ecosystem расширяем, но не опасен и не дрейфует контрактами.

### Sprint 14 — Hybrid sandbox and Forge v0

**Цель:** Ввести materialization path без sandbox-per-chat ошибки.

**Scope:**
- Определить execution classes: low-risk text, retrieval, read-only tools, write tools, code execution, browser/computer use, privileged/system.
- Реализовать `SandboxManager` interface и dev provider.
- Full sandbox только для code/browser/write/high-risk; simple chat остается lightweight.
- Добавить workspace mount, artifacts extraction, TTL, cleanup, snapshots where feasible.
- Добавить egress policy: default deny, allowlist, log every outbound request.

**Deliverables:**
- SPEC-015 SandboxManager.
- Forge v0 for file/artifact materialization.
- RUNBOOK-002 sandbox cleanup failure.

**Testing gate:**
- Sandbox create/run/cleanup.
- Isolation: no cross-session files/secrets.
- Egress deny/allow tests.
- Artifact quarantine/deletion lifecycle.

**Exit criteria:** Forge умеет материализовать результат безопасно и не тормозит обычный чат.

### Sprint 15 — Observability, load, chaos, migration and release candidate

**Цель:** Довести платформу до release candidate с rollback и измеримыми gates.

**Scope:**
- Дашборды: cost per successful chat, P95 latency by run type, tool failure/retry, approval conversion, sandbox warm/cold, semantic quality.
- Load tests: simple chat, RAG chat, AgentRun event stream, long-running workflows.
- Chaos tests: provider timeout, MCP gateway unavailable, vector store unavailable, sandbox crash, stream disconnect.
- Migration runbook: feature flags, V1 fallback, tenant/workspace rollout, rollback procedure.
- Release candidate sign-off: architecture, security, performance, semantic quality, UX.

**Deliverables:**
- RUNBOOK-003 high queue depth/backpressure.
- MIGRATION-002 rollout and rollback.
- Release candidate report.

**Testing gate:**
- E2E: login -> mission -> fast chat -> RAG -> approval -> artifact.
- Security review and abuse prompts.
- Load thresholds met.
- Disaster recovery drill.
- Manual browser visual check and mobile 375px.

**Exit criteria:** V2.1 готов к controlled rollout без потери V1 fallback.

## Testing strategy

- **Unit:** Domain types, mappers, policy decisions, cost estimator, state machines, semantic rules. Подход: Node `node:test`, assert, fixtures.
- **Contract:** Provider events, ModelGateway, KnowledgeGateway, MCP Tool schemas, AgentRunEvent, ToolDefinitionVersion. Подход: JSON Schema/Zod, fake providers, snapshot contracts.
- **Integration:** Core -> ModelGateway -> provider mock; Core -> MCP gateway; DB/outbox/worker; audit/cost events. Подход: Supertest, local mock services, test SQLite.
- **E2E:** Login, session, fast chat, AgentRun stream, RAG, approval, artifact export. Подход: Browser automation/manual smoke; later Playwright.
- **Security:** CORS, SSRF, payload limits, prompt injection, tool output injection, approval bypass, secrets leakage. Подход: Abuse fixtures, policy tests, redaction tests.
- **RAG evals:** Answer relevance, context precision/recall, citation correctness, empty retrieval, latency/cost. Подход: Node eval runner + small CI set + full nightly set.
- **Semantic evals:** DomainBoundary, claim strength downgrade, no hidden authority, no psychodiagnosis, level separation. Подход: Golden cases + adversarial language cases.
- **Load:** Concurrent simple chats, RAG chats, long runs, event-stream fanout, queue/backpressure. Подход: Artillery/k6 or Node load harness.
- **Chaos:** Provider timeout, MCP unavailable, vector store unavailable, sandbox crash, worker restart, stream disconnect. Подход: Fault injection and run recovery tests.
- **Visual/UI:** Mobile 375px, desktop, status UI, approval UI, artifact UI, no console errors. Подход: Manual browser gate; screenshots in sprint summary.

## Sprint closure checklist

- Проверить зависимости измененных файлов по PROJECT_MAP.
- Выполнить tests для affected area.
- Выполнить manual UI smoke including mobile 375px.
- Обновить PROJECT_MAP через `node dev_studio/refresh.js`.
- Обновить PROJECT_BACKLOG и UI_AUDIT при необходимости.
- Commit and push.