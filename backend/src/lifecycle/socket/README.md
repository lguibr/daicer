# Socket Lifecycle Module

This directory contains the logic for the backend's realtime communication layer using [Socket.IO](https://socket.io/). It handles room connections, game state synchronization, and realtime broadcasting of LLM stream events.

## Initialization

The socket server is initialized in `backend/src/index.ts` during the Strapi bootstrap phase. It attaches to the main Strapi HTTP server.

```typescript
// backend/src/lifecycle/socket/init.ts
export const initSocket = (strapi) => { ... }
```

### CORS Configuration

The socket server is configured to accept connections from:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `process.env.PUBLIC_CLIENT_URL`

## Authentication & Connection

Currently, the socket connection does **not** enforce strict token-based authentication at the handshake level. Instead, it relies on the client to identify itself during the `room:join` event.

1. **Client Connects**: The client connects to the socket server.
2. **Client Identifies**: The client emits `room:join` with `{ roomId, userId }`.
   - The handler verifies if the `userId` is valid (logic internal to handler).
   - If valid, the socket joins a specifically named channel `user:${userId}` for private targeting.

## Event API

### Client -> Server Events

| Event           | Payload                                 | Description                                                                                   |
| --------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `room:join`     | `{ roomId: string, userId: string }`    | Request to join a specific game room. Validates room existence and returns initial GameState. |
| `turn:process`  | `{ roomId: string, language?: string }` | Triggers the backend AI to process the current turn for the room.                             |
| `player:action` | `{ roomId: string, action: any }`       | _Draft_ event for handling specific player interactions.                                      |

### Server -> Client Events

| Event              | Payload                               | Description                                                                                   |
| ------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `gameState`        | `GameState` Object                    | Sent immediately after successful `room:join`. Contains players, messages, and room settings. |
| `turn:processing`  | `{ roomId: string }`                  | Broadcasted when `turn:process` initiates. Used to lock UI or show loaders.                   |
| `turn:complete`    | `{ roomId: string, error?: boolean }` | Broadcasted when turn processing finishes.                                                    |
| `error`            | `{ message: string }`                 | Sent to the specific socket if an operation fails (e.g., Room not found).                     |
| `llm:stream:event` | `StreamEvent`                         | Realtime streaming tokens and tool updates from the LLM. See below.                           |

### LLM Streaming Events (`llm:stream:event`)

The backend streams LLM generation in realtime via the `streamManager`. These events flow through the socket room.

**Payload Structure:**

```typescript
interface StreamEvent {
  streamId: string;
  roomId: string;
  type: 'text' | 'tool_start' | 'tool_end' | 'reasoning' | 'error' | 'done';
  content?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}
```

## Internal Architecture

### Handlers

Event logic is separated into specific handlers:

- **`handlers/room-join.ts`**:

  - Fetches the room by `roomId`, `code`, or `documentId`.
  - Populates deep relations (players, characters, messages).
  - Formats legacy messages into a unified `narration` vs `chat` structure.
  - Emits the initial `gameState`.

- **`handlers/turn-handlers.ts`**:

  - Calls `strapi.service('api::game.game').processTurn(...)`.
  - Manages the `turn:processing` and `turn:complete` lifecycle broadcasts.

- **`stream-manager` Integration**:
  - The `streamManager` singleton holds a reference to the `io` instance.
  - Used by unrelated services (like the AI Engine) to push updates to frontend clients without direct access to the socket object.
