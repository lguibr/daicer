/**
 * Tactical Map Generator
 * Generates small-scale tactical combat maps (8x8 to 20x20)
 * Uses Simplex noise for quick, synchronous generation
 */

import SimplexNoise from 'fast-simplex-noise';

export interface TacticalTile {
  x: number;
  y: number;
  terrain: TacticalTerrain;
  elevation: number;
  isDifficult: boolean;
  cover: 'none' | 'half' | 'three-quarters' | 'full';
}

export type TacticalTerrain = 'plains' | 'forest' | 'stone' | 'water' | 'lava' | 'ice' | 'sand' | 'grass';

export interface TacticalMap {
  id: string;
  gridSize: number;
  seed: number;
  tiles: TacticalTile[][];
  createdAt: Date;
}

export const TACTICAL_TERRAIN_COLORS: Record<TacticalTerrain, string> = {
  plains: '#91bd59',
  forest: '#507a32',
  stone: '#6b6b6b',
  water: '#3f76e4',
  lava: '#ff4500',
  ice: '#b0e0f0',
  sand: '#f5deb3',
  grass: '#79c05a',
};

interface GenerateTacticalMapParams {
  gridSize: number; // 8-20
  seed?: number;
  terrainDensity?: number; // 0-1, how varied the terrain is
}

/**
 * Determine terrain type based on noise value
 */
function getTerrainFromNoise(value: number, density: number): TacticalTerrain {
  // Adjust thresholds based on density
  const threshold = density * 0.5;

  if (value < -0.5 - threshold) return 'water';
  if (value < -0.2 - threshold) return 'plains';
  if (value < 0.1) return 'grass';
  if (value < 0.3 + threshold) return 'forest';
  if (value < 0.5 + threshold) return 'stone';
  if (value < 0.7 + threshold) return 'sand';
  if (value < 0.85) return 'ice';
  return 'lava';
}

/**
 * Determine if terrain is difficult
 */
function isDifficultTerrain(terrain: TacticalTerrain): boolean {
  return ['forest', 'water', 'ice', 'sand'].includes(terrain);
}

/**
 * Determine cover level based on terrain and elevation
 */
function getCoverLevel(terrain: TacticalTerrain, elevation: number): TacticalTile['cover'] {
  if (terrain === 'forest' && elevation > 5) return 'half';
  if (terrain === 'stone' && elevation > 8) return 'three-quarters';
  return 'none';
}

/**
 * Generate a tactical combat map synchronously
 */
export function generateTacticalMap(params: GenerateTacticalMapParams): TacticalMap {
  const { gridSize, seed = Math.floor(Math.random() * 1000000), terrainDensity = 0.5 } = params;

  // Validate grid size
  if (gridSize < 8 || gridSize > 20) {
    throw new Error('Grid size must be between 8 and 20');
  }

  // @ts-ignore
  const terrainNoise = new SimplexNoise(`${seed}-terrain`);
  // @ts-ignore
  const elevationNoise = new SimplexNoise(`${seed}-elevation`);

  const tiles: TacticalTile[][] = [];

  // Generate tiles
  for (let y = 0; y < gridSize; y++) {
    const row: TacticalTile[] = [];
    for (let x = 0; x < gridSize; x++) {
      // Normalize coordinates
      const nx = x / gridSize;
      const ny = y / gridSize;

      // Sample noise (higher frequency for tactical maps)
      const terrainValue = terrainNoise.noise2D(nx * 6, ny * 6);
      const elevationValue = elevationNoise.noise2D(nx * 4, ny * 4);

      // Map to 0-15 elevation range
      const elevation = Math.floor((elevationValue + 1) * 7.5);

      const terrain = getTerrainFromNoise(terrainValue, terrainDensity);
      const isDifficult = isDifficultTerrain(terrain);
      const cover = getCoverLevel(terrain, elevation);

      row.push({
        x,
        y,
        terrain,
        elevation,
        isDifficult,
        cover,
      });
    }
    tiles.push(row);
  }

  return {
    id: `tactical-${seed}`,
    gridSize,
    seed,
    tiles,
    createdAt: new Date(),
  };
}

/**
 * Get flat array of tiles (useful for API responses)
 */
export function flattenTacticalMap(map: TacticalMap): TacticalTile[] {
  return map.tiles.flat();
}
