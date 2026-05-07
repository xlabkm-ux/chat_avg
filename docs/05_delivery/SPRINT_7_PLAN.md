# План выполнения: Sprint 7 — Durable Runtime (Temporal-first)

**Цель:** Перенести исполнение долгих (long-running) миссий и `AgentRun` в Durable Runtime, используя Temporal, чтобы защитить HTTP-процессы от "зависаний" и реализовать надежный стейт-тракинг (Signals, Retries, Wait).

## Шаг 1: Документация и архитектурные контракты
- **Задача:** Разработать `SPEC-009-DURABLE_RUNTIME.md` (контракты Temporal).
- **Детали:** Определить форматы сигналов (`approve`, `cancel`), тайм-ауты и Payload Policy (как передаем большие артефакты — не в History Temporal, а по ссылке/ID).
- **Ожидаемый результат:** `docs/04_specs/SPEC-009-DURABLE_RUNTIME.md` создан.

## Шаг 2: Установка Temporal SDK и настройка окружения
- **Задача:** Добавить зависимости Temporal.
- **Детали:**
  - Запустить `npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity` в `cons/chatavg`.
  - Обновить `src/core/config.js` для поддержки Temporal URL и флага `TEMPORAL_RUNTIME_ENABLED`.

## Шаг 3: Инициализация Temporal Worker и Client
- **Задача:** Настроить клиентский код и воркеры в `src/modules/temporal/`.
- **Детали:**
  - `temporal.client.js`: клиент для запуска воркфлоу из API.
  - `temporal.worker.js`: инстанс воркера, привязанный к Task Queue (например, `agent-runs-queue`).

## Шаг 4: Реализация AgentRun Workflow
- **Задача:** Оркестровать `AgentRun` внутри Temporal.
- **Детали:**
  - `workflows.js`: Реализовать `agentRunWorkflow(runId, context)`.
  - Цикл воркфлоу: `model step` -> `semantic step` -> `wait-for-approval` -> `retry/cancellation`.
  - Механизм `wf.setHandler` для перехвата сигналов извне.

## Шаг 5: Реализация Temporal Activities
- **Задача:** Подключить существующий бизнес-код в виде Activities.
- **Детали:**
  - `activities.js`:
    - `fetchModelResponse(prompt, models)`
    - `runSemanticProtocol(payload)`
    - `updateRunState(runId, state)` (работа с SQLite через `run.service.js`)

## Шаг 6: Интеграция с ChatService и RunService
- **Задача:** Подменить in-memory вызовы на Temporal Client.
- **Детали:**
  - В `run.service.js` (при создании AgentRun): Если `TEMPORAL_RUNTIME_ENABLED=true`, стартовать Temporal Workflow.
  - Иначе: использовать fallback-вариант исполнения.

## Шаг 7: Документация операционной поддержки (Runbook)
- **Задача:** Написать инструкции для восстановления.
- **Детали:** Создать `docs/09_runbooks/RUNBOOK-001-TEMPORAL_RECOVERY.md`.
- **Ожидаемый результат:** Файл с командами запуска dev-кластера и восстановлением воркеров.

## Шаг 8: Тестирование и Baseline
- **Задача:** Убедиться, что Worker стартует и Workflow выполняется.
- **Детали:** Написать unit-тесты (с использованием `@temporalio/testing`), проверить graceful degradation и signals.
