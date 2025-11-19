/**
 * @file shared/state/core/engine.ts
 * @description Universal GraphEngine with Immer + validation + versioning
 */

import { produceWithPatches, enablePatches, type Draft, type Patch } from 'immer';
import type { ZodSchema } from 'zod';
import type { StateEngine, UpdateMeta, Unsubscribe, BaseState } from './types';
import { ReducerRegistry, mergeWithRegistry } from './registry';

enablePatches();

type Listener<T> = (state: T) => void;

export class GraphEngine<TState extends BaseState> implements StateEngine<TState> {
  private state: TState;
  private listeners = new Set<Listener<TState>>();
  private processedEvents = new Set<string>();
  private schema: ZodSchema<TState>;
  private registry: ReducerRegistry<TState>;

  constructor(initial: Partial<TState>, schema: ZodSchema<TState>, registry: ReducerRegistry<TState>) {
    this.schema = schema;
    this.registry = registry;

    // Parse and validate initial state
    const parsed = this.schema.safeParse(initial);
    if (!parsed.success) {
      throw new Error(`GraphEngine initialization failed: ${parsed.error.message}`);
    }

    this.state = Object.freeze(parsed.data) as TState;
  }

  getState(): Readonly<TState> {
    return this.state;
  }

  subscribe(listener: Listener<TState>): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Apply partial state update with LangGraph-style merge
   */
  apply(partial: Partial<TState>, meta: UpdateMeta = {}): TState {
    let merged = mergeWithRegistry(this.state, partial, this.registry);

    // Bump version
    merged = { ...merged, version: this.state.version + 1 } as TState;

    // Store event ID if provided
    if (meta.eventId) {
      merged = { ...merged, lastEventId: meta.eventId } as TState;
    }

    // Validate full state
    const parsed = this.schema.safeParse(merged);
    if (!parsed.success) {
      throw new Error(`GraphEngine.apply validation failed: ${parsed.error.message}`);
    }

    this.state = Object.freeze(parsed.data) as TState;
    this.emit();

    return this.state;
  }

  /**
   * Mutable-feel transactional API using Immer drafts
   */
  transaction(mutator: (draft: Draft<TState>) => void): { state: TState; patches: Patch[] } {
    const [next, patches] = produceWithPatches(this.state, (draft) => {
      mutator(draft);
    });

    // Bump version
    const bumped = { ...next, version: this.state.version + 1 } as TState;

    // Validate
    const parsed = this.schema.safeParse(bumped);
    if (!parsed.success) {
      throw new Error(`GraphEngine.transaction validation failed: ${parsed.error.message}`);
    }

    this.state = Object.freeze(parsed.data) as TState;
    this.emit();

    return { state: this.state, patches };
  }

  /**
   * IoT-style event ingestion with idempotency
   */
  ingestEvent(evt: { id: string; ts: number; type: string; payload: any }): TState {
    // Deduplicate by event ID
    if (this.processedEvents.has(evt.id)) {
      return this.state;
    }

    // Map event to partial state update (implement in subclasses)
    const partial = this.mapEventToPartial(evt);
    const next = this.apply(partial, { reason: evt.type, eventId: evt.id });

    this.processedEvents.add(evt.id);

    // Optional: trim memory if too many events tracked
    if (this.processedEvents.size > 50_000) {
      this.processedEvents.clear();
      this.processedEvents.add(evt.id);
    }

    return next;
  }

  /**
   * Override in subclasses to map domain-specific events
   */
  protected mapEventToPartial(_evt: { id: string; ts: number; type: string; payload: any }): Partial<TState> {
    // Default: no mapping
    return {};
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
