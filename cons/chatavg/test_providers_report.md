# Provider Audit Report (10.05.2026, 01:25:39)

| Provider | Model | Status | Latency | TTFT | Chunks | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **litellm** | gpt-4o | ❌ FAIL | 1428ms | - | 0 | **Error:** Connection error. |
| **llamacpp** | default | ❌ FAIL | 7ms | - | 0 | **Error:** fetch failed |
| **openai** | gpt-4.1 | ✅ OK | 2296ms | 2285ms | 2 | "test-ok" |
| **openai_responses** | gpt-4.1 | ✅ OK | 2030ms | 1788ms | 2 | "test-ok" |
| **openai_prompt_file_search** | prompt | ✅ OK | 2375ms | 2136ms | 2 | "test-ok" |
| **deepseek** | deepseek-chat | ✅ OK | 1395ms | 1305ms | 3 | "test-ok" |
| **qwen** | qwen-plus | ✅ OK | 1885ms | 1844ms | 2 | "test-ok" |
| **grok** | grok-4-1-fast-non-reasoning | ✅ OK | 2145ms | 2070ms | 2 | "test-ok" |
| **mcp** | openai:gpt-4o-mini | ❌ FAIL | 10630ms | - | 0 | **Error:** MCP Error: SSE error: TypeError: fetch failed: Connect Timeout Error (attempted address: 47.82.162.93:8202, timeout: 10000ms) |
| **test** | - | ❌ FAIL | - | - | 0 | **Error:** Adapter deterministic not found |
