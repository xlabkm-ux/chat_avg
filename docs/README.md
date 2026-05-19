# ChatAVG v2.3 Documentation Hub

**Version:** 2.3 (Skeleton/MVP PoC)  
**Last Updated:** 2026-05-19  
**Total Documents:** 125 markdown files

---

Welcome! This is the central navigation point for ChatAVG documentation. Choose your path based on your role and goals.

## Quick Start

### For Everyone
- [Project Brief](01_product/PROJECT_BRIEF.md) - What is ChatAVG?
- [Vision & Scope](01_product/VISION_SCOPE_ANTI_GOALS.md) - Goals and non-goals
- [Glossary](01_product/GLOSSARY.md) - Key terms and concepts (ER-specific)
- [Roadmap v2.3](01_product/ROADMAP_V2_3.md) - 16-sprint plan to GA

### For New Developers
- [Local Development Setup](05_delivery/LOCAL_DEVELOPMENT_SETUP.md) - Get running locally
- [Architecture Overview](02_architecture/ARCHITECTURE_OVERVIEW_V2_3.md) - System architecture
- [Project Map](../PROJECT_MAP.md) - Auto-generated file tree and dependencies
- [Current Reality Audit](05_delivery/CURRENT_REALITY_AUDIT.md) - Honest status assessment

### For Product Managers
- [Product Brief](01_product/PROJECT_BRIEF.md)
- [Vision & Scope](01_product/VISION_SCOPE_ANTI_GOALS.md)
- [Roadmap](01_product/ROADMAP_V2_3.md)
- [Risk Register](05_delivery/RISK_REGISTER.md)
- [Release Gates & DoD](05_delivery/RELEASE_GATES_AND_DOD.md)

---

## By Role

### Backend Engineers

**Core Architecture:**
- [Architecture Overview](02_architecture/ARCHITECTURE_OVERVIEW_V2_3.md)
- [C4 Context Diagram](02_architecture/C4_CONTEXT_CONTAINER_COMPONENT.md)
- [Data Model & State Machines](02_architecture/DATA_MODEL_AND_STATE_MACHINES.md)
- [Runtime Modes & Latency Budget](02_architecture/RUNTIME_MODES_AND_LATENCY_BUDGET.md)

**API Specifications:**
- [SPEC-001: Canonical Chat Event](04_specs/SPEC-001-CANONICAL_CHAT_EVENT.md)
- [SPEC-002: Model Registry](04_specs/SPEC-002-MODEL_REGISTRY.md)
- [SPEC-003: Model Gateway](04_specs/SPEC-003-MODEL_GATEWAY.md)
- [SPEC-004: Semantic Protocol](04_specs/SPEC-004-SEMANTIC_PROTOCOL.md)
- [SPEC-005: Claim Domain Boundary](04_specs/SPEC-005-CLAIM_DOMAIN_BOUNDARY.md)
- [SPEC-006: AgentRun State Machine](04_specs/SPEC-006-AGENT_RUN_STATE_MACHINE.md)
- [SPEC-008: Mission Model](04_specs/SPEC-008-MISSION_MODEL.md)
- [SPEC-009: Durable Runtime](04_specs/SPEC-009-DURABLE_RUNTIME.md)

**Domain Specifications:**
- [SPEC-014: Knowledge Gateway](04_specs/SPEC-014-KNOWLEDGE_GATEWAY.md)
- [SPEC-015: Retrieval Contract](04_specs/SPEC-015-RETRIEVAL_CONTRACT.md)
- [SPEC-016: RolePass](04_specs/SPEC-016-ROLE_PASS.md)
- [SPEC-017: Artifact Workspace](04_specs/SPEC-017-ARTIFACT_WORKSPACE.md)
- [SPEC-018: MCP Tool Gateway](04_specs/SPEC-018-MCP_TOOL_GATEWAY.md)
- [SPEC-019: Sandbox Manager](04_specs/SPEC-019-SANDBOX_MANAGER.md)
- [SPEC-023: MCP Tool Gateway and Registry](04_specs/SPEC-023-MCP_TOOL_GATEWAY.md)

**Architectural Decisions:**
- [ADR Index](03_adr/ADR_INDEX.md)
- [ADR-001: Temporal Durable Runtime](03_adr/ADR-001-temporal-durable-runtime.md)
- [ADR-002: LiteLLM Model Gateway](03_adr/ADR-002-litellm-model-gateway.md)
- [ADR-003: E2B Hybrid Sandbox](03_adr/ADR-003-e2b-hybrid-sandbox.md)
- [ADR-004: MCP Tool Gateway](03_adr/ADR-004-mcp-tool-gateway.md)
- [ADR-005: Semantic Shift-Left](03_adr/ADR-005-semantic-shift-left.md)

### Frontend Engineers

**UX Specifications:**
- [UX Product Brief](08_ux/UX_PRODUCT_BRIEF.md)
- [Approval UX Spec](08_ux/APPROVAL_UX_SPEC.md)
- [Artifact Workspace UX](08_ux/ARTIFACT_WORKSPACE_UX.md)
- [Accessibility & Mobile Guidelines](08_ux/ACCESSIBILITY_AND_MOBILE_GUIDELINES.md)

**API Integration:**
- [SPEC-001: Canonical Chat Event](04_specs/SPEC-001-CANONICAL_CHAT_EVENT.md) - Event stream format
- [SPEC-003: Model Gateway](04_specs/SPEC-003-MODEL_GATEWAY.md) - LLM API proxy
- [SPEC-016: RolePass](04_specs/SPEC-016-ROLE_PASS.md) - Role-based UI rendering

### Security Engineers

**Security Documentation:**
- [Threat Model](07_security/THREAT_MODEL.md) - Attack vectors and mitigations
- [Environment Secrets](07_security/ENVIRONMENT_SECRETS.md) - Secret management
- [Network Egress & SSRF Policy](07_security/NETWORK_EGRESS_AND_SSRF_POLICY.md)
- [Policy Engine Approval Policy](07_security/POLICY_ENGINE_APPROVAL_POLICY.md)
- [Prompt Injection Defense](07_security/PROMPT_INJECTION_DEFENSE.md)
- [MVP Security Review](05_delivery/MVP_SECURITY_REVIEW.md)

**Sandboxing:**
- [SPEC-019: Sandbox Manager](04_specs/SPEC-019-SANDBOX_MANAGER.md)
- [ADR-003: E2B Hybrid Sandbox](03_adr/ADR-003-e2b-hybrid-sandbox.md)
- [RUNBOOK-002: Sandbox Recovery](09_runbooks/RUNBOOK-002-SANDBOX_RECOVERY.md)

### QA Engineers

**Testing Strategy:**
- [Test Strategy](06_testing/TEST_STRATEGY.md) - Overall testing approach
- [Test Matrix](06_testing/TEST_MATRIX.md) - Test coverage by component
- [Contract Test Plan](06_testing/CONTRACT_TEST_PLAN.md) - API contract testing
- [RAG Eval Plan](06_testing/RAG_EVAL_PLAN.md) - Retrieval evaluation
- [Semantic Eval Plan](06_testing/SEMANTIC_EVAL_PLAN.md) - Semantic accuracy evaluation
- [Security Test Plan](06_testing/SECURITY_TEST_PLAN.md) - Penetration testing

**Quality Gates:**
- [Release Gates & DoD](05_delivery/RELEASE_GATES_AND_DOD.md)
- [Regression Baseline](06_testing/REGRESSION_BASELINE.md)

### DevOps / SRE

**Operations:**
- [Observability Dashboards](09_ops/OBSERVABILITY_DASHBOARDS.md)
- [Alerting & SLO](09_ops/ALERTING_AND_SLO.md)
- [Deployment Guide](09_ops/DEPLOYMENT_GUIDE.md)

**Runbooks:**
- [RUNBOOK-001: Temporal Recovery](09_runbooks/RUNBOOK-001-TEMPORAL_RECOVERY.md)
- [RUNBOOK-002: Sandbox Recovery](09_runbooks/RUNBOOK-002-SANDBOX_RECOVERY.md)
- [RUNBOOK-003: Rollback](09_runbooks/RUNBOOK-003_ROLLBACK.md)
- [RUNBOOK-004: Incident Response](09_runbooks/RUNBOOK-004-INCIDENT_RESPONSE.md)

**Infrastructure:**
- [LOCAL_DEVELOPMENT_SETUP.md](05_delivery/LOCAL_DEVELOPMENT_SETUP.md)
- [SPRINT_PLAN_V2_3.md](05_delivery/SPRINT_PLAN_V2_3.md) - Infrastructure roadmap

---

## By Topic

### Architecture Decisions (ADRs)

Browse all architectural decisions: [ADR Index](03_adr/ADR_INDEX.md)

**Critical Decisions:**
- [ADR-001: Temporal Durable Runtime](03_adr/ADR-001-temporal-durable-runtime.md) - Why we chose Temporal for workflow orchestration
- [ADR-002: LiteLLM Model Gateway](03_adr/ADR-002-litellm-model-gateway.md) - Multi-provider LLM routing
- [ADR-003: E2B Hybrid Sandbox](03_adr/ADR-003-e2b-hybrid-sandbox.md) - Secure code execution isolation
- [ADR-004: MCP Tool Gateway](03_adr/ADR-004-mcp-tool-gateway.md) - Standardized tool protocol
- [ADR-005: Semantic Shift-Left](03_adr/ADR-005-semantic-shift-left.md) - Early semantic validation

### Specifications (SPECs)

**API Contracts:**
- [SPEC-001: Canonical Chat Event](04_specs/SPEC-001-CANONICAL_CHAT_EVENT.md)
- [SPEC-002: Model Registry](04_specs/SPEC-002-MODEL_REGISTRY.md)
- [SPEC-003: Model Gateway](04_specs/SPEC-003-MODEL_GATEWAY.md)

**Domain Models:**
- [SPEC-004: Semantic Protocol](04_specs/SPEC-004-SEMANTIC_PROTOCOL.md)
- [SPEC-005: Claim Domain Boundary](04_specs/SPEC-005-CLAIM_DOMAIN_BOUNDARY.md)
- [SPEC-006: AgentRun State Machine](04_specs/SPEC-006-AGENT_RUN_STATE_MACHINE.md)
- [SPEC-008: Mission Model](04_specs/SPEC-008-MISSION_MODEL.md)
- [SPEC-009: Durable Runtime](04_specs/SPEC-009-DURABLE_RUNTIME.md)

**Gateway Layer:**
- [SPEC-014: Knowledge Gateway](04_specs/SPEC-014-KNOWLEDGE_GATEWAY.md)
- [SPEC-015: Retrieval Contract](04_specs/SPEC-015-RETRIEVAL_CONTRACT.md)
- [SPEC-018: MCP Tool Gateway](04_specs/SPEC-018-MCP_TOOL_GATEWAY.md)
- [SPEC-023: MCP Tool Gateway and Registry](04_specs/SPEC-023-MCP_TOOL_GATEWAY.md)

**Infrastructure:**
- [SPEC-016: RolePass](04_specs/SPEC-016-ROLE_PASS.md)
- [SPEC-017: Artifact Workspace](04_specs/SPEC-017-ARTIFACT_WORKSPACE.md)
- [SPEC-019: Sandbox Manager](04_specs/SPEC-019-SANDBOX_MANAGER.md)

### Sprint Reports

**Completed Sprints:**
- [Sprint 5 Closure Manifest](05_delivery/SPRINT_5_CLOSURE_MANIFEST.md)
- [Sprint 7 Closure Manifest](05_delivery/SPRINT_7_CLOSURE_MANIFEST.md)
- [Sprint 13 Closure Manifest](05_delivery/SPRINT_13_CLOSURE_MANIFEST.md)
- [Sprint F2 Closure Manifest](05_delivery/SPRINT_F2_CLOSURE_MANIFEST.md) - Documentation hygiene

**Planning Documents:**
- [Sprint Plan v2.3](05_delivery/SPRINT_PLAN_V2_3.md) - Overall roadmap
- [Sprint 7 Plan](05_delivery/SPRINT_7_PLAN.md) - Temporal runtime
- [Sprint 17 Plan](05_delivery/SPRINT_17_PLAN.md) - Future work

### Release Documentation

- [Release Gates & DoD](05_delivery/RELEASE_GATES_AND_DOD.md)
- [MVP Security Review](05_delivery/MVP_SECURITY_REVIEW.md)
- [Chaos Engineering Report](05_delivery/CHAOS_REPORT.md)
- [Release Checklist](specs/SPEC-024_Release_Candidate_Checklist.md)
- [Semantic POC Report](05_delivery/SEMANTIC_POC_REPORT.md) - 84.5% accuracy results

---

## Visual Maps

### Architecture Diagrams

- [C4 Context Diagram](02_architecture/C4_CONTEXT_CONTAINER_COMPONENT.md) - System boundaries and relationships
- [Data Model](02_architecture/DATA_MODEL_AND_STATE_MACHINES.md) - Entity relationships and state transitions
- [Runtime Modes](02_architecture/RUNTIME_MODES_AND_LATENCY_BUDGET.md) - Performance budgets and latency targets

### Project Structure

- [Project Map](../PROJECT_MAP.md) - Auto-generated file tree with 132 files
- [Documentation Audit Report](../DOCUMENTATION_AUDIT_REPORT.md) - Quality assessment and improvement plan

---

## Documentation Quality

### Current Status

| Metric | Value | Target |
|--------|-------|--------|
| Total documents | 125 | - |
| Empty placeholders | 14 (11%) | 0 |
| Completed ADRs | 5/5 (100%) | 100% |
| Broken links | 0 | 0 |
| Documents with metadata | ~10% | 80% |
| Mermaid diagrams | 1 | 10+ |

### Recent Improvements

- **Sprint F2 (2026-05-19):** Fixed 4 broken absolute paths, verified no duplicates, confirmed honest backlog status
- **Sprint F3 (2026-05-19):** Completed 3 critical ADRs (ADR-001, ADR-003, ADR-004), created this Master Index

### Contributing to Documentation

Before committing changes:
1. Check for existing related documents (use search or browse this index)
2. Follow templates in [docs/templates/](templates/) (if available)
3. Add metadata block (id, version, owner, status, last_updated)
4. Update cross-references in related documents
5. Run link checker: `markdown-link-check docs/**/*.md`
6. Update PROJECT_MAP.md: `cd dev_studio && node refresh.js`

See [Documentation Audit Report](../DOCUMENTATION_AUDIT_REPORT.md) for detailed quality metrics and improvement roadmap.

---

## Appendix

### Handover Documents

- [Document Register](00_handover/DOCUMENT_REGISTER.md)
- [Handover README](00_handover/README_HANDOVER.md)
- [Source Documents](00_handover/SOURCE_DOCUMENTS.md)

*Note: Handover documents are placeholders for future project transition.*

### Archive

- [Test Matrix V1](06_testing/TEST_MATRIX_V1.md) - Superseded by current test matrix
- [Old sprint reports](05_delivery/) - Historical sprint documentation

---

**Need help?** Contact the team lead or check the [Onboarding Guide](ONBOARDING.md) (coming soon).

**Found an issue?** Report documentation problems via GitHub Issues or update directly with a PR.

---

*Documentation Hub last updated: 2026-05-19*  
*Next audit scheduled: After Sprint F4 (approximately 2026-06-02)*
