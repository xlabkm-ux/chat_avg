# Спринт-план ChatAVG v2.3 (Оптимизированный)

**Версия:** 2.3 | **Дата:** 7 мая 2026  
**Основание:** [ChatAVG_v2.3_Optimized_Delivery_Plan_Sprints_Testing.md](../../workdoc/ChatAVG_v2.3_Optimized_Delivery_Plan_Sprints_Testing.md)

---

## 1. Стратегические цели v2.3

1. **Shift-Left Semantic Protocol:** Раннее подтверждение ценности ER Meaning Layer (Sprint 5) до масштабных инвестиций в инфраструктуру.
2. **Fast Path First:** Гарантированная низкая задержка для простого чата без оверхеда AgentRun/Sandbox.
3. **Durable Runtime (Temporal-first):** Отказ от самописного workflow-движка на SQLite в пользу индустриального стандарта.
4. **Model & Tool Gateways:** Четкое разделение инференса (LiteLLM) и инструментов (MCP).
5. **Risk-based execution:** Дифференцированный подход к безопасности (песочница только для High-Risk действий).

---

## 2. Roadmap Overview

| Спринт | Название | Ключевой результат | Статус |
|---|---|---|---|
| **0** | **Repo Hygiene & Arch Lock** | ADR pack, Feature Flags, очистка репозитория | ✅ Done |
| **1** | **Regression Baseline** | Тест-харнесс, фикстуры, Security/Latency baseline | ✅ Done |
| **2** | **Fast Path Discipline** | SPEC-001, AsyncIterable contract, guardrails | ✅ Done |
| **3** | **Model Registry** | SPEC-002, динамический список моделей, health check | ✅ Done |
| **4** | **Model Gateway (LiteLLM)** | SPEC-003, LiteLLM pilot, routing/fallback | ✅ Done |
| **5** | **Semantic Protocol PoC** | ER Meaning Layer PoC, Golden Set (57 кейсов) | ✅ Done |
| **6** | **Mission + AgentRun API** | AgentRun state machine, Mission context | 🚀 Current |
| **7** | **Temporal DurableRuntime** | Durable workflows, signals, replay | 📅 Next |
| **8** | **Policy/Cost/Audit** | Control plane (allow/deny/approve) | 📅 Planned |
| **9** | **MVP Release Gate** | E2E: Chat + AgentRun + Semantic + Approval | 📅 Planned |
| **10** | **Knowledge Gateway** | RAG modes, Citation contract | 📅 Planned |
| **11** | **RAG + Semantic Evals** | Качество RAG, расширенные эвалы (100+ кейсов) | 📅 Planned |
| **12** | **Role Passes + Workspace** | Artifact Workspace, Mission Room UX | 📅 Planned |
| **13** | **MCP Tool Gateway** | Tool Registry, versioned schemas | 📅 Planned |
| **14** | **Hybrid Sandbox / Forge** | E2B sandbox для high-risk действий | 📅 Planned |
| **15** | **Observability + Hardening** | Dashboards, Load/Chaos tests | 📅 Planned |
| **16** | **Release Candidate** | Migration, Rollback, Security sign-off | 📅 Planned |

---

## 3. Детальный план (Sprints 6-16)

### Sprint 6: Mission + AgentRun API
- **Цель:** Ввести AgentRun и Mission как execution единицы.
- **Scope:** SPEC-006 (State Machine), Mission model, AgentRun API endpoints, SSE event stream.
- **Exit Criteria:** Тесты переходов состояний, сохранность контекста миссии.

### Sprint 7: Temporal DurableRuntime
- **Цель:** Обеспечить надежность выполнения AgentRun.
- **Scope:** SPEC-008 (DurableRuntime), запуск Temporal dev cluster, реализация workflow (model step → semantic step → wait for approval).
- **Exit Criteria:** Успешный реплей воркреров, обработка сигналов подтверждения.

### Sprint 8: Policy, Cost, Audit and Approval
- **Цель:** Контроль рисков и стоимости в рантайме.
- **Scope:** SPEC-011 (PolicyEngine), SPEC-012 (CostPolicy), SPEC-013 (ApprovalRequest), Redaction (секреты).
- **Exit Criteria:** Юнит-тесты политик, ассерты аудита.

### Sprint 9: MVP Release Gate
- **Цель:** Сборка первого работающего E2E решения.
- **Scope:** Интеграция Fast Chat + AgentRun + Semantic PoC + Approvals.
- **Exit Criteria:** Успешный E2E тест, готовность MIGRATION-001 (fallback).

### Sprint 10-14: Расширение платформы
- **Knowledge Gateway (S10):** Mode-driven retrieval (fast/balanced/max_quality).
- **Evals (S11):** RAGAS/TruLens metrics, nightly eval pipeline.
- **Meaning UX (S12):** Role Passes, Artifact Workspace, Mission Room.
- **Tool Gateway (S13):** MCP Tool Gateway, versioned tool contracts.
- **Forge (S14):** Гибридная песочница (E2B) для High-Risk кода.

---

## 4. Release Gates

| Gate | Название | Спринт | Основной критерий |
|---|---|---|---|
| **A** | Architecture Lock | 0 | ADR pack принят, feature flags готовы. |
| **B** | Fast Path Safety | 2 | Простой путь защищен guardrail тестами. |
| **C** | Semantic Viability | 5 | PoC проходит Golden Set, USP подтвержден. |
| **D** | **MVP Gate** | 9 | Полный цикл от логина до артефакта работает. |
| **E** | Beta Gate | 12-14 | Knowledge, Tools и Sandbox готовы. |
| **F** | **RC Gate** | 16 | Security review, Load/Chaos, Rollback dry-run. |

---

## 5. Definition of Done (DoD) для каждого спринта

1. **Код:** Пройден Code Review, Unit-тесты ≥ 80% покрытия.
2. **Тесты:** Contract, Security и Integration тесты — Green.
3. **Документация:** Обновлены SPEC/ADR, актуализирован [PROJECT_MAP.md](../../PROJECT_MAP.md).
4. **Бэклог:** Обновлен [PROJECT_BACKLOG.md](../../PROJECT_BACKLOG.md), проставлены даты и чекбоксы.
5. **Риски:** Обновлен [RISK_REGISTER.md](./RISK_REGISTER.md).
6. **Демо:** Результаты продемонстрированы, Exit Criteria спринта выполнены.
