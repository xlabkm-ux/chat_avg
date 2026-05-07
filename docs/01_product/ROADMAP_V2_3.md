# Roadmap ChatAVG v2.3

**ID:** K-05 | **Версия:** 1.0 | **Статус:** Active  
**Владелец:** PM | **Обновлено:** 7 мая 2026  
**Источник:** SRC-01 (v2.3 Optimized Delivery Plan)

---

## Обзор

16 спринтов (2 недели каждый). 3 крупных релиза: **MVP** (Sprint 9), **Beta** (Sprint 13), **RC** (Sprint 16).

---

## Фазы и спринты

### Phase 1: Foundation (Sprint 0-2)

| Sprint | Цель | Ключевые deliverables |
|---|---|---|
| **0** | Kickoff & Repo Hygiene | Handover pack, docs structure, feature flags, .gitignore, PROJECT_MAP |
| **1** | Test Harness & Security Baseline | Test strategy, fixtures, env validation, regression baseline, threat model draft |
| **2** | CanonicalChatEvent & Fast Path Hardening | SPEC-001, error contract, DeterministicProvider, Fast Path latency baseline |

### Phase 2: Gateway Layer (Sprint 3-5)

| Sprint | Цель | Ключевые deliverables |
|---|---|---|
| **3** | Model Gateway (LiteLLM pilot) | ModelRegistry API, provider abstraction, health/fallback |
| **4** | Model Gateway (production) | Cost tracking, virtual keys, routing, latency budgets |
| **5** | Semantic Protocol Seed | SemanticProtocol v0, ClaimLedger v0, DomainBoundary rules, golden set seed |

### Phase 3: Agent Runtime (Sprint 6-8)

| Sprint | Цель | Ключевые deliverables |
|---|---|---|
| **6** | AgentRun & Durable Runtime | Temporal workflows, AgentRun state machine, SSE events |
| **7** | AgentRun Hardening | Replay, cancellation, stuck workflow handling, worker restart |
| **8** | Policy / Cost / Approval | PolicyDecision, approval UX, cost budgets, audit trace |

### Phase 4: MVP Release (Sprint 9)

| Sprint | Цель | Ключевые deliverables |
|---|---|---|
| **9** | MVP Stabilization & Release | E2E regression, UAT scenarios, rollback path, release notes |

### Phase 5: Knowledge & Semantic (Sprint 10-12)

| Sprint | Цель | Ключевые deliverables |
|---|---|---|
| **10** | Knowledge Gateway | RAG modes, retrieval, citations, reranking |
| **11** | Semantic Observability | Semantic metrics, eval pipeline, quality dashboards |
| **12** | Adequacy Engine & Artifacts | Role Passes, Conflict Cards, Artifact Workspace |

### Phase 6: Tools & Sandbox (Sprint 13-14)

| Sprint | Цель | Ключевые deliverables |
|---|---|---|
| **13** | MCP Tool Gateway | Tool registry, versioned schemas, risk classes, canary rollout |
| **14** | Forge (Sandbox) | E2B/Daytona integration, warm pool, TTL, cleanup, egress policy |

### Phase 7: Hardening & Release (Sprint 15-16)

| Sprint | Цель | Ключевые deliverables |
|---|---|---|
| **15** | Performance & Chaos | Load tests, chaos tests, observability dashboards, alerting |
| **16** | RC & Migration | V1→V2 migration, DR drill, full security sign-off, final release |

---

## Timeline (визуальный)

```
Sprint:  0   1   2   3   4   5   6   7   8  [9]  10  11  12 [13] 14  15 [16]
         │   │   │   │   │   │   │   │   │   │    │   │   │   │   │   │   │
Phase:   ├─ Foundation ─┤   ├─ Gateways ─┤   ├─ Runtime ─┤  MVP  ├─ K&S ─┤
         │               │                │               │       │       │
Release: │               │                │              MVP    Beta     RC
```

---

## Tracks (параллельные)

| Track | Sprints | Owner |
|---|---|---|
| Backend Core | 0-16 | Backend Lead |
| Semantic / ER | 5-12 | Semantic Lead |
| Frontend / UX | 6-16 | Frontend Lead |
| Security | 1-16 | Security Lead |
| SRE / Ops | 1-16 | SRE Lead |
| QA / Evals | 1-16 | QA Lead |
