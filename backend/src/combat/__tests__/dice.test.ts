import { describe, it, expect, beforeEach } from '@jest/globals';
import { DiceRoller } from '../dice';

describe('DiceRoller', () => {
  let roller: DiceRoller;

  beforeEach(() => {
    roller = new DiceRoller({ seed: 12345, enableHistory: true });
  });

  describe('Basic rolling', () => {
    it('should roll a d20', () => {
      const result = roller.roll('1d20');
      expect(result.diceType).toBe('d20');
      expect(result.numberOfDice).toBe(1);
      expect(result.rawRolls).toHaveLength(1);
      expect(result.rawRolls[0]).toBeGreaterThanOrEqual(1);
      expect(result.rawRolls[0]).toBeLessThanOrEqual(20);
      expect(result.finalResult).toBe(result.rawRolls[0]);
    });

    it('should roll multiple dice', () => {
      const result = roller.roll('2d6');
      expect(result.diceType).toBe('d6');
      expect(result.numberOfDice).toBe(2);
      expect(result.rawRolls).toHaveLength(2);
      expect(result.finalResult).toBe(result.rawRolls[0] + result.rawRolls[1]);
    });

    it('should apply modifiers', () => {
      const result = roller.roll('1d20', { modifier: 5 });
      expect(result.modifier).toBe(5);
      expect(result.finalResult).toBe(result.rawRolls[0]! + 5);
    });

    it('should handle different dice types', () => {
      const d4 = roller.roll('1d4');
      const d6 = roller.roll('1d6');
      const d8 = roller.roll('1d8');
      const d10 = roller.roll('1d10');
      const d12 = roller.roll('1d12');
      const d100 = roller.roll('1d100');

      expect(d4.rawRolls[0]).toBeGreaterThanOrEqual(1);
      expect(d4.rawRolls[0]).toBeLessThanOrEqual(4);
      
      expect(d6.rawRolls[0]).toBeGreaterThanOrEqual(1);
      expect(d6.rawRolls[0]).toBeLessThanOrEqual(6);
      
      expect(d100.rawRolls[0]).toBeGreaterThanOrEqual(1);
      expect(d100.rawRolls[0]).toBeLessThanOrEqual(100);
    });
  });

  describe('Advantage and Disadvantage', () => {
    it('should roll with advantage', () => {
      const result = roller.rollWithAdvantage('1d20');
      expect(result.advantageType).toBe('advantage');
      expect(result.rawRolls).toHaveLength(2);
      expect(result.finalResult).toBe(Math.max(...result.rawRolls));
    });

    it('should roll with disadvantage', () => {
      const result = roller.rollWithDisadvantage('1d20');
      expect(result.advantageType).toBe('disadvantage');
      expect(result.rawRolls).toHaveLength(2);
      expect(result.finalResult).toBe(Math.min(...result.rawRolls));
    });

    it('should only apply advantage/disadvantage to d20 rolls', () => {
      const result = roller.roll('2d6', { advantageType: 'advantage' });
      expect(result.rawRolls).toHaveLength(2);
      expect(result.finalResult).toBe(result.rawRolls[0]! + result.rawRolls[1]!);
    });
  });

  describe('Specific roll types', () => {
    it('should roll initiative', () => {
      const result = roller.rollInitiative(3, 'Fighter initiative');
      expect(result.rollType).toBe('initiative');
      expect(result.modifier).toBe(3);
      expect(result.description).toContain('initiative');
    });

    it('should roll attack', () => {
      const result = roller.rollAttack(5, 'normal', 'Longsword attack');
      expect(result.rollType).toBe('attack');
      expect(result.modifier).toBe(5);
      expect(result.advantageType).toBe('normal');
    });

    it('should roll damage', () => {
      const result = roller.rollDamage('2d6', 3, 'Greatsword damage');
      expect(result.rollType).toBe('damage');
      expect(result.diceType).toBe('d6');
      expect(result.numberOfDice).toBe(2);
      expect(result.modifier).toBe(3);
      expect(result.finalResult).toBe(result.rawRolls[0]! + result.rawRolls[1]! + 3);
    });

    it('should roll saving throw', () => {
      const result = roller.rollSavingThrow(2, 'disadvantage', 'DEX save');
      expect(result.rollType).toBe('saving_throw');
      expect(result.advantageType).toBe('disadvantage');
    });
  });

  describe('History tracking', () => {
    it('should track roll history', () => {
      roller.clearHistory();
      
      roller.roll('1d20');
      roller.roll('2d6');
      roller.roll('1d8');
      
      const history = roller.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0]!.diceType).toBe('d20');
      expect(history[1]!.diceType).toBe('d6');
      expect(history[2]!.diceType).toBe('d8');
    });

    it('should filter rolls by context ID', () => {
      roller.clearHistory();
      
      roller.roll('1d20', { contextId: 'attack-1' });
      roller.roll('2d6', { contextId: 'attack-1' });
      roller.roll('1d20', { contextId: 'attack-2' });
      
      const attack1Rolls = roller.getRollsByContext('attack-1');
      expect(attack1Rolls).toHaveLength(2);
    });

    it('should clear history', () => {
      roller.roll('1d20');
      roller.roll('1d20');
      expect(roller.getHistory()).toHaveLength(2);
      
      roller.clearHistory();
      expect(roller.getHistory()).toHaveLength(0);
    });
  });

  describe('Deterministic rolling with seeds', () => {
    it('should produce same results with same seed', () => {
      const roller1 = new DiceRoller({ seed: 42 });
      const roller2 = new DiceRoller({ seed: 42 });
      
      const result1 = roller1.roll('1d20');
      const result2 = roller2.roll('1d20');
      
      expect(result1.rawRolls).toEqual(result2.rawRolls);
      expect(result1.finalResult).toBe(result2.finalResult);
    });

    it('should allow seed changes', () => {
      const roller1 = new DiceRoller({ seed: 100 });
      const roll1 = roller1.roll('1d20');
      
      roller1.setSeed(100); // Reset to same seed
      const roll2 = roller1.roll('1d20');
      
      expect(roll2.rawRolls[0]).toBe(roll1.rawRolls[0]);
    });

    it('should produce different results with different seeds', () => {
      const roller1 = new DiceRoller({ seed: 1 });
      const roller2 = new DiceRoller({ seed: 999999 });
      
      const results1 = [roller1.roll('1d20'), roller1.roll('1d20'), roller1.roll('1d20')];
      const results2 = [roller2.roll('1d20'), roller2.roll('1d20'), roller2.roll('1d20')];
      
      // At least one result should be different across multiple rolls
      const allSame = results1.every((r, i) => r.rawRolls[0] === results2[i]!.rawRolls[0]);
      expect(allSame).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero modifier', () => {
      const result = roller.roll('1d20', { modifier: 0 });
      expect(result.finalResult).toBe(result.rawRolls[0]);
    });

    it('should handle negative modifiers', () => {
      const result = roller.roll('1d20', { modifier: -2 });
      expect(result.finalResult).toBe(result.rawRolls[0]! - 2);
    });

    it('should throw on invalid dice notation', () => {
      expect(() => roller.roll('invalid')).toThrow();
      expect(() => roller.roll('d20')).toThrow();
      expect(() => roller.roll('2x6')).toThrow();
    });
  });

  describe('Roll formatting', () => {
    it('should format basic roll', () => {
      const result = roller.roll('1d20', { modifier: 5 });
      const formatted = DiceRoller.formatRoll(result);
      expect(formatted).toContain('[' + result.rawRolls[0] + ']');
      expect(formatted).toContain('+ 5');
      expect(formatted).toContain('**' + result.finalResult + '**');
    });

    it('should format advantage roll', () => {
      const result = roller.rollWithAdvantage('1d20');
      const formatted = DiceRoller.formatRoll(result);
      expect(formatted).toContain('(Advantage)');
      expect(formatted).toContain('[' + result.rawRolls.join(', ') + ']');
    });

    it('should format disadvantage roll', () => {
      const result = roller.rollWithDisadvantage('1d20');
      const formatted = DiceRoller.formatRoll(result);
      expect(formatted).toContain('(Disadvantage)');
    });
  });
});

