import { Alea, Tile, BiomeType, BlockType, ZLevel } from '@daicer/engine';
import { CHUNK_SIZE } from './constants';

export class TileHelper {
  static createTile(x: number, y: number, z: ZLevel, block: BlockType, biome: BiomeType, rng: Alea): Tile {
    const isTransparent = (
      [
        BlockType.AIR,
        BlockType.WATER,
        BlockType.DOOR,
        BlockType.GRASS,
        BlockType.DIRT,
        BlockType.SAND,
        BlockType.SNOW,
        BlockType.FLOOR_WOOD,
        BlockType.FLOOR_STONE,
        BlockType.TREE_LEAVES,
        BlockType.CACTUS,
        BlockType.STAIRS_UP,
        BlockType.STAIRS_DOWN,
      ] as BlockType[]
    ).includes(block);

    const isWalkable = (
      [
        BlockType.FLOOR_WOOD,
        BlockType.FLOOR_STONE,
        BlockType.GRASS,
        BlockType.DIRT,
        BlockType.SAND,
        BlockType.SNOW,
        BlockType.DOOR,
        BlockType.STAIRS_UP,
        BlockType.STAIRS_DOWN,
        BlockType.WATER,
      ] as BlockType[]
    ).includes(block);

    return {
      x,
      y,
      z,
      block,
      biome,
      isWalkable,
      isTransparent,
      variant: rng.next(),
    };
  }

  static setBlock(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    block: BlockType
  ): void {
    const lx = wx - cx;
    const ly = wy - cy;
    const lz = z + 3; // Map -3..3 to 0..6
    if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE && lz >= 0 && lz <= 6) {
      const t = tiles[lz][ly][lx];
      t.block = block;
      t.isWalkable = (
        [
          BlockType.FLOOR_STONE,
          BlockType.FLOOR_WOOD,
          BlockType.STAIRS_UP,
          BlockType.STAIRS_DOWN,
          BlockType.DOOR,
        ] as BlockType[]
      ).includes(block);
      t.isTransparent = t.isWalkable;
    }
  }
}
