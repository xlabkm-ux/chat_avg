# ChatAVG v2.3 — RC2 Roadmap: Durable Runtime, MCP, RAG & Semantic Stabilization

**Версия документа:** 1.0  
**Дата:** 2026-05-09  
**Статус:** Planned after RC1 Stabilization  
**Основание:** крупные фичи из исходного release plan, вынесенные из RC1 scope.

---

## 1. Цель RC2

RC1 должен стабилизировать gateway: P0 runtime bugs, sandbox safety, security boot, project entry, test harness и минимальную provider/MCP compatibility.

RC2 начинается только после RC1 sign-off.

**Цель RC2:** перевести крупные подсистемы из состояния skeleton / mock / partial integration в устойчивое production-like состояние:

1. MCP Gateway hardening.
2. Durable Runtime / Temporal hardening.
3. Real Knowledge Gateway / RAG.
4. Semantic Layer persistence.
5. Full integration QA для этих подсистем.

---

## 2. RC2 Scope

### Входит в RC2

- Полноценный MCP Gateway streaming.
- Tool/search events через MCP и provider adapters.
- Hardened Temporal activities.
- Workflow replay safety.
- AgentRun event coverage.
- Production SQLite FTS5 retriever.
- Ingestion pipeline.
- Answerability policy.
- Citation validation.
- Persistent Claim Ledger.
- Artifact versioning / diff.
- Semantic extraction tuning.
- RC2 regression, integration, load и chaos gates.

### Не входит в RC2

- Production handover / canary rollout.
- Full UX/mobile polish.
- Advanced dashboard time-series charts.
- Long-term cost optimization.
- Multi-tenant enterprise controls beyond existing security gates.

Эти задачи остаются для RC3 / Production Handover.

---

## 3. RC2 Entry Criteria

RC2 нельзя начинать, пока не закрыты RC1 gates.

| Gate | Требование |
|---|---|
| RC1-G0 Runtime | Все P0 runtime bugs исправлены |
| RC1-G1 Sandbox Safety | Local command execution blocked by default |
| RC1-G2 Security Boot | Production fail-fast работает |
| RC1-G3 Project Entry | Root setup/test/start работает |
| RC1-G4 Provider Compatibility | system/search/tool events не ломают flow |
| RC1-G5 Regression | `npm run test:release` green или documented accepted exceptions |
| RC1-G6 Security | `npm run test:security` green |
| RC1-G7 Report | `RELEASE_CANDIDATE_REPORT_RC1.md` создан и закоммичен |

---

# Sprint RC2-A — MCP Gateway Hardening

**Цель:** MCP-шлюз должен корректно передавать streaming, tool events и search events без потери контекста.

---

## RC2-A.1 — SSE Streaming в `ai.chat` и `ai.responses`

**Файл:** `cons/mcp_gateway/server.js`

**Проблема:**  
В исходном плане отмечено, что MCP Gateway не имеет SSE streaming и теряет tool events. В RC1 оставляется только минимальная compatibility-проверка. В RC2 нужно сделать полноценный streaming.

**Исправление:**

- Убрать принудительный `stream: false`, если клиент запросил stream.
- Реализовать SSE-compatible output для `ai.chat`.
- Реализовать SSE-compatible output для `ai.responses`.
- Обновить MCP adapter, чтобы он отдавал provider events как delta/tool/status events.

**Acceptance:**

- Пользователь видит live-токены через MCP category.
- `[DONE]` приходит ровно один раз.
- Соединение закрывается корректно.
- Client disconnect не оставляет висячих обработчиков.

---

## RC2-A.2 — Tool Call events в MCP response formatter

**Файлы:**

- `cons/mcp_gateway/server.js`
- `cons/chatavg/src/modules/providers/adapters/mcp.js`

**Проблема:**  
`file_search_call`, `web_search_call` и другие output item events могут игнорироваться форматтером.

**Исправление:**

- Добавить обработку:
  - `response.output_item.added`
  - `response.output_item.done`
  - `response.web_search_call.*`
  - `response.file_search_call.*`
  - tool call started / completed / failed
- Для UI отдавать status delta:
  - `[search_started]`
  - `[search_completed]`
  - `[tool_started]`
  - `[tool_completed]`

**Acceptance:**

- Tool/search events видны в stream или debug log.
- Неизвестный event type не роняет запрос.
- Unknown event логируется как debug, но не как provider failure.

---

## RC2-A.3 — System instructions contract

**Файлы:**

- `cons/chatavg/src/modules/providers/adapters/openai_prompt_file_search.js`
- `cons/chatavg/src/modules/providers/adapters/openai_responses_compat.js`
- `cons/chatavg/src/modules/providers/adapters/mcp.js`

**Цель:**  
Во всех provider paths `system` / `instructions` должны вести себя одинаково.

**Правило:**

- Chat messages с `role: system` конвертируются в `instructions`.
- Category `system_prompt` не теряется.
- Если используется `prompt.id`, конфликт system-prompt должен быть явно разрешен:
  - либо merge;
  - либо reject с понятной ошибкой;
  - либо documented precedence.

**Acceptance:**

- Contract tests покрывают OpenAI Responses, prompt/file_search и MCP paths.
- Debug log показывает финальный payload.
- System prompt не исчезает ни в streaming, ни в non-streaming.

---

## Gate RC2-A

```bash
cd cons/chatavg

npm run test:unit
npm run test:contract
npm run test:integration
```

Manual:

```bash
# 1. MCP category + stream=true -> live deltas visible
# 2. file_search_call visible in debug/tool events
# 3. web_search_call visible in debug/tool events
# 4. system_prompt visible in final provider payload
# 5. client disconnect before [DONE] cleans up stream
```

Commit:

```bash
git add -A
git commit -m "Feat(RC2-A): MCP Gateway streaming, tool events, and system instruction contract"
git push origin main
```

---

# Sprint RC2-B — Durable Runtime / Temporal Hardening

**Цель:** AgentRun / Temporal должен перестать быть mock path и стать устойчивым durable runtime.

---

## RC2-B.1 — Hardened Temporal Activities

**Файл:** `cons/chatavg/src/modules/temporal/activities.js`

**Проблема:**  
Activities используют mock latency, mock model output, random semantic result и неполную бизнес-логику.

**Исправление:**

- `runModelStep` должен вызывать реальный model gateway или service boundary.
- `runSemanticStep` должен использовать реальный SemanticProtocol.
- `createApprovalRequest` должен создавать approval request через production service.
- `finalizeRun` должен фиксировать итоговый artifact/result.
- Для длительных операций добавить heartbeat.
- Ошибки activities должны быть typed и audit-friendly.

**Acceptance:**

- Нет `Math.random()` для production decision.
- Нет mock sleep как бизнес-логики.
- Все activity failures пишут event в `agent_run_events`.
- Workflow может продолжить работу после worker restart.

---

## RC2-B.2 — Workflow Replay Safety

**Файл:** `cons/chatavg/src/modules/temporal/workflows.js`

**Проблема:**  
Workflow-код должен быть replay-safe. Внутри workflow нельзя использовать недетерминированную логику.

**Исправление:**

- Убрать `Date.now()` и `Math.random()` из workflow path.
- Использовать Temporal-safe APIs.
- Все внешние side effects только через activities.
- Все approval waits — через signals/conditions.

**Acceptance:**

- Worker restart не ломает replay.
- Temporal replay test проходит.
- Workflow determinism violation отсутствует.

---

## RC2-B.3 — AgentRun events 100% coverage

**Файлы:**

- `cons/chatavg/src/modules/execution/run.service.js`
- `cons/chatavg/src/modules/execution/run.repository.js`
- `cons/chatavg/src/modules/temporal/activities.js`

**Правило:**  
Каждый state transition должен иметь event:

```txt
run.status_changed
```

Каждый значимый шаг должен иметь event:

```txt
model.requested
model.delta
model.step_completed
semantic.analysis_started
semantic.analysis_completed
approval.created
approval.resolved
artifact.created
run.completed
run.failed
```

**Acceptance:**

- SSE `/api/runs/:id/events` восстанавливает backlog после reconnect.
- Event payload содержит `previousState`, `currentState`, `reason`, `timestamp`.
- Cancel/failed/expired paths покрыты тестами.

---

## Gate RC2-B

```bash
cd cons/chatavg

npm run test:execution
npm run test:integration
npm run test:remediation
```

Manual with Temporal dev cluster:

```bash
# 1. Start Temporal dev server
# 2. Start worker
# 3. Create AgentRun
# 4. Restart worker mid-run
# 5. Verify workflow resumes or fails with typed recoverable error
# 6. Verify agent_run_events has full transition history
```

Commit:

```bash
git add -A
git commit -m "Feat(RC2-B): Harden Temporal durable runtime and AgentRun event coverage"
git push origin main
```

---

# Sprint RC2-C — Knowledge Gateway: Real RAG

**Цель:** заменить mock retriever на реальный retrieval pipeline с answerability и citations.

---

## RC2-C.1 — Production SQLite FTS5 Retriever

**Файлы:**

- `cons/chatavg/src/modules/knowledge/knowledge.gateway.js`
- `cons/chatavg/src/modules/knowledge/adapters/sqlite_fts.adapter.js`
- `cons/chatavg/src/modules/knowledge/knowledge.repository.js`

**Проблема:**  
Knowledge Gateway находится в mock/partial состоянии. RC2 должен дать реальный локальный retriever.

**Исправление:**

- SQLite FTS5 index.
- Chunk table.
- Source metadata table.
- Ranking score.
- Query normalization.
- Configurable topK.
- Configurable min relevance threshold.

**Acceptance:**

- По загруженному документу retrieval возвращает реальные chunks.
- Нерелевантный вопрос возвращает low-confidence / refusal.
- Latency retrieval path измеряется и логируется.

---

## RC2-C.2 — Ingestion Pipeline

**Файлы:**

- `cons/chatavg/src/modules/knowledge/ingestion.service.js`
- `cons/chatavg/src/modules/knowledge/knowledge.router.js`
- optional CLI: `scripts/ingest_knowledge.js`

**Исправление:**

- API для загрузки документа.
- CLI для локальной индексации.
- Chunking по размеру и границам текста.
- Source id / document id.
- Deduplication по content hash.
- Re-indexing strategy.

**Acceptance:**

- Можно загрузить `.txt` / `.md` документ.
- После ingestion документ доступен в retrieval.
- Повторная загрузка не создает дубликаты.
- Ошибки ingestion typed и отображаются в API.

---

## RC2-C.3 — Answerability Policy

**Файлы:**

- `knowledge.gateway.js`
- `chat.service.js`

**Правило:**  
Если retrieved context слабый, модель не должна уверенно отвечать.

**Исправление:**

- `shouldRefuse` по threshold.
- Refusal message в OpenAI-compatible response.
- Debug metadata:
  - topK
  - score
  - source ids
  - refusal reason

**Acceptance:**

- Релевантный вопрос получает ответ с context.
- Нерелевантный вопрос получает отказ.
- Refusal не считается provider error.

---

## RC2-C.4 — Citation Validation

**Файлы:**

- `knowledge.gateway.js`
- optional: `citation.validator.js`

**Исправление:**

- Каждый citation должен ссылаться на retrieved chunk/source.
- Нельзя отдавать citation на источник, которого не было в retrieval.
- Если модель генерирует unsupported citation — помечать/удалять/понижать confidence.

**Acceptance:**

- Ответ содержит citations только из retrieved chunks.
- Citation validation tests покрывают:
  - valid citation;
  - missing source;
  - hallucinated citation;
  - stale citation.

---

## Gate RC2-C

```bash
cd cons/chatavg

npm run test:knowledge
npm run eval:rag
npm run test:integration
```

Manual:

```bash
# 1. Ingest test document
# 2. Ask relevant question -> answer uses real document content
# 3. Ask irrelevant question -> refusal
# 4. Validate citations map to retrieved chunks
# 5. Restart server -> indexed docs remain available
```

Commit:

```bash
git add -A
git commit -m "Feat(RC2-C): Real Knowledge Gateway with FTS5, ingestion, answerability, and citations"
git push origin main
```

---

# Sprint RC2-D — Semantic Layer Stabilization

**Цель:** Semantic Layer должен сохранять claims/events и быть воспроизводимым после restart.

---

## RC2-D.1 — Persistent Claim Ledger

**Файлы:**

- `cons/chatavg/src/modules/semantic/claim.ledger.js`
- `cons/chatavg/src/modules/semantic/semantic.repository.js`
- `cons/chatavg/src/modules/semantic/semantic.protocol.js`
- `cons/chatavg/src/core/sqlite.js`

**Проблема:**  
Semantic state частично in-memory. После restart часть контекста может теряться.

**Исправление:**

- Все claims сохранять в SQLite.
- Все semantic events сохранять в SQLite.
- Boundaries/violations сохранять в SQLite.
- Восстановление ledger по sessionId/missionId.

**Acceptance:**

- После restart claims доступны.
- Duplicate claims не размножаются бесконтрольно.
- Semantic events видны в audit/debug/reporting path.

---

## RC2-D.2 — Artifact Versioning & Diff

**Файлы:**

- `cons/chatavg/src/modules/execution/artifact.service.js`
- optional: `artifact.repository.js`

**Исправление:**

- Версионирование artifacts.
- Patch history.
- Diff metadata.
- Link artifact version to AgentRun / Mission.
- Поддержка rollback или readonly historical view.

**Acceptance:**

- Каждый patch создает новую версию.
- Можно получить diff между версиями.
- Artifact history survives restart.

---

## RC2-D.3 — Hybrid Extraction Tuning

**Файлы:**

- `claim.extractor.js`
- `domain.boundary.js`
- `semantic.protocol.js`
- `tests/semantic/*`

**Исправление:**

- Настроить thresholds.
- Убрать самые шумные false positives.
- Добавить golden set.
- Задокументировать ограничения rule-based extraction.

**Acceptance:**

- `npm run eval:semantic` проходит.
- Accuracy target для rule-based extractor: минимум 40%.
- Regression по known bad cases не ухудшается.

---

## Gate RC2-D

```bash
cd cons/chatavg

npm run eval:semantic
npm run eval:semantic:full
npm run test:semantic
npm run test:remediation
```

Если `test:semantic` еще не существует — добавить script:

```json
{
  "test:semantic": "node --test tests/semantic/*.test.js"
}
```

Manual:

```bash
# 1. Run several chat requests with semantic enabled
# 2. Restart server
# 3. Verify claims and semantic events persist
# 4. Patch artifact twice
# 5. Verify diff/history survives restart
```

Commit:

```bash
git add -A
git commit -m "Feat(RC2-D): Persistent Semantic Layer, artifact versioning, and extraction tuning"
git push origin main
```

---

# Sprint RC2-E — Integration, Load & Chaos QA

**Цель:** доказать, что крупные RC2 подсистемы работают вместе.

---

## RC2-E.1 — Full RC2 Regression

```bash
cd cons/chatavg

npm run test:release
npm run test:security
npm run test:integration
npm run test:execution
npm run test:knowledge
npm run eval:rag
npm run eval:semantic
```

---

## RC2-E.2 — Cross-subsystem scenarios

Проверить end-to-end сценарии:

### Scenario 1 — MCP streaming + tool event

```txt
User -> Chat API -> MCP Gateway -> OpenAI Responses -> tool/search event -> stream back to UI
```

Expected:

- deltas visible;
- tool event visible;
- stream closes;
- no duplicated `[DONE]`.

### Scenario 2 — AgentRun + Temporal + Semantic

```txt
Mission -> AgentRun -> Temporal workflow -> model step -> semantic check -> approval wait -> final event
```

Expected:

- all state transitions persisted;
- approval flow works;
- restart worker does not break replay.

### Scenario 3 — RAG + Answerability + Citation

```txt
Ingest document -> Ask relevant question -> Retrieve chunks -> Answer -> Validate citations
```

Expected:

- answer grounded in chunks;
- citations valid;
- irrelevant question refuses.

### Scenario 4 — Semantic persistence

```txt
Chat response -> claims extracted -> restart server -> claims visible
```

Expected:

- claim ledger survives restart;
- no duplicate explosion.

---

## RC2-E.3 — Load / Chaos

Minimum checks:

- 100 concurrent SSE sessions.
- 50 AgentRun event streams.
- Provider disconnect during streaming.
- Temporal worker restart mid-run.
- Knowledge DB unavailable / locked.
- MCP Gateway unavailable.
- Server restart during active AgentRun.

Expected:

- no process crash;
- typed errors;
- recoverable degradation where possible;
- events/audit record failure.

---

## RC2-E.4 — RC2 Report

**Файл:** `docs/05_delivery/RELEASE_CANDIDATE_REPORT_RC2.md`

Template:

```md
# ChatAVG v2.3 RC2 Report

## Commit
<commit sha>

## Scope
- MCP Gateway hardening
- Temporal durable runtime
- Real Knowledge Gateway / RAG
- Semantic persistence
- RC2 integration QA

## Test Results
| Suite | Result | Notes |
|---|---|---|
| test:release | pass/fail | |
| test:security | pass/fail | |
| test:integration | pass/fail | |
| test:execution | pass/fail | |
| test:knowledge | pass/fail | |
| eval:rag | pass/fail | |
| eval:semantic | pass/fail | |

## Manual Scenarios
| Scenario | Result | Evidence |
|---|---|---|
| MCP streaming + tool event | pass/fail | |
| AgentRun + Temporal + Semantic | pass/fail | |
| RAG + citations | pass/fail | |
| Semantic persistence after restart | pass/fail | |
| Worker restart mid-run | pass/fail | |
| Provider disconnect during stream | pass/fail | |

## Known Limitations
- UX polish is RC3.
- Production handover is not part of RC2.
- Canary rollout requires separate production checklist.
```

---

## Gate RC2-E

```bash
cd cons/chatavg

npm run test:release
npm run test:security
npm run test:integration
npm run test:execution
npm run test:knowledge
npm run eval:rag
npm run eval:semantic
```

Commit:

```bash
git add -A
git commit -m "QA(RC2-E): RC2 integration, load, chaos, and release report"
git push origin main
```

---

# 4. RC2 Release Gates Matrix

| Gate | Sprint | Критерий | Статус |
|---|---|---|---|
| RC2-G0 | Entry | Все RC1 gates закрыты | 🔴 |
| RC2-G1 | MCP | Streaming работает, tool/search events видны | 🔴 |
| RC2-G2 | Instructions | System prompt/instructions не теряются во всех provider paths | 🔴 |
| RC2-G3 | Temporal | Activities не mock, workflow replay-safe | 🔴 |
| RC2-G4 | AgentRun | 100% state transition events persisted | 🔴 |
| RC2-G5 | Knowledge | Real FTS5 retrieval работает после ingestion | 🔴 |
| RC2-G6 | Answerability | Low-confidence queries получают refusal | 🔴 |
| RC2-G7 | Citations | Citations валидируются против retrieved chunks | 🔴 |
| RC2-G8 | Semantic | Claim Ledger persists after restart | 🔴 |
| RC2-G9 | Artifacts | Artifact versions/diffs persist after restart | 🔴 |
| RC2-G10 | Regression | Full RC2 test suite green | 🔴 |
| RC2-G11 | Chaos | Provider/Temporal/MCP failure не роняет процесс | 🔴 |
| RC2-G12 | Report | RC2 report создан и закоммичен | 🔴 |

---

# 5. RC2 Exit Criteria

RC2 считается завершенным, если:

1. Все RC2-G0…RC2-G12 закрыты или имеют documented accepted exception.
2. `RELEASE_CANDIDATE_REPORT_RC2.md` содержит результаты тестов и ручных сценариев.
3. Нет открытых P0/P1 дефектов по:
   - sandbox safety;
   - streaming lifecycle;
   - Temporal replay;
   - RAG citations;
   - semantic persistence.
4. Известные ограничения явно перенесены в RC3 / Production Handover.
5. Последний commit/tag зафиксирован.

Recommended tag:

```bash
git tag v2.3-rc2
git push origin v2.3-rc2
```

---

# 6. RC3 / Post-RC2 Backlog

Следующие задачи не должны блокировать RC2.

## RC3 — UX / Observability / Product Polish

- Canonical Error UI/UX.
- Latency optimization: TTFT P95 target.
- Admin Dashboard time-series charts.
- Mobile audit:
  - iOS Safari;
  - Android Chrome;
  - safe-area;
  - touch targets.
- Better debug UI for:
  - provider params;
  - MCP tool events;
  - RAG chunks;
  - semantic claims.

## Production Handover

- DB migration runbook.
- Shadow deployment.
- Canary 10% → 50% → 100%.
- Production checklist:
  - `NODE_ENV=production`
  - `E2B_API_KEY` set
  - `CHATAVG_ADMIN_PASSWORD` from ENV
  - `ALLOW_LOCAL_COMMAND_EXECUTION` unset
  - SSL/TLS configured
  - rate limiting active
  - debug logs disabled
- 24h stability observation.
- Handover docs and runbooks.

---

# 7. Final Recommendation

RC2 не должен быть production handover.  
RC2 должен доказать, что крупные подсистемы, вынесенные из RC1, стали реально работающими и интегрированными:

- MCP streams,
- Temporal runtime,
- real RAG,
- citations,
- semantic persistence,
- artifact history,
- integration QA.

Production rollout начинается только после RC2 report и отдельного production readiness review.
