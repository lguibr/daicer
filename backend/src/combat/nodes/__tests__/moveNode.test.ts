import { describe, it, expect } from '@jest/globals';
import { moveNode } from '../MoveNode';
import type { CombatState, CombatCharacter } from '@/graph/state';
import { DiceRoller } from '../../dice';
import * as opportunityAttack from '../../rules/opportunityAttack';

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

function createState(
  characters: CombatCharacter[],
  diceHistory: CombatState['diceHistory'] = [] as CombatState['diceHistory']
): CombatState {
  return {
    sessionId: 'session-1',
    characters,
    activeCharacterId: characters[0]?.id ?? null,
    turnOrder: characters.map((c) => c.id),
    round: 1,
    isCombatOver: false,
    winner: null,
    log: [],
    diceHistory,
    gridWidth: 10,
    gridHeight: 10,
    phase: 'action_selection',
    pendingOpportunityAttacks: [],
    diceRollerSeed: 123,
    spellPreview: null,
    lastSpellResolution: null,
  };
}

describe('moveNode', () => {
  it('does not duplicate dice history when no opportunity attacks occur', () => {
    const mover = createCharacter({ id: 'mover', name: 'Rogue', position: { x: 2, y: 2 } });
    const ally = createCharacter({
      id: 'ally',
      name: 'Cleric',
      position: { x: 5, y: 5 },
      hasReaction: true,
    });
    const diceRoller = new DiceRoller({ seed: 99 });
    diceRoller.rollInitiative(2);
    diceRoller.rollAttack(4);
    const existingHistory = diceRoller.getHistory();
    const state = createState([mover, ally], existingHistory);

    const result = moveNode(state, {
      characterId: 'mover',
      targetPosition: { x: 3, y: 3 },
      diceRoller,
    });

    expect(result.diceHistory).toBeDefined();
    expect(result.diceHistory).toHaveLength(existingHistory.length);
    expect(result.diceHistory).toEqual(existingHistory);
  });

  it('keeps the character in place if an opportunity attack reduces them to zero HP', () => {
    const mover = createCharacter({
      id: 'mover',
      name: 'Rogue',
      position: { x: 2, y: 2 },
      hp: 5,
      movementRemaining: 6,
    });
    const enemy = createCharacter({
      id: 'enemy',
      name: 'Orc',
      isPlayer: false,
      position: { x: 3, y: 2 },
    });
    const state = createState([mover, enemy]);
    const diceRoller = new DiceRoller({ seed: 42 });

    const spy = jest.spyOn(opportunityAttack, 'processOpportunityAttacks').mockReturnValue({
      attacks: [],
      updatedDefender: { ...mover, hp: 0 },
      updatedAttackers: [],
    });

    const result = moveNode(state, {
      characterId: 'mover',
      targetPosition: { x: 5, y: 5 },
      diceRoller,
    });

    spy.mockRestore();

    if (!result.characters) {
      throw new Error('Expected characters to be returned');
    }
    const updatedMover = result.characters.find((c) => c.id === 'mover');
    if (!updatedMover) {
      throw new Error('Mover was not present in updated characters');
    }

    expect(updatedMover.hp).toBe(0);
    expect(updatedMover.position).toEqual(mover.position);
    expect(updatedMover.movementRemaining).toBe(mover.movementRemaining);
  });
});
