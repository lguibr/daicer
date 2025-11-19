/**
 * @file backend/src/combat/__tests__/spell-targeting.test.ts
 * @description Tests for CORE spell targeting grid calculations
 */

import { describe, it, expect } from '@jest/globals';
import {
  feetToSquares,
  getManhattanDistance,
  getEuclideanDistance,
  getChebyshevDistance,
  calculateConeArea,
  calculateLineArea,
  calculateSphereArea,
  calculateCylinderArea,
  calculateCubeArea,
  calculateWallArea,
  calculateSelfAuraArea,
  calculateMeleeTouchArea,
  calculateProjectilePath,
  calculateAffectedSquares,
  canCauseFriendlyFire,
  requiresLineOfSight,
  hasLineOfSight,
} from '../spell-targeting';
import { SpellEffectShape } from '../../types/spells';
import type { GridPosition, EffectDimensions } from '../../types/spells';

describe('Spell Targeting - Core Combat Calculations', () => {
  describe('Distance Calculations', () => {
    it('converts feet to grid squares correctly', () => {
      expect(feetToSquares(5)).toBe(1);
      expect(feetToSquares(10)).toBe(2);
      expect(feetToSquares(15)).toBe(3);
      expect(feetToSquares(20)).toBe(4);
      expect(feetToSquares(30)).toBe(6);
      expect(feetToSquares(7)).toBe(1); // Rounds down
    });

    it('calculates Manhattan distance', () => {
      expect(getManhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
      expect(getManhattanDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
      expect(getManhattanDistance({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10);
    });

    it('calculates Euclidean distance', () => {
      expect(getEuclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(getEuclideanDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    });

    it('calculates Chebyshev distance', () => {
      expect(getChebyshevDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(4);
      expect(getChebyshevDistance({ x: 5, y: 5 }, { x: 8, y: 7 })).toBe(3);
      expect(getChebyshevDistance({ x: 0, y: 0 }, { x: 5, y: 5 })).toBe(5);
    });
  });

  describe('CONE - Spell Shape', () => {
    it('calculates cone area spreading from caster', () => {
      const origin = { x: 5, y: 5 };
      const direction = { x: 1, y: 0 }; // East
      const length = 15; // 15 feet = 3 squares

      const affected = calculateConeArea(origin, direction, length);

      expect(affected.length).toBeGreaterThan(0);
      // Cone should spread wider as it extends
      expect(affected.some((p) => p.x === 6 && p.y === 5)).toBe(true);
      expect(affected.some((p) => p.x === 7)).toBe(true);
    });

    it('calculates cone in different directions', () => {
      const origin = { x: 5, y: 5 };

      // North
      const north = calculateConeArea(origin, { x: 0, y: -1 }, 15);
      expect(north.length).toBeGreaterThan(0);
      expect(north.some((p) => p.y < 5)).toBe(true);

      // Diagonal NE
      const ne = calculateConeArea(origin, { x: 1, y: -1 }, 15);
      expect(ne.length).toBeGreaterThan(0);
    });

    it('handles 30-foot cone (Burning Hands)', () => {
      const affected = calculateConeArea({ x: 5, y: 5 }, { x: 1, y: 0 }, 30);
      expect(affected.length).toBeGreaterThan(6); // Should affect multiple squares
    });
  });

  describe('LINE - Spell Shape', () => {
    it('calculates straight line area', () => {
      const start = { x: 0, y: 5 };
      const end = { x: 10, y: 5 };
      const length = 50; // 10 squares

      const affected = calculateLineArea(start, end, length, 5);

      expect(affected.length).toBeGreaterThan(0);
      // Should create line along y=5
      expect(affected.some((p) => p.y === 5)).toBe(true);
    });

    it('calculates diagonal line', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 5, y: 5 };

      const affected = calculateLineArea(start, end, 35, 5);

      expect(affected.length).toBeGreaterThan(0);
      // Should include diagonal squares
    });

    it('handles wide lines (10ft wide)', () => {
      const affected = calculateLineArea({ x: 5, y: 5 }, { x: 15, y: 5 }, 50, 10);

      // 10ft wide = 2 squares, should hit y=4,5,6
      expect(affected.length).toBeGreaterThan(10);
    });

    it('calculates Lightning Bolt (100ft line, 5ft wide)', () => {
      const affected = calculateLineArea({ x: 5, y: 5 }, { x: 25, y: 5 }, 100, 5);
      expect(affected.length).toBeGreaterThan(15);
    });
  });

  describe('SPHERE - Spell Shape', () => {
    it('calculates sphere/radius area', () => {
      const center = { x: 5, y: 5 };
      const radius = 20; // 20 feet = 4 squares

      const affected = calculateSphereArea(center, radius, 20, 20);

      expect(affected.length).toBeGreaterThan(10);
      // Center should be included
      expect(affected.some((p) => p.x === 5 && p.y === 5)).toBe(true);

      // Squares at radius edge
      expect(affected.some((p) => p.x === 9 && p.y === 5)).toBe(true);
    });

    it('calculates Fireball (20ft radius)', () => {
      const affected = calculateSphereArea({ x: 10, y: 10 }, 20, 30, 30);

      // 20ft radius = 4 squares, area ≈ π * 4² ≈ 50 squares
      expect(affected.length).toBeGreaterThan(30);
      expect(affected.length).toBeLessThan(60);
    });

    it('respects grid boundaries', () => {
      const affected = calculateSphereArea({ x: 0, y: 0 }, 20, 10, 10);

      // Should not include negative coordinates
      expect(affected.every((p) => p.x >= 0 && p.y >= 0)).toBe(true);
      expect(affected.every((p) => p.x < 10 && p.y < 10)).toBe(true);
    });
  });

  describe('CUBE - Spell Shape', () => {
    it('calculates cube area from corner', () => {
      const corner = { x: 5, y: 5 };
      const size = 20; // 20ft = 4x4 squares

      const affected = calculateCubeArea(corner, size, false);

      expect(affected.length).toBe(16); // 4x4 = 16 squares
      expect(affected.some((p) => p.x === 5 && p.y === 5)).toBe(true);
      expect(affected.some((p) => p.x === 8 && p.y === 8)).toBe(true);
    });

    it('calculates cube area from center', () => {
      const center = { x: 5, y: 5 };
      const size = 10; // 10ft = 2x2 squares

      const affected = calculateCubeArea(center, size, true);

      expect(affected.length).toBe(4); // 2x2 = 4 squares
      // Should be centered around 5,5
    });

    it('calculates Thunderwave (15ft cube)', () => {
      const affected = calculateCubeArea({ x: 5, y: 5 }, 15, false);
      expect(affected.length).toBe(9); // 3x3 = 9 squares
    });
  });

  describe('CYLINDER - Spell Shape', () => {
    it('calculates cylinder area (2D projection)', () => {
      const center = { x: 10, y: 10 };
      const radius = 20;
      const height = 20; // Height matters for 3D but not 2D grid

      const affected = calculateCylinderArea(center, radius, height, 30, 30);

      // Same as sphere in 2D
      expect(affected.length).toBeGreaterThan(30);
      expect(affected.some((p) => p.x === 10 && p.y === 10)).toBe(true);
    });
  });

  describe('MELEE_TOUCH - Spell Shape', () => {
    it('calculates adjacent squares for touch spells', () => {
      const caster = { x: 5, y: 5 };

      const affected = calculateMeleeTouchArea(caster, 5);

      expect(affected.length).toBe(8); // 8 adjacent squares (including diagonals)
      expect(affected.some((p) => p.x === 4 && p.y === 5)).toBe(true); // West
      expect(affected.some((p) => p.x === 6 && p.y === 5)).toBe(true); // East
      expect(affected.some((p) => p.x === 5 && p.y === 4)).toBe(true); // North
      expect(affected.some((p) => p.x === 5 && p.y === 6)).toBe(true); // South
      expect(affected.some((p) => p.x === 4 && p.y === 4)).toBe(true); // NW

      // Should not include caster's own square
      expect(affected.some((p) => p.x === 5 && p.y === 5)).toBe(false);
    });

    it('handles 10ft reach', () => {
      const affected = calculateMeleeTouchArea({ x: 5, y: 5 }, 10);

      // 10ft = 2 squares, should reach further
      expect(affected.length).toBeGreaterThan(8);
    });
  });

  describe('PROJECTILE_STRAIGHT - Spell Shape', () => {
    it('calculates ray path to target', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 5, y: 0 };

      const affected = calculateProjectilePath(start, end, 50);

      expect(affected.length).toBeGreaterThan(0);
      expect(affected[affected.length - 1]).toEqual(end);
    });

    it('respects maximum range', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 20, y: 0 }; // 20 squares = 100ft

      const affected = calculateProjectilePath(start, end, 50); // Only 50ft range

      expect(affected.length).toBe(0); // Out of range
    });

    it('creates path through obstacles', () => {
      const path = calculateProjectilePath({ x: 0, y: 5 }, { x: 10, y: 5 }, 100);

      // Should create continuous path
      expect(path.length).toBeGreaterThan(5);
      // Should end at or near target
      const lastSquare = path[path.length - 1];
      if (lastSquare) {
        expect(lastSquare.x).toBeGreaterThanOrEqual(9);
      }
    });
  });

  describe('SELF_AURA - Spell Shape', () => {
    it('calculates aura around caster', () => {
      const caster = { x: 10, y: 10 };
      const affected = calculateSelfAuraArea(caster, 10, 30, 30); // 10ft radius

      expect(affected.length).toBeGreaterThan(5);
      // Caster square included
      expect(affected.some((p) => p.x === 10 && p.y === 10)).toBe(true);
      // Squares within 2 grid squares (10ft)
      expect(affected.some((p) => p.x === 12 && p.y === 10)).toBe(true);
    });
  });

  describe('WALL - Spell Shape', () => {
    it('calculates wall along multiple points', () => {
      const points: GridPosition[] = [
        { x: 5, y: 5 },
        { x: 5, y: 10 },
        { x: 10, y: 10 },
      ];

      const affected = calculateWallArea(points, 5);

      expect(affected.length).toBeGreaterThan(10);
      // Should include all points
      expect(affected.some((p) => p.x === 5 && p.y === 5)).toBe(true);
      expect(affected.some((p) => p.x === 10 && p.y === 10)).toBe(true);
    });

    it('handles thick walls', () => {
      const points: GridPosition[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ];

      const thin = calculateWallArea(points, 5);
      const thick = calculateWallArea(points, 10);

      expect(thick.length).toBeGreaterThan(thin.length);
    });
  });

  describe('Line of Sight', () => {
    it('checks clear line of sight', () => {
      const from = { x: 0, y: 0 };
      const to = { x: 5, y: 0 };
      const blocked: GridPosition[] = [];

      expect(hasLineOfSight(from, to, blocked)).toBe(true);
    });

    it('detects blocked line of sight', () => {
      const from = { x: 0, y: 0 };
      const to = { x: 5, y: 0 };
      const blocked: GridPosition[] = [{ x: 2, y: 0 }];

      expect(hasLineOfSight(from, to, blocked)).toBe(false);
    });

    it('allows LOS that does not cross obstacles', () => {
      const from = { x: 0, y: 0 };
      const to = { x: 5, y: 5 };
      const blocked: GridPosition[] = [{ x: 3, y: 0 }]; // Not in path

      expect(hasLineOfSight(from, to, blocked)).toBe(true);
    });
  });

  describe('calculateAffectedSquares - Integration', () => {
    const gridWidth = 20;
    const gridHeight = 20;
    const caster = { x: 10, y: 10 };

    it('handles SELF_ONLY spells', () => {
      const affected = calculateAffectedSquares(SpellEffectShape.SELF_ONLY, {}, caster, caster, gridWidth, gridHeight);

      expect(affected).toEqual([caster]);
    });

    it('handles MELEE_TOUCH spells', () => {
      const target = { x: 11, y: 10 };
      const affected = calculateAffectedSquares(
        SpellEffectShape.MELEE_TOUCH,
        {},
        caster,
        target,
        gridWidth,
        gridHeight
      );

      expect(affected).toEqual([target]);
    });

    it('handles RANGED_SINGLE spells', () => {
      const target = { x: 15, y: 15 };
      const affected = calculateAffectedSquares(
        SpellEffectShape.RANGED_SINGLE,
        {},
        caster,
        target,
        gridWidth,
        gridHeight
      );

      expect(affected).toEqual([target]);
    });

    it('handles CONE spells with dimensions', () => {
      const dimensions: EffectDimensions = { length: 15 };
      const target = { x: 15, y: 10 }; // Direction

      const affected = calculateAffectedSquares(
        SpellEffectShape.CONE,
        dimensions,
        caster,
        target,
        gridWidth,
        gridHeight
      );

      expect(affected.length).toBeGreaterThan(3);
    });

    it('handles SPHERE spells (Fireball)', () => {
      const dimensions: EffectDimensions = { radius: 20 };
      const target = { x: 15, y: 15 };

      const affected = calculateAffectedSquares(
        SpellEffectShape.SPHERE,
        dimensions,
        caster,
        target,
        gridWidth,
        gridHeight
      );

      expect(affected.length).toBeGreaterThan(20);
      // Target point should be in area
      expect(affected.some((p) => p.x === 15 && p.y === 15)).toBe(true);
    });

    it('handles LINE spells (Lightning Bolt)', () => {
      const dimensions: EffectDimensions = { lineLength: 100, lineWidth: 5 };
      const target = { x: 19, y: 10 }; // East

      const affected = calculateAffectedSquares(
        SpellEffectShape.LINE,
        dimensions,
        caster,
        target,
        gridWidth,
        gridHeight
      );

      expect(affected.length).toBeGreaterThan(10);
    });

    it('handles CUBE spells', () => {
      const dimensions: EffectDimensions = { size: 20 };
      const target = { x: 15, y: 15 };

      const affected = calculateAffectedSquares(
        SpellEffectShape.CUBE,
        dimensions,
        caster,
        target,
        gridWidth,
        gridHeight
      );

      expect(affected.length).toBe(16); // 4x4 = 16 squares
    });

    it('handles SELF_AURA spells', () => {
      const dimensions: EffectDimensions = { radius: 10 };

      const affected = calculateAffectedSquares(
        SpellEffectShape.SELF_AURA,
        dimensions,
        caster,
        caster,
        gridWidth,
        gridHeight
      );

      expect(affected.length).toBeGreaterThan(5);
      expect(affected.some((p) => p.x === 10 && p.y === 10)).toBe(true);
    });

    it('returns empty for missing dimensions', () => {
      const affected = calculateAffectedSquares(
        SpellEffectShape.CONE,
        {}, // No length
        caster,
        { x: 15, y: 10 },
        gridWidth,
        gridHeight
      );

      expect(affected.length).toBe(0);
    });
  });

  describe('Friendly Fire Detection', () => {
    it('identifies single-target spells as no friendly fire', () => {
      expect(canCauseFriendlyFire(SpellEffectShape.MELEE_TOUCH)).toBe(false);
      expect(canCauseFriendlyFire(SpellEffectShape.RANGED_SINGLE)).toBe(false);
      expect(canCauseFriendlyFire(SpellEffectShape.PROJECTILE_STRAIGHT)).toBe(false);
      expect(canCauseFriendlyFire(SpellEffectShape.SELF_ONLY)).toBe(false);
    });

    it('identifies area effects as friendly fire risk', () => {
      expect(canCauseFriendlyFire(SpellEffectShape.CONE)).toBe(true);
      expect(canCauseFriendlyFire(SpellEffectShape.LINE)).toBe(true);
      expect(canCauseFriendlyFire(SpellEffectShape.SPHERE)).toBe(true);
      expect(canCauseFriendlyFire(SpellEffectShape.CUBE)).toBe(true);
      expect(canCauseFriendlyFire(SpellEffectShape.CYLINDER)).toBe(true);
      expect(canCauseFriendlyFire(SpellEffectShape.SELF_AURA)).toBe(true);
    });
  });

  describe('Line of Sight Requirements', () => {
    it('identifies spells that require LOS', () => {
      expect(requiresLineOfSight(SpellEffectShape.PROJECTILE_STRAIGHT)).toBe(true);
      expect(requiresLineOfSight(SpellEffectShape.CONE)).toBe(true);
      expect(requiresLineOfSight(SpellEffectShape.LINE)).toBe(true);
      expect(requiresLineOfSight(SpellEffectShape.RANGED_SINGLE)).toBe(true);
    });

    it('identifies self-cast spells as no LOS needed', () => {
      expect(requiresLineOfSight(SpellEffectShape.SELF_ONLY)).toBe(false);
      expect(requiresLineOfSight(SpellEffectShape.SELF_AURA)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero-radius sphere', () => {
      const affected = calculateSphereArea({ x: 5, y: 5 }, 0, 10, 10);
      expect(affected.length).toBeGreaterThan(0); // Should at least include center
    });

    it('handles caster at grid edge', () => {
      const affected = calculateConeArea({ x: 0, y: 0 }, { x: 1, y: 1 }, 15);
      expect(affected.length).toBeGreaterThan(0);
      expect(affected.every((p) => p.x >= 0 && p.y >= 0)).toBe(true);
    });

    it('handles same start and end for line', () => {
      const pos = { x: 5, y: 5 };
      const affected = calculateLineArea(pos, pos, 50, 5);

      // Should handle gracefully (may return just origin or empty)
      expect(affected).toBeDefined();
    });

    it('handles very large effect areas', () => {
      const affected = calculateSphereArea({ x: 50, y: 50 }, 60, 100, 100); // 60ft radius

      // Should calculate but be large
      expect(affected.length).toBeGreaterThan(100);
      expect(affected.length).toBeLessThan(500); // Sanity check
    });
  });
});
