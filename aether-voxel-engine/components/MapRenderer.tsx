import React, { useRef, useEffect } from 'react';
import { Coordinates, ZLevel } from '../types';
import { CHUNK_SIZE, TILE_SIZE, COLORS } from '../constants';
import { WorldGenerator } from '../core/procgen';

export interface MapRendererProps {
  /** Center coordinate of the view (usually player position) */
  center: Coordinates;
  /** Current Z-Level being rendered (-3 to +3) */
  viewZ: ZLevel;
  /** Instance of the WorldGenerator */
  generator: WorldGenerator;
  /** Set of tile keys ("x,y") that are currently visible */
  visibleTiles: Set<string>;
  /** Set of tile keys ("x,y") that have been explored/remembered */
  exploredTiles: Set<string>;
  /** Optional path to render (array of coordinates) */
  path: Coordinates[] | null;
  /** Callback when a tile is clicked */
  onTileClick: (x: number, y: number) => void;
  /** Callback when a tile is double-clicked */
  onTileDoubleClick: (x: number, y: number) => void;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Zoom scale factor (default 1.0) */
  scale: number;
  /** Optional style override */
  style?: React.CSSProperties;
  /** Optional class name */
  className?: string;
}

export const MapRenderer: React.FC<MapRendererProps> = ({ 
  center, 
  viewZ, 
  generator, 
  visibleTiles, 
  exploredTiles,
  path,
  onTileClick,
  onTileDoubleClick,
  width,
  height,
  scale,
  style,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Effective tile size with zoom
  const ts = TILE_SIZE * scale;

  // Helper: World to Screen
  const worldToScreen = (wx: number, wy: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const sx = (wx - center.x) * ts + centerX - (ts/2);
    const sy = (wy - center.y) * ts + centerY - (ts/2);
    return { x: sx, y: sy };
  };

  // Helper: Screen to World
  const screenToWorld = (mx: number, my: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    // Adjust for center offset logic in worldToScreen
    const wx = Math.floor((mx - centerX + (ts/2)) / ts + center.x);
    const wy = Math.floor((my - centerY + (ts/2)) / ts + center.y);
    return { x: wx, y: wy };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Calculate visible range based on canvas size and scale
    const tilesX = Math.ceil(width / ts / 2) + 1;
    const tilesY = Math.ceil(height / ts / 2) + 1;

    for (let y = center.y - tilesY; y <= center.y + tilesY; y++) {
      for (let x = center.x - tilesX; x <= center.x + tilesX; x++) {
        const key = `${x},${y}`;
        const isVisible = visibleTiles.has(key);
        const isExplored = exploredTiles.has(key);

        // Optimization: Don't render if unknown
        if (!isVisible && !isExplored) continue;

        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const chunk = generator.getChunk(chunkX, chunkY);
        
        const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = viewZ + 3;

        const tile = chunk.tiles[lz][ly][lx];
        
        const pos = worldToScreen(x, y);

        // Draw Block
        ctx.fillStyle = COLORS[tile.block];
        ctx.fillRect(pos.x, pos.y, ts, ts);

        // Depth Effect (See layer below if AIR)
        if (tile.block === 'air' && lz > 0) {
            const tileBelow = chunk.tiles[lz-1][ly][lx];
            if (tileBelow.block !== 'air') {
                ctx.fillStyle = COLORS[tileBelow.block];
                ctx.globalAlpha = 0.4;
                ctx.fillRect(pos.x + (ts*0.1), pos.y + (ts*0.1), ts*0.8, ts*0.8);
                ctx.globalAlpha = 1.0;
            }
        }

        // Fog Overlay Logic
        if (!isVisible && isExplored) {
            // Explored (Memory) - Dark overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Darker fog for clarity
            ctx.fillRect(pos.x, pos.y, ts, ts);
        }

        // Grid lines (Only visible on zoom in)
        if (scale > 0.5) {
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1;
            ctx.strokeRect(pos.x, pos.y, ts, ts);
        }
      }
    }

    // Draw Path
    if (path && path.length > 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)'; // Sky blue path
        ctx.lineWidth = Math.max(2, ts / 4);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        path.forEach((p, idx) => {
            const s = worldToScreen(p.x, p.y);
            const cx = s.x + ts/2;
            const cy = s.y + ts/2;
            if (idx === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
        });
        ctx.stroke();

        // Draw Target Marker
        const last = path[path.length - 1];
        const ls = worldToScreen(last.x, last.y);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fillRect(ls.x, ls.y, ts, ts);
    }

    // Draw Player
    if (viewZ === center.z) {
        const pScreen = worldToScreen(center.x, center.y);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pScreen.x + ts/2, pScreen.y + ts/2, ts/3, 0, Math.PI * 2);
        ctx.fill();
        // Halo
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
  };

  useEffect(() => {
    draw();
  });

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wPos = screenToWorld(mx, my);
    onTileClick(wPos.x, wPos.y);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wPos = screenToWorld(mx, my);
    onTileDoubleClick(wPos.x, wPos.y);
  };

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`cursor-crosshair block ${className || ''}`}
      style={{ backgroundColor: '#000', ...style }}
    />
  );
};