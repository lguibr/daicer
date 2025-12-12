/**
 * @file shared/state/core/index.ts
 * @description Exports for universal state engine
 */

export { GraphEngine } from './engine';
export { ReducerRegistry, mergeWithRegistry, appendDedupe, upsertById, lastWriterWinsByTs, replace } from './registry';
export type { StateEngine, UpdateMeta, BaseState, Unsubscribe, Reducer } from './types';
