/**
 * @file frontend/src/providers/TacticalProvider.tsx
 * @description React context provider for tactical state
 */

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { TacticalEngine } from '../state/TacticalEngine';
import type { TacticalState } from '../types/tactical';

interface TacticalContextValue {
  engine: TacticalEngine;
}

const TacticalContext = createContext<TacticalContextValue | null>(null);

interface TacticalProviderProps {
  children: ReactNode;
  initialState: Partial<TacticalState>;
}

export function TacticalProvider({ children, initialState }: TacticalProviderProps) {
  const engine = useMemo(() => new TacticalEngine(initialState), [initialState]);
  const value = useMemo(() => ({ engine }), [engine]);

  return <TacticalContext.Provider value={value}>{children}</TacticalContext.Provider>;
}

function useTacticalContext(): TacticalContextValue {
  const context = useContext(TacticalContext);
  if (!context) {
    throw new Error('useTacticalContext must be used within TacticalProvider');
  }
  return context;
}

/**
 * Hook to access tactical state with optional selector
 */
export function useTacticalState<T = TacticalState>(selector?: (state: TacticalState) => T): T {
  const { engine } = useTacticalContext();

  const subscribe = (callback: () => void) => engine.subscribe(() => callback());

  const getSnapshot = () => engine.getState();

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

 
  return (selector ? selector(state) : (state as any)) as T;
}

/**
 * Hook to access tactical actions
 */
export function useTacticalActions() {
  const { engine } = useTacticalContext();

  return {
    // Core engine methods
    applyPartial: (partial: Partial<TacticalState>, meta?: { reason?: string; eventId?: string | null }) =>
      engine.apply(partial, meta),
 
    transaction: (mutator: (draft: any) => void) => engine.transaction(mutator),

    // Helper methods
    addUnit: (unit: TacticalState['units'][0]) => engine.addUnit(unit),
    removeUnit: (unitId: string) => engine.removeUnit(unitId),
    moveUnit: (unitId: string, position: { x: number; y: number }) => engine.moveUnit(unitId, position),
    submitCommand: (command: string) => engine.submitCommand(command),
    nextTurn: () => engine.nextTurn(),
  };
}

/**
 * Hook to get the raw engine instance (use sparingly)
 */
export function useTacticalEngine(): TacticalEngine {
  const { engine } = useTacticalContext();
  return engine;
}
