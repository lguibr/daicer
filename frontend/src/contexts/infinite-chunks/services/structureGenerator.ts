/**
 * Structure Generator Service
 * Deterministic structure generation with in-memory caching only
 * NO IndexedDB - structures can always be regenerated from seed
 */

import { STRUCTURE_TEMPLATES, structureTileToBiome, type StructureFloor , GlobalPlacementMap, StructurePlacement, Structure } from '@daicer/shared/world-gen/structures';

// In-memory structure cache (simple Map, no persistence)
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
    console.warn(`[StructureGen] No template for type ${placement.type}`);
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
    worldX: placement.worldX,
    worldY: placement.worldY,
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
export function getStructuresForChunk(
  placementMap: GlobalPlacementMap | null,
  chunkWorldX: number,
  chunkWorldY: number,
  chunkSize: number,
  seed: string
): Structure[] {
  if (!placementMap) return [];

  const structures: Structure[] = [];
  const chunkEndX = chunkWorldX + chunkSize;
  const chunkEndY = chunkWorldY + chunkSize;

  for (const placement of placementMap.structures) {
    const structEndX = placement.worldX + placement.width;
    const structEndY = placement.worldY + placement.height;

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
  structure: Structure,
  chunkWorldX: number,
  chunkWorldY: number
): string[][] {
  const newBiomes = chunkBiomes.map((row) => [...row]);

  // Get surface layer tiles (floor 0)
  const surfaceTiles = structure.tiles[0 as StructureFloor];
  if (!surfaceTiles) return newBiomes;

  // Stamp structure tiles onto chunk
  for (let y = 0; y < chunkBiomes.length; y++) {
    for (let x = 0; x < (chunkBiomes[y]?.length || 0); x++) {
      const globalX = chunkWorldX + x;
      const globalY = chunkWorldY + y;

      // Calculate local coords within structure
      const localX = globalX - structure.worldX;
      const localY = globalY - structure.worldY;

      // Check if this tile is part of the structure
      if (localY >= 0 && localY < surfaceTiles.length && localX >= 0 && localX < (surfaceTiles[localY]?.length || 0)) {
        const tile = surfaceTiles[localY]?.[localX];
        if (tile && tile.tileType !== 'empty' && newBiomes[y]) {
          const biomeName = structureTileToBiome(tile, 0 as StructureFloor, false, structure.id);
          newBiomes[y][x] = biomeName;
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
