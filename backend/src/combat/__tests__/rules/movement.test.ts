import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  calculateDistance,
  isValidPosition,
  isPositionOccupied,
  validateMovement,
  findReachableSquares,
  isWithinReach,
} from '../../rules/movement';
import type { CombatCharacter } from '@/graph/state';

describe('Movement Rules', () => {
  let character: CombatCharacter;
  let characters: CombatCharacter[];

  beforeEach(() => {
    character = {
      id: 'char-1',
      name: 'Fighter',
      hp: 50,
      maxHp: 50,
      tempHp: 0,
      armorClass: 16,
      position: { x: 5, y: 5 },
      initiative: 15,
      avatar: '',
      isPlayer: true,
      strength: 16,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      proficiencyBonus: 2,
      speed: 6,
      reach: 1,
      hasMoved: false,
      hasActed: false,
      hasReaction: true,
      hasBonusAction: true,
      movementRemaining: 6,
      conditions: [],
    };

    characters = [
      character,
      {
        ...character,
        id: 'char-2',
        name: 'Goblin',
        position: { x: 7, y: 7 },
        isPlayer: false,
      },
    ];
  });

  describe('calculateDistance', () => {
    it('should calculate Chebyshev distance', () => {
      expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(4);
      expect(calculateDistance({ x: 0, y: 0 }, { x: 5, y: 5 })).toBe(5);
      expect(calculateDistance({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(0);
    });

    it('should handle diagonal movement correctly', () => {
      expect(calculateDistance({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(1);
      expect(calculateDistance({ x: 0, y: 0 }, { x: 2, y: 2 })).toBe(2);
    });
  });

  describe('isValidPosition', () => {
    it('should validate positions within grid', () => {
      expect(isValidPosition({ x: 0, y: 0 }, 10, 10)).toBe(true);
      expect(isValidPosition({ x: 9, y: 9 }, 10, 10)).toBe(true);
      expect(isValidPosition({ x: 5, y: 5 }, 10, 10)).toBe(true);
    });

    it('should reject positions outside grid', () => {
      expect(isValidPosition({ x: -1, y: 0 }, 10, 10)).toBe(false);
      expect(isValidPosition({ x: 0, y: -1 }, 10, 10)).toBe(false);
      expect(isValidPosition({ x: 10, y: 0 }, 10, 10)).toBe(false);
      expect(isValidPosition({ x: 0, y: 10 }, 10, 10)).toBe(false);
    });
  });

  describe('isPositionOccupied', () => {
    it('should detect occupied positions', () => {
      expect(isPositionOccupied({ x: 5, y: 5 }, characters)).toBe(true);
      expect(isPositionOccupied({ x: 7, y: 7 }, characters)).toBe(true);
    });

    it('should allow exclusion of specific character', () => {
      expect(isPositionOccupied({ x: 5, y: 5 }, characters, 'char-1')).toBe(false);
      expect(isPositionOccupied({ x: 7, y: 7 }, characters, 'char-2')).toBe(false);
    });

    it('should return false for empty positions', () => {
      expect(isPositionOccupied({ x: 0, y: 0 }, characters)).toBe(false);
      expect(isPositionOccupied({ x: 9, y: 9 }, characters)).toBe(false);
    });
  });

  describe('validateMovement', () => {
    it('should validate valid movement', () => {
      const result = validateMovement({
        character,
        fromPosition: { x: 5, y: 5 },
        toPosition: { x: 6, y: 6 },
        characters,
        gridWidth: 10,
        gridHeight: 10,
      });

      expect(result.isValid).toBe(true);
      expect(result.movementCost).toBe(1);
    });

    it('should reject movement to occupied square', () => {
      const result = validateMovement({
        character,
        fromPosition: { x: 5, y: 5 },
        toPosition: { x: 7, y: 7 }, // Occupied by char-2
        characters,
        gridWidth: 10,
        gridHeight: 10,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('occupied');
    });

    it('should reject movement outside grid', () => {
      const result = validateMovement({
        character,
        fromPosition: { x: 5, y: 5 },
        toPosition: { x: 15, y: 15 },
        characters,
        gridWidth: 10,
        gridHeight: 10,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('outside grid');
    });

    it('should reject movement exceeding remaining movement', () => {
      const slowChar = { ...character, movementRemaining: 1 };
      const result = validateMovement({
        character: slowChar,
        fromPosition: { x: 5, y: 5 },
        toPosition: { x: 8, y: 8 }, // Distance 3
        characters,
        gridWidth: 10,
        gridHeight: 10,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Insufficient movement');
    });
  });

  describe('findReachableSquares', () => {
    it('should find all squares within movement range', () => {
      const reachable = findReachableSquares({ x: 5, y: 5 }, 2, characters, 10, 10, 'char-1', []);

      expect(reachable.length).toBeGreaterThan(0);

      // All reachable squares should be within distance 2
      reachable.forEach((pos) => {
        const distance = calculateDistance({ x: 5, y: 5 }, pos);
        expect(distance).toBeLessThanOrEqual(2);
      });
    });

    it('should not include occupied squares', () => {
      const reachable = findReachableSquares({ x: 5, y: 5 }, 6, characters, 10, 10, 'char-1', []);

      // Position (7, 7) is occupied by char-2
      const hasOccupied = reachable.some((pos) => pos.x === 7 && pos.y === 7);
      expect(hasOccupied).toBe(false);
    });
  });

  describe('isWithinReach', () => {
    it('should check melee reach', () => {
      expect(isWithinReach({ x: 0, y: 0 }, { x: 1, y: 0 }, 1)).toBe(true);
      expect(isWithinReach({ x: 0, y: 0 }, { x: 1, y: 1 }, 1)).toBe(true);
      expect(isWithinReach({ x: 0, y: 0 }, { x: 2, y: 0 }, 1)).toBe(false);
    });

    it('should handle extended reach', () => {
      expect(isWithinReach({ x: 0, y: 0 }, { x: 2, y: 2 }, 2)).toBe(true);
      expect(isWithinReach({ x: 0, y: 0 }, { x: 3, y: 0 }, 2)).toBe(false);
    });
  });
});
