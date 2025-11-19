/**
 * @file backend/src/tactical/services/gridManager.ts
 * @description Grid management and pathfinding service for tactical arenas
 */

import type { GridPosition } from '../../types/spells.js';
import type { TacticalArena, GridCell } from '../types/arena.js';
import { getCellAt, isValidPosition } from '../types/arena.js';
import { getArenaById } from '../arenas/generator.js';

/**
 * Grid manager service for arena operations
 */
export class GridManager {
  private arena: TacticalArena;

  constructor(arenaIdOrArena: string | TacticalArena) {
    if (typeof arenaIdOrArena === 'string') {
      const loadedArena = getArenaById(arenaIdOrArena);
      if (!loadedArena) {
        throw new Error(`Arena not found: ${arenaIdOrArena}`);
      }
      this.arena = loadedArena;
    } else {
      this.arena = arenaIdOrArena;
    }
  }

  /**
   * Get the arena
   */
  getArena(): TacticalArena {
    return this.arena;
  }

  /**
   * Get cell at position
   */
  getCellAt(pos: GridPosition): GridCell | null {
    return getCellAt(this.arena, pos);
  }

  /**
   * Check if position is within grid bounds
   */
  isInBounds(pos: GridPosition): boolean {
    return pos.x >= 0 && pos.x < this.arena.width && pos.y >= 0 && pos.y < this.arena.height;
  }

  /**
   * Check if position is valid for movement (in bounds and not blocked)
   */
  isValidMovement(pos: GridPosition): boolean {
    return isValidPosition(this.arena, pos);
  }

  /**
   * Get Manhattan distance between two positions
   */
  getManhattanDistance(from: GridPosition, to: GridPosition): number {
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
  }

  /**
   * Get Euclidean distance between two positions
   */
  getEuclideanDistance(from: GridPosition, to: GridPosition): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate movement cost along a path considering terrain
   */
  calculatePathCost(path: GridPosition[]): number {
    let totalCost = 0;
    for (const pos of path) {
      const cell = this.getCellAt(pos);
      if (cell) {
        totalCost += cell.movementCost;
      }
    }
    return totalCost;
  }

  /**
   * Get all adjacent cells (4-directional)
   */
  getAdjacentPositions(pos: GridPosition): GridPosition[] {
    const directions = [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 }, // East
      { x: 0, y: 1 }, // South
      { x: -1, y: 0 }, // West
    ];

    return directions
      .map((dir) => ({ x: pos.x + dir.x, y: pos.y + dir.y }))
      .filter((p) => this.isInBounds(p) && this.isValidMovement(p));
  }

  /**
   * Get all adjacent cells (8-directional including diagonals)
   */
  getAdjacentPositions8(pos: GridPosition): GridPosition[] {
    const directions = [
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];

    return directions
      .map((dir) => ({ x: pos.x + dir.x, y: pos.y + dir.y }))
      .filter((p) => this.isInBounds(p) && this.isValidMovement(p));
  }

  /**
   * Check line of sight between two positions using Bresenham's algorithm
   */
  hasLineOfSight(from: GridPosition, to: GridPosition): boolean {
    const points = this.getLinePoints(from, to);

    // Check all points along the line (excluding start and end)
    for (let i = 1; i < points.length - 1; i++) {
      const point = points[i];
      if (!point) continue;

      const cell = this.getCellAt(point);
      if (cell && cell.blocksLOS) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all points along a line using Bresenham's algorithm
   */
  private getLinePoints(from: GridPosition, to: GridPosition): GridPosition[] {
    const points: GridPosition[] = [];
    let x0 = from.x;
    let y0 = from.y;
    const x1 = to.x;
    const y1 = to.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      points.push({ x: x0, y: y0 });

      if (x0 === x1 && y0 === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    return points;
  }

  /**
   * Find shortest path using A* algorithm
   */
  findPath(from: GridPosition, to: GridPosition, maxCost: number = Infinity): GridPosition[] | null {
    if (!this.isValidMovement(from) || !this.isValidMovement(to)) {
      return null;
    }

    interface PathNode {
      pos: GridPosition;
      gCost: number; // Cost from start
      hCost: number; // Heuristic cost to end
      fCost: number; // Total cost
      parent: PathNode | null;
    }

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();

    const startNode: PathNode = {
      pos: from,
      gCost: 0,
      hCost: this.getManhattanDistance(from, to),
      fCost: 0,
      parent: null,
    };
    startNode.fCost = startNode.gCost + startNode.hCost;
    openSet.push(startNode);

    const posKey = (p: GridPosition): string => `${p.x},${p.y}`;

    while (openSet.length > 0) {
      // Find node with lowest fCost
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        const node = openSet[i];
        const currentNode = openSet[currentIndex];
        if (node && currentNode && node.fCost < currentNode.fCost) {
          currentIndex = i;
        }
      }

      const current = openSet[currentIndex];
      if (!current) break; // Safety check

      openSet.splice(currentIndex, 1);

      // Check if we reached the goal
      if (current.pos.x === to.x && current.pos.y === to.y) {
        // Reconstruct path
        const path: GridPosition[] = [];
        let node: PathNode | null = current;
        while (node) {
          path.unshift(node.pos);
          node = node.parent;
        }
        return path;
      }

      closedSet.add(posKey(current.pos));

      // Check neighbors
      const neighbors = this.getAdjacentPositions(current.pos);
      for (const neighborPos of neighbors) {
        const key = posKey(neighborPos);
        if (closedSet.has(key)) continue;

        const cell = this.getCellAt(neighborPos);
        if (!cell) continue;

        const gCost = current.gCost + cell.movementCost;
        if (gCost > maxCost) continue;

        // Check if neighbor is already in open set
        const existingNode = openSet.find((n) => n.pos.x === neighborPos.x && n.pos.y === neighborPos.y);

        if (!existingNode) {
          const hCost = this.getManhattanDistance(neighborPos, to);
          openSet.push({
            pos: neighborPos,
            gCost,
            hCost,
            fCost: gCost + hCost,
            parent: current,
          });
        } else if (gCost < existingNode.gCost) {
          // Update with better path
          existingNode.gCost = gCost;
          existingNode.fCost = gCost + existingNode.hCost;
          existingNode.parent = current;
        }
      }
    }

    return null; // No path found
  }

  /**
   * Get all reachable positions within movement range
   */
  getReachablePositions(from: GridPosition, movementRange: number): GridPosition[] {
    const reachable: GridPosition[] = [];
    const visited = new Set<string>();
    const queue: Array<{ pos: GridPosition; cost: number }> = [];

    const posKey = (p: GridPosition): string => `${p.x},${p.y}`;

    queue.push({ pos: from, cost: 0 });
    visited.add(posKey(from));

    while (queue.length > 0) {
      const current = queue.shift()!;
      reachable.push(current.pos);

      const neighbors = this.getAdjacentPositions(current.pos);
      for (const neighborPos of neighbors) {
        const key = posKey(neighborPos);
        if (visited.has(key)) continue;

        const cell = this.getCellAt(neighborPos);
        if (!cell) continue;

        const newCost = current.cost + cell.movementCost;
        if (newCost <= movementRange) {
          queue.push({ pos: neighborPos, cost: newCost });
          visited.add(key);
        }
      }
    }

    return reachable;
  }

  /**
   * Get cover bonus at position
   */
  getCoverBonus(pos: GridPosition): number {
    const cell = this.getCellAt(pos);
    return cell ? cell.coverBonus : 0;
  }

  /**
   * Check if position is in spawn zone
   */
  isInSpawnZone(pos: GridPosition, zone: 'players' | 'enemies'): boolean {
    const spawnPositions = this.arena.spawnZones[zone];
    return spawnPositions.some((spawn) => spawn.x === pos.x && spawn.y === pos.y);
  }

  /**
   * Get all available spawn positions for a zone
   */
  getAvailableSpawns(zone: 'players' | 'enemies', occupiedPositions: GridPosition[] = []): GridPosition[] {
    const spawnPositions = this.arena.spawnZones[zone];
    const occupiedSet = new Set(occupiedPositions.map((p) => `${p.x},${p.y}`));

    return spawnPositions.filter((pos) => !occupiedSet.has(`${pos.x},${pos.y}`));
  }

  /**
   * Get area of effect positions (circle/radius)
   */
  getAoEPositions(center: GridPosition, radius: number): GridPosition[] {
    const positions: GridPosition[] = [];

    for (let y = center.y - radius; y <= center.y + radius; y++) {
      for (let x = center.x - radius; x <= center.x + radius; x++) {
        const pos = { x, y };
        if (this.isInBounds(pos) && this.getEuclideanDistance(center, pos) <= radius) {
          positions.push(pos);
        }
      }
    }

    return positions;
  }
}

/**
 * Create a grid manager for an arena
 */
export function createGridManager(arenaIdOrArena: string | TacticalArena): GridManager {
  return new GridManager(arenaIdOrArena);
}
