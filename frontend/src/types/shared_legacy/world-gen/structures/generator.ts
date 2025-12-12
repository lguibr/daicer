/**
 * Structure Generation - 2-Phase System
 * Phase 1: Place reserved footprints BEFORE terrain generation
 * Phase 2: Stamp detailed layouts AFTER terrain generation
 */

import type {
  Structure,
  StructurePlacementParams,
  StructureGenerationResult,
  StructureType,
  StructureFloor,
} from './types';
import { structureTileToBiome, isStructureBiome, isReservedBiome, getFloorIndex } from './types';
import { STRUCTURE_TEMPLATES, DEFAULT_STRUCTURE_WEIGHTS } from './presets';
import { selectRandomMaterial } from './materials';
import { poissonDiskSampling2D } from '../voronoi/poisson-disc';
import { generateRoadPaths } from './pathfinding';
import { generateNPCSpawnPoints } from './spawn-points';
import { generateFeatureZones } from './features';
import { Alea } from '../noise/alea';

/**
 * Phase 1: Generate structure footprints with RESERVED markers
 * This runs BEFORE terrain generation (noise, CA, etc.)
 */
export function generateStructureFootprints(
  width: number,
  height: number,
  seed: string,
  params: StructurePlacementParams
): StructureGenerationResult {
  const rng = Alea(seed);

  // Initialize empty biome grids for 7 floors (-3 to +3)
  const biomeGrid: string[][][] = [];
  for (let i = 0; i < 7; i++) {
    biomeGrid.push(
      Array(height)
        .fill(null)
        .map(() => Array(width).fill(''))
    );
  }

  const structures: Structure[] = [];

  // Step 1: Generate structure placement points using Poisson disc sampling
  const placementPoints = poissonDiskSampling2D(width, height, params.minDistance, 30, seed);

  console.log(`[Structures] Generated ${placementPoints.length} placement points`);

  // Step 2: For each point, randomly decide structure type and place RESERVED footprint
  let placedCount = 0;
  const maxStructures = params.maxStructures || placementPoints.length;

  for (const point of placementPoints) {
    if (placedCount >= maxStructures) break;

    // Select structure type based on weights
    const structureType = selectStructureType(rng, DEFAULT_STRUCTURE_WEIGHTS);
    if (!structureType || structureType === 'road' || structureType === 'bridge') continue;

    // Get template
    const template = STRUCTURE_TEMPLATES[structureType];
    if (!template) continue;

    // Select material (use default or random)
    const material = rng() < 0.7 ? template.defaultMaterial : selectRandomMaterial(rng);

    // Generate structure layout
    const tiles = template.generator(material, `${seed}-${point.x}-${point.y}`);

    // Check if structure fits
    const worldX = Math.floor(point.x);
    const worldY = Math.floor(point.y);

    if (worldX + template.width > width || worldY + template.height > height) {
      continue;
    }

    // Check for overlap with existing structures (check surface floor)
    const surfaceIndex = getFloorIndex(0);
    const surfaceGrid = biomeGrid[surfaceIndex];
    if (surfaceGrid && hasOverlap(surfaceGrid, worldX, worldY, template.width, template.height)) {
      continue;
    }

    // Create structure with spawn points and features
    const structure: Structure = {
      id: `struct-${placedCount}`,
      name: `${template.name} ${placedCount + 1}`,
      type: structureType,
      material,
      width: template.width,
      height: template.height,
      tiles,
      worldX,
      worldY,
      npcSpawnPoints: [],
      featureZones: [],
      layoutAlgorithm: template.layoutAlgorithm,
    };

    // Generate NPCs and features
    structure.npcSpawnPoints = generateNPCSpawnPoints(structure, seed);
    structure.featureZones = generateFeatureZones(structure, seed);

    // Place RESERVED footprint on grid
    placeReservedFootprint(biomeGrid, structure);
    structures.push(structure);
    placedCount++;
  }

  console.log(`[Structures] Placed ${structures.length} structures`);

  // Step 3: Generate roads if enabled
  let roadTileCount = 0;
  if (params.generateRoads && structures.length > 1) {
    const surfaceIndex = getFloorIndex(0);
    const surfaceGrid = biomeGrid[surfaceIndex];
    if (surfaceGrid) {
      const roadPoints = generateRoadPaths(structures, surfaceGrid, seed);
      roadTileCount = roadPoints.length;
      console.log(`[Structures] Generated ${roadTileCount} road tiles`);

      // Place road reserved markers on floor 0
      for (const point of roadPoints) {
        if (point.x >= 0 && point.x < width && point.y >= 0 && point.y < height) {
          const row = surfaceGrid[point.y];
          if (row && row[point.x] !== undefined) {
            const cell = row[point.x];
            if (cell !== undefined && !isStructureBiome(cell)) {
              row[point.x] = `structure_reserved_road`;
            }
          }
        }
      }
    }
  }

  // Return with detailed structures stored separately for Phase 2
  return { biomeGrid, structures, detailedStructures: structures };
}

/**
 * Phase 2: Stamp detailed structure layouts AFTER terrain generation
 * This replaces reserved markers with final detailed tiles
 */
export function stampDetailedStructures(
  _biomeGrid: string[][][],
  structures: Structure[],
  terrainGrid: string[][][]
): string[][][] {
  console.log(`[Structures] Stamping ${structures.length} detailed structures`);

  // Create a copy of terrain grid
  const finalGrid: string[][][] = terrainGrid.map((floor) => floor.map((row) => [...row]));

  // Stamp each structure
  for (const structure of structures) {
    stampStructure(finalGrid, structure);
  }

  return finalGrid;
}

/**
 * Legacy function: Generate structures as biomes (old 1-phase system)
 * Kept for backward compatibility
 */
export function generateStructuresAsBiomes(
  width: number,
  height: number,
  seed: string,
  params: StructurePlacementParams
): StructureGenerationResult {
  // Use new 2-phase system but immediately stamp
  const phase1 = generateStructureFootprints(width, height, seed, params);

  // Stamp directly onto the reserved grid
  const finalGrid = stampDetailedStructures(phase1.biomeGrid, phase1.detailedStructures || [], phase1.biomeGrid);

  return {
    biomeGrid: finalGrid,
    structures: phase1.structures,
    detailedStructures: phase1.detailedStructures,
  };
}

/**
 * Select a structure type based on weights
 */
function selectStructureType(rng: () => number, weights: Record<StructureType, number>): StructureType | null {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = rng() * totalWeight;

  for (const [type, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return type as StructureType;
    }
  }

  return null;
}

/**
 * Check if a structure would overlap with existing structures
 */
function hasOverlap(biomeGrid: string[][], worldX: number, worldY: number, width: number, height: number): boolean {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gridY = worldY + y;
      const gridX = worldX + x;

      if (gridY >= 0 && gridY < biomeGrid.length) {
        const row = biomeGrid[gridY];
        if (row && gridX >= 0 && gridX < row.length) {
          const biome = row[gridX];
          if (biome && isStructureBiome(biome)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Place a RESERVED footprint on the biome grid (Phase 1)
 */
function placeReservedFootprint(biomeGrid: string[][][], structure: Structure): void {
  for (const [floorKey, tiles] of Object.entries(structure.tiles)) {
    const floor = parseInt(floorKey) as StructureFloor;
    const gridIndex = getFloorIndex(floor);

    if (gridIndex < 0 || gridIndex >= biomeGrid.length) continue;
    const targetGrid = biomeGrid[gridIndex];
    if (!targetGrid) continue;

    for (let y = 0; y < tiles.length; y++) {
      const tileRow = tiles[y];
      if (!tileRow) continue;

      for (let x = 0; x < tileRow.length; x++) {
        const tile = tileRow[x];
        if (!tile) continue; // Safety check

        const worldX = structure.worldX + x;
        const worldY = structure.worldY + y;

        if (worldY >= 0 && worldY < targetGrid.length) {
          const gridRow = targetGrid[worldY];
          if (gridRow && worldX >= 0 && worldX < gridRow.length) {
            // Place reserved marker
            if (tile.tileType !== 'empty') {
              gridRow[worldX] = `structure_reserved_${structure.id}`;
            }
          }
        }
      }
    }
  }
}

/**
 * Stamp a detailed structure onto the final grid (Phase 2)
 */
function stampStructure(biomeGrid: string[][][], structure: Structure): void {
  for (const [floorKey, tiles] of Object.entries(structure.tiles)) {
    const floor = parseInt(floorKey) as StructureFloor;
    const gridIndex = getFloorIndex(floor);

    if (gridIndex < 0 || gridIndex >= biomeGrid.length) continue;
    const targetGrid = biomeGrid[gridIndex];
    if (!targetGrid) continue;

    for (let y = 0; y < tiles.length; y++) {
      const tileRow = tiles[y];
      if (!tileRow) continue;

      for (let x = 0; x < tileRow.length; x++) {
        const tile = tileRow[x];
        if (!tile) continue;

        const worldX = structure.worldX + x;
        const worldY = structure.worldY + y;

        if (worldY >= 0 && worldY < targetGrid.length) {
          const gridRow = targetGrid[worldY];
          if (gridRow && worldX >= 0 && worldX < gridRow.length) {
            // Only stamp if this was a reserved tile
            const currentBiome = gridRow[worldX];
            if (currentBiome && isReservedBiome(currentBiome)) {
              const biomeName = structureTileToBiome(tile, floor, false, structure.id);
              if (biomeName) {
                gridRow[worldX] = biomeName;
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Helper: Check if a biome grid tile can have a biome assigned
 * (i.e., it's not already a structure)
 */
export function canAssignBiome(biomeGrid: string[][], x: number, y: number): boolean {
  if (y < 0 || y >= biomeGrid.length) return false;
  const row = biomeGrid[y];
  if (!row || x < 0 || x >= row.length) return false;

  const biome = row[x];
  return !biome || !isStructureBiome(biome);
}
