/**
 * Grid Map Renderer
 * Infinite chunk-based grid renderer with zoom, pan, and z-layer controls
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Home, Layers, Info } from 'lucide-react';
import type { GridChunk, GridTile, GridFeature, Entity } from '@daicer/shared';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { getSocket } from '../../services/socket';

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

  // Entities state (for Room mode)
  const [entities, setEntities] = useState<Entity[]>([]);

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
  }, [zoom, pan, entityId]);

  /**
   * Load chunks (REST for Assets, Socket for Rooms)
   */
  useEffect(() => {
    if (!entityId) return undefined;

    // Room Mode: Use Socket (Real-time, Entities + Chunks)
    if (entityType === 'room') {
      const socket = getSocket();
      if (!socket) return undefined;

      const range = getVisibleChunkRange();
      if (!range) return undefined;
      const { minChunkX, maxChunkX, minChunkY, maxChunkY } = range;

      // Calculate center and radius
      // This is a rough approximation, ideally we pass bounds to backend, but map:view:query takes radius
      // center in tiles? No, entities use world coords.
      // The socket query expects 'center' and 'radius' (in chunks).

      const centerX = Math.floor((minChunkX + maxChunkX) / 2) * CHUNK_SIZE;
      const centerY = Math.floor((minChunkY + maxChunkY) / 2) * CHUNK_SIZE;
      const radius = Math.max(maxChunkX - minChunkX, maxChunkY - minChunkY) / 2 + 1;

      // Debounce/Throttle could be good here
      const timeoutId = setTimeout(() => {
        socket.emit('map:view:query', {
          roomId: entityId,
          x: centerX,
          y: centerY,
          z: currentLayer,
          radius: Math.ceil(radius),
          viewMode: 'player', // TODO: Pass viewMode prop
        });
      }, 200);

      const onResult = (data: { roomId: string; chunks: GridChunk[]; entities: Entity[] }) => {
        if (data.roomId !== entityId) return;

        setChunkCache((prev) => {
          const next = { ...prev };
          data.chunks.forEach((c) => {
            next[`${c.chunkX}_${c.chunkY}_${c.z}`] = c;
          });
          return next;
        });

        setEntities(data.entities);
      };

      socket.on('map:view:result', onResult);

      return () => {
        clearTimeout(timeoutId);
        socket.off('map:view:result', onResult);
      };
    }

    // Asset Mode: Use REST (Legacy chunk loader)
    if (entityType === 'asset') {
      const loadRestChunks = async () => {
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

        // Fetch loop... (simplified for brevity, previous logic was good)
        for (const pos of chunksToLoad) {
          const url = `${import.meta.env.VITE_API_URL}/api/grid/chunk/${entityId}/${pos.chunkX}/${pos.chunkY}/${pos.z}`;
          try {
            const res = await fetch(url);
            if (res.ok) {
              const chunk: GridChunk = await res.json();
              if (chunk) {
                // API might return { success: true, data: chunk }
                // Adapt if response structure is nested
                // based on my API change: { success: true, data: chunk }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const actualChunk = (chunk as any).data || chunk;
                setChunkCache((prev) => ({ ...prev, [`${pos.chunkX}_${pos.chunkY}_${pos.z}`]: actualChunk }));
              }
            }
          } catch (e) {
            console.error(e);
          } finally {
            setLoadingChunks((prev) => {
              const next = new Set(prev);
              next.delete(`${pos.chunkX}_${pos.chunkY}_${pos.z}`);
              return next;
            });
          }
        }
      };

      loadRestChunks();
    }
    return undefined;
  }, [entityId, entityType, currentLayer, zoom, pan, getVisibleChunkRange, chunkCache, loadingChunks]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    contextRef.current = ctx;
    canvas.width = 1024;
    canvas.height = 768;

    // Initial font config
    ctx.font = '10px serif';
  }, []);

  /**
   * Render grid
   */
  useEffect(() => {
    if (!entityId) return;

    const ctx = contextRef.current;
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Apply transform
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw visible chunks
    const range = getVisibleChunkRange();
    if (range) {
      const { minChunkX, maxChunkX, minChunkY, maxChunkY } = range;

      // Phase 1: Layered Rendering Loop
      // Render from bottom (-3) to top (+3) or just a window around currentLayer?
      // Spec says: "depth stack".
      // Let's render everything from -3 to +3, but carefully.
      // Optimization: Only render currentLayer - 3 to currentLayer + 1?
      // Let's stick to full range for correctness first, optimize later.
      const minZ = Math.max(-3, currentLayer - 3);
      const maxZ = Math.min(3, currentLayer + 1); // Only see 1 layer above (ghosts)

      for (let z = minZ; z <= maxZ; z++) {
        // Style for this layer
        const isCurrent = z === currentLayer;
        const isBelow = z < currentLayer;
        const isAbove = z > currentLayer;

        ctx.save();

        if (isBelow) {
          // Dimmer and blue-tinted for depth
          // We can't easily tint via canvas API without composition or filter
          // Use filter for brightness
          const depth = currentLayer - z;
          const brightness = Math.max(0.3, 1 - depth * 0.2); // 0.8, 0.6, 0.4
          ctx.filter = `brightness(${brightness * 100}%)`;
          // Also simpler: just globalAlpha?
        } else if (isAbove) {
          // Ghost mode
          ctx.globalAlpha = 0.4;
        } else {
          // Current layer: Normal
          ctx.filter = 'none';
          ctx.globalAlpha = 1.0;
        }

        for (let cy = minChunkY; cy <= maxChunkY; cy++) {
          for (let cx = minChunkX; cx <= maxChunkX; cx++) {
            const chunkKey = `${cx}_${cy}_${z}`;
            const chunk = chunkCache[chunkKey];

            if (chunk) {
              drawChunk(ctx, chunk);
            } else if (isCurrent) {
              // Only draw loading placeholder for CURRENT layer
              drawLoadingChunk(ctx, cx, cy);
            }
          }
        }

        ctx.restore();
      }
    }

    // Draw Entities (Room Mode only)
    if (entityType === 'room') {
      entities.forEach((entity) => {
        // Draw entities if they are on the layers we just drew?
        // Or just current layer?
        // Spec: "Ghost Entity" logic.

        const z = entity.z || 0;
        if (z < currentLayer - 3 || z > currentLayer + 1) return; // Out of view

        ctx.save();
        if (z < currentLayer) {
          ctx.filter = 'brightness(50%)';
          ctx.globalAlpha = 0.7;
          // Draw slightly smaller? handled in drawEntity maybe?
          // Just standard scaling for now.
        } else if (z > currentLayer) {
          ctx.globalAlpha = 0.4;
        }

        // Only draw if we have roughly filtered visibility logic
        // But drawEntity uses screen coords, so we are good.
        // Wait, drawEntity assumes current transform.
        drawEntity(ctx, entity);

        ctx.restore();
      });
    }

    // Draw player position override if provided (legacy/preview)
    if (playerPosition) {
      const { z } = playerPosition;
      if (z >= currentLayer - 3 && z <= currentLayer + 1) {
        drawPlayer(ctx, playerPosition.x, playerPosition.y);
      }
    }

    ctx.restore();
  }, [entityId, chunkCache, currentLayer, zoom, pan, playerPosition, getVisibleChunkRange, entities, entityType]);

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
            {Object.keys(chunkCache).length} chunks | {entities.length} entities | Zoom: {zoom.toFixed(1)}x
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ... drawChunk, drawLoadingChunk ...

function drawEntity(ctx: CanvasRenderingContext2D, entity: Entity): void {
  const screenX = entity.x * TILE_SIZE;
  const screenY = entity.y * TILE_SIZE;

  // Draw base
  ctx.beginPath();
  ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 1.5, 0, Math.PI * 2);

  // Color based on type
  if (entity.type === 'player') ctx.fillStyle = entity.color || '#3b82f6';
  else if (entity.type === 'npc') ctx.fillStyle = entity.color || '#ef4444';
  else if (entity.type === 'memory')
    ctx.fillStyle = '#8b5cf6'; // Purple for memory
  else ctx.fillStyle = '#10b981';

  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Icon or Initial
  ctx.fillStyle = '#ffffff';
  ctx.font = '6px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let label = entity.name.substring(0, 1).toUpperCase();
  if (entity.type === 'memory') label = '?';

  ctx.fillText(label, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
}

/**
 * Draw a chunk on canvas
 */
function drawChunk(ctx: CanvasRenderingContext2D, chunk: GridChunk): void {
  if (!chunk || !chunk.tiles) return;

  for (const tile of chunk.tiles) {
    const screenX = tile.x * TILE_SIZE;
    const screenY = tile.y * TILE_SIZE;

    // Get tile color based on block type
    const color = getBlockColor(tile.blockType);
    ctx.fillStyle = color;
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  }

  // Draw features
  for (const feature of chunk.features) {
    const screenX = feature.position.x * TILE_SIZE;
    const screenY = feature.position.y * TILE_SIZE;

    ctx.fillStyle = getFeatureColor(feature.type);
    ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  }
}

/**
 * Draw loading placeholder for chunk
 */
function drawLoadingChunk(ctx: CanvasRenderingContext2D, chunkX: number, chunkY: number): void {
  const screenX = chunkX * CHUNK_SIZE * TILE_SIZE;
  const screenY = chunkY * CHUNK_SIZE * TILE_SIZE;
  const size = CHUNK_SIZE * TILE_SIZE;

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
