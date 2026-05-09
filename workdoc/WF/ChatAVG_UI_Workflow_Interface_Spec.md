# ChatAVG v2.3 — Визуальные интерфейсные решения для workflow мирового уровня

**Документ:** `UI-WF-SPEC-001`  
**Статус:** Draft for Product / UX / Frontend / Architecture Review  
**Дата:** 9 мая 2026  
**Версия:** 1.0  
**Назначение:** визуально-интерфейсная спецификация ChatAVG как минималистичной, рабочей, traceable workflow-системы для миссий, артефактов, решений и действий.  
**Связанные документы:**  
- `ChatAVG_Project_Concept_Appendix_User_Workflows_formatted.md`
- `ChatAVG_World_Class_Workflow_Modification_Plan.md`
- `ChatAVG_v2.3_Optimized_Delivery_Plan_Sprints_Testing.md`
- `ChatAVG_Technical_Concept_v2_New_Architecture.docx`
- `ChatAVG_v2_05_Architecture_Implementation.docx`

---

## 1. Главная визуальная позиция

ChatAVG не должен выглядеть как “чат с боковыми панелями”. Он должен выглядеть как **минималистичная рабочая комната миссии**, где пользователь быстро понимает:

1. что мы сейчас делаем;
2. на каком шаге workflow находимся;
3. какой артефакт собирается;
4. какие утверждения имеют границы;
5. где требуется решение человека;
6. что будет сделано системой до выполнения действия;
7. почему система предложила именно это.

Визуальная формула:

```text
Mission Cockpit =
  минимальный chat/intake
  + центральный artifact workspace
  + правый слой различений / решений / источников
  + верхний workflow status
  + нижний trace/action layer по необходимости
```

Главная цель интерфейса — **рабочая эффективность и снижение искажений**, а не демонстрация сложности AI.

---

## 2. Внешние практики, которые нужно адаптировать

| Источник практики | Что взять | Как применить в ChatAVG |
|---|---|---|
| **GitHub Pull Request Review** | Diff, inline comments, viewed status, review summary, checks. | ArtifactPatch, inline semantic comments, progress by reviewed sections, approval/reject changes. |
| **JupyterLab** | Workspace, main work area, collapsible sidebars, tabs, command palette. | Mission Room как workspace: artifact center, sources/claims/actions sidebars, command palette. |
| **Electronic Lab Notebook / ELN** | Structured entries, protocols, observations, audit, collaboration, searchable records. | Mission Log: observations, decisions, versions, approvals, reproducible trace. |
| **Clinical Decision Support / CDS Hooks** | Cards with urgency indicator, source, suggestions, links, hidden non-urgent details. | ConflictCard / ApprovalCard / EvidenceCard с severity, source, suggestions, “view details”. |
| **Microsoft Human-AI Guidelines** | Explain capability, uncertainty, easy correction, efficient dismissal, why system acted. | Все AI suggestions должны иметь “почему”, “исправить”, “скрыть”, “понизить режим”. |
| **Carbon Design System** | Data tables, expandable rows, toolbar actions, empty states, progressive detail. | Claim Ledger, Source Table, Trace Table, Workflow Dashboard, empty Mission states. |
| **Medical alert fatigue research** | Снижать повторяемые и слабые alerts; показывать только action-relevant alerts. | Не перегружать пользователя warnings; группировать approvals и ConflictCards по severity. |

---

## 3. Визуальные принципы ChatAVG

### 3.1. Минимализм не равен пустоте

Минимализм ChatAVG — это:

- меньше декоративных блоков;
- меньше “AI theater”;
- меньше псевдоглубоких подсказок;
- больше структуры;
- больше явных границ;
- больше управляемых действий;
- больше полезного пространства для артефакта.

### 3.2. Главная рабочая площадь принадлежит артефакту

Во всех workflow уровня Studio/Lab/Forge центральная зона должна принадлежать не чату, а **Artifact Workspace**.

```text
Wrong:
  Chat transcript = 80%
  Artifact = attachment / export button

Right:
  Artifact = 60–70%
  Workflow / distinctions / decisions = 20–30%
  Chat/intake = compact, contextual
```

### 3.3. Любое важное утверждение должно быть визуально проверяемым

Каждый важный claim должен иметь:

- тип: fact / experience / interpretation / hypothesis / recommendation / value choice;
- силу: strong / moderate / weak / hypothesis-only / question-only;
- источник;
- область определения;
- причину downgrade, если сила снижена.

### 3.4. Human sovereignty должна быть видна в интерфейсе

В местах выбора интерфейс должен явно показывать:

- “система может рекомендовать”;
- “решение остаётся за человеком”;
- “цена варианта”;
- “что будет, если ничего не выбрать”;
- “можно отложить / изменить / отклонить”.

---

## 4. Базовая структура экрана Mission Cockpit

### 4.1. Desktop layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Bar: Mission name · Workflow · Mode · Status · Cost/Risk · User actions │
├───────────────┬─────────────────────────────────────────────┬────────────────┤
│ Left Rail     │ Main Artifact Workspace                     │ Right Panel    │
│               │                                             │                │
│ Missions      │ Document / plan / map / code / decision     │ Distinctions   │
│ Sources       │ Diff / versions / comments                  │ Claims         │
│ Runs          │                                             │ Conflicts      │
│ Templates     │                                             │ Approvals      │
│ Command       │                                             │ Sources        │
├───────────────┴─────────────────────────────────────────────┴────────────────┤
│ Bottom Drawer: Trace · Logs · Cost · Tool calls · Retrieval · Debug, hidden  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Tablet layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Top Bar                                                      │
├──────────────────────────────────────────────────────────────┤
│ Artifact Workspace                                           │
├──────────────────────────────────────────────────────────────┤
│ Tabs: Distinctions · Claims · Conflicts · Approvals · Trace  │
└──────────────────────────────────────────────────────────────┘
```

### 4.3. Mobile layout

```text
┌────────────────────────────┐
│ Mission Header             │
├────────────────────────────┤
│ Current Step / Next Action │
├────────────────────────────┤
│ Artifact Preview           │
├────────────────────────────┤
│ Primary Card               │
│ claim / conflict / approval│
├────────────────────────────┤
│ Bottom Nav: Chat Artifact  │
│ Claims Decisions More      │
└────────────────────────────┘
```

На мобильном нельзя пытаться показать весь cockpit. Мобильный интерфейс должен быть режимом **review / approval / quick continuation**, а не полноценной лабораторией.

---

## 5. Глобальные навигационные элементы

### 5.1. Top Bar

| Элемент | Назначение | Поведение |
|---|---|---|
| Mission title | Что решаем или создаём | Editable, но с history. |
| Workflow name | Какой WF выбран | Click opens WorkflowContract summary. |
| Mode badge | Fast / Studio / Lab / Forge | Цвет/иконка без декоративности. |
| Status badge | current state | Created, mapping, requires action, etc. |
| Risk / Cost badge | риск и стоимость | Compact: Low / Medium / High + estimate. |
| Primary action | следующий шаг | “Review”, “Approve”, “Continue”, “Export”. |
| Overflow | вторичные действия | Fork, cancel, archive, settings. |

### 5.2. Left Rail

| Раздел | Назначение |
|---|---|
| Missions | Список активных миссий. |
| Workspace | Текущие документы/артефакты. |
| Sources | Подключённые материалы. |
| Runs | История запусков. |
| Templates | Workflow templates. |
| Command | Быстрый вызов команд. |

### 5.3. Right Panel

Правая панель должна быть контекстной. Она не всегда показывает одно и то же.

| Контекст | Правая панель |
|---|---|
| Intake | Briefing fields, missing input. |
| Mapping | Distinctions, Claim Cards. |
| Artifact editing | Patch reasons, inline claims, comments. |
| Conflict | ConflictCard and options. |
| Approval | ApprovalCard and preview. |
| Forge | ForgePlanPreview, sandbox/tool status. |
| Review | Quality checklist, unresolved boundaries. |

---

## 6. Цветовая и визуальная система

### 6.1. Общая эстетика

Стиль: **calm technical minimalism**.

- Белый/тёмный нейтральный фон.
- Очень слабые разделители.
- Моноширинные элементы только для кода, trace, ids, diffs.
- Цвет используется только для статуса, риска, выбора и ошибок.
- Минимум иллюстраций.
- Иконки простые, 16–20 px.
- Основной плотный режим для power users.
- Расширенный comfortable режим для новых пользователей.

### 6.2. Цветовые роли

| Роль | Использование |
|---|---|
| Neutral | Основной текст, панели, card background. |
| Blue / Primary | Основное действие, активный stage. |
| Green | Завершено, accepted, verified. |
| Amber | Warning, weak boundary, needs review. |
| Red | Critical, blocked, unsafe, denied. |
| Purple | Semantic / ER layer. |
| Gray | Hidden / archived / dismissed / low confidence. |

### 6.3. Severity badges

| Badge | Значение | Где используется |
|---|---|---|
| `info` | Информационно | EvidenceCard, source note. |
| `warning` | Требует внимания | Claim downgrade, medium conflict. |
| `critical` | Требует решения/approval | High-risk action, unresolved conflict. |

---

## 7. Основные UI-компоненты

## 7.1. WorkflowHeader

**Назначение:** пользователь всегда должен видеть, какой workflow запущен, в каком режиме и что дальше.

```text
[Mission: Архитектура ChatAVG] [Studio / Мастерская] [mapping]
Risk: Medium · Cost: ~$0.42 · Next: Review Claims
```

| Поле | Обязательность |
|---|---|
| Mission title | P0 |
| Workflow English/Russian name | P0 |
| Mode | P0 |
| Current state | P0 |
| Next action | P0 |
| Cost/risk | P0 for Studio/Lab/Forge |
| Run health | P1 |

---

## 7.2. ProgressRail

**Назначение:** убрать неопределённость и “вечный spinner”.

```text
Briefing ✓
Mapping ●
Role passes ○
Conflicts ○
Artifact ○
Review ○
Forge ○
```

| Правило | Требование |
|---|---|
| Показывать максимум 7 крупных шагов. | Детализацию скрывать в TraceDrawer. |
| Текущий шаг должен иметь понятное название. | Не “processing”, а “Mapping claims”. |
| Если blocked, показать причину. | “Waiting for your decision”. |
| Если long-running, показать last event. | “3 sources retrieved, 12 claims extracted”. |

---

## 7.3. MissionBriefPanel

**Назначение:** превратить хаотичный запрос в рабочую миссию.

| Поле | UI |
|---|---|
| Goal | One-line editable field. |
| Context | Text area / source chips. |
| Success criteria | Checklist. |
| Constraints | Chips + free text. |
| Unknowns | Inline list. |
| Desired artifact | Select: doc / plan / map / code / decision / export. |
| Sensitivity | Low / medium / high. |

**Минималистичный режим:** показывать только Goal, Artifact, Constraints. Остальное — “More brief details”.

---

## 7.4. ArtifactWorkspace

**Назначение:** главный результат находится в центре.

| Возможность | Приоритет |
|---|---|
| Rich Markdown editor / viewer | P0 |
| Version history | P0 |
| Diff mode | P0 |
| Inline comments | P0 |
| Patch accept/reject | P0 |
| Export | P1 |
| Section provenance | P1 |
| Split view: source vs artifact | P1 |
| Multi-artifact tabs | P2 |

### Визуальный паттерн

```text
Artifact Title
────────────────────────────────────────────
Section 1
  text...
  [claim: fact · strong · source 2]

Section 2
  text...
  [boundary warning]
────────────────────────────────────────────
Patch suggestions:
  Accept all safe patches · Review risky patches
```

---

## 7.5. ArtifactDiffViewer

**Заимствование из инженерной практики:** GitHub Pull Request review.

| Элемент | Как применить |
|---|---|
| Added / removed / changed blocks | Показать изменения artifact. |
| Inline comment | Обсуждение конкретного фрагмента. |
| Mark viewed | Пользователь закрывает проверенную секцию. |
| Request changes | Вернуть workflow в `working`. |
| Approve | Перевести в `review/completed/forge`. |

### Основные действия

- Accept patch
- Reject patch
- Edit before accept
- Ask why
- Show supporting claim
- Mark section reviewed

---

## 7.6. ClaimCard

**Назначение:** сделать смысловые утверждения интерфейсно проверяемыми.

```text
Claim
“Текущая архитектура должна использовать risk-based sandboxing.”

Type: recommendation
Level: system / architecture
Strength: moderate
Evidence: Technical Concept, v2.3 plan
Boundary: Applies to Forge/code/browser/write actions, not simple chat.
Risk: overgeneralization
Action: Use in artifact · Downgrade · Ask for source
```

| Поле | Обязательность |
|---|---|
| claim_text | P0 |
| claim_type | P0 |
| allowed_strength | P0 |
| evidence/source | P0 |
| domain_boundary | P0 |
| distortion_risk | P1 |
| action buttons | P0 |

### Цветовая логика силы утверждения

| Strength | Visual |
|---|---|
| strong | solid neutral + verified icon |
| moderate | neutral badge |
| weak | amber subtle |
| hypothesis-only | dashed border |
| question-only | gray / question mark |

---

## 7.7. DistinctionsSummary

**Назначение:** не показывать пользователю весь Claim Ledger сразу.

```text
Главные различения:
1. Факт: текущий план требует fast path.
2. Гипотеза: Semantic UI может перегрузить пользователя.
3. Граница: Forge нужен не для обычного чата.
4. Развилка: показывать claims всегда или по запросу?
```

Правило: максимум 5 пунктов, каждый открывается в ClaimCard.

---

## 7.8. ConflictCard

**Назначение:** визуализировать человеческую развилку.

```text
Conflict: Скорость vs смысловая полнота

Option A: Fast answer
+ Быстро
- Меньше проверки границ

Option B: Studio workflow
+ Артефакт и claims
- Дольше и дороже

Recommendation: Studio, если результат будет использоваться командой.
Decision needed: Выберите режим.
```

| Элемент | Обязательность |
|---|---|
| Conflict statement | P0 |
| Why it matters | P0 |
| 2–4 options | P0 |
| Cost / consequence per option | P0 |
| System recommendation | P1 |
| User decision buttons | P0 |
| Defer option | P1 |

---

## 7.9. ApprovalCard

**Назначение:** заменить тревожные confirm-dialogs на проверяемый action card.

```text
Approve action: Export document to Google Drive

What will happen:
- Create file: ChatAVG_Workflow_Spec.md
- Destination: /Project/Docs
- Data leaving ChatAVG: artifact content only

Risk: Low
Cost: none
Rollback: delete exported file manually

[Approve once] [Edit before approve] [Reject] [More details]
```

### Approval actions

| Action | Смысл |
|---|---|
| Approve once | Разовое разрешение. |
| Approve for this run | Разрешение внутри текущего WF. |
| Edit then approve | Пользователь меняет input/action. |
| Reject | Отклонить. |
| Reject with reason | Отклонить и улучшить policy/prompt. |
| Defer | Отложить. |

---

## 7.10. EvidenceCard / EvidenceStrip

**Назначение:** показать источник рядом с утверждением, не перегружая экран.

```text
Evidence: 3 sources
Strongest: Technical Concept v2.1
Coverage: architecture decision, not UX detail
```

### EvidenceStrip inline

```text
Risk-based sandboxing is required for Forge actions. [source · boundary]
```

Click opens EvidenceCard.

---

## 7.11. SourceTable

**Основа:** Carbon-like dense data table.

| Column | Meaning |
|---|---|
| Source | Название файла/URL/connector. |
| Type | doc / code / repo / web / user input. |
| Used in claims | Count. |
| Strength | high / medium / low. |
| Freshness | date / unknown. |
| Actions | Open, cite, exclude, inspect. |

Функции:

- search;
- filter;
- sort;
- expandable row;
- batch exclude/include;
- source quality badge.

---

## 7.12. TraceDrawer

**Назначение:** дать инженерам/исследователям прозрачность без перегруза обычного пользователя.

Tabs:

| Tab | Содержимое |
|---|---|
| Events | state changes, run events. |
| Model | model calls, latency, cost. |
| Retrieval | queries, sources, scores. |
| Tools | tool calls, inputs preview, outputs. |
| Policy | allow/deny/approval/downgrade. |
| Semantic | claim extraction, downgrades, conflicts. |
| Cost | estimate vs actual. |

TraceDrawer скрыт по умолчанию и открывается из Top Bar.

---

## 7.13. ForgePlanPreview

**Назначение:** до исполнения показать, что будет материализовано.

```text
Forge Plan

Artifact: UI-WF-SPEC-001.md
Execution: local file generation
Sandbox: not required
External action: none
Estimated cost: low
Risks: no external side effect
Approval: not required

[Run Forge] [Edit plan] [Cancel]
```

Для risky Forge:

```text
Sandbox: E2B
Network: disabled except allowed domains
Files: 3 input files, 1 output file
Approval: required before external write
```

---

## 7.14. EmptyState

**Назначение:** пустые состояния должны вести пользователя, а не просто сообщать “нет данных”.

Примеры:

### Empty Mission

```text
У вас пока нет миссии.
Создайте миссию из ситуации, документа, задачи или конфликта.

[Создать миссию] [Загрузить документ] [Начать с быстрого вопроса]
```

### Empty Claims

```text
Claim Ledger пока пуст.
Он появится после этапа Mapping.

[Запустить Mapping] [Что такое Claim Ledger?]
```

### Empty Artifact

```text
Артефакт ещё не создан.
Сначала нужно уточнить цель и желаемый тип результата.

[Собрать Mission Brief]
```

---

## 8. Интерфейсные решения по workflow

## 8.1. Fast Chat — Быстрый ответ

### Layout

```text
Chat centered
Compact source/uncertainty chips
Button: “Развернуть в миссию”
```

### UI requirements

| Элемент | Требование |
|---|---|
| Chat input | P0 |
| Answer | P0 |
| Confidence/boundary note | P1 |
| Save as mission | P0 |
| Expand into Studio/Lab | P0 |
| No heavy panels by default | P0 |

### Минималистичный паттерн

Если система видит, что запрос может стать миссией:

```text
Этот вопрос можно решить быстро или развернуть в Studio workflow.

[Ответить быстро] [Создать миссию]
```

---

## 8.2. Mission Room — Комната миссии

### Layout

```text
Left: Mission list / sources
Center: Mission Brief + Artifact
Right: Distinctions / Decisions
Top: WorkflowHeader + ProgressRail
```

### Key screens

1. Mission intake
2. Brief confirmation
3. Mapping summary
4. Artifact build
5. Conflict decision
6. Review / export

### UI rule

Mission Room не должен начинаться с пустого большого textarea. Он должен начинаться с **Mission Brief Builder**.

---

## 8.3. Studio Workflow — Мастерская

### Layout

```text
Center: Artifact editor/diff
Right: Patch reasons + ClaimCards
Bottom: Review summary
```

### Key components

| Component | Purpose |
|---|---|
| ArtifactWorkspace | Центральная работа. |
| DiffViewer | Проверка изменений. |
| PatchQueue | Список предложенных patches. |
| ClaimCard | Почему patch предложен. |
| ReviewSummary | Approve/request changes. |

### Popular engineer pattern

Studio должен ощущаться как **Pull Request для смыслового артефакта**:

- изменения видны;
- комментарии привязаны к строкам/фрагментам;
- можно принять/отклонить patch;
- можно оставить unresolved discussion;
- есть summary before merge.

---

## 8.4. Lab Workflow — Лаборатория

### Layout

```text
Top: high-level progress
Center: Adequacy Map / Scenario Map
Right: ConflictCards / TrajectoryQuestions
Bottom: Trace hidden
```

### UI requirements

| Элемент | Требование |
|---|---|
| Preflight | До запуска Lab. |
| Progress mode | Обязательно. |
| Role activity | Compact, not theatrical. |
| ConflictCards | Только high-value. |
| TrajectoryQuestions | Без diagnosis / score. |
| Decision points | Ясные и редкие. |

### Lab anti-patterns

Запрещено:

- показывать “дебаты агентов” как шоу;
- бесконечно добавлять cards;
- использовать “глубину” как score;
- делать вид, что система знает сущность пользователя;
- требовать решения на каждом малом шаге.

---

## 8.5. Adequacy Mapping — Карта адекватности

### Layout

```text
Center: Observation Map / Claim Ledger
Right: selected ClaimCard
Top: filters by claim type / strength / level
```

### Views

| View | Для кого |
|---|---|
| Summary | Пользователь по умолчанию. |
| Ledger | Power user / researcher / reviewer. |
| Boundary Map | Semantic lead / advanced user. |
| Distortion Hypotheses | Осторожный review. |

### Claim Ledger table

| Claim | Type | Strength | Source | Boundary | Risk | Action |
|---|---|---|---|---|---|---|
| ... | fact | strong | doc | project scope | low | use |
| ... | hypothesis | weak | input | needs check | medium | ask |

---

## 8.6. Conflict Card Workflow — Карта развилки

### Layout

```text
Single card focus
Options as comparable columns
Decision buttons sticky
```

### UI rule

ConflictCard должна быть похожа на **clinical decision card**, а не на философское эссе.

```text
Conflict
What is at stake
Option A / B / C
Consequences
Recommended if...
Decision
```

### Actions

- Choose A
- Choose B
- Ask for consequences
- Defer
- Convert to task
- Discuss with human / team

---

## 8.7. Artifact Workspace — Рабочий артефакт

### Layout

```text
Document center
Version timeline left or hidden
Patch drawer right
Inline provenance markers
```

### Modes

| Mode | Назначение |
|---|---|
| Write | Редактирование. |
| Review | Проверка patches. |
| Diff | Сравнение версий. |
| Provenance | Источники/claims/decisions. |
| Export | Финализация. |

### Visual markers

| Marker | Meaning |
|---|---|
| Small source icon | Утверждение имеет источник. |
| Boundary icon | Есть ограничение области применимости. |
| Warning dot | Есть unresolved risk. |
| Decision icon | Фрагмент зависит от решения пользователя. |
| Patch icon | Фрагмент создан/изменён RolePass. |

---

## 8.8. RAG / Knowledge Workflow — Работа со знаниями

### Layout

```text
Search/source results left
Answer/artifact center
Evidence/claims right
```

### UI features

| Feature | Purpose |
|---|---|
| Source chips | Быстро видеть, какие источники использованы. |
| EvidenceStrip | Источник рядом с claim. |
| SourceTable | Управление источниками. |
| Citation inspector | Проверка citation. |
| Missing evidence banner | Честное указание нехватки источников. |

### Banner examples

```text
Недостаточно источников для сильного вывода.
Ответ будет собран как гипотеза.
```

```text
Найдены источники, но они относятся к старой версии архитектуры.
Сила вывода снижена.
```

---

## 8.9. Tool / Approval Workflow — Инструмент с подтверждением

### Layout

```text
Tool plan card
Preview / diff
Approval actions
Audit note
```

### ApprovalCard variants

| Variant | When |
|---|---|
| Read-only | Доступ к источнику / retrieval. |
| Write | Создание/изменение файла. |
| Send | Отправка email/message. |
| Code | Исполнение кода. |
| External | API/tool with external side effect. |

### Minimal rule

Пользователь должен видеть не “Разрешить tool?”, а:

```text
Что будет сделано
Какие данные будут использованы
Куда они уйдут
Можно ли откатить
Что произойдёт после approve
```

---

## 8.10. Forge Workflow — Кузница / Материализация

### Layout

```text
Forge Plan
Execution monitor
Output artifact
QA checklist
Export/approve
```

### Forge visual stages

1. Plan
2. Inputs
3. Risk / sandbox
4. Execute
5. Validate
6. Export

### Output screen

```text
Forge result
Status: completed
Files: 1 generated
Warnings: 0
Open artifact · Download · Send to workspace · Create next mission
```

---

## 8.11. Durable AgentRun — Долгий запуск

### Layout

```text
Run timeline
Current stage
Waiting reason
Actions: resume / cancel / fork
```

### Visual status rules

| Condition | UI |
|---|---|
| Running < interactive budget | Inline progress. |
| Running > interactive budget | Convert to background progress. |
| Waiting approval | Sticky ApprovalCard. |
| Failed recoverably | RecoveryCard. |
| Failed unrecoverably | Error report + fork option. |

---

## 8.12. ER Learning — Обучение различению

### Layout

```text
Before/After card
Explanation
Try-it-yourself micro prompt
```

### LearningCard

```text
Было:
“Это точно значит, что команда саботирует проект.”

Точнее:
“Есть гипотеза о сопротивлении команды, но пока видны только задержки и несогласованные ожидания.”

Почему:
Факт задержек был смешан с интерпретацией мотива.
```

Actions:

- Apply this wording
- Show more examples
- Hide learning cards
- Practice on my text

---

## 8.13. Admin / Observability — Управление качеством

### Layout

```text
WorkflowHealthDashboard
Filters: workflow / team / version / period
Cards: completion, cost, latency, semantic violations, approval fatigue
Tables: failed runs, policy downgrades, unresolved conflicts
```

### Dashboard widgets

| Widget | Purpose |
|---|---|
| Workflow completion | Где пользователи не доходят до результата. |
| Time to artifact | Скорость создания ценности. |
| Claim boundary violations | Где система говорит слишком сильно. |
| Approval fatigue | Где approvals раздражают. |
| Cost per usable artifact | Экономика workflow. |
| Recovery success | Надёжность. |
| Semantic eval pass | Качество ЭР-слоя. |

---

## 9. Command Palette

Для инженеров, исследователей и power users обязательна command palette.

Shortcut:

```text
⌘K / Ctrl+K
```

Команды:

| Command | Action |
|---|---|
| Create mission | Новая миссия. |
| Convert to Studio | Развернуть текущий чат. |
| Run mapping | Запустить Adequacy Mapping. |
| Show claims | Открыть Claim Ledger. |
| Create conflict card | Создать развилку. |
| Export artifact | Экспорт. |
| Fork mission | Ветка от текущего состояния. |
| Show trace | Открыть TraceDrawer. |
| Toggle dense mode | Dense/comfortable. |
| Search sources | Поиск по источникам. |

---

## 10. Keyboard-first workflow

ChatAVG должен быть удобен для инженеров, исследователей, аналитиков и врачей, которые ценят скорость.

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + K` | Command palette |
| `Ctrl/Cmd + Enter` | Submit / continue |
| `Ctrl/Cmd + Shift + M` | Create Mission |
| `Ctrl/Cmd + Shift + A` | Open Artifact |
| `Ctrl/Cmd + Shift + C` | Claims |
| `Ctrl/Cmd + Shift + D` | Decisions |
| `Ctrl/Cmd + Shift + T` | Trace |
| `A` | Accept selected patch |
| `R` | Reject selected patch |
| `E` | Edit selected patch |
| `V` | Mark section viewed |
| `Esc` | Dismiss drawer/card |

---

## 11. Density modes

| Mode | Для кого | Поведение |
|---|---|---|
| Comfortable | Новые пользователи | Больше воздуха, подсказки, fewer columns. |
| Dense | Engineers / scientists | Больше таблиц, меньше отступов, больше данных. |
| Presentation | Review / stakeholder | Скрыть trace, показать artifact and decisions. |
| Clinical / High-stakes | Sensitive tasks | Больше источников, warning hierarchy, confirmation. |

---

## 12. Минимальная дизайн-система компонентов

### 12.1. Tokens

| Token group | Examples |
|---|---|
| Spacing | 4 / 8 / 12 / 16 / 24 / 32 |
| Radius | 6 / 8 / 12 |
| Typography | 12 meta, 14 body, 16 section, 20 title |
| Elevation | none / subtle / overlay |
| Border | 1px neutral / severity border |
| Status | info / success / warning / critical / blocked |

### 12.2. Component library P0

| Component | Needed by |
|---|---|
| WorkflowHeader | all WF |
| ProgressRail | Mission/Studio/Lab/Forge |
| MissionBriefPanel | Mission |
| ArtifactWorkspace | Studio/Lab/Forge |
| ArtifactDiffViewer | Studio |
| ClaimCard | Adequacy/Studio/Lab |
| ConflictCard | Lab/Mission |
| ApprovalCard | Tool/Forge |
| EvidenceStrip | RAG/Studio |
| SourceTable | RAG |
| TraceDrawer | all advanced |
| CostRiskPreflightCard | Lab/Forge/Tool |
| EmptyState | all |
| RecoveryCard | Durable AgentRun |
| LearningCard | ER Learning |

---

## 13. Экранные шаблоны

## 13.1. New Mission Screen

```text
What are we working on?
[ Goal input ]

What should be produced?
[ Document ] [ Plan ] [ Decision map ] [ Code ] [ Review ] [ Other ]

What material should be used?
[ Upload ] [ Paste text ] [ Connect source ] [ Start empty ]

Constraints
[ deadline ] [ audience ] [ risk ] [ length ] [ format ]

[Create Mission]
```

---

## 13.2. Studio Review Screen

```text
WorkflowHeader
ProgressRail

┌───────────────────────────────┬──────────────────────┐
│ Artifact diff                 │ Patch reasons        │
│                               │ ClaimCard            │
│ + Added section               │ Source               │
│ - Removed sentence            │ Boundary             │
│                               │ [Accept] [Edit]      │
└───────────────────────────────┴──────────────────────┘

Review summary:
12 patches · 9 safe · 3 need review
[Accept safe patches] [Review risky] [Request more work]
```

---

## 13.3. Lab Decision Screen

```text
ConflictCard

Conflict:
Speed of MVP vs semantic integrity

Options:
A. Ship without full Claim Ledger
B. Ship with Claim Ledger MVP
C. Delay MVP until full Semantic Protocol

Price:
A: lower quality risk
B: balanced
C: time risk

[Choose B] [Ask consequences] [Defer]
```

---

## 13.4. Forge Execution Screen

```text
Forge Plan
- Create file
- Run formatter
- Validate markdown
- Export to workspace

Risk: Low
Sandbox: Not required
Approval: Not required

[Run] [Edit plan] [Cancel]

After run:
Generated file · Validation passed · Open / Download / Attach to Mission
```

---

## 14. UX anti-patterns

Запрещённые решения:

| Anti-pattern | Почему вредно |
|---|---|
| Большой чат как главный UI для всех задач | Теряется artifact-first логика. |
| Постоянный поток “агенты думают” | Театр агентности, шум, недоверие. |
| Слишком много карточек различений | Когнитивная перегрузка. |
| Modal approval на каждое действие | Approval fatigue. |
| Скрытые изменения артефакта | Нарушает trust и audit. |
| “AI confidence 92%” | Ложная точность. |
| Depth / adequacy score | Противоречит ЭР и создаёт hidden authority. |
| Однотипные красные warnings | Десенситизация пользователя. |
| Скрытая стоимость Lab/Forge | Нарушает control and trust. |
| Нет пути назад | Нельзя исправить ошибку AI. |

---

## 15. Accessibility and safety

### 15.1. Accessibility

| Требование | Решение |
|---|---|
| Keyboard navigation | Все critical actions доступны с клавиатуры. |
| Screen reader labels | Cards, badges, severity имеют text labels. |
| Color not sole indicator | Severity дублируется текстом/icon. |
| Focus management | Drawers/cards возвращают focus. |
| Reduced motion | Progress animation отключаемая. |
| Dense mode readable | Минимальный font 12–13 px только для meta, не body. |

### 15.2. Safety UX

| Risk | UI response |
|---|---|
| High-risk action | ApprovalCard with preview and rollback. |
| Weak evidence | Boundary warning, downgraded strength. |
| Sensitive personal content | Safe language, no diagnosis. |
| External write/send | Explicit destination and payload. |
| Model uncertainty | Ask / downgrade / show unknown. |

---

## 16. Implementation plan для UI

### Phase 1 — UI foundation / 2 weeks

| Deliverable | Owner |
|---|---|
| Design tokens | UX + Frontend |
| Mission Cockpit layout | UX |
| WorkflowHeader | Frontend |
| ProgressRail | Frontend |
| EmptyState library | Frontend |
| CommandPalette skeleton | Frontend |

### Phase 2 — Artifact-first Studio / 2 weeks

| Deliverable | Owner |
|---|---|
| ArtifactWorkspace MVP | Frontend + Backend |
| ArtifactDiffViewer | Frontend |
| PatchQueue | Frontend |
| Inline comments | Frontend |
| Review summary | Frontend |

### Phase 3 — Semantic UI / 2 weeks

| Deliverable | Owner |
|---|---|
| ClaimCard | Frontend + Semantic |
| DistinctionsSummary | Frontend |
| Claim Ledger Table | Frontend |
| EvidenceStrip | Frontend |
| SourceTable | Frontend |

### Phase 4 — Decisions / approvals / Forge / 2 weeks

| Deliverable | Owner |
|---|---|
| ConflictCard | Frontend + Product |
| ApprovalCard | Frontend + Security |
| CostRiskPreflightCard | Frontend + Backend |
| ForgePlanPreview | Frontend + SRE |
| RecoveryCard | Frontend |

### Phase 5 — Observability and hardening / 2 weeks

| Deliverable | Owner |
|---|---|
| TraceDrawer | Frontend + Backend |
| WorkflowHealthDashboard v0 | Frontend + Data |
| Accessibility pass | QA |
| Dense mode | Frontend |
| Mobile review mode | Frontend |

---

## 17. MVP interface scope

Для первого production-quality MVP достаточно:

| Screen / Component | Must-have |
|---|---|
| Fast Chat with “Expand to Mission” | Yes |
| New Mission Screen | Yes |
| Mission Cockpit Shell | Yes |
| ProgressRail | Yes |
| MissionBriefPanel | Yes |
| ArtifactWorkspace | Yes |
| ArtifactDiffViewer | Yes |
| ClaimCard | Yes |
| DistinctionsSummary | Yes |
| ConflictCard | Yes |
| ApprovalCard | Yes |
| CostRiskPreflightCard | Yes |
| SourceTable | Yes |
| TraceDrawer basic | Yes |
| ForgePlanPreview basic | Yes |
| WorkflowHealthDashboard | Internal only |

---

## 18. Definition of Done для UI

Интерфейс workflow считается готовым, если:

1. Пользователь видит название workflow, режим, статус и next action.
2. Workflow из 3+ шагов имеет ProgressRail.
3. Центральная зона показывает artifact или объясняет, почему artifact ещё не создан.
4. Любой significant claim открывается как ClaimCard.
5. Любое изменение artifact можно увидеть как diff.
6. Любой risky action имеет ApprovalCard с preview.
7. Любая high/critical развилка имеет ConflictCard.
8. Пользователь может dismiss/correct/fork/cancel, где это уместно.
9. Нет hidden authority: система не говорит сильнее данных.
10. Empty states ведут к следующему действию.
11. Dense mode работает без потери читаемости.
12. Mobile mode позволяет review/approve/continue.
13. TraceDrawer доступен для power users и диагностики.
14. Все статусы и severity доступны без цвета.
15. UI покрыт e2e smoke для Fast, Studio, Adequacy, Approval, Forge.

---

## 19. Итоговая рекомендация

ChatAVG должен визуально стать не “AI chat app”, а **минималистичной рабочей средой для точного мышления и создания артефактов**.

Финальная формула интерфейса:

```text
Minimal surface
  + Artifact as center
  + Claims as inspectable structure
  + Conflicts as decision cards
  + Approvals as durable actions
  + Trace hidden but available
  + Progress always visible
  + Dense power-user mode
```

Если пользователь работает быстро — он видит простой интерфейс.  
Если задача сложная — система раскрывает структуру.  
Если решение рискованное — система показывает preview, цену, источник и границы.  
Если AI ошибся — пользователь может исправить, отклонить, понизить режим или fork.

---

## 20. Ссылки на внешние источники практик

- GitHub Docs — Reviewing proposed changes in a pull request: https://docs.github.com/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/reviewing-proposed-changes-in-a-pull-request
- GitHub Docs — Commenting on a pull request: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/commenting-on-a-pull-request
- JupyterLab documentation — The JupyterLab Interface: https://jupyterlab.readthedocs.io/en/stable/user/interface.html
- Harvard Medical School Data Management — Electronic Lab Notebooks: https://datamanagement.hms.harvard.edu/electronic-lab-notebooks
- eCAT Electronic Lab Notebook paper: https://link.springer.com/article/10.1186/1759-4499-1-4
- Microsoft Research — Guidelines for Human-AI Interaction: https://www.microsoft.com/en-us/research/blog/guidelines-for-human-ai-interaction-design/
- IBM Carbon Design System — Data table usage: https://v10.carbondesignsystem.com/components/data-table/usage/
- IBM Carbon Design System — Empty states: https://v10.carbondesignsystem.com/patterns/empty-states-pattern/
- HL7 CDS Hooks — Cards, indicators, sources and suggestions: https://cds-hooks.hl7.org/1.0/
- BMC Medical Informatics — Alert fatigue in clinical decision support: https://bmcmedinformdecismak.biomedcentral.com/articles/10.1186/s12911-017-0430-8
- NASA Earthdata — Science Discovery Engine UI efficiency: https://www.earthdata.nasa.gov/news/improved-user-interface-science-discovery-engine
