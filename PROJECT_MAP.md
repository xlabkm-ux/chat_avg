# 🗺️ PROJECT MAP — agsys
> Автоматически сгенерировано: `2026-05-07 07:02:51`
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
    N24["deepseek"]
    N25["google"]
    N26["grok"]
    N27["grok_responses"]
    N28["llamacpp"]
    N29["mcp"]
    N30["openai"]
    N31["openai_compat"]
    N32["openai_responses"]
    N33["openai_responses_compat"]
    N34["qwen"]
    N35["base.provider"]
    N36["provider.factory"]
    N37["providerErrors"]
    N38["providerEvents"]
    N39["providers.routes"]
    N40["claim.extractor"]
    N41["claim.ledger"]
    N42["domain.boundary"]
    N43["semantic.events"]
    N44["semantic.protocol"]
    N45["api.test"]
    N46["baseline_security.test"]
    N47["contract_canonical_event.test"]
    N48["deterministic_provider.test"]
    N49["errors.test"]
    N50["fast_path_guardrail.test"]
    N51["health.test"]
    N52["latency_baseline.test"]
    N53["deterministic_provider"]
    N54["provider_events.test"]
    N55["security.test"]
    N56["security_assertions.test"]
    N57["claim_extraction.test"]
    N58["domain_boundary.test"]
    N59["semantic.eval"]
    N60["setup_fixtures"]
  end
  subgraph N61["mcp_gateway"]
    N62["server"]
  end
  N2 --> N9
  N3 --> N4
  N3 --> N6
  N3 --> N9
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
  N11 --> N36
  N11 --> N13
  N11 --> N5
  N11 --> N4
  N11 --> N8
  N12 --> N9
  N12 --> N5
  N13 --> N9
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
  N19 --> N36
  N19 --> N8
  N19 --> N4
  N19 --> N10
  N19 --> N44
  N19 --> N38
  N20 --> N37
  N21 --> N36
  N22 --> N9
  N23 --> N14
  N23 --> N6
  N23 --> N22
  N24 --> N31
  N25 --> N35
  N25 --> N38
  N25 --> N37
  N26 --> N31
  N27 --> N33
  N28 --> N35
  N28 --> N38
  N28 --> N37
  N29 --> N35
  N29 --> N38
  N29 --> N37
  N30 --> N31
  N31 --> N35
  N31 --> N38
  N31 --> N37
  N32 --> N33
  N33 --> N35
  N33 --> N38
  N33 --> N37
  N34 --> N31
  N36 --> N8
  N36 --> N28
  N36 --> N30
  N36 --> N32
  N36 --> N24
  N36 --> N25
  N36 --> N34
  N36 --> N26
  N36 --> N27
  N36 --> N29
  N39 --> N14
  N39 --> N36
  N39 --> N12
  N39 --> N8
  N42 --> N40
  N42 --> N43
  N44 --> N40
  N44 --> N42
  N44 --> N41
  N44 --> N43
  N45 --> N3
  N45 --> N62
  N45 --> N9
  N46 --> N3
  N46 --> N62
  N46 --> N9
  N47 --> N53
  N47 --> N38
  N48 --> N53
  N49 --> N6
  N51 --> N3
  N51 --> N62
  N51 --> N9
  N52 --> N53
  N53 --> N35
  N53 --> N38
  N54 --> N38
  N55 --> N10
  N55 --> N3
  N55 --> N62
  N55 --> N9
  N56 --> N10
  N57 --> N40
  N58 --> N42
  N58 --> N40
  N58 --> N44
  N59 --> N44
  N59 --> N40
  N60 --> N9
```

## Компонент: `chatavg`

| Файл | Строк | Размер | Описание |
|---|---|---|---|
| `diagnose_mcp.js` | 38 | 1.1 KB | — |
| `reset_admin.js` | 22 | 0.6 KB | Admin Reset Utility (SQLite) |
| `server.js` | 157 | 5.4 KB | — |
| `src/core/config.js` | 141 | 5.0 KB | — |
| `src/core/crypto.js` | 78 | 1.9 KB | AES-256-GCM encryption/decryption service. |
| `src/core/errors.js` | 84 | 2.1 KB | Centralized Error Handling |
| `src/core/migrate.js` | 108 | 4.1 KB | Chat AVG — JSON to SQLite Migration Utility |
| `src/core/providers.config.js` | 119 | 4.4 KB | — |
| `src/core/sqlite.js` | 203 | 5.8 KB | — |
| `src/core/utils.js` | 91 | 2.5 KB | Helper Utilities |
| `src/modules/admin/admin.routes.js` | 341 | 12.5 KB | — |
| `src/modules/admin/category.repository.js` | 74 | 3.0 KB | Класс: CategoryRepository |
| `src/modules/audit/audit.service.js` | 66 | 2.0 KB | Log an action to the audit log. |
| `src/modules/auth/auth.middleware.js` | 78 | 2.4 KB | Authentication — JWT middleware & helpers |
| `src/modules/auth/auth.routes.js` | 67 | 2.3 KB | Routes: Authentication |
| `src/modules/auth/user.repository.js` | 70 | 2.5 KB | Класс: UserRepository |
| `src/modules/auth/users.routes.js` | 49 | 1.4 KB | Routes: User Profile |
| `src/modules/chat/chat.routes.js` | 60 | 2.4 KB | Routes: Chat Completions |
| `src/modules/chat/chat.service.js` | 388 | 15.6 KB | Класс: ChatService |
| `src/modules/chat/fallbackPolicy.js` | 49 | 1.6 KB | Класс: FallbackPolicy |
| `src/modules/chat/policyRouter.js` | 39 | 1.1 KB | Класс: PolicyRouter |
| `src/modules/chat/session.repository.js` | 59 | 1.7 KB | Класс: SessionRepository |
| `src/modules/chat/sessions.routes.js` | 105 | 3.3 KB | Routes: Sessions CRUD |
| `src/modules/providers/adapters/deepseek.js` | 19 | 0.4 KB | Provider: DeepSeek |
| `src/modules/providers/adapters/google.js` | 125 | 4.0 KB | Класс: GoogleProvider |
| `src/modules/providers/adapters/grok.js` | 234 | 8.4 KB | Provider: Grok (xAI) |
| `src/modules/providers/adapters/grok_responses.js` | 21 | 0.5 KB | Provider: Grok Responses API (xAI) |
| `src/modules/providers/adapters/llamacpp.js` | 156 | 5.1 KB | Класс: LlamaCppProvider |
| `src/modules/providers/adapters/mcp.js` | 156 | 4.9 KB | Класс: MCPProvider |
| `src/modules/providers/adapters/openai.js` | 22 | 0.5 KB | Provider: OpenAI |
| `src/modules/providers/adapters/openai_compat.js` | 140 | 4.5 KB | Класс: OpenAICompatProvider |
| `src/modules/providers/adapters/openai_responses.js` | 23 | 0.6 KB | Provider: OpenAI Responses API |
| `src/modules/providers/adapters/openai_responses_compat.js` | 176 | 5.7 KB | Класс: OpenAIResponsesProvider |
| `src/modules/providers/adapters/qwen.js` | 20 | 0.5 KB | Provider: Qwen (Alibaba Cloud / DashScope) |
| `src/modules/providers/base.provider.js` | 110 | 3.5 KB | Класс: BaseProvider |
| `src/modules/providers/provider.factory.js` | 50 | 1.3 KB | — |
| `src/modules/providers/providerErrors.js` | 13 | 0.3 KB | Класс: ProviderError |
| `src/modules/providers/providerEvents.js` | 27 | 0.9 KB | — |
| `src/modules/providers/providers.routes.js` | 103 | 3.1 KB | — |
| `src/modules/semantic/claim.extractor.js` | 155 | 5.3 KB | ClaimExtractor — pipeline извлечения утверждений из текста. |
| `src/modules/semantic/claim.ledger.js` | 118 | 2.6 KB | ClaimLedger — реестр всех извлечённых claims per session. |
| `src/modules/semantic/domain.boundary.js` | 202 | 8.6 KB | DomainBoundary — детектор границ области определения и strength downgrade engine. |
| `src/modules/semantic/semantic.events.js` | 53 | 2.1 KB | Semantic Events — канонические типы событий семантического слоя. |
| `src/modules/semantic/semantic.protocol.js` | 116 | 3.6 KB | SemanticProtocol v0 — оркестратор смыслового слоя. |
| `tests/api.test.js` | 170 | 5.3 KB | — |
| `tests/baseline_security.test.js` | 53 | 2.0 KB | — |
| `tests/contract_canonical_event.test.js` | 164 | 5.9 KB | Contract tests for AsyncIterable semantics of provider adapters. |
| `tests/deterministic_provider.test.js` | 89 | 3.0 KB | — |
| `tests/errors.test.js` | 53 | 1.8 KB | — |
| `tests/fast_path_guardrail.test.js` | 131 | 4.7 KB | Fast Path Guardrail Tests |
| `tests/health.test.js` | 51 | 1.5 KB | — |
| `tests/latency_baseline.test.js` | 138 | 5.0 KB | Latency Measurement Utility |
| `tests/mocks/deterministic_provider.js` | 79 | 2.7 KB | DeterministicProvider — синтетический провайдер для тестов. |
| `tests/provider_events.test.js` | 60 | 2.0 KB | — |
| `tests/security.test.js` | 44 | 1.7 KB | — |
| `tests/security_assertions.test.js` | 187 | 6.0 KB | CORS, SSRF, JSON Limit, and Prompt Sanitization assertion tests. |
| `tests/semantic/claim_extraction.test.js` | 113 | 5.2 KB | Tests: ClaimExtractor — извлечение утверждений из текста. |
| `tests/semantic/domain_boundary.test.js` | 174 | 8.2 KB | Tests: DomainBoundary — проверка границ и strength downgrade. |
| `tests/semantic/semantic.eval.js` | 163 | 6.2 KB | Semantic Eval Runner — запуск golden set тестов. |
| `tests/setup_fixtures.js` | 101 | 3.2 KB | — |

### `server.js`
- **Экспорт**: `{ app, server }`, `app`, `server`
- **Роуты**:
  - `USE /api/auth`
  - `USE /api/users`
  - `USE /api/admin`
  - `USE /api/sessions`
  - `USE /api/chat`
  - `USE /api/providers`
  - `GET /health`
  - `GET /ready`
  - `USE /api`
  - `GET *`
- **Зависимости**:
  - `./src/core/config` → PORT, WEBUI_DIR, allowedOrigins, isDev
  - `./src/core/errors` → errorHandler, AppError
  - `./src/core/sqlite` → (side-effect)
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
  - `../../core/config` → ALLOWED_EXTRA_PARAMS, PROVIDER_TIMEOUT, SEMANTIC_LAYER_ENABLED
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
| `CHATAVG_SECRET` | chatavg/api.test.js, chatavg/contract_canonical_event.test.js, chatavg/deterministic_provider.test.js, chatavg/errors.test.js, chatavg/fast_path_guardrail.test.js, chatavg/health.test.js, chatavg/latency_baseline.test.js, chatavg/provider_events.test.js, chatavg/security_assertions.test.js, chatavg/setup_fixtures.js |
| `NODE_ENV` | chatavg/server.js, chatavg/errors.js, chatavg/api.test.js, chatavg/contract_canonical_event.test.js, chatavg/deterministic_provider.test.js, chatavg/errors.test.js, chatavg/fast_path_guardrail.test.js, chatavg/health.test.js, chatavg/latency_baseline.test.js, chatavg/provider_events.test.js, chatavg/security_assertions.test.js, chatavg/setup_fixtures.js |
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
server.js → config, errors, sqlite, sqlite
crypto.js → config
migrate.js → sqlite, config
providers.config.js → config
sqlite.js → config, config
admin.routes.js → auth.middleware, errors, utils, user.repository, category.repository, session.repository, provider.factory, audit.service, crypto, config, providers.config
category.repository.js → sqlite, crypto
audit.service.js → sqlite
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
provider.factory.js → providers.config, llamacpp, openai, openai_responses, deepseek, google, qwen, grok, grok_responses, mcp
providers.routes.js → auth.middleware, provider.factory, category.repository, provider.factory, providers.config, providers.config, providers.config
domain.boundary.js → claim.extractor, semantic.events
semantic.protocol.js → claim.extractor, domain.boundary, claim.ledger, semantic.events
api.test.js → server, sqlite
baseline_security.test.js → server, sqlite
contract_canonical_event.test.js → deterministic_provider, providerEvents
deterministic_provider.test.js → deterministic_provider
errors.test.js → errors
health.test.js → server, sqlite
latency_baseline.test.js → deterministic_provider
deterministic_provider.js → base.provider, providerEvents
provider_events.test.js → providerEvents
security.test.js → utils, server, sqlite
security_assertions.test.js → utils
claim_extraction.test.js → claim.extractor
domain_boundary.test.js → domain.boundary, claim.extractor, semantic.protocol
semantic.eval.js → semantic.protocol, claim.extractor, golden_set.json
setup_fixtures.js → sqlite
```

### mcp_gateway
```
```
