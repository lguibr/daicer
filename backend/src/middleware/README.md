# Middleware Stack

Reusable Express middleware powering security, validation, observability, and error shaping.

---

## Request Pipeline

```mermaid
flowchart LR
    subgraph Global
        A[helmet()] --> B[cors()]
        B --> C[compression()]
        C --> D[json body parser]
        D --> E[urlencoded parser]
        E --> F[requestContext()]
    end

    F --> Auth[authenticate()]
    Auth --> RateLimit[rateLimit()]
    RateLimit --> Validate[validate(zodSchema)]
    Validate --> Handler[Route Handler]
    Handler --> ErrorHandler[errorHandler()]
```

- **Global** middleware configured in `src/server.ts`.
- **Route-level** middleware applied where needed (auth, validation, rate limits).
- **Error handler** is always last and produces consistent `ApiError` envelopes.

---

## Modules

| File                 | Purpose                                              | Key Exports                       |
| -------------------- | ---------------------------------------------------- | --------------------------------- |
| `auth.ts`            | Firebase ID token verification + user hydration      | `authenticate`, `requireRole`     |
| `validate.ts`        | `zod` schema enforcement for params/query/body       | `validate(schema, options)`       |
| `error.ts`           | Normalizes thrown errors, hides stack traces in prod | `errorHandler`, `NotFoundHandler` |
| `rate-limit.ts`      | Per-route request throttling                         | `rateLimitFactory`                |
| `request-context.ts` | Correlation IDs + per-request logger                 | `attachRequestContext`            |

All middleware functions are typed and pure: no side effects beyond modifying `req`, `res`, or invoking `next`.

---

## Authentication

- Extracts bearer token from `Authorization`.
- Validates via Firebase Admin (`auth.verifyIdToken`).
- Attaches decoded token to `req.user`.
- Rejects missing/invalid tokens with `401` and `error.code = 'UNAUTHENTICATED'`.
- `requireRole('dm')` helper enforces role-based checks when needed.

---

## Validation

```typescript
router.post('/rooms', authenticate, validate(createRoomRequestSchema), createRoomController);
```

- Accepts separate schemas for `params`, `query`, and `body`.
- Coerces types (e.g. strings to numbers) where defined in schema.
- On failure, throws `ValidationError` with `issues[]` array — serialized as `422`.
- Use `refine` / `superRefine` for cross-field validation (e.g. max players vs seats).

---

## Error Handling

`errorHandler` does the following:

1. Detects known domain errors (`DomainError`, `ValidationError`, `ExternalServiceError`).
2. Maps to `{ success: false, error: { code, message, details? } }`.
3. Logs once per error with request ID + stack (dev only).
4. Hides stack traces unless `NODE_ENV=development`.

Register at the bottom of `src/server.ts`:

```typescript
app.use(notFoundHandler);
app.use(errorHandler);
```

---

## Rate Limiting

- Implemented using `express-rate-limit`.
- Defaults: 60 requests per minute per IP for asset generation.
- Customize:

  ```typescript
  import { rateLimitFactory } from '@/middleware/rate-limit';

  const assetLimiter = rateLimitFactory({ windowMs: 60_000, limit: 20 });
  router.post('/api/assets/avatar', authenticate, assetLimiter, handler);
  ```

---

## Request Context & Logging

`attachRequestContext` seeds:

- `req.id` – UUID (or forwarded `x-request-id`)
- `req.logger` – Winston child logger scoped to the request
- `req.timing` – helper to measure durations (`req.timing.start('langgraph')`)

Use it early in the stack to ensure downstream middleware share the same context.

---

## Testing

Middleware unit tests live beside implementations (`src/middleware/__tests__/`):

```bash
yarn test backend/src/middleware/__tests__
```

Patterns:

- Use `supertest` to exercise full pipeline for auth/validation.
- Mock Firebase Admin for auth tests (`firebase-admin` mock module).
- Assert error payloads match spec (code, message, issues).

---

## Extending the Stack

1. Create new middleware file (e.g. `audit.ts`).
2. Export a factory (`createAuditMiddleware(config)`).
3. Add tests with success + failure cases.
4. Document usage here.
5. Update `server.ts` to wire it in the correct order.
