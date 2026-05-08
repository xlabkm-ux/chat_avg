# SPEC-021: Claim Ledger and Persistence Spec

**Статус:** Draft / Sprint R4  
**Версия:** 1.0  
**Дата:** 7 мая 2026  

## 1. Overview

Claim Ledger — это централизованный реестр всех семантических единиц (Claims), извлеченных и обработанных в системе ChatAVG. В v0.2 реестр переведен с in-memory хранилища на SQLite для обеспечения долговечности (durability) и возможности аудита.

## 2. Database Schema

### 2.1 Table: `claims`
| Field | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | Уникальный ID утверждения (UUID). |
| `session_id` | TEXT | ID сессии (FK). |
| `username` | TEXT | Владелец сессии. |
| `claim_text` | TEXT | Текст самого утверждения. |
| `claim_type` | TEXT | observation, interpretation, hypothesis, recommendation, decision. |
| `reality_level` | TEXT | material, psychic, social, linguistic, systemic, trajectory, unknown. |
| `strength` | TEXT | strong, moderate, weak, hypothesis_only, question_only. |
| `evidence_basis` | TEXT | Обоснование утверждения (текст или ссылка). |
| `source_refs` | TEXT (JSON) | Массив ссылок на внешние источники или KnowledgeGateway chunks. |
| `source_span` | TEXT (JSON) | Смещения в тексте: `{start, end, confidence, messageId, artifactVersion}`. |
| `domain_boundary_id` | TEXT | Ссылка на нарушенную границу. |
| `allowed_strength` | TEXT | Максимально допустимая сила для данной границы. |
| `downgraded_from` | TEXT | Исходная сила до понижения. |
| `distortion_risks` | TEXT (JSON) | Обнаруженные когнитивные искажения или риски подмены. |
| `requires_user_decision` | BOOLEAN | Требует ли утверждение вмешательства пользователя. |
| `created_at` | INTEGER | Timestamp создания. |

### 2.2 Table: `semantic_events`
Логирует все изменения состояния семантического слоя.
| Field | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | UUID. |
| `session_id` | TEXT | ID сессии. |
| `username` | TEXT | Пользователь. |
| `run_id` | TEXT | ID AgentRun (если применимо). |
| `event_type` | TEXT | claim.created, claim.downgraded, authority.blocked, boundary.violation. |
| `claim_id` | TEXT | Ссылка на claim. |
| `payload` | TEXT (JSON) | Контекст события. |
| `created_at` | INTEGER | Timestamp. |

## 3. Repository API

Интерфейс `SemanticRepository` предоставляет следующие методы:
- `saveClaim(claim)`: Сохранение или обновление.
- `saveClaims(claims)`: Пакетное сохранение.
- `getClaimsBySession(sessionId, username)`: Выборка истории.
- `logEvent(event)`: Запись в лог.
- `getSummary(sessionId, username)`: Агрегированная статистика (counts by type, strength).
- `clearSession(sessionId)`: Очистка данных.
