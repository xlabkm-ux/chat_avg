# Моки и синтетические провайдеры (Mocks & Synthetic Providers)

**ID:** DEV-07 | **Версия:** 1.0 | **Статус:** Active  
**Владелец:** QA + Backend | **Обновлено:** 7 мая 2026

---

## 1. Назначение

Детерминированные провайдеры позволяют тестировать цепочку `ChatService → PolicyRouter → Provider → ProviderEvents` без реальных API-вызовов. Это ключевая инфраструктура для unit/integration/contract тестов.

## 2. DeterministicProvider

Синтетический адаптер, возвращающий предсказуемый ответ.

**Расположение:** `cons/chatavg/tests/mocks/deterministic_provider.js`

### API

```js
const provider = new DeterministicProvider({
  response: 'Hello from mock!',     // Текст ответа
  delayMs: 0,                       // Задержка (для latency тестов)
  shouldError: false,                // Симуляция ошибки
  errorMessage: 'Provider failed',  // Текст ошибки
  finishReason: 'stop',             // Причина завершения
  usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
});

// Использование — как обычный provider adapter
for await (const event of provider.chat(messages, options)) {
  // event: { type: 'delta', text: 'Hello from mock!' }
  // event: { type: 'done', finishReason: 'stop', usage: {...} }
}
```

### Возможные режимы
| Режим | Описание |
|---|---|
| **Normal** | Возвращает `delta` + `done` |
| **Error** | Возвращает `error` event |
| **Slow** | Эмулирует задержку (для timeout-тестов) |
| **Multi-chunk** | Разбивает ответ на несколько `delta` events |
| **Tool call** | Возвращает `tool_call` event |

## 3. Регистрация в тестах

```js
// В тестовом файле
const { DeterministicProvider } = require('./mocks/deterministic_provider');
const { ProviderEvents } = require('../src/modules/providers/providerEvents');

// Подменяем адаптер в provider.factory для тестов
```

## 4. Другие моки (Sprint 6+)

| Мок | Sprint | Описание |
|---|---|---|
| **FakeMCPServer** | 6 | Эмулирует MCP Tool Gateway |
| **MockTemporalWorker** | 7 | Эмулирует Temporal workflow |
| **FakeSandbox** | 14 | Эмулирует E2B sandbox responses |
| **MockVectorStore** | 10 | Эмулирует retrieval results |
