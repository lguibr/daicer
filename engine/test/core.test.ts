import { describe, it, expect } from 'vitest';
import { roll, parseDiceString } from '../src/rules/dice';
import { calculateDistance } from '../src/utils/geometry';
import { calculateModifier, calculateProficiencyBonus } from '../src/rules/dnd5e';
import { getConditionModifiers, ConditionType } from '../src/rules/conditions';
import { createCharacterSheet } from './factories';

describe('Core: Dice Engine', () => {
  it('parses standard dice strings', () => {
    expect(parseDiceString('1d6')).toEqual({ count: 1, sides: 6, bonus: 0 });
    expect(parseDiceString('2d20')).toEqual({ count: 2, sides: 20, bonus: 0 });
    expect(parseDiceString('10d12')).toEqual({ count: 10, sides: 12, bonus: 0 });
  });

  it('handles invalid dice strings gracefully (throws)', () => {
    expect(() => parseDiceString('invalid')).toThrow();
  });

  it('rolls within range', () => {
    for (let i = 0; i < 100; i++) {
      const res = roll({ count: 1, sides: 6, bonus: 2 });
      expect(res.total).toBeGreaterThanOrEqual(3); // 1+2
      expect(res.total).toBeLessThanOrEqual(8); // 6+2
      expect(res.rolls).toHaveLength(1);
    }
  });

  it('calculates totals correctly with bonus', () => {
    const res = roll({ count: 2, sides: 6, bonus: 5 });
    const sum = res.rolls.reduce((a, b) => a + b, 0);
    expect(res.total).toBe(sum + 5);
  });
});

describe('Core: Geometry Utils', () => {
  it('calculates 3D Euclidean distance', () => {
    const p1 = { x: 0, y: 0, z: 0 };
    const p2 = { x: 3, y: 4, z: 0 };
    expect(calculateDistance(p1, p2)).toBeCloseTo(5); // 3-4-5 triangle

    const p3 = { x: 0, y: 0, z: 0 };
    const p4 = { x: 1, y: 1, z: 1 };
    expect(calculateDistance(p3, p4)).toBeCloseTo(Math.sqrt(3));
  });
});

describe('Core: D&D 5e Rules', () => {
  it('calculates ability modifiers correctly', () => {
    expect(calculateModifier(10)).toBe(0);
    expect(calculateModifier(12)).toBe(1);
    expect(calculateModifier(8)).toBe(-1);
    expect(calculateModifier(20)).toBe(5);
    expect(calculateModifier(1)).toBe(-5);
  });

  it('calculates proficiency bonus correctly', () => {
    expect(calculateProficiencyBonus(1)).toBe(2);
    expect(calculateProficiencyBonus(4)).toBe(2);
    expect(calculateProficiencyBonus(5)).toBe(3);
    expect(calculateProficiencyBonus(17)).toBe(6);
  });
});

describe('Core: Conditions Manager', () => {
  it('detects active conditions', () => {
    const sheet = createCharacterSheet({
      conditions: [{ name: ConditionType.Prone, duration: 1, source: 'test' }],
    });
    const mods = getConditionModifiers(sheet);
    // Prone grants disadvantage on attacks
    expect(mods.hasDisadvantageOnAttack).toBe(true);
    // Note: grantAdvantageToAttacker was removed from Prone to support ranged disadvantage logic
    expect(mods.grantAdvantageToAttacker).toBeUndefined();
  });

  it('returns empty modifiers for healthy character', () => {
    const sheet = createCharacterSheet();
    const mods = getConditionModifiers(sheet);
    expect(Object.keys(mods)).toHaveLength(0);
  });

  it('aggregates multiple condition effects', () => {
    // Blinded (Disadv on Atk) + Invisible (Adv on Atk) -> Should have both flags
    const sheet = createCharacterSheet({
      conditions: [
        { name: ConditionType.Blinded, duration: 1 },
        { name: ConditionType.Invisible, duration: 1 },
      ],
    });
    const mods = getConditionModifiers(sheet);
    expect(mods.hasDisadvantageOnAttack).toBe(true); // From Blinded
    expect(mods.hasAdvantageOnAttack).toBe(true); // From Invisible
  });
});
