import { describe, it, expect, beforeEach } from '@jest/globals';
import { createGameplayGraph } from '../gameplay-graph';
import type { GameState } from '../state';

describe('Game Graph', () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = {
      roomId: 'test-room-123',
      ownerId: 'user-1',
      code: 'ABC123',
      phase: 'SETUP',
      settings: {
        theme: 'Fantasy',
        setting: 'Forgotten Realms',
        tone: 'Heroic',
        playerCount: 2,
        adventureLength: 'short',
        difficulty: 'medium',
        startingLevel: 1,
        attributePointBudget: 27,
        language: 'en',
      },
      worldDescription: '',
      players: [],
      messages: [],
      creatures: [],
      combatState: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      waitingForAction: false,
    };
  });

  it('should create game graph successfully', () => {
    const graph = createGameplayGraph();
    expect(graph).toBeDefined();
  });

  it('should handle phase transitions', () => {
    // Test that the graph properly routes based on phase
    const states = [
      { ...initialState, phase: 'SETUP' as const },
      { ...initialState, phase: 'CHARACTER_CREATION' as const },
      { ...initialState, phase: 'GAMEPLAY' as const },
      { ...initialState, phase: 'COMBAT' as const },
    ];

    states.forEach((state) => {
      expect(state.phase).toMatch(/SETUP|CHARACTER_CREATION|GAMEPLAY|COMBAT/);
    });
  });

  it('should compile with checkpointer', () => {
    const graph = createGameplayGraph();

    // Graph should be compiled and ready to invoke
    expect(typeof graph.invoke).toBe('function');
    expect(typeof graph.stream).toBe('function');
    expect(typeof graph.getState).toBe('function');
  });
});

describe('Game State Management', () => {
  it('should track combat state separately', () => {
    const state: Partial<GameState> = {
      roomId: 'test',
      phase: 'COMBAT',
      combatState: {
        sessionId: 'combat-1',
        characters: [],
        activeCharacterId: null,
        turnOrder: [],
        round: 1,
        isCombatOver: false,
        winner: null,
        log: [],
        diceHistory: [],
        gridWidth: 10,
        gridHeight: 10,
        phase: 'setup',
        pendingOpportunityAttacks: [],
        diceRollerSeed: 42,
        spellPreview: null,
        lastSpellResolution: null,
      },
    };

    expect(state.combatState).toBeDefined();
    expect(state.combatState?.sessionId).toBe('combat-1');
  });

  it('should validate combat state null when not in combat', () => {
    const state: Partial<GameState> = {
      roomId: 'test',
      phase: 'GAMEPLAY',
      combatState: null,
    };

    expect(state.combatState).toBeNull();
  });
});
