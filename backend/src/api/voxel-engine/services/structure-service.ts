import { Alea } from '@daicer/engine';
import { BlockType, StructureInfo, Tile, WorldConfig } from '@daicer/engine';
import { TileHelper } from './utils/tile-helper';

export class StructureService {
  constructor(private config: WorldConfig) {}

  public getRegionStructure(regionX: number, regionY: number, regionSize: number): StructureInfo {
    // Unique seed for this region's structure
    const seed = `${this.config.seed}_reg_${regionX}_${regionY}`;
    const rng = new Alea(seed);

    // Chance check
    if (rng.next() > this.config.structureChance) {
      return { type: 'none', worldX: 0, worldY: 0, size: 0, seed };
    }

    // Position: Center-biased random within region
    const padding = 20;
    const availableSize = Math.max(10, regionSize - padding * 2);
    const offsetX = Math.floor(rng.next() * availableSize) + padding;
    const offsetY = Math.floor(rng.next() * availableSize) + padding;

    const worldX = regionX * regionSize + offsetX;
    const worldY = regionY * regionSize + offsetY;

    // Type Selection (Weighted)
    const roll = rng.next();
    let type: StructureInfo['type'] = 'tower';
    let baseSize = this.config.structureSizeAvg;

    if (roll < 0.25) {
      type = 'city';
      baseSize = Math.floor(baseSize * 3);
    } else if (roll < 0.45) {
      type = 'castle';
      baseSize = Math.floor(baseSize * 2.5);
    } else if (roll < 0.7) {
      type = 'dungeon';
      baseSize = Math.floor(baseSize * 1.5);
    } else {
      type = 'tower';
      baseSize = Math.floor(baseSize * 1.2);
    }

    // Clamp size logic
    const size = Math.min(regionSize - 4, Math.max(8, baseSize));

    return { type, worldX, worldY, size, seed };
  }

  public renderStructure(struct: StructureInfo, tiles: Tile[][][], cx: number, cy: number): void {
    if (!this.intersects(cx, cy, this.config.chunkSize, struct.worldX, struct.worldY, struct.size)) {
      return;
    }

    switch (struct.type) {
      case 'city':
        this.generateCity(struct, tiles, cx, cy);
        break;
      case 'castle':
        this.generateCastle(struct, tiles, cx, cy);
        break;
      case 'tower':
        this.generateTower(struct, tiles, cx, cy);
        break;
      case 'dungeon':
        this.generateDungeon(struct, tiles, cx, cy);
        break;
    }
  }

  public intersects(x1: number, y1: number, s1: number, x2: number, y2: number, s2: number): boolean {
    return x1 < x2 + s2 && x1 + s1 > x2 && y1 < y2 + s2 && y1 + s1 > y2;
  }

  private generateCity(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
    const rng = new Alea(s.seed);
    const buildingCount = Math.floor(s.size / 4);

    // Main Plaza
    const centerSize = Math.floor(s.size * 0.3);
    const cxStart = Math.floor(s.size / 2) - Math.floor(centerSize / 2);
    for (let y = 0; y < centerSize; y++) {
      for (let x = 0; x < centerSize; x++) {
        TileHelper.setBlock(tiles, cx, cy, s.worldX + cxStart + x, s.worldY + cxStart + y, 0, BlockType.FLOOR_STONE);
      }
    }

    // Buildings around
    for (let i = 0; i < buildingCount; i++) {
      const bx = Math.floor(rng.next() * (s.size - 6));
      const by = Math.floor(rng.next() * (s.size - 6));
      const bSize = 4 + Math.floor(rng.next() * 3);

      // Don't overwrite plaza mostly
      if (Math.abs(bx - cxStart) < centerSize && Math.abs(by - cxStart) < centerSize) continue;

      const material = rng.next() > 0.5 ? 'wood' : 'stone';
      this.stampBuilding(tiles, cx, cy, s.worldX + bx, s.worldY + by, bSize, 2, material);
    }
  }

  private generateCastle(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
    // Outer Walls
    this.stampBuilding(tiles, cx, cy, s.worldX, s.worldY, s.size, 3, 'stone', true);

    // Central Keep (Higher)
    const keepSize = Math.floor(s.size / 2);
    const keepOff = Math.floor((s.size - keepSize) / 2);
    this.stampBuilding(tiles, cx, cy, s.worldX + keepOff, s.worldY + keepOff, keepSize, 5, 'stone');

    // Entrance
    const doorX = s.worldX + Math.floor(s.size / 2);
    const doorY = s.worldY + s.size - 1;
    TileHelper.setBlock(tiles, cx, cy, doorX, doorY, 0, BlockType.DOOR);
    TileHelper.setBlock(tiles, cx, cy, doorX, doorY, 1, BlockType.AIR); // Archway
  }

  private generateTower(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
    this.stampBuilding(tiles, cx, cy, s.worldX, s.worldY, s.size, 6, 'stone');

    const midX = Math.floor(s.size / 2);
    const midY = Math.floor(s.size / 2);

    // Alternating stair pattern for Towers (0 to 3)
    for (let z = 0; z <= 3; z++) {
      const wx = s.worldX + midX;
      const wy = s.worldY + midY;

      if (z % 2 === 0) {
        // Even Level (e.g. 0): Go UP at Center
        if (z < 3) TileHelper.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_UP);
        // Receive DOWN from Z+1 at Center+1 (must be clear or have stair)
        if (z > 0) TileHelper.setBlock(tiles, cx, cy, wx + 1, wy, z, BlockType.STAIRS_DOWN);
      } else {
        // Odd Level (e.g. 1): Go DOWN at Center
        TileHelper.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_DOWN);
        // Go UP at Center+1
        if (z < 3) TileHelper.setBlock(tiles, cx, cy, wx + 1, wy, z, BlockType.STAIRS_UP);
      }
    }
  }

  private generateDungeon(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
    // Surface Ruin (Broken walls)
    this.stampBuilding(tiles, cx, cy, s.worldX, s.worldY, s.size, 2, 'stone', true);

    const midX = Math.floor(s.size / 2);
    const midY = Math.floor(s.size / 2);
    const wx = s.worldX + midX;
    const wy = s.worldY + midY;

    // Surface Entrance
    TileHelper.setBlock(tiles, cx, cy, wx, wy, 0, BlockType.STAIRS_DOWN);

    // Underground Maze (Z-1 to Z-3)
    const caveRng = new Alea(s.seed + '_maze');

    for (let z = -1; z >= -3; z--) {
      // Carve Rooms first to ensure space
      const roomCount = 3 + Math.floor(caveRng.next() * 4);
      for (let i = 0; i < roomCount; i++) {
        const rw = 5 + Math.floor(caveRng.next() * 8);
        const rh = 5 + Math.floor(caveRng.next() * 8);
        // Bias rooms towards center where stairs are
        const rx = s.worldX + Math.floor(caveRng.next() * (s.size - rw));
        const ry = s.worldY + Math.floor(caveRng.next() * (s.size - rh));
        this.carveRoom(tiles, cx, cy, rx, ry, rw, rh, z);
      }

      // Force clear area around stairs
      this.carveRoom(tiles, cx, cy, wx - 1, wy - 1, 3, 3, z);

      // Stair Logic (Alternating)
      const depth = Math.abs(z); // 1, 2, 3

      if (depth % 2 === 1) {
        // Odd depth (-1, -3)
        TileHelper.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_UP);
        if (z > -3) TileHelper.setBlock(tiles, cx, cy, wx + 1, wy, z, BlockType.STAIRS_DOWN);
      } else {
        // Even depth (-2)
        TileHelper.setBlock(tiles, cx, cy, wx + 1, wy, z, BlockType.STAIRS_UP);
        if (z > -3) TileHelper.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_DOWN);
      }
    }
  }

  private stampBuilding(
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
            if (z === 0) TileHelper.setBlock(tiles, cx, cy, wx + x, wy + y, z, floor);
            continue;
          }
          const blk = isEdge ? wall : floor;
          if (hollow && z === height - 1 && !isEdge) continue;

          TileHelper.setBlock(tiles, cx, cy, wx + x, wy + y, z, blk);
        }
      }
    }
    // Simple Door
    TileHelper.setBlock(tiles, cx, cy, wx + Math.floor(size / 2), wy + size - 1, 0, BlockType.DOOR);
  }

  private carveRoom(
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
        TileHelper.setBlock(tiles, cx, cy, wx + x, wy + y, z, BlockType.FLOOR_STONE);
      }
    }
  }
}
