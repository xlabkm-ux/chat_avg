# MIGRATION-001: V1 Fallback & Rollback Guide

## Обзор
ChatAVG v2.3 вводит новые слои: Semantic Layer, AgentRuns (Temporal Runtime), Model/Tool Gateways. Если в процессе MVP-релиза возникают критические проблемы, система предоставляет механизмы быстрого отката на V1 (Fast Path) без необходимости полного отката кода.

## Feature Flags (Degradation)
Основной механизм отката базируется на переменных окружения в `src/core/config.js`. При отключении новых функций система деградирует (graceful degradation) до простых чатов.

### Отключение Semantic Layer
```env
SEMANTIC_LAYER_ENABLED=false
```
**Эффект:** Чат-бот перестанет извлекать утверждения (claims) и оценивать их границы. Снизится вычислительная нагрузка и задержка, но пропадут проверки 'no psychodiagnosis' и 'no hidden authority' в ER Meaning Layer.

### Отключение Agent Runs (Temporal)
```env
AGENT_RUNS_ENABLED=false
TEMPORAL_RUNTIME_ENABLED=false
```
**Эффект:** Все запросы будут обрабатываться через простой Fast Path. Невозможно будет создавать Missions и отслеживать длительные задачи через Agent Runs.

### Отключение Gateways
```env
MODEL_GATEWAY_ENABLED=false
LITELLM_ENABLED=false
```
**Эффект:** Запросы пойдут напрямую к провайдерам (например, OpenAI, LlamaCpp) в обход LiteLLM, минуя агрегацию метрик.

## Алгоритм Отката (Rollback Procedure)
1. **Диагностика:** Оцените метрики в MVP Dashboard (`/api/admin/dashboard/mvp`). Если наблюдаются массовые отказы, таймауты Temporal или ошибки 5xx:
2. **Изменение `.env`:** Отключите нестабильные Feature Flags (установив `false`).
3. **Перезапуск сервиса:** Перезапустите основной процесс (например, через PM2 или systemctl).
4. **Очистка стейта:** Если были зависшие Runs, Temporal Workflows могут быть отменены принудительно через `temporal CLI` (`temporal workflow terminate --query 'WorkflowType="AgentRunWorkflow"'`).

## Риски Отката
- При отключении `SEMANTIC_LAYER_ENABLED` безопасность ответов снижается (пропадают строгие Semantic Boundaries).
- Незавершённые `AgentRuns` не смогут возобновиться после включения флага обратно, если они не были сохранены в SQLite.

## Принятие решения о повторном включении
Возобновление работы новых слоев должно происходить только после успешного прохождения всех `Test Matrices` и QA-подтверждения на Staging-среде.
