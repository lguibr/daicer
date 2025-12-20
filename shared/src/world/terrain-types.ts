import { type BiomeType } from './biome-schema';
import { type BlockType } from './grid-tile-schema';

export interface TerrainTile {
  x: number;
  y: number;
  z: number;
  biome: BiomeType | string; // Allow string for flexibility or legacy
  blockType: BlockType | string;
  lightLevel?: number;
}

/**
 * Compressed DTO for sending chunks over the wire.
 * We use a more explicit format than raw strings, but keep it JSON-serializable.
 */
export interface ChunkDTO {
  chunkX: number;
  chunkY: number;
  worldOffsetX: number;
  worldOffsetY: number;
  size: number;

  /**
   * 3D Grid of tiles.
   * [floor_index][y][x]
   * Floor index is mapped 0..6 (representing -3 to +3)
   */
  grid: {
    b: string; // biome (short key could be used later)
    t: string; // blockType
  }[][][];
}
