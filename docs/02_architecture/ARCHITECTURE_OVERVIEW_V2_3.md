# Архитектурное видение (Architecture Overview v2.3)

## 1. Введение и формула платформы
ChatAVG v2.3 — это не просто обертка над LLM (чат), а **Meaning-first Agent Execution Platform** (Платформа выполнения смысловых агентных миссий). 

**Архитектурная формула v2.0:**
`ChatAVG = ER Meaning Layer + Mission Room + Adequacy Engine + Durable Agent Runtime + Gateway Plane + Artifact Workspace + Control Plane + Forge`

## 2. Ключевые компоненты (Core Platform)

*   **Durable Agent Runtime (Temporal):** Ядро оркестрации. Агенты работают как длительные процессы (workflows), которые могут засыпать (ожидая ответа человека), безопасно падать и перезапускаться без потери контекста.
*   **Model Gateway (LiteLLM):** Единая точка входа для всех запросов к LLM (OpenAI, Anthropic и др.). Отвечает за маршрутизацию, fallbacks, учет стоимости и лимиты.
*   **MCP Tool Gateway:** Шлюз для инструментов. Протокол MCP используется строго для безопасного подключения внешних инструментов (tools/connectors), а не для генерации текста.
*   **Knowledge Gateway:** Управление RAG (Поиск и генерация). Имеет разные режимы (от `no_retrieval` до `max_quality`) для баланса между скоростью и точностью.
*   **Sandbox Manager (Forge):** Интеграция с защищенными песочницами (E2B/Daytona) для безопасного выполнения сложного кода и файловых операций.
*   **Adequacy Engine (Смысловой слой):** Уникальный модуль, реализующий концепцию эзоагностики реальности (ЭР). Отвечает за извлечение утверждений (Claims), проверку границ применимости (Domain Boundaries) и недопущение "смысловых галлюцинаций".
*   **Policy / Cost Control Plane:** Слой аудита и политик безопасности. Запросы на опасные действия автоматически перехватываются для получения одобрения (Approval) пользователя.

## 3. Режимы работы (Runtime Modes)
Архитектура жестко разделяет потоки выполнения:
1.  **Fast Path (Быстрый путь):** Для простых диалогов. Без песочниц, без тяжелого RAG. Максимальная скорость и минимальная цена.
2.  **Studio / Lab:** Глубокая проработка задач со смысловым слоем (Adequacy Engine).
3.  **Forge:** Режим разработки, когда агенту выделяется изолированный контейнер (Sandbox) для написания и выполнения кода.

## 4. Главные анти-паттерны (Anti-goals)
*   **НЕТ** самописному workflow engine на SQLite для сложных процессов.
*   **НЕТ** песочницам (sandbox) по умолчанию на каждый чат.
*   **НЕТ** скрытому авторитету ИИ (система не делает сильных выводов без доказательств).

---

## 5. C4 Container Diagram

```mermaid
C4Container
    title ChatAVG v2.3 Container Architecture

    Person(user, "User", "End user interacting with ChatAVG platform")
    
    System_Boundary(chatavg, "ChatAVG Platform") {
        Container(webui, "Web UI", "Vanilla JS + HTML/CSS", "Frontend interface for chat, approval flows, and artifact workspace")
        
        Container(api, "API Gateway", "Node.js + Express", "REST API server handling HTTP requests, session management, and routing")
        
        Container(temporal_worker, "Temporal Worker", "Node.js + Temporal SDK", "Durable workflow execution for AgentRun orchestration")
        
        ContainerDb(sqlite, "SQLite Database", "SQLite", "Session storage, mission state, audit logs, tool registry")
        
        System_Boundary(gateways, "Gateway Layer") {
            Container(model_gw, "Model Gateway", "LiteLLM Proxy", "Multi-provider LLM routing, fallbacks, cost tracking")
            Container(tool_gw, "Tool Gateway", "Node.js + MCP Protocol", "Tool discovery, schema validation, risk classification")
            Container(knowledge_gw, "Knowledge Gateway", "Node.js", "RAG orchestration, retrieval modes, semantic search")
        }
        
        System_Boundary(forge, "Forge (Sandbox)") {
            Container(sandbox_mgr, "Sandbox Manager", "Node.js", "Sandbox lifecycle: provision, run, snapshot, terminate")
            Container(e2b, "E2B Sandbox", "Cloud VM", "Isolated code execution environment")
        }
        
        Container(policy_engine, "Policy Engine", "Node.js", "Approval workflows, risk scoring, cost controls")
        Container(adequacy_engine, "Adequacy Engine", "Node.js", "ER Meaning Layer, claim extraction, domain boundary checks")
    }
    
    System_Ext(openai, "OpenAI API", "LLM provider")
    System_Ext(deepseek, "DeepSeek API", "LLM provider")
    System_Ext(anthropic, "Anthropic API", "LLM provider")
    System_Ext(litellm_ext, "LiteLLM Cloud", "Model routing service")
    System_Ext(e2b_cloud, "E2B Cloud", "Sandbox infrastructure")
    System_Ext(external_tools, "External Tools", "Slack, GitHub, Google Drive, etc.")
    
    Rel(user, webui, "Uses", "HTTPS")
    Rel(webui, api, "HTTP/REST", "JSON")
    Rel(api, temporal_worker, "Starts workflows", "gRPC")
    Rel(api, sqlite, "Reads/writes", "SQL")
    Rel(api, model_gw, "Proxy LLM requests", "HTTP")
    Rel(api, tool_gw, "Invoke tools", "JSON-RPC/SSE")
    Rel(api, knowledge_gw, "Execute RAG queries", "HTTP")
    Rel(api, policy_engine, "Check approval policies", "sync")
    Rel(api, adequacy_engine, "Validate semantic claims", "sync")
    
    Rel(temporal_worker, sqlite, "Persists workflow state", "SQL")
    Rel(temporal_worker, sandbox_mgr, "Assign sandboxes", "sync")
    
    Rel(model_gw, litellm_ext, "Routes to", "HTTP")
    Rel(litellm_ext, openai, "Calls", "API")
    Rel(litellm_ext, deepseek, "Calls", "API")
    Rel(litellm_ext, anthropic, "Calls", "API")
    
    Rel(tool_gw, external_tools, "Executes via MCP", "JSON-RPC")
    Rel(tool_gw, e2b, "Runs code in sandbox", "API")
    
    Rel(sandbox_mgr, e2b_cloud, "Provisions sandboxes", "API")
    Rel(sandbox_mgr, e2b, "Manages lifecycle", "API")
    
    Rel(knowledge_gw, sqlite, "Queries document store", "SQL")
    
    UpdateRelStyle(user, webui, $offsetY="-60")
    UpdateRelStyle(webui, api, $offsetX="-40")
    UpdateRelStyle(api, temporal_worker, $offsetX="40")
    UpdateRelStyle(model_gw, litellm_ext, $offsetY="-30")
```

### Component Descriptions

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| **Web UI** | Vanilla JS | User interface for chat, approval dialogs, artifact browsing |
| **API Gateway** | Node.js + Express | Request routing, authentication, session management |
| **Temporal Worker** | Node.js + Temporal SDK | Durable workflow execution, crash recovery, approval waits |
| **SQLite** | SQLite | Persistent storage for sessions, missions, audit logs |
| **Model Gateway** | LiteLLM Proxy | Multi-provider LLM routing, fallbacks, cost tracking |
| **Tool Gateway** | Node.js + MCP | Tool discovery, schema validation, risk classification |
| **Knowledge Gateway** | Node.js | RAG orchestration with configurable retrieval modes |
| **Sandbox Manager** | Node.js | E2B sandbox lifecycle management |
| **E2B Sandbox** | Cloud VM | Isolated code execution environment |
| **Policy Engine** | Node.js | Approval workflows, risk scoring, cost controls |
| **Adequacy Engine** | Node.js | ER meaning layer, claim extraction, domain validation |

### Communication Patterns

1. **User → Web UI → API**: Standard REST over HTTPS
2. **API → Temporal Worker**: gRPC calls to start/query workflows
3. **API → Gateways**: HTTP for Knowledge Gateway, JSON-RPC/SSE for Tool Gateway
4. **Temporal → SQLite**: Direct SQL writes for workflow state persistence
5. **Model Gateway → LiteLLM**: OpenAI-compatible API calls
6. **Tool Gateway → External Tools**: MCP protocol over SSE/HTTP or STDIO
7. **Sandbox Manager → E2B**: REST API for sandbox provisioning and management
