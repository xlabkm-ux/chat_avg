# ENV and Secrets Configuration Contract

**Status:** Active  
**Owner:** SRE + Security  

## 1. Principles
- **No hardcoded secrets:** Code must never contain API keys, passwords, or encryption keys.
- **Centralized validation:** All environment variables are loaded and validated strictly via `Zod` in `src/core/config.js`. Provider configurations import these verified variables.
- **Fail-fast:** The application must crash immediately on startup if any required environment variable is missing or malformed, avoiding unpredictable failures later.

## 2. Environment Variables

### Application Core
- `CHATAVG_PORT`: Application port (default: 8200)
- `CHATAVG_SECRET`: Secure encryption key for JWT and data (min 32 chars) - **REQUIRED**
- `CHATAVG_TOKEN_EXPIRY`: JWT token expiration time (default: 7d)
- `CHATAVG_ADMIN_PASSWORD`: Optional initial administrator password.
- `CHATAVG_ALLOWED_ORIGINS`: Comma-separated CORS origins.
- `CHATAVG_PROVIDER_TIMEOUT`: HTTP request timeout for model providers (ms).
- `CHATAVG_TEST_TIMEOUT`: HTTP request timeout during testing.
- `NODE_ENV`: Runtime environment (`development`, `production`, `test`).

### Model Providers
- `LLAMACPP_URL` / `LLAMACPP_API_KEY`: Configuration for local Llama.cpp instances.
- `OPENAI_URL` / `OPENAI_API_KEY`: Configuration for OpenAI.
- `DEEPSEEK_URL` / `DEEPSEEK_API_KEY`: Configuration for DeepSeek.
- `GEMINI_API_KEY`: Configuration for Google Gemini.
- `QWEN_URL` / `QWEN_API_KEY`: Configuration for Qwen.
- `GROK_URL` / `GROK_API_KEY`: Configuration for xAI Grok.
- `MCP_GATEWAY_URL` / `MCP_API_KEY`: Configuration for local MCP Gateway.

## 3. Secret Scopes
- **Local:** Managed via local `.env` file (not committed to source control).
- **Staging/Production:** Injected via secure CI/CD pipelines or secret managers (e.g., Vault, AWS Secrets Manager, GitHub Secrets).

## 4. Prompts and Secrets
- Under no circumstances should external API keys or DB credentials be injected into model-visible context (System Prompts).
- Provider adapters must strip authorization headers before logging request payloads for debugging.
