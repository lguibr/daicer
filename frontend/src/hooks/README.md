# React Hooks

Custom React hooks for shared logic.

## Hooks

- **useAuth** - Firebase authentication state and methods
- **useSocket** - Socket.io real-time connection and state
- **useRoom** - Room management and state

## Usage

```typescript
import { useAuth } from './hooks/useAuth';

function Component() {
  const { user, signInWithGoogle, signOut } = useAuth();

  // ...
}
```

## Patterns

All hooks:

1. Return typed objects
2. Handle cleanup in useEffect
3. Provide loading/error states
4. Use useCallback for stable references
