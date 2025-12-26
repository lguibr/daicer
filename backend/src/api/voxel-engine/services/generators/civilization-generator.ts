import { Alea } from '@daicer/engine';
import { WorldConfig, Tile, BlockType } from '@daicer/engine';
import { StructureInfo, StructureRenderer } from './structure-renderer';

export class CivilizationGenerator {
  private config: WorldConfig;

  constructor(config: WorldConfig) {
    this.config = config;
  }

  public apply(chunkX: number, chunkY: number, tiles: Tile[][][], wOffX: number, wOffY: number) {
    const regionSize = Math.max(1, Math.floor(this.config.structureSpacing)) * this.config.chunkSize;
    const currentRegionX = Math.floor(wOffX / regionSize);
    const currentRegionY = Math.floor(wOffY / regionSize);

    for (let ry = currentRegionY - 1; ry <= currentRegionY + 1; ry++) {
      for (let rx = currentRegionX - 1; rx <= currentRegionX + 1; rx++) {
        const struct = this.getRegionStructure(rx, ry, regionSize);
        if (struct.type === 'none') continue;

        this.connectStructureToNeighbors(struct, rx, ry, regionSize, tiles, wOffX, wOffY);

        if (this.intersects(wOffX, wOffY, this.config.chunkSize, struct.worldX, struct.worldY, struct.size)) {
          // We use Strategy pattern or pass context. For now, calling internal methods.
          this.generateStructure(struct, tiles, wOffX, wOffY);
        }
      }
    }
  }

  private getRegionStructure(regionX: number, regionY: number, regionSize: number): StructureInfo {
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

  private connectStructureToNeighbors(
    source: StructureInfo,
    rx: number,
    ry: number,
    regionSize: number,
    tiles: Tile[][][],
    chunkOffX: number,
    chunkOffY: number
  ) {
    const neighbors = [
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
    ];
    const rng = new Alea(source.seed + '_roads');

    for (const n of neighbors) {
      if (rng.next() > this.config.roadDensity) continue;
      const target = this.getRegionStructure(rx + n.dx, ry + n.dy, regionSize);
      if (target.type !== 'none') {
        this.rasterizeRoad(
          source.worldX + Math.floor(source.size / 2),
          source.worldY + Math.floor(source.size / 2),
          target.worldX + Math.floor(target.size / 2),
          target.worldY + Math.floor(target.size / 2),
          tiles,
          chunkOffX,
          chunkOffY
        );
      }
    }
  }

  private rasterizeRoad(x0: number, y0: number, x1: number, y1: number, tiles: Tile[][][], cx: number, cy: number) {
    // Bresenham's Line Algorithm
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    const brushSize = 1; // Radius 1 = 3x3 width roughly

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Draw Brush (3x3) around point
      for (let by = -brushSize; by <= brushSize; by++) {
        for (let bx = -brushSize; bx <= brushSize; bx++) {
          const wx = x + bx;
          const wy = y + by;
          const lx = wx - cx;
          const ly = wy - cy;

          if (lx >= 0 && lx < this.config.chunkSize && ly >= 0 && ly < this.config.chunkSize) {
            // Carve Road on Surface
            if (tiles[3][ly][lx].block !== BlockType.WATER) {
              tiles[3][ly][lx].block = BlockType.FLOOR_STONE;
              // Clear vegetation above
              tiles[4][ly][lx].block = BlockType.AIR;
              tiles[5][ly][lx].block = BlockType.AIR;
            } else {
              // Bridge over water
              tiles[3][ly][lx].block = BlockType.FLOOR_WOOD;
            }
          }
        }
      }

      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  private generateStructure(struct: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
    // Pass 'this' as generatorMethods because we will implement the methods here or delegate
    StructureRenderer.renderStructure(struct, tiles, cx, cy, this);
  }

  // Implementation of generation methods called by StructureRenderer via callback
  public generateCity(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
    const rng = new Alea(s.seed);
    const buildingCount = Math.floor(s.size / 4);
    const centerSize = Math.floor(s.size * 0.3);
    const cxStart = Math.floor(s.size / 2) - Math.floor(centerSize / 2);

    for (let y = 0; y < centerSize; y++) {
      for (let x = 0; x < centerSize; x++) {
        StructureRenderer.setBlock(
          tiles,
          cx,
          cy,
          s.worldX + cxStart + x,
          s.worldY + cxStart + y,
          0,
          BlockType.FLOOR_STONE
        );
      }
    }

    for (let i = 0; i < buildingCount; i++) {
      const bx = Math.floor(rng.next() * (s.size - 6));
      const by = Math.floor(rng.next() * (s.size - 6));
      const bSize = 4 + Math.floor(rng.next() * 3);
      if (Math.abs(bx - cxStart) < centerSize && Math.abs(by - cxStart) < centerSize) continue;
      const material = rng.next() > 0.5 ? 'wood' : 'stone';
      StructureRenderer.stampBuilding(tiles, cx, cy, s.worldX + bx, s.worldY + by, bSize, 2, material);
    }
  }

  public generateCastle(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
    StructureRenderer.stampBuilding(tiles, cx, cy, s.worldX, s.worldY, s.size, 3, 'stone', true);
    const keepSize = Math.floor(s.size / 2);
    const keepOff = Math.floor((s.size - keepSize) / 2);
    StructureRenderer.stampBuilding(tiles, cx, cy, s.worldX + keepOff, s.worldY + keepOff, keepSize, 5, 'stone');
    const doorX = s.worldX + Math.floor(s.size / 2);
    const doorY = s.worldY + s.size - 1;
    StructureRenderer.setBlock(tiles, cx, cy, doorX, doorY, 0, BlockType.DOOR);
    StructureRenderer.setBlock(tiles, cx, cy, doorX, doorY, 1, BlockType.AIR);
  }

  public generateTower(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
    StructureRenderer.stampBuilding(tiles, cx, cy, s.worldX, s.worldY, s.size, 6, 'stone');
    const midX = Math.floor(s.size / 2);
    const midY = Math.floor(s.size / 2);
    for (let z = 0; z <= 3; z++) {
      const wx = s.worldX + midX;
      const wy = s.worldY + midY;
      if (z % 2 === 0) {
        if (z < 3) StructureRenderer.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_UP);
        if (z > 0) StructureRenderer.setBlock(tiles, cx, cy, wx + 1, wy, z, BlockType.STAIRS_DOWN);
      } else {
        StructureRenderer.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_DOWN);
        if (z < 3) StructureRenderer.setBlock(tiles, cx, cy, wx + 1, wy, z, BlockType.STAIRS_UP);
      }
    }
  }

  public generateDungeon(s: StructureInfo, tiles: Tile[][][], cx: number, cy: number) {
    StructureRenderer.stampBuilding(tiles, cx, cy, s.worldX, s.worldY, s.size, 2, 'stone', true);
    const midX = Math.floor(s.size / 2);
    const midY = Math.floor(s.size / 2);
    const wx = s.worldX + midX;
    const wy = s.worldY + midY;
    StructureRenderer.setBlock(tiles, cx, cy, wx, wy, 0, BlockType.STAIRS_DOWN);

    const caveRng = new Alea(s.seed + '_maze');
    for (let z = -1; z >= -3; z--) {
      const roomCount = 3 + Math.floor(caveRng.next() * 4);
      for (let i = 0; i < roomCount; i++) {
        const rw = 5 + Math.floor(caveRng.next() * 8);
        const rh = 5 + Math.floor(caveRng.next() * 8);
        const rx = s.worldX + Math.floor(caveRng.next() * (s.size - rw));
        const ry = s.worldY + Math.floor(caveRng.next() * (s.size - rh));
        StructureRenderer.carveRoom(tiles, cx, cy, rx, ry, rw, rh, z);
      }
      StructureRenderer.carveRoom(tiles, cx, cy, wx - 1, wy - 1, 3, 3, z);
      const depth = Math.abs(z);
      if (depth % 2 === 1) {
        StructureRenderer.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_UP);
        if (z > -3) StructureRenderer.setBlock(tiles, cx, cy, wx + 1, wy, z, BlockType.STAIRS_DOWN);
      } else {
        StructureRenderer.setBlock(tiles, cx, cy, wx + 1, wy, z, BlockType.STAIRS_UP);
        if (z > -3) StructureRenderer.setBlock(tiles, cx, cy, wx, wy, z, BlockType.STAIRS_DOWN);
      }
    }
  }

  private intersects(x1: number, y1: number, s1: number, x2: number, y2: number, s2: number): boolean {
    return x1 < x2 + s2 && x1 + s1 > x2 && y1 < y2 + s2 && y1 + s1 > y2;
  }
}
