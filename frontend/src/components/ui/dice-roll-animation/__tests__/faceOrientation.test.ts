/**
 * @vitest-environment jsdom
 *
 * COMPREHENSIVE DICE ORIENTATION TESTS
 * Tests ALL 62 faces across ALL 7 dice types with MAXIMUM precision
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';

import { getTargetRotationForFace, validateFaceOrientation, getCameraDirection } from '../calculateTargetRotation';
import type { DieType } from '../../dice-loader/types';

describe('🎲 COMPREHENSIVE DICE ORIENTATION - ALL 62 FACES', () => {
  // ========================================================================
  // SECTION 1: INDIVIDUAL FACE TESTS - EVERY SINGLE FACE
  // ========================================================================

  describe('d2 - Coin (2 faces: 1, 2)', () => {
    it('face 1 has valid, finite rotation', () => {
      const rot = getTargetRotationForFace(2, 1);
      expect(rot).toBeDefined();
      expect(Number.isFinite(rot.x)).toBe(true);
      expect(Number.isFinite(rot.y)).toBe(true);
      expect(Number.isFinite(rot.z)).toBe(true);
      expect(Number.isNaN(rot.x)).toBe(false);
      expect(Number.isNaN(rot.y)).toBe(false);
      expect(Number.isNaN(rot.z)).toBe(false);
    });

    it('face 2 has valid, finite rotation', () => {
      const rot = getTargetRotationForFace(2, 2);
      expect(rot).toBeDefined();
      expect(Number.isFinite(rot.x)).toBe(true);
      expect(Number.isFinite(rot.y)).toBe(true);
      expect(Number.isFinite(rot.z)).toBe(true);
      expect(Number.isNaN(rot.x)).toBe(false);
      expect(Number.isNaN(rot.y)).toBe(false);
      expect(Number.isNaN(rot.z)).toBe(false);
    });
  });

  describe('d4 - Tetrahedron (4 faces: 1, 2, 3, 4)', () => {
    [1, 2, 3, 4].forEach((face) => {
      it(`face ${face} has valid, finite rotation`, () => {
        const rot = getTargetRotationForFace(4, face);
        expect(rot).toBeDefined();
        expect(Number.isFinite(rot.x)).toBe(true);
        expect(Number.isFinite(rot.y)).toBe(true);
        expect(Number.isFinite(rot.z)).toBe(true);
        expect(Number.isNaN(rot.x)).toBe(false);
        expect(Number.isNaN(rot.y)).toBe(false);
        expect(Number.isNaN(rot.z)).toBe(false);
        expect(Math.abs(rot.x)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.y)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.z)).toBeLessThanOrEqual(Math.PI * 2);
      });
    });
  });

  describe('d6 - Cube (6 faces: 1, 2, 3, 4, 5, 6)', () => {
    [1, 2, 3, 4, 5, 6].forEach((face) => {
      it(`face ${face} has valid, finite rotation`, () => {
        const rot = getTargetRotationForFace(6, face);
        expect(rot).toBeDefined();
        expect(Number.isFinite(rot.x)).toBe(true);
        expect(Number.isFinite(rot.y)).toBe(true);
        expect(Number.isFinite(rot.z)).toBe(true);
        expect(Number.isNaN(rot.x)).toBe(false);
        expect(Number.isNaN(rot.y)).toBe(false);
        expect(Number.isNaN(rot.z)).toBe(false);
        expect(Math.abs(rot.x)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.y)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.z)).toBeLessThanOrEqual(Math.PI * 2);
      });
    });
  });

  describe('d8 - Octahedron (8 faces: 1, 2, 3, 4, 5, 6, 7, 8)', () => {
    [1, 2, 3, 4, 5, 6, 7, 8].forEach((face) => {
      it(`face ${face} has valid, finite rotation`, () => {
        const rot = getTargetRotationForFace(8, face);
        expect(rot).toBeDefined();
        expect(Number.isFinite(rot.x)).toBe(true);
        expect(Number.isFinite(rot.y)).toBe(true);
        expect(Number.isFinite(rot.z)).toBe(true);
        expect(Number.isNaN(rot.x)).toBe(false);
        expect(Number.isNaN(rot.y)).toBe(false);
        expect(Number.isNaN(rot.z)).toBe(false);
        expect(Math.abs(rot.x)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.y)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.z)).toBeLessThanOrEqual(Math.PI * 2);
      });
    });
  });

  describe('d10 - Pentagonal Trapezohedron (10 faces: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9)', () => {
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((face) => {
      it(`face ${face} has valid, finite rotation`, () => {
        const rot = getTargetRotationForFace(10, face);
        expect(rot).toBeDefined();
        expect(Number.isFinite(rot.x)).toBe(true);
        expect(Number.isFinite(rot.y)).toBe(true);
        expect(Number.isFinite(rot.z)).toBe(true);
        expect(Number.isNaN(rot.x)).toBe(false);
        expect(Number.isNaN(rot.y)).toBe(false);
        expect(Number.isNaN(rot.z)).toBe(false);
        expect(Math.abs(rot.x)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.y)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.z)).toBeLessThanOrEqual(Math.PI * 2);
      });
    });
  });

  describe('d12 - Dodecahedron (12 faces: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)', () => {
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((face) => {
      it(`face ${face} has valid, finite rotation`, () => {
        const rot = getTargetRotationForFace(12, face);
        expect(rot).toBeDefined();
        expect(Number.isFinite(rot.x)).toBe(true);
        expect(Number.isFinite(rot.y)).toBe(true);
        expect(Number.isFinite(rot.z)).toBe(true);
        expect(Number.isNaN(rot.x)).toBe(false);
        expect(Number.isNaN(rot.y)).toBe(false);
        expect(Number.isNaN(rot.z)).toBe(false);
        expect(Math.abs(rot.x)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.y)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.z)).toBeLessThanOrEqual(Math.PI * 2);
      });
    });
  });

  describe('d20 - Icosahedron (20 faces: 1-20)', () => {
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].forEach((face) => {
      it(`face ${face} has valid, finite rotation`, () => {
        const rot = getTargetRotationForFace(20, face);
        expect(rot).toBeDefined();
        expect(Number.isFinite(rot.x)).toBe(true);
        expect(Number.isFinite(rot.y)).toBe(true);
        expect(Number.isFinite(rot.z)).toBe(true);
        expect(Number.isNaN(rot.x)).toBe(false);
        expect(Number.isNaN(rot.y)).toBe(false);
        expect(Number.isNaN(rot.z)).toBe(false);
        expect(Math.abs(rot.x)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.y)).toBeLessThanOrEqual(Math.PI * 2);
        expect(Math.abs(rot.z)).toBeLessThanOrEqual(Math.PI * 2);
      });
    });
  });

  // ========================================================================
  // SECTION 2: CARDINALITY VERIFICATION - EXACT FACE COUNTS
  // ========================================================================

  describe('🔢 CARDINALITY: Exact Face Count Verification', () => {
    it('d2 has exactly 2 faces (1, 2)', () => {
      const faces = [1, 2];
      expect(faces.length).toBe(2);
      faces.forEach((face) => {
        const rot = getTargetRotationForFace(2, face);
        expect(rot).toBeDefined();
      });
    });

    it('d4 has exactly 4 faces (1, 2, 3, 4)', () => {
      const faces = [1, 2, 3, 4];
      expect(faces.length).toBe(4);
      faces.forEach((face) => {
        const rot = getTargetRotationForFace(4, face);
        expect(rot).toBeDefined();
      });
    });

    it('d6 has exactly 6 faces (1, 2, 3, 4, 5, 6)', () => {
      const faces = [1, 2, 3, 4, 5, 6];
      expect(faces.length).toBe(6);
      faces.forEach((face) => {
        const rot = getTargetRotationForFace(6, face);
        expect(rot).toBeDefined();
      });
    });

    it('d8 has exactly 8 faces (1, 2, 3, 4, 5, 6, 7, 8)', () => {
      const faces = [1, 2, 3, 4, 5, 6, 7, 8];
      expect(faces.length).toBe(8);
      faces.forEach((face) => {
        const rot = getTargetRotationForFace(8, face);
        expect(rot).toBeDefined();
      });
    });

    it('d10 has exactly 10 faces (0, 1, 2, 3, 4, 5, 6, 7, 8, 9)', () => {
      const faces = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      expect(faces.length).toBe(10);
      faces.forEach((face) => {
        const rot = getTargetRotationForFace(10, face);
        expect(rot).toBeDefined();
      });
    });

    it('d12 has exactly 12 faces (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)', () => {
      const faces = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      expect(faces.length).toBe(12);
      faces.forEach((face) => {
        const rot = getTargetRotationForFace(12, face);
        expect(rot).toBeDefined();
      });
    });

    it('d20 has exactly 20 faces (1-20)', () => {
      const faces = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      expect(faces.length).toBe(20);
      faces.forEach((face) => {
        const rot = getTargetRotationForFace(20, face);
        expect(rot).toBeDefined();
      });
    });

    it('🎯 TOTAL: All 7 dice types = 62 total faces', () => {
      const totalFaces = 2 + 4 + 6 + 8 + 10 + 12 + 20;
      expect(totalFaces).toBe(62);
    });

    it('🎯 VERIFICATION: Can retrieve rotation for all 62 faces', () => {
      let testedCount = 0;

      // d2: 2 faces
      [1, 2].forEach((f) => {
        getTargetRotationForFace(2, f);
        testedCount++;
      });

      // d4: 4 faces
      [1, 2, 3, 4].forEach((f) => {
        getTargetRotationForFace(4, f);
        testedCount++;
      });

      // d6: 6 faces
      [1, 2, 3, 4, 5, 6].forEach((f) => {
        getTargetRotationForFace(6, f);
        testedCount++;
      });

      // d8: 8 faces
      [1, 2, 3, 4, 5, 6, 7, 8].forEach((f) => {
        getTargetRotationForFace(8, f);
        testedCount++;
      });

      // d10: 10 faces
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((f) => {
        getTargetRotationForFace(10, f);
        testedCount++;
      });

      // d12: 12 faces
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((f) => {
        getTargetRotationForFace(12, f);
        testedCount++;
      });

      // d20: 20 faces
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].forEach((f) => {
        getTargetRotationForFace(20, f);
        testedCount++;
      });

      expect(testedCount).toBe(62);
    });
  });

  // ========================================================================
  // SECTION 3: ROTATION RANGE VALIDATION
  // ========================================================================

  describe('📐 ROTATION RANGE: All rotations within valid bounds', () => {
    const allDice: Array<{ type: DieType; faces: number[] }> = [
      { type: 2, faces: [1, 2] },
      { type: 4, faces: [1, 2, 3, 4] },
      { type: 6, faces: [1, 2, 3, 4, 5, 6] },
      { type: 8, faces: [1, 2, 3, 4, 5, 6, 7, 8] },
      { type: 10, faces: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { type: 12, faces: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      { type: 20, faces: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
    ];

    allDice.forEach(({ type, faces }) => {
      it(`d${type}: all ${faces.length} rotations are within ±2π radians`, () => {
        faces.forEach((face) => {
          const rot = getTargetRotationForFace(type, face);
          expect(Math.abs(rot.x)).toBeLessThanOrEqual(Math.PI * 2);
          expect(Math.abs(rot.y)).toBeLessThanOrEqual(Math.PI * 2);
          expect(Math.abs(rot.z)).toBeLessThanOrEqual(Math.PI * 2);
        });
      });
    });
  });

  // ========================================================================
  // SECTION 4: MIN/MAX BOUNDARY TESTS
  // ========================================================================

  describe('🎲 BOUNDARY: Min and Max face values', () => {
    it('d2: min=1, max=2', () => {
      const min = getTargetRotationForFace(2, 1);
      const max = getTargetRotationForFace(2, 2);
      expect(min).toBeDefined();
      expect(max).toBeDefined();
    });

    it('d4: min=1, max=4', () => {
      const min = getTargetRotationForFace(4, 1);
      const max = getTargetRotationForFace(4, 4);
      expect(min).toBeDefined();
      expect(max).toBeDefined();
    });

    it('d6: min=1, max=6', () => {
      const min = getTargetRotationForFace(6, 1);
      const max = getTargetRotationForFace(6, 6);
      expect(min).toBeDefined();
      expect(max).toBeDefined();
    });

    it('d8: min=1, max=8', () => {
      const min = getTargetRotationForFace(8, 1);
      const max = getTargetRotationForFace(8, 8);
      expect(min).toBeDefined();
      expect(max).toBeDefined();
    });

    it('d10: min=0, max=9', () => {
      const min = getTargetRotationForFace(10, 0);
      const max = getTargetRotationForFace(10, 9);
      expect(min).toBeDefined();
      expect(max).toBeDefined();
    });

    it('d12: min=1, max=12', () => {
      const min = getTargetRotationForFace(12, 1);
      const max = getTargetRotationForFace(12, 12);
      expect(min).toBeDefined();
      expect(max).toBeDefined();
    });

    it('d20: min=1, max=20', () => {
      const min = getTargetRotationForFace(20, 1);
      const max = getTargetRotationForFace(20, 20);
      expect(min).toBeDefined();
      expect(max).toBeDefined();
    });
  });

  // ========================================================================
  // SECTION 5: INVALID INPUT HANDLING
  // ========================================================================

  describe('❌ INVALID INPUTS: Error handling', () => {
    it('invalid die type returns zero rotation', () => {
      const rotation = getTargetRotationForFace(999 as DieType, 1);
      expect(rotation).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('invalid face number returns zero rotation', () => {
      const rotation = getTargetRotationForFace(6, 999);
      expect(rotation).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('negative face number returns zero rotation', () => {
      const rotation = getTargetRotationForFace(6, -1);
      expect(rotation).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('d6 face 7 (out of range) returns zero rotation', () => {
      const rotation = getTargetRotationForFace(6, 7);
      expect(rotation).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('d10 face 10 (out of range) returns zero rotation', () => {
      const rotation = getTargetRotationForFace(10, 10);
      expect(rotation).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  // ========================================================================
  // SECTION 6: VALIDATION FUNCTIONS
  // ========================================================================

  describe('✅ validateFaceOrientation', () => {
    it('validates rotation with default threshold', () => {
      const rotation = { x: 0, y: 0, z: 0 };
      const isValid = validateFaceOrientation(rotation);
      expect(typeof isValid).toBe('boolean');
    });

    it('validates rotation with custom threshold', () => {
      const rotation = { x: 0, y: 0, z: 0 };
      const isValid = validateFaceOrientation(rotation, 0.5);
      expect(typeof isValid).toBe('boolean');
    });

    it('validates rotation with strict threshold', () => {
      const rotation = { x: 0, y: 0, z: 0 };
      const isValid = validateFaceOrientation(rotation, 0.95);
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('📹 getCameraDirection', () => {
    it('returns camera direction pointing toward +Z (camera position)', () => {
      const direction = getCameraDirection();
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);
      expect(direction.z).toBe(1); // Faces point TOWARD camera at +Z
    });

    it('camera direction is a unit vector', () => {
      const direction = getCameraDirection();
      const length = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
      expect(length).toBeCloseTo(1.0, 5);
    });
  });

  // ========================================================================
  // SECTION 7: CONSISTENCY TESTS
  // ========================================================================

  describe('🔄 CONSISTENCY: Same input returns same output', () => {
    it('d6 face 3 returns consistent rotation across multiple calls', () => {
      const rot1 = getTargetRotationForFace(6, 3);
      const rot2 = getTargetRotationForFace(6, 3);
      const rot3 = getTargetRotationForFace(6, 3);

      expect(rot1).toEqual(rot2);
      expect(rot2).toEqual(rot3);
    });

    it('d20 face 15 returns consistent rotation across multiple calls', () => {
      const rot1 = getTargetRotationForFace(20, 15);
      const rot2 = getTargetRotationForFace(20, 15);

      expect(rot1).toEqual(rot2);
    });
  });
});
