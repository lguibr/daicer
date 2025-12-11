# Design Study 08: Data Persistence Schema

This document outlines the database schema required to store the complex, multi-level, mutable world described in this study. We use **Firestore** (NoSQL), which requires careful indexing and denormalization.

## Core Collections

### `rooms/{roomId}/grid_chunks/{chunkId}`

The atom of the world.

- **ID**: `${x}_${y}_${z}` (e.g., `10_-5_0` is chunk 10, -5 at ground level).
- **Fields**:
  - `tiles`: Compressed string or Binary Blob (Uint8Array) to save space. JSON arrays are too verbose for 8x8xN tiles.
  - `features`: Array of large objects (Trees, Rocks).
  - `structures`: Array of structure IDs referenced here.
  - `lastVisited`: Timestamp for cache invalidation.

### `rooms/{roomId}/entities`

Mutable actors and objects.

- **Fields**:
  - `pos`: `{x, y, z}` (Indexed for spatial query).
  - `type`: `PLAYER` | `NPC` | `OBJECT` | `MEMORY`.
  - `stats`: JSON block for HP, AC, etc.
  - `inventory`: Sub-collection or Array.

### `rooms/{roomId}/road_network` (New)

Stores the vector graph for navigation.

- **Document**: `global_graph`
- **Fields**:
  - `nodes`: Array of `{id, x, y, z}`.
  - `edges`: Array of `{from, to, weight, type}`.

## Optimizing for 3D Queries

Firestore does not support true 3D spatial queries natively (`x > 1 AND x < 10 AND y > 1...` requires composite indexes).

### Strategy: The "Zone" Partitioning

We partition the world into "Zones" (Super-Chunks, e.g., 64x64 tiles).

- Every Entity has a `zoneId` field.
- Query: `where('zoneId', '==', currentZone).where('z', '==', currentZ)`
- This drastically reduces the search space without complex composite indexes.

## State Serialization (The Save System)

The world is procedurally generated (`seed`). We only need to store **Deltas** (Changes).

### The "Layered" Load approach

1.  **Base Layer**: Procedural Generation (Deterministically recreates terrain/trees from `seed`).
2.  **Structure Layer**: Stamped structures (Deterministically placed).
3.  **Delta Layer** (Firestore): "Tile at 10,10,0 was destroyed", "Door opened".

**Delta Schema**:

```typescript
interface ChunkDelta {
  chunkId: string;
  modifiedTiles: Record<string, BlockType>; // Key: "localX_localY", Value: NewType
  deletedFeatures: string[]; // IDs of trees/rocks removed
  addedFeatures: GridFeature[]; // New things built by players
}
```

This keeps db costs low. We don't store the whole chunk, just what changed.

## Real-Time Synchronization

- **Socket.IO**: Used for ephemeral movement updates (20Hz).
- **Firestore**: Used for "At Rest" persistence (Auto-save every 5s or on significant events).
- **Optimistic UI**: Frontend predicts the move, Backend validates asynchronously.

[Next: Visual Feedback & UX](09_visual_feedback_ux.md)
[Back: Natural Language Engine](07_natural_language_engine.md)
