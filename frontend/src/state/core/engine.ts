/**
 * @file frontend/src/state/core/engine.ts
 * @description Universal GraphEngine (frontend copy)
 */

import { produceWithPatches, enablePatches, type Draft, type Patch } from 'immer';
import type { StateEngine, UpdateMeta, BaseState, Unsubscribe } from './types';
import { ReducerRegistry, mergeWithRegistry } from './registry';

enablePatches();

type Listener<T> = (state: T) => void;

export class GraphEngine<TState extends BaseState> implements StateEngine<TState> {
  private state: TState;

  private listeners = new Set<Listener<TState>>();

  private validateFn: (state: any) => TState;

  private registry: ReducerRegistry<TState>;

  constructor(initial: Partial<TState>, validateFn: (state: any) => TState, registry: ReducerRegistry<TState>) {
    this.validateFn = validateFn;
    this.registry = registry;
    this.state = Object.freeze(validateFn(initial)) as TState;
  }

  getState(): Readonly<TState> {
    return this.state;
  }

  subscribe(listener: Listener<TState>): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  apply(partial: Partial<TState>, meta: UpdateMeta = {}): TState {
    let merged = mergeWithRegistry(this.state, partial, this.registry);
    merged = { ...merged, version: this.state.version + 1 } as TState;

    if (meta.eventId) {
      merged = { ...merged, lastEventId: meta.eventId } as TState;
    }

    this.state = Object.freeze(this.validateFn(merged)) as TState;
    this.emit();

    return this.state;
  }

  transaction(mutator: (draft: Draft<TState>) => void): { state: TState; patches: Patch[] } {
    const [next, patches] = produceWithPatches(this.state, (draft: any) => {
      mutator(draft);
    });

    const bumped = { ...next, version: this.state.version + 1 } as TState;
    this.state = Object.freeze(this.validateFn(bumped)) as TState;
    this.emit();

    return { state: this.state, patches };
  }

  protected mapEventToPartial(_evt: { id: string; ts: number; type: string; payload: any }): Partial<TState> {
    return {};
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
