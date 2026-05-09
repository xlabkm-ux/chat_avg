**ChatAVG v2.3 - Уточнение технологического концепта**

*Responses-inspired ModelGateway, LiteLLM-first adapter layer и Durable
Workflow Runtime*

| **Версия**     | v1.0                                                                                                                                                                     |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Дата**       | 9 мая 2026                                                                                                                                                               |
| **Статус**     | Draft for Architecture / Product / Backend Review                                                                                                                        |
| **Назначение** | Зафиксировать уточненную технологическую позицию ChatAVG по ModelGateway, OpenAI Responses API, LiteLLM, инструментам, knowledge/vector layer, MCP и workflow execution. |

# 1. Executive summary

ChatAVG должен взять OpenAI Responses API не как provider-lock и не как
внутренний монолит, а как референсную архитектурную модель для
собственного ModelGateway.

LiteLLM остается primary adapter для multi-provider inference, routing,
fallback, cost tracking и virtual keys. OpenAI Responses не становится
отдельным центральным сервисом, а остается нативным capability adapter
там, где нужны специфические возможности OpenAI или точная совместимость
с Responses semantics.

Workflow execution не должен жить внутри OpenAI Responses или LiteLLM.
Владельцем пользовательских workflow остается ChatAVG Durable Runtime:
WorkflowContract, WorkflowRouter, WorkflowRun, Mission/AgentRun state
machine, approvals, DecisionRecord, ArtifactPatch, Claim Ledger и
trace/audit/cost events.

> ChatAVG ModelGateway = Responses-inspired orchestration semantics  
> + LiteLLM-first provider/proxy adapter  
> + OpenAI Native Responses adapter as capability/fallback path  
> + Local model adapter path  
> + Tool/Knowledge/Sandbox bridges under ChatAVG policy  
> + normalized streaming, usage, cost and trace

# 2. Контекст и проблема

В проекте одновременно появились три линии: LiteLLM как
ModelGateway-кандидат, OpenAI Responses API как новая provider primitive
и ChatAVG Workflow Platform как Mission-first система с Artifact, Claim
Ledger, DomainBoundary и durable AgentRun.

Риск состоит в смешении уровней: ModelGateway может превратиться в новый
OpenAI-centric monolith, а workflow orchestration может быть передан
provider API. Это нарушит provider-neutral core, human sovereignty,
auditability и artifact-first execution.

> ChatAVG Workflow Runtime owns: state, mission, artifact, approval,
> semantic gates.  
> ModelGateway owns: model run normalization, provider routing,
> tool-call envelope, streaming, cost/usage/trace.  
> LiteLLM/OpenAI own: provider-specific inference capabilities.

# 3. Принципиальная позиция

Принимаем OpenAI Responses как архитектурный образец: unified
input/output items, streaming event model, tool-call loop, hosted and
remote tools, stateful context, structured outputs, usage/cost
visibility and future-proof model interaction primitive.

Не принимаем OpenAI Responses как владельца ChatAVG workflow. Модель
может быть агентной внутри ограниченного шага, но она не должна владеть
всей миссией, решать approval boundaries, менять artifact без trace или
выполнять risky tools без Policy/Approval layer.

> Provider APIs are capability layers.  
> ChatAVG Workflow Runtime is the system of record.

# 4. Целевая архитектура

> Frontend / Mission Cockpit  
> -\> WorkflowRun API  
> -\> WorkflowRouter  
> -\> WorkflowContract  
> -\> Temporal / Durable Runtime  
> -\> Activities:  
> - ModelGateway.call()  
> - KnowledgeGateway.retrieve()  
> - AdequacyEngine.extractClaims()  
> - ArtifactService.applyPatch()  
> - PolicyEngine.evaluate()  
> - ToolGateway.invoke()  
> - ApprovalService.waitForSignal()  
> - Forge/Sandbox.execute()

## 4.1. ModelGateway internal architecture

> ModelGateway  
> - ModelRun Orchestrator  
> - input normalization  
> - output normalization  
> - streaming event mapping  
> - tool policy envelope  
> - usage/cost accounting  
> - trace mapping  
> - Provider Adapters  
> - LiteLLMAdapter  
> - OpenAIResponsesAdapter  
> - LlamaCppAdapter / LocalModelAdapter  
> - Capability Bridges  
> - KnowledgeGateway / file search  
> - MCPToolGateway  
> - CodeExecutionGateway / Forge  
> - internal deterministic functions  
> - State Refs  
> - ModelRun state  
> - providerPreviousResponseId  
> - encryptedReasoningRef  
> - cache keys  
> - trace ids

# 5. Решение по LiteLLM и OpenAI Responses

## 5.1. LiteLLM-first

LiteLLM является primary provider/proxy adapter для unified model
access, provider routing, fallback, virtual keys, rate limits,
cost/spend tracking, model registry integration и OpenAI-compatible
calls where sufficient.

## 5.2. OpenAI Native Responses Adapter

OpenAI native adapter оставляется как fallback/capability path, а не как
отдельный основной сервис. Он нужен для capability parity, direct
diagnostics, hosted tools and fallback.

## 5.3. Что запрещено

- Делать OpenAI Responses отдельным главным runtime-сервисом ChatAVG.

- Вшивать OpenAI-specific logic в Core Platform или Workflow Runtime.

- Смешивать inference, knowledge, tools, approvals и business domain в
  одном OpenAI-facing service.

- Считать provider state источником истины для
  Mission/Workflow/Artifact.

# 6. ModelGateway contract

## 6.1. ModelRequest

> type ModelRequest = {  
> modelPolicy: string;  
> input: ModelInputItem\[\];  
> instructions?: string;  
> responseFormat?: JsonSchemaRef;  
> stream?: boolean;  
> toolMode: 'none' \| 'declared' \| 'auto_with_policy' \|
> 'manual_only';  
> tools?: ToolDescriptor\[\];  
> state?: { previousModelRunId?: string; providerPreviousResponseId?:
> string; storeProviderState?: boolean; };  
> controls: { maxCostUsd?: number; timeoutMs?: number; riskClass: 'low'
> \| 'medium' \| 'high' \| 'critical'; };  
> trace: { workflowRunId?: string; agentRunId?: string; missionId?:
> string; artifactId?: string; semanticProtocolVersion?: string; };  
> };

## 6.2. ModelEvent

> type ModelEvent =  
> \| { type: 'model.started'; runId: string }  
> \| { type: 'model.output_delta'; text: string }  
> \| { type: 'model.reasoning_delta'; encrypted?: boolean; ref?: string
> }  
> \| { type: 'tool.requested'; toolCall: ToolCallPlan }  
> \| { type: 'tool.approval_required'; approvalId: string }  
> \| { type: 'tool.completed'; toolCallId: string; outputRef: string }  
> \| { type: 'model.completed'; usage: Usage; output: ModelOutput }  
> \| { type: 'model.failed'; error: NormalizedModelError };

## 6.3. ModelResponse

> type ModelResponse = {  
> modelRunId: string;  
> provider: 'openai' \| 'anthropic' \| 'google' \| 'local' \|
> 'unknown';  
> providerRunId?: string;  
> outputText?: string;  
> outputJson?: unknown;  
> outputItems: ModelOutputItem\[\];  
> toolCalls: ToolCallRecord\[\];  
> usage: { inputTokens?: number; outputTokens?: number;
> reasoningTokens?: number; cachedTokens?: number; costUsd?: number;
> };  
> stateRefs: { previousModelRunId?: string; providerPreviousResponseId?:
> string; encryptedReasoningRef?: string; };  
> traceEvents: TraceEvent\[\];  
> };

# 7. Provider state policy

Provider state дает производительность, cache benefits, reasoning
continuity and tool context. Но provider state не является system of
record.

> Provider state is optimization, not source of truth.

Источник истины в ChatAVG: WorkflowRun, Mission/AgentRun,
ArtifactVersion, ArtifactPatch, ClaimLedger, DomainBoundary,
DecisionRecord, ApprovalRequest, TraceEvent, AuditEvent and CostEvent.

> type ProviderStatePolicy =  
> \| 'chatavg_only'  
> \| 'provider_state_allowed'  
> \| 'provider_state_required_for_capability'  
> \| 'stateless_with_encrypted_reasoning';

# 8. Tool loop policy

OpenAI Responses-style tool loop полезен, но в ChatAVG он должен быть
обернут policy envelope.

| **Tool class**         | **Пример**                                 | **Исполнение**              | **Approval** |
|------------------------|--------------------------------------------|-----------------------------|--------------|
| Read-only low risk     | local search, source lookup                | inside ModelRun or Activity | обычно нет   |
| Read-only medium       | external connector read                    | ToolGateway                 | policy-based |
| Write / side effect    | create file, send message, API write       | ToolGateway/Forge           | да           |
| Code/browser/high risk | code execution, browser, repo modification | Forge/Sandbox               | да           |
| Expensive              | max quality RAG, multi-model analysis      | preflight                   | возможно     |

> Model asks for tool  
> -\> ModelGateway emits tool.requested  
> -\> PolicyEngine evaluates risk  
> -\> ApprovalRequest if required  
> -\> Temporal waits for user signal  
> -\> ToolGateway / Forge executes with idempotencyKey  
> -\> result becomes ToolCallRecord and ArtifactPatch/TraceEvent

# 9. Knowledge and vector layer

OpenAI file_search/vector stores могут быть одним из providers
KnowledgeGateway, но не единственным knowledge layer.

> KnowledgeGateway  
> - Local SQLite FTS5 / embeddings  
> - OpenAI vector stores / file_search  
> - external connectors  
> - uploaded project docs  
> - citation/provenance normalizer

Любой retrieval provider должен возвращать source, chunk, score,
freshness, citation span, source quality, claim linkage и domain
boundary relevance. Цель ChatAVG - связать источники с Claim Ledger и
Domain Boundary.

# 10. Workflow Runtime

Workflow не должен быть цепочкой промптов. Workflow должен быть
управляемой state machine на основе WorkflowContract.

> User intent  
> -\> Workflow Router  
> -\> Workflow Contract  
> -\> WorkflowRun / AgentRun State Machine  
> -\> Visible Progress + Artifact Workspace  
> -\> Semantic / Policy / Cost Guardrails  
> -\> Human Decisions where needed  
> -\> Traceable Artifact / Action / Export
>
> created -\> intake -\> briefing -\> preflight -\> mapping -\>
> working  
> -\> requires_action / waiting  
> -\> artifact_build -\> review -\> forge -\> completed  
> -\> failed / cancelled / expired

Durable execution rules: long-running WF выполняются через Temporal или
совместимый Durable Runtime; model calls являются activities через
ModelGateway; approvals являются state/signals; external side effects
имеют idempotencyKey; replay не должен повторять side effects; ошибка
должна иметь recovery path.

# 11. Data model additions

| **Entity**          | **Назначение**                                                        |
|---------------------|-----------------------------------------------------------------------|
| model_runs          | Нормализованные ModelGateway calls, provider refs, usage, state refs. |
| model_events        | Streaming/event log для model runs.                                   |
| model_tool_calls    | Tool call plans, approvals, outputs, risk classification.             |
| workflow_contracts  | Версионированные workflow definitions.                                |
| workflow_runs       | Пользовательские запуски workflow.                                    |
| workflow_events     | Высокоуровневые события workflow.                                     |
| provider_state_refs | previous response ids, encrypted reasoning refs, cache metadata.      |
| artifact_patches    | Версионированные изменения артефактов.                                |
| decision_records    | Человеческие и системные решения.                                     |
| approval_requests   | Durable approval lifecycle.                                           |

# 12. ADR summary

| **ADR**                                         | **Decision**                                                                                                                                                  |
|-------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ADR-001: Responses-inspired ModelGateway        | ModelGateway adopts Responses-style semantics: input/output items, streaming, tool-call loop, state refs, structured outputs, usage/cost/trace normalization. |
| ADR-002: LiteLLM-first adapter                  | LiteLLM is primary provider/proxy adapter for multi-provider inference, routing, fallback and cost tracking.                                                  |
| ADR-003: OpenAI Native Responses adapter        | Retained for capability parity, diagnostics, hosted tools and fallback; not workflow owner and not central service.                                           |
| ADR-004: ChatAVG owns workflow state            | WorkflowRun, AgentRun, approvals, artifacts, claims, decisions, policies and trace remain owned by ChatAVG.                                                   |
| ADR-005: Separate tool and knowledge boundaries | MCPToolGateway handles tools/connectors; KnowledgeGateway handles retrieval/citations/provenance; ModelGateway coordinates model calls.                       |

# 13. Implementation roadmap

| **Phase**                          | **Scope**                                                                                                                                               |
|------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| Phase 1 - ModelGateway core        | Define ModelRequest/Response/Event; implement LiteLLMAdapter and OpenAIResponsesAdapter; normalized streaming; usage/cost/error mapping; feature flags. |
| Phase 2 - Tool envelope            | ToolDescriptor, ToolCallPlan, tool risk class, policy check, approval_required event, ToolGateway bridge.                                               |
| Phase 3 - Provider state and cache | ModelRun table, providerPreviousResponseId, encryptedReasoningRef, ProviderStatePolicy, cache key strategy.                                             |
| Phase 4 - Knowledge bridge         | KnowledgeGateway provider interface, OpenAI file_search/vector adapter, local FTS/vector adapter, citation/provenance normalizer.                       |
| Phase 5 - Workflow integration     | ModelGateway as Temporal Activity; tool calls as durable events; approvals as workflow signals; outputs into ClaimLedger/ArtifactPatch/DecisionRecord.  |

# 14. Quality gates

| **Gate**         | **Минимальное требование**                                                                 |
|------------------|--------------------------------------------------------------------------------------------|
| Contract gate    | ModelGateway contract covers streaming, structured outputs, tools, state refs, usage/cost. |
| Provider gate    | LiteLLM and OpenAI native adapters pass same contract tests.                               |
| Fallback gate    | Direct OpenAI fallback works without leaking provider logic into Core.                     |
| Tool safety gate | Risky tools cannot execute without policy/approval.                                        |
| Workflow gate    | Model calls are activities; workflows can pause/resume/cancel.                             |
| State gate       | Provider state never becomes the only source of truth.                                     |
| Artifact gate    | Significant model outputs become traceable claims/patches/decisions.                       |
| Cost gate        | Usage and cost are recorded for each ModelRun and WorkflowRun.                             |

# 15. Risks and mitigations

| **Risk**                                           | **Impact**  | **Mitigation**                                                 |
|----------------------------------------------------|-------------|----------------------------------------------------------------|
| LiteLLM не покрывает Responses capability          | Medium/High | Keep OpenAI native adapter as escape hatch.                    |
| OpenAI native path becomes privileged architecture | High        | Enforce ModelGateway contract and adapter boundaries.          |
| Model tool loop bypasses approvals                 | Critical    | Policy envelope before any side-effect tool.                   |
| Provider state hides mission memory                | High        | ChatAVG-native state is system of record.                      |
| Workflow becomes prompt chain                      | High        | WorkflowContract + state machine + Temporal activities.        |
| Knowledge layer becomes provider-specific          | Medium      | KnowledgeGateway normalizes sources, citations and provenance. |
| Costs grow due to agentic loop                     | High        | Preflight estimates, budgets, toolMode limits, max iterations. |

# 16. Open questions

1.  Какие OpenAI Responses capabilities считаются P0 для native adapter?

2.  Нужно ли разрешать provider state для enterprise tenants по
    умолчанию или только opt-in?

3.  Какие tools можно исполнять внутри single ModelRun без durable
    approval state?

4.  Должен ли OpenAI file_search быть P0 provider KnowledgeGateway или
    P1?

5.  Какие model policies нужны в MVP: fast_chat, semantic_standard,
    artifact_builder, code_assistant, reviewer?

6.  Нужно ли поддерживать local llama.cpp в MVP или оставить как
    beta/local-dev path?

# 17. Итоговая формула

> ChatAVG technological concept update =  
> Responses-inspired ModelGateway  
> + LiteLLM-first provider abstraction  
> + OpenAI native capability fallback  
> + ChatAVG-owned durable workflow state  
> + policy-wrapped tool loop  
> + knowledge provenance normalization  
> + artifact/claim/decision traceability

Главное: ChatAVG должен использовать преимущества OpenAI Responses-style
архитектуры, но не передавать provider API право владеть
пользовательской миссией, workflow, артефактом, человеческим решением и
смысловыми границами.
