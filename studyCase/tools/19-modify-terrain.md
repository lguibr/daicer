# Tool Name: `modify_terrain`

**Category**: DM Management  
**Engine Layer**: VoxelEngine

## 1. Introduction

The `modify_terrain` tool allows dynamic alteration of the voxel grid. This includes digging tunnels, building walls, creating magical barriers, or terraforming.

## 2. Use Case

- A Wizard casts _Wall of Stone_.
- An explosion destroys a bridge.
- The DM opens a secret passage by removing a wall block.

## 3. Tool Definition (Schema)

```typescript
interface ModifyTerrainInput {
  roomId: string; // Context
  operations: {
    position: { x: number; y: number; z: number };
    action: 'place' | 'remove' | 'replace';
    blockType?: string; // ID from Block Registry (e.g., 'stone_brick', 'lava')
  }[];
  temporary?: boolean; // If true, reverts after duration (e.g. Wall of Force)
  durationRounds?: number;
}
```

## 4. Expected Results

- **Validation**:
  - Checks if position is within map bounds.
  - 'Place' requires empty space (unless replacing).
- **Execution**:
  - Updates `Chunk` data.
  - Recalculates NavMesh/Pathfinding graph (Heavy operation!).
- **Events**:
  - `CHUNK_UPDATE`: Frontend re-renders the specific mesh chunk.
  - `PATH_INVALIDATED`: Entities with queued paths through this area stop.

## 5. Implementation Locations

- **Shared Engine**: `ChunkManager` & `VoxelState`.
- **Backend**: `TurnPersistence` (Must save map changes).
