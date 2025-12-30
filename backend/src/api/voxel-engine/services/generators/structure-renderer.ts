import { Tile, BlockType } from '@daicer/engine';
import { CHUNK_SIZE } from '../utils/constants';

export interface StructureInfo {
  type: 'city' | 'castle' | 'tower' | 'dungeon' | 'none';
  worldX: number;
  worldY: number;
  size: number;
  seed: string;
}

export class StructureRenderer {
  public static renderStructure(
    struct: StructureInfo,
    tiles: Tile[][][],
    cx: number,
    cy: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generatorMethods: any
  ) {
    switch (struct.type) {
      case 'city':
        generatorMethods.generateCity(struct, tiles, cx, cy);
        break;
      case 'castle':
        generatorMethods.generateCastle(struct, tiles, cx, cy);
        break;
      case 'tower':
        generatorMethods.generateTower(struct, tiles, cx, cy);
        break;
      case 'dungeon':
        generatorMethods.generateDungeon(struct, tiles, cx, cy);
        break;
    }
  }

  // Basic painting primitive used by generators
  public static setBlock(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    z: number,
    block: BlockType
  ) {
    const lx = wx - cx;
    const ly = wy - cy;
    const lz = z + 3;
    if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE && lz >= 0 && lz <= 6) {
      const t = tiles[lz][ly][lx];
      t.block = block;
      t.isWalkable = (
        [BlockType.FLOOR_STONE, BlockType.FLOOR_WOOD, BlockType.STAIRS_UP, BlockType.STAIRS_DOWN] as BlockType[]
      ).includes(block);
      t.isTransparent = t.isWalkable;
    }
  }

  public static stampBuilding(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    size: number,
    height: number,
    mat: 'wood' | 'stone',
    hollow = false
  ) {
    const wall = mat === 'wood' ? BlockType.WALL_WOOD : BlockType.WALL_STONE;
    const floor = mat === 'wood' ? BlockType.FLOOR_WOOD : BlockType.FLOOR_STONE;

    for (let z = 0; z < height; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const isEdge = x === 0 || x === size - 1 || y === 0 || y === size - 1;
          if (hollow && !isEdge && z < height - 1) {
            if (z === 0) this.setBlock(tiles, cx, cy, wx + x, wy + y, z, floor);
            continue;
          }
          const blk = isEdge ? wall : floor;
          if (hollow && z === height - 1 && !isEdge) continue;
          this.setBlock(tiles, cx, cy, wx + x, wy + y, z, blk);
        }
      }
    }
    this.setBlock(tiles, cx, cy, wx + Math.floor(size / 2), wy + size - 1, 0, BlockType.DOOR);
  }

  public static carveRoom(
    tiles: Tile[][][],
    cx: number,
    cy: number,
    wx: number,
    wy: number,
    w: number,
    h: number,
    z: number
  ) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        this.setBlock(tiles, cx, cy, wx + x, wy + y, z, BlockType.FLOOR_STONE);
      }
    }
  }
}
