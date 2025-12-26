import { Coordinates, Tile, ZLevel, BlockType } from '../types';
import { WorldGenerator } from './procgen';

export class PhysicsEngine {
  private generator: WorldGenerator;

  constructor(generator: WorldGenerator) {
    this.generator = generator;
  }

  public isWalkable(pos: Coordinates): boolean {
    const chunkX = Math.floor(pos.x / 32); 
    const chunkY = Math.floor(pos.y / 32);
    const chunk = this.generator.getChunk(chunkX, chunkY);

    const localX = ((pos.x % 32) + 32) % 32;
    const localY = ((pos.y % 32) + 32) % 32;
    const zIndex = pos.z + 3;

    if (zIndex < 0 || zIndex > 6) return false;

    return chunk.tiles[zIndex][localY][localX].isWalkable;
  }

  /**
   * Check if position contains stairs
   */
  public checkStaircase(pos: Coordinates): 'up' | 'down' | null {
    const chunkX = Math.floor(pos.x / 32);
    const chunkY = Math.floor(pos.y / 32);
    const chunk = this.generator.getChunk(chunkX, chunkY);
    const localX = ((pos.x % 32) + 32) % 32;
    const localY = ((pos.y % 32) + 32) % 32;
    const zIndex = pos.z + 3;

    const block = chunk.tiles[zIndex][localY][localX].block;
    if (block === BlockType.STAIRS_UP) return 'up';
    if (block === BlockType.STAIRS_DOWN) return 'down';
    return null;
  }

  /**
   * Standard Recursive Shadowcasting
   * Calculates visible tiles within radius, blocked by non-transparent tiles.
   */
  public calculateFieldOfView(origin: Coordinates, radius: number): Set<string> {
    const visiblePoints = new Set<string>();
    visiblePoints.add(`${origin.x},${origin.y}`);

    const isBlocking = (x: number, y: number) => {
        const chunkX = Math.floor(x / 32);
        const chunkY = Math.floor(y / 32);
        const chunk = this.generator.getChunk(chunkX, chunkY);
        const lx = ((x % 32) + 32) % 32;
        const ly = ((y % 32) + 32) % 32;
        const zIndex = origin.z + 3;
        // If chunk is not ready (shouldn't happen with sync gen), treat as blocking
        if (!chunk) return true;
        return !chunk.tiles[zIndex][ly][lx].isTransparent;
    };

    // Transform octants
    const transforms = [
      { xx: 1, xy: 0, yx: 0, yy: 1 },
      { xx: 1, xy: 0, yx: 0, yy: -1 },
      { xx: -1, xy: 0, yx: 0, yy: 1 },
      { xx: -1, xy: 0, yx: 0, yy: -1 },
      { xx: 0, xy: 1, yx: 1, yy: 0 },
      { xx: 0, xy: 1, yx: -1, yy: 0 },
      { xx: 0, xy: -1, yx: 1, yy: 0 },
      { xx: 0, xy: -1, yx: -1, yy: 0 },
    ];

    const castLight = (
      cx: number, cy: number, 
      row: number, 
      start: number, end: number, 
      transform: { xx: number, xy: number, yx: number, yy: number }
    ) => {
      if (start < end) return;
      
      let newStart = 0;
      let blocked = false;
      
      for (let distance = row; distance <= radius && !blocked; distance++) {
        let deltaY = -distance;
        for (let deltaX = -distance; deltaX <= 0; deltaX++) {
          let currentX = cx + (deltaX * transform.xx + deltaY * transform.xy);
          let currentY = cy + (deltaX * transform.yx + deltaY * transform.yy);
          
          let leftSlope = (deltaX - 0.5) / (deltaY + 0.5);
          let rightSlope = (deltaX + 0.5) / (deltaY - 0.5);

          if (!(currentX === cx && currentY === cy)) {
            if (start < rightSlope) continue;
            if (end > leftSlope) break;
            
            // Distance check (Euclidean-ish circle)
            if ((deltaX * deltaX + deltaY * deltaY) <= (radius * radius)) {
                visiblePoints.add(`${currentX},${currentY}`);
            }

            if (blocked) {
              if (isBlocking(currentX, currentY)) {
                newStart = rightSlope;
                continue;
              } else {
                blocked = false;
                start = newStart;
              }
            } else {
              if (isBlocking(currentX, currentY) && distance < radius) {
                blocked = true;
                castLight(cx, cy, distance + 1, start, leftSlope, transform);
                newStart = rightSlope;
              }
            }
          }
        }
      }
    };

    for (let i = 0; i < 8; i++) {
      castLight(origin.x, origin.y, 1, 1.0, 0.0, transforms[i]);
    }
    
    return visiblePoints;
  }

  /**
   * A* Pathfinding
   */
  public findPath(start: Coordinates, end: Coordinates): Coordinates[] | null {
    const h = (a: Coordinates, b: Coordinates) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    const k = (p: Coordinates) => `${p.x},${p.y},${p.z}`;

    const openSet: Coordinates[] = [start];
    const cameFrom = new Map<string, Coordinates>();
    const gScore = new Map<string, number>();
    gScore.set(k(start), 0);
    const fScore = new Map<string, number>();
    fScore.set(k(start), h(start, end));

    let iterations = 0;
    while (openSet.length > 0 && iterations < 3000) {
        iterations++;
        openSet.sort((a, b) => (fScore.get(k(a)) ?? Infinity) - (fScore.get(k(b)) ?? Infinity));
        const current = openSet.shift()!;

        if (current.x === end.x && current.y === end.y) {
            return this.reconstructPath(cameFrom, current);
        }

        const neighbors = [
            { x: current.x + 1, y: current.y, z: current.z },
            { x: current.x - 1, y: current.y, z: current.z },
            { x: current.x, y: current.y + 1, z: current.z },
            { x: current.x, y: current.y - 1, z: current.z }
        ];

        for (const neighbor of neighbors) {
            if (!this.isWalkable(neighbor)) continue;

            const tentativeG = (gScore.get(k(current)) ?? Infinity) + 1;
            if (tentativeG < (gScore.get(k(neighbor)) ?? Infinity)) {
                cameFrom.set(k(neighbor), current);
                gScore.set(k(neighbor), tentativeG);
                fScore.set(k(neighbor), tentativeG + h(neighbor, end));
                if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    return null;
  }

  private reconstructPath(cameFrom: Map<string, Coordinates>, current: Coordinates): Coordinates[] {
    const totalPath = [current];
    const k = (p: Coordinates) => `${p.x},${p.y},${p.z}`;
    while (cameFrom.has(k(current))) {
        current = cameFrom.get(k(current))!;
        totalPath.unshift(current);
    }
    return totalPath;
  }
}