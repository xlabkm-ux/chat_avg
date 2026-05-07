# Risk Register — ChatAVG v2.3

**ID:** QA-13 | **Версия:** 1.0 | **Статус:** Active  
**Владелец:** Project Manager | **Обновлено:** 7 мая 2026

## Текущий статус рисков (на момент закрытия Sprint 5)

| Риск | Вероятность | Влияние | Mitigation | Статус / Комментарий |
|---|---|---|---|---|
| **Late USP risk:** ER-layer проверяется слишком поздно | Высокая | Критическое | Sprint 5 Semantic PoC gate | ✅ **Митигирован.** PoC завершен (84.5% accuracy), USP подтвержден. |
| Команда застрянет на самописном SQLite workflow engine | Средняя | Высокое | Temporal-first Sprint 7 | В плане. Sprint 7 фокус на Temporal. |
| LiteLLM интеграция задержит ModelGateway | Средняя | Среднее | LiteLLM feature flag | ✅ **Митигирован.** SPEC-003 готов, LiteLLM интегрирован как провайдер. |
| Fast path замедлится из-за AgentRun overhead | Средняя | Высокое | Guardrail tests | ✅ **Митигирован.** Тесты `fast_path_guardrail.test.js` проходят. |
| Semantic evals требуют много ручной разметки | Высокая | Среднее | Seed dataset early | 🟡 **В процессе.** Golden Set расширен до 57 кейсов. |
| Approval fatigue | Высокая | Высокое | Smart defaults | Ожидает Sprint 8/12. |
| RAG quality ниже ожиданий | Средняя | Высокое | Nightly evals | Ожидает Sprint 11. |
| Tool schema drift | Средняя | Среднее | schemaHash | Ожидает Sprint 13. |
| Prompt injection через tool output | Высокая | Высокое | Output validation | ✅ **Частично митигирован.** Добавлен `sanitizePromptText` и токены ChatML. |
| Sandbox cost explosion | Высокая | Среднее | Risk-based sandbox | Ожидает Sprint 14. |
| Cross-tenant leakage | Низкая | Критическое | Isolation tests | Базовая проверка CORS/Auth работает. |
| Temporal operational complexity | Средняя | Среднее | Dev cluster early | Ожидает Sprint 7. |
| Model provider outage | Средняя | Высокое | ModelGateway fallback | SPEC-003 описывает политику fallback. |
| UI exposes too much internal machinery | Средняя | Среднее | “3-5 distinctions” rule | ✅ **Митигирован.** UX Sketch подготовлен (Sprint 5). |
| Meaning layer becomes overconfident | Средняя | Критическое | No hidden authority evals | ✅ **Митигирован.** Добавлены тесты на `no_hidden_authority`. |
| Release rollback fails | Низкая | Критическое | MIGRATION-002 | Ожидает Sprint 16. |

---

## Новые выявленные риски

| Риск | Вероятность | Влияние | Mitigation | Статус |
|---|---|---|---|---|
| Расхождение PoC и реального LLM-judge | Средняя | Среднее | Сверка Golden Set с ручной разметкой в Sprint 11 | Новое |
| Сложность отладки Temporal workflows в Windows | Средняя | Среднее | Подготовка Docker-окружения для Temporal в Sprint 7 | Новое |

---

## Правила обновления
- Обновляется в конце каждого спринта (Sprint Gate).
- Owner каждого риска несет ответственность за выполнение Mitigation шагов.
