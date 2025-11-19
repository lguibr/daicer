import { describe, it, expect } from '@jest/globals';
import { attackNode } from '../AttackNode';
import type { CombatState, CombatCharacter } from '@/graph/state';
import { DiceRoller } from '../../dice';

function createCharacter(overrides: Partial<CombatCharacter> = {}): CombatCharacter {
  return {
    id: overrides.id ?? 'character-1',
    name: overrides.name ?? 'Hero',
    hp: overrides.hp ?? 40,
    maxHp: overrides.maxHp ?? 40,
    tempHp: overrides.tempHp ?? 0,
    armorClass: overrides.armorClass ?? 15,
    position: overrides.position ?? { x: 0, y: 0 },
    initiative: overrides.initiative ?? 10,
    avatar: overrides.avatar ?? '',
    isPlayer: overrides.isPlayer ?? true,
    strength: overrides.strength ?? 16,
    dexterity: overrides.dexterity ?? 12,
    constitution: overrides.constitution ?? 14,
    intelligence: overrides.intelligence ?? 10,
    wisdom: overrides.wisdom ?? 10,
    charisma: overrides.charisma ?? 10,
    proficiencyBonus: overrides.proficiencyBonus ?? 2,
    speed: overrides.speed ?? 6,
    reach: overrides.reach ?? 1,
    hasMoved: overrides.hasMoved ?? false,
    hasActed: overrides.hasActed ?? false,
    hasReaction: overrides.hasReaction ?? true,
    hasBonusAction: overrides.hasBonusAction ?? true,
    movementRemaining: overrides.movementRemaining ?? 6,
    conditions: overrides.conditions ?? [],
    deathSaves: overrides.deathSaves,
  };
}

function createState(characters: CombatCharacter[]): CombatState {
  return {
    sessionId: 'session-1',
    characters,
    activeCharacterId: characters[0]?.id ?? null,
    turnOrder: characters.map((c) => c.id),
    round: 1,
    isCombatOver: false,
    winner: null,
    log: [],
    diceHistory: [],
    gridWidth: 10,
    gridHeight: 10,
    phase: 'action_selection',
    pendingOpportunityAttacks: [],
    diceRollerSeed: 123,
    spellPreview: null,
    lastSpellResolution: null,
  };
}

function findCriticalSeed(attackBonus: number): number {
  for (let seed = 0; seed < 50000; seed += 1) {
    const roller = new DiceRoller({ seed });
    const roll = roller.rollAttack(attackBonus);
    if (roll.rawRolls.includes(20)) {
      return seed;
    }
  }
  throw new Error('Failed to locate seed producing a critical hit');
}

function findHitSeed(attackBonus: number, targetAC: number): number {
  for (let seed = 0; seed < 50000; seed += 1) {
    const roller = new DiceRoller({ seed });
    const roll = roller.rollAttack(attackBonus);
    const isCritMiss = roll.rawRolls.includes(1);
    if (!isCritMiss && roll.finalResult >= targetAC) {
      return seed;
    }
  }
  throw new Error('Failed to locate seed producing a normal hit');
}

describe('attackNode', () => {
  it('includes the attack roll in dice history for critical hits', () => {
    const attacker = createCharacter({ id: 'attacker', name: 'Fighter' });
    const defender = createCharacter({
      id: 'defender',
      name: 'Goblin',
      isPlayer: false,
      position: { x: 1, y: 0 },
      armorClass: 10,
      hp: 12,
      maxHp: 12,
    });
    const state = createState([attacker, defender]);

    const attackBonus = 5; // STR 16 (+3) + proficiency 2
    const criticalSeed = findCriticalSeed(attackBonus);
    const diceRoller = new DiceRoller({ seed: criticalSeed });

    const result = attackNode(state, {
      attackerId: 'attacker',
      defenderId: 'defender',
      diceRoller,
      weaponDamage: '1d8',
      damageType: 'slashing',
    });

    const newHistory = diceRoller.getHistory().slice(-3);

    const history = result.diceHistory;
    expect(history).toBeDefined();
    if (!history) {
      throw new Error('Expected dice history to be returned');
    }
    expect(history).toHaveLength(3);
    expect(history).toEqual(newHistory);
    const first = history.at(0);
    if (!first) {
      throw new Error('Expected attack roll in dice history');
    }
    expect(first.rollType).toBe('attack');
  });

  it('appends new dice rolls after existing history entries', () => {
    const attacker = createCharacter({ id: 'attacker', name: 'Fighter' });
    const defender = createCharacter({
      id: 'defender',
      name: 'Goblin',
      isPlayer: false,
      position: { x: 1, y: 0 },
      armorClass: 10,
      hp: 12,
      maxHp: 12,
    });

    const existingHistoryRoller = new DiceRoller({ seed: 777 });
    existingHistoryRoller.rollInitiative(2);
    const previousHistory = existingHistoryRoller.getHistory();

    const state = createState([attacker, defender]);
    state.diceHistory = previousHistory;

    const attackBonus = 5;
    const criticalSeed = findCriticalSeed(attackBonus);
    const diceRoller = new DiceRoller({ seed: criticalSeed });
    const historyStartLength = diceRoller.getHistory().length;

    const result = attackNode(state, {
      attackerId: 'attacker',
      defenderId: 'defender',
      diceRoller,
      weaponDamage: '1d8',
      damageType: 'slashing',
    });

    if (!result.diceHistory) {
      throw new Error('Expected dice history to be returned');
    }

    const updatedHistory = diceRoller.getHistory().slice(historyStartLength);
    expect(result.diceHistory).toHaveLength(previousHistory.length + updatedHistory.length);
    expect(result.diceHistory.slice(previousHistory.length)).toEqual(updatedHistory);
  });

  it('logs a defeat message when the defender is reduced to zero HP', () => {
    const attacker = createCharacter({ id: 'attacker', name: 'Fighter' });
    const defender = createCharacter({
      id: 'defender',
      name: 'Goblin',
      isPlayer: false,
      position: { x: 1, y: 0 },
      armorClass: 10,
      hp: 1,
      maxHp: 1,
    });
    const state = createState([attacker, defender]);

    const attackBonus = 5;
    const hitSeed = findHitSeed(attackBonus, defender.armorClass);
    const diceRoller = new DiceRoller({ seed: hitSeed });

    const result = attackNode(state, {
      attackerId: 'attacker',
      defenderId: 'defender',
      diceRoller,
      weaponDamage: '1d8',
      damageType: 'slashing',
    });

    const messages = result.log?.map((entry) => entry.message) ?? [];
    expect(messages.some((msg) => msg.includes('has fallen'))).toBe(true);
  });
});
