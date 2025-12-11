/**
 * Structure Stamper Service
 * Handles stamping structures onto generated grid chunks
 * Replicates logic from frontend/src/contexts/infinite-chunks/services/structureGenerator.ts
 */

import { STRUCTURE_TEMPLATES } from '@daicer/shared/world-gen/structures/presets';
import { structureTileToBiome, type StructureFloor, type Structure } from '@daicer/shared/world-gen/structures/types';
import type { GlobalPlacementMap, StructurePlacement } from '@daicer/shared/world-gen/structures/placement-map';
import { GridTile } from '@daicer/shared/world/grid-tile-schema';

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
 * Supports Z-Layers and Foundations
 */
export function stampStructureOnChunk(
  tiles: GridTile[],
  structure: Structure,
  _chunkWorldX: number,
  _chunkWorldY: number,
  _chunkSize: number,
  chunkZ: number // Phase 1: Added Z param
): GridTile[] {
  // 1. Get tiles for this specific schema-layer (StructureFloor)
  // We assume Structure Floors map 1:1 to World Z-Levels for now.
  // Floor 0 = World Z 0.
  const structureFloor = chunkZ as StructureFloor;
  const structureTiles = structure.tiles[structureFloor];

  // 2. Iterate through local chunk coordinates
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i]; // tile.x, tile.y are world coords
    if (!tile) continue; // Safety check

    // Check if this tile is inside the structure bounds
    const relativeX = tile.x - structure.worldX;
    const relativeY = tile.y - structure.worldY;

    if (relativeX >= 0 && relativeX < structure.width && relativeY >= 0 && relativeY < structure.height) {
      // A. Direct Stamping (Structure exists at this Z)
      // Safe navigation: structureTiles?.[relativeY]?.[relativeX]
      const structTile = structureTiles?.[relativeY]?.[relativeX];

      if (structTile && structTile.tileType !== 'empty') {
        // Calculate biome name
        tile.biome = structureTileToBiome(structTile, structureFloor, false, structure.id);

        // Map material/type to BlockType
        if (structTile.tileType === 'wall')
          tile.blockType = 'stone'; // Or 'wood', etc based on material
        else if (structTile.tileType === 'floor') tile.blockType = 'sandstone';
        else if (structTile.tileType === 'road') tile.blockType = 'gravel';

        // Material override
        if (structTile.material === 'wood') tile.blockType = 'dirt'; // Placeholder for wood block

        tile.lightLevel = 10; // Lit inside
        continue; // Done with this tile
      }

      // B. Foundation Logic (Structure DOES NOT exist at this Z, but exists ABOVE)
      // Only if we are underground (Z < 0) and the tile is currently Air (gap)
      if (chunkZ < 0 && tile.blockType === 'air') {
        // Check if there is a structure at Z=0 (Ground Floor) at this X,Y
        const groundTiles = structure.tiles[0 as StructureFloor];
        const groundTile = groundTiles?.[relativeY]?.[relativeX];

        // If the ground floor has a solid tile here
        if (groundTile && (groundTile.tileType === 'floor' || groundTile.tileType === 'wall')) {
          // STAMP FOUNDATION
          tile.blockType = 'stone'; // Cobblestone foundation
          tile.biome = `structure_foundation_${structure.id}`;
        }
      }
    }
  }

  return tiles;
}
