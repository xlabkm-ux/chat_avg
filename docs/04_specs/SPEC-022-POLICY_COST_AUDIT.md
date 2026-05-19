---
id: SPEC-022
title: Policy, Cost, and Audit Control Plane
version: 1.0.0
owner: Core Team
status: Draft
last_updated: 2026-05-07
sprint: Sprint 15
---

# SPEC-022: Policy, Cost, and Audit Control Plane

## Overview
This specification defines the control plane for managing AI-driven actions, including policy evaluation, cost tracking, and comprehensive auditing. It ensures that every system interaction is evaluated for risk, budgeted, and logged.

## Policy Engine (v0.2)
The `PolicyEngine` evaluates actions and returns a `PolicyDecision`.

### PolicyDecision Structure
```ts
type PolicyDecision = {
  decisionId: string;
  resolution: 'allow' | 'deny' | 'require_approval' | 'downgrade';
  riskScore: number;
  riskClass: 'READ_ONLY' | 'EXTERNAL_API' | 'SYSTEM_WRITE' | 'CODE_EXECUTION' | 'PRIVILEGED';
  reason: string;
  requiredApproval?: { type: string; role: string };
  redactionPlan?: { type: string };
  budgetImpact: { estimateUsd: number; currency: string };
  auditLevel: 'none' | 'standard' | 'high' | 'security';
};
```

## Cost and Budget Management
Costs are tracked per `AgentRun`, `User`, and `Project`.

- **Pre-flight Estimation**: Before a heavy action (model call, tool call), the system estimates the cost.
- **Budget Enforcement**: If the estimated cost exceeds the remaining budget, the action is denied or downgraded.
- **Cost Events**: Every spent cent is recorded in `cost_events` and aggregated into `budget_records`.

## Audit System
The `AuditService` captures all security-sensitive actions:
- Policy decisions with `auditLevel >= high`.
- Tool calls (requested, executing, completed, failed).
- Approval requests and their resolutions.
- Sandbox lifecycle events.

## Approval Lifecycle
1. **Request**: Created by `ApprovalService` with enriched preview metadata.
2. **Preview**: Frontend displays risk reason, affected resources, and estimated cost.
3. **Resolution**: User approves, rejects, edits, or cancels the request.
4. **Execution**: The underlying action proceeds only if approved.
