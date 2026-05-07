# ChatAVG v2.3 Remediation Sprint Plan

**Документ:** План спринтов по устранению несоответствий исходному проектному плану `ChatAVG_v2.3_Optimized_Delivery_Plan_Sprints_Testing`  
**Версия:** 1.0  
**Дата:** 7 мая 2026  
**Статус:** Remediation / Architecture Alignment Plan  
**Основание:** аудит текущего репозитория `xlabkm-ux/chat_avg` и сопоставление с целевой архитектурой ChatAVG v2.3

---

## 0. Executive summary

Текущий репозиторий уже содержит важный архитектурный каркас ChatAVG v2.3: fast path, feature flags, AgentRun, SemanticProtocol, KnowledgeGateway, ToolGateway, SandboxManager, Temporal skeleton, policy/cost/audit элементы и тестовые команды. Однако значительная часть реализации находится на уровне PoC/skeleton/mock, тогда как исходный delivery-план v2.3 предполагает более зрелое состояние: production-ready runtime, durable execution, реальные quality gates, устойчивый semantic layer, рабочий KnowledgeGateway, ToolGateway, Forge sandbox и честные release gates.

Цель этого remediation-плана — не переписывать проект, а привести текущую реализацию в соответствие с v2.3 через серию коротких спринтов, закрывающих выявленные несоответствия.

---

## 1. Целевые принципы remediation

1. Не начинать новые feature tracks, пока не закрыта достоверность текущих статусов.
2. Не считать PoC production-реализацией.
3. Сохранять fast path как неприкосновенный baseline.
4. Все опасные действия должны проходить через policy / approval / audit.
5. Semantic Layer должен стать проверяемым USP, а не декоративным middleware.
6. Temporal должен стать реальным durable runtime, а не демонстрационным workflow.
7. KnowledgeGateway должен работать с реальными источниками, chunk provenance и citation contract.
8. Forge sandbox не должен использовать local fallback в production.
9. Release gates должны измерять фактическое поведение, а не наличие файлов и scripts.
10. Каждый sprint должен завершаться тестовым gate и обновлением PROJECT_MAP / PROJECT_BACKLOG.

---

## 2. Карта ключевых несоответствий

| № | Область v2.3 | Текущее состояние | Целевое состояние | Приоритет |
|---|---|---|---|---|
| G-01 | Repo hygiene / Sprint 0 | В проектной карте видны `dist/` и `dist/src/` дубли; статусы backlog завышены | Чистый repo, честные статусы, authoritative docs | P0 |
| G-02 | Release gates | Заявлены Sprint 16/17, но часть компонентов skeleton/mock | Release gates основаны на тестах, evals, security review, load/chaos | P0 |
| G-03 | Temporal DurableRuntime | Workflow демонстрационный, activities mock | Durable AgentRun с signals, retries, idempotency, replay safety | P0 |
| G-04 | AgentRun events | SSE local EventEmitter, event table используется неполно | Persisted event log + recoverable event stream | P0 |
| G-05 | Sandbox / Forge | Local adapter может стать fallback без true isolation | Production требует E2B или fail-closed | P0 |
| G-06 | Policy / Cost / Audit | Rule-based minimal policy | Full control plane в execution path | P1 |
| G-07 | SemanticProtocol | Rule-based extractor, in-memory ledger | Persisted ClaimLedger, evidence/source spans, semantic evals | P1 |
| G-08 | KnowledgeGateway | Mock retriever | Real retriever adapter, chunk store, citation contract | P1 |
| G-09 | ToolGateway | State machine есть, schema validation и persistence неполные | Versioned tool registry, validation, approval lifecycle, audit | P1 |
| G-10 | ChatService boundaries | ChatService стал orchestration monolith | Controllers/services/gateways separated | P1 |
| G-11 | UI audit | Высокая оценка без evidence matrix | Проверяемый UI/security audit protocol | P2 |
| G-12 | Observability | TraceBus частично, dashboard placeholders | Реальные traces, costs, semantic, sandbox and RAG metrics | P2 |

---

## 3. Remediation roadmap overview

| Sprint | Название | Главный результат | Gate |
|---|---|---|---|
| R0 | Reality lock and repo hygiene | Честное состояние проекта, чистый repo, исправленный backlog | Remediation baseline gate |
| R1 | Production safety hardening | Fail-closed sandbox, secure boot, route/policy hardening | Security gate |
| R2 | AgentRun durability foundation | Persisted events, durable state machine, Temporal contract | Runtime gate |
| R3 | Temporal production workflow | Real workflow signals, retries, approval waits, replay tests | Durability gate |
| R4 | Semantic Layer v0.2 | Persisted ClaimLedger, evidence spans, eval seed | Semantic USP gate |
| R5 | KnowledgeGateway MVP | Real retrieval, citations, answerability policy | RAG architecture gate |
| R6 | Policy / Tool / Approval control plane | Tool validation, policy decisions, approval lifecycle, audit | Control plane gate |
| R7 | Architecture boundary refactor | ChatService decomposition and gateway boundaries | Architecture conformance gate |
| R8 | QA, observability and release readiness | Real dashboards, load/chaos, rollback and RC evidence | Release candidate gate |

---

# Sprint R0 — Reality lock and repo hygiene

**Длительность:** 1 неделя  
**Приоритет:** P0  
**Цель:** Зафиксировать фактическое состояние проекта и убрать расхождение между заявленным roadmap progress и реальной зрелостью кода.

## Scope

- Пересмотреть `PROJECT_BACKLOG.md`:
  - заменить некорректные статусы `completed` на `PoC complete`, `skeleton implemented`, `integration pending`, `production hardening pending`, `release blocker`;
  - явно отметить, какие Sprint 0–17 deliverables v2.3 реально закрыты, а какие требуют remediation.
- Создать `CURRENT_REALITY_AUDIT.md`.
- Создать `REMEDIATION_BACKLOG.md`.
- Добавить в `.gitignore`: `dist/`, `coverage/`, `.nyc_output/`, `*.tsbuildinfo`.
- Удалить `dist/` из Git index, если сборочные артефакты не должны версионироваться.
- Перегенерировать `PROJECT_MAP.md`.
- Добавить `README_HANDOVER.md` с перечнем authoritative / superseded / reference документов.
- Зафиксировать список release blockers.

## Deliverables

- `CURRENT_REALITY_AUDIT.md`
- `REMEDIATION_BACKLOG.md`
- обновлённый `PROJECT_BACKLOG.md`
- обновлённый `.gitignore`
- очищенный `PROJECT_MAP.md`
- `README_HANDOVER.md`
- `RELEASE_BLOCKERS.md`

## Testing gate

```bash
cd cons/chatavg
npm test
npm run test:pr
node dev_studio/refresh.js
```

## Exit criteria

- В `PROJECT_MAP.md` больше нет `dist/` / `dist/src/` дублей.
- Backlog не заявляет production-завершение для skeleton/mock компонентов.
- Все remediation issues заведены и имеют owner / priority / target sprint.
- Fast path tests проходят после repo cleanup.

---

# Sprint R1 — Production safety hardening

**Длительность:** 1 неделя  
**Приоритет:** P0  
**Цель:** Закрыть критические production safety gaps до продолжения архитектурной разработки.

## Scope

### 1. Sandbox fail-closed

- Запретить `LocalAdapter` в production.
- Если `SANDBOX_FORGE_ENABLED=true` и `NODE_ENV=production`, но `E2B_API_KEY` отсутствует — boot должен завершаться ошибкой.
- Добавить explicit env validation для sandbox provider.
- Добавить tests:
  - production + sandbox enabled + no E2B key => fail;
  - test/dev + local adapter => allowed;
  - production + E2B key => boot allowed.

### 2. Secure boot

- Запретить генерацию admin password в production.
- Если `NODE_ENV=production` и `CHATAVG_ADMIN_PASSWORD` отсутствует при first boot — fail.
- Убрать вывод generated admin password в production logs.

### 3. Route-level security

- Проверить все sensitive routes: `/api/admin`, `/api/sandboxes`, `/api/runs`, `/api/missions`, `/api/providers`.
- Для sandbox/tool/write routes добавить policy guard.
- Убедиться, что любые command/tool/code actions требуют approval или deny.

### 4. Audit hardening

- Все security-sensitive действия должны писать audit event:
  - login success/fail;
  - admin create/update/delete;
  - provider/category changes;
  - sandbox assign/run/terminate/quarantine;
  - tool call requested/approved/executed/failed;
  - policy deny/downgrade/approval.

## Deliverables

- secure boot validation
- production sandbox fail-closed behavior
- route security matrix
- audit event matrix
- tests for sandbox and admin password boot rules

## Testing gate

```bash
cd cons/chatavg
npm run test:security
npm run test:sandbox
npm run test:pr
```

## Exit criteria

- Невозможно случайно запустить local sandbox в production.
- Production не стартует с неизвестным/generated admin password.
- Sensitive actions покрыты audit logs.
- Security tests не только проходят, но и проверяют fail-closed behavior.

---

# Sprint R2 — AgentRun durability foundation

**Длительность:** 2 недели  
**Приоритет:** P0  
**Цель:** Сделать AgentRun state/event модель восстанавливаемой и пригодной для Temporal production workflow.

## Scope

### 1. Persisted event log

- `AgentRunService.emitEvent` должен писать события в `agent_run_events`.
- SSE event stream должен уметь:
  - отдавать backlog events с `sinceEventId` или `sinceTimestamp`;
  - продолжать live stream после восстановления;
  - не терять события при reconnect.

### 2. Strict state machine

- Описать разрешённые переходы:
  - `queued -> running`
  - `running -> requires_action`
  - `running -> waiting`
  - `requires_action -> running`
  - `waiting -> running`
  - `running -> completed`
  - `running -> failed`
  - `any_non_terminal -> cancelled`
  - `waiting -> expired`
- Запретить невалидные переходы.
- Добавить reason / actor / metadata для state changes.

### 3. Idempotency foundation

- Добавить таблицу `idempotency_keys`.
- Для create run, tool call, approval decision и side effects использовать idempotency key.
- Повторный запрос с тем же key должен возвращать тот же result или безопасный conflict.

### 4. AgentRun cancellation

- Cancellation должна:
  - менять state;
  - писать event;
  - signal Temporal, если workflow активен;
  - не дублировать terminal events.

## Deliverables

- persisted `agent_run_events`
- recoverable SSE stream
- strict AgentRun state machine
- idempotency table and helpers
- cancellation tests

## Testing gate

```bash
cd cons/chatavg
npm run test:integration
node --test tests/agent_run*.test.js
node --test tests/*event*.test.js
```

## Exit criteria

- После server restart можно получить историю run events.
- SSE reconnect не теряет события.
- Невалидные state transitions блокируются.
- Duplicate create/approval/tool actions не создают duplicate side effects.

---

# Sprint R3 — Temporal production workflow

**Длительность:** 2 недели  
**Приоритет:** P0  
**Цель:** Превратить Temporal skeleton в реальный DurableRuntime MVP.

## Scope

### 1. Workflow contract

- Workflow ID = `agent-run-${runId}`.
- Workflow принимает: `runId`, `missionId`, `mode`, `budgetPolicyId`, `semanticProtocolId`, `requestContextRef`.
- Workflow возвращает: final state, artifact refs, cost summary, semantic summary, decision records.

### 2. Signals

- `approveAction`
- `rejectAction`
- `editAndApproveAction`
- `cancelRun`
- `resumeRun`
- `updateBudget`

### 3. Queries

- `getRunStatus`
- `getCurrentStage`
- `getPendingApprovals`
- `getCostSoFar`

### 4. Real activities

- `loadMissionContext`
- `runModelStep`
- `runSemanticStep`
- `createApprovalRequest`
- `waitForApproval`
- `applyArtifactPatch`
- `recordDecision`
- `finalizeRun`

### 5. Replay safety

- Все non-deterministic операции только в activities.
- `Date.now()`, random IDs, provider calls и DB writes не должны жить внутри workflow body.
- Все side effects должны быть idempotent.

### 6. Failure semantics

- Provider timeout -> retry policy.
- Non-retryable provider error -> fail run.
- Approval timeout -> expired or cancelled according to policy.
- Worker restart during waiting -> workflow resumes.
- Duplicate signal -> no duplicate side effect.

## Deliverables

- `DurableRuntime` interface
- Temporal adapter implementation
- updated worker/client
- real activities
- workflow tests
- runbook for local Temporal dev cluster

## Testing gate

```bash
cd cons/chatavg
npm run test:integration
node --test tests/temporal/*.test.js
node --test tests/agent_run*.test.js
```

## Exit criteria

- AgentRun survives worker restart in `waiting` state.
- Approval signal resumes workflow.
- Provider failure follows retry/fail policy.
- Duplicate approval signal does not duplicate artifact/tool effects.
- Temporal can be disabled in dev with fallback worker, but production path is Temporal-first.

---

# Sprint R4 — Semantic Layer v0.2

**Длительность:** 2 недели  
**Приоритет:** P1  
**Цель:** Превратить SemanticProtocol из rule-based PoC в проверяемый USP-gate.

## Scope

### 1. Persisted Claim Ledger

- Добавить таблицы:
  - `claims`
  - `domain_boundaries`
  - `semantic_events`
  - `distortion_hypotheses`
  - `conflict_cards`
- Claims должны хранить:
  - `claim_text`
  - `claim_type`
  - `reality_level`
  - `evidence_basis`
  - `source_refs`
  - `source_span`
  - `domain_boundary`
  - `allowed_strength`
  - `downgraded_from`
  - `distortion_risks`
  - `requires_user_decision`

### 2. Source spans

- Для каждого claim фиксировать:
  - source id;
  - start/end char offsets, если источник текстовый;
  - message id / artifact version / retrieval chunk id;
  - confidence.

### 3. Hybrid extractor

- Сохранить rule-based hard guardrails.
- Добавить LLM structured extraction behind feature flag: `SEMANTIC_LLM_EXTRACTOR_ENABLED`.
- JSON schema validation для LLM output.
- Fallback to rule-based extractor при ошибке.

### 4. DomainBoundary v0.2

- Расширить reality levels:
  - material
  - psychic
  - social
  - linguistic
  - systemic
  - trajectory
  - indirect_depth
  - unknown
- Добавить strength downgrade policy:
  - strong
  - moderate
  - weak
  - hypothesis_only
  - question_only
- Добавить explicit no-depth-scoring tests.

### 5. Semantic eval seed

- Собрать 30–50 golden cases:
  - fact vs interpretation;
  - hidden authority;
  - psychodiagnosis;
  - legal/medical/financial downgrade;
  - language substitution;
  - unsupported strong claim;
  - trajectory question;
  - conflict card required.

## Deliverables

- persisted ClaimLedger
- hybrid extractor
- `SEMANTIC_PROTOCOL_SPEC.md`
- `CLAIM_LEDGER_SPEC.md`
- semantic golden set
- semantic eval report

## Testing gate

```bash
cd cons/chatavg
npm run eval:semantic
npm run eval:semantic:full
node --test tests/semantic/*.test.js
```

## Exit criteria

- Claims are persisted and traceable to source spans.
- Unsupported facts are downgraded.
- Hidden authority is blocked or rewritten.
- Semantic eval has explicit thresholds.
- Mission/Artifact layers can consume ClaimLedger, not only final LLM text.

---

# Sprint R5 — KnowledgeGateway MVP

**Длительность:** 2 недели  
**Приоритет:** P1  
**Цель:** Заменить mock retrieval на реальный KnowledgeGateway MVP с provenance и answerability policy.

## Scope

### 1. Retriever adapter

- Реализовать минимум один реальный retriever:
  - MVP option A: SQLite FTS5;
  - MVP option B: local file chunk index;
  - MVP option C: vector DB adapter if already available.
- Интерфейс: `search(query, config) -> RetrievalChunk[]`.

### 2. Ingestion

- Добавить ingestion pipeline:
  - source registration;
  - chunking;
  - metadata extraction;
  - provenance;
  - checksum;
  - reindex.
- Минимальные source types:
  - markdown;
  - txt;
  - doc/exported text;
  - repo docs.

### 3. Citation contract

- Каждый chunk должен иметь:
  - source id;
  - title;
  - uri/path;
  - chunk id;
  - offset or line range;
  - score;
  - retrieval mode.
- Ответы с retrieval должны содержать `_retrieval` metadata и citation-ready source refs.

### 4. Answerability policy

- `no_retrieval`
- `fast`
- `balanced`
- `max_quality`
- `refusal`
- Empty/low-score context should either refuse or answer with explicit limitation depending on policy.

### 5. RAG eval seed

- 30 cases:
  - answerable with source;
  - unanswerable;
  - low-confidence;
  - conflicting sources;
  - citation correctness;
  - hallucination trap.

## Deliverables

- real retriever adapter
- ingestion pipeline
- chunk/provenance store
- citation contract
- RAG eval seed
- `KNOWLEDGE_GATEWAY_DESIGN.md`

## Testing gate

```bash
cd cons/chatavg
node --test tests/knowledge*.test.js
node --test tests/rag*.test.js
npm run eval:rag
```

## Exit criteria

- Retrieval no longer returns only mock empty results.
- Citations are traceable to chunk/source.
- Unanswerable cases refuse or downgrade correctly.
- KnowledgeGateway does not enter fast path unless explicitly enabled.

---

# Sprint R6 — Policy / Tool / Approval control plane

**Длительность:** 2 недели  
**Приоритет:** P1  
**Цель:** Привести ToolGateway, PolicyEngine, ApprovalService и AuditService к v2.3 execution-path требованиям.

## Scope

### 1. Policy input/output spec

Расширить `PolicyDecision`:

```ts
type PolicyDecision = {
  decisionId: string;
  resolution: 'allow' | 'deny' | 'require_approval' | 'downgrade';
  riskScore: number;
  riskClass: 'READ_ONLY' | 'EXTERNAL_API' | 'SYSTEM_WRITE' | 'CODE_EXECUTION' | 'PRIVILEGED';
  reason: string;
  requiredApproval?: ApprovalRequirement;
  redactionPlan?: RedactionPlan;
  budgetImpact?: CostEstimate;
  auditLevel: 'none' | 'standard' | 'high' | 'security';
};
```

### 2. Tool Registry hardening

- Versioned tool definitions.
- Schema hash.
- Input schema validation.
- Output schema validation.
- Risk class.
- Auth scope.
- Approval policy.
- Timeout.
- Retry policy.
- Canary flag.

### 3. ToolCall persistence

- Добавить таблицу `tool_calls`.
- Persist states:
  - requested
  - validating
  - pending_approval
  - executing
  - retrying
  - completed
  - failed
- Store:
  - idempotency key;
  - policy decision;
  - approval id;
  - result ref;
  - error.

### 4. Approval lifecycle

- Approval preview:
  - action summary;
  - risk reason;
  - affected resources;
  - estimated cost;
  - irreversible effects.
- Approval states:
  - pending;
  - approved;
  - rejected;
  - expired;
  - cancelled.
- Approval decisions must be auditable and idempotent.

### 5. Cost control

- Pre-flight estimate for model/tool/sandbox actions.
- Run-level budget.
- Tenant/project/user budget placeholders.
- Deny or downgrade when budget exceeded.

## Deliverables

- `POLICY_COST_AUDIT_CONTROL_PLANE.md`
- `MCP_TOOL_GATEWAY_AND_REGISTRY.md`
- persisted tool calls
- approval preview API
- policy decision audit events
- cost estimate service v0.2

## Testing gate

```bash
cd cons/chatavg
node --test tests/policy/*.test.js
node --test tests/tool*.test.js
node --test tests/approval*.test.js
npm run test:security
```

## Exit criteria

- Side-effect tools require idempotency.
- Unknown tools require approval or deny.
- Schema-invalid tool args are rejected before approval.
- Approval is persisted and auditable.
- Cost/budget decisions can deny or downgrade action.

---

# Sprint R7 — Architecture boundary refactor

**Длительность:** 2 недели  
**Приоритет:** P1  
**Цель:** Разгрузить `ChatService` и привести runtime boundaries к target architecture v2.3.

## Scope

### 1. Split ChatService

Выделить:

- `ChatController` — HTTP request/response only.
- `FastChatService` — simple sync path.
- `ChatCompletionMapper` — OpenAI-compatible response/SSE mapping.
- `ModelGateway` — provider routing/fallback/usage/error normalization.
- `RetrievalMiddleware` — KnowledgeGateway injection.
- `SemanticMiddleware` — pre/post semantic analysis.
- `MissionBindingService` — mission creation/binding for chat.
- `RunEventPublisher` — persisted run events.

### 2. ModelGateway boundary

- Вынести provider selection and fallback из ChatService.
- Normalized contract:
  - request;
  - stream;
  - response;
  - usage;
  - latency;
  - provider id;
  - model id;
  - error mapping.
- Подготовить LiteLLM adapter, но не блокировать на нём fast path.

### 3. Fast path regression

- Fast path must not invoke:
  - sandbox;
  - live tool discovery;
  - heavy retrieval;
  - AgentRun workflow unless explicitly requested.
- Add explicit guard tests.

### 4. Configuration cleanup

- Separate env config:
  - app;
  - auth;
  - providers;
  - model gateway;
  - semantic;
  - temporal;
  - sandbox;
  - security.
- Keep backward-compatible env names where possible.

## Deliverables

- refactored services
- `MODEL_GATEWAY_DESIGN.md`
- `FAST_PATH_DESIGN.md`
- updated tests
- updated dependency graph / PROJECT_MAP

## Testing gate

```bash
cd cons/chatavg
npm run test:contract
npm run test:integration
npm run test:latency
npm run test:pr
node dev_studio/refresh.js
```

## Exit criteria

- ChatService no longer owns orchestration monolith responsibilities.
- Fast path latency baseline does not regress.
- Provider fallback behavior preserved.
- Existing `/api/chat/completions` compatibility preserved.

---

# Sprint R8 — QA, observability and release readiness

**Длительность:** 2 недели  
**Приоритет:** P2/P1  
**Цель:** Сделать release readiness проверяемой: dashboards, evals, load, chaos, rollback, security sign-off.

## Scope

### 1. Replace dashboard placeholders

- Убрать hardcoded:
  - `latency_p95: 0.69`
  - `rag_quality_score: 1.0`
  - `semantic_quality_score: 0.845`
  - sandbox warm/cold placeholder counts
- Dashboard должен читать реальные metrics.

### 2. Trace and metrics

Trace events:

- `model.requested`
- `model.stream_started`
- `model.completed`
- `model.failed`
- `retrieval.started`
- `retrieval.completed`
- `semantic.claim_created`
- `semantic.claim_downgraded`
- `semantic.authority_blocked`
- `tool.requested`
- `tool.approved`
- `tool.executed`
- `sandbox.assigned`
- `sandbox.run`
- `sandbox.terminated`
- `approval.created`
- `approval.resolved`
- `cost.estimated`
- `cost.recorded`

### 3. Load tests

- Simple chat P95.
- RAG query P95.
- AgentRun create/status/event stream.
- Approval workflow.
- Sandbox assign/run/terminate in dev/staging.
- Provider fallback under partial failure.

### 4. Chaos tests

- Provider timeout.
- Worker restart during approval wait.
- DB lock/retry.
- SSE disconnect/reconnect.
- Tool timeout.
- Sandbox provision failure.
- Retrieval failure.

### 5. Security review

- Route matrix.
- Threat model update.
- SSRF tests.
- Prompt injection / tool injection tests.
- Sandbox egress tests.
- Secret redaction tests.
- Audit log coverage.

### 6. Release package

- `RELEASE_CANDIDATE_CHECKLIST.md`
- `ROLLBACK_RUNBOOK.md`
- `MIGRATION_ROLLOUT_AND_V1_FALLBACK.md`
- `LOAD_CHAOS_REPORT.md`
- `SECURITY_REVIEW.md`
- `EVALS_REPORT.md`

## Deliverables

- real MVP dashboard
- trace/metric event coverage
- load report
- chaos report
- security review
- rollback runbook
- RC checklist

## Testing gate

```bash
cd cons/chatavg
npm run test:release
npm run eval:full
node --test tests/load*.test.js
node --test tests/chaos*.test.js
```

## Exit criteria

- Release readiness is evidence-based.
- All P0 blockers closed.
- Evals have thresholds and latest results.
- Rollback path is documented and tested.
- No placeholder metrics remain in admin dashboard.
- RC can be proposed only after sign-off from architecture, QA, security and product/semantic lead.

---

## 4. Remediation backlog by priority

## P0 blockers

1. Correct misleading backlog status.
2. Clean repo and remove generated build artifacts from project map.
3. Fail-closed production sandbox.
4. Secure production admin bootstrap.
5. Persist AgentRun events.
6. Strict AgentRun state machine.
7. Temporal workflow production contract.
8. Approval signal and timeout support.
9. Idempotency for side effects.
10. Release blocker list and RC checklist.

## P1 blockers

1. Persisted ClaimLedger.
2. Hybrid semantic extractor.
3. Real KnowledgeGateway retriever.
4. Citation contract.
5. Tool schema validation.
6. ToolCall persistence.
7. PolicyDecision v0.2.
8. Approval preview and audit.
9. ModelGateway boundary extraction.
10. ChatService decomposition.

## P2 improvements

1. UI audit evidence matrix.
2. Real admin dashboard metrics.
3. Extended load tests.
4. Extended chaos tests.
5. C4 diagrams.
6. RACI ownership matrix.
7. Developer onboarding/handover pack.
8. Eval corpus expansion.

---

## 5. Definition of Done for remediation

A remediation sprint is not done unless:

1. Code changes are merged.
2. Tests pass locally.
3. CI/pass command is documented.
4. `PROJECT_BACKLOG.md` is updated.
5. `PROJECT_MAP.md` is refreshed.
6. New/changed behavior has at least one regression test.
7. Security-sensitive behavior has a negative test.
8. Feature flags and migration boundaries are documented.
9. Any remaining gap is moved to `RELEASE_BLOCKERS.md` or backlog.
10. No status is marked “complete” unless production behavior is implemented or explicitly scoped as PoC.

---

## 6. Recommended issue labels

- `p0-release-blocker`
- `p1-architecture-gap`
- `security`
- `durability`
- `semantic-layer`
- `knowledge-gateway`
- `tool-gateway`
- `sandbox-forge`
- `policy-control-plane`
- `repo-hygiene`
- `test-gap`
- `documentation`
- `observability`
- `fast-path-regression`

---

## 7. Suggested execution order

```text
R0 Reality lock
  ↓
R1 Production safety
  ↓
R2 AgentRun event/state durability
  ↓
R3 Temporal production workflow
  ↓
R4 Semantic Layer v0.2
  ↓
R5 KnowledgeGateway MVP
  ↓
R6 Policy/Tool/Approval control plane
  ↓
R7 Architecture boundary refactor
  ↓
R8 QA/Observability/Release readiness
```

Critical path:

```text
R0 → R1 → R2 → R3 → R8
```

Meaning/product path:

```text
R0 → R4 → R5 → R6 → R8
```

Architecture cleanup path:

```text
R0 → R7 → R8
```

---

## 8. Final target after remediation

После завершения R0–R8 проект должен находиться не в состоянии “все спринты v2.3 формально закрыты”, а в честном состоянии:

- fast path стабилен и не замедлен;
- AgentRun реально durable;
- Temporal workflow переживает approval wait и worker restart;
- sandbox production path fail-closed;
- Semantic Layer имеет persisted ClaimLedger и eval threshold;
- KnowledgeGateway работает с реальными источниками и citation contract;
- ToolGateway валидирует schemas и пишет lifecycle;
- Policy/Cost/Audit участвуют в execution path;
- dashboard показывает реальные метрики;
- RC gate основан на evidence, а не на placeholders;
- backlog отражает фактическую зрелость проекта.

Только после этого имеет смысл возвращаться к исходному v2.3 release candidate logic и принимать решение о beta / RC rollout.
