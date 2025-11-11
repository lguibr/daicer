# Custom Hooks

Shared hooks encapsulating authentication, sockets, combat state, and utility behavior. Each hook exports a typed API and hides implementation details (services, Zustand stores, etc.).

---

## Hook Catalogue

| Hook              | Responsibility                                              | Dependencies                                                 |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| `useAuth`         | Firebase auth state, Google sign-in/out, emulator awareness | `services/firebase`, `onAuthStateChanged`                    |
| `useSocket`       | Subscribe to socket events, expose derived room data        | `services/socket`, `zustand` room store                      |
| `useRoom`         | Selector wrapper around room store (players, messages)      | `useSocket`                                                  |
| `useCombat`       | Combat timeline, actions, optimistic updates                | `services/socket`, `services/combat`, `zustand` combat store |
| `useFocusRestore` | Manage focus when navigating between screens                | React refs, `useLayoutEffect`                                |
| `useInterval`     | Declarative `setInterval` with cancellation                 | Native timers                                                |

---

## API Contracts

### `useAuth`

```typescript
interface UseAuthReturn {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  token(): Promise<string | null>;
  emulatorHost?: string;
}
```

- Maintains refresh token and exposes `token()` for services.
- Automatically links emulator when `VITE_USE_EMULATORS=true`.

### `useSocket`

```typescript
interface UseSocketReturn {
  ready: boolean;
  messages: Message[];
  creatures: CreatureSummary[];
  emit<Action extends SocketAction>(action: Action, payload: PayloadMap[Action]): Promise<void>;
}
```

- Re-subscribes on reconnect, merges offline buffered messages.
- Emits events using `socket.emitWithAck` to ensure server acknowledgment.

### `useCombat`

```typescript
interface UseCombatReturn {
  state: CombatState | null;
  history: CombatTimeline[];
  activeCharacter?: CombatCharacter;
  submitAction(action: CombatActionInput): Promise<void>;
  restore(index: number): Promise<void>;
  isProcessing: boolean;
}
```

- Keeps optimistic snapshot until backend confirms version.
- Rewinds gracefully when server reports conflict (time travel).

---

## Patterns & Guidelines

- Hooks **never** mutate global state directly; they call `zustand` actions.
- Expose memoized handlers using `useCallback` to avoid re-renders.
- Provide `loading`/`error` booleans wherever asynchronous work occurs.
- Clean up subscriptions in `useEffect` return (socket listeners, intervals).
- Document return shape and side effects via TSDoc.

---

## Testing Hooks

```bash
yarn test frontend/src/hooks/__tests__
```

- Use `@testing-library/react` `renderHook`.
- Mock services (socket/api/firebase) per test.
- Assert state transitions, not implementation specifics.
- For time-based hooks, use `vi.useFakeTimers`.

Example:

```typescript
const { result } = renderHook(() => useAuth(), { wrapper: Providers });
await waitFor(() => expect(result.current.user).not.toBeUndefined());
```

---

## Extending Hook Set

1. Create file in `src/hooks/<name>.ts`.
2. Export named hook (`export function use...`).
3. Add tests under `src/hooks/__tests__`.
4. Document in this README (table + contract).
5. Keep dependencies minimal; do not directly import heavy modules if a service exists.
