---
id: SPEC-016
title: RolePass (Agent Capabilities)
version: 1.0.0
owner: Core Team
status: Draft
last_updated: 2026-05-07
sprint: Sprint 10
---

# SPEC-016: RolePass (Agent Capabilities)

## 1. Overview
RolePass is a capability-based authorization system that defines what an agent "Role" can do within the ER Meaning Layer and the Artifact Workspace.

## 2. Pass Definitions
| Pass | Capability | Enforcement Layer |
| :--- | :--- | :--- |
| **ObserverPass** | Extract claims, identify entities, detect levels. | ClaimExtractor |
| **BoundaryPass** | Detect and enforce domain boundaries (Medical/Legal). | DomainBoundary |
| **LanguagePass** | Translate, summarize, and adapt style. | ChatService |
| **BuilderPass** | Create, patch, and delete Artifacts. | ArtifactService |
| **TrajectoryPass** | Track mission progress and update goals. | MissionService |
| **SystemPass** | Access internal logs, costs, and audit trails. | AdminService |

## 3. Data Structure
```json
{
  "roleId": "standard_analyst",
  "passes": [
    { "id": "observer", "scope": "all" },
    { "id": "boundary", "mode": "strict" },
    { "id": "builder", "allowedTypes": ["doc", "plan"] }
  ]
}
```

## 4. Enforcement Logic
- Before any capability is executed (e.g., `ArtifactService.create`), the `RoleRegistry` must verify the presence of the required `RolePass`.
- If a pass is missing, the action is blocked and a `policy.violation` event is emitted.
