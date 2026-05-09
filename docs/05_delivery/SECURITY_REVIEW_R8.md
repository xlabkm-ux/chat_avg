# SECURITY_REVIEW.md (Sprint R8)

**Status:** Completed  
**Date:** 2026-05-08  

## 1. Route Security Matrix
Verified that all sensitive endpoints are protected by `policyGuard` and `requireAdmin`.

| Endpoint | Protection | Status |
|---|---|---|
| `/api/admin/*` | `authenticate`, `requireAdmin` | ✅ Verified |
| `/api/sandboxes/*` | `authenticate`, `policyGuard` | ✅ Verified |
| `/api/runs/*` | `authenticate`, `policyGuard` | ✅ Verified |
| `/api/missions/*` | `authenticate` | ✅ Verified |

## 2. Sandbox Isolation
- **E2B Primary**: Production uses E2B for true virtualization.
- **Fail-closed**: System refuses to boot in production if `E2B_API_KEY` is missing and sandbox is enabled.
- **Local Fallback**: Permitted only in `development` or `test` environments.
- **Egress Policy**: Default deny applied. Only approved domains (e.g., Google, model providers) are allowed.

## 3. Secret Redaction
- `RedactionService` is integrated into `AuditService`.
- Traces and logs automatically mask keys matching patterns: `sk-...`, `AI...`, `Bearer ...`.

## 4. Threat Model Update
- **Prompt Injection**: Basic sanitization in `mapper.js`. Conflict cards created on detection.
- **Tool Escalation**: Verifying schemas and risk classes in `ToolGateway`.
- **Side Effects**: Mandatory `idempotencyKey` for `write` and `code_exec` risk classes.

## 5. Known Residual Risks
- Semantic Layer v0.2 is still rule-based; accuracy is ~80%. Adversarial inputs may still bypass complex boundaries.
- Temporal activities for model calls are currently using a simulated delay; needs full LiteLLM integration for production.
