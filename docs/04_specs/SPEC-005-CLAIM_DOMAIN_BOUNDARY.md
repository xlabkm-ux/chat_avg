---
id: SPEC-005
title: Claim and Domain Boundary
version: 0.1.0
owner: Semantic Lead + Backend
status: Active
last_updated: 2026-05-07
sprint: Sprint 5
adr_references: ADR-005
---

# Claim и DomainBoundary v0 (Спецификация)

**ID:** SPEC-005 | **Версия:** 0.1 (PoC) | **Статус:** Active  
**Владелец:** Semantic Lead + Backend | **Обновлено:** 7 мая 2026  
**ADR:** ADR-005 Semantic Shift-Left

---

## 1. Claim (Утверждение)

Claim — минимальная смысловая единица, извлечённая из текста. Система работает с claims, а не с потоком слов.

### 1.1. Claim Schema

```javascript
{
  claimId: string,          // UUID
  sessionId: string,        // ID сессии/миссии
  text: string,             // Текст утверждения
  type: ClaimType,          // observation | interpretation | hypothesis | decision | recommendation
  level: RealityLevel,      // text | fact | model | value | trajectory | system
  strength: StrengthLevel,  // fact | strong_inference | weak_hypothesis | question
  domainBoundaryId: string | null,  // ID связанной границы
  sourceRefs: string[],     // Ссылки на источники (индексы сообщений, URL)
  downgradedFrom: string | null,    // Оригинальная сила до downgrade
  downgradedReason: string | null,  // Причина понижения
  violations: string[],     // Список нарушенных правил
  createdBy: "system" | "user",     // Кто создал
  createdAt: string         // ISO timestamp
}
```

### 1.2. ClaimType Enum

| Значение | Описание |
|----------|----------|
| `observation` | Фиксация наблюдаемого: "в тексте сказано X", "пользователь указал Y" |
| `interpretation` | Толкование данных: "это может означать Z" |
| `hypothesis` | Предположение для проверки: "возможно, причина в W" |
| `decision` | Решение: "принято/выбрано A" |
| `recommendation` | Предложение: "рекомендуется сделать B" |

### 1.3. RealityLevel Enum

| Значение | Описание |
|----------|----------|
| `text` | Уровень текста (что написано) |
| `fact` | Уровень проверяемых фактов |
| `model` | Уровень моделей/теорий |
| `value` | Уровень ценностей/предпочтений |
| `trajectory` | Уровень направления/последствий |
| `system` | Уровень системных связей |

### 1.4. StrengthLevel Enum

| Значение | Числовой вес | Описание |
|----------|:-----------:|----------|
| `fact` | 4 | Проверяемый факт с источником |
| `strong_inference` | 3 | Логический вывод из фактов |
| `weak_hypothesis` | 2 | Возможное объяснение |
| `question` | 1 | Открытый вопрос |

---

## 2. DomainBoundary (Граница области определения)

DomainBoundary определяет, где утверждение имеет право на свою силу. За пределами области определения сила утверждения автоматически понижается.

### 2.1. DomainBoundary Schema

```javascript
{
  boundaryId: string,       // Уникальный ID
  name: string,             // Название ("медицина", "право", "психология")
  description: string,      // Описание границы
  level: RealityLevel,      // Уровень реальности
  maxAllowedStrength: StrengthLevel,  // Максимально допустимая сила claim
  rules: BoundaryRule[]     // Правила детекции
}
```

### 2.2. BoundaryRule Schema

```javascript
{
  ruleId: string,
  name: string,              // "no_medical_diagnosis", "no_legal_advice"
  description: string,
  category: "prohibition" | "downgrade" | "warning",
  keywords: string[],        // Триггерные слова/фразы
  patterns: string[],        // Regex-паттерны
  action: {
    type: "block" | "downgrade" | "flag",
    targetStrength: StrengthLevel | null,  // Для downgrade — целевая сила
    message: string           // Пояснение действия
  }
}
```

### 2.3. Предопределённые Domain Boundaries (PoC)

| ID | Название | maxAllowedStrength | Описание |
|---|---------|:---------:|----------|
| `medical` | Медицинская область | `weak_hypothesis` | Медицинские диагнозы и рекомендации |
| `legal` | Юридическая область | `weak_hypothesis` | Юридические заключения и советы |
| `psychological` | Психологическая область | `question` | Психологические оценки и диагнозы |
| `financial` | Финансовая область | `weak_hypothesis` | Инвестиционные и финансовые советы |
| `personal_inner` | Внутренний мир человека | `question` | Утверждения о чувствах, мотивах, переживаниях |

---

## 3. Strength Downgrade Engine

### 3.1. Правила понижения

```
1. Claim в области "psychological" + strength > "question"
   → downgrade to "question", reason: "psychological_boundary"

2. Claim в области "medical" + strength > "weak_hypothesis"
   → downgrade to "weak_hypothesis", reason: "medical_boundary"

3. Claim без sourceRefs + strength === "fact"
   → downgrade to "strong_inference", reason: "missing_source"

4. Claim смешивает reality levels (fact + value)
   → downgrade на 1 ступень, reason: "level_mixing"

5. Claim содержит паттерны психодиагностики
   → BLOCK, violation: "no_psychodiagnosis"

6. Claim содержит паттерны скрытого авторитета
   → BLOCK, violation: "no_hidden_authority"
```

### 3.2. No Hidden Authority Rules

Система **БЛОКИРУЕТ** утверждения, которые:
- Диагностируют психическое состояние пользователя ("у вас депрессия", "вы проявляете признаки...")
- Создают иллюзию глубокого понимания ("я понимаю, что вы чувствуете", "на самом деле вы...")
- Присваивают числовой score сущности человека
- Говорят от имени непроверяемого ("ваше подсознание говорит...")

---

## 4. ClaimLedger

Реестр всех извлечённых claims в рамках сессии.

### 4.1. API

```javascript
class ClaimLedger {
  addClaim(claim)              // Добавить claim
  getClaims(sessionId)         // Получить все claims сессии
  getDowngradedClaims()        // Получить понижённые claims
  getViolations()              // Получить нарушения
  getSummary()                 // Статистика: total, by type, by strength, violations
}
```

### 4.2. Хранение (PoC)

In-memory Map по sessionId. Персистенция в БД — Sprint 6+.

---

## 5. Semantic Events

| Event | Описание | Payload |
|-------|----------|---------|
| `claim.created` | Новый claim извлечён | `{ claim }` |
| `claim.downgraded` | Сила claim понижена | `{ claim, fromStrength, toStrength, reason }` |
| `boundary.violation` | Нарушение границы | `{ claim, boundaryId, rule, action }` |
| `authority.blocked` | Скрытый авторитет заблокирован | `{ claim, violationType }` |

---

## 6. Ограничения PoC

- Extraction через structured LLM prompt (не NLP pipeline).
- In-memory storage (нет SQLite persistence).
- 5 предопределённых domains (расширяемо).
- Нет UI компонента (только backend + logs + tests).
- Keyword/pattern matching для boundaries (не ML classifier).
