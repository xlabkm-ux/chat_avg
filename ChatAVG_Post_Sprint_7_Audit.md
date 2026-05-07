# ChatAVG — обновленный аудит проекта после успешного Sprint 7

**Дата:** 7 мая 2026  
**Репозиторий:** `xlabkm-ux/chat_avg`  
**Контекст:** обновление предыдущего полного аудита с учетом нового факта: **Sprint 7 успешно завершен**.  
**Фокус:** post-Sprint-7 architecture readiness, Sprint 8 readiness, security, governance, тестовые gates, ER Meaning Layer, Mission/AgentRun/Temporal alignment.

---

## 1. Executive summary

После обновления статуса Sprint 7 проект ChatAVG нужно оценивать иначе, чем в предыдущем аудите. Ранее DurableRuntime/Temporal рассматривался как главный незакрытый P0-блокер. Теперь **Sprint 7 считается успешно закрытым**, а значит аудит смещается с вопроса “есть ли Temporal-first runtime” на вопрос: **достаточно ли стабилизирован post-Sprint-7 runtime для перехода к Sprint 8 Policy/Cost/Audit/Approval и Sprint 9 MVP Gate**.

Итоговый вердикт:

> **GO для Sprint 8 при условии post-Sprint-7 stabilization gate.**  
> **NO-GO для production/beta до закрытия security, ownership, auditability и release-gate долгов.**

Проект находится в сильной архитектурной позиции: выбран правильный курс — fast path, Mission/AgentRun, Temporal-first durability, ER Meaning Layer shift-left, provider-neutral gateway plane, risk-based Forge, Policy/Cost/Audit control plane. Это соответствует v2.3 delivery-модели и technical concept: ChatAVG должен быть не обычным чатом, а meaning-first agent execution platform с Mission Room, Adequacy Engine, Durable Runtime и Gateway Plane.

Однако после Sprint 7 главным риском становится не отсутствие runtime, а **недостаточная операционная строгость вокруг runtime**: ownership checks, persisted event/audit model, unified error contracts, CI release gates, PR hygiene, security boundaries, MCP dev/prod separation, LiteLLM/ModelGateway configuration discipline, и честная синхронизация документации с кодом.

---

## 2. Изменение позиции относительно предыдущего аудита

### Что снято как прежний P0

| Прежний вывод | Обновленный статус |
|---|---|
| “Sprint 7 / Temporal не завершен, runtime skeleton не integrated” | Снято: Sprint 7 считается успешно завершенным по текущему статусу проекта и свежим коммитам `feat: complete Sprint 7 Durable Runtime Temporal-first` и `chore: Sprint 7 closure and cleanup`. |
| “Нельзя начинать Sprint 8, нужен Sprint 8A вместо него” | Уточнено: Sprint 8 можно начинать, но только с явным post-Sprint-7 stabilization gate в начале Sprint 8. |
| “Durable runtime — главный blocker” | Теперь blocker не сам runtime, а hardened runtime perimeter: authz, event persistence, approvals, audit, rollback, tests. |

### Что остается критичным

1. Открытый PR #1 все еще open и non-mergeable; его нельзя мержить.
2. Multi-user ownership для Mission/AgentRun должен быть проверен и зафиксирован тестами.
3. MCP gateway должен быть отделен как dev/legacy model-proxy или защищен как production service.
4. Provider payload logging не должен утекать в production logs.
5. Error contract должен быть унифицирован.
6. `PROJECT_MAP`, backlog, ADR и Sprint closure docs должны быть синхронизированы с фактическим состоянием main.
7. Sprint 8 должен начинаться с safety/control-plane hardening, а не только с новых policy features.

---

## 3. Обновленный итоговый вердикт

### 3.1. Readiness score

| Область | Оценка после Sprint 7 | Комментарий |
|---|---:|---|
| Архитектурное направление | 8.5/10 | Курс v2.3 сильный и согласованный: fast path, Temporal, ER shift-left, gateways. |
| Repo hygiene | 6/10 | Есть улучшения и closure commits, но PR #1 остается открытым и рискованным. |
| Backend core | 6.5/10 | Express/SQLite gateway стабилен как evolutionary base; нужны контрактные выравнивания. |
| Durable runtime | 7/10 | Sprint 7 закрыт; теперь нужно доказать restart/replay/signals/audit в gates. |
| Security/AuthZ | 5/10 | Хорошие базовые меры, но ownership, MCP, SSRF, logging и rate-limits требуют hardening. |
| ER Meaning Layer | 6.5/10 | Semantic PoC успешно сдвинут влево; до Adequacy Engine v2 еще значительный путь. |
| Tests/CI | 5/10 | Test scripts есть, но нужны clean CI gates и post-Sprint-7 integration coverage. |
| Sprint 8 readiness | 6.5/10 | Можно идти дальше при условии stabilization checklist в начале Sprint 8. |
| Production readiness | 4/10 | Еще рано для beta/production. |

### 3.2. Decision

**Sprint 8:** GO with conditions.  
**Sprint 9 MVP Gate:** условный GO только после закрытия P0/P1 из этого аудита.  
**External beta / production:** NO-GO.

---

## 4. Что сделано хорошо

### 4.1. Sprint 7 закрывает главный архитектурный риск previous audit

Появление свежих коммитов `feat: complete Sprint 7 Durable Runtime Temporal-first` и `chore: Sprint 7 closure and cleanup` меняет картину проекта. Теперь целевой путь “Durable Agent Runtime через Temporal-first” считается реализованным на уровне Sprint 7 closure. Это соответствует v2.3 roadmap, где Sprint 7 является Durability Gate: durable workflows, approval signals, replay.

Это важный сдвиг: проект перестает быть просто Express/SQLite gateway с in-memory events и переходит в сторону настоящей Agent Execution Platform.

### 4.2. Архитектура v2.3 остается правильной

Новая линия разработки выдерживает ключевые non-negotiables:

- Simple chat stays simple.
- MCP is for tools, not model inference by default.
- Core is provider-neutral.
- Durability is a platform property.
- No custom workflow engine trap.
- Semantic layer shifts left.
- Risk-based sandboxing.
- Policy/cost/audit are in execution path.
- Human sovereignty.
- No hidden authority.

Это именно та архитектура, которая соответствует ChatAVG как meaning-first платформе, а не “еще одному AI-чату”.

### 4.3. Semantic Protocol PoC был правильно перенесен в ранний этап

Sprint 5 Semantic Protocol PoC остается стратегически сильным решением. Claim extraction, DomainBoundary, Claim Ledger, no-hidden-authority и no-psychodiagnosis boundaries создают ранний USP gate. Это снижает риск, что команда построит тяжелую инфраструктуру, а смысловой слой окажется неработоспособным.

### 4.4. Evolutionary migration, а не rewrite

Текущий Node.js/Express gateway, SQLite, provider adapters, auth/session/admin/UI остаются рабочей базой. Это правильнее, чем big-bang TypeScript rewrite или sandbox-per-chat architecture. Проект движется через feature flags, migration boundary и sprint gates.

---

## 5. Post-Sprint-7 P0 / P1 риски

## P0-1. Multi-user ownership для Mission/AgentRun

**Статус:** критичный release blocker, если не закрыт тестами.

Даже при успешном Temporal Runtime все Mission/AgentRun endpoints должны строго проверять владельца. После Sprint 7 риск ownership становится выше, потому что AgentRun теперь может быть долгоживущим workflow с approvals, events, artifacts и cost impact.

Необходимо гарантировать:

- user A не может читать Mission user B;
- user A не может patch/cancel Run user B;
- user A не может подключиться к SSE stream чужого Run;
- approval/cancel/signal не принимаются без owner/admin check;
- workflow id не является authorization boundary;
- все joins идут через Mission -> Session/User/Tenant.

**Required tests:**

- `mission_ownership.test.js`
- `run_ownership.test.js`
- `approval_ownership.test.js`
- `sse_ownership.test.js`

**Exit:** все negative tests проходят в clean CI.

---

## P0-2. Runtime event persistence и replay contract

Успешный Sprint 7 должен быть подтвержден не только наличием Temporal workflow, но и контрактом событий.

Минимум для Sprint 8:

- persisted `agent_run_events` или эквивалентный durable event log;
- deterministic event sequence;
- `run.created`, `run.started`, `model.*`, `semantic.*`, `approval.*`, `run.completed/failed/cancelled`;
- SSE initial snapshot;
- reconnect/backfill behavior;
- heartbeat;
- no duplicate terminal event;
- run survives API process restart;
- workflow survives worker restart.

**Риск без этого:** Temporal может быть “внутри”, но UI/аудит/approval path останутся недолговечными.

---

## P0-3. Open PR #1 остается repo hygiene risk

Открытый PR #1 non-mergeable и не должен попадать в main. Он был создан автоматическим coder task и ранее выглядел нерелевантным к roadmap. Даже если main уже ушел вперед, сам факт открытого PR создает operational risk.

**Действие:** закрыть PR #1 с комментарием “superseded by Sprint 0-7 roadmap and mainline changes”.

**Дополнительно:** включить branch protection:

- no direct merge without required checks;
- PR review required;
- linear history preferred;
- block stale PRs;
- status checks: `test:pr`, security smoke, project map freshness.

---

## P0-4. MCP gateway production boundary

Текущий MCP gateway ранее выглядел как dev/model proxy. Даже если Sprint 7 завершен, MCP layer нельзя оставлять в ambiguous состоянии.

Нужно явно разделить:

1. **ModelGateway / LiteLLM / provider adapters** — inference.
2. **MCP Tool Gateway** — tools/connectors only.
3. **Dev MCP model proxy** — allowed only for local/dev compatibility.

Production MCP Tool Gateway должен иметь:

- auth;
- rate limits;
- request size limits;
- tool registry;
- versioned schemas;
- riskClass;
- authScope;
- approval policy;
- egress policy;
- audit events;
- structured errors.

**Риск:** MCP как “ai.chat proxy” снова превращается в distributed monolith, что v2.3 прямо запрещает.

---

## P0-5. Sensitive payload logging

Provider adapters не должны логировать полные `messages`, prompts, tools, metadata, API payloads в production.

**Нужно:**

- redacted logs by default;
- request id / run id / model / provider / latency / usage only;
- separate `DEBUG_PROVIDER_PAYLOADS=true` for local dev;
- production guard: refuse full payload debug if `NODE_ENV=production`;
- tests: assert no message content in logs under production mode.

---

## P1-1. Unified error contract

Сейчас исторически в проекте возможны разные error shapes:

- `{ detail: ... }`
- `{ error: ... }`
- `{ error: { code, message, details } }`

После AgentRun/Temporal это становится особенно опасно: clients, UI, audit, approval and retry logic должны понимать ошибки одинаково.

**Target contract:**

```json
{
  "error": {
    "code": "string",
    "message": "human-readable string",
    "details": {},
    "traceId": "string",
    "runId": "optional string"
  }
}
```

Нужно унифицировать routes: auth, admin, providers, missions, runs, approvals, chat.

---

## P1-2. Sprint closure evidence pack

После успешного Sprint 7 нужен closure pack:

- Sprint 7 summary;
- Temporal workflow diagram;
- config/env variables;
- local runbook;
- test evidence;
- known limitations;
- rollback/fallback plan;
- PROJECT_MAP regenerated;
- BACKLOG updated;
- ADR index updated.

Без этого команда через несколько дней потеряет точное понимание, что именно “завершено”.

---

## P1-3. LiteLLM / ModelGateway config discipline

Если LiteLLM остается primary ModelGateway candidate, конфигурация должна быть проверена end-to-end:

- env schema;
- `.env.example`;
- health endpoint;
- models endpoint;
- timeout;
- cost/usage metadata;
- fallback behavior;
- partial provider failure;
- no direct provider SDK leakage outside adapter boundary.

---

## 6. Sprint 8 readiness checklist

Sprint 8 должен называться не просто “Policy/Cost/Audit/Approval”, а:

> **Sprint 8 — Policy/Cost/Audit/Approval + Post-Sprint-7 Runtime Hardening**

### 6.1. Must-have before writing new features

- [ ] Close PR #1.
- [ ] Regenerate `PROJECT_MAP.md`.
- [ ] Update `PROJECT_BACKLOG.md` with Sprint 7 closure.
- [ ] Add Sprint 7 closure note / report.
- [ ] Add owner-aware Mission/Run repository methods.
- [ ] Add ownership negative tests.
- [ ] Confirm clean `npm run test:pr`.
- [ ] Confirm clean `npm run test:release` or document known failures.
- [ ] Remove/redact provider payload logs.
- [ ] Define standard error contract.
- [ ] Document Temporal env/runbook.
- [ ] Define persisted AgentRun event contract.

### 6.2. Sprint 8 core deliverables

- PolicyDecision contract.
- ApprovalRequest model.
- CostPolicy / BudgetPolicy model.
- Audit event v2.
- Approval signals into Temporal workflow.
- Human-in-the-loop UI/API contract.
- Policy checks before tool/model/forge actions.
- Cost preflight estimate for AgentRun.
- Audit trail: model call, semantic downgrade, approval, cancellation, final decision.

---

## 7. ER Meaning Layer audit после Sprint 7

Semantic PoC остается сильным, но его нельзя переименовывать в полноценный Adequacy Engine v2.0.

### 7.1. Что есть

- SemanticProtocol v0.
- ClaimExtractor.
- DomainBoundary.
- ClaimLedger.
- No hidden authority.
- No psychodiagnosis.
- Golden set / semantic eval seed.

### 7.2. Что еще нужно до Sprint 9/12

Adequacy Engine v2.0 должен давать не только claims и boundaries, а полный набор outputs:

- Observation Map;
- Claim Ledger with evidence basis;
- Domain Boundary Map;
- Language Risk Map;
- Distortion Hypotheses;
- Conflict Cards;
- Artifact Guidance;
- Trajectory Questions;
- requires_user_decision;
- artifact patch provenance.

### 7.3. Принципиальный запрет

ChatAVG не должен скорить “глубину”, “сущностный запрос” или “адекватность человека”. Он может фиксировать claims, language risks, boundary violations, strength downgrades и decision points.

---

## 8. Security audit после Sprint 7

### 8.1. Хорошие базовые меры

- JWT auth.
- Token versioning.
- bcrypt password hashing.
- Account expiration.
- Admin guard.
- Helmet.
- CORS allowlist.
- JSON body limit.
- Auth/chat rate limit.
- API key encryption.

### 8.2. Что нужно усилить

| Риск | Severity | Действие |
|---|---:|---|
| Cross-user Mission/Run access | P0 | owner-aware queries + tests |
| Provider payload logs | P0 | redact/disable in production |
| MCP gateway exposure | P0 | auth/rate/egress/tool registry |
| SSRF bypasses | P1 | DNS resolution, IPv6/private ranges, redirects, protocol allowlist |
| Inconsistent errors | P1 | unified error envelope |
| Missing rate limits on admin/providers/runs | P1 | scoped limiters |
| Approval spoofing | P0/P1 | approval ownership + signal authorization |
| Cost abuse | P1 | budgets/preflight/quotas |

---

## 9. Tests / CI audit

### 9.1. Что должно быть обязательным после Sprint 7

```bash
cd cons/chatavg
npm run test:unit
npm run test:contract
npm run test:security
npm run test:integration
npm run eval:semantic:smoke
npm run test:pr
```

### 9.2. Новые тесты, которые нужны немедленно

- `temporal_runtime.integration.test.js`
- `agent_run_replay.test.js`
- `agent_run_cancel_signal.test.js`
- `agent_run_approval_signal.test.js`
- `agent_run_event_ordering.test.js`
- `mission_ownership.test.js`
- `run_ownership.test.js`
- `mcp_gateway_security.test.js`
- `provider_redaction.test.js`
- `error_contract.test.js`
- `cost_policy.test.js`

### 9.3. CI gates

Required checks before merge:

- tests pass;
- no stale `PROJECT_MAP.md` after source changes;
- no full prompt logging in production mode;
- no open critical Dependabot/security alerts;
- PR is not stale against main;
- branch protection enabled.

---

## 10. Updated MVP Gate after Sprint 7

Sprint 9 MVP should not be declared ready unless the following are true:

| Gate | Required condition |
|---|---|
| Fast chat | Works without Temporal/MCP/sandbox overhead. |
| AgentRun | Create/status/cancel/events/approval work end-to-end. |
| Temporal | Workflow survives worker/API restart and supports approval signal. |
| Events | Durable event log + SSE reconnect/backfill. |
| Semantic | Claims/boundaries persisted or linked to run/artifact. |
| Policy | Allow/deny/approval/downgrade decisions in execution path. |
| Cost | Preflight estimate + budget cap. |
| Security | Ownership negative tests pass. |
| Audit | Model, semantic, approval, tool/cancel events recorded. |
| UI | User sees run status, approval points, artifact trace. |
| Docs | Backlog, ADR, project map reflect actual code. |

---

## 11. Recommended immediate backlog

### P0 — before/at start of Sprint 8

1. Close PR #1.
2. Regenerate and commit `PROJECT_MAP.md`.
3. Add Sprint 7 closure report.
4. Add ownership checks for Mission/Run/SSE/approval.
5. Add persisted AgentRunEvent contract.
6. Redact provider logs.
7. Harden MCP gateway or mark dev-only.
8. Add clean CI required checks.

### P1 — during Sprint 8

1. Unified error contract.
2. PolicyDecision model.
3. ApprovalRequest model.
4. CostPolicy/BudgetPolicy model.
5. Audit event v2.
6. Approval signal tests.
7. SSRF hardening beyond literal private hosts.
8. Rate limits for admin/providers/runs.

### P2 — before Sprint 9 MVP

1. UI Mission/Run status panel.
2. Semantic trace panel.
3. Artifact draft provenance.
4. ConflictCard MVP.
5. LiteLLM production config verification.
6. Load/latency baseline after Temporal integration.

---

## 12. Final verdict

Sprint 7 successful completion is a material improvement. The project is no longer blocked on the basic question of whether DurableRuntime is part of the implementation path. ChatAVG can now move into Sprint 8.

But the project should not treat Sprint 7 as “runtime problem solved forever.” It should treat Sprint 7 as the moment where runtime becomes serious enough to require production-grade surrounding discipline: authorization, events, approvals, policy, cost, audit, CI and documentation truthfulness.

**Final decision:**

- **Sprint 8:** GO with hardening conditions.
- **Sprint 9 MVP:** conditional; requires ownership, durable events, policy/approval/cost/audit and clean CI.
- **Beta/Production:** NO-GO until security, observability, and release gates are proven.

