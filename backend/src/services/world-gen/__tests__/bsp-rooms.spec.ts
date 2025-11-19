/**
 * BSP Room Generator Tests
 * Verifies room generation and non-overlapping constraints
 */

import { generateBSPLayout } from '../bsp-rooms';

describe('BSP Room Generator', () => {
  describe('Determinism', () => {
    it('should produce identical layouts with same seed', () => {
      const seed = 'bsp-seed-123';
      const rooms1 = generateBSPLayout(40, 40, 4, seed);
      const rooms2 = generateBSPLayout(40, 40, 4, seed);

      expect(rooms1).toEqual(rooms2);
    });

    it('should produce different layouts with different seeds', () => {
      const rooms1 = generateBSPLayout(40, 40, 4, 'seed-a');
      const rooms2 = generateBSPLayout(40, 40, 4, 'seed-b');

      expect(rooms1).not.toEqual(rooms2);
    });
  });

  describe('Room Properties', () => {
    it('should respect minimum room size', () => {
      const minSize = 5;
      const rooms = generateBSPLayout(50, 50, minSize, 'min-size-test');

      for (const room of rooms) {
        expect(room.width).toBeGreaterThanOrEqual(minSize);
        expect(room.height).toBeGreaterThanOrEqual(minSize);
      }
    });

    it('should generate multiple rooms', () => {
      const rooms = generateBSPLayout(60, 60, 4, 'multi-room-test');

      expect(rooms.length).toBeGreaterThan(1);
      expect(rooms.length).toBeLessThan(30); // Reasonable upper bound
    });
  });

  describe('Non-Overlapping Constraint', () => {
    it('should not generate overlapping rooms', () => {
      const rooms = generateBSPLayout(50, 50, 4, 'overlap-test');

      for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
          const room1 = rooms[i];
          const room2 = rooms[j];

          // Check if rectangles overlap
          const overlaps =
            room1.x < room2.x + room2.width &&
            room1.x + room1.width > room2.x &&
            room1.y < room2.y + room2.height &&
            room1.y + room1.height > room2.y;

          expect(overlaps).toBe(false);
        }
      }
    });
  });

  describe('Connectivity', () => {
    it('should add doors to rooms', () => {
      const rooms = generateBSPLayout(40, 40, 4, 'door-test');

      // At least some rooms should have doors
      const roomsWithDoors = rooms.filter((r) => r.doorPositions && r.doorPositions.length > 0);
      expect(roomsWithDoors.length).toBeGreaterThan(0);
    });
  });
});
