# 📋 REMEDIATION_BACKLOG.md

Этот бэклог содержит задачи по устранению несоответствий между текущим состоянием репозитория и целевой архитектурой ChatAVG v2.3.

## Sprint R0: Reality lock and repo hygiene — ✅ Завершён 2026-05-08
- [x] Пересмотреть `PROJECT_BACKLOG.md` и исправить статусы.
- [x] Создать `CURRENT_REALITY_AUDIT.md`.
- [x] Создать `REMEDIATION_BACKLOG.md` (этот файл).
- [x] Обновить `.gitignore`.
- [x] Очистить Git index от `dist/` (если есть).
- [x] Перегенерировать `PROJECT_MAP.md`.
- [x] Добавить `README_HANDOVER.md`.
- [x] Зафиксировать `RELEASE_BLOCKERS.md`.

## Sprint R1: Production safety hardening (P0) — ✅ Завершён 2026-05-08
- [x] Sandbox fail-closed: запретить `LocalAdapter` в prod.
- [x] Secure boot: обязательный `CHATAVG_ADMIN_PASSWORD` в prod.
- [x] Route-level security: аудит всех sensitive routes.
- [x] Audit hardening: логирование всех security-sensitive действий.

## Sprint R2: AgentRun durability foundation (P0) — ✅ Завершён 2026-05-08
- [x] Persisted event log: запись событий в БД.
- [x] Recoverable SSE stream: поддержка `sinceEventId`.
- [x] Strict state machine: валидация переходов состояний.
- [x] Idempotency foundation: таблица `idempotency_keys`.

## Sprint R3: Temporal production workflow (P0) — ✅ Завершён 2026-05-08
- [x] Workflow contract: формализация входов/выходов.
- [x] Signals & Queries: управление активными ранами.
- [x] Real activities: замена моков на реальную логику.
- [x] Replay safety & failure semantics.

## Sprint R4: Semantic Layer v0.2 (P1) — ✅ Завершён 2026-05-08
- [x] Persisted Claim Ledger: таблицы для claims, boundaries, events.
- [x] Source spans: привязка к конкретным участкам текста (offsets).
- [x] Hybrid extractor: LLM (skeleton/flag) + rule-based (offsets).
- [x] Domain Boundary v0.2: reality levels и strength policy.
- [x] Semantic eval seed: 30-50 golden cases (golden_set.json).

## Sprint R5: KnowledgeGateway MVP (P1) — ✅ Завершён 2026-05-08
- [x] Real retriever adapter: SQLite FTS5.
- [x] Ingestion pipeline: регистрация и чанкинг источников.
- [x] Citation contract: привязка ответов к чанкам через `<context_boundary>`.
- [x] Answerability policy: отказ от ответа при низком качестве контекста.

## Sprint R6: Policy / Tool / Approval control plane (P1)
- [ ] Policy input/output spec: расширение `PolicyDecision`.
- [ ] Tool Registry hardening: версионирование и валидация схем.
- [ ] Approval lifecycle: превью и аудит решений.
- [ ] Cost control: префлайт эстимейты и бюджеты.

## Sprint R7: Architecture boundary refactor (P1)
- [ ] Split ChatService: выделение контроллеров, шлюзов и middleware.
- [ ] ModelGateway boundary: вынос логики выбора провайдера.
- [ ] Configuration cleanup: разделение конфигов по модулям.

## Sprint R8: QA, observability and release readiness (P1/P2) — ✅ Завершён 2026-05-08
- [x] Replace dashboard placeholders: реальные метрики вместо заглушек.
- [x] Trace and metrics: расширение событий Trace Bus.
- [x] Load & Chaos tests.
- [x] Security review & Release package.
