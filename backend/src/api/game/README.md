# Game API (`backend/src/api/game`)

The **Game API** is the central orchestrator for the gameplay session. It ties together the **Voxel Engine**, **[LLM Narrator](../narrator/README.md)**, and **Player State** to advance the game.

Unlike strict CRUD endpoints, this module focuses on **processes**—handling the flow of turns, actions, and events.

## 🏗 Architecture

The module acts as a facade, delegating specific logic to specialized services while maintaining the overall game loop.

| Service | Responsibility |
| `game.ts` | **Entry Point**. Orchestrates high-level flows like `startGame` and `processTurn`. |
| `turn-processing.ts` | **The Core Loop**. Handles both LLM-driven narrative turns and Deterministic (Engine) physical turns. |
| `character-lifecycle.ts` | **Entity Management**. Creating characters, generating snapshots, and handling introductory vignettes. |
| `world-generation.ts` | **Setup**. Interfaces with the Voxel Engine to create the initial world state. |
| `spawn-service.ts` | **Spawning**. Handles the dynamic addition of monsters and NPCs to the Room. |

## 🧩 Orchestration

### Rooms & State

The `Room` entity serves as the container for the session. The Game API does not own the `Room` data but heavily manipulates it, updating:

- **Phase**: (`setup` -> `game`)
- **Players**: State, actions, and readiness.
- **Creatures**: Spawning and health updates.

### Turns & TimeFrames

The Game API drives the **linear history** of the game by creating `Turn` entities.

1. **Player Actions**: Players submit actions via `submitAction`.
2. **Processing**: `processTurn` is called (either manually or via trigger).
3. **Turn Creation**: A new `Turn` entity is created, containing:
   - **Narrative**: The LLM's description of events.
   - **Snapshots**: A frozen state of all characters (HP, Position, Stats).
   - **Metadata**: Engine results or LLM reasoning.

> **Note**: These `Turn` entities are the source of truth for **[TimeFrames](../time-frame/README.md)**. While this module doesn't manipulate `TimeFrame` entities directly, its `Turn` outputs are what the TimeFrame system uses to reconstruct the state at any point in history.

### The Engine (Deterministic vs LLM)

The module manages a hybrid loop:

- **LLM Turns**: The "Soul". Interprets player intent, generates rolled results (narratively), and advances the story.
  - _Triggered by:_ Chat events, roleplay actions.
- **Deterministic Turns**: The "Body". Executes physics, movement, and strict rule enforcement via the Voxel Engine.
  - _Triggered by:_ Movement requests (`executeEngineAction`), grid updates.

## 📡 Global vs. Local Events

The Game API uses the `StreamManager` to broadcast real-time state changes to connected clients over **[Socket.IO](../../lifecycle/socket/README.md)**.

### Global Events (Room-Wide)

Updates that affect the shared world state or game phase.

- `game:start`: The session has begun. Includes the main opening message.
- `turn:processing`: The system is calculating the next turn (shows loading indicators).
- `turn:complete`: A turn has finished. Payload includes the new `Turn` ID, narrative, and snapshots.
- `game:update`: General updates to player lists (e.g., someone clicked "Ready").

### Local/Specific Events

Updates targeting entity visualization or specific message streams.

- `message:new`: A new chat message (Narration, Dialogue) has been added.
- `entities:update`: High-frequency updates for entity positions and stats (often from Deterministic turns).

## 🚀 Key Workflows

### 1. Game Start

`startGame(roomId)`

1. Fetches the Room and Players.
2. Generates the **Main Opening** (LLM).
3. Creates **Character Sheets** for all players.
4. Generates **Character Openings** (Vignettes).
5. Creates the initial `Turn (0)` (Game Start).
6. Broadcasts `game:start`.

### 2. Processing a Turn

`processTurn(roomId, args...)`

1. Broadcasts `turn:processing`.
2. Aggregates context (Messages, Actions, World State).
3. Calls LLM to resolve the outcome.
4. Creates `Turn` and `Message` entities.
5. Clears player actions.
6. Broadcasts `turn:complete` and `message:new`.
