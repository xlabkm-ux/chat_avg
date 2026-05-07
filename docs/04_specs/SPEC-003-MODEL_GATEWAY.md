# SPEC-003: ModelGateway

**Status:** Accepted  
**Sprint:** 4 (Model Gateway / LiteLLM Pilot)  
**Date:** 2026-05-07  

## Summary

ModelGateway defines the boundary between ChatAVG core and AI model inference. It provides unified routing, fallback, cost tracking, and observability for all model interactions. LiteLLM Proxy serves as the primary gateway candidate.

## Key Distinction

> **ModelGateway ≠ MCP ToolGateway**
> 
> - **ModelGateway** handles AI model inference: chat completions, routing, fallback, cost.
> - **MCP ToolGateway** handles external tools and connectors: function execution, schema versioning, side-effect management.
> 
> These are separate architectural boundaries. MCP is NOT used for model inference by default. Inference goes through ModelGateway.

## Architecture

```
┌─────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  ChatService │────▶│   ModelGateway     │────▶│  LiteLLM Proxy   │
│  (Core)      │     │   (Routing Layer)  │     │  (Primary GW)    │
└─────────────┘     └───────────────────┘     └──────────────────┘
                            │                         │
                            │ fallback                │ routes to:
                            ▼                         ▼
                    ┌───────────────┐         ┌──────────────┐
                    │ Direct Adapter │         │ OpenAI/DS/   │
                    │ (Legacy Path)  │         │ Gemini/Qwen/ │
                    └───────────────┘         │ Grok/etc.    │
                                              └──────────────┘
```

## LiteLLM Integration

### Configuration

Location: `cons/litellm_gateway/litellm_config.yaml`

```yaml
model_list:
  - model_name: "gpt-4o"
    litellm_params:
      model: "openai/gpt-4o"
      api_key: "os.environ/OPENAI_API_KEY"
  # ... additional model routes with fallback groups
```

### Feature Flag

LiteLLM is gated behind the `LITELLM_ENABLED` feature flag. When disabled, requests route directly through native provider adapters.

### Provider Registration

In `providers.config.js`, the `litellm` provider uses the `openai_compat` adapter pointed at the LiteLLM Proxy endpoint:

```javascript
"litellm": {
  "name": "Model Gateway (LiteLLM)",
  "adapter": "openai_compat",
  "endpoint_url": "http://127.0.0.1:4000/v1",
  // ...
}
```

## Routing

1. Category settings determine `providerId`.
2. `policyRouter` resolves provider + fallback.
3. Provider factory returns adapter instance.
4. ChatService streams through adapter, handling fallback on retryable errors.

## Fallback Policy

Managed by `fallbackPolicy.js`:
- Retryable errors trigger fallback to secondary provider.
- Non-retryable errors (auth, invalid request) do NOT trigger fallback.
- Already-sent headers prevent fallback (streaming committed).

## Cost Tracking

### Current State (Sprint 4)
- Token usage returned in `done` event via `usage` field.
- LiteLLM Proxy provides cost tracking via its built-in mechanisms.

### Planned Trace Events (Sprint 6+)
```javascript
// Events to be emitted on the trace bus:
'model.requested'      // { providerId, model, timestamp }
'model.stream_started'  // { providerId, model, ttft }
'model.completed'       // { providerId, model, usage, duration }
'model.failed'          // { providerId, model, error, duration }
'cost.committed'        // { providerId, model, tokens, estimatedCost }
```

## Backward Compatibility

- `/api/chat/completions` endpoint is preserved.
- Response format remains OpenAI-compatible.
- Existing provider adapters work without modification.
- LiteLLM is additive, not a replacement for direct adapters.

## Implementation

- **LiteLLM Config:** `cons/litellm_gateway/litellm_config.yaml`
- **Startup Script:** `cons/litellm_gateway/start_proxy.cmd`
- **Provider Config:** `cons/chatavg/src/core/providers.config.js`
- **Chat Service:** `cons/chatavg/src/modules/chat/chat.service.js`
- **Fallback Policy:** `cons/chatavg/src/modules/chat/fallbackPolicy.js`
- **Policy Router:** `cons/chatavg/src/modules/chat/policyRouter.js`

## References

- ADR-002: LiteLLM Model Gateway
- SPEC-001: CanonicalChatEvent
- SPEC-002: ModelRegistry
