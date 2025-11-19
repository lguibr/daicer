/**
 * @file frontend/src/state/TacticalEngine.ts
 * @description Frontend tactical state engine with Immer + validation
 */

import { GraphEngine } from './core/engine';
import type { TacticalState } from '../types/tactical';
import { ReducerRegistry, appendDedupe, upsertById, replace } from './core/registry';

// Tactical reducer registry
const tacticalRegistry = new ReducerRegistry<TacticalState>()
  .register('log', appendDedupe)
  .register('diceHistory', appendDedupe)
  .register('units', upsertById)
  .register('turnOrder', replace)
  .register('arena', replace)
  .register('parsedCommand', replace)
  .register('actionPlan', replace)
  .register('phase', replace)
  .register('round', replace)
  .register('activeUnitId', replace)
  .register('pendingCommand', replace)
  .register('isCombatOver', replace)
  .register('winner', replace)
  .register('encounterId', replace)
  .register('arenaId', replace)
  .register('diceRollerSeed', replace)
  .register('version', replace)
  .register('lastEventId', replace);

// Simple validation (just ensure required fields)
function validateTacticalState(state: any): TacticalState {
  return {
    version: state.version ?? 0,
    lastEventId: state.lastEventId ?? null,
    encounterId: state.encounterId ?? 'new',
    arenaId: state.arenaId ?? '',
    phase: state.phase ?? 'setup',
    arena: state.arena ?? null,
    units: state.units ?? [],
    turnOrder: state.turnOrder ?? [],
    activeUnitId: state.activeUnitId ?? null,
    round: state.round ?? 0,
    pendingCommand: state.pendingCommand ?? null,
    parsedCommand: state.parsedCommand ?? null,
    actionPlan: state.actionPlan ?? null,
    isCombatOver: state.isCombatOver ?? false,
    winner: state.winner ?? null,
    log: state.log ?? [],
    diceHistory: state.diceHistory ?? [],
    diceRollerSeed: state.diceRollerSeed ?? Date.now(),
  };
}

/**
 * Tactical state engine for frontend
 * Extends universal GraphEngine with tactical-specific defaults
 */
export class TacticalEngine extends GraphEngine<TacticalState> {
  constructor(initial: Partial<TacticalState>) {
    const withDefaults: Partial<TacticalState> = {
      encounterId: 'new',
      arenaId: '',
      diceRollerSeed: Date.now(),
      ...initial,
    };

    super(withDefaults, validateTacticalState, tacticalRegistry);
  }

  /**
   * Helper: Add a unit to the encounter
   */
  addUnit(unit: TacticalState['units'][0]): TacticalState {
    return this.transaction((draft) => {
      draft.units.push(unit);
    }).state;
  }

  /**
   * Helper: Remove a unit
   */
  removeUnit(unitId: string): TacticalState {
    return this.transaction((draft) => {
      draft.units = draft.units.filter((u: any) => u.id !== unitId);
    }).state;
  }

  /**
   * Helper: Update unit position
   */
  moveUnit(unitId: string, position: { x: number; y: number }): TacticalState {
    return this.transaction((draft) => {
      const unit = draft.units.find((u: any) => u.id === unitId);
      if (unit) {
        unit.position = position;
      }
    }).state;
  }

  /**
   * Helper: Submit a natural language command
   */
  submitCommand(command: string): TacticalState {
    return this.apply({ pendingCommand: command });
  }

  /**
   * Helper: Advance to next turn
   */
  nextTurn(): TacticalState {
    return this.transaction((draft) => {
      if (!draft.turnOrder.length) return;

      const currentIndex = draft.turnOrder.indexOf(draft.activeUnitId || '');
      const nextIndex = (currentIndex + 1) % draft.turnOrder.length;

      // If we've wrapped around, increment round
      if (nextIndex === 0) {
        draft.round++;
      }

      draft.activeUnitId = draft.turnOrder[nextIndex] || null;

      // Reset action economy for active unit
      const activeUnit = draft.units.find((u: any) => u.id === draft.activeUnitId);
      if (activeUnit) {
        activeUnit.hasAction = true;
        activeUnit.hasBonusAction = true;
        activeUnit.hasReaction = true;
        activeUnit.hasMoved = false;
        activeUnit.hasActed = false;
        activeUnit.movementRemaining = activeUnit.speed;
      }
    }).state;
  }
}
