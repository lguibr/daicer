/**
 * Structure Materializer Service
 * Generates 3D voxel footprints for structures using noise algorithms
 * Same approach as map generation for consistency
 */

import type { Structure } from '@daicer/shared/world/structure-schema';
import { SimplexNoise } from './noise';
import { logger } from '@/utils/logger';

/**
 * Material types for voxels
 */
export enum StructureMaterial {
  AIR = 0,
  STONE_WALL = 1,
  WOOD_WALL = 2,
  STONE_FLOOR = 3,
  WOOD_FLOOR = 4,
  STONE_ROOF = 5,
  THATCH_ROOF = 6,
  IRON_DOOR = 7,
  GLASS_WINDOW = 8,
}

/**
 * Voxel data for a single structure
 */
export interface StructureVoxelData {
  structureId: string;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  voxels: Uint8Array; // Flattened 3D array of materials
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  collapseInfluence: {
    x: number;
    y: number;
    radius: number;
    flatten: boolean;
    targetElevation: number;
    strength: number;
  };
}

/**
 * Calculate structure bounds based on size and significance
 */
function calculateBounds(structure: Structure): { width: number; height: number; depth: number } {
  const baseSize = structure.width || 32;
  const significance = structure.significance;

  // Depth (z-axis) based on structure type
  const depthMap: Record<Structure['type'], number> = {
    settlement: 12, // Multi-story buildings
    dungeon: 8, // Underground levels
    landmark: 16, // Tall towers/monuments
    ruin: 6, // Collapsed, lower
    natural: 10, // Trees, rock formations
  };

  return {
    width: baseSize,
    height: structure.height || baseSize,
    depth: Math.floor(depthMap[structure.type] * (significance / 10)),
  };
}

/**
 * Get material palette for structure type
 */
function getMaterialPalette(type: Structure['type']): {
  wall: StructureMaterial;
  floor: StructureMaterial;
  roof: StructureMaterial;
} {
  const palettes = {
    settlement: {
      wall: StructureMaterial.WOOD_WALL,
      floor: StructureMaterial.WOOD_FLOOR,
      roof: StructureMaterial.THATCH_ROOF,
    },
    dungeon: {
      wall: StructureMaterial.STONE_WALL,
      floor: StructureMaterial.STONE_FLOOR,
      roof: StructureMaterial.STONE_ROOF,
    },
    landmark: {
      wall: StructureMaterial.STONE_WALL,
      floor: StructureMaterial.STONE_FLOOR,
      roof: StructureMaterial.STONE_ROOF,
    },
    ruin: {
      wall: StructureMaterial.STONE_WALL,
      floor: StructureMaterial.STONE_FLOOR,
      roof: StructureMaterial.AIR, // No roof (ruined)
    },
    natural: {
      wall: StructureMaterial.WOOD_WALL, // Tree trunks
      floor: StructureMaterial.STONE_FLOOR, // Ground
      roof: StructureMaterial.AIR, // Open sky
    },
  };

  return palettes[type];
}

/**
 * Generate exterior walls using noise for natural variance
 */
function generateWalls(
  bounds: { width: number; height: number; depth: number },
  noise: SimplexNoise,
  materials: ReturnType<typeof getMaterialPalette>
): Uint8Array {
  const { width, height, depth } = bounds;
  const voxels = new Uint8Array(width * height * depth);

  // Helper to set voxel
  const setVoxel = (x: number, y: number, z: number, material: StructureMaterial) => {
    if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) return;
    const index = x + y * width + z * width * height;
    voxels[index] = material;
  };

  // Generate walls with noise-based variance
  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isEdge = x === 0 || x === width - 1 || y === 0 || y === height - 1;

        if (isEdge && z < depth - 1) {
          // Apply noise for natural variance (some gaps, thickness variation)
          const noiseValue = noise.octaveNoise(x * 0.1, y * 0.1, 3, 0.5, 2.0);
          const threshold = 0.15; // Wall solidity threshold

          if (noiseValue > -threshold) {
            setVoxel(x, y, z, materials.wall);

            // Add windows occasionally
            if (z > 2 && z < depth - 3 && Math.abs(noiseValue) < 0.05) {
              setVoxel(x, y, z, StructureMaterial.GLASS_WINDOW);
            }
          }
        } else if (z === 0) {
          // Floor
          setVoxel(x, y, z, materials.floor);
        } else if (z === depth - 1 && materials.roof !== StructureMaterial.AIR) {
          // Roof
          setVoxel(x, y, z, materials.roof);
        }
      }
    }
  }

  return voxels;
}

/**
 * Materialize structure into 3D voxel data
 * Uses noise algorithms for natural generation (same as map gen)
 */
export function materializeStructure(structure: Structure, roomSeed: string): StructureVoxelData {
  logger.info(`[StructureMaterializer] Materializing ${structure.name}`, {
    type: structure.type,
    size: structure.size,
    significance: structure.significance,
  });

  // Calculate bounds
  const dimensions = calculateBounds(structure);

  // Create noise generator (deterministic from room seed + structure ID)
  const seed = `${roomSeed}-${structure.id}`;
  const noise = new SimplexNoise(seed);

  // Get material palette
  const materials = getMaterialPalette(structure.type);

  // Generate voxel data
  const voxels = generateWalls(dimensions, noise, materials);

  // Create collapse influence for terrain integration
  const influenceRadius = Math.max(dimensions.width, dimensions.height) * 0.6;
  const collapseInfluence = {
    x: structure.x,
    y: structure.y,
    radius: influenceRadius,
    flatten: true,
    targetElevation: structure.type === 'dungeon' ? -0.2 : 0.1,
    strength: Math.min(structure.significance / 10, 1.0),
  };

  logger.info(`[StructureMaterializer] Generated ${voxels.length} voxels for ${structure.name}`, {
    dimensions,
    voxelCount: voxels.filter((v) => v !== StructureMaterial.AIR).length,
  });

  return {
    structureId: structure.id,
    bounds: {
      minX: structure.x - Math.floor(dimensions.width / 2),
      maxX: structure.x + Math.floor(dimensions.width / 2),
      minY: structure.y - Math.floor(dimensions.height / 2),
      maxY: structure.y + Math.floor(dimensions.height / 2),
      minZ: 0,
      maxZ: dimensions.depth,
    },
    voxels,
    dimensions,
    collapseInfluence,
  };
}

/**
 * Materialize all structures in batch
 */
export function materializeAllStructures(structures: Structure[], roomSeed: string): StructureVoxelData[] {
  logger.info(`[StructureMaterializer] Materializing ${structures.length} structures`);

  const materialized = structures.map((structure) => materializeStructure(structure, roomSeed));

  const totalVoxels = materialized.reduce(
    (sum, s) => sum + s.voxels.filter((v) => v !== StructureMaterial.AIR).length,
    0
  );

  logger.info(`[StructureMaterializer] Complete - ${totalVoxels} total voxels generated`);

  return materialized;
}
