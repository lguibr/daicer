# Map System: Storage & Transmission Strategy

## Overview

Storing voxel data efficiently is a classic problem. A naive approach (storing every tile as a row) leads to billions of rows. A monolithic approach (one massive JSON blob) leads to memory exhaustion. We will use a **Sparse Chunk-Based approach** utilizing Postgres `bytea` (Binary) or `jsonb` combined with aggressive caching.

## Storage Strategy: "Seed + Delta" (The Git Approach)

We utilize the fact that our terrain is procedurally generated.

1.  **The Base Layer (Immutable)**: The procedural generation algorithm + Seed. We do **NOT** store the generated grass/dirt tiles if they match the seed logic.
2.  **The Delta Layer (Mutable)**: We only store **changes**. If a player digs a hole or builds a wall, we store that specific modification.

### Database Schema (Postgres)

We will introduce a new model `MapChunk` in Strapi (or raw SQL if performance demands).

```sql
CREATE TABLE map_chunks (
    id SERIAL PRIMARY KEY,
    world_id INTEGER REFERENCES rooms(id),
    x INTEGER NOT NULL, -- Chunk X coordinate
    y INTEGER NOT NULL, -- Chunk Y coordinate

    -- The Checksum ensures the client knows if it needs to redownload
    version INTEGER DEFAULT 1,

    -- Option A: JSONB (Easier to debug, more storage)
    -- Stores only modified tiles: { "3-5-0": { "t": "stone_floor" } }
    deltas JSONB, -- Key: "localX-localY-localZ", Value: TileData

    -- Option B: Binary BLOB (Optimized)
    -- Protocol Buffer or custom binary format for dense changes
    packed_data BYTEA,

    UNIQUE(world_id, x, y)
);
```

### Why "Seed + Delta"?

- **Storage**: A 1024x1024 world is `64x64 chunks` = 4096 chunks.
- If unmodified, we store **0 chunks**.
- If a player builds a house in one chunk, we store **1 chunk row**.
- **Compression**: The procedural seed serves as a massive compression algorithm.

## Transmission Protocol: "Chunk Streaming"

We will move away from the monolithic `generateTerrain` GraphQL query that returns the whole world.

### Flow

1.  **Handshake**: Client connects, gets World Gen Params (Seed, Settings, Version).
2.  **Hydration (Client)**: Client generates the _Base Layer_ locally using `@daicer/shared/simple-gen.ts`. This is instant and costs 0 bandwidth.
3.  **Delta Stream**: Client subscribes to the map channel (Socket.io).
4.  **Viewport Request**: Client sends `GET /api/terrain/viewport?minX=0&minY=0&maxX=32&maxY=32`.
5.  **Response**: Server returns **only the modified chunks** in that viewport.
6.  **Merge**: Client logic: `FinalTile = DeltaTile ?? ProceduralTile`.

### Protocol Data Unit (PDU)

We will use a compact JSON format for transmission to keep it compatible with Strapi/GraphQL constraints, but optimized.

```typescript
interface ChunkUpdate {
  x: number; // Chunk Coords
  y: number;
  v: number; // Version
  d: Record<string, MinimalTile>; // "x,y,z" -> { t: 12, b: 5 } (Enum mapped)
}
```

## Optimizing Transmission

1.  **Index-Mapped Enums**:
    - Instead of sending string `"structure_wall_stone_c"`, we map it to an integer `ID` in a shared registry.
    - `grass` = 0, `stone` = 1, `wall` = 45.
    - Saves ~80% of JSON size.

2.  **Run-Length Encoding (RLE) for Areas**:
    - If a whole 16x16 area is filled with "Lava", we define a "Zone" rather than 256 individual tiles.

3.  **Socket.io Rooms per Region**:
    - `room_world_123_chunk_0_0`
    - Players only join socket rooms for chunks they are looking at.
    - Changes in a dungeon miles away are not broadcast to you.

## Migration Path

1.  **Phase 1 (JSON)**: Implement `deltas` as JSONB. Easy to query, easy to implement.
2.  **Phase 2 (Binary)**: If JSONB becomes too slow (>100ms parse), switch to `flatbuffers` or `protobuf`.

## Recommendation

Start with **JSONB Delta Storage** in Postgres. It strikes the perfect balance between implementation speed and performance for Daicer's current scale (Concurrent users < 1000). The "Seed + Delta" architecture is the critical architectural win.
