---
id: SPEC-023
title: MCP Tool Gateway and Registry
version: 1.0.0
owner: Core Team
status: Draft
last_updated: 2026-05-07
sprint: Sprint 15
note: "This is a condensed overview; see SPEC-018 for detailed implementation"
---

# SPEC-023: MCP Tool Gateway and Registry

## Overview
The MCP Tool Gateway is the central execution path for all tools in ChatAVG. It provides versioning, validation, and durability for tool calls.

## Tool Registry
The `ToolRegistry` stores `ToolDefinitionVersion` objects.
- **Versioning**: Each tool has a semantic version.
- **Schema Hash**: Prevents execution of tools with mismatched schemas.
- **Risk Classification**: Tools are tagged with risk classes (e.g., `CODE_EXECUTION`, `SYSTEM_WRITE`).

## Tool Call Lifecycle
All tool calls are persisted in the `tool_calls` table.

### States
- `requested`: Initial state.
- `validating`: Schema and policy check in progress.
- `pending_approval`: Waiting for user approval.
- `executing`: Being executed by the adapter (e.g., MCP server, local).
- `retrying`: Transient failure recovery.
- `completed`: Success with result stored.
- `failed`: Terminal error.

## Execution Safety
- **Idempotency**: Required for side-effect tools (Write/Exec).
- **Timeouts**: Enforced at the gateway level.
- **Policy Guard**: Every tool call is intercepted by the `PolicyEngine`.
- **Approval Path**: High-risk tools require explicit user consent via `ApprovalService`.
