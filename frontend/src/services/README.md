# Service Layer

Typed clients wrapping external dependencies (REST API, Socket.IO, Firebase). Keeps components and hooks agnostic of transport details.

---

## Topology

```mermaid
flowchart LR
    Hooks[Hooks (useAuth, useSocket, useCombat)] --> Services
    Services --> APIClient[api.ts]
    Services --> SocketClient[socket.ts]
    Services --> FirebaseClient[firebase.ts]

    APIClient --> BackendREST[Backend REST /api]
    SocketClient --> BackendSocket[Socket.IO Gateway]
    FirebaseClient --> FirebaseAuth[Firebase Auth]
```

General rules:

- Services expose **functions**, not classes.
- All network calls return `Promise<Result>` with discriminated unions for error handling.
- Tokens and headers managed internally; consumers pass only business parameters.

---

## Modules

| File            | Responsibility                                                 | Key Exports                                             |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| `firebase.ts`   | Initialize Firebase client SDK (Auth + Analytics when enabled) | `firebaseApp`, `auth`, `useFirebaseEmulators()`         |
| `api.ts`        | Fetch wrapper with auth headers, retries, error normalization  | `apiClient`, `get`, `post`, `patch`, `del`              |
| `socket.ts`     | Singleton Socket.IO client with reconnect handling             | `socket`, `connect`, `disconnect`, `emitWithAck`        |
| `world.ts`      | High-level API helpers (generate world, save config)           | `generateWorld`, `listWorlds`                           |
| `characters.ts` | Character CRUD + templates                                     | `createCharacter`, `updateCharacter`, `deleteCharacter` |
| `combat.ts`     | REST helpers for combat-specific endpoints                     | `requestRewind`, `fetchCombatState`                     |

> Some modules live in `services/__generated__/` when created via OpenAPI—extend this README if new files added.

---

## API Client Pattern

```typescript
import { apiClient } from '@/services/api';

export async function fetchRoom(roomId: string) {
  const response = await apiClient.get<RoomState>(`/api/rooms/${roomId}`);
  if (!response.ok) {
    throw response.error;
  }
  return response.data;
}
```

- Automatically injects `Authorization` header using Firebase `getIdToken`.
- Retries idempotent requests (GET) up to 3 times on network failures.
- Converts backend `ApiError` to typed `ApiClientError`.

---

## Socket Client Pattern

```typescript
import { socket } from '@/services/socket';

socket.on('connect', () => console.info('Socket connected'));
socket.on('room:updated', handleRoomUpdate);

socket.emitWithAck('player:action', { roomId, action });
```

- Connection established lazily when first listener registered.
- On reconnect, emits `room:join` for active rooms automatically.
- Exposes `subscribe(event, handler)` helper returning unsubscribe function.
- Integrates with `useCombat` and `useSocket` hooks for state management.

---

## Error Handling

- API errors surface as `ApiClientError { code, message, status, details? }`.
- Socket errors emitted through `error` event; service re-throws to hooks.
- Firebase errors normalized via `mapFirebaseError` before reaching UI.

Components should handle domain-level failures (e.g. show toast). Logging occurs within services.

---

## Testing

```bash
yarn test frontend/src/services/__tests__
```

Techniques:

- Use `msw` to mock REST endpoints (`setupTests.ts` already seeds handlers).
- Mock Socket.IO client via `socket.io-mock` to simulate server events.
- Stub Firebase with emulator config or `@firebase/rules-unit-testing`.

---

## Extending Services

1. Add helper in dedicated module (`services/<feature>.ts`).
2. Reuse `apiClient` / `socket` / `auth` instead of creating new instances.
3. Export pure async functions, return typed results.
4. Add tests covering success + failure paths.
5. Document new functions in this README (table + usage example).

---

## Related Docs

- `frontend/src/hooks/README.md` — how hooks consume services.
- `backend/src/api/README.md` — REST endpoint contracts.
- `backend/src/socket/README.md` — socket event catalogue.
