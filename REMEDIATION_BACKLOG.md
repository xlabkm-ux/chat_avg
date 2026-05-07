# 📋 REMEDIATION_BACKLOG.md

Этот бэклог содержит задачи по устранению несоответствий между текущим состоянием репозитория и целевой архитектурой ChatAVG v2.3.

## Sprint R0: Reality lock and repo hygiene (В процессе)
- [x] Пересмотреть `PROJECT_BACKLOG.md` и исправить статусы.
- [x] Создать `CURRENT_REALITY_AUDIT.md`.
- [ ] Создать `REMEDIATION_BACKLOG.md` (этот файл).
- [ ] Обновить `.gitignore`.
- [ ] Очистить Git index от `dist/` (если есть).
- [ ] Перегенерировать `PROJECT_MAP.md`.
- [ ] Добавить `README_HANDOVER.md`.
- [ ] Зафиксировать `RELEASE_BLOCKERS.md`.

## Sprint R1: Production safety hardening (P0)
- [ ] Sandbox fail-closed: запретить `LocalAdapter` в prod.
- [ ] Secure boot: обязательный `CHATAVG_ADMIN_PASSWORD` в prod.
- [ ] Route-level security: аудит всех sensitive routes.
- [ ] Audit hardening: логирование всех security-sensitive действий.

## Sprint R2: AgentRun durability foundation (P0)
- [ ] Persisted event log: запись событий в БД.
- [ ] Recoverable SSE stream: поддержка `sinceEventId`.
- [ ] Strict state machine: валидация переходов состояний.
- [ ] Idempotency foundation: таблица `idempotency_keys`.

## Sprint R3: Temporal production workflow (P0)
- [ ] Workflow contract: формализация входов/выходов.
- [ ] Signals & Queries: управление активными ранами.
- [ ] Real activities: замена моков на реальную логику.
- [ ] Replay safety & failure semantics.

## Sprint R4: Semantic Layer v0.2 (P1)
- [ ] Persisted Claim Ledger: таблицы для claims, boundaries, events.
- [ ] Source spans: привязка к конкретным участкам текста.
- [ ] Hybrid extractor: LLM + rule-based.
- [ ] Semantic eval seed: 30-50 golden cases.

## Sprint R5: KnowledgeGateway MVP (P1)
- [ ] Real retriever adapter: SQLite FTS5 или локальный индекс.
- [ ] Ingestion pipeline: регистрация и чанкинг источников.
- [ ] Citation contract: строгая привязка ответов к чанкам.
- [ ] Answerability policy: отказ от ответа при пустом контексте.

## Sprint R6: Policy / Tool / Approval control plane (P1)
- [ ] Policy input/output spec: расширение `PolicyDecision`.
- [ ] Tool Registry hardening: версионирование и валидация схем.
- [ ] Approval lifecycle: превью и аудит решений.
- [ ] Cost control: префлайт эстимейты и бюджеты.

## Sprint R7: Architecture boundary refactor (P1)
- [ ] Split ChatService: выделение контроллеров, шлюзов и middleware.
- [ ] ModelGateway boundary: вынос логики выбора провайдера.
- [ ] Configuration cleanup: разделение конфигов по модулям.

## Sprint R8: QA, observability and release readiness (P1/P2)
- [ ] Replace dashboard placeholders: реальные метрики вместо заглушек.
- [ ] Trace and metrics: расширение событий Trace Bus.
- [ ] Load & Chaos tests.
- [ ] Security review & Release package.
