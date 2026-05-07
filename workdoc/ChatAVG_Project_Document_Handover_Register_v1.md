# ChatAVG — реестр проектной документации для передачи команде разработки

**Версия:** 1.0  
**Дата:** 7 мая 2026  
**Статус:** Draft for team handover / Development kickoff  
**Назначение:** единый перечень документов, которые нужно передать команде разработки, QA, UX, Security и SRE перед стартом реализации ChatAVG Agent Platform v2.3.


## Главный принцип передачи

Команде нельзя отдавать набор разрозненных файлов без статуса. Каждый документ должен иметь ID, владельца, версию, статус, область применения и признак `authoritative / reference / superseded`. Иначе команда начнет реализовывать конфликтующие решения из старых концепций.


## Иерархия источников

1. **Authoritative:** v2.3 optimized delivery plan, latest technical concept, ER architecture implementation, updated repo backlog/map/audit.
2. **Authoritative input:** Concept v2 architecture review and v2.2 ADR/Risk Register, после сведения в v2.3 pack.
3. **Reference only:** старые concept/implementation документы с MCP Provider Mesh и sandbox-per-chat default. Их можно хранить только в архиве с пометкой `superseded`.


## Существующие документы-источники
| ID | Документ | Что содержит | Действие при передаче |
| --- | --- | --- | --- |
| SRC-01 | ChatAVG_v2.3_Optimized_Delivery_Plan_Sprints_Testing.docx / .md | Главный delivery-план: 16 спринтов, gates, tracks, testing, release logic. | Передавать как основной план разработки. Статус: authoritative. |
| SRC-02 | ChatAVG_Technical_Concept_v2_New_Architecture.docx | Техническая концепция новой архитектуры: fast path, gateways, AgentRun, policy/cost/audit, risk-based sandbox. | Передавать как основной технический концепт. Статус: authoritative. |
| SRC-03 | ChatAVG_v2.2_Detailed_Backlog_ADR_RiskRegister.md | ADR, detailed backlog, risk register: Temporal, LiteLLM, E2B/Daytona, sprint risks. | Использовать как источник для ADR register, risk register и backlog. Статус: merge into v2.3 pack. |
| SRC-04 | ChatAVG_v2_05_Architecture_Implementation.docx | ER Meaning Layer: SemanticProtocol, Claim Ledger, DomainBoundary, Role Passes, Artifact Workspace. | Передавать semantic/product leads. Статус: authoritative for ER method. |
| SRC-05 | Google Doc “Анализ и оптимизация ChatAVG v2” | Аудит и оптимизация: shift-left смыслового слоя, параллельные tracks, market positioning. | Включить идеи в roadmap; хранить как архитектурный review note. |
| SRC-06 | ChatAVG_Agent_Platform_V2_Concept_v2.docx | Architecture review: provider-neutral core, Model/Knowledge/MCP Tool Gateways, latency budgets, security/cost/migration DoD. | Использовать как источник для architecture pack. Статус: authoritative input, partially superseded by v2.3. |
| SRC-07 | ChatAVG_V2_Delivery_Plan_Sprints_Testing_New_Architecture.docx / .md | Предыдущий delivery-план на новой архитектуре. | Reference only. Не использовать вместо v2.3. |
| SRC-08 | ChatAVG_Agent_Platform_V2_Implementation_Plan.docx | Старый план: contract-first delivery, testing gates, runbooks, eval/load/chaos levels. | Reference only. Решения “MCP для inference” и “sandbox-per-chat default” считать superseded. |
| SRC-09 | ChatAVG_Agent_Platform_V2_Concept.docx | Старая концепция MCP Provider Mesh и sandbox-per-chat agents. | Historical reference only. Не отдавать как рабочий target без cover note. |
| SRC-10 | Repo: PROJECT_BACKLOG.md | Центральный живой backlog, roadmap и история решений. | Обновить под v2.3 до kickoff и передавать как active source. |
| SRC-11 | Repo: PROJECT_MAP.md | Карта текущей архитектуры, зависимостей, API и компонентов. | Обновлять после каждого sprint closure. Передавать backend/QA/SRE. |
| SRC-12 | Repo: UI_AUDIT.md | UI/security audit: mobile, safe-area, touch targets, XSS, темизация, status-dot. | Передавать UX/frontend/QA. Обновить перед UI sprint. |
| SRC-13 | Repo: AGENT_INSTRUCTIONS.md | Правила работы AI-агента в репозитории: planning, tests, refresh, commit/push discipline, no Python by default. | Передавать команде как workflow constraints; обновить под человеческий delivery process. |


## Минимальный kickoff-пакет
| ID | Документ | Назначение | Приоритет / статус / владелец |
| --- | --- | --- | --- |
| K-01 | README_HANDOVER.md | Один входной документ: что читать первым, какие документы authoritative, какие superseded, как стартовать Sprint 0. | P0 / создать / PM + Tech Lead |
| K-02 | DOCUMENT_REGISTER.md | Этот реестр: полный список документов, владельцев, статусов и сроков готовности. | P0 / создать / PMO |
| K-03 | PROJECT_BRIEF.md | Цели продукта, проблема, целевые пользователи, business value, high-stakes positioning, success metrics. | P0 / создать / Product Owner |
| K-04 | VISION_SCOPE_ANTI_GOALS.md | Что строим, что не строим, границы v2.3, запрет big-bang rewrite, запрет sandbox-per-chat default. | P0 / собрать из концепций / Product + Architect |
| K-05 | ROADMAP_V2_3.md | 16 спринтов, tracks, gates, MVP/Beta/RC logic, release phases. | P0 / готово из v2.3 / PM |
| K-06 | PROJECT_BACKLOG.md | P0/P1/P2 backlog, sprint backlog, история изменений, done checklist. | P0 / обновить / PM + Tech Lead |
| K-07 | ADR_INDEX.md | Индекс архитектурных решений: Temporal, LiteLLM, E2B, Model Gateway, MCP Tool Gateway, Semantic shift-left. | P0 / создать из v2.2 + v2.3 / Architect |
| K-08 | RISK_REGISTER.md | Риски по спринтам: repo hygiene, latency, Temporal, RAG quality, semantic complexity, cost, rollback. | P0 / обновить / PM + QA + SRE |
| K-09 | RACI_OWNERSHIP_MATRIX.md | Кто владеет компонентами, документами, решениями, review и sign-off. | P0 / создать / PMO |
| K-10 | GLOSSARY.md | Единый словарь: Mission, AgentRun, Claim, DomainBoundary, ToolCall, Approval, Forge, Fast/Studio/Lab/Forge. | P0 / создать / Product + Architect |


## 1. Архитектура и технический дизайн
| ID | Документ | Назначение | Приоритет / статус / владелец |
| --- | --- | --- | --- |
| ARCH-01 | ARCHITECTURE_OVERVIEW_V2_3.md | Целевая архитектура: Core Platform, Agent Control Plane, Durable Runtime, Model/Knowledge/MCP Tool Gateways, Sandbox Manager, Policy/Cost/Audit. | P0 / создать из technical concept / Architect |
| ARCH-02 | C4_CONTEXT_CONTAINER_COMPONENT.md | C4-диаграммы Context, Container, Component; границы сервисов и ответственность слоев. | P0 / создать / Architect |
| ARCH-03 | COMPONENT_OWNERSHIP_MAP.md | Компонент → владелец → репозиторий/папка → интерфейсы → SLA → риски. | P0 / создать / Tech Lead |
| ARCH-04 | RUNTIME_MODES_AND_LATENCY_BUDGET.md | Fast, Studio, Lab, Forge; sync_interactive, sync_retrieval, sync_tool, async_agent; latency budgets. | P0 / создать / Architect + QA |
| ARCH-05 | FAST_PATH_DESIGN.md | Simple chat path без sandbox/live tool discovery/heavy RAG; guardrails и regression tests. | P0 / создать / Backend Lead |
| ARCH-06 | DURABLE_AGENT_RUNTIME_DESIGN.md | AgentRun через Temporal-first: workflow, signals, timers, replay, cancellation, idempotency. | P0 / создать / Backend + SRE |
| ARCH-07 | MODEL_GATEWAY_DESIGN.md | LiteLLM Proxy / adapter, ModelRegistry, routing, fallback, virtual keys, cost tracking, provider abstraction. | P0 / создать / Backend Lead |
| ARCH-08 | KNOWLEDGE_GATEWAY_DESIGN.md | RAG modes, ingestion, retrieval, citations, reranking, degradation path, eval thresholds. | P1 / до Sprint 10 / ML Lead |
| ARCH-09 | MCP_TOOL_GATEWAY_AND_REGISTRY.md | MCP только для tools/connectors; versioned schemas, schemaHash, riskClass, authScope, canary rollout. | P1 / до Sprint 13 / Backend + Security |
| ARCH-10 | HYBRID_SANDBOX_FORGE_DESIGN.md | E2B primary, Daytona alternative, warm pool, TTL, cleanup, egress, workspace mount, artifact extraction. | P1 / до Sprint 14 / SRE + Security |
| ARCH-11 | POLICY_COST_AUDIT_CONTROL_PLANE.md | PolicyDecision, CostPolicy, budgets, audit events, allow/deny/approval/downgrade. | P0 / до Sprint 8 / Security + Backend |
| ARCH-12 | DATA_MODEL_AND_STATE_MACHINES.md | Mission, AgentRun, ToolCall, ApprovalRequest, SandboxSession, Artifact, Claim, DomainBoundary state machines. | P0 / создать / Architect + Backend |
| ARCH-13 | MIGRATION_ROLLOUT_AND_V1_FALLBACK.md | Feature flags, A/B, shadow evals, tenant-by-tenant rollout, rollback, V1 fallback path. | P0 / создать / PM + SRE |
| ARCH-14 | OPEN_DECISIONS_AND_ASSUMPTIONS.md | Нерешенные решения: Temporal vs Restate fallback, default RAG mode, second provider, trace tooling, approval granularity. | P0 / создать / Architect |


## 2. ER Meaning Layer и продуктовая методология
| ID | Документ | Назначение | Приоритет / статус / владелец |
| --- | --- | --- | --- |
| ER-01 | ER_MEANING_LAYER_SPEC.md | Meaning-first principles, no hidden authority, human sovereignty, safe depth handling, semantic quality gates. | P0 / создать / Semantic Lead |
| ER-02 | SEMANTIC_PROTOCOL_SPEC.md | Версия протокола, mission binding, glossary version, protocol depth by runtime mode. | P0 / Sprint 5 / Semantic + Backend |
| ER-03 | CLAIM_LEDGER_SPEC.md | Claim types, strength, evidence, source, downgrade rules, trace binding, artifact references. | P0 / Sprint 5 / Semantic Lead |
| ER-04 | DOMAIN_BOUNDARY_RULES.md | Область определения, уровни реальности, запрет сильных выводов без основания, downgrade language. | P0 / Sprint 5 / Semantic Lead |
| ER-05 | ROLE_PASSES_CONTRACTS.md | Observer, Boundary, Language, Psychic Distortion, System, Trajectory, Builder/Synthesizer contracts. | P1 / Sprint 12 / Semantic + Product |
| ER-06 | ADEQUACY_ENGINE_DESIGN.md | Пайплайн Claim Extraction → Domain Mapping → Distortion Passes → ArtifactPatch → ConflictCard. | P1 / Sprint 12 / Architect + Semantic |
| ER-07 | CONFLICT_CARDS_DECISION_RECORDS.md | Человеческие решения, развилки, rationale, edited approvals, non-diagnostic trajectory questions. | P1 / Sprint 12 / Product |
| ER-08 | ARTIFACT_WORKSPACE_SPEC.md | Artifact versions, ArtifactPatch, diff viewer, claim references, export rules. | P1 / Sprint 12 / Frontend + Backend |
| ER-09 | SEMANTIC_OBSERVABILITY.md | Метрики: claim downgrade, boundary violations, language substitutions, hidden authority attempts, user corrections. | P1 / Sprint 11 / QA + Semantic |
| ER-10 | SEMANTIC_EVAL_GOLDEN_SET.md | Golden set для Claim extraction, domain boundaries, hidden authority, role discipline, artifact traceability. | P0 seed Sprint 5; full P1 Sprint 11 / QA + Semantic |


## 3. API, event contracts и схемы
| ID | Документ | Назначение | Приоритет / статус / владелец |
| --- | --- | --- | --- |
| SPEC-001 | CANONICAL_CHAT_EVENT.md | delta, done, error, tool_call, retrieval, usage, trace; AsyncIterable contract для provider adapters. | P0 / Sprint 2 / Backend |
| SPEC-002 | AGENT_RUN_EVENT.md | SSE/replayable events: run.created, model.stream_started, tool.call_requested, approval.*, artifact.*. | P0 / Sprint 6 / Backend + Frontend |
| SPEC-003 | AGENT_RUN_STATE_MACHINE.md | queued, running, requires_action, waiting, completed, failed, cancelled, expired + transition rules. | P0 / Sprint 6 / Backend |
| SPEC-004 | OPENAPI_CORE_API.yaml | Auth, users, sessions, chat completions, missions, agent-runs, approvals, artifacts, providers, health/ready. | P0 / Sprint 6 / Backend |
| SPEC-005 | MISSION_ROOM_API.md | Mission create/intake/briefing/status, semanticProtocolId, glossaryVersion, runtime mode. | P1 / Sprint 9-12 / Backend + Frontend |
| SPEC-006 | MODEL_REGISTRY_API.md | models.list, provider health, fallback, cost metadata, admin visibility, no SDK leakage. | P0 / Sprint 3-4 / Backend |
| SPEC-007 | KNOWLEDGE_GATEWAY_API.md | Retrieval modes, RetrievalResult, Citation, provenance, source validation, empty retrieval behavior. | P1 / Sprint 10 / ML + Backend |
| SPEC-008 | TOOL_DEFINITION_VERSION_SCHEMA.md | providerId, toolName, version, schemaHash, input/output schema, riskClass, authScope, timeout, retry. | P1 / Sprint 13 / Backend + Security |
| SPEC-009 | TOOL_CALL_APPROVAL_SCHEMA.md | ToolCall, ApprovalRequest, preview/diff, choices, edited approvals, timeouts, step-up auth. | P0 / Sprint 8 / Backend + Frontend |
| SPEC-010 | POLICY_DECISION_SCHEMA.md | Policy input/output: allow, deny, require_approval, require_step_up_auth, downgrade. | P0 / Sprint 8 / Security |
| SPEC-011 | COST_POLICY_AND_ESTIMATE_SCHEMA.md | Tenant budgets, max cost per run, estimated model/tool/retrieval/sandbox usage. | P0 / Sprint 8 / Backend + SRE |
| SPEC-012 | AUDIT_TRACE_EVENT_SCHEMA.md | Audit/trace event contract, redaction rules, searchable fields, retention. | P0 / Sprint 8 / Security + SRE |
| SPEC-013 | ARTIFACT_PATCH_SCHEMA.md | ArtifactPatch, artifact versioning, patch rationale, claim references, export state. | P1 / Sprint 12 / Backend + Frontend |
| SPEC-014 | ERROR_CONTRACT.md | Canonical errors, retryable/non-retryable, provider errors, user-visible messages, correlationId. | P0 / Sprint 1-2 / Backend + QA |
| SPEC-015 | FEATURE_FLAGS_SPEC.md | Флаги agent_runs, litellm, semantic_layer, knowledge_gateway, tool_gateway, sandbox_forge, temporal_runtime. | P0 / Sprint 0 / Backend + SRE |


## 4. Данные, миграции и конфигурация
| ID | Документ | Назначение | Приоритет / статус / владелец |
| --- | --- | --- | --- |
| DATA-01 | DATABASE_ERD_AND_SCHEMA.md | SQLite/current schema, target schema, indexes, migrations, event/audit tables. | P0 / Sprint 1-6 / Backend |
| DATA-02 | MIGRATION_PLAN_DATA.md | V1 sessions/categories/users → v2 missions/runs/artifacts; dry-run, rollback, validation. | P1 / Sprint 16 / Backend + SRE |
| DATA-03 | RETENTION_AND_DELETION_POLICY.md | TTL, archived/deleted states, artifacts cleanup, logs retention, tenant deletion. | P1 / before beta / Security + Product |
| DATA-04 | TENANT_USER_AUTH_MODEL.md | Users, categories, roles, tenant/workspace boundaries, admin permissions. | P0 / Sprint 1 / Backend + Security |
| DATA-05 | ENV_SECRETS_CONFIG_CONTRACT.md | Environment variables, secret scopes, local/staging/prod, provider credentials, no raw secrets in prompts. | P0 / Sprint 0-1 / SRE + Security |
| DATA-06 | BACKUP_RESTORE_POLICY.md | DB backup, artifact backup, restore drills, RPO/RTO, disaster recovery tests. | P1 / before RC / SRE |


## 5. Разработка, репозиторий и CI/CD
| ID | Документ | Назначение | Приоритет / статус / владелец |
| --- | --- | --- | --- |
| DEV-01 | LOCAL_DEVELOPMENT_SETUP.md | Node.js setup, repo paths, npm scripts, .env.example, test DB, MCP gateway local run. | P0 / Sprint 0 / Tech Lead |
| DEV-02 | CODING_STANDARDS.md | Node.js/TypeScript style, module boundaries, zod validation, error handling, logging, no Python unless approved. | P0 / Sprint 0 / Tech Lead |
| DEV-03 | GIT_BRANCHING_AND_PR_WORKFLOW.md | Branch strategy, PR template, review requirements, no direct main, semantic commits. | P0 / Sprint 0 / Tech Lead |
| DEV-04 | CODE_REVIEW_CHECKLIST.md | Security, contract, tests, observability, rollback, docs update, PROJECT_MAP refresh. | P0 / Sprint 0 / Tech Lead + QA |
| DEV-05 | CI_CD_PIPELINE.md | PR, nightly, release jobs; unit/integration/security/eval/load gates; artifact publishing. | P0 / Sprint 1 / SRE + QA |
| DEV-06 | ENVIRONMENT_MATRIX.md | Local, dev, staging, production; services, ports, secrets, test data, feature flags. | P0 / Sprint 1 / SRE |
| DEV-07 | MOCKS_AND_SYNTHETIC_PROVIDERS.md | Deterministic provider, fake MCP server, mock Temporal, fake sandbox, fixtures. | P0 / Sprint 1-2 / QA + Backend |
| DEV-08 | DEPENDENCY_AND_LICENSE_REGISTER.md | Dependencies, licenses, upgrade policy, vulnerable packages, allowed vendors. | P1 / before beta / SRE + Security |
| DEV-09 | PROJECT_MAP_REFRESH_PROCESS.md | Как и когда запускать `node dev_studio/refresh.js`, как проверять dependency map. | P0 / Sprint 0 / Tech Lead |
| DEV-10 | API_MOCKS_AND_POSTMAN_COLLECTION.md | Collections для smoke/UAT; пример токенов, users, sessions, agent-runs, approvals. | P1 / Sprint 6-9 / QA + Backend |


## 6. QA, evals и release gates
| ID | Документ | Назначение | Приоритет / статус / владелец |
| --- | --- | --- | --- |
| QA-01 | TEST_STRATEGY.md | Unit, integration, contract, E2E, security, load, chaos, RAG evals, semantic evals, UAT. | P0 / Sprint 1 / QA Lead |
| QA-02 | TEST_MATRIX.md | Компонент × уровень тестов × owner × CI job × coverage target × release gate. | P0 / Sprint 1 / QA Lead |
| QA-03 | CONTRACT_TEST_PLAN.md | CanonicalChatEvent, AgentRunEvent, API schemas, ToolDefinitionVersion, ApprovalRequest. | P0 / Sprint 2-8 / QA + Backend |
| QA-04 | REGRESSION_BASELINE.md | Текущее поведение V1: login, sessions, chat, providers, admin, UI, security, latency. | P0 / Sprint 1 / QA |
| QA-05 | SECURITY_TEST_PLAN.md | CORS, SSRF, prompt injection, tool-output injection, approval bypass, secrets leakage, sandbox egress. | P0 / Sprint 1-8 / Security + QA |
| QA-06 | PERFORMANCE_LOAD_TEST_PLAN.md | P50/P95/P99, TTFT, concurrent chats, queue depth, tool latency, sandbox cold/warm starts. | P1 / Sprint 15 seed earlier / QA + SRE |
| QA-07 | CHAOS_TEST_PLAN.md | Provider timeout, Temporal worker restart, sandbox crash, vector store outage, stream disconnect, rollback drill. | P1 / Sprint 15 / SRE + QA |
| QA-08 | RAG_EVAL_PLAN.md | Answerable/unanswerable/adversarial datasets; context precision/recall, citation correctness, hallucination rate. | P1 / Sprint 10-11 / ML + QA |
| QA-09 | SEMANTIC_EVAL_PLAN.md | Claim extraction, domain boundary, role discipline, hidden authority, artifact traceability. | P0 seed Sprint 5; P1 Sprint 11 / Semantic + QA |
| QA-10 | UAT_SCENARIOS.md | Пользовательские сценарии: fast chat, mission, approval, artifact, RAG answer, Forge action, rollback. | P1 / Sprint 9-16 / Product + QA |
| QA-11 | TEST_DATA_FIXTURES.md | Users, categories, sessions, docs, RAG corpus, prompt-injection payloads, approval examples. | P0 / Sprint 1 / QA |
| QA-12 | RELEASE_GATES_AND_DOD.md | Definition of Ready/Done, sprint gates, MVP/Beta/RC gates, sign-off criteria. | P0 / Sprint 0-1 / PM + QA |


## 7. Security, policy и compliance
| ID | Документ | Назначение | Приоритет / статус / владелец |
| --- | --- | --- | --- |
| SEC-01 | THREAT_MODEL.md | Assets, actors, attack surfaces: LLM, tools, MCP, sandbox, credentials, tenant data, artifacts. | P0 / Sprint 0-1 / Security |
| SEC-02 | AUTHN_AUTHZ_RBAC_POLICY.md | JWT, admin/user roles, tenant boundaries, category permissions, step-up auth. | P0 / Sprint 1 / Security + Backend |
| SEC-03 | POLICY_ENGINE_APPROVAL_POLICY.md | Risk scoring, approval choices, low-risk auto-approve, high-risk approval + step-up + audit. | P0 / Sprint 8 / Security + Product |
| SEC-04 | PROMPT_INJECTION_DEFENSE.md | User prompt sanitization, tool output sanitization, instruction hierarchy, retrieval source trust. | P0 / Sprint 1-8 / Security |
| SEC-05 | NETWORK_EGRESS_AND_SSRF_POLICY.md | Default-deny sandbox internet, allowlists, private IP blocks, provider endpoints, logging. | P0 / Sprint 8-14 / Security + SRE |
| SEC-06 | SANDBOX_ISOLATION_POLICY.md | E2B/Daytona isolation, workspace mount, TTL, cleanup, quarantine, artifact scanning. | P1 / Sprint 14 / Security + SRE |
| SEC-07 | DATA_CLASSIFICATION_AND_DLP.md | public/internal/confidential/regulated, redaction, third-party transfer rules. | P1 / before beta / Security + Legal |
| SEC-08 | AUDIT_COMPLIANCE_LOG_SPEC.md | What is logged, retention, redaction, export, tamper resistance, trace correlation. | P0 / Sprint 8 / Security + SRE |
| SEC-09 | INCIDENT_RESPONSE_PLAYBOOK.md | Security incident flow, severity, containment, communication, evidence preservation. | P1 / before RC / Security + SRE |
| SEC-10 | SECRETS_MANAGEMENT.md | Secret storage, rotation, tenant-scoped credentials, no secrets in model-visible context. | P0 / Sprint 0-1 / SRE + Security |
| SEC-11 | VENDOR_RISK_REGISTER.md | OpenAI, LiteLLM, Temporal, E2B/Daytona, vector stores, tracing tools, model providers. | P1 / before beta / Security + PM |


## 8. UX/UI и дизайн
| ID | Документ | Назначение | Приоритет / статус / владелец |
| --- | --- | --- | --- |
| UX-01 | UX_PRODUCT_BRIEF.md | Главные сценарии: fast chat, Mission Room, approvals, artifact workspace, Forge, admin. | P0 / Sprint 0-5 / Product + UX |
| UX-02 | MISSION_LIFECYCLE_USER_FLOWS.md | Create Mission → Meaning Intake → Briefing → Claims → Artifact → Conflict → Export. | P1 / Sprint 9-12 / UX + Semantic |
| UX-03 | WIREFRAMES_AND_NAVIGATION.md | Структура экранов, панели статуса AgentRun, Mission Room, Approval Panel, Artifact Diff. | P1 / Sprint 6-12 / UX |
| UX-04 | DESIGN_SYSTEM.md | Tokens, typography, spacing, dark/light theme, mobile, touch targets, components. | P1 / before beta / UX + Frontend |
| UX-05 | APPROVAL_UX_SPEC.md | Preview/diff, grouped approvals, approve_once/session/run, edit_then_approve, reject_and_explain. | P0 / Sprint 8 / UX + Product |
| UX-06 | ARTIFACT_WORKSPACE_UX.md | Artifact versions, patches, claim references, export states, conflict cards. | P1 / Sprint 12 / UX + Frontend |
| UX-07 | AGENTRUN_STATUS_AND_PROGRESS_UI.md | Progress states, reconnect, async threshold, background notifications, failure states. | P0 / Sprint 6-9 / UX + Frontend |
| UX-08 | ERROR_EMPTY_LOADING_STATES.md | Provider unavailable, vector store unavailable, approval timeout, sandbox cold start, cost exceeded. | P1 / Sprint 9-16 / UX + QA |
| UX-09 | ACCESSIBILITY_AND_MOBILE_GUIDELINES.md | 44x44 touch targets, aria-labels, safe area, keyboard navigation, contrast, responsive breakpoints. | P0 / from UI_AUDIT / UX + QA |
| UX-10 | UI_AUDIT.md | Текущий UI/security audit: resolved issues, pending theme/status-dot gaps. | P0 / update repo doc / Frontend + QA |


## 9. Ops/SRE, deploy и runbooks
| ID | Документ | Назначение | Приоритет / статус / владелец |
| --- | --- | --- | --- |
| OPS-01 | DEPLOYMENT_ARCHITECTURE.md | Services, ports, Docker/Compose/K8s, Temporal, LiteLLM, E2B, DB, storage, MCP gateway. | P1 / before staging / SRE |
| OPS-02 | ENVIRONMENT_RUNBOOK.md | Local/dev/staging/prod startup, health checks, readiness, smoke commands. | P0 / Sprint 1 / SRE |
| OPS-03 | OBSERVABILITY_DASHBOARDS.md | Cost, latency, approvals, sandbox, model calls, RAG quality, semantic quality, errors. | P1 / Sprint 15 seed earlier / SRE + QA |
| OPS-04 | ALERTING_AND_SLO.md | Availability, P95 latency, queue depth, error rate, budget exceeded, sandbox cleanup failure. | P1 / before beta / SRE |
| OPS-05 | RUNBOOK_MODEL_PROVIDER_OUTAGE.md | OpenAI/LiteLLM/provider timeout, fallback, downgrade, user messaging, escalation. | P0 / Sprint 4-9 / SRE + Backend |
| OPS-06 | RUNBOOK_TEMPORAL_WORKFLOW_STUCK.md | Workflow replay, stuck approval, retry storms, worker restart, payload history growth. | P1 / Sprint 7 / SRE + Backend |
| OPS-07 | RUNBOOK_SANDBOX_CLEANUP_FAILURE.md | Leaked sandbox, TTL enforcement, quarantine, cost spike, manual cleanup. | P1 / Sprint 14 / SRE |
| OPS-08 | RUNBOOK_RETRIEVAL_VECTORSTORE_FAILURE.md | Degrade to no_retrieval/fast, warning to user, retry, reindex, data validation. | P1 / Sprint 10-11 / ML + SRE |
| OPS-09 | RUNBOOK_HIGH_COST_OR_QUOTA_EXCEEDED.md | Budget breach, downgrade, throttle, notify admin, stop run, summarize partial state. | P0 / Sprint 8-15 / SRE + Product |
| OPS-10 | ROLLBACK_RUNBOOK.md | Feature flag rollback, V1 fallback, DB rollback, traffic rollback, dry-run checklist. | P0 / before MVP and RC / SRE + PM |
| OPS-11 | CAPACITY_AND_COST_PLAN.md | Expected concurrency, tokens, retrieval queries, sandbox minutes, storage, cost per successful run. | P1 / before beta / SRE + Finance |
| OPS-12 | DISASTER_RECOVERY_BACKUP_RESTORE.md | RPO/RTO, backup schedule, restore drill, disaster communication. | P1 / before RC / SRE |


## 10. Governance, onboarding и управление изменениями
| ID | Документ | Назначение | Приоритет / статус / владелец |
| --- | --- | --- | --- |
| GOV-01 | KICKOFF_DECK.pdf/pptx | Короткая презентация: цель, архитектура, plan, roles, risks, first 2 sprints. | P0 / создать / PM + Architect |
| GOV-02 | TEAM_ONBOARDING_GUIDE.md | Что прочитать по ролям, как поднять проект, кто принимает решения, как задавать вопросы. | P0 / создать / PMO |
| GOV-03 | TRAINING_PLAN.md | Temporal, LiteLLM, E2B, ER Method, security approval model, eval workflow. | P1 / Sprint 0-3 / Tech Lead |
| GOV-04 | DEMO_SCENARIOS.md | Weekly demo scripts: fast path, semantic PoC, AgentRun, approval, artifact, RAG, Forge. | P1 / Sprint 5-16 / Product + QA |
| GOV-05 | FAQ_FOR_DEVELOPMENT_TEAM.md | Почему не sandbox-per-chat, почему MCP only tools, почему Temporal, почему semantic shift-left. | P0 / создать / Architect |
| GOV-06 | CHANGE_CONTROL_PROCESS.md | Как вносить архитектурные изменения, обновлять ADR, менять scope, фиксировать decisions. | P0 / создать / PM + Architect |
| GOV-07 | STATUS_REPORT_TEMPLATE.md | Weekly status: sprint progress, risks, decisions, blocked docs, testing gates, demo notes. | P0 / создать / PMO |
| GOV-08 | ESCALATION_CONTACTS.md | Owner matrix для architecture, security, SRE, UX, semantic, product decisions. | P0 / создать / PMO |


## Рекомендуемая структура папок в репозитории

```text
docs/
  00_handover/
    README_HANDOVER.md
    DOCUMENT_REGISTER.md
    SOURCE_DOCUMENTS.md
  01_product/
    PROJECT_BRIEF.md
    VISION_SCOPE_ANTI_GOALS.md
    ROADMAP_V2_3.md
    GLOSSARY.md
  02_architecture/
    ARCHITECTURE_OVERVIEW_V2_3.md
    C4_CONTEXT_CONTAINER_COMPONENT.md
    RUNTIME_MODES_AND_LATENCY_BUDGET.md
    DATA_MODEL_AND_STATE_MACHINES.md
  03_adr/
    ADR_INDEX.md
    ADR-001-temporal-durable-runtime.md
    ADR-002-litellm-model-gateway.md
    ADR-003-e2b-hybrid-sandbox.md
    ADR-004-mcp-tool-gateway.md
    ADR-005-semantic-shift-left.md
  04_specs/
    SPEC-001-CANONICAL_CHAT_EVENT.md
    SPEC-002-AGENT_RUN_EVENT.md
    SPEC-003-AGENT_RUN_STATE_MACHINE.md
    OPENAPI_CORE_API.yaml
  05_delivery/
    PROJECT_BACKLOG.md
    SPRINT_PLAN_V2_3.md
    RELEASE_GATES_AND_DOD.md
  06_testing/
    TEST_STRATEGY.md
    TEST_MATRIX.md
    REGRESSION_BASELINE.md
    RAG_EVAL_PLAN.md
    SEMANTIC_EVAL_PLAN.md
  07_security/
    THREAT_MODEL.md
    POLICY_ENGINE_APPROVAL_POLICY.md
    PROMPT_INJECTION_DEFENSE.md
    NETWORK_EGRESS_AND_SSRF_POLICY.md
  08_ux/
    UX_PRODUCT_BRIEF.md
    APPROVAL_UX_SPEC.md
    ARTIFACT_WORKSPACE_UX.md
    ACCESSIBILITY_AND_MOBILE_GUIDELINES.md
  09_ops/
    DEPLOYMENT_ARCHITECTURE.md
    OBSERVABILITY_DASHBOARDS.md
    ALERTING_AND_SLO.md
    runbooks/
  10_archive_reference/
    superseded_old_concepts/
    external_reviews/
```



## Пакеты документов по ролям
| Роль | Какие документы получает в первую очередь |
| --- | --- |
| PM / Product Owner | PROJECT_BRIEF, VISION_SCOPE_ANTI_GOALS, ROADMAP, BACKLOG, RISK_REGISTER, RACI, UAT, status template. |
| Architect / Tech Lead | ARCHITECTURE_OVERVIEW, C4 diagrams, ADR_INDEX, data/state machines, open decisions, coding standards, review checklist. |
| Backend team | OpenAPI, CanonicalChatEvent, AgentRunEvent, DurableRuntime, ModelGateway, Policy/Cost/Audit, DB schema, mocks. |
| Frontend / UX team | UX flows, AgentRun status UI, Approval UX, Artifact Workspace UX, design system, accessibility guidelines, API event contracts. |
| Semantic/Product Method team | ER Meaning Layer, SemanticProtocol, Claim Ledger, DomainBoundary, Role Passes, semantic evals, glossary. |
| ML / Knowledge team | KnowledgeGateway design, RAG modes, RetrievalResult/Citation, RAG evals, datasets, quality thresholds. |
| QA / Evals team | Test strategy, test matrix, regression baseline, contract/security/load/chaos plans, RAG and semantic eval datasets. |
| Security team | Threat model, approval policy, prompt-injection defense, SSRF/egress, sandbox isolation, audit/compliance, secrets management. |
| SRE / DevOps | Deployment architecture, environment matrix, CI/CD, dashboards, alerting/SLO, runbooks, rollback, capacity/cost, DR. |


## Readiness gates по срокам
| Срок / gate | Документы, которые должны быть готовы |
| --- | --- |
| До Sprint 0 kickoff | README_HANDOVER, DOCUMENT_REGISTER, v2.3 Roadmap, PROJECT_BACKLOG, ADR_INDEX, RISK_REGISTER, ARCHITECTURE_OVERVIEW, RACI, GLOSSARY, OPEN_DECISIONS, repo hygiene decision. |
| До Sprint 1 | TEST_STRATEGY, TEST_MATRIX, REGRESSION_BASELINE, LOCAL_DEVELOPMENT_SETUP, CI/CD plan, ENV_SECRETS_CONFIG, THREAT_MODEL, UI_AUDIT update. |
| До Sprint 2 | CANONICAL_CHAT_EVENT, FAST_PATH_DESIGN, ERROR_CONTRACT, MOCKS_AND_SYNTHETIC_PROVIDERS, latency baseline. |
| До Sprint 4 | MODEL_REGISTRY_API, MODEL_GATEWAY_DESIGN, LiteLLM pilot plan, provider health and cost contracts. |
| До Sprint 5 gate | SEMANTIC_PROTOCOL_SPEC, CLAIM_LEDGER_SPEC, DOMAIN_BOUNDARY_RULES, SEMANTIC_EVAL_GOLDEN_SET seed. |
| До Sprint 8 | POLICY_DECISION_SCHEMA, APPROVAL_UX_SPEC, COST_POLICY, AUDIT_TRACE_EVENT, SECURITY_TEST_PLAN, NETWORK_EGRESS policy draft. |
| До Sprint 9 MVP | MVP release notes, UAT_SCENARIOS, ROLLBACK_RUNBOOK, AgentRunEvent/UI docs, demo scenarios. |
| До Beta | KnowledgeGateway, RAG evals, Role Passes, Artifact Workspace, MCP Tool Registry, design system, vendor risk. |
| До RC | Full migration plan, DR/backup restore, incident response, load/chaos reports, security sign-off, final release gate. |


## Правила контроля версий документов

- Каждый документ имеет шапку: `ID`, `version`, `status`, `owner`, `reviewers`, `last updated`, `source docs`, `next review`.
- Допустимые статусы: `draft`, `in review`, `approved`, `active`, `superseded`, `archived`.
- Документы с архитектурными решениями меняются только через ADR/change control.
- Старые документы не удаляются, но переносятся в `docs/10_archive_reference/` и маркируются как `superseded`.
- После каждого спринта обновляются: `PROJECT_BACKLOG.md`, `PROJECT_MAP.md`, sprint report, risk register, release gates, affected specs.



## Критические предупреждения для передачи

1. Не отдавать старый Implementation Plan как основной: там есть решения, которые уже заменены v2.3.
2. Не смешивать MCP Tool Gateway и Model Gateway: MCP используется для tools/connectors, inference идет через Model Gateway.
3. Не запускать sandbox для каждого простого чата: fast path должен оставаться быстрым.
4. Не откладывать SemanticProtocol/ClaimLedger/DomainBoundary до конца: это P0-gate на Sprint 5.
5. Не начинать разработку без regression baseline, feature flags и rollback path.



## Definition of Ready для передачи команде

Команда может стартовать Sprint 0, когда выполнено:

- Есть `README_HANDOVER.md`, `DOCUMENT_REGISTER.md`, `ROADMAP_V2_3.md`, `PROJECT_BACKLOG.md`, `ADR_INDEX.md`, `RISK_REGISTER.md`.
- У каждого P0-документа есть владелец и reviewer.
- Все superseded-документы вынесены в архив и не конфликтуют с актуальным roadmap.
- Репозиторий чистый, старый PR #1 закрыт/переписан, `.gitignore` защищает модели, cache, secrets и runtime data.
- Описаны first sprint tasks, тестовые команды, локальный запуск, CI checks и expected outputs.
