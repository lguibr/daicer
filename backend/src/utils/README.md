# Utilities Layer

Shared helper modules that enforce consistency across the backend: logging, dice math, response envelopes, and misc helpers.

---

## Philosophy

- Keep utilities **stateless** and **pure** where possible.
- Centralize cross-cutting concerns (logging, uuid, time) to simplify mocking.
- Export fully typed functions — no `any` or implicit `unknown`.
- When side effects are required (e.g. logging), make them dependency-injectable.

---

## Catalogue

| File                | Purpose                               | Highlights                                                      |
| ------------------- | ------------------------------------- | --------------------------------------------------------------- |
| `logger.ts`         | Winston instance factory              | JSON logs, request-bound child loggers, level from `LOG_LEVEL`  |
| `room-code.ts`      | Generate + validate 6-char room codes | Collision-safe, excludes ambiguous characters (O/0, I/1)        |
| `dice.ts`           | Deterministic dice roller             | Seeded RNG, supports `d20`, `drop/keep`, advantage/disadvantage |
| `response.ts`       | API response helpers                  | `ok(payload)`, `fail(error)`, typed `ApiResponse<T>`            |
| `character.ts`      | Character sheet helpers               | Ability modifier math, proficiency bonus, validation            |
| `game-mechanics.ts` | D&D SRD rules                         | Saving throws, condition effects, damage calculations           |
| `tool-logger.ts`    | LangGraph tool tracing                | Structured logs per tool call with duration + args              |

Utilities are barrel-exported via `src/utils/index.ts` for convenience.

---

## Usage Patterns

### Room Codes

```typescript
import { generateRoomCode, isValidRoomCode } from '@/utils/room-code';

const code = generateRoomCode(); // e.g. "R7FQ2M"
assert(isValidRoomCode(code));
```

### API Responses

```typescript
import { ok } from '@/utils/response';

router.get('/rooms/:roomId', async (req, res) => {
  const room = await getRoom(req.params.roomId);
  return res.json(ok(room));
});
```

### Dice

```typescript
import { roll, rollWithHistory } from '@/utils/dice';

const attack = roll('1d20+7', { seed: encounter.seed });
const damage = rollWithHistory('2d6+4', { seed: encounter.seed, label: 'greatsword' });
```

---

## Testing

- Unit tests live under `src/utils/__tests__/`.
- Use deterministic seeds to assert dice outputs.
- Snapshot logging output when necessary to ensure format stability.
- Always cover edge cases (invalid room codes, negative modifiers, etc.).

```bash
yarn test backend/src/utils/__tests__
```

---

## Adding a Utility

1. Create file in `src/utils/<name>.ts`.
2. Export pure functions + types; avoid default exports.
3. Add tests (`src/utils/__tests__/<name>.spec.ts`).
4. Update this README with intent and usage.
5. Consider re-export in `src/utils/index.ts` for discoverability.
