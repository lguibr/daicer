import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionDispatcher } from '../src/engine/action-dispatcher';
import { createCharacterSheet, createAction } from './factories';
import { GameState } from '../src/types/engine';
import { ActionType } from '../src/rules/actions';

describe('ActionDispatcher Integration', () => {
  let dispatcher: ActionDispatcher;
  let state: GameState;
  let attackerId = 'attacker-1';
  let targetId = 'target-1';

  beforeEach(() => {
    dispatcher = new ActionDispatcher('test-seed');

    const attacker = {
      id: attackerId,
      position: { x: 0, y: 0, z: 0 },
      sheet: createCharacterSheet({
        id: attackerId,
        name: 'Hero',
        structuredActions: [
          createAction({ id: 'sword', name: 'Sword', toHit: 5, damage: [{ dice: '1d6', bonus: 2, type: 'slashing' }] }),
        ],
      }),
      actions: [], // Legacy field, might be used by find action fallback?
    } as any;

    // Legacy adapter patch: ensure 'actions' exists if code still relies on it
    attacker.actions = attacker.sheet.structuredActions;

    const target = {
      id: targetId,
      position: { x: 5, y: 0, z: 0 },
      sheet: createCharacterSheet({
        id: targetId,
        name: 'Goblin',
        armorClass: 10,
        hp: 10,
        maxHp: 10,
      }),
    } as any;

    state = {
      room: {},
      world: {},
      entities: [attacker, target],
      players: [],
      settings: {} as any,
    };
  });

  it('should dispatch ATTACK and include Execution Trace in event', () => {
    const result = dispatcher.dispatch(state, {
      type: 'ATTACK',
      payload: {
        actorId: attackerId,
        targetId: targetId,
        weaponId: 'sword', // Maps to action ID
      },
    });

    if (!result.success) {
      console.error('Dispatch failed:', result.message);
    }
    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe('ATTACK_RESULT');

    const payload = result.events[0].payload as any;
    expect(payload.trace).toBeDefined();
    // Trace should have at least roll_to_hit
    expect(payload.trace.some((s: any) => s.type === 'roll_to_hit')).toBe(true);

    // Check trace details
    if (payload.isHit) {
      expect(payload.trace.some((s: any) => s.type === 'roll_damage')).toBe(true);
    }
  });
});
