# Wave Function Collapse (WFC)

Custom WFC implementation for procedural structure generation in DAICE.

## Overview

Wave Function Collapse is a constraint-solving algorithm that generates output matching local patterns from example input. We use it for:

- Castle/fortress layouts
- Village house interiors
- Dungeon room configurations
- Terrain pattern variation

## Files

- `wfc-solver.ts` - Core WFC algorithm (constraint propagation)
- `wfc-tiles.ts` - Tile definitions and adjacency rules
- `wfc-patterns.ts` - Pattern extraction from examples
- `wfc-presets.ts` - Hand-crafted example structures

## Usage

```typescript
import { collapseGrid } from './wfc-solver';
import { getPresetTiles } from './wfc-presets';

// Generate a castle layout
const tiles = getPresetTiles('castle');
const result = collapseGrid(20, 20, tiles, 'my-seed-123');

if (result.success) {
  // result.grid contains tile IDs arranged in valid configuration
}
```

## Algorithm

1. **Initialize**: All cells start with all possible tiles
2. **Observe**: Find cell with minimum entropy (fewest options)
3. **Collapse**: Choose one tile for that cell (weighted random)
4. **Propagate**: Update neighbors based on adjacency constraints
5. **Repeat**: Until all cells collapsed or contradiction

## Determinism

WFC is fully deterministic when given a seed. The same seed produces identical output.

## References

- Original WFC: https://github.com/mxgmn/WaveFunctionCollapse
- Algorithm explanation: https://robertheaton.com/2018/12/17/wavefunction-collapse-algorithm/
