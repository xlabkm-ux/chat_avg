# Semantic UX Sketch — "3-5 Distinctions" Rule

**Sprint:** 5 (Semantic Protocol PoC)  
**Date:** 2026-05-07  
**Status:** Concept  

## Principle

> Показывать 3-5 главных различений, не всю механику.

The user sees the **meaning outcomes**, not the internal pipeline. The system extracts claims, checks boundaries, and downgrades strength — but presents only the most valuable distinctions.

## UX Concept

### What the User Sees (Response Card)

```
┌─────────────────────────────────────────────────────┐
│  AI Response                                         │
│  ─────────────────────────────────────────────────── │
│  "Данные показывают рост на 15%.                    │
│   Это может указывать на успешность стратегии."      │
│                                                      │
│  ┌─ Различения ─────────────────────────────────┐   │
│  │ 📊 Факт: "рост на 15%" — из данных           │   │
│  │ 💡 Интерпретация: "успешность стратегии"      │   │
│  │    — сила: гипотеза (не факт)                 │   │
│  │ ⚠️ Граница: финансовые рекомендации            │   │
│  │    — не является инвестиционной рекомендацией  │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### What the User Does NOT See

- Internal claim IDs and processing pipeline
- Raw strength levels (fact/strong_inference/weak_hypothesis/question)
- Debug logs and violation arrays
- SemanticProtocol version and glossary metadata
- Domain boundary rule internals

### Disclosure Levels

| Level | Content | When |
|---|---|---|
| **Minimal** | Colored strength indicator only (🟢🟡🟠) | Default for casual chat |
| **Standard** | 3-5 distinctions with plain language labels | When claims detected |
| **Detailed** | Full claim list with types and boundaries | Admin/debug mode |

## Visual Components

### 1. Strength Indicator (Minimal)
Small colored dot next to each significant claim:
- 🟢 **Факт** — from verifiable data
- 🟡 **Интерпретация** — strong but not certain  
- 🟠 **Гипотеза** — possible, needs verification
- ⚪ **Вопрос** — explicitly uncertain

### 2. Distinction Card (Standard)
Expandable section below the response showing:
- **Type** in plain language (Факт / Интерпретация / Гипотеза)
- **Source** — what the claim is based on
- **Boundary note** — if a professional domain was detected

### 3. Boundary Warning (When Triggered)
```
⚠️ Этот ответ затрагивает область [медицина/право/финансы].
   Рекомендации не заменяют консультацию специалиста.
```

### 4. Block Notice (When Violation Detected)
```
🚫 Содержание было скорректировано:
   Система не выставляет психологические диагнозы.
```

## Implementation Notes

- Distinction cards are rendered client-side from `_semantic` metadata.
- When `_semantic` is absent (feature flag off, streaming mode), no UI change.
- The 3-5 limit is enforced by picking top claims by strength differential.
- ConflictCards (Sprint 12) will extend this pattern for value/trajectory choices.

## Rules

1. Never show more than 5 distinctions — collapse lesser ones.
2. Always use plain language, not technical terms.
3. Boundary warnings take priority over claim distinctions.
4. Block notices are mandatory and non-collapsible.
5. In mobile view, distinctions collapse to strength dots only.
