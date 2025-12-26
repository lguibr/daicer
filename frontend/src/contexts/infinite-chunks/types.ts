/**
 * Infinite Chunks - TypeScript Types
 * All interfaces and types for the infinite chunk system
 */

import type { ChunkDTO, Tile } from '@daicer/engine';

export type TerrainChunk = Omit<ChunkDTO, 'tiles'> & {
  tiles: Tile[][];
  biomes: string[][];
  structures: unknown[];
  features: unknown[];
  // Legacy flags
  hasCave: boolean;
  hasStructure: boolean;
  generated: boolean;
  isStartingArea: boolean;
  seed: string;
  z: number;
  // grid?: ChunkDTO['grid']; // 3D Grid support
  chunkX: number;
  chunkY: number;
  worldOffsetX: number;
  worldOffsetY: number;
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
  token?: string; // Auth token for backend API
}

export interface InfiniteChunksOptions {
  roomId: string;
  initialGrid: (Tile | null)[][];
  chunkSize?: number;
  loadRadius?: number;
  enabled?: boolean;
  chunkGenerator?: ChunkGenerator;
  // placementMap?: GlobalPlacementMap | null;
  layer?: number;
  token?: string;
}

// ============================================================================
// State
// ============================================================================

export interface InfiniteChunksState {
  // Core data
  chunks: Map<string, TerrainChunk>;
  expandedGrid: (Tile | null)[][];
  gridWorldOffset: { x: number; y: number };

  // Loading state
  loading: Set<string>;
  initialized: boolean;

  // Configuration (immutable after init)
  config: InfiniteChunksConfig;

  // Optional generator (debug mode)
  chunkGenerator?: ChunkGenerator;
  // placementMap?: GlobalPlacementMap | null;
}

// ============================================================================
// Actions
// ============================================================================

export type InfiniteChunksAction =
  | {
      type: 'INITIALIZE';
      payload: {
        initialGrid: (Tile | null)[][];
        config: InfiniteChunksConfig;
        chunkGenerator?: ChunkGenerator;
        // placementMap?: GlobalPlacementMap | null;
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
  expandedGrid: (Tile | null)[][];
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
