# Design Study 12: Master Implementation Plan

This document synthesizes the vision from Studies 01-10 and the constraints from Study 11 into a concrete roadmap.

## Project Vision

A turn-based, text-driven RPG with a 1:1 scale infinite world, true verticality (7 layers), and a DM AI Agent acting as the central arbiter of rules and narrative.

## Core Constraints (from Clarifications)

- **Scale**: 1 Grid Unit = 1 Foot.
- **Verticality**: Fixed 7 Layers (Surface + 3 Upper + 3 Lower).
- **Destructibility**: None (Static Map).
- **Control**: Chat-driven. Click = "Reference".
- **Turns**: Global Sequential Turns (Combat) or Free Flow (Travel).
- **Mobile**: Touch support required.

---

## Phase 1: The Vertical World (Data & Rendering)

**Goal**: Render a static, multi-layer world where players can exist at different Z-levels.

### 1.1 Backend: 7-Layer Chunk Architecture

- **Refactor `GridChunk`**:
  - Change `tiles: GridTile[]` to a structure supporting the 7 fixed layers.
  - `z` index: `-3, -2, -1, 0, 1, 2, 3`.
  - **Generation**: Update `GridChunkGenerator` to strictly generate these layers.
    - `z=0`: Terrain (Noise).
    - `z < 0`: Stone/Caves.
    - `z > 0`: Air/Sky.
- **Structure Stamper 2.0**:
  - Implement "Foundation" logic (Cobblestone down to Z=0).
  - Implement "Zone" blending (Smooth Perlin).

### 1.2 Frontend: Layered Canvas Renderer

- **Refactor `GridMapRenderer`**:
  - **Layering Loop**: Draw Z-3 to Z+3.
  - **Ghosting**: If `Player.z < Tile.z`, render tile with `opacity: 0.3` (Ghost Mode).
  - **Depth Tint**: Tint lower levels blue/black.
  - **Fog of War**: Implement "Grey out" for visited-but-not-visible chunks.

### 1.3 Testing

- **Unit**: Verify Chunk generation produces valid arrays for all 7 layers.
- **Visual**: Auto-generate a "Test Pattern" chunk with distinct blocks on each layer to verify rendering order.

---

## Phase 2: Movement & Physics (The Rules)

**Goal**: Enforce strict movement costs, turns, and collisions.

### 2.1 Physics Engine (`backend/src/physics/`)

- **`NavGraph` Implementation**:
  - Build graph nodes from 7-layer grid.
  - **Cost**: 1.0 (Cardinal) vs 1.41 (Diagonal).
  - **Validation**: `isValidMove(start, end)` -> Checks walls, limits, and "Floor to nearest tile".
- **`EntropySystem`**:
  - **Accumulator**: Track `distanceTraveled` per player.
  - **Trigger**: Every 100ft -> `EntropyEvent.emit()`.
  - **Resource**: Every 100k ft -> Deduct Ration.

### 2.2 Turn Manager (`backend/src/game-loop/`)

- **Queue System**: `SequentialTurnQueue`.
- **State Machine**: `FreeRoam` <-> `Combat`.
- **Initiative**: Sort by `Agility`.
- **Disconnect Strategy**: Auto-skip or convert to NPC.

### 2.3 Testing

- **Unit**: Test Diagonal math (10 steps diagonal = 14 tile cost).
- **Integration**: Simulate a "Long Walk" of 200ft and verify 2 Entropy triggers fire.

---

## Phase 3: The DM Agent (The Brain)

**Goal**: Connect Chat to Physics.

### 3.1 LangChain Integration

- **Context Window**: Implement Sliding Window (50 turns).
- **Summarizer**: Middleware to compress turns 1-40 into narrative summary.
- **Intent Parser**:
  - Input: "I run to the door."
  - Output: `{ action: "MOVE", target: { x: 10, y: 10, z: 0 } }`.

### 3.2 Action Resolver

- **The Arbiter**:
  1.  Receive Intent.
  2.  Validate against Physics (Phase 2).
  3.  If Valid -> Execute & Narrate.
  4.  If Invalid -> DM Agent narrates failure ("The door is locked").

### 3.3 Testing

- **Mock**: Feed raw text intents "Attack Goblin" and verify HP reduction.
- **Stress**: Feed 50 messages to verify Context Window summarizes correctly.

---

## Phase 4: Mobile UX & Polish

**Goal**: Make it playable on a phone.

### 4.1 Input Refinement

- **Tap-to-Reference**:
  - Tap Tile -> Insert `[120, 50, 0]` into Chat Input.
- **Visual Feeback**:
  - Highlight selected tile.
  - Show "Ghost Path" if movement is currently being typed.

### 4.2 Optimization

- **Firestore**: Optimize write batching for turn updates.
- **Lazy Loading**: Ensure "Infinite Coordinates" don't crash memory (unload distant chunks).

---

## Documentation Strategy

- **Live Docs**: Keep `docs/design-study-2025/` updated as "Source of Truth".
- **API Docs**: Auto-generate for `MapService` and `TurnManager`.

## Next Immediate Steps

1.  Discuss **Phase 1** details.
2.  Begin refactoring `GridChunk` schema in `shared` to support 7 layers.
