/**
 * Grid Map Renderer
 * Infinite chunk-based grid renderer with zoom, pan, and z-layer controls
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Home, Layers, Info } from 'lucide-react';
import type { GridChunk, GridTile, GridFeature } from '@daicer/shared';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { auth } from '../../services/firebase';

interface GridMapRendererProps {
  roomId?: string; // For gameplay/room maps
  assetId?: string; // For asset previews (mutually exclusive with roomId)
  currentLayer: number; // Z-index (-6 to +5)
  playerPosition?: { x: number; y: number; z: number };
  onTileClick?: (tile: GridTile, features: GridFeature[]) => void;
  className?: string;
}

interface ChunkCache {
  [key: string]: GridChunk; // Key: "chunkX_chunkY_z"
}

const TILE_SIZE = 8; // 8x8 pixels per tile
const CHUNK_SIZE = 8; // 8x8 tiles per chunk

/**
 * Grid Map Renderer Component
 * Renders infinite grid world with chunk-based loading
 */
export function GridMapRenderer({
  roomId,
  assetId,
  currentLayer,
  playerPosition,
  onTileClick,
  className = '',
}: GridMapRendererProps) {
  // ALL HOOKS MUST BE BEFORE CONDITIONAL RETURNS
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [chunkCache, setChunkCache] = useState<ChunkCache>({});
  const [loadingChunks, setLoadingChunks] = useState<Set<string>>(new Set());

  // Use whichever ID is provided (room or asset)
  const entityId = roomId || assetId;
  const entityType = roomId ? 'room' : 'asset';

  /**
   * Calculate which chunks are visible in viewport
   */
  const getVisibleChunkRange = useCallback(() => {
    if (!entityId) return null;
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const viewWidth = canvas.width / zoom;
    const viewHeight = canvas.height / zoom;
    const viewX = -pan.x / zoom;
    const viewY = -pan.y / zoom;

    const minChunkX = Math.floor(viewX / (CHUNK_SIZE * TILE_SIZE)) - 1;
    const maxChunkX = Math.ceil((viewX + viewWidth) / (CHUNK_SIZE * TILE_SIZE)) + 1;
    const minChunkY = Math.floor(viewY / (CHUNK_SIZE * TILE_SIZE)) - 1;
    const maxChunkY = Math.ceil((viewY + viewHeight) / (CHUNK_SIZE * TILE_SIZE)) + 1;

    return { minChunkX, maxChunkX, minChunkY, maxChunkY };
  }, [zoom, pan]);

  /**
   * Load chunks that are visible but not in cache
   */
  const loadVisibleChunks = useCallback(async () => {
    if (!entityId) return;
    const range = getVisibleChunkRange();
    if (!range) return;

    const { minChunkX, maxChunkX, minChunkY, maxChunkY } = range;
    const chunksToLoad: Array<{ chunkX: number; chunkY: number; z: number }> = [];

    for (let cy = minChunkY; cy <= maxChunkY; cy++) {
      for (let cx = minChunkX; cx <= maxChunkX; cx++) {
        const chunkKey = `${cx}_${cy}_${currentLayer}`;

        if (!chunkCache[chunkKey] && !loadingChunks.has(chunkKey)) {
          chunksToLoad.push({ chunkX: cx, chunkY: cy, z: currentLayer });
          setLoadingChunks((prev) => new Set(prev).add(chunkKey));
        }
      }
    }

    if (chunksToLoad.length === 0) return;

    // Get auth token once for all requests (skip in Storybook/test mode)
    let token: string | undefined;

    try {
      token = await auth.currentUser?.getIdToken();
    } catch (error) {
      // Storybook/test mode - no Firebase auth
      console.warn('[GridMapRenderer] ⚠️ No Firebase auth (Storybook mode), continuing without token');
    }

    console.log(
      '[GridMapRenderer] Auth status:',
      token ? '✅ Token obtained' : '⚠️ No token (Storybook mode)',
      'Loading',
      chunksToLoad.length,
      'chunks'
    );

    // Load chunks from backend
    for (const pos of chunksToLoad) {
      const url = `${import.meta.env.VITE_API_URL}/api/grid/chunk/${entityId}/${pos.chunkX}/${pos.chunkY}/${pos.z}`;
      console.log('[GridMapRenderer] Fetching chunk:', url, `(${entityType} mode)`);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          console.error(`Failed to load chunk: ${response.status}`);
          continue;
        }

        const chunk: GridChunk = await response.json();

        console.log('[GridMapRenderer] 🎉 Chunk received from backend:', {
          chunkX: chunk.chunkX,
          chunkY: chunk.chunkY,
          z: chunk.z,
          tiles: chunk.tiles?.length,
          features: chunk.features?.length,
          biomes: chunk.biomes,
          sampleTiles: chunk.tiles?.slice(0, 3).map((t) => ({
            x: t.x,
            y: t.y,
            blockType: t.blockType,
            biome: t.biome,
          })),
        });

        setChunkCache((prev) => ({
          ...prev,
          [`${pos.chunkX}_${pos.chunkY}_${pos.z}`]: chunk,
        }));

        console.log('[GridMapRenderer] ✅ Chunk added to cache, total cached:', Object.keys(chunkCache).length + 1);
      } catch (error) {
        console.error(`Failed to load chunk ${pos.chunkX},${pos.chunkY},${pos.z}:`, error);
      } finally {
        setLoadingChunks((prev) => {
          const next = new Set(prev);
          next.delete(`${pos.chunkX}_${pos.chunkY}_${pos.z}`);
          return next;
        });
      }
    }
  }, [entityId, currentLayer, getVisibleChunkRange, chunkCache, loadingChunks, entityType]);

  // Initialize canvas
  useEffect(() => {
    console.log('[GridMapRenderer] Initializing canvas...');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[GridMapRenderer] Canvas ref is null!');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[GridMapRenderer] Failed to get 2d context!');
      return;
    }

    contextRef.current = ctx;
    canvas.width = 1024;
    canvas.height = 768;
    console.log('[GridMapRenderer] Canvas initialized:', { width: 1024, height: 768 });
  }, []);

  // Load visible chunks
  useEffect(() => {
    if (!entityId) return;

    console.log('[GridMapRenderer] Load visible chunks effect triggered', {
      currentLayer,
      entityId,
      hasContext: !!contextRef.current,
    });

    if (!contextRef.current) {
      console.warn('[GridMapRenderer] Context not ready, skipping chunk load');
      return;
    }

    loadVisibleChunks();
  }, [entityId, currentLayer, pan, zoom, loadVisibleChunks]);

  /**
   * Render grid
   */
  useEffect(() => {
    if (!entityId) return;

    console.log('[GridMapRenderer] Render effect triggered', {
      chunkCacheSize: Object.keys(chunkCache).length,
      currentLayer,
      zoom,
      pan,
    });

    const ctx = contextRef.current;
    if (!ctx) {
      console.warn('[GridMapRenderer] No context for rendering');
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    console.log('[GridMapRenderer] Canvas cleared');

    // Apply transform
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw visible chunks
    const range = getVisibleChunkRange();
    if (range) {
      const { minChunkX, maxChunkX, minChunkY, maxChunkY } = range;
      console.log('[GridMapRenderer] Drawing chunks in range:', { minChunkX, maxChunkX, minChunkY, maxChunkY });

      let drawnCount = 0;
      let loadingCount = 0;

      for (let cy = minChunkY; cy <= maxChunkY; cy++) {
        for (let cx = minChunkX; cx <= maxChunkX; cx++) {
          const chunkKey = `${cx}_${cy}_${currentLayer}`;
          const chunk = chunkCache[chunkKey];

          if (chunk) {
            drawChunk(ctx, chunk);
            drawnCount++;
          } else {
            drawLoadingChunk(ctx, cx, cy);
            loadingCount++;
          }
        }
      }

      console.log('[GridMapRenderer] Render complete:', { drawnCount, loadingCount });
    } else {
      console.warn('[GridMapRenderer] No visible range calculated for rendering');
    }

    // Draw player position if provided
    if (playerPosition && playerPosition.z === currentLayer) {
      console.log('[GridMapRenderer] Drawing player at:', playerPosition);
      drawPlayer(ctx, playerPosition.x, playerPosition.y);
    }

    ctx.restore();
  }, [entityId, chunkCache, currentLayer, zoom, pan, playerPosition, getVisibleChunkRange]);

  /**
   * Handle canvas click (tile selection)
   */
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!entityId || !onTileClick) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      // Convert to tile coordinates
      const tileX = Math.floor(x / TILE_SIZE);
      const tileY = Math.floor(y / TILE_SIZE);

      // Find the chunk and tile
      const chunkX = Math.floor(tileX / CHUNK_SIZE);
      const chunkY = Math.floor(tileY / CHUNK_SIZE);
      const chunkKey = `${chunkX}_${chunkY}_${currentLayer}`;
      const chunk = chunkCache[chunkKey];

      if (chunk) {
        const tile = chunk.tiles.find((t) => t.x === tileX && t.y === tileY);
        if (tile) {
          const features = chunk.features.filter((f) => f.position.x === tileX && f.position.y === tileY);
          onTileClick(tile, features);
        }
      }
    },
    [entityId, zoom, pan, currentLayer, chunkCache, onTileClick]
  );

  // Conditional return AFTER all hooks
  if (!entityId) {
    console.error('[GridMapRenderer] ❌ Neither roomId nor assetId provided!');
    return null;
  }

  console.log(`[GridMapRenderer] Initialized in ${entityType} mode`, { entityId, currentLayer });

  return (
    <Card className={className} data-testid="grid-map-renderer">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {entityType === 'asset' ? 'Asset Preview' : 'Grid World'} (Layer {currentLayer})
          </span>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom((z) => Math.max(z / 1.2, 0.25))}
              data-testid="zoom-out-button"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              data-testid="reset-view-button"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom((z) => Math.min(z * 1.2, 5))}
              data-testid="zoom-in-button"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative overflow-hidden rounded border border-border bg-muted">
          <canvas
            ref={canvasRef}
            className="cursor-move"
            onClick={handleCanvasClick}
            onMouseDown={(e) => {
              setIsPanning(true);
              setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
              }
            }}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
            data-testid="grid-canvas"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>
            {Object.keys(chunkCache).length} chunks loaded | Zoom: {zoom.toFixed(1)}x | Layer: {currentLayer}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Draw a chunk on canvas
 */
function drawChunk(ctx: CanvasRenderingContext2D, chunk: GridChunk): void {
  if (!chunk || !chunk.tiles) {
    console.error('[GridMapRenderer] ❌ Invalid chunk:', chunk);
    return;
  }

  console.log('[GridMapRenderer] 🎨 Drawing chunk:', {
    chunkX: chunk.chunkX,
    chunkY: chunk.chunkY,
    z: chunk.z,
    tiles: chunk.tiles.length,
    features: chunk.features?.length || 0,
    sampleTile: chunk.tiles[0],
  });

  let tilesDrawn = 0;
  for (const tile of chunk.tiles) {
    const screenX = tile.x * TILE_SIZE;
    const screenY = tile.y * TILE_SIZE;

    // Get tile color based on block type
    const color = getBlockColor(tile.blockType);
    ctx.fillStyle = color;
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    tilesDrawn++;

    // Log first tile to verify drawing
    if (tilesDrawn === 1) {
      console.log(
        `[GridMapRenderer] First tile: x=${screenX}, y=${screenY}, color=${color}, blockType=${tile.blockType}`
      );
    }
  }

  console.log(`[GridMapRenderer] ✅ Drew ${tilesDrawn} tiles for chunk (${chunk.chunkX}, ${chunk.chunkY})`);

  // Draw features
  for (const feature of chunk.features) {
    const screenX = feature.position.x * TILE_SIZE;
    const screenY = feature.position.y * TILE_SIZE;

    ctx.fillStyle = getFeatureColor(feature.type);
    ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  }

  if (chunk.features.length > 0) {
    console.log(
      `[GridMapRenderer] Drew ${chunk.features.length} features for chunk (${chunk.chunkX}, ${chunk.chunkY})`
    );
  }
}

/**
 * Draw loading placeholder for chunk
 */
function drawLoadingChunk(ctx: CanvasRenderingContext2D, chunkX: number, chunkY: number): void {
  const screenX = chunkX * CHUNK_SIZE * TILE_SIZE;
  const screenY = chunkY * CHUNK_SIZE * TILE_SIZE;
  const size = CHUNK_SIZE * TILE_SIZE;

  console.log('[GridMapRenderer] Drawing loading placeholder for chunk:', { chunkX, chunkY, screenX, screenY, size });

  ctx.fillStyle = 'rgba(50, 50, 50, 0.3)';
  ctx.fillRect(screenX, screenY, size, size);

  ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
  ctx.strokeRect(screenX, screenY, size, size);
}

/**
 * Draw player position
 */
function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const screenX = x * TILE_SIZE;
  const screenY = y * TILE_SIZE;

  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFA500';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Get color for block type
 */
function getBlockColor(blockType: string): string {
  const colors: Record<string, string> = {
    air: '#87CEEB',
    water: '#1E6BB8',
    ice: '#B0E0E6',
    grass: '#8BC34A',
    dirt: '#8B4513',
    stone: '#808080',
    sand: '#F4E4C1',
    gravel: '#A9A9A9',
    clay: '#D2691E',
    snow: '#FFFFFF',
    packed_ice: '#B0C4DE',
    sandstone: '#E6D7B8',
    terracotta: '#C8734D',
    red_sand: '#D84315',
    podzol: '#6B4423',
    mycelium: '#9C27B0',
    basalt: '#2F2F2F',
    blackstone: '#1A1A1A',
    mud: '#5D4E37',
    deepslate: '#4A4A4A',
    bedrock: '#2C2C2C',
    coal_ore: '#3A3A3A',
    iron_ore: '#CD853F',
    gold_ore: '#FFD700',
    diamond_ore: '#00CED1',
    emerald_ore: '#50C878',
    lapis_ore: '#1E90FF',
    redstone_ore: '#DC143C',
  };

  return colors[blockType] || '#808080';
}

/**
 * Get color for feature type
 */
function getFeatureColor(featureType: string): string {
  const colors: Record<string, string> = {
    tree: '#2E7D32',
    creature: '#D32F2F',
    resource: '#FFD700',
    npc: '#1976D2',
    item: '#9C27B0',
    hazard: '#F57C00',
    decoration: '#757575',
    structure_marker: '#00BCD4',
  };

  return colors[featureType] || '#888888';
}
