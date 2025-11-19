# World Generation Toolkit

Framework-agnostic procedural generation algorithms for DAICE.

## Overview

This module provides all the core algorithms used for world generation:

- **Simplex Noise** - Organic terrain generation (temperature, moisture, elevation, erosion)
- **Cellular Automata** - Cave and cavern systems
- **Binary Space Partitioning (BSP)** - Dungeon room layouts
- **Voronoi + Poisson Disc** - Natural feature distribution and biome regions
- **Wave Function Collapse (WFC)** - Constraint-based structure generation

All algorithms are:

- **Deterministic** - Same seed produces same output
- **Framework-agnostic** - No React, no Winston logger, no LangGraph dependencies
- **Frontend-compatible** - Can run in browser or Node.js
- **Callback-based** - Optional `onDebug`, `onProgress` callbacks for debugging

## Installation

```bash
yarn workspace @daicer/shared add fast-simplex-noise
```

## Usage

### Simplex Noise

```typescript
import { SimplexNoise, Alea } from '@daicer/shared/world-gen/noise';

const noise = new SimplexNoise('my-seed');

// Basic 2D noise
const value = noise.noise(x, y); // -1 to 1

// Octave noise (Fractal Brownian Motion)
const terrain = noise.octaveNoise(x * 0.01, y * 0.01, 4, 0.5, 2.0);

// Domain warping for organic shapes
const warped = noise.domainWarpedNoise(x, y, 0.5, 4);

// Ridge noise for mountains
const mountains = noise.ridgeNoise(x, y, 4);
```

### Cellular Automata

```typescript
import { generateCaveCA } from '@daicer/shared/world-gen/cellular-automata';

const cave = generateCaveCA(
  50,
  50, // width, height
  'cave-seed',
  {
    fillPercentage: 0.45,
    iterations: 5,
    birthLimit: 4,
    deathLimit: 3,
  },
  {
    onProgress: (iter, max) => console.log(`Iteration ${iter}/${max}`),
  }
);

// cave is boolean[][] where true = solid rock, false = air
```

### Binary Space Partitioning

```typescript
import { generateBSPLayout } from '@daicer/shared/world-gen/bsp';

const rooms = generateBSPLayout(
  80,
  60, // width, height
  'dungeon-seed',
  {
    minRoomSize: 4,
    maxRoomSize: 12,
    splitRatio: 0.5,
  }
);

// rooms is BSPRoom[] with x, y, width, height, doorPositions
```

### Voronoi and Poisson Disc

```typescript
import { poissonDiskSampling2D, findNearestVoronoiSeed } from '@daicer/shared/world-gen/voronoi';

// Generate evenly-spaced points
const points = poissonDiskSampling2D(
  100,
  100, // width, height
  10, // min distance
  30, // max attempts
  'feature-seed'
);

// Find nearest Voronoi seed
const nearest = findNearestVoronoiSeed(x, y, points);
```

### Wave Function Collapse

```typescript
import { collapseGrid, getPresetTiles } from '@daicer/shared/world-gen/wfc';

const tiles = getPresetTiles('castle');

const result = collapseGrid(
  20,
  20, // width, height
  tiles,
  'castle-seed',
  1000, // max iterations
  {
    onCollapse: (x, y, tileId) => console.log(`Collapsed (${x},${y}) to ${tileId}`),
    onDebug: (msg) => console.log(msg),
  }
);

if (result.success) {
  // result.grid is string[][] of tile IDs
  console.log('Generated successfully in', result.iterations, 'iterations');
}
```

## Deterministic Generation

All algorithms use the Alea PRNG for deterministic results:

```typescript
import { Alea } from '@daicer/shared/world-gen/noise';

const rng = Alea('my-seed');
const random1 = rng(); // Same seed = same sequence
const random2 = rng();
```

## Integration with Backend

Backend services can wrap these algorithms with logging:

```typescript
import { generateCaveCA } from '@daicer/shared/world-gen/cellular-automata';
import { logger } from '@/utils/logger';

export function generateCaveWithLogging(width: number, height: number, seed: string) {
  return generateCaveCA(
    width,
    height,
    seed,
    {},
    {
      onDebug: (msg) => logger.debug(`[CA] ${msg}`),
      onProgress: (iter, max) => logger.debug(`[CA] Iteration ${iter}/${max}`),
    }
  );
}
```

## Testing

All modules include unit tests in `__tests__/` directories:

```bash
yarn workspace @daicer/shared test world-gen
```

## Performance

- **Simplex Noise**: ~1ms for 100x100 grid (4 octaves)
- **Cellular Automata**: ~50ms for 100x100 grid (5 iterations)
- **BSP**: ~5ms for 80x60 area
- **Poisson Disc**: ~100ms for 100x100 area (min distance 10)
- **WFC**: ~500ms for 20x20 grid (depends on tile constraints)

## References

- [Fast Simplex Noise](https://www.npmjs.com/package/fast-simplex-noise)
- [Cellular Automata for Cave Generation](https://roguebasin.com/index.php/Cellular_Automata_Method_for_Generating_Random_Cave-Like_Levels)
- [Binary Space Partitioning](https://eskerda.com/bsp-dungeon-generation/)
- [Poisson Disc Sampling](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf)
- [Wave Function Collapse](https://github.com/mxgmn/WaveFunctionCollapse)
