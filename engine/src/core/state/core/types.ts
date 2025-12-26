/**
 * @file shared/state/core/types.ts
 * @description Base types for universal state engine
 */

import type { Patch, Draft } from 'immer';

export interface StateEngine<T> {
  getState(): Readonly<T>;
  subscribe(listener: (s: T) => void): () => void;
  apply(partial: Partial<T>, meta?: UpdateMeta): T;
  transaction(mutator: (draft: Draft<T>) => void): { state: T; patches: Patch[] };
}

export interface UpdateMeta {
  reason?: string;
  eventId?: string | null;
}

export interface BaseState {
  version: number;
  lastEventId: string | null;
}

export type Unsubscribe = () => void;

export type Reducer<V> = (current: V, update: V) => V;
