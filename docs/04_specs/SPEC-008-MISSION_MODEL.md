# SPEC-008: Mission Model

**Status:** Draft | **Version:** 1.0 | **Date:** 2026-05-07

## 1. Introduction
A `Mission` represents the high-level intent and context for a set of `AgentRuns`. While a `Session` is a loose collection of messages, a `Mission` is a structured objective with associated constraints, semantic rules, and success criteria.

## 2. Mission Schema

| Field | Type | Description |
|---|---|---|
| `missionId` | UUID | Unique identifier. |
| `semanticProtocolId` | string | ID of the ER Meaning Layer protocol to apply. |
| `glossaryVersion` | string | Version of the project glossary to use for disambiguation. |
| `mode` | "fast" \| "balanced" \| "thorough" | Execution mode (affects RAG and model selection). |
| `goal` | string | The primary objective of the mission. |
| `constraints` | Array<string> | Explicit constraints (e.g., "no external APIs", "legal tone only"). |
| `openQuestions` | Array<string> | Questions that need to be answered to complete the mission. |
| `context` | object | Additional metadata (user profile, project state, etc.). |
| `createdAt` | ISO-8601 | Creation timestamp. |
| `updatedAt` | ISO-8601 | Last update timestamp. |

## 3. Relationships
- **Session:** A Mission is typically associated with one Session, but a Session can have multiple Missions over time.
- **AgentRun:** Multiple runs can be executed within the context of a single Mission. Each run inherits the Mission's context and constraints.
- **Artifact:** Missions often result in one or more Artifacts.

## 4. Mission Persistence
Missions MUST be persisted in the `MissionRepository`.
- **Primary Store:** SQLite (during v2.3 development).
- **Audit Store:** All mission changes must be recorded in the audit log.

## 5. Lifecycle
1. **Definition:** User or system defines a Mission based on a prompt or project template.
2. **Execution:** One or more `AgentRuns` are started to fulfill the Mission.
3. **Refinement:** The Mission goal or constraints may be updated as the agent discovers new information.
4. **Completion:** The Mission is marked as completed when the goal is reached or the user closes it.
