import { create } from 'zustand';
import type { ChunkDTO } from '@daicer/engine';

// Type definition for a tile update (delta)
export interface TileUpdate {
  b?: string; // biome
  t?: string; // blockType
}

// Key format: "x,y" (chunk coords)
type ChunkKey = string;

interface TerrainState {
  // Provenance: The map of loaded chunks
  chunks: Map<ChunkKey, ChunkDTO>;

  // Deltas that are pending upload or optimistic
  // Key: "chunkX,chunkY" -> "z,localY,localX" -> Update
  pendingDeltas: Record<ChunkKey, Record<string, TileUpdate>>;

  // Actions
  setChunk: (x: number, y: number, chunk: ChunkDTO) => void;
  getChunk: (x: number, y: number) => ChunkDTO | undefined;

  // Optimistic update
  setTile: (wx: number, wy: number, z: number, update: TileUpdate) => void;
}

export const useTerrainStore = create<TerrainState>((set, get) => ({
  chunks: new Map(),
  pendingDeltas: {},

  setChunk: (x, y, chunk) => {
    set((state) => {
      const newChunks = new Map(state.chunks);
      newChunks.set(`${x},${y}`, chunk);
      return { chunks: newChunks };
    });
  },

  getChunk: (x, y) => get().chunks.get(`${x},${y}`),

  setTile: (wx, wy, z, update) => {
    const CHUNK_SIZE = 16;
    const chunkX = Math.floor(wx / CHUNK_SIZE);
    const chunkY = Math.floor(wy / CHUNK_SIZE);
    const localX = wx % CHUNK_SIZE; // Handle negative? Usually world is positive 0..1024
    const localY = wy % CHUNK_SIZE;

    // TODO: Verify if we support negative world coords correctly with modulo
    // standard formula: ((a % n) + n) % n

    // Update the ChunkDTO in memory (Optimistic)
    const chunkKey = `${chunkX},${chunkY}`;
    const chunk = get().chunks.get(chunkKey);

    if (chunk) {
      const floor = z + 3;
      // Safe access
      const floorGrid = chunk.tiles[floor];
      if (floorGrid) {
        const row = floorGrid[localY];
        if (row) {
          const tile = row[localX];
          if (tile) {
            // Clone chunk to trigger store update (shallow clone is enough for Map reference change)
            const newChunks = new Map(get().chunks);
            const newChunk = { ...chunk };

            // Mutate tile directly (performance tradeoff vs immutability)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (update.b) tile.biome = update.b as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (update.t) tile.block = update.t as any;

            newChunks.set(chunkKey, newChunk);
            set({ chunks: newChunks });
          }
        }
      }
    }
  },
}));
