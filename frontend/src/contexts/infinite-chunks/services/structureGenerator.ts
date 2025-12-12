/**
 * Structure Generator Service
 * Deterministic structure generation with in-memory caching only
 * NO IndexedDB - structures can always be regenerated from seed
 */

import { STRUCTURE_TEMPLATES, structureTileToBiome } from '@daicer/shared';
import type { GlobalPlacementMap, StructurePlacement } from '@daicer/shared';

// In-memory structure cache (simple Map, no persistence)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const structureCache = new Map<string, any>();

/**
 * Generates or retrieves cached structure from placement
 * Deterministic - same placement + seed = same structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateStructure(placement: StructurePlacement, seed: string): any | null {
  const cacheKey = `${seed}-${placement.id}`;

  // Check cache first
  if (structureCache.has(cacheKey)) {
    return structureCache.get(cacheKey)!;
  }

  // Generate structure
  const template = STRUCTURE_TEMPLATES[placement.type];
  if (!template) {
    console.warn(`[StructureGen] No template for type ${placement.type}`);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const structure: any = {
    id: placement.id,
    name: template.name,
    type: placement.type,
    material: placement.material,
    width: template.width,
    height: template.height,
    tiles: template.generator(placement.material, `${seed}-${placement.id}`),
    x: placement.worldX,
    y: placement.worldY,
    npcSpawnPoints: [],
    featureZones: [],
    layoutAlgorithm: template.layoutAlgorithm,
  };

  // Cache in memory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structureCache.set(cacheKey, structure as any);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return structure as any;
}

/**
 * Gets all structures that overlap with a chunk's area
 */
export function getStructuresForChunk(
  placementMap: GlobalPlacementMap | null,
  chunkWorldX: number,
  chunkWorldY: number,
  chunkSize: number,
  seed: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  if (!placementMap) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const structures: any[] = [];
  const chunkEndX = chunkWorldX + chunkSize;
  const chunkEndY = chunkWorldY + chunkSize;

  for (const placement of placementMap.structures) {
    const template = STRUCTURE_TEMPLATES[placement.type];
    const width = template ? template.width : placement.size * 2;
    const height = template ? template.height : placement.size * 2;
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
 * Stamps structure tiles onto chunk biomes (surface layer only)
 * Returns modified chunk biomes (immutable)
 */
export function stampStructureOnChunk(
  chunkBiomes: string[][],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structure: any,
  chunkWorldX: number,
  chunkWorldY: number
): string[][] {
  const newBiomes = chunkBiomes.map((row) => [...row]);

  // Get surface layer tiles (floor 0)
  const surfaceTiles = structure.tiles[0];
  if (!surfaceTiles) return newBiomes;

  // Stamp structure tiles onto chunk
  for (let y = 0; y < chunkBiomes.length; y++) {
    for (let x = 0; x < (chunkBiomes[y]?.length || 0); x++) {
      const globalX = chunkWorldX + x;
      const globalY = chunkWorldY + y;

      // Calculate local coords within structure
      const localX = globalX - structure.x;
      const localY = globalY - structure.y;

      // Check if this tile is part of the structure
      if (localY >= 0 && localY < surfaceTiles.length && localX >= 0 && localX < (surfaceTiles[localY]?.length || 0)) {
        const tile = surfaceTiles[localY]?.[localX];
        if (tile && tile.tileType !== 'empty' && newBiomes[y]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const biomeName = structureTileToBiome(tile, 0 as any, false, structure.id);
          newBiomes[y]![x] = biomeName;
        }
      }
    }
  }

  return newBiomes;
}

/**
 * Clears the structure cache (e.g., when room changes)
 */
export function clearStructureCache(): void {
  structureCache.clear();
}

/**
 * Gets cache size (for debugging)
 */
export function getStructureCacheSize(): number {
  return structureCache.size;
}
