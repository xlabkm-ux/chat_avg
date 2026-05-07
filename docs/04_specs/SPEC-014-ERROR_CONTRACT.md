# Error Contract (Канонический формат ошибок)

**ID:** SPEC-014 | **Версия:** 1.0 | **Статус:** Active  
**Владелец:** Backend + QA | **Обновлено:** 7 мая 2026

---

## 1. Canonical Error Response

Все API-эндпоинты ChatAVG возвращают ошибки в едином формате:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object | null",
    "stack": "string (only in development)"
  }
}
```

## 2. Error Classes Hierarchy

```
Error
 └── AppError (isOperational: true)
      ├── AuthError        (401, "auth_error")
      ├── ValidationError  (400, "validation_error")
      └── NotFoundError    (404, "not_found")

Error
 └── ProviderError
      (502 default, "provider_error", isRetryable: boolean)
```

## 3. HTTP Status Codes

| Status | Code | Описание | Retryable |
|---|---|---|:---:|
| 400 | `validation_error` | Невалидные входные данные | ❌ |
| 401 | `auth_error` | JWT невалиден / отсутствует / отозван | ❌ |
| 403 | `forbidden` | Недостаточно прав (не admin) | ❌ |
| 404 | `not_found` | Ресурс или API route не найден | ❌ |
| 413 | — | Payload Too Large (> 2MB) | ❌ |
| 429 | `rate_limit` | Rate limit exceeded | ✅ (after backoff) |
| 500 | `server_error` | Необработанная внутренняя ошибка | ❌ |
| 502 | `provider_error` | Upstream LLM provider error | ✅ (conditional) |
| 504 | `provider_timeout` | Provider response timeout | ✅ |

## 4. Provider Events: Error

Внутри streaming-ответов ошибки передаются через `ProviderEvents.error()`:

```json
{ "type": "error", "message": "string", "code": "provider_error" }
```

Это финальный event в потоке — после него клиент должен закрыть соединение.

## 5. Retryable vs Non-Retryable

`ProviderError` содержит поле `isRetryable`. FallbackPolicy использует его для решения о retry/fallback:

- **Retryable:** timeout, rate limit, temporary 5xx от upstream.
- **Non-retryable:** auth failure, invalid model, malformed request.

## 6. Client Disconnect Handling

При `ECONNRESET` / `ERR_STREAM_PREMATURE_CLOSE` сервер логирует warning и не отправляет ответ (соединение уже разорвано).

## 7. User-Visible Messages

- Сообщения для пользователя — на русском языке (основной интерфейс).
- Коды ошибок (`code`) — на английском (для программной обработки).
- `details` может содержать Zod validation errors в dev mode.

## 8. CorrelationId (Planned — Sprint 8)

В будущем каждый ответ будет содержать `correlationId` для сквозной трассировки через audit log.
