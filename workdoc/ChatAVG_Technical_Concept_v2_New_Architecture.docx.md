**ChatAVG Agent Platform v2.0**

**Техническая концепция платформы с учетом новой архитектуры**

*Meaning-first Agent Execution Platform: ЭР-слой, Mission Room, Adequacy Engine, durable runtime, gateway plane, risk-based Forge*

| Параметр | Значение |
| :---- | :---- |
| Версия документа | 2.1 / Draft for Technical Design |
| Дата | 6 мая 2026 |
| Назначение | Единая техническая концепция ChatAVG v2.0 после пересборки архитектуры. |
| Главное решение | Не строить “всё через MCP \+ sandbox на каждый чат”. Simple chat идет по fast path; retrieval через Knowledge Gateway; tools через MCP Tool Gateway; опасное исполнение через sandbox; долгоживущее состояние через durable workflow; policy/cost/audit через control plane. |
| Ключевая формула | ChatAVG \= ER Meaning Layer \+ Mission Room \+ Adequacy Engine \+ Durable Agent Runtime \+ Gateway Plane \+ Artifact Workspace \+ Control Plane \+ Forge. |

| Архитектурная позиция Платформа не должна быть просто “агентским backend”. Техника ChatAVG служит ЭР-методу: точности различения, удержанию границ области определения, прозрачности человеческих решений и созданию артефактов со следом рассуждения. |
| :---- |

# **Содержание**

* 1\. Executive summary  
* 2\. Архитектурная позиция и итоговое решение  
* 3\. Целевая архитектура v2.0  
* 4\. Принципы и anti-goals  
* 5\. Runtime modes и UX-режимы  
* 6\. Mission / AgentRun lifecycle  
* 7\. Доменная модель  
* 8\. Основные компоненты платформы  
* 9\. Execution flows  
* 10\. Model, Knowledge и MCP Tool Gateways  
* 11\. RAG strategy  
* 12\. Tool contract, approvals и sandbox  
* 13\. Durable execution, state и failure semantics  
* 14\. Security, policy и data governance  
* 15\. Cost governance и observability  
* 16\. Semantic quality и evals  
* 17\. Data storage, events и deployment boundaries  
* 18\. Migration и rollout  
* 19\. Definition of Done  
* 20\. Открытые решения и ближайший backlog  
* Приложения: источники и глоссарий

# **1\. Executive summary**

Новая концепция ChatAVG v2.0 соединяет две линии архитектуры: смысловую архитектуру ЭР-метода и production-ready агентскую платформу. Итоговая платформа должна быть не “моделью с инструментами”, а управляемой средой выполнения миссий, где каждый вывод имеет область определения, силу, источник, уровень реальности и след решений.

Технически это Agent Execution Platform с provider-neutral ядром, durable workflows, mode-driven retrieval, версионированными tool contracts, риск-ориентированным sandboxing, approval UX, cost controls, audit trail и наблюдаемостью не только по latency/cost, но и по смысловой адекватности.

| Вердикт GO with conditions. Реализацию можно вести, если в P0/P1 закреплены fast path, durable execution, provider-neutral gateways, hybrid sandboxing, risk-based policy, cost budgets, semantic evals и постепенный rollout с V1 fallback. |
| :---- |

| Область | Решение новой концепции | Почему это важно |
| :---- | :---- | :---- |
| Execution | Durable Agent Runtime поверх workflow engine. | Approvals, retries, resume/cancel, long-running flows и recovery не должны жить в request handlers. |
| Latency | Fast path для simple chat без sandbox, live MCP discovery и heavy RAG. | V2 не должна восприниматься медленнее V1. |
| Meaning | ER Meaning Layer \+ Claim Ledger \+ Domain Boundary. | Артефакт строится из утверждений и различений, а не из “красивого текста модели”. |
| Tools | MCP Tool Gateway \+ Tool Registry \+ versioned schemas. | MCP является boundary для tools/connectors, а не универсальным названием для inference. |
| Retrieval | Knowledge Gateway с режимами no\_retrieval / fast / balanced / max\_quality. | Ensemble retrieval не является default, иначе растут latency и cost. |
| Sandbox | Risk-based hybrid sandboxing. | Full sandbox нужен для code/browser/write/privileged actions, но не для каждого сообщения. |
| Control plane | Policy, cost, quota, audit, approvals как first-class слой. | Без этого агентская платформа становится дорогой, опасной и плохо диагностируемой. |

# **2\. Архитектурная позиция и итоговое решение**

## **2.1. Что меняется относительно ранней архитектуры**

| Ранняя формулировка | Новая формулировка | Решение |
| :---- | :---- | :---- |
| “OpenAI MCP Server” как центральный provider-сервис для inference, retrieval, tools. | Model Gateway \+ Knowledge Gateway \+ MCP Tool Gateway. | OpenAI-specific логика остается в адаптерах, но MCP используется только как tool/connectors boundary. |
| Sandbox-per-chat как универсальная модель. | Hybrid sandboxing по риску действия. | Simple chat и retrieval используют lightweight/shared runtime; full sandbox только для опасных действий. |
| Async by default для каждого запроса. | Mode-driven execution. | Простой интерактивный чат может быть sync; долгие run переходят в async/progress UX. |
| Ensemble/custom RAG как заметная часть целевой схемы. | RAG modes и eval-based включение сложных pipeline. | Heavy retrieval включается только при доказанном приросте качества. |
| Backend rewrite как технический проект. | Meaning-first platform. | Технические границы подчинены ЭР-протоколу, Claim Ledger, ролям и человеческим решениям. |

## **2.2. Итоговая архитектурная формула**

ChatAVG v2.0 \=  
  ER Meaning Layer  
  \+ Mission Room  
  \+ Adequacy Engine  
  \+ Claim Ledger  
  \+ Durable Agent Runtime  
  \+ Gateway Plane: Model \+ Knowledge \+ MCP Tool  
  \+ Artifact Workspace  
  \+ Conflict Cards / Decision Records  
  \+ Policy / Cost / Audit Control Plane  
  \+ Forge

Все остальные сервисы являются инфраструктурой: очереди, базы, vector stores, sandbox provider, trace tooling, CI/CD, dashboards. Они важны, но не должны определять продуктовую сущность платформы.

# **3\. Целевая архитектура v2.0**

Client / Mission Room UI  
  |  
  v  
API Gateway  
  |  
  v  
Core Platform / Control Plane  
  \- AuthN/AuthZ, tenant/user/workspace/session domain  
  \- Policy Engine, budget/quota, audit log, admin controls  
  |  
  v  
Mission & Agent Control Plane  
  \- Mission API, AgentRun API, run status, approvals, cancellation  
  \- Event stream API, artifact API, decision records  
  |  
  v  
Durable Agent Runtime  
  \- Workflow engine: Temporal / Restate / equivalent  
  \- Planner/executor, role passes, tool orchestration  
  \- Retry/resume/cancel, human-in-the-loop pauses  
  |  
  \+--\> ER Meaning Layer / Adequacy Engine  
  |      \- SemanticProtocol, glossary, Claim Ledger, Domain Boundaries  
  |      \- Distortion passes, Conflict Cards, semantic evals  
  |  
  \+--\> Artifact Workspace  
  |      \- artifact versions, patches, export, provenance  
  |  
  \+--\> Execution Gateways  
         \+-- Model Gateway: OpenAI adapter now, future providers later  
         \+-- Knowledge Gateway: ingestion, retrieval modes, citations  
         \+-- MCP Tool Gateway: Tool Registry, schemas, provider auth, risk class  
         \+-- Sandbox Manager: lightweight runtime, full sandbox, microVM option

Cross-cutting: Trace Bus, Safety, Cost Accounting, Egress Control, Semantic QA

| Компонент | Ответственность | Не должен делать |
| :---- | :---- | :---- |
| Mission Room UI | Показывать цель, контекст, 3-5 ключевых различений, развилки, approvals, артефакты. | Раскрывать всю внутреннюю механику ролей и claims без нужды. |
| Core Platform | Tenant/user/session/workspace, auth, policy, billing, audit, admin domain. | Исполнять workflows или напрямую вызывать provider SDK. |
| Mission & Agent Control Plane | AgentRun API, statuses, event stream, approvals, cancellation, artifact links. | Содержать тяжелую execution-логику в HTTP handlers. |
| Durable Agent Runtime | Workflow orchestration, role passes, agent loop, retries, resume, cancel, side-effect safety. | Знать детали конкретного LLM SDK, SaaS API или vector store. |
| ER Meaning Layer | SemanticProtocol, глоссарий, языковые ограждения, смысловые evals. | Создавать скрытый авторитет или диагностировать пользователя. |
| Adequacy Engine | Claim Ledger, DomainBoundary, карта уровней, искажения, ConflictCards. | Подменять человеческие ценностные решения системным score. |
| Model Gateway | Provider adapters, model routing, retries, usage/cost accounting, normalized responses. | Хранить AgentRun state или approvals. |
| Knowledge Gateway | Ingestion, retrieval modes, vector stores, reranking, citations, provenance. | Попадать в hot path, когда retrieval не нужен. |
| MCP Tool Gateway | Tool Registry, schema cache, tool invocation, auth scopes, risk classes. | Быть runtime или policy engine. |
| Sandbox Manager | Isolation, workspace mount, artifacts, TTL, warm pool, egress policy. | Запускаться для каждого простого текстового запроса. |

# **4\. Принципы и anti-goals**

| Принцип | Практическое следствие |
| :---- | :---- |
| Meaning-first | Функция допустима, если усиливает точность различения, а не только эффектность ответа. |
| Domain-boundary-first | Каждый сильный вывод привязан к области определения; за ее пределами сила вывода понижается. |
| Claim-ledger architecture | Ключевые артефакты собираются из claims, patches и decisions, а не из непрозрачной генерации. |
| Human sovereignty | Ценностные, траекторные и конфликтные решения возвращаются человеку. |
| Fast path first | Simple chat не платит за tool mesh, sandbox allocation и heavy RAG. |
| Durable by default | AgentRun является workflow execution с history, signals, timers и recovery. |
| Provider-neutral core | OpenAI может быть главным provider, но не формирует доменную модель Core. |
| Risk-based execution | Isolation, approval, egress и audit зависят от риска действия. |
| Observable by design | Каждый model call, retrieval, tool call, approval и semantic downgrade создает trace/audit/cost event. |
| Cost is a product constraint | Pre-flight estimate и budgets являются частью execution path. |

| Anti-goal | Запрещаемое решение |
| :---- | :---- |
| Sandbox на каждый чат | Не запускать full sandbox для обычных текстовых ответов. |
| MCP-монолит | Не смешивать inference, retrieval, tools, billing и business domain в одном “OpenAI MCP Server”. |
| Live discovery в каждом run | Tool definitions должны кэшироваться и версионироваться. |
| Ensemble RAG by default | Max-quality retrieval включается только по evals, mode и budget. |
| OpenAI-specific runtime | Responses API и vector stores изолируются в adapters/gateways. |
| Hidden authority | Система не должна создавать впечатление, что знает человека глубже него. |
| Depth scoring | Глубина не превращается в числовой score сущности; используется TrajectoryQuestion. |
| Big-bang migration | V1 fallback и feature flags обязательны до стабильного rollout. |

# **5\. Runtime modes и UX-режимы**

В новой архитектуре есть две ортогональные шкалы: продуктовые режимы ЭР-глубины и технические режимы исполнения. Это предотвращает ошибку, где любой “умный” режим автоматически становится дорогим, медленным и sandbox-heavy.

| Продуктовый режим | Когда применять | ЭР-глубина | Техническая стратегия |
| :---- | :---- | :---- | :---- |
| Fast | Простой ответ, локальная правка, короткое объяснение. | Минимальная: не создавать ложную уверенность. | sync\_interactive, no\_retrieval, no sandbox. |
| Studio | Документы, концепты, стратегии, review, рабочий artifact. | Claim Ledger, границы, 2-3 role passes, patches. | sync\_retrieval или sync\_tool; lightweight runtime; bounded tools. |
| Lab | Сложные человеческие, командные, системные и смысловые задачи. | Полный протокол уровней, искажений, конфликтов и развилок. | async\_agent, durable workflow, progress UI. |
| Forge | Создание файлов, кода, внешние действия, публикация, интеграции. | Проверка artifact, policy и approval перед материализацией. | async\_agent \+ sandbox/tool approvals \+ export pipeline. |

| Execution mode | UX target | Execution path | Sandbox |
| :---- | :---- | :---- | :---- |
| sync\_interactive | TTFT P95 \<= 2.5-3.5 sec | Core \-\> Runtime lightweight \-\> Model Gateway. | Нет. |
| sync\_retrieval | Full answer P95 \<= 6-8 sec | Knowledge Gateway fast/balanced, bounded top-k, citations. | Нет. |
| sync\_tool | P95 \<= 15-20 sec | Policy check \-\> MCP Tool Gateway \-\> stream progress. | Только если tool risk требует. |
| async\_agent | Progress UI вместо ожидания | Durable workflow, approvals, resumability, retries. | По риску; full sandbox для code/browser/write. |
| background\_agent | Notifications и event log | Scheduled/autonomous workflow with quotas. | По policy. |

| Async threshold Если run выходит за интерактивный бюджет, UI не должен держать пользователя в неопределенном ожидании. Runtime переводит run в progress/background mode, сохраняет состояние и показывает понятный статус: retrieval, tool, approval, sandbox, artifact build. |
| :---- |

# **6\. Mission / AgentRun lifecycle**

Mission Lifecycle соединяет ЭР-протокол и технический AgentRun. Mission является смысловой единицей работы; AgentRun \- исполняемым workflow-шагом внутри Mission.

| Шаг | Смысловая задача | Техническое исполнение |
| :---- | :---- | :---- |
| 1\. Create Mission | Пользователь приносит ситуацию, документ, задачу или конфликт. | Mission создается с tenant/user/workspace/session context. |
| 2\. Meaning Intake | Определить чувствительность материала и нужную глубину ЭР-протокола. | Mode classifier: Fast/Studio/Lab/Forge \+ risk/cost pre-check. |
| 3\. Briefing | Зафиксировать цель, контекст, ограничения, критерии, открытые вопросы. | Briefing snapshot, SemanticProtocolId, glossaryVersion. |
| 4\. Pre-flight | Не начинать дорогой/опасный run без понимания цены и риска. | AgentRunEstimate \+ PolicyDecision: allow/approval/downgrade/deny. |
| 5\. Observation & Claim Extraction | Выделить данные и утверждения из текста, документов, истории, sources. | Claim Ledger initialized; citations/provenance attached. |
| 6\. Domain Mapping | Определить, где claim имеет право на силу. | DomainBoundary records; claim strength may be downgraded. |
| 7\. Role / Distortion Passes | Проверить язык, уровни, когнитивные, психические, системные и траекторные риски. | Role pass contracts; patches/conflict cards created. |
| 8\. Retrieval / Tool Planning | Подключить знания или действия только при необходимости. | Knowledge Gateway or MCP Tool Gateway with policy and budgets. |
| 9\. Artifact Build | Собрать рабочий результат через patches. | ArtifactWorkspace versions \+ ArtifactPatch lineage. |
| 10\. Conflict Resolution | Вернуть человеку развилки, где требуется выбор. | ConflictCard \+ DecisionRecord \+ approval/edit UI. |
| 11\. Synthesis | Финальная версия с открытыми границами, решениями и источниками. | NormalizedResponse \+ artifact links \+ trace summary. |
| 12\. Forge / Export | Материализовать файл, код или внешнее действие. | Sandbox/tool execution only after policy and approval. |

# **7\. Доменная модель**

## **7.1. Смысловые сущности**

| Сущность | Назначение |
| :---- | :---- |
| Mission | Единица работы с ситуацией, документом, замыслом или конфликтом. |
| SemanticProtocol | Версия ЭР-протокола, глоссария, языковых ограждений и eval-набора. |
| Observation | Нормализованное данное из текста, документа, голоса, истории или источника. |
| Claim | Единица утверждения с типом, уровнем, границей, силой и источниками. |
| DomainBoundary | Описание области, где claim имеет право на силу. |
| DistortionHypothesis | Осторожная гипотеза об искажении без диагноза и без скрытого авторитета. |
| ConflictCard | Развилка между вариантами, уровнями, ценностями или рисками. |
| DecisionRecord | Человеческое или системное решение с основанием и временем. |
| ArtifactPatch | Изменение артефакта с причиной и ссылкой на claims/decisions. |
| TrajectoryQuestion | Вопрос о направлении и последствиях вместо оценки сущности человека. |

## **7.2. Исполняемые сущности**

| Сущность | Назначение |
| :---- | :---- |
| ChatSession | Пользовательский чат, видимый transcript, настройки и история. |
| AgentSession | Runtime state, memory scope, sandbox policy, mcp/tool profile. |
| AgentRun | Один workflow-запуск по сообщению, задаче, tool-chain или Forge operation. |
| ToolCall | План/исполнение tool с версией schema, status, risk, policy, idempotency key. |
| ApprovalRequest | Запрос подтверждения действия с preview/diff, choices, timeout, audit trail. |
| SandboxSession | Workspace, files, snapshots, TTL, egress policy, artifact extraction. |
| Artifact | Файл, отчет, JSON, документ, screenshot или generated content. |
| TraceEvent | Событие run: model, retrieval, tool, approval, sandbox, cost, semantic quality. |

## **7.3. Минимальные contract sketches**

type Claim \= {  
  claimId: string;  
  missionId: string;  
  text: string;  
  type: 'observation' | 'interpretation' | 'hypothesis' | 'decision' | 'recommendation';  
  level: 'text' | 'fact' | 'model' | 'value' | 'trajectory' | 'system';  
  strength: 'fact' | 'strong\_inference' | 'weak\_hypothesis' | 'question';  
  domainBoundaryId?: string;  
  sourceRefs: string\[\];  
  downgradedReason?: string;  
  createdBy: 'user' | 'system' | 'role\_pass';  
  createdAt: string;  
};

type AgentRun \= {  
  runId: string;  
  missionId: string;  
  sessionId: string;  
  tenantId: string;  
  userId: string;  
  mode: 'sync\_interactive' | 'sync\_retrieval' | 'sync\_tool' | 'async\_agent' | 'background\_agent';  
  status: 'queued' | 'running' | 'requires\_action' | 'waiting' |  
          'completed' | 'failed' | 'cancelled' | 'expired';  
  semanticProtocolId: string;  
  modelPolicyId: string;  
  toolSnapshotId: string;  
  sandboxId?: string;  
  metrics: AgentRunMetrics;  
  error?: AgentRunError;  
};

# **8\. Основные компоненты платформы**

## **8.1. ER Meaning Layer**

ER Meaning Layer \- не “еще один микросервис”, а обязательный слой правил, contracts и evals. Он прикрепляет к каждой Mission: SemanticProtocolId, glossaryVersion, language guardrails, уровни реальности, правила силы утверждений и набор смысловых проверок.

* Канонические документы и версии протокола.  
* Глоссарий и запрещенные языковые подмены.  
* Правила понижения силы claim при выходе за область определения.  
* ЭР-evals: область определения, язык, карта уровней, вырождения пути, скрытый авторитет.  
* UX-summary: показывать не всю механику, а 3-5 главных различений и открытых границ.

## **8.2. Adequacy Engine**

Adequacy Engine является смысловым middleware между входным материалом и итоговым артефактом. Он не спорит ради спора, а нормализует утверждения, проверяет область определения, фиксирует развилки и ограничивает силу вывода.

| Pass | Контракт роли | Выход |
| :---- | :---- | :---- |
| Observer | Фиксировать только данное, не интерпретировать раньше времени. | Observation records. |
| Boundary | Проверить область определения и право claim на силу. | DomainBoundary \+ downgrades. |
| Language | Найти слова-заглушки, подмены и иллюзию понимания. | Language patches. |
| Psychic Distortion | Осторожно описать возможные механизмы без диагноза. | DistortionHypothesis. |
| System | Проверить связи, последствия и внешние ограничения. | System risks / dependencies. |
| Trajectory | Поставить вопросы о направлении без score сущности. | TrajectoryQuestion. |
| Builder/Synthesizer | Собрать artifact и оставить открытые границы видимыми. | ArtifactPatch \+ synthesis. |

## **8.3. Artifact Workspace**

Artifact Workspace хранит не только финальный документ, но и trace различения: versions, patches, claim links, decisions, approvals, source refs, export events. Это критично для доверия, redline/review, enterprise audit и последующей пересборки.

type ArtifactPatch \= {  
  patchId: string;  
  artifactId: string;  
  runId: string;  
  reason: string;  
  claimRefs: string\[\];  
  decisionRefs: string\[\];  
  diff: string;  
  author: 'user' | 'system' | 'role\_pass' | 'tool';  
  createdAt: string;  
};

# **9\. Execution flows**

## **9.1. Simple chat fast path**

UI \-\> API Gateway \-\> Core auth/session \-\> lightweight Agent Runtime \-\> Model Gateway  
   \-\> streaming response \-\> trace/cost event \-\> Mission transcript

Skipped by design:  
  \- full sandbox allocation  
  \- live MCP tool discovery  
  \- heavy RAG / ensemble retrieval  
  \- unnecessary approval workflow

## **9.2. Retrieval-assisted answer**

UI \-\> AgentRun \-\> query classification \-\> Knowledge Gateway  
   \-\> retrieval mode selection: fast / balanced / max\_quality  
   \-\> retriever \+ optional reranker \+ citation validation  
   \-\> Model Gateway synthesis with sources  
   \-\> answer \+ cited claims \+ retrieval trace

## **9.3. Tool call**

AgentRun \-\> tool plan \-\> Policy Engine  
   \-\> allow / deny / require\_approval / downgrade  
   \-\> MCP Tool Gateway \-\> provider tool  
   \-\> schema validation \+ output safety checks  
   \-\> ToolCall audit \+ result to runtime

## **9.4. Forge / artifact materialization**

Mission \-\> Artifact plan \-\> pre-flight cost/risk estimate  
   \-\> durable workflow \-\> sandbox if required  
   \-\> create/edit artifact \-\> visual/semantic QA \-\> approval when needed  
   \-\> export/store/publish \-\> audit and rollback metadata

# **10\. Model, Knowledge и MCP Tool Gateways**

## **10.1. Model Gateway**

Model Gateway инкапсулирует provider-specific inference. Для MVP OpenAI может быть единственным adapter, но Core и Agent Runtime не должны импортировать OpenAI SDK и не должны зависеть от provider-specific response semantics.

* OpenAI Adapter: responses.create/stream, structured outputs, model routing, usage mapping.  
* NormalizedResponse: answer, usage, model, provider, latencyMs, sources, artifacts.  
* Fallback routing и degradation должны тестироваться на evals, а не только на availability.  
* Provider-specific metadata допускается только в gateway-owned records, не в публичных API contracts.

## **10.2. Knowledge Gateway**

Knowledge Gateway отвечает за ingestion, embeddings, vector stores, hybrid retrieval, reranking, citations и provenance validation. Core выбирает retrieval policy, но не содержит retrieval algorithms.

## **10.3. MCP Tool Gateway**

MCP используется как граница для tools/connectors. Tool Gateway хранит Tool Registry, schema cache, auth scopes, risk class, timeouts, retry policy и approval policy. Live discovery на каждый run запрещен.

type ToolDefinitionVersion \= {  
  providerId: string;  
  toolName: string;  
  toolVersion: string;  
  schemaHash: string;  
  inputSchema: JsonSchema;  
  outputSchema?: JsonSchema;  
  riskClass: 'read' | 'write' | 'external\_side\_effect' |  
             'code\_exec' | 'browser' | 'privileged';  
  authScope: string\[\];  
  approvalPolicyId?: string;  
  timeoutMs: number;  
  retryPolicyId?: string;  
  createdAt: string;  
  deprecatedAt?: string;  
};

| Переименование OpenAI MCP Server Если компонент отвечает за model inference, streaming, model routing и token accounting, это Model Gateway / OpenAI Adapter. Если компонент отвечает за retrieval, это Knowledge Gateway / OpenAI retrieval adapter. MCP оставляем для tools/connectors, чтобы не создать новый distributed monolith. |
| :---- |

# **11\. RAG strategy**

RAG в v2 является mode-driven. Цель \- управлять trade-off между latency, cost и quality. Сложность retrieval включается только там, где она доказуемо улучшает результат.

| Mode | Когда использовать | Pipeline | Target |
| :---- | :---- | :---- | :---- |
| no\_retrieval | Обычный чат без необходимости knowledge base. | No vector search. | Минимальная latency. |
| fast | Короткий вопрос по базе знаний. | Single retriever, bounded top-k, no heavy reranker. | P95 \< 6 sec. |
| balanced | Default для рабочих вопросов по документам. | Query rewrite \+ main retriever \+ lightweight reranker \+ citations. | Качество без сильного роста latency. |
| max\_quality | Research, high-stakes, сложные корпусные вопросы. | Multi-retriever, dedup, cross-encoder reranker, context compression. | Async-friendly; качество важнее скорости. |

query classification  
  \-\> retrieval mode selection  
  \-\> query rewriting  
  \-\> optional hypothetical document embeddings  
  \-\> retriever execution  
  \-\> deduplication  
  \-\> reranking  
  \-\> context compression  
  \-\> citation/provenance validation  
  \-\> answer generation

| RAG eval | Что измеряет |
| :---- | :---- |
| Answer relevance | Ответ действительно отвечает на вопрос. |
| Context precision/recall | Найдены нужные chunks без лишнего шума. |
| Citation correctness | Ссылки подтверждают конкретные claims. |
| Empty retrieval behavior | Система честно сообщает, когда источников недостаточно. |
| Hallucination rate | Система не придумывает факты вне sources/domain. |
| Retrieval latency | P50/P95 по mode, corpus и tenant. |
| Cost per retrieval-assisted answer | Стоимость retrieval \+ reranking \+ model call. |

# **12\. Tool contract, approvals и sandbox**

## **12.1. Tool policy**

Tool execution регулируется не названием сервера, а riskClass, actionType, resourceScope, dataSensitivity, estimatedCostUsd и user intent. Любое действие с внешним side effect должно иметь idempotencyKey.

| Класс действия | Пример | Runtime | Approval | Network |
| :---- | :---- | :---- | :---- | :---- |
| Low-risk text | Обычный чат | Shared lightweight runtime | Нет | N/A |
| Retrieval | Поиск в базе знаний | Shared runtime \+ Knowledge Gateway | Нет/по policy | Internal only |
| Read-only tools | Прочитать CRM/contact | MCP Tool Gateway | Обычно нет | Provider allowlist |
| Write tools | Отправить email, обновить CRM | Isolated run context | Да | Provider allowlist |
| Code execution | Python/JS обработка файлов | Full sandbox | По риску | Default deny |
| Browser/computer use | Действия в UI | Full sandbox \+ recording | Да | Allowlist |
| Privileged/system | Shell/system-level | MicroVM/hardened sandbox | Да \+ step-up | Deny by default |

## **12.2. Approval UX**

Approval не должен превращаться в раздражающий confirm на каждый шаг. Он должен группировать действия, показывать preview/diff, разрешать edit-then-approve и поддерживать bounded trust для низкорисковых сценариев.

* approve\_once  
* approve\_for\_this\_run  
* approve\_for\_this\_session  
* edit\_then\_approve  
* reject / reject\_and\_explain  
* always\_allow\_low\_risk\_for\_this\_workspace

## **12.3. Sandbox policy**

Sandbox Manager реализует гибридную модель: lightweight runtime для безопасных операций и full sandbox / microVM для code, browser, privileged или write-heavy workflows. По умолчанию internet disabled; egress разрешается только через policy.

* Warm pool для активных tenants и predictable Forge workloads.  
* Workspace mount/unmount, artifact extraction, snapshots/resume, TTL cleanup.  
* Default-deny egress: allow tenant-approved domains, provider endpoints, signed artifact URLs.  
* Логировать каждый outbound request с runId, sandboxId, destination и policy decision.

# **13\. Durable execution, state и failure semantics**

AgentRun должен быть durable workflow execution. Простая очередь и таблица статусов недостаточны для human-in-the-loop approvals, long-running tools, retries, resume/cancel и предотвращения duplicated side effects.

| Entity | States |
| :---- | :---- |
| AgentRun | queued, running, requires\_action, waiting, completed, failed, cancelled, expired |
| ToolCall | planned, policy\_checking, requires\_approval, approved, running, succeeded, failed, rejected, timeout |
| ApprovalRequest | pending, approved, rejected, edited, timeout, expired |
| SandboxSession | warming, idle, assigned, running, frozen, terminated, failed |
| Artifact | created, processing, available, quarantined, deleted |

| Сбой | Поведение |
| :---- | :---- |
| Model provider timeout | Retry with backoff; затем fallback model или graceful failure с partial state. |
| Tool timeout | Retry только если idempotent; иначе pause/manual recovery. |
| Sandbox crash | Recreate sandbox, remount workspace, resume from workflow checkpoint. |
| Runtime pod restart | Workflow replay; approvals не теряются; side effects не дублируются. |
| Approval timeout | Expire approval; run expires или продолжает без optional action. |
| Vector store unavailable | Degrade to no\_retrieval/fast failure path с честным объяснением. |
| Budget exceeded | Stop, summarize partial state, ask user or downgrade mode. |
| Stream disconnect | Client reconnects to run event stream; duplicate run не создается. |

type ToolCallExecution \= {  
  toolCallId: string;  
  idempotencyKey: string;  
  dryRunSupported: boolean;  
  compensationSupported: boolean;  
  retryPolicy: {  
    maxAttempts: number;  
    retryableErrors: string\[\];  
  };  
};

# **14\. Security, policy и data governance**

## **14.1. Policy Engine**

Policy input:  
  tenantId, userId, sessionId, workspaceId  
  toolName, actionType, resourceScope, riskClass  
  modelPlan, userIntent, dataSensitivity  
  estimatedCostUsd, egressDestination, artifactSensitivity

Policy output:  
  allow | deny | require\_approval | require\_step\_up\_auth | downgrade

| Risk score | Decision | Examples |
| :---- | :---- | :---- |
| 0-20 | Auto-approve | Read-only internal lookup, low-sensitivity retrieval. |
| 21-50 | Auto-approve with limits | Read external SaaS under tenant-approved scope. |
| 51-80 | Require approval | Write operations, external recipients, document edits. |
| 81-100 | Approval \+ step-up \+ audit | Financial, privileged, data export, code/browser actions. |

## **14.2. Threat model baseline**

| Риск | Контроль |
| :---- | :---- |
| Prompt injection через tool output | Output validation, quoted tool context, source trust labels, tool-result isolation. |
| Tool permission escalation | Risk classes, resource scopes, tenant credentials, approval/step-up. |
| Data exfiltration | DLP/redaction, egress allowlist, sandbox default-deny, audit trail. |
| Cross-tenant leakage | Tenant-scoped storage, workspace isolation, credentials isolation, tests. |
| Duplicated side effects | IdempotencyKey, compensation policy, workflow checkpoints. |
| Hidden authority / overclaiming | SemanticProtocol, Claim strength, DomainBoundary, UX disclosure. |

# **15\. Cost governance и observability**

Cost governance должен быть частью execution path, а не только dashboard после факта. Иначе combination of model calls \+ retrieval \+ reranking \+ sandbox minutes \+ retries может быстро сделать средний run непрогнозируемым.

type CostPolicy \= {  
  tenantId: string;  
  monthlyBudgetUsd: number;  
  dailyBudgetUsd: number;  
  maxCostPerRunUsd: number;  
  maxModelCallsPerRun: number;  
  maxToolCallsPerRun: number;  
  maxSandboxMinutesPerRun: number;  
  maxRetrievalQueriesPerRun: number;  
  allowedModels: string\[\];  
  fallbackModel?: string;  
};

type AgentRunEstimate \= {  
  runId: string;  
  mode: 'simple' | 'rag' | 'tool' | 'sandbox' | 'max\_quality';  
  estimatedModelCalls: number;  
  estimatedToolCalls: number;  
  estimatedRetrievalQueries: number;  
  estimatedSandboxSeconds: number;  
  estimatedCostUsd: number;  
  policyDecision: 'allow' | 'require\_approval' | 'downgrade' | 'deny';  
};

| Dashboard | Что показывает |
| :---- | :---- |
| Cost per successful mission/run | Unit economics по mode, tenant, model, tools, retrieval. |
| P95 latency by run type | sync\_interactive, sync\_retrieval, sync\_tool, async\_agent. |
| Tool failure/retry rate | Качество MCP contracts, provider health, timeout tuning. |
| Approval conversion/rejection/timeout | Approval fatigue, UX friction, policy false positives. |
| Sandbox warm-pool hit rate | Стоимость и latency Forge/code/browser workflows. |
| Semantic downgrade rate | Сколько claims понижено с fact до hypothesis/question. |
| Domain violation rate | Где система пыталась говорить сильнее, чем имела право. |

## **15.1. Trace event model**

run.created, run.started, run.completed, run.failed, run.cancelled  
model.requested, model.stream\_started, model.completed, model.failed  
retrieval.started, retrieval.completed, rerank.completed, citation.validated  
tool.call\_requested, tool.policy\_checked, tool.call\_completed, tool.call\_failed  
approval.requested, approval.approved, approval.rejected, approval.timeout  
sandbox.assigned, sandbox.cold\_started, sandbox.egress\_checked, sandbox.terminated  
artifact.patch\_created, artifact.exported, artifact.quarantined  
claim.created, claim.downgraded, boundary.violation\_detected, conflict.card\_created  
cost.estimated, cost.committed, quota.exceeded

# **16\. Semantic quality и evals**

Качество ChatAVG нельзя свести к thumbs-up, latency и token cost. Платформа должна измерять, где она сохраняет или теряет смысловую адекватность.

| Semantic metric | Интерпретация |
| :---- | :---- |
| Claim downgrade count | Сколько утверждений понижено с fact/strong inference до hypothesis/question. |
| Domain boundary violations | Где claim был применен за пределами области определения. |
| Language substitution fixes | Сколько слов-заглушек и псевдопониманий исправлено. |
| Level mixing incidents | Где текст смешивал факт, модель, ценность, траекторию или систему. |
| ConflictCards requiring human decision | Сколько развилок система не имела права закрывать сама. |
| Artifact rebuild rate | Какие артефакты возвращены на пересборку после semantic QA. |
| User “overreach” feedback | Где пользователь отметил перегиб, мистификацию, диагноз или упрощение. |

## **16.1. Eval-набор P0**

* Область определения: система не делает сильный вывод там, где данных недостаточно.  
* Язык: система исправляет слова-заглушки и не прячет незнание в красивых формулировках.  
* Карта уровней: не смешиваются факт, интерпретация, ценность, рекомендация и траектория.  
* Вырождение пути: система замечает, где оптимизация эффекта разрушает смысловую точность.  
* Artifact trace: финальный документ содержит след решений, claims, patches и открытых границ.  
* Tool safety: high-risk действия невозможны без approval и audit.

# **17\. Data storage, events и deployment boundaries**

Ниже приведена рекомендуемая, но не жестко обязательная схема хранения. Главный принцип: workflow state, audit trail, artifacts, vector indexes и streaming events не должны смешиваться в одной таблице или одном сервисе.

| Данные | Рекомендуемое хранение | Комментарий |
| :---- | :---- | :---- |
| Core domain | PostgreSQL / relational DB | Tenant, user, mission, session, policies, decisions, metadata. |
| Workflow state | Temporal/Restate backend | History, timers, signals, retries, deterministic replay. |
| Trace/audit events | Append-only event store \+ analytics sink | Source of truth для audit/cost; внешние tools только overlay. |
| Artifacts | Object storage \+ metadata DB | Versions, patches, exports, quarantine, retention policy. |
| Knowledge indexes | Knowledge Gateway owned stores | Vector stores, chunk metadata, citations, corpus versions. |
| Streaming | Event bus / SSE/WebSocket layer | Replayable AgentRunEvent log; reconnect-safe. |
| Secrets | Secret manager | Tenant-scoped credentials; no raw secrets in prompts. |

## **17.1. Ownership matrix**

| Сервис | Owner | Primary SLO |
| :---- | :---- | :---- |
| API Gateway / Core Platform | Core Backend | Availability, auth latency, session correctness. |
| Durable Agent Runtime | Runtime Backend | Run completion, recovery, no duplicated side effects. |
| Model Gateway | Model/Provider Engineer | TTFT, provider errors, token/cost correctness. |
| Knowledge Gateway | RAG Engineer | Retrieval quality, citation correctness, retrieval latency. |
| MCP Tool Gateway | Integrations Engineer | Schema stability, tool reliability, policy enforcement. |
| Sandbox Manager | Sandbox/SRE | Cold start, isolation, cleanup, egress policy. |
| Security / Policy | Security Engineer | No approval bypass, data protection, audit completeness. |
| Semantic Evals | Product/Research \+ QA | Adequacy regression prevention. |

# **18\. Migration и rollout**

V2 нельзя запускать big-bang rewrite. Нужны feature flags на tenant/workspace/user/agent profile, V1 fallback для критичных сценариев, A/B по latency/cost/success и shadow evals для RAG/model routing.

| Phase | Scope | Exit criteria |
| :---- | :---- | :---- |
| Phase 0: Architecture lock | ADR, domain contracts, semantic protocol contracts, risk model, fast path decision. | Architecture/threat-model review passed; baseline V1 behavior captured. |
| Phase 1: Core fast path | TypeScript Core skeleton, Model Gateway OpenAI adapter, sync\_interactive streaming. | Simple chat latency не хуже V1; no provider SDK in Core. |
| Phase 2: Durable runtime | Workflow engine, AgentRun state machine, event log, cancellation/retry/resume. | Run survives restart; no duplicated side effects in tests. |
| Phase 3: ER/Adequacy layer | SemanticProtocolId, Claim Ledger, DomainBoundary, Role pass contracts. | ЭР-evals run in CI; claims can be downgraded and explained. |
| Phase 4: Knowledge Gateway | Retrieval modes, ingestion, citations, RAG evals. | Balanced RAG beats baseline within latency/cost budget. |
| Phase 5: MCP tools \+ approvals | Tool Registry, versioned schemas, policy/approval UX, audit. | High-risk tools cannot bypass approval. |
| Phase 6: Forge/sandbox | Hybrid sandbox, artifacts, snapshots, egress control, visual QA pipeline. | Sandbox isolation, cleanup and egress tests pass. |
| Phase 7: Enterprise/multi-provider | Budgets, audit exports, DLP, second provider adapter/fallback. | OpenAI outage degrades gracefully for supported scenarios. |

## **18.1. Rollout controls**

* Feature flags: tenant, workspace, user, agent profile, retrieval mode, tool provider, sandbox policy.  
* A/B: latency, cost, success rate, retention, approval conversion, user-reported overreach.  
* Shadow evals: RAG, model routing, semantic protocol, role passes, tool plans.  
* Fallback: V1 path for critical tenants until V2 SLO and quality gates hold for 3-4 months.  
* Rollback: tested runbook before production cutover, including queue drain and artifact preservation.

# **19\. Definition of Done**

| Area | DoD |
| :---- | :---- |
| Architecture | Agent Runtime, Model Gateway, Knowledge Gateway, MCP Tool Gateway, Sandbox Manager, Policy Engine and Adequacy Engine separated. |
| Latency | Simple chat uses fast path; tool discovery cached; async fallback implemented; TTFT/P95 measured per mode. |
| Durability | AgentRun, ToolCall, ApprovalRequest and SandboxSession have deterministic state machines and recovery tests. |
| MCP | Tool contracts versioned by providerId/toolName/toolVersion/schemaHash/riskClass; timeout/retry/error semantics published. |
| RAG | no\_retrieval, fast, balanced, max\_quality implemented; ensemble not default; citation validation and degradation path exist. |
| Security | Risk-based approval, step-up for high-risk, egress control, prompt-injection tests, data redaction. |
| Cost | Pre-flight estimate, tenant/project/user budgets, cost per successful run dashboard. |
| Semantic quality | SemanticProtocolId in every Mission; Claim Ledger and DomainBoundary in artifact workflow; semantic evals in CI. |
| Sandbox | Hybrid runtime, warm pool, TTL cleanup, workspace lifecycle, artifact extraction, isolation tests. |
| Migration | Feature flags, V1 fallback, A/B, shadow evals, rollback procedures, owner matrix. |

# **20\. Открытые решения и ближайший backlog**

| Открытое решение | Варианты | Рекомендация / следующий шаг |
| :---- | :---- | :---- |
| Durable execution engine | Temporal, Restate, Inngest, custom | Benchmark Temporal vs Restate на approval/resume/tool-retry сценариях. |
| Sandbox platform | E2B, Modal, Firecracker self-hosted, gVisor/seccomp | Сравнить cold start, price, isolation, egress controls, compliance. |
| Default RAG mode | fast или balanced | Выбрать по evals; max\_quality не делать default. |
| Second model provider | Anthropic, DeepSeek, local/open-source | Выбрать по fallback use cases, quality/cost, availability. |
| Trace tooling | LangSmith, Phoenix, Helicone, internal only | Собственный Trace Bus обязателен; внешние инструменты как overlay. |
| Approval granularity | Tool-level, action-level, resource-level | Старт: riskClass \+ actionType \+ resourceScope; расширять по telemetry. |
| UI depth disclosure | Full trace, summary, progressive disclosure | Показывать 3-5 различений \+ expandable trace для power users. |

## **20.1. P0 backlog artifacts**

| Artifact | Содержание |
| :---- | :---- |
| ADR-001 | Final ChatAVG v2 architecture: meaning-first \+ durable execution \+ gateways. |
| ADR-002 | MCP boundary: MCP for tools/connectors, not universal inference layer. |
| ADR-003 | Hybrid sandboxing and risk-based execution policy. |
| SPEC-001 | Mission, AgentRun, Claim Ledger, ArtifactPatch domain model. |
| SPEC-002 | AgentRunEvent schema and replayable streaming log. |
| SPEC-003 | ToolDefinitionVersion, ToolCall, ApprovalRequest contracts. |
| SPEC-004 | RAG modes and citation/provenance contract. |
| SPEC-005 | SemanticProtocol, DomainBoundary, RolePass contract. |
| EVAL-001 | Semantic adequacy eval dataset. |
| EVAL-002 | RAG \+ citation eval baseline. |
| RUNBOOK-001 | Provider outage and fallback. |
| RUNBOOK-002 | Sandbox cleanup / egress incident. |
| RUNBOOK-003 | Queue saturation and backpressure. |

| Главный следующий шаг Зафиксировать ADR-001 и SPEC-001/SPEC-005 до начала кода. Без SemanticProtocolId, Claim Ledger и fast path новая платформа рискует стать технически сложной, но смыслово слабой и медленной. |
| :---- |

# **Приложение A. Исходные документы**

Концепция подготовлена на основе четырех предоставленных документов проекта. Внутренние решения ниже нормализуют их в единую целевую архитектуру и явно снимают противоречия между ранней и обновленной редакциями.

| Документ | Роль в новой концепции |
| :---- | :---- |
| ChatAVG v2.0 Architecture Implementation | Смысловая архитектура: ER Meaning Layer, Mission Lifecycle, Claim Ledger, роли, semantic observability. |
| ChatAVG Agent Platform V2 Concept v2 | Основная production-ready коррекция: fast path, durable runtime, gateways, policy/cost/audit control plane, risk-based sandbox. |
| ChatAVG Agent Platform V2 Implementation Plan | Источник delivery-структуры: спринты, тестовые уровни, release gates, роли, backlog artifacts. |
| ChatAVG Agent Platform V2 Concept | Ранняя формулировка provider mesh, AgentSession, OpenAI-first and not OpenAI-only; использована как контекст, но не как финальная целевая схема. |

# **Приложение B. Глоссарий**

| Термин | Определение |
| :---- | :---- |
| Adequacy Engine | Движок проверки смысловой адекватности: claims, границы области, уровни реальности, искажения, развилки. |
| AgentRun | Один исполняемый запуск агента по сообщению, задаче или workflow-шагу. |
| ArtifactPatch | Версионируемое изменение артефакта с причиной, автором, ссылками на claims и решением. |
| Claim Ledger | Реестр утверждений с типом, силой, источником, границей и статусом. |
| ConflictCard | Карточка развилки, где системе нельзя выбирать вместо человека без явного решения. |
| Forge | Режим материализации: файлы, код, внешние действия, публикация или интеграции. |
| Knowledge Gateway | Единая граница retrieval/ingestion/vector stores/reranking/citations. |
| MCP Tool Gateway | Граница tools/connectors с registry, schemas, auth, risk class, policy и audit. |
| Mission | Единица пользовательской работы с ситуацией, документом, задачей или конфликтом. |
| SemanticProtocol | Версия ЭР-протокола, глоссария, языковых ограждений и eval-правил. |
| TrajectoryQuestion | Вопрос о направлении и последствиях вместо score сущности или скрытой диагностики. |

