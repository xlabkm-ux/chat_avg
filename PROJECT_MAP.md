# 🗺️ PROJECT MAP — agsys
> Автоматически сгенерировано: `2026-05-07 18:36:41`
> Скрипт: `node dev_studio/refresh.js`

## 📊 Telemetry / Context Health
| Metric | Value | Note |
|---|---|---|
| **Total Files** | `113` | Только JS/TS исходники |
| **Total Lines** | `11841` | Суммарно по проекту |
| **Project Weight** | `~97 333 tokens` | Оценка (4 символа/токен) |
| **Context Pressure** | `76.0%` | Нагрузка на окно 128k (Full Scan) |
| **Map Efficiency** | `~84%` | Экономия контекста через карту |

---

## Высокоуровневая архитектура
> Связи между основными модулями и папками

```mermaid
graph LR
  H0["chatavg/."]
  H1["chatavg/src/core"]
  H2["chatavg/src/modules/auth"]
  H3["chatavg/src/modules/sandbox"]
  H4["chatavg/src/modules/admin"]
  H5["chatavg/src/modules/chat"]
  H6["chatavg/src/modules/providers"]
  H7["chatavg/src/modules/audit"]
  H8["chatavg/src/modules/observability"]
  H9["chatavg/src/modules/policy"]
  H10["chatavg/src/modules/semantic"]
  H11["chatavg/src/modules/execution"]
  H12["chatavg/src/modules/mission"]
  H13["chatavg/src/modules/temporal"]
  H14["chatavg/src/modules/knowledge"]
  H15["chatavg/src/modules/providers/adapters"]
  H16["chatavg/tests/mocks"]
  H17["chatavg/src/modules/sandbox/adapters"]
  H18["chatavg/src/modules/tools"]
  H19["chatavg/tests"]
  H20["chatavg/tests/chaos"]
  H21["chatavg/tests/evals"]
  H22["chatavg/tests/execution"]
  H23["chatavg/tests/knowledge"]
  H24["chatavg/tests/load"]
  H25["chatavg/tests/policy"]
  H26["chatavg/tests/sandbox"]
  H27["chatavg/tests/semantic"]
  H28["chatavg/tests/tools"]
  H0 --> H1
  H0 --> H2
  H0 --> H3
  H4 --> H2
  H4 --> H1
  H4 --> H5
  H4 --> H6
  H4 --> H7
  H4 --> H8
  H7 --> H1
  H7 --> H9
  H2 --> H1
  H2 --> H7
  H5 --> H2
  H5 --> H1
  H5 --> H4
  H5 --> H6
  H5 --> H10
  H5 --> H8
  H11 --> H1
  H11 --> H12
  H11 --> H13
  H14 --> H1
  H12 --> H1
  H9 --> H1
  H15 --> H6
  H6 --> H1
  H6 --> H15
  H6 --> H16
  H6 --> H2
  H6 --> H4
  H17 --> H3
  H3 --> H17
  H3 --> H2
  H3 --> H1
  H3 --> H7
  H13 --> H11
  H13 --> H1
  H18 --> H6
  H19 --> H0
  H19 --> H1
  H19 --> H13
  H20 --> H5
  H19 --> H16
  H19 --> H6
  H19 --> H9
  H19 --> H10
  H21 --> H5
  H21 --> H14
  H21 --> H4
  H21 --> H6
  H22 --> H11
  H22 --> H5
  H22 --> H4
  H23 --> H14
  H23 --> H5
  H23 --> H4
  H24 --> H5
  H24 --> H8
  H16 --> H6
  H25 --> H9
  H25 --> H1
  H25 --> H11
  H26 --> H3
  H19 --> H3
  H19 --> H18
  H19 --> H12
  H27 --> H10
  H28 --> H18
  H28 --> H6
```

## Детальная карта компонентов
> Полный граф зависимостей всех файлов проекта

```mermaid
graph LR
  subgraph N0["chatavg"]
    N1["diagnose_mcp.js"]
    N2["reset_admin.js"]
    N3["server.js"]
    subgraph N4["src/config"]
      N5["env.ts"]
    end
    subgraph N6["src/core"]
      N7["config.js"]
      N8["crypto.js"]
      N9["errors.js"]
      N10["migrate.js"]
      N11["providers.config.js"]
      N12["sqlite.js"]
      N13["utils.js"]
    end
    subgraph N14["src/modules/admin"]
      N15["admin.routes.js"]
      N16["category.repository.js"]
    end
    subgraph N17["src/modules/audit"]
      N18["audit.service.js"]
    end
    subgraph N19["src/modules/auth"]
      N20["auth.middleware.js"]
      N21["auth.routes.js"]
      N22["user.repository.js"]
      N23["users.routes.js"]
    end
    subgraph N24["src/modules/chat"]
      N25["chat.routes.js"]
      N26["chat.service.js"]
      N27["fallbackPolicy.js"]
      N28["policyRouter.js"]
      N29["session.repository.js"]
      N30["sessions.routes.js"]
    end
    subgraph N31["src/modules/execution"]
      N32["artifact.service.js"]
      N33["cost.service.js"]
      N34["execution.routes.js"]
      N35["mission.service.js"]
      N36["role_pass.js"]
      N37["run.repository.js"]
      N38["run.service.js"]
    end
    subgraph N39["src/modules/knowledge"]
      N40["knowledge.cache.js"]
      N41["knowledge.gateway.js"]
      N42["knowledge.router.js"]
      N43["knowledge.types.js"]
    end
    subgraph N44["src/modules/mission"]
      N45["mission.repository.js"]
      N46["mission.routes.js"]
    end
    subgraph N47["src/modules/observability"]
      N48["trace.bus.js"]
    end
    subgraph N49["src/modules/policy"]
      N50["approval.service.js"]
      N51["policy.engine.js"]
      N52["redaction.service.js"]
    end
    subgraph N53["src/modules/providers/adapters"]
      N54["deepseek.js"]
      N55["google.js"]
      N56["grok.js"]
      N57["grok_responses.js"]
      N58["llamacpp.js"]
      N59["mcp.js"]
      N60["openai.js"]
      N61["openai_compat.js"]
      N62["openai_responses.js"]
      N63["openai_responses_compat.js"]
      N64["qwen.js"]
    end
    subgraph N65["src/modules/providers"]
      N66["base.provider.js"]
      N67["provider.factory.js"]
      N68["providerErrors.js"]
      N69["providerEvents.js"]
      N70["providers.routes.js"]
    end
    subgraph N71["src/modules/sandbox/adapters"]
      N72["e2b.adapter.js"]
      N73["local.adapter.js"]
    end
    subgraph N74["src/modules/sandbox"]
      N75["egress.policy.js"]
      N76["sandbox.manager.js"]
      N77["sandbox.routes.js"]
      N78["sandbox.types.js"]
      N79["sandbox.utils.js"]
    end
    subgraph N80["src/modules/semantic"]
      N81["claim.extractor.js"]
      N82["claim.ledger.js"]
      N83["domain.boundary.js"]
      N84["semantic.events.js"]
      N85["semantic.protocol.js"]
    end
    subgraph N86["src/modules/temporal"]
      N87["activities.js"]
      N88["client.js"]
      N89["worker.js"]
      N90["workflows.js"]
    end
    subgraph N91["src/modules/tools"]
      N92["tool.gateway.js"]
      N93["tool.registry.js"]
    end
    subgraph N94["src/providers"]
      N95["base.ts"]
      N96["openai-responses.provider.ts"]
    end
    subgraph N97["src/types"]
      N98["chat.ts"]
    end
    subgraph N99["tests"]
      N100["agent_run.test.js"]
      N101["api.test.js"]
      N102["baseline_security.test.js"]
      N103["contract_canonical_event.test.js"]
      N104["deterministic_provider.test.js"]
      N105["e2e_mvp_gate.test.js"]
      N106["errors.test.js"]
      N107["fast_path_guardrail.test.js"]
      N108["health.test.js"]
      N109["latency_baseline.test.js"]
      N110["provider_events.test.js"]
      N111["security.test.js"]
      N112["security_assertions.test.js"]
      N113["security_red_team.test.js"]
      N114["setup_fixtures.js"]
      N115["signal.js"]
    end
    subgraph N116["tests/chaos"]
      N117["chaos.test.js"]
    end
    subgraph N118["tests/evals"]
      N119["rag.eval.js"]
    end
    subgraph N120["tests/execution"]
      N121["mission_artifacts.test.js"]
    end
    subgraph N122["tests/knowledge"]
      N123["knowledge_gateway.test.js"]
      N124["performance.test.js"]
      N125["rag_integration.test.js"]
    end
    subgraph N126["tests/load"]
      N127["load_harness.test.js"]
    end
    subgraph N128["tests/mocks"]
      N129["deterministic_provider.js"]
    end
    subgraph N130["tests/policy"]
      N131["approval.service.test.js"]
      N132["cost.service.test.js"]
      N133["policy.engine.test.js"]
      N134["redaction.service.test.js"]
    end
    subgraph N135["tests/sandbox"]
      N136["sandbox_manager.test.js"]
    end
    subgraph N137["tests/semantic"]
      N138["claim_extraction.test.js"]
      N139["domain_boundary.test.js"]
      N140["expand_golden_set.js"]
      N141["semantic.eval.js"]
    end
    subgraph N142["tests/tools"]
      N143["tool_gateway.test.js"]
    end
  end
  subgraph N144["mcp_gateway"]
    N145["server.js"]
  end
  N2 --> N12
  N3 --> N7
  N3 --> N9
  N3 --> N12
  N3 --> N20
  N3 --> N77
  N8 --> N7
  N10 --> N12
  N10 --> N7
  N11 --> N7
  N12 --> N7
  N15 --> N20
  N15 --> N9
  N15 --> N13
  N15 --> N22
  N15 --> N16
  N15 --> N29
  N15 --> N67
  N15 --> N18
  N15 --> N8
  N15 --> N7
  N15 --> N11
  N15 --> N12
  N15 --> N48
  N16 --> N12
  N16 --> N8
  N18 --> N12
  N18 --> N52
  N20 --> N7
  N20 --> N22
  N20 --> N9
  N21 --> N20
  N21 --> N22
  N21 --> N9
  N21 --> N18
  N22 --> N12
  N23 --> N22
  N23 --> N20
  N23 --> N9
  N25 --> N20
  N25 --> N9
  N25 --> N26
  N26 --> N16
  N26 --> N28
  N26 --> N27
  N26 --> N67
  N26 --> N11
  N26 --> N7
  N26 --> N13
  N26 --> N85
  N26 --> N48
  N26 --> N69
  N27 --> N68
  N28 --> N67
  N29 --> N12
  N30 --> N20
  N30 --> N9
  N30 --> N29
  N32 --> N36
  N34 --> N38
  N34 --> N7
  N37 --> N12
  N38 --> N37
  N38 --> N45
  N38 --> N88
  N38 --> N7
  N41 --> N42
  N41 --> N43
  N41 --> N40
  N41 --> N7
  N45 --> N12
  N46 --> N45
  N50 --> N12
  N51 --> N52
  N54 --> N61
  N55 --> N66
  N55 --> N69
  N55 --> N68
  N56 --> N61
  N57 --> N63
  N58 --> N66
  N58 --> N69
  N58 --> N68
  N59 --> N66
  N59 --> N69
  N59 --> N68
  N60 --> N61
  N61 --> N66
  N61 --> N69
  N61 --> N68
  N62 --> N63
  N63 --> N66
  N63 --> N69
  N63 --> N68
  N64 --> N61
  N67 --> N11
  N67 --> N58
  N67 --> N60
  N67 --> N62
  N67 --> N54
  N67 --> N55
  N67 --> N64
  N67 --> N56
  N67 --> N57
  N67 --> N59
  N67 --> N129
  N70 --> N20
  N70 --> N67
  N70 --> N16
  N70 --> N11
  N72 --> N78
  N73 --> N78
  N76 --> N75
  N76 --> N72
  N76 --> N73
  N76 --> N79
  N77 --> N20
  N77 --> N9
  N77 --> N7
  N77 --> N76
  N77 --> N18
  N83 --> N81
  N83 --> N84
  N85 --> N81
  N85 --> N83
  N85 --> N82
  N85 --> N84
  N87 --> N37
  N88 --> N7
  N89 --> N7
  N89 --> N87
  N92 --> N68
  N92 --> N93
  N100 --> N3
  N100 --> N12
  N100 --> N88
  N101 --> N3
  N101 --> N12
  N102 --> N3
  N102 --> N12
  N117 --> N26
  N117 --> N27
  N103 --> N129
  N103 --> N69
  N104 --> N129
  N105 --> N3
  N105 --> N12
  N105 --> N50
  N105 --> N81
  N105 --> N83
  N106 --> N9
  N119 --> N26
  N119 --> N41
  N119 --> N16
  N119 --> N67
  N121 --> N36
  N121 --> N32
  N121 --> N35
  N121 --> N26
  N121 --> N16
  N108 --> N3
  N108 --> N12
  N123 --> N41
  N123 --> N42
  N123 --> N43
  N124 --> N41
  N124 --> N40
  N125 --> N26
  N125 --> N41
  N125 --> N16
  N109 --> N129
  N127 --> N26
  N127 --> N27
  N127 --> N48
  N129 --> N66
  N129 --> N69
  N131 --> N50
  N131 --> N12
  N132 --> N33
  N133 --> N51
  N134 --> N52
  N110 --> N69
  N136 --> N76
  N136 --> N78
  N136 --> N75
  N136 --> N79
  N111 --> N13
  N111 --> N3
  N111 --> N12
  N112 --> N13
  N113 --> N75
  N113 --> N92
  N113 --> N93
  N113 --> N45
  N113 --> N12
  N138 --> N81
  N139 --> N83
  N139 --> N81
  N139 --> N85
  N141 --> N85
  N141 --> N81
  N114 --> N12
  N115 --> N88
  N143 --> N93
  N143 --> N92
  N143 --> N68
```

## Компонент: `chatavg`

| Файл | Строк | Размер | Описание |
|---|---|---|---|
| `diagnose_mcp.js` | 38 | 1.1 KB | — |
| `reset_admin.js` | 22 | 0.6 KB | Admin Reset Utility (SQLite) |
| `server.js` | 163 | 5.7 KB | Chat AVG Gateway — Entry Point |
| `src/config/env.ts` | 47 | 1.7 KB | — |
| `src/core/config.js` | 159 | 5.5 KB | — |
| `src/core/crypto.js` | 78 | 1.9 KB | AES-256-GCM encryption/decryption service. |
| `src/core/errors.js` | 87 | 2.2 KB | Centralized Error Handling |
| `src/core/migrate.js` | 108 | 4.1 KB | Chat AVG — JSON to SQLite Migration Utility |
| `src/core/providers.config.js` | 129 | 4.7 KB | — |
| `src/core/sqlite.js` | 273 | 7.8 KB | — |
| `src/core/utils.js` | 91 | 2.5 KB | Helper Utilities |
| `src/modules/admin/admin.routes.js` | 386 | 14.2 KB | — |
| `src/modules/admin/category.repository.js` | 74 | 3.0 KB | Класс: CategoryRepository |
| `src/modules/audit/audit.service.js` | 70 | 2.2 KB | Log an action to the audit log. |
| `src/modules/auth/auth.middleware.js` | 78 | 2.4 KB | Authentication — JWT middleware & helpers |
| `src/modules/auth/auth.routes.js` | 67 | 2.3 KB | Routes: Authentication |
| `src/modules/auth/user.repository.js` | 70 | 2.5 KB | Класс: UserRepository |
| `src/modules/auth/users.routes.js` | 49 | 1.4 KB | Routes: User Profile |
| `src/modules/chat/chat.routes.js` | 62 | 2.4 KB | Routes: Chat Completions |
| `src/modules/chat/chat.service.js` | 595 | 23.5 KB | Класс: ChatService |
| `src/modules/chat/fallbackPolicy.js` | 49 | 1.6 KB | Класс: FallbackPolicy |
| `src/modules/chat/policyRouter.js` | 39 | 1.1 KB | Класс: PolicyRouter |
| `src/modules/chat/session.repository.js` | 59 | 1.7 KB | Класс: SessionRepository |
| `src/modules/chat/sessions.routes.js` | 105 | 3.3 KB | Routes: Sessions CRUD |
| `src/modules/execution/artifact.service.js` | 85 | 1.9 KB | ArtifactService — manages versioned artifacts and patches. |
| `src/modules/execution/cost.service.js` | 36 | 1.0 KB | Calculate cost for a model call. |
| `src/modules/execution/execution.routes.js` | 103 | 2.6 KB | POST /api/runs |
| `src/modules/execution/mission.service.js` | 64 | 1.4 KB | MissionService — tracks goals, distinctions, and conflicts. |
| `src/modules/execution/role_pass.js` | 82 | 1.7 KB | RolePass — capability-based authorization system. |
| `src/modules/execution/run.repository.js` | 75 | 2.1 KB | Класс: AgentRunRepository |
| `src/modules/execution/run.service.js` | 128 | 3.6 KB | Класс: AgentRunService |
| `src/modules/knowledge/knowledge.cache.js` | 68 | 1.3 KB | KnowledgeCache — simple in-memory cache for RetrievalResults. |
| `src/modules/knowledge/knowledge.gateway.js` | 161 | 4.9 KB | Main retrieval entry point. |
| `src/modules/knowledge/knowledge.router.js` | 74 | 2.1 KB | KnowledgeRouter |
| `src/modules/knowledge/knowledge.types.js` | 55 | 1.6 KB | Canonical types for the Knowledge Module. |
| `src/modules/mission/mission.repository.js` | 92 | 2.9 KB | Класс: MissionRepository |
| `src/modules/mission/mission.routes.js` | 85 | 2.1 KB | POST /api/missions |
| `src/modules/observability/trace.bus.js` | 47 | 1.0 KB | Emit a trace event. |
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
| `src/modules/sandbox/adapters/e2b.adapter.js` | 130 | 4.0 KB | E2BAdapter — primary sandbox adapter backed by E2B (e2b.dev). |
| `src/modules/sandbox/adapters/local.adapter.js` | 73 | 2.1 KB | LocalAdapter — dev/fallback sandbox adapter using Node.js child_process. |
| `src/modules/sandbox/egress.policy.js` | 112 | 4.0 KB | EgressPolicy — default-deny outbound traffic control for sandboxes. |
| `src/modules/sandbox/sandbox.manager.js` | 335 | 11.6 KB | SandboxManager — orchestrates sandbox lifecycle for high-risk agent actions. |
| `src/modules/sandbox/sandbox.routes.js` | 151 | 4.4 KB | Routes: Sandbox / Forge API |
| `src/modules/sandbox/sandbox.types.js` | 126 | 3.3 KB | Canonical types for the Sandbox / Forge module. |
| `src/modules/sandbox/sandbox.utils.js` | 66 | 2.0 KB | Scans artifacts for suspicious content and applies size limits. |
| `src/modules/semantic/claim.extractor.js` | 155 | 5.3 KB | ClaimExtractor — pipeline извлечения утверждений из текста. |
| `src/modules/semantic/claim.ledger.js` | 118 | 2.6 KB | ClaimLedger — реестр всех извлечённых claims per session. |
| `src/modules/semantic/domain.boundary.js` | 209 | 9.5 KB | DomainBoundary — детектор границ области определения и strength downgrade engine. |
| `src/modules/semantic/semantic.events.js` | 53 | 2.1 KB | Semantic Events — канонические типы событий семантического слоя. |
| `src/modules/semantic/semantic.protocol.js` | 116 | 3.6 KB | SemanticProtocol v0 — оркестратор смыслового слоя. |
| `src/modules/temporal/activities.js` | 24 | 0.7 KB | — |
| `src/modules/temporal/client.js` | 41 | 1.0 KB | — |
| `src/modules/temporal/worker.js` | 23 | 0.6 KB | — |
| `src/modules/temporal/workflows.js` | 43 | 1.3 KB | — |
| `src/modules/tools/tool.gateway.js` | 121 | 3.6 KB | ToolCall states for the state machine. |
| `src/modules/tools/tool.registry.js` | 106 | 2.4 KB | Risk classes for Tool executions. |
| `src/providers/base.ts` | 95 | 2.3 KB | — |
| `src/providers/openai-responses.provider.ts` | 128 | 4.1 KB | — |
| `src/types/chat.ts` | 37 | 0.7 KB | — |
| `tests/agent_run.test.js` | 140 | 4.1 KB | — |
| `tests/api.test.js` | 169 | 5.2 KB | — |
| `tests/baseline_security.test.js` | 52 | 2.0 KB | — |
| `tests/chaos/chaos.test.js` | 58 | 2.1 KB | — |
| `tests/contract_canonical_event.test.js` | 164 | 5.9 KB | Contract tests for AsyncIterable semantics of provider adapters. |
| `tests/deterministic_provider.test.js` | 89 | 3.0 KB | — |
| `tests/e2e_mvp_gate.test.js` | 136 | 4.3 KB | — |
| `tests/errors.test.js` | 53 | 1.8 KB | — |
| `tests/evals/rag.eval.js` | 139 | 4.7 KB | Класс: RAGEvalRunner |
| `tests/execution/mission_artifacts.test.js` | 75 | 3.0 KB | — |
| `tests/fast_path_guardrail.test.js` | 131 | 4.7 KB | Fast Path Guardrail Tests |
| `tests/health.test.js` | 50 | 1.4 KB | — |
| `tests/knowledge/knowledge_gateway.test.js` | 72 | 2.7 KB | — |
| `tests/knowledge/performance.test.js` | 53 | 2.1 KB | — |
| `tests/knowledge/rag_integration.test.js` | 70 | 2.3 KB | — |
| `tests/latency_baseline.test.js` | 138 | 5.0 KB | Latency Measurement Utility |
| `tests/load/load_harness.test.js` | 54 | 1.7 KB | — |
| `tests/mocks/deterministic_provider.js` | 79 | 2.7 KB | DeterministicProvider — синтетический провайдер для тестов. |
| `tests/policy/approval.service.test.js` | 45 | 1.9 KB | — |
| `tests/policy/cost.service.test.js` | 16 | 0.5 KB | — |
| `tests/policy/policy.engine.test.js` | 33 | 1.5 KB | — |
| `tests/policy/redaction.service.test.js` | 29 | 1.0 KB | — |
| `tests/provider_events.test.js` | 60 | 2.0 KB | — |
| `tests/sandbox/sandbox_manager.test.js` | 384 | 13.5 KB | SandboxManager Integration Tests |
| `tests/security.test.js` | 43 | 1.7 KB | — |
| `tests/security_assertions.test.js` | 187 | 6.0 KB | CORS, SSRF, JSON Limit, and Prompt Sanitization assertion tests. |
| `tests/security_red_team.test.js` | 105 | 4.1 KB | Red-Team Security Suite for Sprint 17 Release Candidate. |
| `tests/semantic/claim_extraction.test.js` | 113 | 5.2 KB | Tests: ClaimExtractor — извлечение утверждений из текста. |
| `tests/semantic/domain_boundary.test.js` | 174 | 8.2 KB | Tests: DomainBoundary — проверка границ и strength downgrade. |
| `tests/semantic/expand_golden_set.js` | 355 | 12.1 KB | — |
| `tests/semantic/semantic.eval.js` | 163 | 6.2 KB | Semantic Eval Runner — запуск golden set тестов. |
| `tests/setup_fixtures.js` | 101 | 3.2 KB | — |
| `tests/signal.js` | 18 | 0.5 KB | — |
| `tests/tools/tool_gateway.test.js` | 101 | 3.5 KB | — |

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
  - `USE /api/sandboxes`
  - `GET /health`
  - `GET /ready`
  - `USE /api`
  - `GET *`
- **Зависимости**:
  - `./src/core/config` → PORT, WEBUI_DIR, allowedOrigins, isDev
  - `./src/core/errors` → errorHandler, AppError
  - `./src/core/sqlite` → (side-effect)
  - `./src/modules/auth/auth.middleware` → authenticate
  - `./src/modules/sandbox/sandbox.routes` → router: sandboxRouter
  - `./src/core/sqlite` → (side-effect)

### `src/config/env.ts`
- **Экспорт**: `env`, `config`
- **Зависимости**:

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
  - `GET /dashboard/mvp`
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
  - `../../core/sqlite` → db
  - `../observability/trace.bus` → traceBus
  - `../../core/config` → FEATURE_FLAGS

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
  - `../../core/config` → ALLOWED_EXTRA_PARAMS, PROVIDER_TIMEOUT, SEMANTIC_LAYER_ENABLED, AGENT_RUNS_ENABLED, KNOWLEDGE_GATEWAY_ENABLED
  - `../../core/utils` → validateProviderUrl, sanitizePromptText
  - `../semantic/semantic.protocol` → SemanticProtocol
  - `../observability/trace.bus` → traceBus
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

### `src/modules/execution/artifact.service.js`
- **Класс**: `ArtifactService`
- **Экспорт**: `new ArtifactService()`
- **Зависимости**:
  - `./role_pass` → roleRegistry

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

### `src/modules/execution/mission.service.js`
- **Класс**: `MissionService`
- **Экспорт**: `new MissionService()`
- **Зависимости**:

### `src/modules/execution/role_pass.js`
- **Класс**: `RolePass`
- **Класс**: `RoleRegistry`
- **Экспорт**: `new RoleRegistry()`

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

### `src/modules/knowledge/knowledge.cache.js`
- **Класс**: `KnowledgeCache`
- **Экспорт**: `new KnowledgeCache()`

### `src/modules/knowledge/knowledge.gateway.js`
- **Класс**: `KnowledgeGateway`
- **Экспорт**: `new KnowledgeGateway()`
- **Зависимости**:
  - `./knowledge.router` → knowledgeRouter
  - `./knowledge.types` → RetrievalResult
  - `./knowledge.cache` → knowledgeCache
  - `../../core/config` → KNOWLEDGE_GATEWAY_ENABLED

### `src/modules/knowledge/knowledge.router.js`
- **Класс**: `KnowledgeRouter`
- **Экспорт**: `new KnowledgeRouter()`

### `src/modules/knowledge/knowledge.types.js`
- **Класс**: `RetrievalChunk`
- **Класс**: `RetrievalResult`
- **Экспорт**: `{`

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

### `src/modules/observability/trace.bus.js`
- **Класс**: `TraceBus` extends `EventEmitter`
- **Экспорт**: `new TraceBus()`
- **Зависимости**:

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

### `src/modules/sandbox/adapters/e2b.adapter.js`
- **Класс**: `E2BAdapter`
- **Экспорт**: `{ E2BAdapter }`, `E2BAdapter`
- **Зависимости**:
  - `../sandbox.types` → SandboxState

### `src/modules/sandbox/adapters/local.adapter.js`
- **Класс**: `LocalAdapter`
- **Экспорт**: `{ LocalAdapter }`, `LocalAdapter`
- **Зависимости**:
  - `../sandbox.types` → SandboxState

### `src/modules/sandbox/egress.policy.js`
- **Класс**: `EgressPolicy`
- **Экспорт**: `{ EgressPolicy, PROVIDER_ENDPOINT_PATTERNS }`, `EgressPolicy`, `PROVIDER_ENDPOINT_PATTERNS`
- **Зависимости**:

### `src/modules/sandbox/sandbox.manager.js`
- **Класс**: `SandboxManager`
- **Экспорт**: `{ SandboxManager }`, `SandboxManager`
- **Зависимости**:
  - `./egress.policy` → EgressPolicy
  - `./adapters/e2b.adapter` → E2BAdapter
  - `./adapters/local.adapter` → LocalAdapter
  - `./sandbox.utils` → scanArtifacts, estimateCost, MAX_OUTPUT_BYTES

### `src/modules/sandbox/sandbox.routes.js`
- **Экспорт**: `{ router, sandboxManager }`, `router`, `sandboxManager`
- **Роуты**:
  - `POST /`
  - `GET /:sandboxId`
  - `POST /:sandboxId/run`
  - `POST /:sandboxId/snapshot`
  - `POST /:sandboxId/freeze`
  - `POST /:sandboxId/terminate`
  - `POST /:sandboxId/quarantine`
  - `DELETE /:sandboxId`
- **Зависимости**:
  - `../auth/auth.middleware` → authenticate
  - `../../core/errors` → asyncHandler
  - `../../core/config` → SANDBOX_FORGE_ENABLED
  - `./sandbox.manager` → SandboxManager
  - `../audit/audit.service` → AuditService

### `src/modules/sandbox/sandbox.types.js`
- **Экспорт**: `{`

### `src/modules/sandbox/sandbox.utils.js`
- **Экспорт**: `{`
- **Зависимости**:

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

### `src/modules/tools/tool.gateway.js`
- **Класс**: `ToolCall`
- **Класс**: `ToolGateway`
- **Экспорт**: `{`
- **Зависимости**:
  - `../providers/providerErrors` → ProviderError
  - `./tool.registry` → isSideEffectRiskClass

### `src/modules/tools/tool.registry.js`
- **Класс**: `ToolDefinitionVersion`
- **Класс**: `ToolRegistry`
- **Экспорт**: `{`
- **Зависимости**:

### `src/providers/openai-responses.provider.ts`
- **Экспорт**: `OpenAIResponsesProvider`
- **Зависимости**:
  - `./base.js` → BaseProvider, ProviderConfig, ChatEvent
  - `../types/chat.js` → ChatMessage

### `tests/evals/rag.eval.js`
- **Класс**: `RAGEvalRunner`
- **Экспорт**: `{ RAGEvalRunner }`, `RAGEvalRunner`
- **Зависимости**:
  - `../../src/modules/chat/chat.service` → chatService
  - `../../src/modules/knowledge/knowledge.gateway` → knowledgeGateway
  - `../../src/modules/admin/category.repository` → categoryRepository
  - `../../src/modules/providers/provider.factory` → adapters
  - `./rag_dataset.json` → ragDataset

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
| `CHATAVG_SECRET` | chatavg/agent_run.test.js, chatavg/api.test.js, chatavg/contract_canonical_event.test.js, chatavg/deterministic_provider.test.js, chatavg/e2e_mvp_gate.test.js, chatavg/errors.test.js, chatavg/fast_path_guardrail.test.js, chatavg/health.test.js, chatavg/latency_baseline.test.js, chatavg/provider_events.test.js, chatavg/security_assertions.test.js, chatavg/setup_fixtures.js |
| `DEBUG_PROVIDER_PAYLOADS` | chatavg/grok.js, chatavg/openai_compat.js |
| `E2B_API_KEY` | chatavg/e2b.adapter.js, chatavg/sandbox.manager.js |
| `E2B_TEMPLATE` | chatavg/sandbox.manager.js |
| `NODE_ENV` | chatavg/server.js, chatavg/errors.js, chatavg/grok.js, chatavg/openai_compat.js, chatavg/provider.factory.js, chatavg/agent_run.test.js, chatavg/api.test.js, chatavg/contract_canonical_event.test.js, chatavg/deterministic_provider.test.js, chatavg/e2e_mvp_gate.test.js, chatavg/errors.test.js, chatavg/fast_path_guardrail.test.js, chatavg/health.test.js, chatavg/latency_baseline.test.js, chatavg/provider_events.test.js, chatavg/security_assertions.test.js, chatavg/setup_fixtures.js |
| `PORT` | mcp_gateway/server.js |
| `SEMANTIC_LAYER_ENABLED` | chatavg/mission_artifacts.test.js |

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
| `USE` | `/api/sandboxes` | `chatavg/server.js` |
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
| `GET` | `/dashboard/mvp` | `chatavg/src/modules/admin/admin.routes.js` |
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
| `POST` | `/` | `chatavg/src/modules/sandbox/sandbox.routes.js` |
| `GET` | `/:sandboxId` | `chatavg/src/modules/sandbox/sandbox.routes.js` |
| `POST` | `/:sandboxId/run` | `chatavg/src/modules/sandbox/sandbox.routes.js` |
| `POST` | `/:sandboxId/snapshot` | `chatavg/src/modules/sandbox/sandbox.routes.js` |
| `POST` | `/:sandboxId/freeze` | `chatavg/src/modules/sandbox/sandbox.routes.js` |
| `POST` | `/:sandboxId/terminate` | `chatavg/src/modules/sandbox/sandbox.routes.js` |
| `POST` | `/:sandboxId/quarantine` | `chatavg/src/modules/sandbox/sandbox.routes.js` |
| `DELETE` | `/:sandboxId` | `chatavg/src/modules/sandbox/sandbox.routes.js` |
| `GET` | `/mcp` | `mcp_gateway/server.js` |
| `POST` | `/mcp/message/:sessionId` | `mcp_gateway/server.js` |
| `GET` | `/health` | `mcp_gateway/server.js` |

## Граф зависимостей (внутренние модули)

### chatavg
```
reset_admin.js → sqlite
server.js → config, errors, sqlite, auth.middleware, sandbox.routes, sqlite
crypto.js → config
migrate.js → sqlite, config
providers.config.js → config
sqlite.js → config, config
admin.routes.js → auth.middleware, errors, utils, user.repository, category.repository, session.repository, provider.factory, audit.service, crypto, config, providers.config, sqlite, trace.bus, config
category.repository.js → sqlite, crypto
audit.service.js → sqlite, redaction.service
auth.middleware.js → config, user.repository, errors
auth.routes.js → auth.middleware, user.repository, errors, audit.service
user.repository.js → sqlite
users.routes.js → user.repository, auth.middleware, errors
chat.routes.js → auth.middleware, errors, chat.service
chat.service.js → category.repository, policyRouter, fallbackPolicy, provider.factory, providers.config, config, utils, semantic.protocol, trace.bus, providerEvents
fallbackPolicy.js → providerErrors
policyRouter.js → provider.factory
session.repository.js → sqlite
sessions.routes.js → auth.middleware, errors, session.repository
artifact.service.js → role_pass
execution.routes.js → run.service, config
run.repository.js → sqlite
run.service.js → run.repository, mission.repository, client, config
knowledge.gateway.js → knowledge.router, knowledge.types, knowledge.cache, config
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
e2b.adapter.js → sandbox.types
local.adapter.js → sandbox.types
sandbox.manager.js → egress.policy, e2b.adapter, local.adapter, sandbox.utils
sandbox.routes.js → auth.middleware, errors, config, sandbox.manager, audit.service
domain.boundary.js → claim.extractor, semantic.events
semantic.protocol.js → claim.extractor, domain.boundary, claim.ledger, semantic.events
activities.js → run.repository
client.js → config
worker.js → config, activities
tool.gateway.js → providerErrors, tool.registry
base.ts → chat
openai-responses.provider.ts → base, chat
agent_run.test.js → server, sqlite, client
api.test.js → server, sqlite
baseline_security.test.js → server, sqlite
chaos.test.js → chat.service, fallbackPolicy
contract_canonical_event.test.js → deterministic_provider, providerEvents
deterministic_provider.test.js → deterministic_provider
e2e_mvp_gate.test.js → server, sqlite, approval.service, claim.extractor, domain.boundary
errors.test.js → errors
rag.eval.js → chat.service, knowledge.gateway, category.repository, provider.factory, rag_dataset.json
mission_artifacts.test.js → role_pass, artifact.service, mission.service, chat.service, category.repository
health.test.js → server, sqlite
knowledge_gateway.test.js → knowledge.gateway, knowledge.router, knowledge.types
performance.test.js → knowledge.gateway, knowledge.cache
rag_integration.test.js → chat.service, knowledge.gateway, category.repository
latency_baseline.test.js → deterministic_provider
load_harness.test.js → chat.service, fallbackPolicy, trace.bus
deterministic_provider.js → base.provider, providerEvents
approval.service.test.js → approval.service, sqlite
cost.service.test.js → cost.service
policy.engine.test.js → policy.engine
redaction.service.test.js → redaction.service
provider_events.test.js → providerEvents
sandbox_manager.test.js → sandbox.manager, sandbox.types, egress.policy, sandbox.utils
security.test.js → utils, server, sqlite
security_assertions.test.js → utils
security_red_team.test.js → egress.policy, tool.gateway, tool.registry, mission.repository, sqlite
claim_extraction.test.js → claim.extractor
domain_boundary.test.js → domain.boundary, claim.extractor, semantic.protocol
semantic.eval.js → semantic.protocol, claim.extractor, golden_set.json
setup_fixtures.js → sqlite
signal.js → client
tool_gateway.test.js → tool.registry, tool.gateway, providerErrors
```

### mcp_gateway
```
```
