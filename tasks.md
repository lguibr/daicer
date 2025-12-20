# Map System: Migration Task Tracker

## Phase 0: Preparation & Cleanup <!-- id: 0 -->

- [ ] **Audit Shared Library** <!-- id: 1 -->
  - [ ] Ensure `@daicer/shared` exports strict `TerrainTile` and `ChunkDTO` types.
  - [ ] Verify `simple-gen.ts` is pure and deterministic (no global state).
- [ ] **Clean Legacy Code** <!-- id: 2 -->
  - [ ] Deprecate `generateWholeMap` in Backend (mark as `@deprecated`).
  - [ ] Identify all callsites of `chunkLoader.ts` (Legacy Parser).

## Phase 1: Backend Infrastructure <!-- id: 3 -->

- [ ] **Database Schema** <!-- id: 4 -->
  - [ ] Create `MapChunk` Content Type in Strapi.
    - `room` (Relation)
    - `x`, `y` (Integer)
    - `deltas` (JSON)
  - [ ] Add unique index on `(room, x, y)`.
- [ ] **Terrain Service V2** <!-- id: 5 -->
  - [ ] Implement `getChunk(room, x, y)`:
    - Check DB for `MapChunk`.
    - If missing, return `null` (Client uses Seed).
    - If present, return `deltas`.
  - [ ] Implement `updateChunk(room, x, y, deltas)`:
    - Upsert logic for `MapChunk`.
    - Merge new delta with existing delta.

## Phase 2: Frontend Core (The "Brain") <!-- id: 6 -->

- [ ] **State Management** <!-- id: 7 -->
  - [ ] Install `zustand`.
  - [ ] Create `useTerrainStore`:
    - `chunks`: Map<"x,y", ChunkData>
    - `modified`: Set<"x,y">
- [ ] **Web Worker Setup** <!-- id: 8 -->
  - [ ] Create `terrain.worker.ts`.
  - [ ] Move `simple-gen.ts` logic into worker.
  - [ ] Implement message passing: `Main -> Worker: Generate(x,y) -> Worker -> Main: ChunkData`.
- [ ] **Network Layer** <!-- id: 9 -->
  - [ ] Implement `TerrainAPI.fetchDeltas(viewport)`.
  - [ ] Implement `TerrainSocket.subscribe(viewport)`.

## Phase 3: Integration (The "Body") <!-- id: 10 -->

- [ ] **GameplayScreen Refactor** <!-- id: 11 -->
  - [ ] Remove local `grid3D` state.
  - [ ] Connect `TerrainExplorer` to `useTerrainStore`.
  - [ ] Implement `useViewportObserver` to trigger fetches on move.
- [ ] **Terraforming UI** <!-- id: 12 -->
  - [ ] Add "Brush" tool to Admin/DM Panel.
  - [ ] Implement `handleClick` -> `store.modify` -> `socket.emit`.
- [ ] **Preview Screen Update** <!-- id: 13 -->
  - [ ] Switch `TerrainGenerationScreen` to use the same `useTerrainStore`.
  - [ ] Verify identical rendering between Preview and Game.

## Phase 4: Entities & Polish <!-- id: 14 -->

- [ ] **Entity Persistence** <!-- id: 15 -->
  - [ ] Update `CharacterSheet` to store `(x,y,z)` float coordinates.
  - [ ] Update `Structure` to snap to grid but store orientation.
- [ ] **Optimization** <!-- id: 16 -->
  - [ ] Implement LRU Cache for `useTerrainStore` (limit to 500 chunks).
  - [ ] Profile Web Worker performance.
- [ ] **Final Verification** <!-- id: 17 -->
  - [ ] E2E Test: "Build a wall, refresh page, wall is still there."
  - [ ] E2E Test: "Player A builds, Player B sees it instantly."

---

## Detailed Task Breakdown (Example for Phase 1)

### 1.1 Create MapChunk Model

```bash
strapi generate content-type map-chunk
```

- Define attributes in `schema.json`.
- Run build.

### 1.2 Implement Delta Merging

- Write utility `mergeDeltas(base: object, updates: object): object`
- Ensure it handles nested keys if necessary (though flat is better).

### 1.3 Create "World Spine" API

- Endpoint: `GET /world/:id/spine`
- Returns: Seed, Global Settings, and list of _Occupied Chunk coords_ (Sparse Index).
