import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  makeAttackRoll,
  rollDamage,
  applyDamage,
  calculateAttackBonus,
  calculateDamageBonus,
  resolveAttack,
} from '../../rules/attack';
import type { CombatCharacter } from '@/graph/state';
import { DiceRoller } from '../../dice';

describe('Attack Rules', () => {
  let diceRoller: DiceRoller;
  let attacker: CombatCharacter;
  let defender: CombatCharacter;

  beforeEach(() => {
    diceRoller = new DiceRoller({ seed: 12345 });

    attacker = {
      id: 'attacker-1',
      name: 'Fighter',
      hp: 50,
      maxHp: 50,
      tempHp: 0,
      armorClass: 16,
      position: { x: 0, y: 0 },
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

    defender = {
      id: 'defender-1',
      name: 'Goblin',
      hp: 20,
      maxHp: 20,
      tempHp: 0,
      armorClass: 13,
      position: { x: 1, y: 0 },
      initiative: 10,
      avatar: '',
      isPlayer: false,
      strength: 8,
      dexterity: 14,
      constitution: 10,
      intelligence: 10,
      wisdom: 8,
      charisma: 8,
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
  });

  describe('calculateAttackBonus', () => {
    it('should calculate attack bonus with STR', () => {
      const bonus = calculateAttackBonus(attacker, false);
      const expectedMod = Math.floor((16 - 10) / 2); // +3 from STR
      expect(bonus).toBe(expectedMod + 2); // +3 STR + 2 proficiency = +5
    });

    it('should use DEX for finesse weapons', () => {
      const bonus = calculateAttackBonus(attacker, true);
      const strMod = Math.floor((16 - 10) / 2); // +3
      const dexMod = Math.floor((12 - 10) / 2); // +1
      expect(bonus).toBe(Math.max(strMod, dexMod) + 2); // Uses better of STR/DEX
    });
  });

  describe('calculateDamageBonus', () => {
    it('should calculate damage bonus with STR', () => {
      const bonus = calculateDamageBonus(attacker, false);
      expect(bonus).toBe(3); // +3 from STR 16
    });

    it('should use DEX for finesse weapons', () => {
      const bonus = calculateDamageBonus(attacker, true);
      expect(bonus).toBe(3); // Uses better of STR(+3) or DEX(+1)
    });
  });

  describe('makeAttackRoll', () => {
    it('should make a basic attack roll', () => {
      const result = makeAttackRoll({ attacker, defender }, diceRoller, 5);

      expect(result.roll.rollType).toBe('attack');
      expect(result.roll.modifier).toBe(5);
      expect(result.targetAC).toBe(defender.armorClass);
      expect(typeof result.isHit).toBe('boolean');
    });

    it('should detect critical hit on natural 20', () => {
      const roller = new DiceRoller({ seed: 12345 });
      let foundCrit = false;

      for (let i = 0; i < 10000; i++) {
        roller.setSeed(i);
        roller.clearHistory();
        const result = makeAttackRoll({ attacker, defender }, roller, 0);

        if (result.roll.rawRolls.includes(20)) {
          expect(result.isCriticalHit).toBe(true);
          expect(result.isHit).toBe(true); // Natural 20 always hits
          foundCrit = true;
          break;
        }
      }

      expect(foundCrit).toBe(true);
    });

    it('should detect critical miss on natural 1', () => {
      const roller = new DiceRoller({ seed: 12345 });
      let foundCritMiss = false;

      for (let i = 0; i < 10000; i++) {
        roller.setSeed(i);
        roller.clearHistory();
        const result = makeAttackRoll({ attacker, defender }, roller, 100); // High bonus

        if (result.roll.rawRolls.includes(1)) {
          expect(result.isCriticalMiss).toBe(true);
          expect(result.isHit).toBe(false); // Natural 1 always misses
          foundCritMiss = true;
          break;
        }
      }

      expect(foundCritMiss).toBe(true);
    });
  });

  describe('rollDamage', () => {
    it('should roll normal damage', () => {
      const result = rollDamage('2d6', 3, false, 'slashing', diceRoller);

      expect(result.isCritical).toBe(false);
      expect(result.damageType).toBe('slashing');
      expect(result.roll.numberOfDice).toBe(2);
      expect(result.roll.modifier).toBe(3);
      expect(result.totalDamage).toBeGreaterThanOrEqual(5); // Min 2 + 3
      expect(result.totalDamage).toBeLessThanOrEqual(15); // Max 12 + 3
    });

    it('should double dice on critical hit', () => {
      diceRoller.clearHistory();
      const result = rollDamage('2d6', 3, true, 'slashing', diceRoller);

      expect(result.isCritical).toBe(true);
      expect(result.roll.rawRolls.length).toBe(4); // 2d6 rolled twice
      expect(result.totalDamage).toBeGreaterThanOrEqual(7); // Min 4 + 3
      expect(result.totalDamage).toBeLessThanOrEqual(27); // Max 24 + 3
    });
  });

  describe('applyDamage', () => {
    it('should reduce HP', () => {
      const result = applyDamage(defender, 10);

      expect(result.hpLost).toBe(10);
      expect(result.tempHpLost).toBe(0);
      expect(result.newHp).toBe(10);
      expect(result.isDead).toBe(false);
    });

    it('should absorb damage with temp HP first', () => {
      const charWithTempHp = { ...defender, tempHp: 5 };
      const result = applyDamage(charWithTempHp, 10);

      expect(result.tempHpLost).toBe(5);
      expect(result.hpLost).toBe(5);
      expect(result.newHp).toBe(15);
      expect(result.newTempHp).toBe(0);
    });

    it('should detect death', () => {
      const result = applyDamage(defender, 100);

      expect(result.isDead).toBe(true);
      expect(result.newHp).toBe(0);
    });

    it('should not go below 0 HP', () => {
      const result = applyDamage(defender, 1000);
      expect(result.newHp).toBe(0);
    });
  });

  describe('resolveAttack', () => {
    it('should resolve complete attack sequence on hit', () => {
      for (let i = 0; i < 1000; i++) {
        const testRoller = new DiceRoller({ seed: i });
        const attackBonus = calculateAttackBonus(attacker);
        const testAttackRoll = testRoller.rollAttack(attackBonus);

        if (testAttackRoll.finalResult >= defender.armorClass && !testAttackRoll.rawRolls.includes(20)) {
          diceRoller.setSeed(i);
          diceRoller.clearHistory();

          const result = resolveAttack({ attacker, defender }, '1d8', 'slashing', diceRoller, false);

          expect(result.attackRoll.isHit).toBe(true);
          expect(result.damageRoll).toBeDefined();
          expect(result.damageResult).toBeDefined();
          expect(result.updatedDefender).toBeDefined();
          expect(result.updatedDefender!.hp).toBeLessThan(defender.hp);
          break;
        }
      }
    });

    it('should handle miss', () => {
      for (let i = 0; i < 1000; i++) {
        const testRoller = new DiceRoller({ seed: i });
        const attackBonus = calculateAttackBonus(attacker);
        const testAttackRoll = testRoller.rollAttack(attackBonus);

        if (testAttackRoll.finalResult < defender.armorClass && !testAttackRoll.rawRolls.includes(1)) {
          diceRoller.setSeed(i);
          diceRoller.clearHistory();

          const result = resolveAttack({ attacker, defender }, '1d8', 'slashing', diceRoller, false);

          expect(result.attackRoll.isHit).toBe(false);
          expect(result.damageRoll).toBeUndefined();
          expect(result.updatedDefender).toBeUndefined();
          break;
        }
      }
    });
  });
});
