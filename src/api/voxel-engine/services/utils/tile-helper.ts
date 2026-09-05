/**
 * ⚠️ DOCUMENTATION MANDATE: Update JSDoc & README with ANY change.
 * Keep documentation synchronized with code at all times.
 */
import { Alea } from '@/api/voxel-engine/src/utils/math';
import { Tile, BiomeType, BlockType, ZLevel } from '@daicer/engine/types';

export class TileHelper {
  /** Apply the same block policy to generation, structures and persisted edits. */
  static applyBlock(tile: Tile, block: string): void {
    tile.block = block;
    tile.isTransparent = (
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
    ).includes(block as BlockType);

    tile.isWalkable = (
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
    ).includes(block as BlockType);
  }

  static createTile(x: number, y: number, z: ZLevel, block: BlockType, biome: BiomeType, rng: Alea): Tile {
    const tile = { x, y, z, block, biome, isWalkable: false, isTransparent: false, variant: rng.next() };
    this.applyBlock(tile, block);
    return tile;
  }

  /** cx/cy are world offsets, not chunk indices. */
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
    const tile = tiles[z + 3]?.[ly]?.[lx];
    if (tile) this.applyBlock(tile, block);
  }
}
