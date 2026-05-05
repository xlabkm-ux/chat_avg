# 🚀 Project Backlog — Chat AVG

Этот файл является центральным хранилищем всех планов, задач и истории развития проекта.

---

## 🗺️ Текущий Roadmap (Enterprise AI Gateway & MCP)
*Статус: В разработке (Май 2026). Эволюция `chatavg-gateway` в интеллектуальный маршрутизатор (Policy-Based Router) и интеграция с Remote MCP.*

### [В РАБОТЕ] Этап 1 — Нормализация Provider Layer (Contract Fix)
- [x] **Спринт 1.1: Унификация контрактов** — Создание `providerEvents.js` и `providerErrors.js`. Перевод `handleChat` в `base.provider.js` на `AsyncIterable` (CanonicalChatEvent). Приведение всех адаптеров к единому формату (`yield { type: 'delta' }`).
- [x] **Спринт 1.2: Policy Router** — Создание `services/policyRouter.js` поверх конфигурации категорий. Внедрение полей `routing_mode`, `fallback_provider` в настройки категорий. Интеграция роутера в `chat.service.js`.
- [x] **Спринт 1.3: Policy-aware Fallback** — Создание `services/fallbackPolicy.js`. Настройка безопасного переключения (только для retryable-ошибок вроде timeout/502) без обхода политик доступа.

### [ОЖИДАЕТ] Этап 2 — MCP Provider и Remote Server MVP
- [x] **Спринт 2.1: MCP Provider в Gateway** — Интеграция `@modelcontextprotocol/sdk`. Создание `providers/adapters/mcp.js`. Реализация вызова инструмента `ai.chat` и маппинга потока в CanonicalChatEvent.
- [x] **Спринт 2.2: Remote MCP Server MVP** — Создание отдельного Node.js сервиса `mcp_gateway/` внутри репозитория. Настройка эндпоинта `/mcp` (Streamable HTTP) и базового проксирования в OpenAI-совместимые API.
- [ ] **Спринт 2.3: Model Registry** — Разработка ресурса/инструмента `ai.models.list` на удаленном сервере для динамического предоставления списка моделей клиенту.

---

## 🕒 Хронология и История планов (Full History)

### Май 2026: Завершение Interface v2.0
- [x] ✅ **Независимые сессии (клиент)**: Изоляция сессий, авто-сохранение.
- [x] ✅ **Серверная синхронизация сессий**: REST API, SQLite.
- [x] ✅ **Финальная полировка**: XSS-защита (DOMPurify), Markdown рендер.
- [x] **Строгий CORS**: Переход на точное соответствие origin (exact match) для предотвращения обходов через поддомены.
- [x] **Конфигурируемые Таймауты**: Вынос `PROVIDER_TIMEOUT` и `TEST_TIMEOUT` в `.env` и `config.js`.

### Май 2026: Аудит и Санация (Remediation)
- [x] **Реструктуризация**: Переименование папки проекта в `cons` и обновление путей.
- [x] **Модернизация Портов**: Переход на `8200` (Gateway) и `8201` (Llama) для исключения конфликтов.
- [x] **Docker Readiness**: Добавлены эндпоинты `/health` и `/ready` для мониторинга.
- [x] **Защита от Prompt Injection**: Внедрена утилита `sanitizePromptText`.

### Апрель 2026: Модульность и Стабильность
- [x] **Модульная архитектура**: Рефакторинг `server.js` на модули (`src/core`, `src/modules`).
- [x] **Database Migration**: Переход с JSON-файлов на `better-sqlite3` с версионированием.
- [x] **Security Baseline P0**: Ограничение JSON лимитов (2MB), защита от SSRF (блокировка приватных IP).

### Март 2026: Эпоха MimikaStudio (Python/FastAPI)
- [x] **Системные фиксы Windows**: Замена `/tmp` на `tempfile.gettempdir()`.
- [x] **Кодировки**: Исправление записи транскриптов с принудительным `encoding="utf-8"`.

---

## 📝 Беклог идей и технических улучшений
- [ ] **Светлая тема**: Реализация `prefers-color-scheme` и ручного переключателя.
- [ ] **Интеграция с локальными моделями**: Поддержка автоматического обнаружения моделей в `models_cache`.
- [ ] **Голосовой ввод/вывод**: Интеграция TTS (Fish Speech) и STT (Whisper) напрямую в WebUI.
