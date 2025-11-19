/**
 * @file backend/src/tactical/arenas/generator.ts
 * @description Arena generation utilities and pre-built arena definitions
 */

import type { GridPosition } from '../../types/spells.js';
import { TerrainType, createGridCell, type TacticalArena, type GridCell } from '../types/arena.js';

/**
 * Create a rectangular room filled with floor tiles
 */
function createEmptyGrid(width: number, height: number): GridCell[] {
  const cells: GridCell[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells.push(createGridCell(x, y, TerrainType.FLOOR));
    }
  }
  return cells;
}

/**
 * Set terrain type for a specific cell
 */
function setTerrainAt(cells: GridCell[], x: number, y: number, terrain: TerrainType): void {
  const cell = cells.find((c) => c.x === x && c.y === y);
  if (cell) {
    const newCell = createGridCell(x, y, terrain);
    Object.assign(cell, newCell);
  }
}

/**
 * Create a rectangle of specific terrain type
 */
function createRectangle(
  cells: GridCell[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  terrain: TerrainType
): void {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      setTerrainAt(cells, x, y, terrain);
    }
  }
}

/**
 * Create walls around the perimeter
 */
function createPerimeterWalls(cells: GridCell[], width: number, height: number): void {
  // Top and bottom walls
  for (let x = 0; x < width; x++) {
    setTerrainAt(cells, x, 0, TerrainType.WALL);
    setTerrainAt(cells, x, height - 1, TerrainType.WALL);
  }
  // Left and right walls
  for (let y = 0; y < height; y++) {
    setTerrainAt(cells, 0, y, TerrainType.WALL);
    setTerrainAt(cells, width - 1, y, TerrainType.WALL);
  }
}

// ============================================================================
// Arena 1: Tavern Brawl
// ============================================================================

function generateTavernBrawl(): TacticalArena {
  const width = 15;
  const height = 12;
  const cells = createEmptyGrid(width, height);

  // Perimeter walls
  createPerimeterWalls(cells, width, height);

  // Bar (full cover) - left side
  createRectangle(cells, 1, 1, 2, 5, TerrainType.COVER_FULL);

  // Tables (half cover) - scattered throughout
  createRectangle(cells, 5, 2, 6, 3, TerrainType.COVER_HALF);
  createRectangle(cells, 9, 3, 10, 4, TerrainType.COVER_HALF);
  createRectangle(cells, 5, 7, 6, 8, TerrainType.COVER_HALF);
  createRectangle(cells, 11, 7, 12, 8, TerrainType.COVER_HALF);

  // Doorways (open passages in walls)
  setTerrainAt(cells, 7, 0, TerrainType.FLOOR); // North entrance
  setTerrainAt(cells, 14, 6, TerrainType.FLOOR); // East entrance

  return {
    id: 'tavern-brawl',
    name: 'Tavern Brawl',
    description:
      'A rowdy tavern with scattered tables and a solid bar. Perfect for close-quarters combat with plenty of cover.',
    width,
    height,
    cells,
    spawnZones: {
      players: [
        { x: 3, y: 2 },
        { x: 3, y: 4 },
        { x: 4, y: 3 },
      ],
      enemies: [
        { x: 11, y: 9 },
        { x: 12, y: 10 },
        { x: 10, y: 10 },
      ],
    },
    theme: 'tavern',
    assetRefs: {
      floor: 'wooden_planks',
      walls: ['tavern_wall'],
      props: [
        { type: 'bar', position: { x: 1, y: 3 } },
        { type: 'table', position: { x: 5, y: 2 } },
        { type: 'table', position: { x: 9, y: 3 } },
      ],
    },
  };
}

// ============================================================================
// Arena 2: Dungeon Corridor
// ============================================================================

function generateDungeonCorridor(): TacticalArena {
  const width = 20;
  const height = 10;
  const cells = createEmptyGrid(width, height);

  // Perimeter walls
  createPerimeterWalls(cells, width, height);

  // Narrow corridor with alcoves
  // Top wall inner section
  for (let x = 1; x < width - 1; x++) {
    if (x < 5 || x > 7) {
      setTerrainAt(cells, x, 2, TerrainType.WALL);
    }
  }
  // Bottom wall inner section
  for (let x = 1; x < width - 1; x++) {
    if (x < 12 || x > 14) {
      setTerrainAt(cells, x, 7, TerrainType.WALL);
    }
  }

  // Pillars creating chokepoints
  setTerrainAt(cells, 8, 4, TerrainType.WALL);
  setTerrainAt(cells, 8, 5, TerrainType.WALL);
  setTerrainAt(cells, 15, 4, TerrainType.WALL);
  setTerrainAt(cells, 15, 5, TerrainType.WALL);

  // Alcoves with half cover
  createRectangle(cells, 5, 1, 6, 1, TerrainType.COVER_HALF);
  createRectangle(cells, 13, 8, 14, 8, TerrainType.COVER_HALF);

  return {
    id: 'dungeon-corridor',
    name: 'Dungeon Corridor',
    description: 'A long, narrow stone corridor with pillars and alcoves. Chokepoints force tactical positioning.',
    width,
    height,
    cells,
    spawnZones: {
      players: [
        { x: 2, y: 4 },
        { x: 2, y: 5 },
        { x: 3, y: 4 },
        { x: 3, y: 5 },
      ],
      enemies: [
        { x: 17, y: 4 },
        { x: 17, y: 5 },
        { x: 18, y: 4 },
        { x: 18, y: 5 },
      ],
    },
    theme: 'dungeon',
    assetRefs: {
      floor: 'stone_tiles',
      walls: ['dungeon_wall', 'dungeon_pillar'],
    },
  };
}

// ============================================================================
// Arena 3: Forest Clearing
// ============================================================================

function generateForestClearing(): TacticalArena {
  const width = 18;
  const height = 18;
  const cells = createEmptyGrid(width, height);

  // No perimeter walls - open forest
  // But dense trees as outer boundary
  for (let x = 0; x < width; x++) {
    if (x < 3 || x >= width - 3) {
      for (let y = 0; y < height; y++) {
        setTerrainAt(cells, x, y, TerrainType.WALL); // Trees block movement/LOS
      }
    }
  }
  for (let y = 0; y < height; y++) {
    if (y < 3 || y >= height - 3) {
      for (let x = 3; x < width - 3; x++) {
        setTerrainAt(cells, x, y, TerrainType.WALL); // Trees
      }
    }
  }

  // Scattered trees throughout clearing
  const treePositions: GridPosition[] = [
    { x: 5, y: 6 },
    { x: 7, y: 9 },
    { x: 10, y: 5 },
    { x: 12, y: 11 },
    { x: 8, y: 13 },
    { x: 14, y: 7 },
  ];
  treePositions.forEach((pos) => setTerrainAt(cells, pos.x, pos.y, TerrainType.WALL));

  // Undergrowth (difficult terrain) patches
  createRectangle(cells, 4, 4, 6, 5, TerrainType.DIFFICULT);
  createRectangle(cells, 11, 8, 13, 10, TerrainType.DIFFICULT);
  createRectangle(cells, 6, 12, 9, 13, TerrainType.DIFFICULT);

  return {
    id: 'forest-clearing',
    name: 'Forest Clearing',
    description: 'An open clearing surrounded by dense forest. Trees provide cover and undergrowth slows movement.',
    width,
    height,
    cells,
    spawnZones: {
      players: [
        { x: 8, y: 8 },
        { x: 9, y: 8 },
        { x: 8, y: 9 },
        { x: 9, y: 9 },
      ],
      enemies: [
        { x: 4, y: 14 },
        { x: 13, y: 4 },
        { x: 13, y: 14 },
      ],
    },
    theme: 'forest',
    assetRefs: {
      floor: 'grass',
      props: [
        { type: 'tree', position: { x: 5, y: 6 } },
        { type: 'tree', position: { x: 10, y: 5 } },
        { type: 'undergrowth', position: { x: 5, y: 4 } },
      ],
    },
  };
}

// ============================================================================
// Arena 4: Ruined Castle
// ============================================================================

function generateRuinedCastle(): TacticalArena {
  const width = 20;
  const height = 20;
  const cells = createEmptyGrid(width, height);

  // Outer perimeter - partially ruined
  createPerimeterWalls(cells, width, height);
  // Breaches in walls
  setTerrainAt(cells, 6, 0, TerrainType.FLOOR);
  setTerrainAt(cells, 7, 0, TerrainType.FLOOR);
  setTerrainAt(cells, 0, 10, TerrainType.FLOOR);
  setTerrainAt(cells, 19, 10, TerrainType.FLOOR);

  // Broken inner walls
  createRectangle(cells, 7, 7, 12, 7, TerrainType.WALL);
  setTerrainAt(cells, 10, 7, TerrainType.FLOOR); // Gap in wall

  createRectangle(cells, 10, 10, 10, 15, TerrainType.WALL);
  setTerrainAt(cells, 10, 12, TerrainType.FLOOR); // Doorway

  // Rubble (difficult terrain)
  createRectangle(cells, 3, 3, 5, 4, TerrainType.DIFFICULT);
  createRectangle(cells, 14, 5, 16, 6, TerrainType.DIFFICULT);
  createRectangle(cells, 5, 15, 7, 17, TerrainType.DIFFICULT);

  // Elevated platforms (ruins of upper floor)
  createRectangle(cells, 15, 15, 17, 17, TerrainType.ELEVATION_HIGH);
  createRectangle(cells, 2, 2, 3, 3, TerrainType.ELEVATION_HIGH);

  // Full cover (collapsed columns)
  setTerrainAt(cells, 9, 4, TerrainType.COVER_FULL);
  setTerrainAt(cells, 11, 4, TerrainType.COVER_FULL);

  return {
    id: 'ruined-castle',
    name: 'Ruined Castle',
    description: 'Crumbling walls and rubble create complex terrain. Elevated positions offer tactical advantages.',
    width,
    height,
    cells,
    spawnZones: {
      players: [
        { x: 2, y: 10 },
        { x: 3, y: 10 },
        { x: 2, y: 11 },
        { x: 3, y: 11 },
      ],
      enemies: [
        { x: 16, y: 10 },
        { x: 17, y: 10 },
        { x: 16, y: 11 },
        { x: 17, y: 11 },
        { x: 16, y: 16 },
      ],
    },
    theme: 'ruins',
    assetRefs: {
      floor: 'broken_stone',
      walls: ['ruined_wall'],
      props: [
        { type: 'rubble', position: { x: 4, y: 3 } },
        { type: 'column', position: { x: 9, y: 4 } },
      ],
    },
  };
}

// ============================================================================
// Arena 5: Open Arena
// ============================================================================

function generateOpenArena(): TacticalArena {
  const width = 16;
  const height = 16;
  const cells = createEmptyGrid(width, height);

  // Perimeter walls
  createPerimeterWalls(cells, width, height);

  // Minimal obstacles - just a few pieces of cover for testing
  // Center pillar
  setTerrainAt(cells, 8, 8, TerrainType.COVER_FULL);

  // Corner cover pieces
  createRectangle(cells, 3, 3, 4, 3, TerrainType.COVER_HALF);
  createRectangle(cells, 11, 3, 12, 3, TerrainType.COVER_HALF);
  createRectangle(cells, 3, 12, 4, 12, TerrainType.COVER_HALF);
  createRectangle(cells, 11, 12, 12, 12, TerrainType.COVER_HALF);

  // Small difficult terrain patches for testing
  createRectangle(cells, 6, 8, 6, 8, TerrainType.DIFFICULT);
  createRectangle(cells, 9, 8, 9, 8, TerrainType.DIFFICULT);

  return {
    id: 'open-arena',
    name: 'Open Arena',
    description: 'A simple combat arena with minimal obstacles. Ideal for testing mechanics and ranged combat.',
    width,
    height,
    cells,
    spawnZones: {
      players: [
        { x: 3, y: 8 },
        { x: 4, y: 8 },
        { x: 3, y: 7 },
        { x: 4, y: 7 },
      ],
      enemies: [
        { x: 12, y: 8 },
        { x: 11, y: 8 },
        { x: 12, y: 9 },
        { x: 11, y: 9 },
      ],
    },
    theme: 'castle',
    assetRefs: {
      floor: 'stone_floor',
      walls: ['arena_wall'],
      props: [{ type: 'pillar', position: { x: 8, y: 8 } }],
    },
  };
}

// ============================================================================
// Arena Registry
// ============================================================================

/**
 * All pre-generated arenas
 */
export const ARENAS: TacticalArena[] = [
  generateTavernBrawl(),
  generateDungeonCorridor(),
  generateForestClearing(),
  generateRuinedCastle(),
  generateOpenArena(),
];

/**
 * Get arena by ID
 */
export function getArenaById(id: string): TacticalArena | null {
  return ARENAS.find((arena) => arena.id === id) || null;
}

/**
 * Get all arena summaries (without full cell data)
 */
export function getArenaSummaries(): Array<{
  id: string;
  name: string;
  description: string;
  theme: string;
  dimensions: { width: number; height: number };
}> {
  return ARENAS.map((arena) => ({
    id: arena.id,
    name: arena.name,
    description: arena.description,
    theme: arena.theme,
    dimensions: { width: arena.width, height: arena.height },
  }));
}
