# ChatAVG v2.3 — RC1 Stabilization Plan

**Версия документа:** 1.0  
**Дата:** 2026-05-09  
**Статус:** RC1 Stabilization  
**Цель:** довести текущий gateway до безопасного, запускаемого и тестируемого release candidate.

---

## 1. Короткий вывод

Исходный RC1-план был правильным по направлению, но слишком широким: в один release candidate были включены P0-баги, security hardening, MCP streaming, Temporal hardening, Real RAG, Semantic persistence, UX-доработки, QA и production handover.

Для RC1 это избыточно. Оптимальный RC1 должен закрывать только то, что блокирует стабильный кандидат:

1. P0 runtime-баги.
2. Sandbox / command execution safety.
3. Production security boot.
4. Root entry point и тестовый контур.
5. Минимальную provider/MCP совместимость.
6. Full regression + RC1 report.

Temporal, Real RAG, Semantic persistence, Dashboard/UX и production handover нужно вынести в RC2/RC3/Post-RC1.

---

## 2. RC1 Scope

### Входит в RC1

- Исправление критических багов исполнения.
- Закрытие sandbox RCE-вектора.
- Fail-closed поведение в production.
- Нормальная точка входа из корня репозитория.
- Расширенные test scripts.
- Минимальная совместимость provider/MCP, чтобы контекст и tool events не ломали поток.
- Regression, security smoke/red-team и RC1 отчет.

### Не входит в RC1

- Полноценный Temporal hardening.
- Замена mock-activities на production activities.
- Реальный RAG / SQLite FTS5 production retriever.
- Полная citation validation.
- Persistent Semantic Claim Ledger.
- Dashboard charts, mobile audit, UX polish.
- Production handover / canary rollout.

---

## 3. Sprint R1 — P0 Runtime & Sandbox Safety

**Цель:** устранить баги, которые ломают runtime или создают критический security-риск.

### R1.1 — `sandbox.routes.js`: policyGuard должен видеть operation

**Файл:** `cons/chatavg/src/modules/sandbox/sandbox.routes.js`

**Проблема:**  
`req.body.operation = 'run' / 'snapshot' / 'terminate' / 'quarantine'` выставляется после `policyGuard`, поэтому PolicyEngine получает пустой `operation`.

**Исправление:**

- Создать middleware `setSandboxOperation(operation)`.
- Применять его перед `policyGuard('sandbox_operation')`.

Пример:

```js
function setSandboxOperation(operation) {
  return (req, _res, next) => {
    req.body = req.body || {};
    req.body.operation = operation;
    next();
  };
}

router.post(
  '/:sandboxId/run',
  authenticate,
  setSandboxOperation('run'),
  policyGuard('sandbox_operation'),
  asyncHandler(async (req, res) => {
    const { command, timeoutMs, egressUrls } = req.body;
    if (!command) {
      return res.status(400).json({
        error: 'MISSING_FIELD',
        message: 'command is required',
      });
    }

    const result = await sandboxManager.run(
      req.params.sandboxId,
      command,
      { timeoutMs, egressUrls }
    );

    res.json(result);
  })
);
```

---

### R1.2 — `local.adapter.js`: запретить host command execution по умолчанию

**Файл:** `cons/chatavg/src/modules/sandbox/adapters/local.adapter.js`

**Проблема:**  
`execFile(shell, [flag, command])` исполняет произвольную строку через `sh -c` / `cmd /c` на хосте.

**Исправление:**

- Добавить обязательный env-флаг `ALLOW_LOCAL_COMMAND_EXECUTION=true`.
- Если флаг не задан — бросать ошибку.
- В production этот флаг не должен использоваться.

Пример:

```js
async runCommand(session, command, timeoutMs = 30_000) {
  if (process.env.ALLOW_LOCAL_COMMAND_EXECUTION !== 'true') {
    throw Object.assign(
      new Error('Local command execution is disabled. Set ALLOW_LOCAL_COMMAND_EXECUTION=true only in trusted dev/test environments.'),
      { code: 'LOCAL_COMMAND_EXEC_DISABLED' }
    );
  }

  const shell = process.platform === 'win32' ? 'cmd' : 'sh';
  const flag = process.platform === 'win32' ? '/c' : '-c';

  // existing execution logic
}
```

---

### R1.3 — `chat.service.js`: закрывать SSE после `[DONE]`

**Файл:** `cons/chatavg/src/modules/chat/chat.service.js`

**Проблема:**  
После `data: [DONE]` не вызывается `res.end()`, из-за чего streaming-соединение может зависать.

**Исправление:**

```js
res.write('data: [DONE]\n\n');
res.end();
```

**Важно:**  
После `res.end()` не должно быть повторной записи в `res`.

---

### R1.4 — `run.service.js`: исправить нелегальный переход состояний

**Файл:** `cons/chatavg/src/modules/execution/run.service.js`

**Проблема:**  
`inMemoryExecution()` делает переход:

```txt
requires_action -> completed
```

Но state machine разрешает только:

```txt
requires_action -> running -> completed
```

**Исправление:**

```js
async inMemoryExecution(runId, missionId) {
  await this.updateState(runId, 'running');
  await new Promise(r => setTimeout(r, 1000));

  await this.updateState(runId, 'requires_action', { step: 'model' });
  await new Promise(r => setTimeout(r, 1000));

  await this.updateState(runId, 'running', { step: 'finalizing' });
  await this.updateState(runId, 'completed');
}
```

---

### R1.5 — `openai_responses_compat.js`: удалить недостижимую ветку

**Файл:** `cons/chatavg/src/modules/providers/adapters/openai_responses_compat.js`

**Проблема:**  
Есть дублирующийся `else if` для:

```js
event.type === 'response.reasoning_summary_text.delta'
```

Вторая ветка недостижима.

**Исправление:**

- Оставить одну ветку.
- Удалить мертвый блок.
- Проверить, что reasoning summary не теряется.

---

### R1.6 — Zod v4: заменить `error.errors` на `error.issues`

**Файлы:**

- `cons/chatavg/src/modules/chat/chat.routes.js`
- `cons/chatavg/src/modules/auth/users.routes.js`
- `cons/chatavg/src/modules/admin/admin.routes.js`
- все остальные validation handlers

**Проблема:**  
В проекте используется `zod ^4.x`, но код местами возвращает:

```js
parseResult.error.errors
```

В Zod v4 корректное поле:

```js
parseResult.error.issues
```

**Исправление:**

```js
return res.status(400).json({
  error: 'Неверный формат запроса',
  details: parseResult.error.issues,
});
```

---

### Gate R1

```bash
cd cons/chatavg

npm run test:unit
npm run test:contract
npm run test:security:smoke
npm run test:sandbox
npm run test:integration:smoke
```

### Manual checks R1

```bash
# 1. Chat SSE должен закрываться после [DONE]
# 2. AgentRun без Temporal должен доходить до completed
# 3. POST /api/sandboxes/:id/run без ALLOW_LOCAL_COMMAND_EXECUTION=true должен падать
# 4. policyGuard должен видеть operation='run'
```

### Commit R1

```bash
git add -A
git commit -m "Fix(R1): P0 runtime bugs and sandbox execution safety"
git push origin main
```

---

## 4. Sprint R2 — Core Security

**Цель:** production должен падать безопасно, а не стартовать в сомнительной конфигурации.

### R2.1 — Secure Admin Boot

**Файлы:**

- `cons/chatavg/server.js`
- `cons/chatavg/src/core/config.js`

**Проблема:**  
Production не должен стартовать без `CHATAVG_ADMIN_PASSWORD`.

**Исправление:**

- При `NODE_ENV=production` и отсутствии `CHATAVG_ADMIN_PASSWORD` — `process.exit(1)`.
- Проверить, что пароль администратора не логируется.

---

### R2.2 — Sandbox fail-closed в production

**Файл:** `cons/chatavg/src/modules/sandbox/sandbox.manager.js`

**Правило:**

```txt
NODE_ENV=production && SANDBOX_FORGE_ENABLED=true && !E2B_API_KEY => hard fail
```

**Исправление:**

- Явный `throw`.
- Ошибка должна быть понятной.
- LocalAdapter запрещен в production.

---

### R2.3 — SSRF Guard tests

**Файл:** `cons/chatavg/src/core/utils.js`

**Проверить блокировку:**

- `http://127.0.0.1`
- `http://localhost`
- `http://10.0.0.1`
- `http://172.16.0.1`
- `http://172.31.255.255`
- `http://192.168.1.1`
- `http://169.254.169.254`

**Разрешить только при явном local provider allowLocal.**

---

### R2.4 — Secret logging audit

**Цель:** убедиться, что в `console.log`, debug logs и audit logs не попадают:

- API keys
- JWT secrets
- admin password
- provider tokens
- raw Authorization headers

---

### Gate R2

```bash
cd cons/chatavg

npm run test:security
npm run test:integration:smoke
```

### Manual checks R2

```bash
# 1. NODE_ENV=production без CHATAVG_ADMIN_PASSWORD => server exits
# 2. SANDBOX_FORGE_ENABLED=true без E2B_API_KEY в production => server exits
# 3. validateProviderUrl('http://169.254.169.254') => blocked
```

### Commit R2

```bash
git add -A
git commit -m "Fix(R2): Core security fail-closed behavior and SSRF tests"
git push origin main
```

---

## 5. Sprint R3 — Project Entry & Test Harness

**Цель:** проект должен запускаться и тестироваться из корня репозитория.

### R3.1 — Root `package.json`

**Файл:** `package.json` в корне репозитория.

**Минимальный вариант:**

```json
{
  "name": "chatavg-monorepo",
  "private": true,
  "scripts": {
    "setup": "npm install --prefix cons/chatavg",
    "gateway": "npm start --prefix cons/chatavg",
    "worker": "npm run worker --prefix cons/chatavg",
    "test": "npm run test:release --prefix cons/chatavg"
  }
}
```

---

### R3.2 — Расширить test scripts

**Файл:** `cons/chatavg/package.json`

Добавить:

```json
{
  "test:policy": "node --test tests/policy/*.test.js",
  "test:knowledge": "node --test tests/knowledge/*.test.js",
  "test:execution": "node --test tests/execution/*.test.js",
  "test:tools": "node --test tests/tools/*.test.js",
  "test:remediation": "node --test tests/remediation/*.test.js"
}
```

Обновить:

```json
{
  "test:nightly": "node --test tests/*.test.js tests/semantic/*.test.js tests/sandbox/*.test.js tests/policy/*.test.js tests/knowledge/*.test.js tests/execution/*.test.js tests/tools/*.test.js tests/remediation/*.test.js",
  "test:release": "npm run test:nightly && node tests/semantic/semantic.eval.js && node tests/evals/rag.eval.js"
}
```

---

### R3.3 — README Quick Start

**Файл:** `README.md`

Добавить:

```md
## Quick Start

```bash
npm run setup
npm run gateway
```

Run tests:

```bash
npm test
```

Gateway source:

```txt
cons/chatavg
```

Detailed local setup:

```txt
docs/05_delivery/LOCAL_DEVELOPMENT_SETUP.md
```
```

---

### R3.4 — `cons/chatavg/README.md`

Добавить:

- назначение gateway;
- env-переменные;
- запуск;
- тесты;
- структура модулей;
- production safety checklist.

---

### Gate R3

```bash
npm run setup
npm test

cd cons/chatavg
npm run test:policy
npm run test:knowledge
npm run test:execution
npm run test:tools
npm run test:remediation
```

### Commit R3

```bash
git add -A
git commit -m "Chore(R3): Root package.json, expanded tests, and README quick start"
git push origin main
```

---

## 6. Sprint R4 — Minimal Provider / MCP Compatibility

**Цель:** не реализовывать весь MCP streaming в RC1, а убрать критические потери контекста и поломку tool/search events.

### R4.1 — System messages не должны теряться

**Файл:** `cons/chatavg/src/modules/providers/adapters/openai_prompt_file_search.js`

**Проблема:**  
`role === 'system'` может теряться при конвертации.

**Исправление:**

- Если нет `prompt.id`, конвертировать `system` messages в `instructions`.
- Если `prompt.id` есть, явно определить поведение: либо merge, либо reject конфликтующих system messages.

---

### R4.2 — `web_search_call` / `file_search_call` не должны ломать stream

**Файлы:**

- `openai_prompt_file_search.js`
- при необходимости `cons/mcp_gateway/server.js`

**Исправление:**

- Добавить обработку `response.output_item.added`.
- Для неизвестных output item типов — safe ignore + debug log.
- Не падать на tool/search event.

---

### R4.3 — Debug log final params

**Цель:**  
Через debug UI/log убедиться, что финальный request к provider содержит:

- `instructions`
- `input`
- `tools` / search config, если задано
- ожидаемый `model`

---

### Gate R4

```bash
cd cons/chatavg

npm run test:unit
npm run test:contract
```

### Manual checks R4

```bash
# 1. Категория с system_prompt не теряет instructions
# 2. web_search_call/file_search_call не ломает stream
# 3. debug log показывает финальные params
```

### Commit R4

```bash
git add -A
git commit -m "Fix(R4): Minimal provider and MCP compatibility for RC1"
git push origin main
```

---

## 7. Sprint R5 — RC1 QA & Release Report

**Цель:** подтвердить, что RC1 стабилен в заявленном scope.

### R5.1 — Full regression

```bash
cd cons/chatavg
npm run test:release
```

### R5.2 — Security red-team RC1 scope

Проверить:

- bypass `policyGuard` через пустой `operation`;
- sandbox run без `ALLOW_LOCAL_COMMAND_EXECUTION`;
- custom provider URL на private IP;
- prompt injection через `extra_params`;
- невалидные request bodies после Zod v4 фикса;
- SSE disconnect / close behavior.

---

### R5.3 — SSE smoke/load

Минимально:

- 50 параллельных SSE-сессий;
- 100 коротких non-streaming chat-запросов;
- отключение provider во время stream;
- client disconnect до `[DONE]`.

---

### R5.4 — RC1 report

**Файл:** `docs/05_delivery/RELEASE_CANDIDATE_REPORT_RC1.md`

Содержимое:

```md
# ChatAVG v2.3 RC1 Report

## Commit
<commit sha>

## Test Results
| Suite | Result | Notes |
|---|---|---|
| test:unit | pass/fail | |
| test:contract | pass/fail | |
| test:security | pass/fail | |
| test:sandbox | pass/fail | |
| test:release | pass/fail | |

## Manual Checks
| Check | Result | Evidence |
|---|---|---|
| SSE closes after [DONE] | pass/fail | |
| Sandbox local exec blocked by default | pass/fail | |
| Production boot fail-fast | pass/fail | |
| SSRF private IP blocked | pass/fail | |
| AgentRun fallback completes | pass/fail | |

## Known Limitations
- Temporal activities are not production-hardened yet.
- Knowledge Gateway still requires RC2 work for real RAG/citation validation.
- Semantic persistence requires RC2/RC3 stabilization.
- MCP full SSE streaming is out of RC1 scope unless explicitly promoted.
```

---

### Gate R5

```bash
cd cons/chatavg

npm run test:release
npm run test:security
```

### Commit R5

```bash
git add -A
git commit -m "QA(R5): RC1 regression, security checks, and release candidate report"
git push origin main
```

---

## 8. RC1 Release Gates

| Gate | Критерий | Статус |
|---|---|---|
| G0 Runtime | P0 runtime bugs fixed | 🔴 |
| G1 Sandbox Safety | No unguarded host command execution | 🔴 |
| G2 Security Boot | Production fail-fast works | 🔴 |
| G3 Project Entry | Root setup/test/start works | 🔴 |
| G4 Provider Compatibility | system/search/tool events do not break flow | 🔴 |
| G5 Regression | `test:release` green | 🔴 |
| G6 Security | `test:security` green + manual red-team pass | 🔴 |
| G7 Report | RC1 report committed | 🔴 |

---

## 9. Post-RC1 Roadmap

### RC2 — Durable Runtime & Knowledge

- Harden Temporal activities.
- Make workflow replay-safe.
- Implement production SQLite FTS5 retriever.
- Build ingestion pipeline.
- Add answerability policy.
- Add citation validation.

### RC3 — Semantic Layer & UX

- Persistent Claim Ledger.
- Artifact versioning and diff view.
- Semantic extraction tuning.
- Canonical error UX.
- Admin dashboard charts.
- Mobile audit.
- Latency optimization.

### Production Handover

Только после RC1 sign-off и RC2/RC3 по необходимости:

- DB migration.
- Shadow deployment.
- Canary rollout.
- Production checklist.
- Handover docs.

---

## 10. Final Recommendation

Не расширять RC1 до полного production roadmap.  
RC1 должен доказать только одно: текущий gateway безопасно стартует, не имеет P0 runtime-багов, проходит regression/security gate и имеет понятные known limitations.

Такой RC1 можно реально завершить. Исходный F1–F10 план лучше сохранить как общий roadmap, но не как обязательный scope одного release candidate.
