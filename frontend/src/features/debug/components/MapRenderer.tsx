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
  onTileClick: (coords: Coordinates) => void;
  onTileHover?: (coords: Coordinates | null) => void;
  isLive?: boolean;
  currentTimeFrame?: any;
}

export const MapRenderer: React.FC<MapRendererProps> = ({
  width,
  height,
  center,
  viewZ,
  scale,
  chunkProvider,
  visibleTiles,
  exploredTiles,
  entities,
  onTileClick,
  onTileHover,
  isLive = true,
  currentTimeFrame = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use provided entities if live, or timeFrame entities if in history
  const renderEntities = !isLive && currentTimeFrame ? currentTimeFrame.gameState.entities : entities;

  // Note: For map tiles, we ideally want to fetch 'historical chunks' but that's expensive.
  // For now, we assume the map terrain is static and only entities move,
  // OR we rely on the parent to provide the correct chunkProvider based on time.
  // We'll stick to static terrain + dynamic entities for MVP.

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

    // Draw Map
    for (let dy = -HALF_H - 1; dy <= HALF_H + 1; dy++) {
      for (let dx = -HALF_W - 1; dx <= HALF_W + 1; dx++) {
        const wx = center.x + dx;
        const wy = center.y + dy;
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
        const screenX = width / 2 + dx * TILE_SIZE - TILE_SIZE / 2;
        const screenY = height / 2 + dy * TILE_SIZE - TILE_SIZE / 2;

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

    // Draw Entities
    renderEntities.forEach((ent: any) => {
      // Only if on same Z level
      if (ent.position.z !== viewZ) return;

      const dx = ent.position.x - center.x;
      const dy = ent.position.y - center.y;

      const screenX = width / 2 + dx * TILE_SIZE;
      const screenY = height / 2 + dy * TILE_SIZE;

      ctx.fillStyle = ent.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, TILE_SIZE * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Stroke for active?
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [width, height, center, viewZ, scale, chunkProvider, visibleTiles, exploredTiles, renderEntities]);

  const getTileCoords = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const TILE_SIZE = 32 * scale;
    const tileX = Math.floor(center.x + (x - width / 2) / TILE_SIZE + 0.5);
    const tileY = Math.floor(center.y + (y - height / 2) / TILE_SIZE + 0.5);

    return { x: tileX, y: tileY, z: viewZ as ZLevel };
  };

  const handleClick = (e: React.MouseEvent) => {
    onTileClick(getTileCoords(e));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (onTileHover) {
      onTileHover(getTileCoords(e));
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onTileHover?.(null)}
      className="block touch-none cursor-crosshair"
    />
  );
};
