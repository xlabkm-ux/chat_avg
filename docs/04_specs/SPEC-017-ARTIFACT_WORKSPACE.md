# SPEC-017: Artifact Workspace

## 1. Overview
The Artifact Workspace is the primary collaborative environment where agents and users co-create versioned documents ("Artifacts") backed by semantic evidence and decision logs.

## 2. Core Entities

### 2.1 Artifact
- `id`: Unique identifier (UUID).
- `type`: `code`, `document`, `plan`, `specification`.
- `title`: Human-readable title.
- `content`: Current full state of the artifact.
- `version`: Sequential version number.
- `claims`: Array of semantic claims derived from this artifact.

### 2.2 ArtifactPatch
- `artifactId`: Parent artifact.
- `diff`: Standard unified diff or JSON-patch.
- `reason`: Justification for the change.
- `decisionId`: Link to the `DecisionRecord` that authorized this patch.

### 2.3 DecisionRecord
- `id`: Unique identifier.
- `title`: Decision title.
- `outcome`: `approved`, `rejected`, `deferred`.
- `logic`: Rationale behind the decision.
- `missionId`: Associated mission.

## 3. Storage Policy
- Artifacts are stored in the SQLite `artifacts` table.
- Large content blocks may be offloaded to external blob storage with a local pointer.

## 4. Integrity Rules
- Every `ArtifactPatch` must be linked to a `DecisionRecord`.
- Every `DecisionRecord` must be linked to a `Mission`.
- Claims must be re-extracted upon every new version (patch application).
