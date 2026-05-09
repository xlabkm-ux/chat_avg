# ChatAVG v2.3 Agent Platform

**ChatAVG** — это экспериментальная платформа для создания и управления AI-агентами с упором на семантическую доказуемость (Semantic Protocol), устойчивое исполнение (Durable Runtime/Temporal) и безопасные вычисления (Sandboxing).

> [!CAUTION]
> **ТЕКУЩИЙ СТАТУС: Skeleton / MVP PoC (Не для Production)**
> Проект находится в стадии активной доработки (Hardening). Многие компоненты, отмеченные в бэклоге как завершенные, представляют собой функциональные скелеты с моками. См. [CURRENT_REALITY_AUDIT.md](CURRENT_REALITY_AUDIT.md).

## 🏗️ Структура репозитория

- `/cons/chatavg` — Основной бэкенд (Node.js) и WebUI.
- `/cons/mcp_gateway` — Шлюз Model Context Protocol (MCP) для мультипровайдерности.
- `/docs` — Полная документация проекта (архитектура, спецификации, ADR).
- `/workdoc` — Рабочие планы и черновики.

## 🛠️ Технологический стек

- **Core:** Node.js, Express, SQLite (FTS5).
- **Runtime:** Temporal (Durable Workflows).
- **Inference:** OpenAI (Responses API), llama.cpp, LiteLLM.
- **Frontend:** Vanilla JS / HTML / CSS.

## 🚀 Быстрый старт (Quick Start)
1.  **Настройка окружения:**
    ```bash
    npm run setup
    ```
2.  **Запуск шлюза (MCP Gateway):**
    ```bash
    npm run gateway
    ```
3.  **Запуск основного приложения (ChatAVG):**
    ```bash
    npm run start
    ```
4.  **Запуск воркера (Temporal):**
    ```bash
    npm run worker
    ```

## 🧪 Тестирование
- `npm test` — запуск всех тестов (релизный цикл).
- `npm run test:unit` — только модульные тесты.
- `npm run test:security` — проверка безопасности.
- `npm run test:all` — полный прогон, включая тесты исправлений (remediation).

## 🚦 План развития

Актуальный план подготовки к релизу находится здесь:
👉 [**ChatAVG v2.3 Final Release Path**](workdoc/ChatAVG_v2.3_Final_Release_Path.md)

## 📋 Документация

- [PROJECT_BACKLOG.md](PROJECT_BACKLOG.md) — Центральный бэклог.
- [PROJECT_MAP.md](PROJECT_MAP.md) — Карта файлов и модулей.
- [docs/02_architecture/ARCHITECTURE_OVERVIEW_V2_3.md](docs/02_architecture/ARCHITECTURE_OVERVIEW_V2_3.md) — Архитектурный обзор v2.3.

---
© 2026 Antigravity Team
