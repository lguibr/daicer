import { findPath, calculatePathLength } from './pathfinding';
import { describe, it, expect } from 'vitest';

describe('pathfinding', () => {
  const mockGetTile = (map: string[]) => (x: number, y: number, z: number) => {
    // Basic ASCII map parser if needed, or just coordinate check
    // y is row, x is col
    if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return null;
    const char = map[y][x];
    if (char === '#') return { isWalkable: false }; // Wall
    return { isWalkable: true };
  };

  it('finds a simple path', () => {
    const map = ['.....', '.....', '.....'];
    const path = findPath({ x: 0, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, mockGetTile(map));
    expect(path).not.toBeNull();
    expect(path?.length).toBeGreaterThan(0);
    expect(path?.[path.length - 1]).toEqual(expect.objectContaining({ x: 4, y: 0 }));
  });

  it('navigates around walls', () => {
    const map = ['.....', '###..', '.....'];
    // Start (0,0) -> End (0, 2) (bottom left)
    // Wall at y=1
    const path = findPath({ x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 0 }, mockGetTile(map));
    expect(path).not.toBeNull();
    // It should go around the wall at x=0,1,2
    // Path should have y=2 eventually
    const points = path?.map((p) => `${p.x},${p.y}`);
    expect(points).toContain('3,1'); // Must go wide around ### (positions 0,1,2 are blocked) OR similar
  });

  it('returns null if unreachable', () => {
    const map = ['.....', '#####', '.....'];
    const path = findPath({ x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 0 }, mockGetTile(map));
    expect(path).toBeNull();
  });

  it('calculates correct cost (diagonal vs cardinal)', () => {
    const map = ['...'];
    const path = findPath({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, mockGetTile(map));
    // Cardinal move cost 1
    expect(calculatePathLength(path!)).toBeCloseTo(1);

    const pathDiag = findPath({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }, mockGetTile(['..', '..']));
    // Diagonal move cost 1.414
    expect(calculatePathLength(pathDiag!)).toBeCloseTo(1.414);
  });
});
