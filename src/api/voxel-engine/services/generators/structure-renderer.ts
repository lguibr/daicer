/**
 * ⚠️ DOCUMENTATION MANDATE: Update JSDoc & README with ANY change.
 * Keep documentation synchronized with code at all times.
 */
import { Tile, BlockType } from '@daicer/engine/types';
import { TileHelper } from '@/api/voxel-engine/services/utils/tile-helper';
import { StructureInfo } from '@daicer/engine/types';

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
    if (!tiles || !tiles[0] || !tiles[0][0]) return;
    const limitY = tiles[0].length;
    const limitX = tiles[0][0].length;
    if (lx >= 0 && lx < limitX && ly >= 0 && ly < limitY && lz >= 0 && lz <= 6) {
      if (tiles[lz] && tiles[lz][ly] && tiles[lz][ly][lx]) {
        const t = tiles[lz][ly][lx];
        TileHelper.applyBlock(t, block);
      }
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
    mat: 'wood' | 'stone' | { wall: BlockType; floor: BlockType },
    hollow = false
  ) {
    let wall: BlockType;
    let floor: BlockType;

    if (typeof mat === 'object') {
      wall = mat.wall;
      floor = mat.floor;
    } else {
      wall = mat === 'wood' ? BlockType.WALL_WOOD : BlockType.WALL_STONE;
      floor = mat === 'wood' ? BlockType.FLOOR_WOOD : BlockType.FLOOR_STONE;
    }

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
