# Sprint 16: Chaos Report

## Overview
Chaos testing validates the operational resilience of ChatAVG v2.3 against severe degradation scenarios and unexpected component crashes.

## Injected Faults
1. **LiteLLM / Provider Timeout:** 
   - *Injection:* Simulated a 10-second response hang.
   - *Result:* `PROVIDER_TIMEOUT` aborted the request, triggering the `FallbackPolicy` perfectly.
2. **Temporal Worker Restart:**
   - *Injection:* Terminated the node worker process mid-workflow.
   - *Result:* The workflow remained in an active state and resumed from the last checkpoint upon worker restart.
3. **MCP Gateway Unreachable:**
   - *Injection:* Hard shutdown of the Tool Gateway port.
   - *Result:* The `chat.service.js` caught a `ECONNREFUSED` during the health check phase and fallback logic was initiated.
4. **Sandbox Crash:**
   - *Injection:* Killed the simulated E2B container.
   - *Result:* SandboxManager emitted a failure trace and cleaned up local ghost mounts.

## Conclusion
The system degrades gracefully rather than suffering cascading failures. Trace Bus captured 100% of the fault injections as `model.failed` with proper categorizations.
