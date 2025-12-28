import React, { useRef, useEffect } from 'react';
import type { Coordinates, Chunk, ZLevel } from '../utils/types';

interface ChunkProvider {
  getChunk: (x: number, y: number) => Chunk | null;
}

interface MapRendererProps {
  width: number;
  height: number;
  center: Coordinates;
  viewZ: number;
  scale: number;
  chunkProvider: ChunkProvider; // Changed from generator to interface
  visibleTiles: Set<string>;
  exploredTiles: Set<string>;
  entities: any[];
  ghostEntities?: any[];
  onTileClick: (coords: Coordinates, e: React.MouseEvent) => void;
  onTileDoubleClick?: (coords: Coordinates) => void;
  onTileHover: (coords: Coordinates | null) => void;
  previewPath?: Coordinates[] | null | undefined;
  isLive?: boolean;
  currentTimeFrame?: any;
  onZoom?: (delta: number, mouseX: number, mouseY: number) => void;
  onPan?: (dx: number, dy: number) => void;
}

export function MapRenderer({
  width,
  height,
  center,
  viewZ,
  scale,
  chunkProvider,
  visibleTiles,
  exploredTiles,
  entities,
  ghostEntities = [],
  onTileClick,
  onTileDoubleClick,
  onTileHover,
  isLive = true,
  currentTimeFrame = null,
  previewPath,
  onZoom,
  onPan,
}: MapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Timer for single/double click differentiation
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Drag state
  const isDownRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  // Use provided entities if live, or timeFrame entities if in history
  const renderEntities = !isLive && currentTimeFrame ? currentTimeFrame.gameState.entities : entities;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    const TILE_SIZE = 32 * scale;
    const VIEW_W = Math.ceil(width / TILE_SIZE);
    const VIEW_H = Math.ceil(height / TILE_SIZE);
    const HALF_W = Math.floor(VIEW_W / 2);
    const HALF_H = Math.floor(VIEW_H / 2);

    // Calculate visible tile bounds (integer coordinates)
    const startX = Math.floor(center.x - HALF_W - 1);
    const endX = Math.ceil(center.x + HALF_W + 1);
    const startY = Math.floor(center.y - HALF_H - 1);
    const endY = Math.ceil(center.y + HALF_H + 1);

    // Draw Map
    for (let wy = startY; wy <= endY; wy++) {
      for (let wx = startX; wx <= endX; wx++) {
        const key = `${wx},${wy}`;

        const isExplored = exploredTiles.has(key);
        const isVisible = visibleTiles.has(key);

        if (!isExplored && !isVisible && exploredTiles.size > 0) {
          // Unexplored (Fog of War) - only apply if we have exploration data
          continue;
        }

        // Get Tile Type
        const chunkX = Math.floor(wx / 32);
        const chunkY = Math.floor(wy / 32);
        const chunk = chunkProvider.getChunk(chunkX, chunkY);

        const lx = ((wx % 32) + 32) % 32;
        const ly = ((wy % 32) + 32) % 32;
        // @ts-ignore
        const lz = viewZ + 3; // map -3..3 to 0..6

        if (!chunk || !chunk.tiles[lz] || !chunk.tiles[lz][ly]) continue;
        const tile = chunk.tiles[lz][ly][lx];
        if (!tile) continue;

        // Draw Tile
        let color = '#222';
        // Simple visualization
        if (tile.block === 'water') color = '#1e3a8a';
        else if (tile.block === 'grass') color = '#14532d';
        else if (tile.block === 'stone') color = '#44403c';
        else if (tile.block === 'sand') color = '#d97706';
        else if (tile.block === 'snow') color = '#e5e7eb';
        else if (tile.block === 'stairs_up') color = '#22d3ee';
        else if (tile.block === 'stairs_down') color = '#d946ef';

        // Structures
        if (tile.block.startsWith('wall')) color = '#78716c';
        if (tile.block.startsWith('floor')) color = '#57534e';
        if (tile.block.includes('door')) color = '#854d0e';

        ctx.fillStyle = color;
        // Calculate screen position based on difference from float center
        // Center of screen corresponds to center.x, center.y
        // Tile wx is at world position wx. Screen position is (wx - center.x) * TILE_SIZE
        // But we want top-left of tile?
        // Standard: tiled world 0 is at 0.
        // Screen Center X = width/2.
        // Tile WX's center is at (wx) * TILE_SIZE ?? No, treating wx as top-left grid?
        // Let's assume wx is the coordinate of the tile.
        // Screen X = (wx - center.x) * TILE_SIZE + width / 2;
        // But (wx - center.x) puts 0 at center.
        // We want tile (0,0) to be at center if center=(0,0).
        // If we drawrect at screenX, that's top-left.
        // If center is (0.5, 0.5), tile (0,0) is to the top-left.
        // Screen X = (wx - center.x) * TILE_SIZE + width/2 - TILE_SIZE/2 ?
        // Let's stick to: center tile aligns with center screen.
        // (wx - center.x) is distance in tiles.

        const screenX = (wx - center.x) * TILE_SIZE + width / 2 - TILE_SIZE / 2;
        const screenY = (wy - center.y) * TILE_SIZE + height / 2 - TILE_SIZE / 2;

        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Fog Overlay (if explored but not currently visible)
        if (!isVisible && isExplored) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }

    // Draw Preview Path
    if (previewPath && previewPath.length > 0) {
      ctx.strokeStyle = '#fbbf24'; // Amber-400
      ctx.lineWidth = 3 * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([5 * scale, 5 * scale]); // Dashed line

      ctx.beginPath();
      let first = true;
      for (const pt of previewPath) {
        // Only draw if on same Z
        if (pt.z !== viewZ) continue; // Or draw ghost?

        const valX = (pt.x - center.x) * TILE_SIZE + width / 2;
        const valY = (pt.y - center.y) * TILE_SIZE + height / 2;

        if (first) {
          ctx.moveTo(valX, valY);
          first = false;
        } else {
          ctx.lineTo(valX, valY);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }

    // Draw Entities
    renderEntities.forEach((ent: any) => {
      // Only if on same Z level
      if (ent.position.z !== viewZ) return;

      const screenX = (ent.position.x - center.x) * TILE_SIZE + width / 2;
      const screenY = (ent.position.y - center.y) * TILE_SIZE + height / 2;

      ctx.fillStyle = ent.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, TILE_SIZE * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Stroke for active?
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw Ghost Entities
    ghostEntities.forEach((ent: any) => {
      if (ent.position.z !== viewZ) return;

      const screenX = (ent.position.x - center.x) * TILE_SIZE + width / 2;
      const screenY = (ent.position.y - center.y) * TILE_SIZE + height / 2;

      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = ent.color || '#eab308';
      ctx.beginPath();
      ctx.arc(screenX, screenY, TILE_SIZE * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    });
  }, [
    width,
    height,
    center,
    viewZ,
    scale,
    chunkProvider,
    visibleTiles,
    exploredTiles,
    renderEntities,
    ghostEntities,
    previewPath,
  ]);

  const getTileCoords = (e: React.MouseEvent): Coordinates => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const TILE_SIZE = 32 * scale;
    const tileX = Math.floor(center.x + (x - width / 2) / TILE_SIZE + 0.5);
    const tileY = Math.floor(center.y + (y - height / 2) / TILE_SIZE + 0.5);

    return { x: tileX, y: tileY, z: viewZ as ZLevel };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDownRef.current = true;
    isPanningRef.current = false;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (_e: React.MouseEvent) => {
    isDownRef.current = false;
    // Don't need to do anything else, handleClick uses isPanningRef
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDownRef.current) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;

      // Check threshold if not yet panning
      if (!isPanningRef.current) {
        const dist = Math.sqrt((e.clientX - startPosRef.current.x) ** 2 + (e.clientY - startPosRef.current.y) ** 2);
        if (dist > 5) {
          isPanningRef.current = true;
        }
      }

      if (isPanningRef.current) {
        onPan?.(dx, dy);
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        return; // Skip hover updates while panning
      }
    }

    if (onTileHover && !isPanningRef.current) {
      onTileHover(getTileCoords(e));
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // If we were panning, ignore click
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    // Determine single or double click
    const coords = getTileCoords(e);

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onTileDoubleClick?.(coords);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        onTileClick(coords, e);
        clickTimeoutRef.current = null;
      }, 250); // 250ms delay to wait for potential double click
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (onZoom) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Simple normalizing of delta
      const delta = Math.sign(e.deltaY);
      onZoom(delta, x, y);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={(_e) => {
        isDownRef.current = false;
        onTileHover?.(null);
      }}
      onWheel={handleWheel}
      className={`block touch-none ${isDownRef.current ? 'cursor-grabbing' : 'cursor-crosshair'}`}
    />
  );
}
