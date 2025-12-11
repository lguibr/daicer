# Design Study 02: Advanced World Generation

This document details the algorithms and systems required to generate cohesive road networks, structure clusters, and dynamic density.

## The Problem with Noise

Current generation relies heavily on Simplex Noise. While good for terrain (biomes, elevation), noise is poor for **human geography** (towns, roads, districts). Humans build in patterns, not gradients.

## Proposed System: Hierarchical Generation

We will implement a multi-pass generation system:

1.  **Macro Pass (Regional)**: voronoi cells or noise to determine political boundaries and "City Nodes".
2.  **Meso Pass (District/Town)**: L-Systems or Growth algorithms to lay out roads radiating from City Nodes.
3.  **Micro Pass (Chunk)**: Determining specific buildings and filling gaps.

```mermaid
graph TD
    Seed --> Macro[Macro Gen (Regions)]
    Macro --> CityNodes[City Nodes Identified]
    CityNodes --> RoadGen[Road Network Generator]
    RoadGen --> Highways[Major Highways]
    Highways --> Districts[District Zoning]
    Districts --> LocalRoads[Local Streets]
    LocalRoads --> Lots[Building Lots]
    Lots --> Stamper[Structure Stamper]
```

## Road Network Generation

Instead of per-chunk noise, we generate a **Vector Road Graph** at the region level.

### Algorithm: Randomized Prim's or L-System

- **Highways**: Connect major City Nodes using A\* pathfinding over the terrain cost map (avoiding mountains/oceans).
- **Streets**: Grow organically from Highways into suitable flat terrain.

**Data Structure**:

```typescript
interface RoadSegment {
  start: Point; // Global World Coords
  end: Point;
  width: number; // 3 for highways, 1 for paths
  type: 'dirt' | 'paved' | 'cobblestone';
}
```

When generating a chunk (`getChunk`), we query the Global Road Graph: "Does any road segment intersect this chunk?" If yes, we rasterize the vector line into grid tiles.

## Structure Density & Zoning

We introduce **Density Maps**.

- **Center**: High density, stone buildings, paved roads.
- **Outskirts**: Medium density, wood buildings, dirt roads.
- **Wilderness**: Low density, scattered ruins/cabins.

**Configuration**:
The DM can set `structureDensity` (0.0 to 1.0).

- `0.0`: Pure wilderness.
- `1.0`: Dense urban sprawl.

### Zoning Logic

We define `Lots` along the road network.

1.  Trace a road.
2.  Identify empty space perpendicular to the road.
3.  Allocate a `Lot` rect (e.g., 10x10).
4.  Assign a `StructureType` based on the Zone (Commercial near intersections, Residential otherwise).

## Structure Stamper 2.0

The new clamper must support **Multi-tile Structures** properly.

- **Input**: `Structure` object with `width`, `height`, and `floors` (Map<z, tiles[][]>).
- **Process**:
  - Iterate all Z-levels defined in the structure.
  - For `z < 0` (Basements): Dig out terrain (replace stone/dirt with structure air/walls).
  - For `z > 0` (Towers): overwrite air.
  - For `z = 0` (Ground): Flatten terrain? Or adapt foundation? **Decision**: We will enforce "Flatten Terrain" for the lot area to avoid floating houses.

## Integration with Data

The `MapService` will maintain a `RegionGraph` component that caches the high-level road vectors. This avoids having to recalculate A\* paths for every single 8x8 chunk.

[Next: Multi-Level Architecture](03_multi_level_architecture.md)
[Back: Overview](01_architecture_overview.md)
