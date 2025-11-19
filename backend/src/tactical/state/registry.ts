/**
 * @file backend/src/tactical/state/registry.ts
 * @description Reducer registry for tactical state merges
 */

// Note: Using direct replacement for log/diceHistory arrays
// The shared registry helpers require 'ts' property but our schemas use 'timestamp'
// For now, using simple replace semantics
import type { TacticalState } from './schema';

/**
 * Tactical reducer registry mirroring LangGraph semantics
 */
// Simplified reducers - replace semantics for now
export function mergeTacticalState(current: TacticalState, update: Partial<TacticalState>): TacticalState {
  return {
    ...current,
    ...update,
    // Arrays use replace semantics
    log: update.log !== undefined ? update.log : current.log,
    diceHistory: update.diceHistory !== undefined ? update.diceHistory : current.diceHistory,
    units: update.units !== undefined ? update.units : current.units,
  };
}
