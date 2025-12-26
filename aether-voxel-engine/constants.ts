import { BlockType } from './types';

export const CHUNK_SIZE = 32;
export const TILE_SIZE = 32; // Pixels
export const VIEW_RADIUS = 16; // Radius in tiles for rendering

export const COLORS: Record<BlockType, string> = {
  [BlockType.AIR]: 'rgba(0,0,0,0)',
  [BlockType.GRASS]: '#10b981',
  [BlockType.DIRT]: '#854d0e',
  [BlockType.STONE]: '#64748b',
  [BlockType.WATER]: '#3b82f6',
  [BlockType.SAND]: '#fcd34d',
  [BlockType.SNOW]: '#f8fafc',
  [BlockType.WALL_STONE]: '#334155',
  [BlockType.WALL_WOOD]: '#78350f',
  [BlockType.FLOOR_WOOD]: '#92400e',
  [BlockType.FLOOR_STONE]: '#475569',
  [BlockType.DOOR]: '#b45309',
  [BlockType.STAIRS_UP]: '#22d3ee', // Cyan
  [BlockType.STAIRS_DOWN]: '#d946ef', // Magenta
  [BlockType.LAVA]: '#ef4444',
  [BlockType.BEDROCK]: '#020617',
  [BlockType.TREE_LEAVES]: 'rgba(22, 163, 74, 0.9)', 
  [BlockType.CACTUS]: '#4d7c0f'
};