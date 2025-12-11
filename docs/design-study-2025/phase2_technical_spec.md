# Phase 2: Movement & Physics (Technical Specification)

**Objective**: Implement a strict, server-authoritative physics engine (`NavGraph`), a "Global Sequential Turn" loop, and an Entropy system tied to player movement.

## 1. Architecture Overview

```mermaid
graph TD
    User([User]) -->|Intent: "I move North"| NLP[Intent Parser]
    NLP -->|Vector: [x,y,z]| TM[Turn Manager]

    subgraph Physics Engine
        TM -->|Query Cost| NG[NavGraph]
        NG -->|Validate| Walls[Collision Check]
        NG -->|Calculate| Cost[Tile Cost (1 vs 1.41)]
    end

    TM -->|If Valid| ES[Entropy System]
    ES -->|Distance+| Accum[Distance Accumulator]
    Accum -->|Threshold > 100ft| Event[Trigger Event]

    TM -->|Update DB| F[Firestore: Players]
    TM -->|Next Turn| Queue[Turn Queue]
```

## 2. Physics Engine Implementation

### 2.1 The `NavGraph`

**New/Refactor**: `backend/src/physics/nav-graph.ts`

Traditional 2D arrays are insufficient for "1.41 diagonal cost" and "Graph Traversal". We will implement a transient Graph built from `GridChunk` data.

**Class Structure**:

```typescript
class NavGraph {
  // Dijkstra / A* Helper
  getPath(start: Point3D, end: Point3D, limit: number): PathResult {
    // 1. Check Bounds
    // 2. Load surrounding chunks (if not cached)
    // 3. Run A* (Chebyshev Heuristic)
    // 4. Return exact cost (float) and path array
  }

  // Cost Function
  getCost(a: Point3D, b: Point3D): number {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    const dz = Math.abs(a.z - b.z);

    if (dz > 1) return Infinity; // Cannot jump 2 layers
    if (dx > 0 && dy > 0) return 1.414; // Diagonal
    return 1.0; // Cardinal
  }
}
```

### 2.2 Strict Movement Logic

**Refactor**: `backend/src/socket/handlers/move.ts` handles _real-time_ movement. We must split this:

1.  **Exploration Mode** (Real-time):
    - Preserve existing logic but ADD `NavGraph.isValidMove()` check.
    - No turn queue.
    - Latency: Immediate.
2.  **Combat Mode** (Turn-based):
    - **Block** all direct socket moves.
    - Only accept `turn_action` events via `TurnManager`.

## 3. The Turn Manager (Core Loop)

**New Service**: `backend/src/game-loop/turn-manager.ts`

**State Machine**:

- `IDLE`: Waiting for current player.
- `PROCESSING`: LLM/Physics running.
- `TRANSITION`: Moving to next actor.

**Queue Logic**:

```typescript
interface TurnState {
  actors: string[]; // [PlayerID, MonsterID, PlayerID]
  currentIndex: number;
  globalTimer: number; // For "Force Skip" mentioned in QA
}

function nextTurn(roomId: string) {
  const state = loadState(roomId);
  state.currentIndex = (state.currentIndex + 1) % state.actors.length;

  // Handle Disconnect (QA #67)
  if (isDisconnected(state.actors[state.currentIndex])) {
    convertToNPC(state.actors[state.currentIndex]); // or Skip
  }

  broadcast('turn_start', { actorId: state.actors[state.currentIndex] });
}
```

## 4. Entropy System Integration

**Refactor**: `backend/src/services/entropy/engine.ts`

**QA Constraint**: "Every 100ft".
Current implementation is RNG-based ("10% chance per turn"). We need a **Deterministic Accumulator**.

```typescript
// New Interface
interface EntropyState {
  distanceAccumulator: number; // Feet traveled since last event
  lastEventDistance: number;
}

function onPlayerMove(player, distance) {
  const settings = getRoomSettings();

  // 1. Accumulate
  state.distanceAccumulator += distance;

  // 2. Check Ration (QA #70) - 100k ft
  if (state.distanceAccumulator % 100000 < distance) {
    consumeRation(player);
  }

  // 3. Check Entropy Event (QA #11) - 100ft
  if (state.distanceAccumulator - state.lastEventDistance >= 100) {
    state.lastEventDistance = state.distanceAccumulator;
    triggerEntropyEvent(); // Calls existing RNG logic
  }
}
```

## 5. Testing & Validation

### 5.1 Physics Unit Tests

- **Diagonal**: `move(0,0 -> 1,1)` must cost `~1.41`, not `1` or `2`.
- **Wall**: `move(0,0 -> 1,0)` where `1,0` is Wall -> `InvalidMove`.
- **Vertical**: `move(0,0,0 -> 0,0,2)` -> `InvalidMove` (Too high).

### 5.2 Turn Loop Integration Test

1.  Initialize Combat with [P1, Goblin].
2.  P1 acts -> End Turn.
3.  Verfiy `CurrentActor == Goblin`.
4.  Goblin acts -> End Turn.
5.  Verify `CurrentActor == P1`.

## 6. Migration

- Existing `players` collection needs `distance_traveled` field.
- Existing `rooms` collection needs `turn_state` object.
