# Structure Generation Module

Structures are **first-class biomes** in the DAICE world generation pipeline. They are placed FIRST, before noise generation, and all subsequent algorithms respect their boundaries.

## Architecture

### Generation Pipeline Order

```
1. Structure Placement (this module) → outputs biome grid with "structure_*" biomes
2. Simplex Noise (elevation/moisture) → avoids structure tiles
3. Biome Classification → assigns biomes to non-structure tiles only
4. Cellular Automata / BSP / Poisson → respects structure boundaries
5. WFC Edge Blending (optional) → blends structure edges into terrain
```

### Structure Biome Naming

Structures are represented as biome types:

- Format: `structure_{type}_{material}_{floor}`
- Examples:
  - `structure_house_wood_0` (house surface floor, wood)
  - `structure_castle_stone_-1` (castle basement, stone)
  - `structure_road_stone` (road, stone)

## Multi-Floor Support

Structures support 3 floors:

- Floor -1: Underground (basements, dungeons, caves)
- Floor 0: Surface (main level, roads)
- Floor +1: Upper (second stories, towers)

Stairs are bidirectional and connect adjacent floors.

## Usage

```typescript
import { generateStructuresAsBiomes } from '@daicer/shared/world-gen/structures';

const result = generateStructuresAsBiomes(256, 256, 'my-seed', {
  minDistance: 30,
  maxStructures: 20,
  generateRoads: true,
  roadMaterial: 'stone',
  wfcBlendEdges: false,
});

// result.biomeGrid[floor][y][x] = biome name
// result.structures = array of placed structures

// Use structure biomes in subsequent generation steps
const surfaceBiomes = result.biomeGrid[1]; // Floor 0 (surface)
// Pass to noise, CA, BSP, etc. - they will respect structure tiles
```

## Structure Types

- `house`: Small residential building (floor 0 only)
- `tower`: Tall defensive structure (all 3 floors)
- `castle`: Large fortress (all 3 floors)
- `dungeon`: Underground complex (floors -1 and 0)
- `temple`: Religious structure (floor 0 only)
- `cave_entrance`: Natural cave opening (floor -1 only)
- `ancient_tree`: Massive tree (floor 0 only)
- `stone_circle`: Ritual site (floor 0 only)
- `road`: Pathways connecting structures (floor 0 only)

## Materials

- `wood`: Brown (#8B4513)
- `stone`: Gray (#696969)
- `metal`: Silver (#A9A9A9)
- `marble`: Beige (#F5F5DC)
- `rock`: Dark gray (#4A4A4A)

## Determinism

All generation uses seeded PRNG (Alea). Same seed + params = identical structure placement.

## Road Generation

When `generateRoads: true`, the system uses A\* pathfinding to connect structures:

1. Find nearest neighbor for each structure
2. A\* path between structure centers
3. Cost function prefers flat terrain, avoids water/mountains
4. Roads placed on floor 0 as `structure_road_{material}` biomes

## Integration

Other algorithms check for structure biomes:

```typescript
import { isStructureBiome, canAssignBiome } from '@daicer/shared/world-gen/structures';

// Skip structure tiles in noise generation
if (isStructureBiome(biomeGrid[y][x])) {
  continue; // Don't overwrite structure
}

// Check before assigning biome
if (canAssignBiome(biomeGrid, x, y)) {
  biomeGrid[y][x] = 'plains';
}
```
