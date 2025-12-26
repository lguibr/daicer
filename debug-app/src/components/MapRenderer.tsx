import React, { useRef, useEffect } from 'react';
import { WorldGenerator, type Coordinates, type ZLevel } from '@daicer/engine';

interface MapRendererProps {
  width: number;
  height: number;
  center: Coordinates;
  viewZ: number;
  scale: number;
  generator: WorldGenerator;
  visibleTiles: Set<string>;
  exploredTiles: Set<string>;
  entities: any[];
  onTileClick: (coords: Coordinates) => void;
}

export const MapRenderer: React.FC<MapRendererProps> = ({
  width,
  height,
  center,
  viewZ,
  scale,
  generator,
  visibleTiles,
  exploredTiles,
  entities,
  onTileClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

        if (!isExplored && !isVisible) {
          // Unexplored (Fog of War)
          continue;
        }

        // Get Tile Type
        const chunkX = Math.floor(wx / 32);
        const chunkY = Math.floor(wy / 32);
        const chunk = generator.getChunk(chunkX, chunkY);
        // Safely handle if chunk not ready? (sync gen so ok)

        const lx = ((wx % 32) + 32) % 32;
        const ly = ((wy % 32) + 32) % 32;
        const lz = viewZ + 3; // map -3..3 to 0..6

        if (!chunk.tiles[lz]) continue;
        const tile = chunk.tiles[lz][ly][lx];

        // Draw Tile
        let color = '#222';
        // Simple visualization
        if (tile.block === 'water') color = '#1e3a8a';
        else if (tile.block === 'grass') color = '#14532d';
        else if (tile.block === 'stone') color = '#44403c';
        else if (tile.block === 'sand') color = '#d97706';
        else if (tile.block === 'snow') color = '#e5e7eb';

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
        ctx.strokeStyle = '#rgba(255,255,255,0.05)';
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }

    // Draw Entities
    entities.forEach((ent) => {
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
  }, [width, height, center, viewZ, scale, generator, visibleTiles, exploredTiles, entities]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Reverse project
    const TILE_SIZE = 32 * scale;
    const dx = (x - width / 2) / TILE_SIZE;
    const dy = (y - height / 2) / TILE_SIZE;

    // Adjust to nearest tile
    // Adjust to nearest tile
    // Actually the logic above is a bit fuzzy with "center tile", let's be precise
    // screenX = width/2 + (tileX - centerX) * TILE_SIZE
    // x = w/2 + (tx - cx) * S
    // (x - w/2) / S = tx - cx
    // tx = cx + (x - w/2) / S

    const tileX = Math.floor(center.x + (x - width / 2) / TILE_SIZE + 0.5);
    const tileY = Math.floor(center.y + (y - height / 2) / TILE_SIZE + 0.5);

    onTileClick({ x: tileX, y: tileY, z: viewZ as ZLevel });
  };

  return <canvas ref={canvasRef} width={width} height={height} onClick={handleClick} className="block touch-none" />;
};
