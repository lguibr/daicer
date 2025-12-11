# Design Study 03: Multi-Level Architecture

This document defines the data structures and logic required to support true verticality: basements, second floors, towers, and the connections (stairs/doors) between them.

## The Z-Axis Challenge

Currently, DAICER treats the world mostly as a 2D plane (`z=0`) with some visual height. True 3D gameplay requires distinct **navigable spaces** at different Z-levels.

## Data Structure: The Sparse Voxel Octree (Concept)

While a full SVO is too complex for our 8x8 chunks service, we simulate it using **Layered Chunks**.

### The Tile Schema Update

We need to enhance `GridTile` to understand its vertical context.

```typescript
interface GridTile {
  // ... existing fields
  z: number; // The generic "layer"

  // New Fields for Verticality
  floorHeight: number; // 0.0 to 1.0 sub-tile height?
  ceilingHeight: number;

  // Connectivity
  hasStairsUp: boolean;
  hasStairsDown: boolean;
  isRamp: boolean;

  // Metadata for NLP
  roomName?: string; // "Kitchen", "Dungeon Cell 1"
  buildingId?: string;
}
```

## Structures as 3D Volumes

Structures must be defined as 3D volumes.

```typescript
interface Structure3D {
  id: string;
  floors: {
    [zOffset: number]: Biosphere3DTiles[][]; // zOffset 0 = ground, -1 = basement
  };
  connectors: VerticalConnector[];
}

interface VerticalConnector {
  x: number;
  y: number;
  fromZ: number;
  toZ: number;
  type: 'stairs' | 'ladder' | 'rope' | 'elevator';
}
```

## Stairs and Doors

### Doors (Horizontal Connectivity)

Doors connect two spaces on the same Z-level.

- **State**: `Open`, `Closed`, `Locked`, `Broken`.
- **Logic**: A closed door blocks `LineOfSight` and `Movement`. A transparent door (glass) blocks `Movement` but permits `LineOfSight`.

### Stairs (Vertical Connectivity)

Stairs are special tiles that allow traversal between `z` and `z+1`.

- **Grid Logic**: If an Entity is on a Stair tile at `z=0` and moves "Up", they transition to the Stair tile at `z=1`.
- **Visuals**: Rendered as a distinct geometry.
- **Traversal Cost**: Moving vertically likely costs 2x movement points.

## Sublevels and Dungeons

Dungeons are simply structures that extend deeply into negative Z.

- **Generation**: When generating a dungeon structure, we must "carve" void space into the underground stone.
- **Lighting**: Sublevels usually have `skylight: 0`. We must rely on `emissive` blocks (torches) or dynamic lights.

## Upper Levels and Rooftops

- **Rooftops**: A flat roof at `z=1` should be walkable.
- **Falling**: If a character walks off a tile at `z=1` into an `air` tile, they fall to `z=0` (taking damage).
- **Cover**: An entity on `z=1` has high-ground advantage attacking `z=0`. Mechanics covered in [Tactical Combat](05_tactical_combat_system.md).

## Example: The Tavern

- **Z=0 (Ground)**: Main bar, tables, door to street. Staircase going UP, trapdoor going DOWN.
- **Z=1 (Upstairs)**: Bedrooms, hallway. Window tiles (allow viewing out, maybe climbing out).
- **Z=-1 (Cellar)**: Wine storage, secret tunnel entrance.

```mermaid
graph TD
    Street[Street (z=0)] -- Door --> Bar[Common Room (z=0)]
    Bar -- Stairs Up --> Hallway[Hallway (z=1)]
    Hallway -- Door --> Bedroom[Bedroom (z=1)]
    Bar -- Trapdoor --> Cellar[Cellar (z=-1)]
    Cellar -- Hidden Door --> SecretTunnel[Secret Tunnel (z=-1)]
```

[Next: Movement & Physics](04_movement_and_physics.md)
[Back: Advanced World Gen](02_advanced_world_gen.md)
