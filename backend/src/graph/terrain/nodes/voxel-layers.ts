/**
 * Voxel Layers Node
 * Generates 3D voxel matrix (underground, surface, sky layers)
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import type { TerrainGenerationState } from '../state';

/**
 * Generate 3D voxel grid with layers
 * - Underground (z < 0): Solid rock/stone
 * - Surface (z = 0): Terrain based on biome map
 * - Sky (z > 0): Air
 *
 * Structures are placed IN grid rooms (Dwarf Fortress style)
 */
export const voxelLayersNode = async (
  state: TerrainGenerationState,
  _config?: LangGraphRunnableConfig
): Promise<Partial<TerrainGenerationState>> => {
  const { roomId, biomeMap, settings, structures } = state;

  if (!biomeMap) {
    throw new Error('Biome map required for voxel generation');
  }

  logger.info('[voxel_layers] Generating 3D voxel matrix', {
    roomId,
    dimensions: `${settings.gridWidth}x${settings.gridHeight}x${settings.gridDepth}`,
    roomSize: settings.roomSize,
  });

  // Calculate room grid dimensions
  const roomsWide = Math.floor(settings.gridWidth / settings.roomSize);
  const roomsHigh = Math.floor(settings.gridHeight / settings.roomSize);

  logger.info('[voxel_layers] Room grid', {
    roomsWide,
    roomsHigh,
    totalRooms: roomsWide * roomsHigh,
  });

  // Place structures in room grid
  const occupiedRooms: Record<string, any> = {};

  structures.forEach((structure) => {
    // Convert world coordinates to room coordinates
    const roomX = Math.floor(structure.x / settings.roomSize);
    const roomY = Math.floor(structure.y / settings.roomSize);
    const roomKey = `${roomX},${roomY}`;

    occupiedRooms[roomKey] = {
      ...structure,
      roomX,
      roomY,
    };

    logger.debug('[voxel_layers] Placed structure in room', {
      name: structure.name,
      worldCoords: `(${structure.x}, ${structure.y})`,
      roomCoords: `(${roomX}, ${roomY})`,
    });
  });

  // Create voxel grid structure
  const voxelGrid = {
    width: settings.gridWidth,
    height: settings.gridHeight,
    depth: settings.gridDepth,
    roomSize: settings.roomSize,
    roomsWide,
    roomsHigh,
    occupiedRooms,
    layers: [] as any[], // Will be generated on-demand during gameplay
  };

  logger.info('[voxel_layers] Voxel grid generated', {
    totalVoxels: settings.gridWidth * settings.gridHeight * settings.gridDepth,
    structuresPlaced: Object.keys(occupiedRooms).length,
  });

  return {
    voxelGrid,
  };
};
