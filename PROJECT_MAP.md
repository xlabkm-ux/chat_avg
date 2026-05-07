# 🗺️ PROJECT MAP — agsys
> Автоматически сгенерировано: `2026-05-07 08:53:32`
> Скрипт: `node dev_studio/refresh.js`

---

## Архитектура компонентов

```mermaid
graph TD
  subgraph N0["chatavg"]
    N1["diagnose_mcp"]
    N2["reset_admin"]
    N3["server"]
    N4["config"]
    N5["crypto"]
    N6["errors"]
    N7["migrate"]
    N8["providers.config"]
    N9["sqlite"]
    N10["utils"]
    N11["admin.routes"]
    N12["category.repository"]
    N13["audit.service"]
    N14["auth.middleware"]
    N15["auth.routes"]
    N16["user.repository"]
    N17["users.routes"]
    N18["chat.routes"]
    N19["chat.service"]
    N20["fallbackPolicy"]
    N21["policyRouter"]
    N22["session.repository"]
    N23["sessions.routes"]
    N24["cost.service"]
    N25["execution.routes"]
    N26["run.repository"]
    N27["run.service"]
    N28["mission.repository"]
    N29["mission.routes"]
    N30["approval.service"]
    N31["policy.engine"]
    N32["redaction.service"]
    N33["deepseek"]
    N34["google"]
    N35["grok"]
    N36["grok_responses"]
    N37["llamacpp"]
    N38["mcp"]
    N39["openai"]
    N40["openai_compat"]
    N41["openai_responses"]
    N42["openai_responses_compat"]
    N43["qwen"]
    N44["base.provider"]
    N45["provider.factory"]
    N46["providerErrors"]
    N47["providerEvents"]
    N48["providers.routes"]
    N49["claim.extractor"]
    N50["claim.ledger"]
    N51["domain.boundary"]
    N52["semantic.events"]
    N53["semantic.protocol"]
    N54["activities"]
    N55["client"]
    N56["worker"]
    N57["workflows"]
    N58["agent_run.test"]
    N59["api.test"]
    N60["baseline_security.test"]
    N61["contract_canonical_event.test"]
    N62["deterministic_provider.test"]
    N63["errors.test"]
    N64["fast_path_guardrail.test"]
    N65["health.test"]
    N66["latency_baseline.test"]
    N67["deterministic_provider"]
    N68["approval.service.test"]
    N69["cost.service.test"]
    N70["policy.engine.test"]
    N71["redaction.service.test"]
    N72["provider_events.test"]
    N73["security.test"]
    N74["security_assertions.test"]
    N75["claim_extraction.test"]
    N76["domain_boundary.test"]
    N77["semantic.eval"]
    N78["setup_fixtures"]
    N79["signal"]
  end
  subgraph N80["mcp_gateway"]
    N81["server"]
  end
  N2 --> N9
  N3 --> N4
  N3 --> N6
  N3 --> N9
  N3 --> N14
  N5 --> N4
  N7 --> N9
  N7 --> N4
  N8 --> N4
  N9 --> N4
  N11 --> N14
  N11 --> N6
  N11 --> N10
  N11 --> N16
  N11 --> N12
  N11 --> N22
  N11 --> N45
  N11 --> N13
  N11 --> N5
  N11 --> N4
  N11 --> N8
  N12 --> N9
  N12 --> N5
  N13 --> N9
  N13 --> N32
  N14 --> N4
  N14 --> N16
  N14 --> N6
  N15 --> N14
  N15 --> N16
  N15 --> N6
  N15 --> N13
  N16 --> N9
  N17 --> N16
  N17 --> N14
  N17 --> N6
  N18 --> N14
  N18 --> N6
  N18 --> N19
  N19 --> N12
  N19 --> N21
  N19 --> N20
  N19 --> N45
  N19 --> N8
  N19 --> N4
  N19 --> N10
  N19 --> N53
  N19 --> N47
  N20 --> N46
  N21 --> N45
  N22 --> N9
  N23 --> N14
  N23 --> N6
  N23 --> N22
  N25 --> N27
  N25 --> N4
  N26 --> N9
  N27 --> N26
  N27 --> N28
  N27 --> N55
  N27 --> N4
  N28 --> N9
  N29 --> N28
  N30 --> N9
  N31 --> N32
  N33 --> N40
  N34 --> N44
  N34 --> N47
  N34 --> N46
  N35 --> N40
  N36 --> N42
  N37 --> N44
  N37 --> N47
  N37 --> N46
  N38 --> N44
  N38 --> N47
  N38 --> N46
  N39 --> N40
  N40 --> N44
  N40 --> N47
  N40 --> N46
  N41 --> N42
  N42 --> N44
  N42 --> N47
  N42 --> N46
  N43 --> N40
  N45 --> N8
  N45 --> N37
  N45 --> N39
  N45 --> N41
  N45 --> N33
  N45 --> N34
  N45 --> N43
  N45 --> N35
  N45 --> N36
  N45 --> N38
  N45 --> N67
  N48 --> N14
  N48 --> N45
  N48 --> N12
  N48 --> N8
  N51 --> N49
  N51 --> N52
  N53 --> N49
  N53 --> N51
  N53 --> N50
  N53 --> N52
  N54 --> N26
  N55 --> N4
  N56 --> N4
  N56 --> N54
  N58 --> N3
  N58 --> N81
  N58 --> N9
  N59 --> N3
  N59 --> N81
  N59 --> N9
  N60 --> N3
  N60 --> N81
  N60 --> N9
  N61 --> N67
  N61 --> N47
  N62 --> N67
  N63 --> N6
  N65 --> N3
  N65 --> N81
  N65 --> N9
  N66 --> N67
  N67 --> N44
  N67 --> N47
  N68 --> N30
  N68 --> N9
  N69 --> N24
  N70 --> N31
  N71 --> N32
  N72 --> N47
  N73 --> N10
  N73 --> N3
  N73 --> N81
  N73 --> N9
  N74 --> N10
  N75 --> N49
  N76 --> N51
  N76 --> N49
  N76 --> N53
  N77 --> N53
  N77 --> N49
  N78 --> N9
  N79 --> N55
```

## Компонент: `chatavg`

| Файл | Строк | Размер | Описание |
|---|---|---|---|
| `diagnose_mcp.js` | 38 | 1.1 KB | — |
| `reset_admin.js` | 22 | 0.6 KB | Admin Reset Utility (SQLite) |
| `server.js` | 161 | 5.7 KB | — |
| `src/core/config.js` | 159 | 5.5 KB | — |
| `src/core/crypto.js` | 78 | 1.9 KB | AES-256-GCM encryption/decryption service. |
| `src/core/errors.js` | 87 | 2.2 KB | Centralized Error Handling |
| `src/core/migrate.js` | 108 | 4.1 KB | Chat AVG — JSON to SQLite Migration Utility |
| `src/core/providers.config.js` | 129 | 4.7 KB | — |
| `src/core/sqlite.js` | 273 | 7.8 KB | — |
| `src/core/utils.js` | 91 | 2.5 KB | Helper Utilities |
| `src/modules/admin/admin.routes.js` | 341 | 12.5 KB | — |
| `src/modules/admin/category.repository.js` | 74 | 3.0 KB | Класс: CategoryRepository |
| `src/modules/audit/audit.service.js` | 70 | 2.2 KB | Log an action to the audit log. |
| `src/modules/auth/auth.middleware.js` | 78 | 2.4 KB | Authentication — JWT middleware & helpers |
| `src/modules/auth/auth.routes.js` | 67 | 2.3 KB | Routes: Authentication |
| `src/modules/auth/user.repository.js` | 70 | 2.5 KB | Класс: UserRepository |
| `src/modules/auth/users.routes.js` | 49 | 1.4 KB | Routes: User Profile |
| `src/modules/chat/chat.routes.js` | 62 | 2.4 KB | Routes: Chat Completions |
| `src/modules/chat/chat.service.js` | 437 | 17.5 KB | Класс: ChatService |
| `src/modules/chat/fallbackPolicy.js` | 49 | 1.6 KB | Класс: FallbackPolicy |
| `src/modules/chat/policyRouter.js` | 39 | 1.1 KB | Класс: PolicyRouter |
| `src/modules/chat/session.repository.js` | 59 | 1.7 KB | Класс: SessionRepository |
| `src/modules/chat/sessions.routes.js` | 105 | 3.3 KB | Routes: Sessions CRUD |
| `src/modules/execution/cost.service.js` | 36 | 1.0 KB | Calculate cost for a model call. |
| `src/modules/execution/execution.routes.js` | 100 | 2.4 KB | POST /api/runs |
| `src/modules/execution/run.repository.js` | 75 | 2.1 KB | Класс: AgentRunRepository |
| `src/modules/execution/run.service.js` | 128 | 3.4 KB | Класс: AgentRunService |
| `src/modules/mission/mission.repository.js` | 92 | 2.9 KB | Класс: MissionRepository |
| `src/modules/mission/mission.routes.js` | 80 | 1.9 KB | POST /api/missions |
| `src/modules/policy/approval.service.js` | 83 | 2.2 KB | Класс: ApprovalService |
| `src/modules/policy/policy.engine.js` | 83 | 2.7 KB | Evaluates an action and returns a PolicyDecision. |
| `src/modules/policy/redaction.service.js` | 33 | 1.1 KB | Redacts sensitive information from a string or object payload. |
| `src/modules/providers/adapters/deepseek.js` | 19 | 0.4 KB | Provider: DeepSeek |
| `src/modules/providers/adapters/google.js` | 125 | 4.0 KB | Класс: GoogleProvider |
| `src/modules/providers/adapters/grok.js` | 238 | 8.6 KB | Provider: Grok (xAI) |
| `src/modules/providers/adapters/grok_responses.js` | 21 | 0.5 KB | Provider: Grok Responses API (xAI) |
| `src/modules/providers/adapters/llamacpp.js` | 156 | 5.1 KB | Класс: LlamaCppProvider |
| `src/modules/providers/adapters/mcp.js` | 156 | 4.9 KB | Класс: MCPProvider |
| `src/modules/providers/adapters/openai.js` | 22 | 0.5 KB | Provider: OpenAI |
| `src/modules/providers/adapters/openai_compat.js` | 144 | 4.6 KB | Класс: OpenAICompatProvider |
| `src/modules/providers/adapters/openai_responses.js` | 23 | 0.6 KB | Provider: OpenAI Responses API |
| `src/modules/providers/adapters/openai_responses_compat.js` | 176 | 5.7 KB | Класс: OpenAIResponsesProvider |
| `src/modules/providers/adapters/qwen.js` | 20 | 0.5 KB | Provider: Qwen (Alibaba Cloud / DashScope) |
| `src/modules/providers/base.provider.js` | 110 | 3.5 KB | Класс: BaseProvider |
| `src/modules/providers/provider.factory.js` | 62 | 1.7 KB | — |
| `src/modules/providers/providerErrors.js` | 13 | 0.3 KB | Класс: ProviderError |
| `src/modules/providers/providerEvents.js` | 27 | 0.9 KB | — |
| `src/modules/providers/providers.routes.js` | 103 | 3.1 KB | — |
| `src/modules/semantic/claim.extractor.js` | 155 | 5.3 KB | ClaimExtractor — pipeline извлечения утверждений из текста. |
| `src/modules/semantic/claim.ledger.js` | 118 | 2.6 KB | ClaimLedger — реестр всех извлечённых claims per session. |
| `src/modules/semantic/domain.boundary.js` | 202 | 8.6 KB | DomainBoundary — детектор границ области определения и strength downgrade engine. |
| `src/modules/semantic/semantic.events.js` | 53 | 2.1 KB | Semantic Events — канонические типы событий семантического слоя. |
| `src/modules/semantic/semantic.protocol.js` | 116 | 3.6 KB | SemanticProtocol v0 — оркестратор смыслового слоя. |
| `src/modules/temporal/activities.js` | 24 | 0.7 KB | — |
| `src/modules/temporal/client.js` | 33 | 0.8 KB | — |
| `src/modules/temporal/worker.js` | 23 | 0.6 KB | — |
| `src/modules/temporal/workflows.js` | 43 | 1.3 KB | — |
| `tests/agent_run.test.js` | 139 | 4.0 KB | — |
| `tests/api.test.js` | 170 | 5.3 KB | — |
| `tests/baseline_security.test.js` | 53 | 2.0 KB | — |
| `tests/contract_canonical_event.test.js` | 164 | 5.9 KB | Contract tests for AsyncIterable semantics of provider adapters. |
| `tests/deterministic_provider.test.js` | 89 | 3.0 KB | — |
| `tests/errors.test.js` | 53 | 1.8 KB | — |
| `tests/fast_path_guardrail.test.js` | 131 | 4.7 KB | Fast Path Guardrail Tests |
| `tests/health.test.js` | 51 | 1.5 KB | — |
| `tests/latency_baseline.test.js` | 138 | 5.0 KB | Latency Measurement Utility |
| `tests/mocks/deterministic_provider.js` | 79 | 2.7 KB | DeterministicProvider — синтетический провайдер для тестов. |
| `tests/policy/approval.service.test.js` | 45 | 1.9 KB | — |
| `tests/policy/cost.service.test.js` | 16 | 0.5 KB | — |
| `tests/policy/policy.engine.test.js` | 33 | 1.5 KB | — |
| `tests/policy/redaction.service.test.js` | 29 | 1.0 KB | — |
| `tests/provider_events.test.js` | 60 | 2.0 KB | — |
| `tests/security.test.js` | 44 | 1.7 KB | — |
| `tests/security_assertions.test.js` | 187 | 6.0 KB | CORS, SSRF, JSON Limit, and Prompt Sanitization assertion tests. |
| `tests/semantic/claim_extraction.test.js` | 113 | 5.2 KB | Tests: ClaimExtractor — извлечение утверждений из текста. |
| `tests/semantic/domain_boundary.test.js` | 174 | 8.2 KB | Tests: DomainBoundary — проверка границ и strength downgrade. |
| `tests/semantic/semantic.eval.js` | 163 | 6.2 KB | Semantic Eval Runner — запуск golden set тестов. |
| `tests/setup_fixtures.js` | 101 | 3.2 KB | — |
| `tests/signal.js` | 18 | 0.5 KB | — |

### `server.js`
- **Экспорт**: `{ app, server }`, `app`, `server`
- **Роуты**:
  - `USE /api/auth`
  - `USE /api/users`
  - `USE /api/admin`
  - `USE /api/sessions`
  - `USE /api/chat`
  - `USE /api/providers`
  - `USE /api/missions`
  - `USE /api/runs`
  - `GET /health`
  - `GET /ready`
  - `USE /api`
  - `GET *`
- **Зависимости**:
  - `./src/core/config` → PORT, WEBUI_DIR, allowedOrigins, isDev
  - `./src/core/errors` → errorHandler, AppError
  - `./src/core/sqlite` → (side-effect)
  - `./src/modules/auth/auth.middleware` → authenticate
  - `./src/core/sqlite` → (side-effect)

### `src/core/config.js`
- **Экспорт**: `{`
- **Зависимости**:

### `src/core/crypto.js`
- **Экспорт**: `{`
- **Зависимости**:
  - `./config` → SECRET

### `src/core/errors.js`
- **Класс**: `AppError` extends `Error`
- **Класс**: `AuthError` extends `AppError`
- **Класс**: `ValidationError` extends `AppError`
- **Класс**: `NotFoundError` extends `AppError`
- **Экспорт**: `{`
- **Зависимости**:

### `src/core/migrate.js`
- **Экспорт**: `migrate`
- **Зависимости**:
  - `./sqlite` → db
  - `./config` → USERS_FILE, CATEGORIES_FILE, SESSIONS_ROOT

### `src/core/providers.config.js`
- **Экспорт**: `providersConfig`
- **Зависимости**:
  - `./config` → providerEnv

### `src/core/sqlite.js`
- **Экспорт**: `db`
- **Зависимости**:
  - `./config` → DATA_DIR
  - `./config` → DEFAULT_CATEGORY_PARAMS, DEFAULT_SYSTEM_PROMPT

### `src/core/utils.js`
- **Экспорт**: `{`

### `src/modules/admin/admin.routes.js`
- **Экспорт**: `router`
- **Роуты**:
  - `GET /users`
  - `POST /users/:username`
  - `DELETE /users/:username`
  - `GET /categories`
  - `POST /categories/:category_name`
  - `DELETE /categories/:category_name`
  - `POST /categories/:category_name/test`
  - `GET /stats`
  - `GET /audit`
- **Зависимости**:
  - `../auth/auth.middleware` → authenticate, requireAdmin
  - `../../core/errors` → asyncHandler
  - `../../core/utils` → assertSafeIdentifier, mergeFields, validateProviderUrl
  - `../auth/user.repository` → userRepository
  - `./category.repository` → categoryRepository
  - `../chat/session.repository` → sessionRepository
  - `../providers/provider.factory` → getProvider
  - `../audit/audit.service` → AuditService
  - `../../core/crypto` → crypto
  - `../../core/config` → TEST_TIMEOUT
  - `../../core/providers.config` → providersConfig

### `src/modules/admin/category.repository.js`
- **Класс**: `CategoryRepository`
- **Экспорт**: `new CategoryRepository()`
- **Зависимости**:
  - `../../core/sqlite` → db
  - `../../core/crypto` → crypto

### `src/modules/audit/audit.service.js`
- **Класс**: `AuditService`
- **Экспорт**: `AuditService`
- **Зависимости**:
  - `../../core/sqlite` → db
  - `../policy/redaction.service` → RedactionService

### `src/modules/auth/auth.middleware.js`
- **Экспорт**: `{ authenticate, requireAdmin, signToken, isExpired }`, `authenticate`, `requireAdmin`, `signToken`, `isExpired`
- **Зависимости**:
  - `../../core/config` → SECRET, TOKEN_EXPIRY
  - `./user.repository` → userRepository
  - `../../core/errors` → AppError, AuthError

### `src/modules/auth/auth.routes.js`
- **Экспорт**: `router`
- **Роуты**:
  - `POST /login`
- **Зависимости**:
  - `./auth.middleware` → signToken, isExpired
  - `./user.repository` → userRepository
  - `../../core/errors` → asyncHandler
  - `../audit/audit.service` → AuditService

### `src/modules/auth/user.repository.js`
- **Класс**: `UserRepository`
- **Экспорт**: `new UserRepository()`
- **Зависимости**:
  - `../../core/sqlite` → db

### `src/modules/auth/users.routes.js`
- **Экспорт**: `router`
- **Роуты**:
  - `GET /me`
  - `PATCH /me`
- **Зависимости**:
  - `./user.repository` → userRepository
  - `./auth.middleware` → authenticate
  - `../../core/errors` → asyncHandler

### `src/modules/chat/chat.routes.js`
- **Экспорт**: `router`
- **Роуты**:
  - `POST /completions`
- **Зависимости**:
  - `../auth/auth.middleware` → authenticate
  - `../../core/errors` → asyncHandler
  - `./chat.service` → chatService

### `src/modules/chat/chat.service.js`
- **Класс**: `ChatService`
- **Экспорт**: `new ChatService()`
- **Зависимости**:
  - `../admin/category.repository` → categoryRepository
  - `./policyRouter` → policyRouter
  - `./fallbackPolicy` → fallbackPolicy
  - `../providers/provider.factory` → getProvider, adapters
  - `../../core/providers.config` → providersConfig
  - `../../core/config` → ALLOWED_EXTRA_PARAMS, PROVIDER_TIMEOUT, SEMANTIC_LAYER_ENABLED, AGENT_RUNS_ENABLED
  - `../../core/utils` → validateProviderUrl, sanitizePromptText
  - `../semantic/semantic.protocol` → SemanticProtocol
  - `../providers/providerEvents` → ProviderEvents

### `src/modules/chat/fallbackPolicy.js`
- **Класс**: `FallbackPolicy`
- **Экспорт**: `new FallbackPolicy()`
- **Зависимости**:
  - `../providers/providerErrors` → ProviderError

### `src/modules/chat/policyRouter.js`
- **Класс**: `PolicyRouter`
- **Экспорт**: `new PolicyRouter()`
- **Зависимости**:
  - `../providers/provider.factory` → getProvider

### `src/modules/chat/session.repository.js`
- **Класс**: `SessionRepository`
- **Экспорт**: `new SessionRepository()`
- **Зависимости**:
  - `../../core/sqlite` → db

### `src/modules/chat/sessions.routes.js`
- **Экспорт**: `router`
- **Роуты**:
  - `GET /`
  - `GET /:id`
  - `POST /`
  - `DELETE /:id`
  - `PATCH /:id`
- **Зависимости**:
  - `../auth/auth.middleware` → authenticate
  - `../../core/errors` → asyncHandler
  - `./session.repository` → sessionRepository

### `src/modules/execution/cost.service.js`
- **Класс**: `CostService`
- **Экспорт**: `{ CostService }`, `CostService`

### `src/modules/execution/execution.routes.js`
- **Экспорт**: `router`
- **Роуты**:
  - `POST /`
  - `GET /:id`
  - `POST /:id/cancel`
  - `GET /:id/events`
- **Зависимости**:
  - `./run.service` → runService
  - `../../core/config` → AGENT_RUNS_ENABLED

### `src/modules/execution/run.repository.js`
- **Класс**: `AgentRunRepository`
- **Экспорт**: `new AgentRunRepository()`
- **Зависимости**:
  - `../../core/sqlite` → db

### `src/modules/execution/run.service.js`
- **Класс**: `AgentRunService` extends `EventEmitter`
- **Экспорт**: `new AgentRunService()`
- **Зависимости**:
  - `./run.repository` → runRepository
  - `../mission/mission.repository` → missionRepository
  - `../temporal/client` → temporalClient
  - `../../core/config` → TEMPORAL_RUNTIME_ENABLED

### `src/modules/mission/mission.repository.js`
- **Класс**: `MissionRepository`
- **Экспорт**: `new MissionRepository()`
- **Зависимости**:
  - `../../core/sqlite` → db

### `src/modules/mission/mission.routes.js`
- **Экспорт**: `router`
- **Роуты**:
  - `POST /`
  - `GET /:id`
  - `GET /session/:sessionId`
  - `PATCH /:id`
- **Зависимости**:
  - `./mission.repository` → missionRepository

### `src/modules/policy/approval.service.js`
- **Класс**: `ApprovalService`
- **Экспорт**: `{ ApprovalService }`, `ApprovalService`
- **Зависимости**:
  - `../../core/sqlite` → db

### `src/modules/policy/policy.engine.js`
- **Класс**: `PolicyEngine`
- **Экспорт**: `{ PolicyEngine, RiskClass }`, `PolicyEngine`, `RiskClass`
- **Зависимости**:
  - `./redaction.service` → RedactionService

### `src/modules/policy/redaction.service.js`
- **Класс**: `RedactionService`
- **Экспорт**: `{ RedactionService }`, `RedactionService`

### `src/modules/providers/adapters/deepseek.js`
- **Экспорт**: `createProvider({`
- **Зависимости**:
  - `./openai_compat` → createProvider

### `src/modules/providers/adapters/google.js`
- **Класс**: `GoogleProvider` extends `BaseProvider`
- **Экспорт**: `new GoogleProvider()`
- **Зависимости**:
  - `../base.provider` → BaseProvider
  - `./../providerEvents` → ProviderEvents
  - `./../providerErrors` → ProviderError

### `src/modules/providers/adapters/grok.js`
- **Класс**: `GrokProvider` extends `OpenAICompatProvider`
- **Экспорт**: `new GrokProvider({`
- **Зависимости**:
  - `./openai_compat` → OpenAICompatProvider

### `src/modules/providers/adapters/grok_responses.js`
- **Экспорт**: `createResponsesProvider({`
- **Зависимости**:
  - `./openai_responses_compat` → createResponsesProvider

### `src/modules/providers/adapters/llamacpp.js`
- **Класс**: `LlamaCppProvider` extends `BaseProvider`
- **Экспорт**: `new LlamaCppProvider()`
- **Зависимости**:
  - `../base.provider` → BaseProvider
  - `./../providerEvents` → ProviderEvents
  - `./../providerErrors` → ProviderError

### `src/modules/providers/adapters/mcp.js`
- **Класс**: `MCPProvider` extends `BaseProvider`
- **Экспорт**: `new MCPProvider({`
- **Зависимости**:
  - `../base.provider` → BaseProvider
  - `../providerEvents` → ProviderEvents
  - `../providerErrors` → ProviderError

### `src/modules/providers/adapters/openai.js`
- **Экспорт**: `createProvider({`
- **Зависимости**:
  - `./openai_compat` → createProvider

### `src/modules/providers/adapters/openai_compat.js`
- **Класс**: `OpenAICompatProvider` extends `BaseProvider`
- **Экспорт**: `{ OpenAICompatProvider, createProvider }`, `OpenAICompatProvider`, `createProvider`
- **Зависимости**:
  - `../base.provider` → BaseProvider
  - `./../providerEvents` → ProviderEvents
  - `./../providerErrors` → ProviderError

### `src/modules/providers/adapters/openai_responses.js`
- **Экспорт**: `createResponsesProvider({`
- **Зависимости**:
  - `./openai_responses_compat` → createResponsesProvider

### `src/modules/providers/adapters/openai_responses_compat.js`
- **Класс**: `OpenAIResponsesProvider` extends `BaseProvider`
- **Экспорт**: `{ OpenAIResponsesProvider, createResponsesProvider }`, `OpenAIResponsesProvider`, `createResponsesProvider`
- **Зависимости**:
  - `../base.provider` → BaseProvider
  - `./../providerEvents` → ProviderEvents
  - `./../providerErrors` → ProviderError

### `src/modules/providers/adapters/qwen.js`
- **Экспорт**: `createProvider({`
- **Зависимости**:
  - `./openai_compat` → createProvider

### `src/modules/providers/base.provider.js`
- **Класс**: `BaseProvider`
- **Экспорт**: `BaseProvider`

### `src/modules/providers/provider.factory.js`
- **Экспорт**: `{ getProvider, listProviders, adapters }`, `getProvider`, `listProviders`, `adapters`
- **Зависимости**:
  - `../../core/providers.config` → providersConfig
  - `./adapters/llamacpp` → (side-effect)
  - `./adapters/openai` → (side-effect)
  - `./adapters/openai_responses` → (side-effect)
  - `./adapters/deepseek` → (side-effect)
  - `./adapters/google` → (side-effect)
  - `./adapters/qwen` → (side-effect)
  - `./adapters/grok` → (side-effect)
  - `./adapters/grok_responses` → (side-effect)
  - `./adapters/mcp` → (side-effect)
  - `../../../tests/mocks/deterministic_provider` → DeterministicProvider

### `src/modules/providers/providerErrors.js`
- **Класс**: `ProviderError` extends `Error`
- **Экспорт**: `{ ProviderError }`, `ProviderError`

### `src/modules/providers/providerEvents.js`
- **Экспорт**: `ProviderEvents`

### `src/modules/providers/providers.routes.js`
- **Экспорт**: `router`
- **Роуты**:
  - `GET /`
  - `GET /health`
  - `GET /:id/models`
  - `GET /:id/health`
- **Зависимости**:
  - `../auth/auth.middleware` → authenticate
  - `./provider.factory` → listProviders
  - `../admin/category.repository` → categoryRepository
  - `./provider.factory` → getProvider
  - `../../core/providers.config` → providersConfig
  - `../../core/providers.config` → providersConfig
  - `../../core/providers.config` → providersConfig

### `src/modules/semantic/claim.extractor.js`
- **Класс**: `ClaimExtractor`
- **Экспорт**: `{ ClaimExtractor, STRENGTH_ORDER }`, `ClaimExtractor`, `STRENGTH_ORDER`
- **Зависимости**:

### `src/modules/semantic/claim.ledger.js`
- **Класс**: `ClaimLedger`
- **Экспорт**: `{ ClaimLedger }`, `ClaimLedger`

### `src/modules/semantic/domain.boundary.js`
- **Класс**: `DomainBoundary`
- **Экспорт**: `{ DomainBoundary, DEFAULT_BOUNDARIES }`, `DomainBoundary`, `DEFAULT_BOUNDARIES`
- **Зависимости**:
  - `./claim.extractor` → ClaimExtractor
  - `./semantic.events` → SemanticEvents

### `src/modules/semantic/semantic.events.js`
- **Экспорт**: `SemanticEvents`

### `src/modules/semantic/semantic.protocol.js`
- **Класс**: `SemanticProtocol`
- **Экспорт**: `{ SemanticProtocol, PROTOCOL_VERSION }`, `SemanticProtocol`, `PROTOCOL_VERSION`
- **Зависимости**:
  - `./claim.extractor` → ClaimExtractor
  - `./domain.boundary` → DomainBoundary
  - `./claim.ledger` → ClaimLedger
  - `./semantic.events` → SemanticEvents

### `src/modules/temporal/activities.js`
- **Экспорт**: `{`
- **Зависимости**:
  - `../execution/run.repository` → runRepository

### `src/modules/temporal/client.js`
- **Экспорт**: `{`
- **Зависимости**:
  - `../../core/config` → TEMPORAL_URL

### `src/modules/temporal/workflows.js`
- **Экспорт**: `{`
- **Зависимости**:

### `tests/mocks/deterministic_provider.js`
- **Класс**: `DeterministicProvider` extends `BaseProvider`
- **Экспорт**: `{ DeterministicProvider }`, `DeterministicProvider`
- **Зависимости**:
  - `../../src/modules/providers/base.provider` → BaseProvider
  - `../../src/modules/providers/providerEvents` → ProviderEvents

### `tests/semantic/semantic.eval.js`
- **Класс**: `SemanticEvalRunner`
- **Экспорт**: `{ SemanticEvalRunner }`, `SemanticEvalRunner`
- **Зависимости**:
  - `../../src/modules/semantic/semantic.protocol` → SemanticProtocol
  - `../../src/modules/semantic/claim.extractor` → ClaimExtractor
  - `./golden_set.json` → goldenSet

### `tests/setup_fixtures.js`
- **Экспорт**: `{ loadFixtures }`, `loadFixtures`
- **Зависимости**:
  - `../src/core/sqlite` → db

## Компонент: `mcp_gateway`

| Файл | Строк | Размер | Описание |
|---|---|---|---|
| `server.js` | 263 | 8.4 KB | — |

### `server.js`
- **Роуты**:
  - `GET /mcp`
  - `POST /mcp/message/:sessionId`
  - `GET /health`
- **Зависимости**:

## Переменные окружения

Переменные, используемые в коде:

| Переменная | Используется в |
|---|---|
| `ALLOW_CUSTOM_PROVIDER_URLS` | chatavg/utils.js |
| `CHATAVG_ADMIN_PASSWORD` | chatavg/sqlite.js |
| `CHATAVG_SECRET` | chatavg/agent_run.test.js, chatavg/api.test.js, chatavg/contract_canonical_event.test.js, chatavg/deterministic_provider.test.js, chatavg/errors.test.js, chatavg/fast_path_guardrail.test.js, chatavg/health.test.js, chatavg/latency_baseline.test.js, chatavg/provider_events.test.js, chatavg/security_assertions.test.js, chatavg/setup_fixtures.js |
| `DEBUG_PROVIDER_PAYLOADS` | chatavg/grok.js, chatavg/openai_compat.js |
| `NODE_ENV` | chatavg/server.js, chatavg/errors.js, chatavg/grok.js, chatavg/openai_compat.js, chatavg/provider.factory.js, chatavg/agent_run.test.js, chatavg/api.test.js, chatavg/contract_canonical_event.test.js, chatavg/deterministic_provider.test.js, chatavg/errors.test.js, chatavg/fast_path_guardrail.test.js, chatavg/health.test.js, chatavg/latency_baseline.test.js, chatavg/provider_events.test.js, chatavg/security_assertions.test.js, chatavg/setup_fixtures.js |
| `PORT` | mcp_gateway/server.js |

## API Реестр

Все обнаруженные HTTP-эндпоинты:

| Метод | Путь | Файл |
|---|---|---|
| `USE` | `/api/auth` | `chatavg/server.js` |
| `USE` | `/api/users` | `chatavg/server.js` |
| `USE` | `/api/admin` | `chatavg/server.js` |
| `USE` | `/api/sessions` | `chatavg/server.js` |
| `USE` | `/api/chat` | `chatavg/server.js` |
| `USE` | `/api/providers` | `chatavg/server.js` |
| `USE` | `/api/missions` | `chatavg/server.js` |
| `USE` | `/api/runs` | `chatavg/server.js` |
| `GET` | `/health` | `chatavg/server.js` |
| `GET` | `/ready` | `chatavg/server.js` |
| `USE` | `/api` | `chatavg/server.js` |
| `GET` | `*` | `chatavg/server.js` |
| `GET` | `/users` | `chatavg/src/modules/admin/admin.routes.js` |
| `POST` | `/users/:username` | `chatavg/src/modules/admin/admin.routes.js` |
| `DELETE` | `/users/:username` | `chatavg/src/modules/admin/admin.routes.js` |
| `GET` | `/categories` | `chatavg/src/modules/admin/admin.routes.js` |
| `POST` | `/categories/:category_name` | `chatavg/src/modules/admin/admin.routes.js` |
| `DELETE` | `/categories/:category_name` | `chatavg/src/modules/admin/admin.routes.js` |
| `POST` | `/categories/:category_name/test` | `chatavg/src/modules/admin/admin.routes.js` |
| `GET` | `/stats` | `chatavg/src/modules/admin/admin.routes.js` |
| `GET` | `/audit` | `chatavg/src/modules/admin/admin.routes.js` |
| `POST` | `/login` | `chatavg/src/modules/auth/auth.routes.js` |
| `GET` | `/me` | `chatavg/src/modules/auth/users.routes.js` |
| `PATCH` | `/me` | `chatavg/src/modules/auth/users.routes.js` |
| `POST` | `/completions` | `chatavg/src/modules/chat/chat.routes.js` |
| `GET` | `/` | `chatavg/src/modules/chat/sessions.routes.js` |
| `GET` | `/:id` | `chatavg/src/modules/chat/sessions.routes.js` |
| `POST` | `/` | `chatavg/src/modules/chat/sessions.routes.js` |
| `DELETE` | `/:id` | `chatavg/src/modules/chat/sessions.routes.js` |
| `PATCH` | `/:id` | `chatavg/src/modules/chat/sessions.routes.js` |
| `POST` | `/` | `chatavg/src/modules/execution/execution.routes.js` |
| `GET` | `/:id` | `chatavg/src/modules/execution/execution.routes.js` |
| `POST` | `/:id/cancel` | `chatavg/src/modules/execution/execution.routes.js` |
| `GET` | `/:id/events` | `chatavg/src/modules/execution/execution.routes.js` |
| `POST` | `/` | `chatavg/src/modules/mission/mission.routes.js` |
| `GET` | `/:id` | `chatavg/src/modules/mission/mission.routes.js` |
| `GET` | `/session/:sessionId` | `chatavg/src/modules/mission/mission.routes.js` |
| `PATCH` | `/:id` | `chatavg/src/modules/mission/mission.routes.js` |
| `GET` | `/` | `chatavg/src/modules/providers/providers.routes.js` |
| `GET` | `/health` | `chatavg/src/modules/providers/providers.routes.js` |
| `GET` | `/:id/models` | `chatavg/src/modules/providers/providers.routes.js` |
| `GET` | `/:id/health` | `chatavg/src/modules/providers/providers.routes.js` |
| `GET` | `/mcp` | `mcp_gateway/server.js` |
| `POST` | `/mcp/message/:sessionId` | `mcp_gateway/server.js` |
| `GET` | `/health` | `mcp_gateway/server.js` |

## Граф зависимостей (внутренние модули)

### chatavg
```
reset_admin.js → sqlite
server.js → config, errors, sqlite, auth.middleware, sqlite
crypto.js → config
migrate.js → sqlite, config
providers.config.js → config
sqlite.js → config, config
admin.routes.js → auth.middleware, errors, utils, user.repository, category.repository, session.repository, provider.factory, audit.service, crypto, config, providers.config
category.repository.js → sqlite, crypto
audit.service.js → sqlite, redaction.service
auth.middleware.js → config, user.repository, errors
auth.routes.js → auth.middleware, user.repository, errors, audit.service
user.repository.js → sqlite
users.routes.js → user.repository, auth.middleware, errors
chat.routes.js → auth.middleware, errors, chat.service
chat.service.js → category.repository, policyRouter, fallbackPolicy, provider.factory, providers.config, config, utils, semantic.protocol, providerEvents
fallbackPolicy.js → providerErrors
policyRouter.js → provider.factory
session.repository.js → sqlite
sessions.routes.js → auth.middleware, errors, session.repository
execution.routes.js → run.service, config
run.repository.js → sqlite
run.service.js → run.repository, mission.repository, client, config
mission.repository.js → sqlite
mission.routes.js → mission.repository
approval.service.js → sqlite
policy.engine.js → redaction.service
deepseek.js → openai_compat
google.js → base.provider, providerEvents, providerErrors
grok.js → openai_compat
grok_responses.js → openai_responses_compat
llamacpp.js → base.provider, providerEvents, providerErrors
mcp.js → base.provider, providerEvents, providerErrors
openai.js → openai_compat
openai_compat.js → base.provider, providerEvents, providerErrors
openai_responses.js → openai_responses_compat
openai_responses_compat.js → base.provider, providerEvents, providerErrors
qwen.js → openai_compat
provider.factory.js → providers.config, llamacpp, openai, openai_responses, deepseek, google, qwen, grok, grok_responses, mcp, deterministic_provider
providers.routes.js → auth.middleware, provider.factory, category.repository, provider.factory, providers.config, providers.config, providers.config
domain.boundary.js → claim.extractor, semantic.events
semantic.protocol.js → claim.extractor, domain.boundary, claim.ledger, semantic.events
activities.js → run.repository
client.js → config
worker.js → config, activities
agent_run.test.js → server, sqlite
api.test.js → server, sqlite
baseline_security.test.js → server, sqlite
contract_canonical_event.test.js → deterministic_provider, providerEvents
deterministic_provider.test.js → deterministic_provider
errors.test.js → errors
health.test.js → server, sqlite
latency_baseline.test.js → deterministic_provider
deterministic_provider.js → base.provider, providerEvents
approval.service.test.js → approval.service, sqlite
cost.service.test.js → cost.service
policy.engine.test.js → policy.engine
redaction.service.test.js → redaction.service
provider_events.test.js → providerEvents
security.test.js → utils, server, sqlite
security_assertions.test.js → utils
claim_extraction.test.js → claim.extractor
domain_boundary.test.js → domain.boundary, claim.extractor, semantic.protocol
semantic.eval.js → semantic.protocol, claim.extractor, golden_set.json
setup_fixtures.js → sqlite
signal.js → client
```

### mcp_gateway
```
```
