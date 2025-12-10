/**
 * Infinite Chunks - TypeScript Types
 * All interfaces and types for the infinite chunk system
 */

import type { GlobalPlacementMap } from 'daicer/shared/world-gen/structures';
import type { GridChunk, GridTile } from 'daicer/shared/world';

export type TerrainChunk = Omit<GridChunk, 'tiles' | 'biomes'> & {
  tiles: GridTile[][];
  biomes: string[][];
  worldOffsetX: number;
  worldOffsetY: number;
  structures: any[];
};

export interface ChunkGenerator {
  generateChunk: (worldX: number, worldY: number, width: number, height: number) => string[][];
  generateChunk3D?: (worldX: number, worldY: number, width: number, height: number) => string[][][];
}

// ============================================================================
// Configuration
// ============================================================================

export interface InfiniteChunksConfig {
  roomId: string;
  chunkSize: number;
  loadRadius: number;
  enabled: boolean;
  mode: 'backend' | 'generator'; // Backend API or client-side generator
  layer: number; // Z-level
}

export interface InfiniteChunksOptions {
  roomId: string;
  initialGrid: (GridTile | null)[][];
  chunkSize?: number;
  loadRadius?: number;
  enabled?: boolean;
  chunkGenerator?: ChunkGenerator;
  placementMap?: GlobalPlacementMap | null;
  layer?: number;
}

// ============================================================================
// State
// ============================================================================

export interface InfiniteChunksState {
  // Core data
  chunks: Map<string, TerrainChunk>;
  expandedGrid: (GridTile | null)[][];
  gridWorldOffset: { x: number; y: number };

  // Loading state
  loading: Set<string>;
  initialized: boolean;

  // Configuration (immutable after init)
  config: InfiniteChunksConfig;

  // Optional generator (debug mode)
  chunkGenerator?: ChunkGenerator;
  placementMap?: GlobalPlacementMap | null;
}

// ============================================================================
// Actions
// ============================================================================

export type InfiniteChunksAction =
  | {
      type: 'INITIALIZE';
      payload: {
        initialGrid: (GridTile | null)[][];
        config: InfiniteChunksConfig;
        chunkGenerator?: ChunkGenerator;
        placementMap?: GlobalPlacementMap | null;
      };
    }
  | { type: 'CHUNK_LOAD_START'; payload: { chunkKey: string } }
  | { type: 'CHUNK_LOAD_SUCCESS'; payload: { chunk: TerrainChunk } }
  | { type: 'CHUNK_LOAD_ERROR'; payload: { chunkKey: string; error: Error } }
  | { type: 'SET_LOAD_RADIUS'; payload: { radius: number } }
  | { type: 'SET_LAYER'; payload: { layer: number } }
  | { type: 'RESET' };

// ============================================================================
// Context
// ============================================================================

export interface InfiniteChunksContextValue {
  state: InfiniteChunksState;
  dispatch: React.Dispatch<InfiniteChunksAction>;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface InfiniteChunksView {
  expandedGrid: (GridTile | null)[][];
  isLoading: boolean;
  gridWorldOffset: { x: number; y: number };
  loadRadius: number;
  chunks: Map<string, TerrainChunk>;
}

export interface InfiniteChunksActions {
  checkChunkLoading: (playerX: number, playerY: number) => void;
  setLoadRadius: (radius: number) => void;
  setLayer: (layer: number) => void;
  reset: () => void;
}
