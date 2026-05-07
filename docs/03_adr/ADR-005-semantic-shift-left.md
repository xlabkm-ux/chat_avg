# ADR-005: Semantic Shift-Left (Adequacy Engine)

## Статус
Зафиксировано (Sprint 5)

## Контекст (Context)
Главный продуктовый дифференциатор ChatAVG — не скорость или количество провайдеров, а **смысловая адекватность**: способность системы извлекать утверждения (Claims) из диалога, определять границы их применимости (Domain Boundaries), понижать силу выводов при выходе за область определения и не создавать скрытого авторитета.

В предыдущих версиях плана (v2.1/v2.2) смысловой слой (ER Meaning Layer) планировался на Sprint 11-12 — после RAG, sandbox и tool-mesh. Это создавало критический риск: проект мог накопить дорогой технический долг в инфраструктуре, а затем обнаружить, что USP (Unique Selling Proposition) не работает.

## Решение (Decision)
Перенести **Semantic Protocol Proof-of-Concept** в Sprint 5 — сразу после стабилизации Model Gateway. Это создает ранний product/USP gate:

1. **Claim Extraction Pipeline** — система умеет извлекать из текста утверждения с типом (`observation`, `interpretation`, `hypothesis`, `decision`, `recommendation`), уровнем (`text`, `fact`, `model`, `value`, `trajectory`, `system`) и силой (`fact`, `strong_inference`, `weak_hypothesis`, `question`).

2. **Domain Boundary Rules** — каждый claim привязан к области определения. При выходе за границу сила автоматически понижается (downgrade). Система НЕ делает сильных выводов без достаточных данных.

3. **No Hidden Authority** — система не диагностирует пользователя, не создаёт иллюзию глубокого понимания и не говорит сильнее, чем позволяют доказательства.

4. **Semantic Eval Seed** — набор из 50-100 тестовых кейсов для регрессионного контроля смысловой адекватности. Включает legal, consulting, scientific, ambiguous и adversarial сценарии.

5. **Feature Flag** — весь semantic layer скрыт за `SEMANTIC_LAYER_ENABLED` flag и не влияет на Fast Path performance.

## Последствия (Consequences)
**Положительные:**
1. **Ранняя валидация USP:** Если система не умеет стабильно извлекать claims и удерживать boundaries, это выяснится до тяжелых инвестиций в RAG/sandbox/tools.
2. **Semantic Eval в CI:** Качество смыслового слоя становится delivery gate, а не финальным отчетом.
3. **Архитектурная чистота:** Semantic модуль изолирован в `src/modules/semantic/` и не загрязняет Fast Path.

**Отрицательные:**
1. **Зависимость от LLM для extraction:** Claim extraction на PoC-этапе использует LLM-as-judge, что добавляет latency и cost. В production планируется оптимизация.
2. **Ранний scope creep риск:** Важно ограничить PoC минимальным набором правил и не строить полный Adequacy Engine на этом этапе.

## Связанные документы
- SPEC-004: SemanticProtocol v0
- SPEC-005: Claim/DomainBoundary v0
- EVAL-001: Semantic seed set
