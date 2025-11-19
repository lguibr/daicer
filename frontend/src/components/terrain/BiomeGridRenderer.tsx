/**
 * Biome Grid Renderer
 * Renders 2D biome grid with color-coded tiles
 * Overlays structures in their grid rooms (Dwarf Fortress style)
 */

import { useRef, useEffect } from 'react';

interface BiomeGridRendererProps {
  biomeGrid: string[][]; // [y][x] array of biome types
  structures?: Array<{ name: string; x: number; y: number; type: string }>;
  roomSize?: number; // Size of each room in voxels (default 32)
  scale?: number; // Pixels per tile (default 4)
  showGrid?: boolean;
}

// Biome color map
const BIOME_COLORS: Record<string, string> = {
  ocean: '#1e3a8a',
  frozen_ocean: '#93c5fd',
  lake: '#3b82f6',
  river: '#60a5fa',
  frozen_river: '#bfdbfe',
  beach: '#fde047',
  plains: '#84cc16',
  forest: '#166534',
  taiga: '#0f766e',
  tundra: '#e0f2fe',
  swamp: '#334155',
  desert: '#d97706',
  savanna: '#a16207',
  jungle: '#14532d',
  mountains: '#78716c',
  hills: '#a8a29e',
};

export function BiomeGridRenderer({
  biomeGrid,
  structures = [],
  roomSize = 32,
  scale = 2,
  showGrid = true,
}: BiomeGridRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || biomeGrid.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const height = biomeGrid.length;
    const width = biomeGrid[0].length;

    // Set canvas size
    canvas.width = width * scale;
    canvas.height = height * scale;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw biome tiles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const biome = biomeGrid[y][x];
        const color = BIOME_COLORS[biome] || '#666666';

        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    // Draw grid lines (rooms)
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x <= width; x += roomSize) {
        ctx.beginPath();
        ctx.moveTo(x * scale, 0);
        ctx.lineTo(x * scale, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= height; y += roomSize) {
        ctx.beginPath();
        ctx.moveTo(0, y * scale);
        ctx.lineTo(canvas.width, y * scale);
        ctx.stroke();
      }
    }

    // Draw structures as colored squares in their rooms
    structures.forEach((structure) => {
      // Convert world coordinates to room coordinates
      const roomX = Math.floor(structure.x / roomSize);
      const roomY = Math.floor(structure.y / roomSize);

      // Structure colors by type
      const structureColors: Record<string, string> = {
        settlement: '#ef4444',
        dungeon: '#7c2d12',
        landmark: '#eab308',
        ruin: '#6b7280',
        natural: '#22c55e',
      };

      const color = structureColors[structure.type] || '#ef4444';

      // Fill entire room with structure color
      ctx.fillStyle = color;
      ctx.fillRect(roomX * roomSize * scale, roomY * roomSize * scale, roomSize * scale, roomSize * scale);

      // Draw structure border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(roomX * roomSize * scale, roomY * roomSize * scale, roomSize * scale, roomSize * scale);

      // Draw structure name (if zoom allows)
      if (scale >= 2) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(8, roomSize * scale * 0.1)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          structure.name.slice(0, 8),
          (roomX * roomSize + roomSize / 2) * scale,
          (roomY * roomSize + roomSize / 2) * scale
        );
      }
    });
  }, [biomeGrid, structures, roomSize, scale, showGrid]);

  if (biomeGrid.length === 0) {
    return <div className="flex items-center justify-center p-8 text-shadow-500">No biome data available</div>;
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded border border-midnight-600"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Legend */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        {Object.entries(BIOME_COLORS)
          .slice(0, 12)
          .map(([biome, color]) => (
            <div key={biome} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
              <span className="text-shadow-400 capitalize">{biome}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
