# Release Gates и Definition of Done (DoD)

**ID:** QA-12 | **Версия:** 1.0 | **Статус:** Active  
**Владелец:** PM + QA Lead | **Обновлено:** 7 мая 2026

---

## 1. Definition of Ready (DoR)

Задача готова к спринту, если:
- Чёткие acceptance criteria.
- Указаны зависимости и блокеры.
- Определён owner. Связанные контракты описаны.

## 2. Definition of Done (DoD)

- [ ] Code review (≥ 1 reviewer).
- [ ] Unit-тесты (coverage ≥ 80% для изменённых файлов).
- [ ] Integration-тесты green.
- [ ] Security baseline green.
- [ ] Regression baseline не сломлена.
- [ ] Нет CRITICAL/HIGH из `npm audit`.
- [ ] PROJECT_MAP.md обновлён (`node dev_studio/refresh.js`).
- [ ] Код смержен через PR.

## 3. Sprint Gate

| Критерий | Обязательно |
|---|:---:|
| Все задачи Done по DoD | ✅ |
| CI green для main | ✅ |
| PROJECT_BACKLOG.md обновлён | ✅ |
| Risk Register обновлён | ✅ |
| Demo проведена | ✅ |

## 4. Release Gates

### MVP (Sprint 9)
- Fast Path, auth, admin, sessions, AgentRun (basic) работают.
- Unit ≥ 80%, Integration green, Security baseline green.
- TTFT < 1.5s. Rollback path задокументирован.
- PM + Tech Lead + QA sign-off.

### Beta
- Knowledge Gateway, Semantic Protocol (базовый), Approval UX.
- RAG eval ≥ 85%. P95 TTFT < 2s, 50 concurrent chats.
- Full security test plan executed. PM + Architect + Security sign-off.

### RC
- Full feature set v2.3. Chaos/DR tests pass.
- V1→V2 migration tested. Load at 2x traffic, P99 < 3s.
- Full team sign-off.

## 5. Rollback Criteria

Немедленный rollback если: error rate > 5%, TTFT > 3s (5 мин), CRITICAL vuln, data loss, approval bypass.
