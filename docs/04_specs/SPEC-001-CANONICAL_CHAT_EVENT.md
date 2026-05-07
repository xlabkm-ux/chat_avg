# SPEC-001: CanonicalChatEvent

**Status:** Accepted  
**Sprint:** 2 (Fast Path Discipline)  
**Date:** 2026-05-07  

## Summary

`CanonicalChatEvent` is the canonical event contract for all streaming and non-streaming chat responses in ChatAVG. Every provider adapter MUST yield events conforming to this contract. The contract is enforced through the `providerEvents.js` factory module.

## Event Types

| Type | Required Fields | Optional Fields | Description |
|---|---|---|---|
| `delta` | `type`, `text` | — | A text chunk of the model's response |
| `tool_call` | `type`, `toolCall` | — | A tool/function call request from the model |
| `done` | `type` | `finishReason`, `usage` | End of response stream |
| `error` | `type`, `message` | `code`, `status`, `isRetryable`, `details` | Provider or system error |

## TypeScript-style Interface

```typescript
interface CanonicalChatEvent {
  type: 'delta' | 'tool_call' | 'done' | 'error';
  text?: string;               // 'delta' events
  toolCall?: ToolCallPayload;   // 'tool_call' events
  finishReason?: string;        // 'done' events (default: 'stop')
  usage?: UsagePayload | null;  // 'done' events
  message?: string;             // 'error' events
  code?: string;                // 'error' events (default: 'provider_error')
  status?: number;              // 'error' events (HTTP-like status)
  isRetryable?: boolean;        // 'error' events
  details?: any;                // 'error' events
}

interface UsagePayload {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface ToolCallPayload {
  id: string;
  name: string;
  arguments: string;  // JSON-encoded
}
```

## Factory Functions

All events MUST be created via `ProviderEvents` factory (see `providerEvents.js`):

```javascript
const ProviderEvents = require('./providerEvents');

ProviderEvents.delta(text)                     // → { type: 'delta', text }
ProviderEvents.toolCall(toolCallObj)            // → { type: 'tool_call', toolCall }
ProviderEvents.done(finishReason, usage)        // → { type: 'done', finishReason, usage }
ProviderEvents.error(message, code)             // → { type: 'error', message, code }
```

## Provider Adapter Contract

Every provider adapter extending `BaseProvider` MUST:

1. Return an `AsyncIterable<CanonicalChatEvent>` from `handleChat()`.
2. Yield zero or more `delta` events containing response text chunks.
3. Yield zero or more `tool_call` events when the model requests tool execution.
4. Yield exactly one `done` event as the final event in a successful stream.
5. Yield exactly one `error` event if an unrecoverable error occurs (no `done` after error).
6. NEVER mix raw strings, objects, or provider-specific payloads into the stream.

## Event Ordering Rules

```
VALID:    delta* → done
VALID:    delta* → tool_call+ → done
VALID:    error
INVALID:  done → delta   (done is terminal)
INVALID:  error → delta  (error is terminal)
```

## Fast Path Guardrails

In the simple chat fast path (`isFastPath === true`):
- No sandbox allocation.
- No live tool discovery / heavy RAG retrieval.
- The stream MUST consist of only `delta` → `done` events.
- Tool calls in fast path are only allowed if explicitly configured per category.

## Backward Compatibility

The response format for `/api/chat/completions` remains OpenAI-compatible:
- Streaming: SSE with `data: {chunk}\n\n` format, terminated by `data: [DONE]\n\n`.
- Non-streaming: Standard `{ choices: [{ message: { role, content } }], usage }` JSON.

## Error Response Format (SSE)

```json
{
  "error": {
    "message": "Provider timeout",
    "code": "provider_timeout",
    "details": null
  }
}
```

## Implementation

- **Source:** `cons/chatavg/src/modules/providers/providerEvents.js`
- **Error contract:** `cons/chatavg/src/modules/providers/providerErrors.js`
- **Consumer:** `cons/chatavg/src/modules/chat/chat.service.js`
- **Tests:** `cons/chatavg/tests/provider_events.test.js`

## References

- ADR-001: Fast path + evolutionary migration boundary
- SPEC-014: Error Contract
