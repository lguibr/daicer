/**
 * @file frontend/src/state/core/registry.ts
 * @description Reducer registry (frontend copy)
 */

import type { Reducer } from './types';

export class ReducerRegistry<TState extends Record<string, any>> {
  private map = new Map<keyof TState, Reducer<any>>();

  register<K extends keyof TState>(key: K, reducer: Reducer<TState[K]>): this {
    this.map.set(key, reducer);
    return this;
  }

  get<K extends keyof TState>(key: K): Reducer<TState[K]> | undefined {
    return this.map.get(key) as Reducer<TState[K]> | undefined;
  }
}

export const appendDedupe = <T extends { id: string; ts: number }>(curr: T[], next: T[]): T[] => {
  const byId = new Map<string, T>();
  curr.forEach((x) => byId.set(x.id, x));
  next.forEach((x) => byId.set(x.id, x));
  const result = Array.from(byId.values());
  result.sort((a, b) => a.ts - b.ts);
  return result;
};

export const upsertById = <T extends { id: string }>(curr: T[], next: T[]): T[] => {
  const byId = new Map<string, T>(curr.map((x) => [x.id, x]));
  next.forEach((x) => {
    const existing = byId.get(x.id);
    byId.set(x.id, existing ? { ...existing, ...x } : x);
  });
  return Array.from(byId.values());
};

export const replace = <V>(_curr: V, next: V): V => next;

export function mergeWithRegistry<TState extends Record<string, any>>(
  state: TState,
  partial: Partial<TState>,
  registry: ReducerRegistry<TState>
): TState {
  const next: TState = { ...state };

  (Object.keys(partial) as (keyof TState)[]).forEach((key) => {
    const reducer = registry.get(key) ?? replace;
    const current = state[key];
    const update = partial[key];

    if (typeof update === 'undefined') return;

    (next as any)[key] = reducer(current, update as any);
  });

  return next;
}
