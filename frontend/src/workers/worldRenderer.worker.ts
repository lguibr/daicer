/**
 * World Renderer Worker
 * Renders 2D heightmap chunks in OffscreenCanvas to prevent UI freezing
 */

import './utils/threeShim';

interface ChunkTile {
  x: number;
  y: number;
  z: number;
  biome: string;
  elevation: number;
}

interface ChunkData {
  chunkX: number;
  chunkY: number;
  chunkZ: number;
  tiles: ChunkTile[];
  biomes: string[];
}

// Biome colors (matching backend)
const BIOME_COLORS: Record<string, string> = {
  ocean: '#3f76e4',
  deep_ocean: '#1a3a7f',
  frozen_ocean: '#3d57d6',
  beach: '#c4b585',
  river: '#3f76e4',
  lake: '#3f76e4',
  frozen_river: '#3d57d6',
  swamp: '#6a7039',
  mangrove_swamp: '#5c7f42',
  jungle: '#59c93c',
  bamboo_jungle: '#59c93c',
  rainforest: '#4c9c3f',
  tropical_forest: '#79c05a',
  forest: '#79c05a',
  birch_forest: '#88bb67',
  dark_forest: '#507a32',
  taiga: '#86b776',
  snowy_taiga: '#80b497',
  plains: '#91bd59',
  sunflower_plains: '#91bd59',
  meadow: '#83bb6d',
  savanna: '#bfb755',
  badlands: '#90814d',
  desert: '#f5deb3',
  snowy_plains: '#ffffff',
  ice_spikes: '#b0e0f0',
  tundra: '#d0d0d0',
  mountains: '#8ab689',
  snowy_mountains: '#ffffff',
  volcanic: '#4c4c4c',
  mushroom_island: '#55c93f',
  void: '#0f0a1e',
};

const TILE_SIZE = 4;

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 800;
let height = 600;
const chunksCache = new Map<string, ChunkData>();

/**
 * Adjust color brightness
 */
function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.min(255, Math.floor(r * factor));
  const newG = Math.min(255, Math.floor(g * factor));
  const newB = Math.min(255, Math.floor(b * factor));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Render a single chunk
 */
function renderChunk(chunk: ChunkData, offset: { x: number; y: number }, zoomLevel: number): void {
  if (!ctx) return;

  const { tiles } = chunk;
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    if (!tile) {
      // Skip undefined tiles
    } else if (tile.z > tile.elevation + 5) {
      // Only render surface level - skip high elevation
    } else {
      const screenX = tile.x * TILE_SIZE * zoomLevel + offset.x;
      const screenY = tile.y * TILE_SIZE * zoomLevel + offset.y;

      // Skip if outside viewport
      if (
        screenX + TILE_SIZE * zoomLevel >= 0 &&
        screenX <= width &&
        screenY + TILE_SIZE * zoomLevel >= 0 &&
        screenY <= height
      ) {
        // Get biome color
        const biomeColor = BIOME_COLORS[tile.biome] || '#888888';

        // Adjust brightness based on elevation
        const brightness = 0.7 + (tile.elevation / 200) * 0.3;
        const color = adjustBrightness(biomeColor, brightness);

        ctx.fillStyle = color;
        ctx.fillRect(screenX, screenY, TILE_SIZE * zoomLevel, TILE_SIZE * zoomLevel);
      }
    }
  }
}

/**
 * Render all cached chunks
 */
function renderAllChunks(offset: { x: number; y: number }, zoomLevel: number): void {
  if (!ctx || !canvas) return;

  // Clear canvas
  ctx.fillStyle = '#0f0a1e';
  ctx.fillRect(0, 0, width, height);

  // Render all cached chunks using Array.from to avoid iterator issues
  const chunks = Array.from(chunksCache.values());
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk) {
      renderChunk(chunk, offset, zoomLevel);
    }
  }

  // Notify main thread that render is complete
  self.postMessage({ type: 'render-complete' });
}

// Message handler
self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      canvas = data.canvas as OffscreenCanvas;
      ctx = canvas.getContext('2d');
      width = data.width || 800;
      height = data.height || 600;
      console.info('[WorldWorker] Initialized:', { width, height });
      break;

    case 'add-chunk': {
      // Add chunk to cache and render
      const cacheKey = `${data.chunk.chunkX},${data.chunk.chunkY},${data.chunk.chunkZ}`;
      chunksCache.set(cacheKey, data.chunk);
      renderChunk(data.chunk, data.offset, data.zoom);
      break;
    }

    case 'viewport-change':
      // Re-render all chunks with new viewport
      renderAllChunks(data.offset, data.zoom);
      break;

    case 'clear':
      // Clear cache and canvas
      chunksCache.clear();
      if (ctx && canvas) {
        ctx.fillStyle = '#0f0a1e';
        ctx.fillRect(0, 0, width, height);
      }
      break;

    case 'resize':
      width = data.width;
      height = data.height;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
      renderAllChunks(data.offset, data.zoom);
      break;

    default:
      console.warn('[WorldWorker] Unknown message type:', type);
  }
};

export {};
