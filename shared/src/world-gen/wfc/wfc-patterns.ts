/**
 * WFC Pattern Extraction
 * Learns patterns from example structures for WFC generation
 */

export interface Pattern {
  id: string;
  tiles: string[][]; // 3x3 or NxN grid of tile IDs
  frequency: number; // How often this pattern appears
}

/**
 * Extract NxN patterns from an example grid
 * This allows WFC to learn from hand-crafted examples
 */
export function extractPatterns(exampleGrid: string[][], patternSize: number = 3): Pattern[] {
  const patterns = new Map<string, Pattern>();
  const height = exampleGrid.length;
  const width = exampleGrid[0]?.length ?? 0;

  if (width === 0 || height === 0) return [];

  // Slide window across example
  for (let y = 0; y <= height - patternSize; y++) {
    for (let x = 0; x <= width - patternSize; x++) {
      const pattern = extractPatternAt(exampleGrid, x, y, patternSize);
      const patternKey = serializePattern(pattern);

      if (patterns.has(patternKey)) {
        patterns.get(patternKey)!.frequency++;
      } else {
        patterns.set(patternKey, {
          id: patternKey,
          tiles: pattern,
          frequency: 1,
        });
      }
    }
  }

  return Array.from(patterns.values());
}

/**
 * Extract a pattern at a specific position
 */
function extractPatternAt(grid: string[][], startX: number, startY: number, size: number): string[][] {
  const pattern: string[][] = [];

  for (let y = 0; y < size; y++) {
    const row: string[] = [];
    for (let x = 0; x < size; x++) {
      const sourceRow = grid[startY + y];
      const tileId = sourceRow?.[startX + x] ?? 'empty';
      row.push(tileId);
    }
    pattern.push(row);
  }

  return pattern;
}

/**
 * Serialize pattern to unique string key
 */
function serializePattern(pattern: string[][]): string {
  return pattern.map((row) => row.join(',')).join(';');
}

/**
 * Convert patterns to adjacency rules
 * This generates tile adjacency constraints from observed patterns
 */
export function patternsToAdjacencyRules(patterns: Pattern[]): Map<string, Set<string>[]> {
  const rules = new Map<string, { north: Set<string>; south: Set<string>; east: Set<string>; west: Set<string> }>();

  for (const pattern of patterns) {
    const height = pattern.tiles.length;
    const width = pattern.tiles[0]?.length ?? 0;

    // For each tile in pattern, record what can be adjacent
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const row = pattern.tiles[y];
        if (!row) continue;
        const tileId = row[x];
        if (!tileId) continue;

        if (!rules.has(tileId)) {
          rules.set(tileId, {
            north: new Set(),
            south: new Set(),
            east: new Set(),
            west: new Set(),
          });
        }

        const tileRules = rules.get(tileId)!;

        // Record neighbors
        if (y > 0) {
          const northTile = pattern.tiles[y - 1]?.[x];
          if (northTile) tileRules.north.add(northTile);
        }
        if (y < height - 1) {
          const southTile = pattern.tiles[y + 1]?.[x];
          if (southTile) tileRules.south.add(southTile);
        }
        if (x < width - 1) {
          const eastTile = pattern.tiles[y]?.[x + 1];
          if (eastTile) tileRules.east.add(eastTile);
        }
        if (x > 0) {
          const westTile = pattern.tiles[y]?.[x - 1];
          if (westTile) tileRules.west.add(westTile);
        }
      }
    }
  }

  // Convert to array format
  const rulesArray = new Map<string, Set<string>[]>();
  for (const [tileId, dirs] of rules.entries()) {
    rulesArray.set(tileId, [dirs.north, dirs.south, dirs.east, dirs.west]);
  }

  return rulesArray;
}

/**
 * Merge multiple example grids into combined patterns
 */
export function mergePatterns(...patternSets: Pattern[][]): Pattern[] {
  const merged = new Map<string, Pattern>();

  for (const patterns of patternSets) {
    for (const pattern of patterns) {
      if (merged.has(pattern.id)) {
        merged.get(pattern.id)!.frequency += pattern.frequency;
      } else {
        merged.set(pattern.id, { ...pattern });
      }
    }
  }

  return Array.from(merged.values());
}
