import { describe, it, expect, vi } from 'vitest';
import { shortRest, longRest } from '../src/rules/resting';
import { levelUp } from '../src/rules/leveling';
import { createCharacterSheet } from './factories';

// Mock dice for deterministic healing
import * as diceModule from '../src/rules/dice';
vi.mock('../src/rules/dice', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, rollDie: vi.fn() };
});

describe('State Management: SOTA Coverage', () => {
  // --- Short Rest ---
  describe('Short Rest', () => {
    it('Heals 0 if no Hit Dice spent', () => {
      const char = createCharacterSheet({ hp: 10, maxHp: 20 });
      const res = shortRest(char, 0);
      expect(res.hpHealed).toBe(0);
      expect(char.hp).toBe(10);
    });

    it('Heals using Hit Dice (Mocked Roll)', () => {
      const char = createCharacterSheet({
        hp: 5,
        maxHp: 20,
        attributes: { Constitution: 14 } as any, // +2
        hitDice: { current: 2, total: 2, die: '1d10' },
      });

      // Roll 8. Heal = 8 + 2 = 10.
      vi.mocked(diceModule.rollDie).mockReturnValueOnce(8);

      const res = shortRest(char, 1);
      expect(res.hpHealed).toBe(10);
      expect(char.hp).toBe(15);
      expect(res.hitDiceSpent).toBe(1);
      expect(char.hitDice.current).toBe(1);
    });

    it('Caps healing at Max HP', () => {
      const char = createCharacterSheet({
        hp: 18,
        maxHp: 20,
        attributes: { Constitution: 10 } as any,
        hitDice: { current: 1, total: 1, die: '1d10' },
      });
      vi.mocked(diceModule.rollDie).mockReturnValueOnce(10); // Heal 10.

      shortRest(char, 1);
      expect(char.hp).toBe(20);
    });

    it('Handles Negative CON mod (Minimum 0 heal per die?)', () => {
      const char = createCharacterSheet({
        hp: 10,
        maxHp: 20,
        attributes: { Constitution: 6 } as any, // -2
        hitDice: { current: 1, total: 1, die: '1d10' },
      });
      // Roll 1. 1 - 2 = -1. Should be 0. (Usually min 0 or 1 in D&D? Rules say "add con modifier", minimum 0 usually implied for healing).
      vi.mocked(diceModule.rollDie).mockReturnValueOnce(1);

      const res = shortRest(char, 1);
      expect(res.hpHealed).toBe(0); // If implemented as Math.max(0, roll+mod)
    });

    it('Resets Short-Rest resources', () => {
      const char = createCharacterSheet({
        resources: [
          { name: 'Ki', current: 0, max: 5, refresh: 'short-rest' },
          { name: 'Rage', current: 0, max: 2, refresh: 'long-rest' },
        ],
      });

      shortRest(char, 0);
      expect(char.resources[0].current).toBe(5); // Ki back
      expect(char.resources[1].current).toBe(0); // Rage not back
    });
  });

  // --- Long Rest ---
  describe('Long Rest', () => {
    it('Fully Heals', () => {
      const char = createCharacterSheet({ hp: 1, maxHp: 20 });
      longRest(char);
      expect(char.hp).toBe(20);
    });

    it('Recovers Half Hit Dice (Round Down, Min 1)', () => {
      const char = createCharacterSheet({ hitDice: { current: 0, total: 5, die: '1d8' } });
      // 5 / 2 = 2.5 -> floor 2? Or D&D rule: half max hit dice (minimum 1).
      // 5 -> 2.
      longRest(char);
      expect(char.hitDice.current).toBe(2);
    });

    it('Recovers All Hit Dice up to Max', () => {
      const char = createCharacterSheet({ hitDice: { current: 3, total: 5, die: '1d8' } });
      // 3 + 2 = 5.
      longRest(char);
      expect(char.hitDice.current).toBe(5);
    });

    it('Recovers All Spell Slots', () => {
      const char = createCharacterSheet({
        spellbook: {
          slots: [{ level: 1, max: 4, current: 0 }],
        } as any,
      });
      longRest(char);
      expect(char.spellbook.slots[0].current).toBe(4);
    });

    it('Resets Short AND Long Rest resources', () => {
      const char = createCharacterSheet({
        resources: [
          { name: 'Ki', current: 0, max: 5, refresh: 'short-rest' },
          { name: 'Rage', current: 0, max: 2, refresh: 'long-rest' },
        ],
      });
      longRest(char);
      expect(char.resources[0].current).toBe(5);
      expect(char.resources[1].current).toBe(2);
    });
  });

  // --- Leveling ---
  describe('Level Up', () => {
    it('Increments Level', () => {
      const char = createCharacterSheet({ level: 1 });
      levelUp(char);
      expect(char.level).toBe(2);
    });

    it('Increases Proficiency Bonus (4->5)', () => {
      const char = createCharacterSheet({ level: 4, proficiencyBonus: 2 });
      levelUp(char); // 4->5
      expect(char.level).toBe(5);
      expect(char.proficiencyBonus).toBe(3);
    });

    it('Increases Proficiency Bonus (8->9)', () => {
      const char = createCharacterSheet({ level: 8, proficiencyBonus: 3 });
      levelUp(char); // 8->9
      expect(char.level).toBe(9);
      expect(char.proficiencyBonus).toBe(4);
    });

    it('Increases Max HP (Deterministic Average)', () => {
      const char = createCharacterSheet({
        level: 1,
        maxHp: 10,
        hp: 10,
        hitDice: { die: '1d10', total: 1, current: 1 },
        attributes: { Constitution: 14 } as any, // +2
      });
      // Avg of 1d10 = 6. +2 Con = 8.
      levelUp(char);
      expect(char.maxHp).toBe(18); // 10 + 8
      expect(char.hp).toBe(18); // Does it heal up the new amount? usually yes ("current HP increases by same amount").
    });
  });
});
