/**
 * Structure Stamper Service
 * Handles stamping structures onto generated grid chunks
 * Replicates logic from frontend/src/contexts/infinite-chunks/services/structureGenerator.ts
 */

import {
  STRUCTURE_TEMPLATES,
  structureTileToBiome,
  type StructureFloor,
  GlobalPlacementMap,
  StructurePlacement,
  Structure,
} from '@daicer/shared/world-gen/structures';
import { GridTile } from '@daicer/shared';

// In-memory structure cache (simple Map, no persistence)
// Note: In a serverless/multi-instance environment, this cache might be less effective
// but still useful for sequential chunk generation requests.
const structureCache = new Map<string, Structure>();

/**
 * Generates or retrieves cached structure from placement
 * Deterministic - same placement + seed = same structure
 */
export function generateStructure(placement: StructurePlacement, seed: string): Structure | null {
  const cacheKey = `${seed}-${placement.id}`;

  // Check cache first
  if (structureCache.has(cacheKey)) {
    return structureCache.get(cacheKey)!;
  }

  // Generate structure
  const template = STRUCTURE_TEMPLATES[placement.type];
  if (!template) {
    // console.warn(`[StructureGen] No template for type ${placement.type}`);
    return null;
  }

  const structureSeed = `${seed}-${placement.id}`;
  const tiles = template.generator(placement.material, structureSeed);

  const structure: Structure = {
    id: placement.id,
    name: template.name,
    type: placement.type,
    material: placement.material,
    width: template.width,
    height: template.height,
    tiles,
    worldX: placement.worldX ?? (placement as any).x,
    worldY: placement.worldY ?? (placement as any).y,
    npcSpawnPoints: [],
    featureZones: [],
    layoutAlgorithm: template.layoutAlgorithm,
  };

  // Cache in memory
  structureCache.set(cacheKey, structure);

  return structure;
}

/**
 * Gets all structures that overlap with a chunk's area
 */
/**
 * Gets all structures that overlap with a chunk's area
 */
export function getStructuresForChunk(
  placementSource: GlobalPlacementMap | StructurePlacement[] | null,
  chunkWorldX: number,
  chunkWorldY: number,
  chunkSize: number,
  seed: string
): Structure[] {
  if (!placementSource) return [];

  const placements = Array.isArray(placementSource) ? placementSource : placementSource.structures || [];

  const structures: Structure[] = [];
  const chunkEndX = chunkWorldX + chunkSize;
  const chunkEndY = chunkWorldY + chunkSize;

  for (const rawPlacement of placements) {
    // Normalize coordinates (handle x/y from frontend vs worldX/worldY from backend type)
    const placement = {
      ...rawPlacement,
      worldX: rawPlacement.worldX ?? (rawPlacement as any).x,
      worldY: rawPlacement.worldY ?? (rawPlacement as any).y,
    } as StructurePlacement;

    // Look up template to get dimensions
    const template = STRUCTURE_TEMPLATES[placement.type];
    if (!template) continue;

    const width = template.width;
    const height = template.height;

    const structEndX = placement.worldX + width;
    const structEndY = placement.worldY + height;

    // Check if structure overlaps with chunk
    const overlaps =
      chunkWorldX < structEndX &&
      chunkEndX > placement.worldX &&
      chunkWorldY < structEndY &&
      chunkEndY > placement.worldY;

    if (overlaps) {
      const structure = generateStructure(placement, seed);
      if (structure) {
        structures.push(structure);
      }
    }
  }

  return structures;
}

/**
 * Stamps structure tiles onto chunk tiles
 * Modifies the tiles array in place (or returns new one)
 */
export function stampStructureOnChunk(
  tiles: GridTile[],
  structure: Structure,
  chunkWorldX: number,
  chunkWorldY: number,
  chunkSize: number
): GridTile[] {
  // Get surface layer tiles (floor 0)
  const surfaceTiles = structure.tiles[0 as StructureFloor];
  if (!surfaceTiles) return tiles;

  // Iterate through structure tiles and update corresponding chunk tiles
  for (let y = 0; y < surfaceTiles.length; y++) {
    for (let x = 0; x < (surfaceTiles[y]?.length || 0); x++) {
      const globalX = structure.worldX + x;
      const globalY = structure.worldY + y;

      // Check if this tile is within the chunk bounds
      if (
        globalX >= chunkWorldX &&
        globalX < chunkWorldX + chunkSize &&
        globalY >= chunkWorldY &&
        globalY < chunkWorldY + chunkSize
      ) {
        const tile = surfaceTiles[y]?.[x];
        if (tile && tile.tileType !== 'empty') {
          // Find the tile in the chunk array
          const localX = globalX - chunkWorldX;
          const localY = globalY - chunkWorldY;
          const tileIndex = localY * chunkSize + localX;

          if (tiles[tileIndex]) {
            const biomeName = structureTileToBiome(tile, 0 as StructureFloor, false, structure.id);

            tiles[tileIndex].biome = biomeName;

            // Map structure tile types to valid block types
            if (tile.tileType === 'wall') {
              tiles[tileIndex].blockType = 'stone';
            } else if (tile.tileType === 'floor') {
              tiles[tileIndex].blockType = 'sandstone'; // Fallback for floor
            } else if (tile.tileType === 'road') {
              tiles[tileIndex].blockType = 'gravel';
            }
          }
        }
      }
    }
  }

  return tiles;
}
