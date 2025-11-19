/**
 * Structure Template System
 * JSON-based building blueprints with procedural variation
 */

import { SimplexNoise } from './noise';
import { BlockType } from './worldGenService';

export interface StructureBlock {
  x: number; // Relative to structure origin
  y: number;
  z: number;
  blockType: BlockType | string;
  probability?: number; // 0-1, for random block placement
}

export interface StructureTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  blocks: StructureBlock[];
  spawnRules: {
    biomes?: string[]; // Which biomes this structure can spawn in
    minDistance?: number; // Minimum distance from other structures
    rarity?: number; // 0-1, spawn probability
    onlyOnSurface?: boolean;
    underground?: boolean;
    minElevation?: number;
    maxElevation?: number;
  };
  variants?: number; // Number of procedural variants to generate
}

/**
 * Built-in structure templates
 */
export const STRUCTURE_TEMPLATES: Record<string, StructureTemplate> = {
  // Simple oak tree
  oak_tree: {
    id: 'oak_tree',
    name: 'Oak Tree',
    width: 5,
    height: 5,
    depth: 8,
    blocks: [
      // Trunk
      { x: 2, y: 2, z: 0, blockType: 'dirt' },
      { x: 2, y: 2, z: 1, blockType: 'dirt' },
      { x: 2, y: 2, z: 2, blockType: 'dirt' },
      { x: 2, y: 2, z: 3, blockType: 'dirt' },
      { x: 2, y: 2, z: 4, blockType: 'dirt' },
      // Canopy layer 1 (z=5)
      { x: 1, y: 1, z: 5, blockType: 'grass', probability: 0.8 },
      { x: 2, y: 1, z: 5, blockType: 'grass', probability: 0.9 },
      { x: 3, y: 1, z: 5, blockType: 'grass', probability: 0.8 },
      { x: 1, y: 2, z: 5, blockType: 'grass', probability: 0.9 },
      { x: 2, y: 2, z: 5, blockType: 'dirt' },
      { x: 3, y: 2, z: 5, blockType: 'grass', probability: 0.9 },
      { x: 1, y: 3, z: 5, blockType: 'grass', probability: 0.8 },
      { x: 2, y: 3, z: 5, blockType: 'grass', probability: 0.9 },
      { x: 3, y: 3, z: 5, blockType: 'grass', probability: 0.8 },
      // Canopy layer 2 (z=6)
      { x: 1, y: 1, z: 6, blockType: 'grass', probability: 0.7 },
      { x: 2, y: 1, z: 6, blockType: 'grass', probability: 0.8 },
      { x: 3, y: 1, z: 6, blockType: 'grass', probability: 0.7 },
      { x: 1, y: 2, z: 6, blockType: 'grass', probability: 0.8 },
      { x: 2, y: 2, z: 6, blockType: 'grass', probability: 0.9 },
      { x: 3, y: 2, z: 6, blockType: 'grass', probability: 0.8 },
      { x: 1, y: 3, z: 6, blockType: 'grass', probability: 0.7 },
      { x: 2, y: 3, z: 6, blockType: 'grass', probability: 0.8 },
      { x: 3, y: 3, z: 6, blockType: 'grass', probability: 0.7 },
      // Top layer (z=7)
      { x: 2, y: 2, z: 7, blockType: 'grass', probability: 0.9 },
    ],
    spawnRules: {
      biomes: ['forest', 'plains', 'birch_forest'],
      minDistance: 5,
      rarity: 0.8,
      onlyOnSurface: true,
      underground: false,
    },
    variants: 3,
  },

  // Small stone ruin
  stone_ruin: {
    id: 'stone_ruin',
    name: 'Stone Ruin',
    width: 7,
    height: 7,
    depth: 4,
    blocks: [
      // Floor
      { x: 1, y: 1, z: 0, blockType: 'stone' },
      { x: 2, y: 1, z: 0, blockType: 'stone' },
      { x: 3, y: 1, z: 0, blockType: 'stone' },
      { x: 4, y: 1, z: 0, blockType: 'stone' },
      { x: 5, y: 1, z: 0, blockType: 'stone' },
      { x: 1, y: 2, z: 0, blockType: 'stone' },
      { x: 2, y: 2, z: 0, blockType: 'stone' },
      { x: 3, y: 2, z: 0, blockType: 'stone' },
      { x: 4, y: 2, z: 0, blockType: 'stone' },
      { x: 5, y: 2, z: 0, blockType: 'stone' },
      // Partial walls (ruined)
      { x: 1, y: 1, z: 1, blockType: 'stone', probability: 0.7 },
      { x: 1, y: 1, z: 2, blockType: 'stone', probability: 0.5 },
      { x: 5, y: 1, z: 1, blockType: 'stone', probability: 0.7 },
      { x: 5, y: 1, z: 2, blockType: 'stone', probability: 0.5 },
      { x: 1, y: 5, z: 1, blockType: 'stone', probability: 0.7 },
      { x: 1, y: 5, z: 2, blockType: 'stone', probability: 0.5 },
      { x: 5, y: 5, z: 1, blockType: 'stone', probability: 0.7 },
      { x: 5, y: 5, z: 2, blockType: 'stone', probability: 0.5 },
      // Scattered debris
      { x: 2, y: 2, z: 1, blockType: 'stone', probability: 0.3 },
      { x: 3, y: 3, z: 1, blockType: 'stone', probability: 0.3 },
      { x: 4, y: 2, z: 1, blockType: 'stone', probability: 0.3 },
    ],
    spawnRules: {
      biomes: ['plains', 'savanna', 'desert'],
      minDistance: 50,
      rarity: 0.1,
      onlyOnSurface: true,
      underground: false,
    },
    variants: 5,
  },

  // Small house
  village_house: {
    id: 'village_house',
    name: 'Village House',
    width: 9,
    height: 9,
    depth: 6,
    blocks: [
      // Foundation
      ...Array.from({ length: 7 }, (_unused1, x) =>
        Array.from({ length: 7 }, (_unused2, y) => ({
          x: x + 1,
          y: y + 1,
          z: 0,
          blockType: 'dirt' as BlockType,
        }))
      ).flat(),
      // Walls (z=1 to z=3)
      ...Array.from({ length: 3 }, (_, z) => [
        // Front wall
        { x: 1, y: 1, z: z + 1, blockType: 'dirt' },
        { x: 2, y: 1, z: z + 1, blockType: 'dirt' },
        { x: 3, y: 1, z: z + 1, blockType: 'air' }, // Door
        { x: 4, y: 1, z: z + 1, blockType: 'air' }, // Door
        { x: 5, y: 1, z: z + 1, blockType: 'dirt' },
        { x: 6, y: 1, z: z + 1, blockType: 'dirt' },
        { x: 7, y: 1, z: z + 1, blockType: 'dirt' },
        // Back wall
        { x: 1, y: 7, z: z + 1, blockType: 'dirt' },
        { x: 2, y: 7, z: z + 1, blockType: 'dirt' },
        { x: 3, y: 7, z: z + 1, blockType: 'dirt' },
        { x: 4, y: 7, z: z + 1, blockType: 'dirt' },
        { x: 5, y: 7, z: z + 1, blockType: 'dirt' },
        { x: 6, y: 7, z: z + 1, blockType: 'dirt' },
        { x: 7, y: 7, z: z + 1, blockType: 'dirt' },
        // Left wall
        { x: 1, y: 2, z: z + 1, blockType: 'dirt' },
        { x: 1, y: 3, z: z + 1, blockType: 'dirt' },
        { x: 1, y: 4, z: z + 1, blockType: 'dirt' },
        { x: 1, y: 5, z: z + 1, blockType: 'dirt' },
        { x: 1, y: 6, z: z + 1, blockType: 'dirt' },
        // Right wall
        { x: 7, y: 2, z: z + 1, blockType: 'dirt' },
        { x: 7, y: 3, z: z + 1, blockType: 'dirt' },
        { x: 7, y: 4, z: z + 1, blockType: 'dirt' },
        { x: 7, y: 5, z: z + 1, blockType: 'dirt' },
        { x: 7, y: 6, z: z + 1, blockType: 'dirt' },
      ]).flat(),
      // Roof (simple flat for now)
      ...Array.from({ length: 9 }, (_unused3, x) =>
        Array.from({ length: 9 }, (_unused4, y) => ({
          x,
          y,
          z: 4,
          blockType: 'dirt' as BlockType,
        }))
      ).flat(),
    ],
    spawnRules: {
      biomes: ['plains', 'forest', 'savanna'],
      minDistance: 100,
      rarity: 0.05,
      onlyOnSurface: true,
      underground: false,
    },
    variants: 10,
  },

  // Shrine/altar
  shrine: {
    id: 'shrine',
    name: 'Ancient Shrine',
    width: 5,
    height: 5,
    depth: 5,
    blocks: [
      // Platform
      { x: 0, y: 0, z: 0, blockType: 'stone' },
      { x: 1, y: 0, z: 0, blockType: 'stone' },
      { x: 2, y: 0, z: 0, blockType: 'stone' },
      { x: 3, y: 0, z: 0, blockType: 'stone' },
      { x: 4, y: 0, z: 0, blockType: 'stone' },
      { x: 0, y: 4, z: 0, blockType: 'stone' },
      { x: 1, y: 4, z: 0, blockType: 'stone' },
      { x: 2, y: 4, z: 0, blockType: 'stone' },
      { x: 3, y: 4, z: 0, blockType: 'stone' },
      { x: 4, y: 4, z: 0, blockType: 'stone' },
      // Pillars
      { x: 0, y: 0, z: 1, blockType: 'stone' },
      { x: 0, y: 0, z: 2, blockType: 'stone' },
      { x: 0, y: 0, z: 3, blockType: 'stone' },
      { x: 4, y: 0, z: 1, blockType: 'stone' },
      { x: 4, y: 0, z: 2, blockType: 'stone' },
      { x: 4, y: 0, z: 3, blockType: 'stone' },
      { x: 0, y: 4, z: 1, blockType: 'stone' },
      { x: 0, y: 4, z: 2, blockType: 'stone' },
      { x: 0, y: 4, z: 3, blockType: 'stone' },
      { x: 4, y: 4, z: 1, blockType: 'stone' },
      { x: 4, y: 4, z: 2, blockType: 'stone' },
      { x: 4, y: 4, z: 3, blockType: 'stone' },
      // Central altar
      { x: 2, y: 2, z: 0, blockType: 'stone' },
      { x: 2, y: 2, z: 1, blockType: 'stone' },
    ],
    spawnRules: {
      biomes: ['mountains', 'forest', 'jungle'],
      minDistance: 200,
      rarity: 0.02,
      onlyOnSurface: true,
      underground: false,
      minElevation: 20,
    },
    variants: 3,
  },
};

/**
 * Generate a procedural variant of a structure template
 */
export function generateStructureVariant(
  template: StructureTemplate,
  seed: string,
  variantIndex: number
): StructureTemplate {
  const noise = new SimplexNoise(`${seed}-${template.id}-${variantIndex}`);
  const variantBlocks: StructureBlock[] = [];

  for (const block of template.blocks) {
    // Apply probability
    if (block.probability !== undefined) {
      const roll = noise.noise(block.x, block.y) * 0.5 + 0.5;
      if (roll > block.probability) {
        continue; // eslint-disable-line no-continue
      }
    }

    // Add the block
    variantBlocks.push({ ...block });
  }

  return {
    ...template,
    id: `${template.id}_variant_${variantIndex}`,
    name: `${template.name} (Variant ${variantIndex})`,
    blocks: variantBlocks,
  };
}

/**
 * Place a structure in the world
 */
export function placeStructure(
  template: StructureTemplate,
  worldX: number,
  worldY: number,
  worldZ: number,
  rotation: 0 | 90 | 180 | 270 = 0
): Array<{ x: number; y: number; z: number; blockType: BlockType | string }> {
  const blocks: Array<{ x: number; y: number; z: number; blockType: BlockType | string }> = [];

  for (const block of template.blocks) {
    let { x, y } = block;
    const { z, blockType } = block;

    // Apply rotation
    if (rotation === 90) {
      const temp = x;
      x = template.height - 1 - y;
      y = temp;
    } else if (rotation === 180) {
      x = template.width - 1 - x;
      y = template.height - 1 - y;
    } else if (rotation === 270) {
      const temp = x;
      x = y;
      y = template.width - 1 - temp;
    }

    blocks.push({
      x: worldX + x,
      y: worldY + y,
      z: worldZ + z,
      blockType,
    });
  }

  return blocks;
}

/**
 * Check if a structure can spawn at a location
 */
export function canSpawnStructure(
  template: StructureTemplate,
  worldX: number,
  worldY: number,
  worldZ: number,
  biome: string,
  elevation: number,
  existingStructures: Array<{ x: number; y: number; z: number; template: StructureTemplate }>
): boolean {
  const { spawnRules } = template;

  // Check biome
  if (spawnRules.biomes && !spawnRules.biomes.includes(biome)) {
    return false;
  }

  // Check elevation
  if (spawnRules.minElevation !== undefined && elevation < spawnRules.minElevation) {
    return false;
  }
  if (spawnRules.maxElevation !== undefined && elevation > spawnRules.maxElevation) {
    return false;
  }

  // Check surface vs underground
  if (spawnRules.onlyOnSurface && worldZ < 0) {
    return false;
  }
  if (spawnRules.underground && worldZ >= 0) {
    return false;
  }

  // Check distance from other structures
  if (spawnRules.minDistance) {
    for (const existing of existingStructures) {
      const dx = existing.x - worldX;
      const dy = existing.y - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < spawnRules.minDistance) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Load structure template from JSON
 */
export function loadStructureFromJSON(json: string): StructureTemplate {
  return JSON.parse(json) as StructureTemplate;
}

/**
 * Save structure template to JSON
 */
export function saveStructureToJSON(template: StructureTemplate): string {
  return JSON.stringify(template, null, 2);
}
