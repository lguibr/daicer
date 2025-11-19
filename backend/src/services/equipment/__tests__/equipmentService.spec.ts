/**
 * Equipment Service Tests
 * Tests for equipment stat calculations, inventory management, and transactions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getItemByIndex, getAllEquipment, calculateStatModifiers, convertToGold } from '../equipmentService';
import type { EquippedItems } from '@/types/equipment';
import { mockEquipmentData } from '../../../../test/fixtures/equipment-fixtures';

// Mock the equipment data loading
jest.mock('../equipmentService', () => {
  const actual = jest.requireActual('../equipmentService');
  return {
    ...actual,
    loadEquipmentData: jest.fn(() => mockEquipmentData),
  };
});

describe('Equipment Service', () => {
  describe('getItemByIndex', () => {
    it('should return equipment item by index', () => {
      const longsword = getItemByIndex('longsword');
      expect(longsword).toBeDefined();
      expect(longsword?.name).toBe('Longsword');
      expect(longsword?.equipmentCategory).toBe('Weapon');
    });

    it('should return null for nonexistent item', () => {
      const result = getItemByIndex('nonexistent-item');
      expect(result).toBeNull();
    });

    it('should handle case-sensitive lookups', () => {
      const item = getItemByIndex('longsword');
      expect(item).toBeDefined();

      const wrongCase = getItemByIndex('LongSword');
      expect(wrongCase).toBeNull();
    });
  });

  describe('getAllEquipment', () => {
    it('should return all equipment items', () => {
      const items = getAllEquipment();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should include weapons, armor, and gear', () => {
      const items = getAllEquipment();
      const hasWeapon = items.some((item) => item.equipmentCategory === 'Weapon');
      const hasArmor = items.some((item) => item.equipmentCategory === 'Armor');
      const hasGear = items.some((item) => item.equipmentCategory === 'Adventuring Gear');

      expect(hasWeapon).toBe(true);
      expect(hasArmor).toBe(true);
      expect(hasGear).toBe(true);
    });
  });

  describe('calculateStatModifiers', () => {
    it('should return stat modifiers structure', () => {
      const equippedItems: EquippedItems = {
        mainHand: 'longsword',
        offHand: null,
        armor: null,
        shield: null,
        accessory1: null,
        accessory2: null,
      };

      const mods = calculateStatModifiers(equippedItems);
      expect(mods).toHaveProperty('acBonus');
      expect(mods).toHaveProperty('attackBonuses');
      expect(mods).toHaveProperty('totalWeight');
    });

    it('should calculate attack bonuses from weapons', () => {
      const equippedItems: EquippedItems = {
        mainHand: 'longsword',
        offHand: null,
        armor: null,
        shield: null,
        accessory1: null,
        accessory2: null,
      };

      const mods = calculateStatModifiers(equippedItems);
      expect(mods.attackBonuses.length).toBeGreaterThan(0);
      expect(mods.attackBonuses[0]).toHaveProperty('name');
      expect(mods.attackBonuses[0]).toHaveProperty('bonus');
      expect(mods.attackBonuses[0]).toHaveProperty('damageType');
    });

    it('should handle dual wielding', () => {
      const equippedItems: EquippedItems = {
        mainHand: 'shortsword',
        offHand: 'shortsword',
        armor: null,
        shield: null,
        accessory1: null,
        accessory2: null,
      };

      const mods = calculateStatModifiers(equippedItems);
      expect(mods.attackBonuses.length).toBeGreaterThanOrEqual(1);
    });

    it('should return zero values for empty equipment', () => {
      const equippedItems: EquippedItems = {
        mainHand: null,
        offHand: null,
        armor: null,
        shield: null,
        accessory1: null,
        accessory2: null,
      };

      const mods = calculateStatModifiers(equippedItems);
      expect(mods.acBonus).toBe(0);
      expect(mods.attackBonuses.length).toBe(0);
      expect(mods.totalWeight).toBe(0);
    });

    it('should handle nonexistent equipment gracefully', () => {
      const equippedItems: EquippedItems = {
        mainHand: 'fake-weapon',
        offHand: null,
        armor: 'fake-armor',
        shield: null,
        accessory1: null,
        accessory2: null,
      };

      const mods = calculateStatModifiers(equippedItems);
      expect(mods.acBonus).toBe(0);
      expect(mods.attackBonuses.length).toBe(0);
    });

    it('should calculate total weight', () => {
      const equippedItems: EquippedItems = {
        mainHand: 'longsword',
        offHand: null,
        armor: 'chain-mail',
        shield: null,
        accessory1: null,
        accessory2: null,
      };

      const mods = calculateStatModifiers(equippedItems);
      expect(mods.totalWeight).toBeGreaterThan(0);
    });
  });

  describe('convertToGold', () => {
    it('should convert copper to gold', () => {
      const gold = convertToGold(100, 'cp');
      expect(gold).toBe(1); // 100cp = 1gp
    });

    it('should convert gold to gold', () => {
      const gold = convertToGold(50, 'gp');
      expect(gold).toBe(50);
    });

    it('should convert silver to gold', () => {
      const gold = convertToGold(10, 'sp');
      expect(gold).toBe(1); // 10sp = 1gp
    });

    it('should convert platinum to gold', () => {
      const gold = convertToGold(1, 'pp');
      expect(gold).toBe(10); // 1pp = 10gp
    });

    it('should handle fractional conversions', () => {
      const gold = convertToGold(5, 'cp');
      expect(gold).toBe(0.05); // 5cp = 0.05gp
    });

    it('should default to gold for unknown units', () => {
      const gold = convertToGold(100, 'unknown');
      expect(gold).toBe(100); // Should treat as gold
    });
  });
});
