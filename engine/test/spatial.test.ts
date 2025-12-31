import { describe, it, expect } from 'vitest';
import { findPath, hasLineOfSight } from '../src/rules/spatial';
import { Point3D } from '../src/utils/geometry';

describe('Spatial Engine: SOTA Coverage', () => {
  // Simple 10x10 grid mock
  // 0 = Empty, 1 = Wall
  const grid: number[][] = [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0], // Wall at y=1, x=1..3
    [0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];

  const isBlocked = (p: Point3D): boolean => {
    // Bounds check
    if (p.x < 0 || p.x >= 5 || p.y < 0 || p.y >= 5) return true;
    // Wall check
    return grid[p.y][p.x] === 1;
  };

  describe('Line of Sight (Raycast)', () => {
    it('Has LOS on clear straight path', () => {
      const start = { x: 0, y: 0, z: 0 };
      const end = { x: 4, y: 0, z: 0 }; // Top row clear
      expect(hasLineOfSight(start, end, isBlocked)).toBe(true);
    });

    it('Does NOT have LOS through wall', () => {
      const start = { x: 2, y: 0, z: 0 }; // Behind wall (0,1 is clear, 1,1 is wall)
      // Wait, wall is at y=1.
      // Start (2,0). End (2,2). Wall at (2,1).
      const end = { x: 2, y: 4, z: 0 };
      expect(hasLineOfSight(start, end, isBlocked)).toBe(false);
    });

    it('Has LOS diagonally if clear', () => {
      const start = { x: 0, y: 2, z: 0 };
      const end = { x: 2, y: 0, z: 0 };
      // (0,2)->(1,1)[Wall]->(2,0).
      // Wait, (1,1) is wall. Diagonal might clip.
      // Bresenham usually hits (1,1) if perfect diagonal.
      expect(hasLineOfSight(start, end, isBlocked)).toBe(false);
    });

    it('Has LOS around corners (grazing?)', () => {
      // (0,0) to (0,2). Y=1, X=0 is clear.
      expect(hasLineOfSight({ x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 0 }, isBlocked)).toBe(true);
    });
  });

  describe('Pathfinding (A*)', () => {
    it('Finds straight path', () => {
      const start = { x: 0, y: 0, z: 0 };
      const end = { x: 4, y: 0, z: 0 };
      const path = findPath(start, end, isBlocked);
      expect(path.length).toBe(5); // 0,1,2,3,4
      expect(path[4]).toEqual(end);
    });

    it('Finds path around wall', () => {
      // Start (2,0) -> End (2,2). Wall at (2,1).
      // Path must go around.
      const start = { x: 2, y: 0, z: 0 };
      const end = { x: 2, y: 2, z: 0 };
      const path = findPath(start, end, isBlocked);

      expect(path.length).toBeGreaterThan(0);
      expect(path[path.length - 1]).toEqual(end);

      // Should NOT contain (2,1)
      const hitWall = path.some((p) => p.x === 2 && p.y === 1);
      expect(hitWall).toBe(false);
    });

    it('Returns empty if no path', () => {
      // Surround (0,0) with walls in mock? Or just valid target checks?
      // Let's force a target inside a wall (invalid) or unreachable.
      const start = { x: 0, y: 0, z: 0 };
      const end = { x: 1, y: 1, z: 0 }; // Inside wall
      // If end is blocked, A* usually fails or returns partial?
      // My implementation checks "isBlocked(neighbor)". If End is blocked, it won't add End to open set.
      const path = findPath(start, end, isBlocked);
      expect(path).toEqual([]);
    });
  });
});
