# Utilities

Helper functions and shared utilities.

## Files

- `logger.ts` - Winston logger configuration
- `room-code.ts` - Room code generation and validation
- `game-mechanics.ts` - D20 game calculations
- `response.ts` - Standard API response formatters

## Principles

All utilities:
1. Are pure functions (where possible)
2. Have comprehensive JSDoc
3. Include input validation
4. Handle edge cases
5. Are fully unit tested

## Example

```typescript
import { generateRoomCode } from '@/utils/room-code.js';

const code = generateRoomCode(); // "ABC123"
```

