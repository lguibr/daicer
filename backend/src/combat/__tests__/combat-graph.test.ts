import { describe, it, expect, beforeEach } from '@jest/globals';
import { createCombatSession } from '../graph';
import type { CombatCharacter } from '@/graph/state';

describe('Combat Graph', () => {
  let characters: CombatCharacter[];

  beforeEach(() => {
    characters = [
      {
        id: 'fighter-1',
        name: 'Fighter',
        hp: 50,
        maxHp: 50,
        tempHp: 0,
        armorClass: 16,
        position: { x: 2, y: 2 },
        initiative: 0,
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
      },
      {
        id: 'goblin-1',
        name: 'Goblin',
        hp: 15,
        maxHp: 15,
        tempHp: 0,
        armorClass: 13,
        position: { x: 7, y: 7 },
        initiative: 0,
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
      },
    ];
  });

  it('should initialize combat with initiative rolling', async () => {
    const session = createCombatSession('test-session', 42);
    const state = await session.startCombat(characters);

    expect(state.characters).toHaveLength(2);
    expect(state.round).toBe(1);
    expect(state.phase).toBe('turn_start');
    expect(state.turnOrder).toHaveLength(2);
    expect(state.activeCharacterId).toBeTruthy();

    // All characters should have initiative rolled
    state.characters.forEach((char) => {
      expect(char.initiative).toBeGreaterThan(0);
    });
  });

  it('should maintain deterministic results with same seed', async () => {
    const session1 = createCombatSession('test-1', 100);
    const session2 = createCombatSession('test-2', 100);

    const state1 = await session1.startCombat([...characters]);
    const state2 = await session2.startCombat([...characters]);

    // Same seed should produce identical initiative order
    expect(state1.turnOrder).toEqual(state2.turnOrder);
    expect(state1.characters.map((c) => c.initiative)).toEqual(state2.characters.map((c) => c.initiative));
  });

  it('should advance turns correctly', async () => {
    const session = createCombatSession('test-turns', 42);

    await session.startCombat(characters);
    const initialState = session.getState();
    const firstCharId = initialState.activeCharacterId;

    await session.startTurn();
    await session.endTurn();

    const newState = session.getState();
    expect(newState.activeCharacterId).not.toBe(firstCharId);
  });

  it('should track state history for time-travel', async () => {
    const session = createCombatSession('test-history', 42);

    await session.startCombat(characters);
    await session.startTurn();

    const history = session.getHistory();
    expect(history.length).toBeGreaterThan(0);

    // Each history entry should have timestamp and description
    history.forEach((entry) => {
      expect(entry.timestamp).toBeGreaterThan(0);
      expect(entry.description).toBeTruthy();
      expect(entry.state).toBeDefined();
    });
  });

  it('should restore to previous state', async () => {
    const session = createCombatSession('test-restore', 42);

    await session.startCombat(characters);
    const state0 = session.getState();

    await session.startTurn();
    await session.moveCharacter(state0.activeCharacterId!, { x: 3, y: 3 });

    const state1 = session.getState();
    const movedChar = state1.characters.find((c) => c.id === state0.activeCharacterId);
    expect(movedChar?.position).toEqual({ x: 3, y: 3 });

    // Restore to state before movement
    const history = session.getHistory();
    await session.restoreState(history.length - 2);

    const restoredState = session.getState();
    const restoredChar = restoredState.characters.find((c) => c.id === state0.activeCharacterId);
    expect(restoredChar?.position).not.toEqual({ x: 3, y: 3 });
  });

  it('should support forking from a state', async () => {
    const session = createCombatSession('test-fork', 42);

    await session.startCombat(characters);
    await session.startTurn();
    await session.moveCharacter(session.getState().activeCharacterId!, { x: 3, y: 3 });
    await session.endTurn();

    const historyBefore = session.getHistory();
    const forkPoint = Math.floor(historyBefore.length / 2);

    await session.forkFromState(forkPoint);

    const historyAfter = session.getHistory();
    expect(historyAfter.length).toBeLessThanOrEqual(forkPoint + 1);
  });

  it('should log all combat events', async () => {
    const session = createCombatSession('test-logging', 42);

    await session.startCombat(characters);

    const state = session.getState();
    expect(state.log.length).toBeGreaterThan(0);

    // Should have combat start and initiative logs
    const combatStartLog = state.log.find((l) => l.message.includes('Combat begins'));
    expect(combatStartLog).toBeDefined();
  });
});
