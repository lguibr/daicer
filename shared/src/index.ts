/**
 * Shared package - Types, schemas, and fixtures for Daicer
 */

// Re-export everything from entity modules
export * from './character/index';
export * from './room/index';
export * from './player/index';
export * from './user/index';
export * from './world/history-schema';
// Explicitly export schemas avoiding conflict with world-gen
export { StructureSchema, StructureSizeEnum } from './world/structure-schema';
export type { StructureSize } from './world/structure-schema';
export * from './world/road-schema';
export * from './world/grid-tile-schema';
export { GridFeatureSchema, FeatureTypeEnum, type GridFeature } from './world/grid-feature-schema';
export * from './world/grid-chunk-schema';
export * from './world/biome-schema';
export * from './world/condition-schema';
export * from './world/entity-schema';

// Re-export graph-states (section graph schemas)
export * from './graph-states/index';

// Re-export assets
export * from './assets/index';

// Re-export world-gen
export * from './world-gen/index';
export * from './world/terrain-types';
