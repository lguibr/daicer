import { Alea } from '@daicer/engine';
import { BlockType, StructureInfo, Tile, WorldConfig } from '@daicer/engine';
import { TileHelper } from './utils/tile-helper';
import { StructureService } from './structure-service';

export class RoadService {
  constructor(
    private config: WorldConfig,
    private structureService: StructureService
  ) {}

  public connectStructureToNeighbors(
    source: StructureInfo,
    rx: number,
    ry: number,
    regionSize: number,
    tiles: Tile[][][],
    chunkOffX: number,
    chunkOffY: number
  ) {
    // Connect to East (rx+1) and South (ry+1) neighbors
    const neighbors = [
      { dx: 1, dy: 0 }, // East
      { dx: 0, dy: 1 }, // South
    ];

    const rng = new Alea(source.seed + '_roads');

    for (const n of neighbors) {
      // Chance to have road
      if (rng.next() > this.config.roadDensity) continue;

      const target = this.structureService.getRegionStructure(rx + n.dx, ry + n.dy, regionSize);
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
              TileHelper.setBlock(tiles, cx, cy, wx, wy, 0, BlockType.FLOOR_STONE);
              // Clear vegetation above
              TileHelper.setBlock(tiles, cx, cy, wx, wy, 1, BlockType.AIR);
              TileHelper.setBlock(tiles, cx, cy, wx, wy, 2, BlockType.AIR);
            } else {
              // Bridge over water
              TileHelper.setBlock(tiles, cx, cy, wx, wy, 0, BlockType.FLOOR_WOOD);
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
}
