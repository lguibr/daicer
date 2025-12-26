# Backend Codebase Size Report

## Top Offenders (by line count)

1.  **[game.ts](file:///Users/lg/lab/daicer/backend/src/api/game/services/game.ts)** - 1073 lines
2.  **[index.ts](file:///Users/lg/lab/daicer/backend/src/index.ts)** - 657 lines
3.  **[world-generator-logic.ts](file:///Users/lg/lab/daicer/backend/src/api/voxel-engine/services/world-generator-logic.ts)** - 504 lines
4.  **[seed.ts](file:///Users/lg/lab/daicer/backend/src/scripts/seed.ts)** - 492 lines
5.  **[types/index.ts](file:///Users/lg/lab/daicer/backend/src/types/index.ts)** - 276 lines
6.  **[turn-service.ts](file:///Users/lg/lab/daicer/backend/src/api/room/services/turn-service.ts)** - 260 lines
7.  **[llm/structured.ts](file:///Users/lg/lab/daicer/backend/src/utils/llm/structured.ts)** - 248 lines
8.  **[physics.ts](file:///Users/lg/lab/daicer/backend/src/api/voxel-engine/services/utils/physics.ts)** - 199 lines
9.  **[assets.ts](file:///Users/lg/lab/daicer/backend/src/api/assets/services/assets.ts)** - 184 lines
10. **[room.ts](file:///Users/lg/lab/daicer/backend/src/api/room/controllers/room.ts)** - 180 lines

---

## Detailed Analysis & Refactoring Plan

### 1. `game.ts` (1073 lines)

**Role:** The "God Object" of the backend game logic. It handles everything from world generation to turn processing, character management, and LLM interaction.
**Issues:**

- **Violation of Single Responsibility Principle:** Changes to turn logic, world gen, or character add require touching this same file.
- **Testing Nightmare:** Logic is tightly coupled, making it hard to test isolated features like "action submission".
- **Maintainability:** Hard to read due to mixing high-level flow (startGame) with low-level details (formatting strings for LLM).

**Proposed Split Strategy:**

1.  **`WorldGenerationService`**:
    - Extract `generateWorld` (lines 66-158) into `src/api/game/services/world-generation.ts`.
    - Isolate prompt construction for world gen.
2.  **`TurnProcessingService`**:
    - Extract `processTurn` (lines 160-400) and `submitAction` (lines 1000-1072) into `src/api/game/services/turn-processing.ts`.
    - This service should focus solely on the game loop: Input -> LLM -> State Update.
3.  **`CharacterLifecycleService`**:
    - Extract `addCharacter`, `createSnapshot`, `generateCharacterOpening` into `src/api/game/services/character-lifecycle.ts`.
    - This handles the specific flow of a player entering the game.
4.  **`GameOrchestrator`**:
    - Keep `game.ts` as a thin wrapper that orchestrates these services.
    - `startGame` calls `WorldGenerationService.generate` then `TurnProcessingService.start`.

### 2. `index.ts` (657 lines)

**Role:** Application entry point and Socket.IO handler.
**Issues:**

- Contains distinct logic for different socket events (`join`, `message`, `action`) all defined inline.
- Mixes Strapi bootstrap logic with real-time event handling.

**Proposed Split Strategy:**

1.  **Socket Event Handlers:**
    - Create `src/extensions/socket/handlers/` directory.
    - Extract `on('room:join')` logic to `room-join.handler.ts`.
    - Extract `on('game:action')` logic to `game-action.handler.ts`.
2.  **Socket Manager:**
    - Create a `SocketManager` class in `src/extensions/socket/socket-manager.ts` to register these handlers cleanly.
    - `index.ts` just initializes `SocketManager`.

### 3. `world-generator-logic.ts` (504 lines)

**Role:** Procedural voxel generation.
**Issues:**

- Likely mixes different generation stages (terrain shape, biomes, structures).

**Proposed Split Strategy:**

1.  **`TerrainGenerator`**: Focus on noise maps and height fields.
2.  **`StructurePlacer`**: Logic for placing rooms/roads.
3.  **`VoxelMesher`**: Logic for converting data to voxel types (if applicable).

## Type Tightness Improvements

- **Explicit Return Types:** Many functions have implicit return types. Standardize all Service methods to return `Promise<Result<T, E>>` or standard defined interfaces.
- **Zod Schemas:** For LLM outputs in `game.ts`, ensure `zod` schemas are strict and reused in a shared `schemas/` directory, rather than defined inline.
