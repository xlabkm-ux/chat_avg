# ChatAVG v2.3 — Рабочий план модификации проекта для реализации workflow мирового уровня

**Документ:** `WF-MOD-PLAN-001`  
**Статус:** Draft for Architecture / Product / UX Review  
**Дата:** 9 мая 2026  
**Версия:** 1.0  
**Связанные документы:**  
- `ChatAVG_Project_Concept_Appendix_User_Workflows_formatted.md`
- `ChatAVG_v2.3_Optimized_Delivery_Plan_Sprints_Testing.md`
- `ChatAVG_Technical_Concept_v2_New_Architecture.docx`
- `ChatAVG_Concept_Mission_Project.docx`
- `ChatAVG_Concept_Architecture_Implementation.docx`

---

## 1. Назначение документа

Этот документ задаёт рабочий план модификации ChatAVG для реализации пользовательских workflow уровня лучших мировых AI/workflow/product systems.

Цель — перейти от списка поддерживаемых workflow к **операционной системе пользовательской работы**, где каждый workflow имеет:

- ясную пользовательскую цель;
- понятный вход и ожидаемый результат;
- статусы, переходы и критерии завершения;
- видимый progress;
- места человеческого выбора;
- policy/approval boundary;
- durable execution;
- artifact trace;
- quality/eval gates;
- observability.

Документ не заменяет delivery plan v2.3. Он уточняет, **как именно организовать пользовательскую работу внутри каждого workflow**, чтобы ChatAVG стал не “чатом с режимами”, а управляемой Mission Workflow Platform.

---

## 2. Ключевой вывод исследования лучших практик

Лучшие мировые workflow-системы сходятся в нескольких принципах:

| Практика | Смысл | Применение к ChatAVG |
|---|---|---|
| **Status + transition model** | Workflow задаётся состояниями, переходами и правилами движения. | Каждый WF должен иметь state machine, а не только UI-режим. |
| **Progress visibility** | Пользователь должен видеть текущий шаг, прошлые шаги и будущие шаги. | Mission Room показывает stage, progress, waiting reason и next action. |
| **Progressive disclosure** | Система не показывает всю сложность сразу. | Показывать 3–5 главных различений, а claims/debug раскрывать по запросу. |
| **Human-in-the-loop as state** | Approval — не кнопка, а состояние workflow с resume. | `requires_action`, `waiting`, `ApprovalRequest`, `DecisionRecord`. |
| **Durable execution** | Долгие процессы должны останавливаться, восстанавливаться и не повторять side effects. | AgentRun/MissionRun через Temporal-first или совместимую durable runtime модель. |
| **Guardrails at boundaries** | Проверки должны стоять на входе, выходе и вокруг tool calls. | Input / output / tool guardrails + semantic guardrails. |
| **Artifact-centered collaboration** | Результат должен жить как versioned artifact, а не как переписка. | ArtifactWorkspace + ArtifactPatch + Claim links + Decision links. |
| **Traceability and audit** | Важные действия должны оставлять след. | TraceEvent для model/retrieval/tool/approval/semantic/artifact/cost. |
| **Mode routing by cost/risk/value** | Не вся задача требует тяжёлого workflow. | Fast по умолчанию, Studio/Lab/Forge только по триггерам и/или согласию. |
| **Recovery and undo** | Пользователь должен иметь выход из ошибочного пути. | Cancel, fork, rollback artifact version, edit-then-approve. |

---

## 3. Целевое состояние ChatAVG Workflow Platform

### 3.1. Целевая формула

```text
User intent
  -> Workflow Router
  -> Workflow Contract
  -> Mission / AgentRun State Machine
  -> Visible Progress + Artifact Workspace
  -> Semantic / Policy / Cost Guardrails
  -> Human Decisions where needed
  -> Traceable Artifact / Action / Export
```

### 3.2. Главная продуктовая идея

Пользователь не должен “угадывать”, как работать с ChatAVG. Система должна сама переводить его намерение в один из workflow, объяснять выбранный режим, показывать путь и вести до результата.

---

## 4. Новая обязательная сущность: Workflow Contract

Каждый workflow должен быть описан в машинно-читаемом контракте.

```ts
type WorkflowContract = {
  workflowId: string;
  englishName: string;
  russianName: string;
  purpose: string;
  defaultMode: 'fast' | 'studio' | 'lab' | 'forge';
  userGoalExamples: string[];
  entryCriteria: EntryCriterion[];
  exitCriteria: ExitCriterion[];
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  requiredInputs: InputField[];
  optionalInputs: InputField[];
  artifactTypes: ArtifactType[];
  semanticDepth: 'none' | 'light' | 'standard' | 'full';
  retrievalPolicy: 'none' | 'fast' | 'balanced' | 'max_quality';
  toolPolicy: ToolPolicyRef;
  approvalPolicy: ApprovalPolicyRef;
  costPolicy: CostPolicyRef;
  userVisibleProgress: ProgressStep[];
  qualityGates: QualityGate[];
  observabilityEvents: TraceEventType[];
};
```

### 4.1. Почему это P0

Без `WorkflowContract` проект рискует превратиться в набор условных UI-режимов. Контракт делает workflow:

- тестируемым;
- маршрутизируемым;
- измеримым;
- объяснимым пользователю;
- пригодным для постепенного rollout;
- пригодным для enterprise audit.

---

## 5. Унифицированная state machine для пользовательских workflow

### 5.1. Базовые состояния

| State | Русское имя | Смысл |
|---|---|---|
| `created` | Создано | Workflow создан, но ещё не запущен. |
| `intake` | Приём материала | Система принимает ситуацию, файл, текст, цель. |
| `briefing` | Брифинг | Фиксируются цель, критерии, ограничения, неизвестные. |
| `preflight` | Предварительная проверка | Оцениваются риск, стоимость, режим, нужные tools/RAG/sandbox. |
| `mapping` | Картирование | Строятся observations, claims, boundaries, risks. |
| `working` | Рабочее исполнение | Выполняются role passes, retrieval, synthesis, tool planning. |
| `requires_action` | Требуется действие пользователя | Нужен выбор, approval, уточнение или редактирование. |
| `waiting` | Ожидание | Workflow ждёт внешнего события, tool, approval, schedule. |
| `artifact_build` | Сборка артефакта | Формируется или изменяется Artifact. |
| `review` | Проверка | Пользователь или система проверяет artifact, diff, claims, risks. |
| `forge` | Материализация | Файл, код, экспорт или внешнее действие. |
| `completed` | Завершено | Workflow достиг результата и имеет финальный artifact/action. |
| `cancelled` | Отменено | Пользователь или policy отменили run. |
| `failed` | Ошибка | Workflow завершился ошибкой с recovery path. |
| `expired` | Истекло | Ожидание или approval истекли. |

### 5.2. Правила переходов

| Правило | Требование |
|---|---|
| Каждый state должен иметь хотя бы один допустимый переход, кроме terminal states. |
| Переходы должны быть one-way, если обратный путь не описан явно. |
| Любой risky transition должен проходить через `preflight` или `requires_action`. |
| Любой external side effect должен иметь `idempotencyKey`. |
| Любой human decision должен создавать `DecisionRecord`. |
| Любой artifact mutation должен создавать `ArtifactPatch`. |
| Любая ошибка должна иметь recovery instruction: retry, edit, downgrade, cancel, fork. |

---

## 6. Унифицированная UX-модель workflow

### 6.1. Mission Room Shell

Все сложные workflow должны использовать единый shell.

| Область UI | Что показывает | Что нельзя показывать по умолчанию |
|---|---|---|
| **Mission Header** | Цель, режим, статус, риск, стоимость, next action. | Внутренний prompt, полный chain-of-thought, technical debug. |
| **Progress Rail** | Шаги workflow, текущий stage, completed/pending/blocked. | Мелкие internal events. |
| **Artifact Pane** | Живой документ, план, код, карта, diff. | Непроверенные промежуточные outputs как финальные. |
| **Distinctions Pane** | 3–5 ключевых различений: факт/гипотеза/граница/риск/развилка. | Полный Claim Ledger без запроса. |
| **Conflict / Decision Pane** | Карточки выбора, цена вариантов, approval. | Дерево дебатов ролей. |
| **Trace Drawer** | Источники, claims, events, cost, approvals, tool calls. | Скрытые системные инструкции. |

### 6.2. Принцип progressive disclosure

Пользователь видит:

1. сначала — цель, статус и следующий шаг;
2. затем — 3–5 главных различений;
3. затем — artifact/diff;
4. только по запросу — полный Claim Ledger, trace, source spans, role pass details.

---

## 7. Модификации по каждому пользовательскому workflow

### 7.1. Fast Chat — Быстрый ответ

| Параметр | Решение |
|---|---|
| Цель | Быстро ответить, объяснить, поправить текст, не создавая ложной уверенности. |
| Default state path | `created -> intake -> working -> completed` |
| UI | Обычный чат + компактный индикатор источника уверенности, если есть неопределённость. |
| Guardrails | Не говорить сильнее данных; не запускать heavy RAG/tools/sandbox. |
| Artifact | Не обязателен; может быть создан по кнопке “Сохранить как миссию”. |
| Критерий качества | TTFT, корректность, отсутствие hidden authority, no unnecessary escalation. |

**Модификация:** добавить кнопку/паттерн **“Развернуть в миссию”**, если Fast-ответ обнаруживает сложность, конфликт, документы или ценностную развилку.

---

### 7.2. Mission Room — Комната миссии

| Параметр | Решение |
|---|---|
| Цель | Превратить ситуацию/замысел/конфликт в рабочий artifact и решение. |
| Default state path | `created -> intake -> briefing -> preflight -> mapping -> working -> artifact_build -> review -> completed` |
| UI | Mission Header + Progress Rail + Artifact Pane + Distinctions Pane. |
| Guardrails | Human sovereignty, domain boundaries, no hidden authority. |
| Artifact | Mission Brief + Working Artifact + Decision Records. |
| Критерий качества | Пользователь понимает, где факты, где гипотезы, где его выбор. |

**Модификация:** реализовать `Mission Brief Builder` как guided intake: цель, контекст, критерии успеха, ограничения, неизвестные, желаемый artifact.

---

### 7.3. Studio Workflow — Мастерская

| Параметр | Решение |
|---|---|
| Цель | Улучшать документы, концепции, стратегии, архитектуру, планы. |
| Default state path | `intake -> briefing -> mapping -> working -> artifact_build -> review -> completed` |
| UI | Artifact-first workspace с diff viewer и ролью каждого patch. |
| Guardrails | Каждый существенный patch должен ссылаться на claim/risk/decision. |
| Artifact | Versioned document / plan / architecture / report. |
| Критерий качества | Artifact полезнее исходника, изменения объяснимы, claims прослеживаемы. |

**Модификация:** сделать `ArtifactPatch` центральным output RolePass. Роли не пишут “мнения”, они предлагают patches.

---

### 7.4. Lab Workflow — Лаборатория

| Параметр | Решение |
|---|---|
| Цель | Проработать сложные человеческие, системные, командные, смысловые задачи. |
| Default state path | `intake -> briefing -> preflight -> mapping -> role_passes -> conflict_resolution -> synthesis -> review -> completed` |
| UI | Progress UI вместо ожидания; показывать limited role progress. |
| Guardrails | Нет диагностики пользователя, нет “знания сущности”, нет depth score. |
| Artifact | Adequacy Map + Conflict Cards + Decision Records + Actionable Trajectory. |
| Критерий качества | Пользователь получает ясные развилки и следующий проверяемый шаг. |

**Модификация:** Lab запускается только после явного согласия или strong routing trigger. Перед запуском показывать cost/risk/time estimate.

---

### 7.5. Adequacy Mapping — Карта адекватности

| Параметр | Решение |
|---|---|
| Цель | Разделить материал на observations, claims, boundaries, distortions, conflicts. |
| Default state path | `intake -> mapping -> review -> completed` |
| UI | 3–5 различений поверх полного Claim Ledger. |
| Guardrails | Не превращать гипотезу об искажении в обвинение или диагноз. |
| Artifact | Adequacy Map / Claim Ledger / Domain Boundary Map. |
| Критерий качества | Claims имеют тип, силу, источник, границу и downgrade reason. |

**Модификация:** ввести `Claim Card` как UI-компонент: claim text, type, strength, source, boundary, “почему сила снижена”.

---

### 7.6. Conflict Card Workflow — Карта развилки

| Параметр | Решение |
|---|---|
| Цель | Показать конфликт, варианты и цену выбора. |
| Default state path | `mapping -> requires_action -> decision_record -> working/review/completed` |
| UI | Суть конфликта, 2–4 варианта, цена, recommendation, “решение остаётся за вами”. |
| Guardrails | Система не принимает ценностные решения за пользователя. |
| Artifact | ConflictCard + DecisionRecord. |
| Критерий качества | Нет перегруза: пользователь видит только high/critical развилки. |

**Модификация:** ввести severity scoring. Low/medium конфликты решает Synthesizer с trace; high/critical идут пользователю.

---

### 7.7. Artifact Workspace — Рабочий артефакт

| Параметр | Решение |
|---|---|
| Цель | Сделать результат живым, версионируемым, проверяемым. |
| Default state path | `artifact_build -> review -> completed/forge` |
| UI | Version history, diff viewer, patch reasons, export controls. |
| Guardrails | Нельзя скрывать существенные unresolved boundaries. |
| Artifact | Любой project output: MD, DOCX, plan, code, report, map. |
| Критерий качества | Можно понять, почему artifact стал таким. |

**Модификация:** добавить `Artifact Provenance Drawer`: какие claims, decisions, sources и approvals повлияли на фрагмент.

---

### 7.8. RAG / Knowledge Workflow — Работа со знаниями

| Параметр | Решение |
|---|---|
| Цель | Дать ответ или artifact по источникам. |
| Default state path | `intake -> preflight -> retrieval -> synthesis -> review -> completed` |
| UI | Answer + cited claims + “источников недостаточно”, если так. |
| Guardrails | Citation correctness, no hallucination outside sources. |
| Artifact | Cited answer / source map / evidence-backed artifact. |
| Критерий качества | Claim подтверждён источником или понижен до гипотезы. |

**Модификация:** сделать `Evidence Strip`: рядом с важным claim показывать source strength и boundary.

---

### 7.9. Tool / Approval Workflow — Инструмент с подтверждением

| Параметр | Решение |
|---|---|
| Цель | Безопасно выполнять read/write/tool actions. |
| Default state path | `tool_plan -> policy_check -> requires_action? -> tool_execution -> result_review -> completed` |
| UI | Preview/diff, approve once, approve for run, edit then approve, reject, explain. |
| Guardrails | Tool input/output guardrails, idempotency, audit, redaction. |
| Artifact | ToolCall record + ApprovalRequest + result patch. |
| Критерий качества | Пользователь понимает, что будет сделано до выполнения. |

**Модификация:** approval должен быть grouped action card, а не серия confirm dialogs.

---

### 7.10. Forge Workflow — Кузница / Материализация

| Параметр | Решение |
|---|---|
| Цель | Создать файл, код, экспорт, интеграцию или внешнее действие. |
| Default state path | `preflight -> artifact_plan -> policy_check -> sandbox/tool_execution -> QA -> approval/export -> completed` |
| UI | Plan → preview → sandbox/tool run → artifact QA → export. |
| Guardrails | Sandbox by risk, egress control, approval before side effects. |
| Artifact | File/code/export/action result. |
| Критерий качества | Безопасная материализация без sandbox-per-chat. |

**Модификация:** добавить `Forge Plan Preview`: что будет создано, где исполнится, какие данные уйдут наружу, сколько стоит, какие rollback options есть.

---

### 7.11. Durable AgentRun Workflow — Долгий запуск

| Параметр | Решение |
|---|---|
| Цель | Дать долгому workflow способность останавливаться, ждать, восстанавливаться. |
| Default state path | `queued -> running -> requires_action/waiting -> running -> completed/failed/cancelled/expired` |
| UI | Progress вместо spinner, resume/cancel/fork/retry. |
| Guardrails | Idempotency for side effects, deterministic replay boundaries. |
| Artifact | AgentRun event log + state snapshot + artifact links. |
| Критерий качества | Run можно восстановить без повторного выполнения внешних side effects. |

**Модификация:** не держать пользователя в неопределённости дольше интерактивного бюджета; переводить в background/progress mode.

---

### 7.12. ER Learning Workflow — Обучение различению

| Параметр | Решение |
|---|---|
| Цель | Обучать пользователя ЭР-методу на его собственном материале. |
| Default state path | `intake -> explanation -> applied_example -> user_try -> feedback -> completed` |
| UI | До/после: “как звучало” → “как точнее” → “почему”. |
| Guardrails | Не морализировать, не диагностировать, не создавать скрытый авторитет. |
| Artifact | Learning card / revised claim / boundary explanation. |
| Критерий качества | Пользователь лучше различает факт, гипотезу, интерпретацию, выбор. |

**Модификация:** добавить `Explain this distinction` рядом с Claim Card / Conflict Card.

---

### 7.13. Admin / Observability Workflow — Управление качеством

| Параметр | Решение |
|---|---|
| Цель | Дать команде управление качеством, стоимостью, безопасностью и semantic health. |
| Default state path | `observe -> diagnose -> configure -> validate -> rollout` |
| UI | Dashboards: latency, cost, failures, approvals, semantic violations, artifact usefulness. |
| Guardrails | Не показывать sensitive payloads без redaction. |
| Artifact | Eval report / release gate report / risk register update. |
| Критерий качества | Можно понять, где workflow ломается и почему. |

**Модификация:** ввести `Workflow Health Dashboard` по каждому WF, не только общий system dashboard.

---

## 8. Новый компонент: Workflow Router

### 8.1. Назначение

`WorkflowRouter` определяет, какой workflow запустить, исходя из намерения, сложности, риска, источников, требуемого результата и стоимости.

```ts
type WorkflowRoutingDecision = {
  selectedWorkflowId: string;
  selectedMode: 'fast' | 'studio' | 'lab' | 'forge';
  confidence: number;
  reasons: string[];
  userVisibleExplanation: string;
  estimatedCost?: CostEstimate;
  estimatedDurationClass: 'instant' | 'interactive' | 'progress' | 'background';
  riskClass: 'low' | 'medium' | 'high' | 'critical';
  requiresUserConsent: boolean;
  downgradeOptions: string[];
};
```

### 8.2. Правила маршрутизации

| Условие | Решение |
|---|---|
| Короткий вопрос без источников и tools | Fast |
| Документ / концепт / review / план | Studio |
| Сложная человеческая, ценностная или системная развилка | Lab после согласия |
| Файл, код, экспорт, внешнее действие | Forge |
| Неясная задача | Fast + clarifying micro-brief или предложение создать Mission |
| Высокий риск / высокая стоимость | Preflight + explicit consent |
| Недостаточно данных | Ask for missing critical input or downgrade output strength |

---

## 9. Новые UI-компоненты P0/P1

| Компонент | Приоритет | Назначение |
|---|---:|---|
| `WorkflowHeader` | P0 | Название WF, русский эквивалент, режим, статус, next action. |
| `ProgressRail` | P0 | Видимый progress для 3+ шагов. |
| `MissionBriefPanel` | P0 | Цель, контекст, критерии, ограничения, unknowns. |
| `ArtifactPane` | P0 | Главный рабочий artifact. |
| `ArtifactDiffViewer` | P0 | Что изменено и почему. |
| `ClaimCard` | P0 | Claim, тип, сила, источник, граница. |
| `DistinctionsSummary` | P0 | 3–5 главных различений. |
| `ConflictCard` | P0 | Развилка, варианты, цена, решение. |
| `ApprovalCard` | P0 | Preview/diff, approve/reject/edit. |
| `CostRiskPreflightCard` | P0 | Оценка стоимости, риска, времени, режима. |
| `TraceDrawer` | P1 | Events, sources, tools, cost, semantic checks. |
| `ForgePlanPreview` | P1 | План материализации до исполнения. |
| `WorkflowHealthDashboard` | P1 | Метрики по WF. |
| `LearningCard` | P2 | Объяснение различения на материале пользователя. |

---

## 10. Back-end / domain modifications

### 10.1. Новые таблицы / коллекции

| Entity | Назначение |
|---|---|
| `workflow_contracts` | Версионированные контракты workflow. |
| `workflow_runs` | Пользовательские запуски workflow поверх AgentRun/MissionRun. |
| `workflow_events` | Высокоуровневые события: stage changed, blocked, resumed, completed. |
| `mission_briefs` | Структурированный brief. |
| `claims` | Claim Ledger. |
| `domain_boundaries` | Границы применимости claims. |
| `artifact_patches` | Версионированные изменения артефактов. |
| `conflict_cards` | Развилки. |
| `decision_records` | Выборы пользователя и системные решения. |
| `approval_requests` | Approval lifecycle. |
| `workflow_quality_metrics` | Метрики качества по workflow. |

### 10.2. API surface

| Endpoint | Метод | Назначение |
|---|---|---|
| `/api/workflows` | GET | Список доступных workflow. |
| `/api/workflows/:id` | GET | Workflow contract. |
| `/api/workflow-runs` | POST | Создать workflow run. |
| `/api/workflow-runs/:id` | GET | Статус, progress, artifact links. |
| `/api/workflow-runs/:id/events` | GET/SSE | Event stream. |
| `/api/workflow-runs/:id/cancel` | POST | Отмена. |
| `/api/workflow-runs/:id/fork` | POST | Fork от текущего состояния. |
| `/api/workflow-runs/:id/resume` | POST | Resume после approval/input. |
| `/api/approvals/:id/decision` | POST | Approve/reject/edit. |
| `/api/artifacts/:id/patches` | GET/POST | Diff/patch operations. |

---

## 11. Quality gates по workflow

| Gate | Что проверяет | Минимальное требование |
|---|---|---|
| Routing Gate | WF выбран правильно | ≥ 90% на golden routing set. |
| Progress Gate | Пользователь понимает текущий stage | No indefinite spinner > интерактивного бюджета. |
| Semantic Gate | Claims/boundaries корректны | Claim type + strength + source + boundary для P0 claims. |
| Approval Gate | Risky action не проходит без approval | 100% для write/code/browser/privileged. |
| Artifact Gate | Итог traceable | Каждый significant patch имеет reason/source/decision link. |
| Recovery Gate | Ошибка имеет путь восстановления | Retry/edit/downgrade/cancel/fork. |
| Cost Gate | Нет неожиданной дорогой эскалации | Studio/Lab/Forge показывают preflight estimate. |
| Safety Gate | Нет hidden authority / psychodiagnosis | Regression suite green. |
| Observability Gate | Run диагностируем | TraceEvent coverage for model/retrieval/tool/approval/artifact/cost. |

---

## 12. Метрики workflow world-class уровня

| Метрика | Смысл |
|---|---|
| `workflow_completion_rate` | Доля WF, дошедших до meaningful result. |
| `time_to_first_visible_progress` | Как быстро пользователь понял, что происходит. |
| `time_to_artifact` | Время до первого usable artifact. |
| `decision_load` | Сколько решений система потребовала от пользователя. |
| `approval_fatigue_rate` | Доля approval, которые пользователь отклоняет/игнорирует как лишние. |
| `artifact_patch_acceptance_rate` | Доля patches, принятых пользователем. |
| `claim_boundary_violation_rate` | Где система говорила сильнее данных. |
| `conflict_card_usefulness_score` | Насколько карточки реально помогли выбору. |
| `forge_success_rate` | Успешная материализация без policy/sandbox failures. |
| `recovery_success_rate` | Успешное восстановление после error/wait/approval timeout. |
| `cost_per_usable_artifact` | Стоимость пригодного результата, а не ответа. |
| `workflow_downgrade_rate` | Как часто система снижала режим ради cost/risk. |
| `human_override_rate` | Как часто пользователь менял решение системы. |
| `semantic_eval_pass_rate` | Проход смысловых evals по WF. |

---

## 13. 90-дневный план модификации

### Фаза 1 — Workflow foundation / Weeks 1–2

| Deliverable | Owner | Result |
|---|---|---|
| `WorkflowContract` spec | Architect + Product | Все WF описаны как contracts. |
| Unified workflow state machine | Backend + Architect | Единая модель состояний. |
| WorkflowRouter v0 | Backend + Product | Fast/Studio/Lab/Forge routing. |
| Mission Room Shell wireframes | UX | Header, ProgressRail, ArtifactPane, DistinctionsPane. |
| Golden routing dataset v0 | Product + QA | 100 cases для маршрутизации. |

### Фаза 2 — User-visible workflow skeleton / Weeks 3–4

| Deliverable | Owner | Result |
|---|---|---|
| ProgressRail MVP | Frontend | Видимый progress для Mission/Studio/Lab/Forge. |
| MissionBriefPanel MVP | Frontend + Product | Guided intake. |
| WorkflowRun API MVP | Backend | Run status/events/cancel/resume. |
| CostRiskPreflightCard | UX + Backend | Перед дорогими/рисковыми WF. |
| TraceEvent mapping v0 | Backend | Stage/event coverage. |

### Фаза 3 — Artifact-first Studio / Weeks 5–6

| Deliverable | Owner | Result |
|---|---|---|
| ArtifactWorkspace MVP | Backend + Frontend | Versioned artifact. |
| ArtifactPatch model | Backend | Все role outputs как patches. |
| ArtifactDiffViewer | Frontend | Видимый diff. |
| RolePass contract v0 | Semantic + Backend | Observer/Boundary/Language/Critic/Synthesizer. |
| Studio E2E demo | Product + QA | Документ → review → patches → artifact. |

### Фаза 4 — Semantic workflow layer / Weeks 7–8

| Deliverable | Owner | Result |
|---|---|---|
| ClaimCard | Frontend + Semantic | Claim type/strength/source/boundary. |
| Claim Ledger API | Backend | Queryable claims. |
| DomainBoundary detector v0 | Semantic + ML | Strength downgrade. |
| DistinctionsSummary | Frontend | 3–5 главных различений. |
| Semantic eval runner | QA + Semantic | Golden tests. |

### Фаза 5 — Decisions and approvals / Weeks 9–10

| Deliverable | Owner | Result |
|---|---|---|
| ConflictCard MVP | Frontend + Semantic | Развилки и варианты. |
| DecisionRecord API | Backend | Human/system decisions. |
| ApprovalCard MVP | Frontend + Security | Preview/diff + approve/edit/reject. |
| PolicyEngine integration | Backend + Security | allow/deny/approval/downgrade. |
| Approval fatigue metrics | Product + Data | Контроль перегруза. |

### Фаза 6 — Durable and Forge readiness / Weeks 11–12

| Deliverable | Owner | Result |
|---|---|---|
| Durable Runtime integration | Runtime + SRE | pause/resume/cancel/retry. |
| ForgePlanPreview | UX + Backend | Материализация до исполнения. |
| Sandbox policy integration | Security + SRE | Risk-based sandbox. |
| Recovery paths | Backend + UX | retry/edit/downgrade/cancel/fork. |
| WorkflowHealthDashboard v0 | Data + PM | Метрики по WF. |

### Фаза 7 — Pilot hardening / Week 13

| Deliverable | Owner | Result |
|---|---|---|
| WF pilot demo script | PM | 5 demo workflows. |
| Release gate dashboard | QA + Data | Routing/semantic/cost/safety. |
| A/B vs current chat | Product | Доказательство улучшения. |
| Runbooks | SRE | Recovery and rollback. |
| Backlog update | PM | v2.3 план синхронизирован. |

---

## 14. Изменения в текущем roadmap v2.3

| Текущий элемент | Модификация |
|---|---|
| Sprint 5 Semantic Protocol PoC | Добавить `WorkflowContract` и `ClaimCard` как обязательные outputs. |
| Sprint 6 Mission + AgentRun API | Добавить `WorkflowRun API` над AgentRun. |
| Sprint 8 Policy/Approval | Добавить `ApprovalCard` + grouped approval UX + approval fatigue metrics. |
| Sprint 9 MVP | MVP должен показать не только AgentRun, а полный user-visible WF: intake → progress → artifact → decision. |
| Sprint 12 Role Passes + Artifact Workspace | Перенести часть ArtifactWorkspace в Weeks 5–6 как foundation, иначе Studio не докажет ценность. |
| Sprint 15 Observability | Начать WorkflowHealthDashboard раньше, с v0 в Weeks 11–12. |

---

## 15. Definition of Done для world-class workflow

Workflow считается реализованным на приемлемом уровне, если:

1. Есть `WorkflowContract` с entry/exit criteria, states, transitions, policies.
2. Пользователь видит выбранный workflow и почему он выбран.
3. Есть progress indicator для всех workflow из 3+ шагов.
4. Есть preflight для дорогих, долгих или risky workflow.
5. Есть artifact или явное объяснение, почему artifact не нужен.
6. Любое significant claim имеет type, strength, source, boundary.
7. Любое значимое изменение artifact имеет patch reason и trace.
8. Любой human decision фиксируется как `DecisionRecord`.
9. Любое side-effect действие требует idempotencyKey и audit event.
10. Risky action проходит через approval/preview/diff.
11. Ошибка не оставляет пользователя в тупике: есть retry/edit/downgrade/cancel/fork.
12. Workflow покрыт routing, semantic, approval, artifact и recovery tests.
13. Workflow имеет health metrics в dashboard.
14. Workflow можно отключить feature flag без поломки fast path.

---

## 16. Приоритеты реализации

### P0 — must build first

- `WorkflowContract`
- `WorkflowRouter`
- unified state machine
- `WorkflowRun API`
- Mission Room Shell
- ProgressRail
- MissionBriefPanel
- ArtifactWorkspace MVP
- ArtifactPatch
- ClaimCard
- ConflictCard
- ApprovalCard
- CostRiskPreflightCard
- basic WorkflowHealth metrics

### P1 — needed for beta

- TraceDrawer
- Artifact Provenance Drawer
- ForgePlanPreview
- Evidence Strip
- Workflow templates
- branching/forking
- grouped approvals
- semantic eval dashboard
- recovery UX

### P2 — after beta

- user-customizable workflows
- organization workflow schemes
- advanced simulation / scenario branches
- community/общность protocol
- workflow marketplace/templates
- visual workflow editor for admins

---

## 17. Риски и mitigation

| Риск | Вероятность | Влияние | Mitigation |
|---|---:|---:|---|
| Workflow UI перегрузит пользователя | High | High | Progressive disclosure, 3–5 distinctions, trace drawer hidden by default. |
| Lab будет запускаться слишком часто | Medium | High | Fast default, preflight estimate, explicit consent. |
| Approval fatigue | High | High | Severity scoring, grouped approvals, bounded trust. |
| Semantic layer станет красивым текстом | Medium | Critical | Structured Claim Ledger, evals, no free-form-only outputs. |
| Artifact patches будут непрозрачны | Medium | High | Patch reason + claim/decision links required. |
| Durable runtime повторит side effects | Medium | Critical | IdempotencyKey, side effects in tasks, replay-safe contracts. |
| Workflow contracts усложнят delivery | Medium | Medium | Начать с 4 canonical WF: Fast, Studio, Lab, Forge. |
| Observability появится слишком поздно | Medium | High | WorkflowHealthDashboard v0 до pilot. |

---

## 18. Минимальный MVP-scope

Для первого world-class MVP достаточно реализовать 4 workflow:

| Workflow | Почему входит в MVP |
|---|---|
| Fast Chat — Быстрый ответ | Защищает скорость и привычный UX. |
| Studio — Мастерская | Лучше всего демонстрирует artifact-first ценность. |
| Adequacy Mapping — Карта адекватности | Доказывает USP проекта. |
| Tool/Approval — Инструмент с подтверждением | Показывает безопасность и human-in-the-loop. |

Lab и Forge можно показывать как ограниченный internal beta path, но не как широкий MVP default.

---

## 19. Итоговая рекомендация

ChatAVG должен модифицировать проект не вокруг “режимов” и не вокруг “агентов”, а вокруг **workflow contracts + visible user progress + artifact-first execution + semantic trace + human decision points**.

Финальная формула модификации:

```text
ChatAVG Workflow Excellence =
  WorkflowContract
  + WorkflowRouter
  + Mission Room Shell
  + ProgressRail
  + ArtifactWorkspace
  + Claim / Boundary / Conflict UI
  + Approval as durable state
  + Guardrails at boundaries
  + Traceable artifact patches
  + WorkflowHealth metrics
```

---

## 20. Источники и практики, учтённые при подготовке

- Atlassian Jira workflows: статусы, переходы, resolutions, workflow schemes.
  - https://www.atlassian.com/software/jira/guides/workflows/overview
- IBM Carbon Design System: forms, progressive disclosure, progress indicators, accessibility.
  - https://carbondesignsystem.com/patterns/forms-pattern/
  - https://carbondesignsystem.com/components/progress-indicator/usage/
- Microsoft HAX Toolkit: evidence-based guidelines for human-AI interaction.
  - https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/
- OpenAI Agents SDK: human-in-the-loop, approvals, RunState, guardrails, tracing.
  - https://openai.github.io/openai-agents-python/human_in_the_loop/
  - https://openai.github.io/openai-agents-js/guides/guardrails/
  - https://openai.github.io/openai-agents-js/guides/tracing/
- OpenAI practical guide to building agents: layered guardrails and agent deployment principles.
  - https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/
- LangGraph durable execution: persistence, pause/resume, human-in-the-loop, replay/idempotency.
  - https://docs.langchain.com/oss/javascript/langgraph/durable-execution
- ServiceNow workflow/approval practice: workflow versioning, avoiding infinite loops, approval coordination, subflows.
  - https://www.servicenow.com/community/user-group-info/workflows-best-practices/ta-p/2311471
