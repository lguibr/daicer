import React, { useRef, useEffect, useState } from 'react';
import { Box, Flex, Typography, IconButton } from '@strapi/design-system';
import { Plus, Minus } from '@strapi/icons';

// Types
type GridTile = { biome: string } | string | null;
interface Player {
  position: { x: number; y: number };
  name: string;
}
interface Structure {
  x: number;
  y: number;
  type: string;
  name: string;
}

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

const MATERIAL_COLORS: Record<string, string> = {
  stone: '#6b7280',
  wood: '#92400e',
  brick: '#991b1b',
  marble: '#e5e7eb',
  obsidian: '#1f2937',
  crystal: '#3b82f6',
  iron: '#4b5563',
  gold: '#f59e0b',
};

function getStructureColor(biomeName: string): string | null {
  if (biomeName.startsWith('structure_road_')) {
    return '#a16207'; // Bright brown/tan for all roads
  }

  if (biomeName.startsWith('structure_final_')) {
    const parts = biomeName.split('_');
    const material = parts[2];
    if (!material) return '#6b7280';

    const tileType = parts[3];

    const baseColor = MATERIAL_COLORS[material] || '#6b7280';

    if (tileType === 'wall') return baseColor;

    if (tileType === 'floor') {
      const hex = baseColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgb(${Math.min(255, r + 100)}, ${Math.min(255, g + 100)}, ${Math.min(255, b + 100)})`;
    }

    if (tileType === 'door') return '#f59e0b';
    if (tileType === 'stairs') return '#3b82f6';

    return baseColor;
  }
  return null;
}

const ExplorerCanvas = ({
  chunks,
  players = [],
  structures = [],
  onRequestChunk,
  currentFloor = 3,
  CHUNK_SIZE = 32,
}: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const TILE_SIZE = 16;
  const pendingRequests = useRef<Set<string>>(new Set());

  // Render Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const containerW = container.clientWidth;
      const containerH = container.clientHeight;

      canvas.width = containerW;
      canvas.height = containerH;

      const renderScale = TILE_SIZE * zoom;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000'; // Black background for void
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();

      // Center the view initially (0,0 world coord at center of screen + pan)
      const centerX = containerW / 2;
      const centerY = containerH / 2;

      ctx.translate(centerX + pan.x, centerY + pan.y);

      // Identify visible chunks
      const viewLeft = -centerX - pan.x;
      const viewTop = -centerY - pan.y;
      const viewRight = viewLeft + containerW;
      const viewBottom = viewTop + containerH;

      const tileLeft = Math.floor(viewLeft / renderScale);
      const tileTop = Math.floor(viewTop / renderScale);
      const tileRight = Math.ceil(viewRight / renderScale);
      const tileBottom = Math.ceil(viewBottom / renderScale);

      const chunkLeft = Math.floor(tileLeft / CHUNK_SIZE);
      const chunkTop = Math.floor(tileTop / CHUNK_SIZE);
      const chunkRight = Math.ceil(tileRight / CHUNK_SIZE);
      const chunkBottom = Math.ceil(tileBottom / CHUNK_SIZE);

      // Draw visible chunks
      for (let cy = chunkTop; cy <= chunkBottom; cy++) {
        for (let cx = chunkLeft; cx <= chunkRight; cx++) {
          const chunkKey = `${cx},${cy}`;
          const chunk = chunks[chunkKey];

          if (chunk) {
            // Draw Chunk
            const grid = chunk.grid[currentFloor];
            if (!grid) continue;

            const startX = cx * CHUNK_SIZE * renderScale;
            const startY = cy * CHUNK_SIZE * renderScale;

            for (let y = 0; y < CHUNK_SIZE; y++) {
              for (let x = 0; x < CHUNK_SIZE; x++) {
                const tile = grid[y]?.[x];
                // Handle both object and string tile formats
                const biome = typeof tile === 'object' && tile ? tile.biome : tile;

                if (!biome) continue;

                const structureColor = getStructureColor(biome);
                const isStructure =
                  biome.startsWith('structure_final_') || biome.startsWith('structure_road_');
                const color = structureColor || BIOME_COLORS[biome] || '#333';

                const px = startX + x * renderScale;
                const py = startY + y * renderScale;

                ctx.fillStyle = color;
                ctx.fillRect(px, py, renderScale, renderScale);

                // Detailed Rendering (Replicating TerrainExplorer.tsx style)
                if (isStructure) {
                  // THICK white outer border
                  ctx.strokeStyle = '#ffffff';
                  ctx.lineWidth = Math.max(2, renderScale * 0.2);
                  ctx.strokeRect(px, py, renderScale, renderScale);

                  if (biome.includes('_wall_')) {
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = Math.max(3, renderScale * 0.25);
                    ctx.strokeRect(px + 1.5, py + 1.5, renderScale - 3, renderScale - 3);

                    const cx = px + renderScale / 2;
                    const cy = py + renderScale / 2;
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.arc(cx, cy, Math.max(2, renderScale * 0.15), 0, Math.PI * 2);
                    ctx.fill();
                  }

                  if (biome.includes('_door_')) {
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = Math.max(4, renderScale * 0.3);
                    ctx.strokeRect(px, py, renderScale, renderScale);
                    ctx.strokeStyle = '#fef08a';
                    ctx.lineWidth = Math.max(2, renderScale * 0.15);
                    ctx.strokeRect(px + 2, py + 2, renderScale - 4, renderScale - 4);
                  }

                  if (biome.includes('_stairs_')) {
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = Math.max(4, renderScale * 0.3);
                    ctx.strokeRect(px, py, renderScale, renderScale);
                    ctx.strokeStyle = '#67e8f9';
                    ctx.lineWidth = Math.max(2, renderScale * 0.15);
                    ctx.strokeRect(px + 2, py + 2, renderScale - 4, renderScale - 4);
                  }

                  if (biome.startsWith('structure_road_')) {
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = Math.max(3, renderScale * 0.2);
                    ctx.setLineDash([renderScale * 0.3, renderScale * 0.15]);
                    ctx.strokeRect(px, py, renderScale, renderScale);
                    ctx.setLineDash([]);
                  }
                }
              }
            }
          } else {
            // Request Loading
            if (!pendingRequests.current.has(chunkKey) && onRequestChunk) {
              pendingRequests.current.add(chunkKey);
              onRequestChunk(cx, cy).finally(() => {
                pendingRequests.current.delete(chunkKey);
              });
            }
          }
        }
      }

      // Draw Players (Simple for Admin)
      players.forEach((player: any) => {
        if (!player.position) return;
        const pX = player.position.x * renderScale;
        const pY = player.position.y * renderScale;

        // Draw Player Marker
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(pX + renderScale / 2, pY + renderScale / 2, renderScale * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(player.name.charAt(0), pX, pY);
      });

      ctx.restore();
    };

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(draw);
    });

    resizeObserver.observe(container);
    requestAnimationFrame(draw);

    return () => {
      resizeObserver.disconnect();
    };
  }, [chunks, zoom, pan, players, currentFloor, CHUNK_SIZE, onRequestChunk]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <Box padding={0} shadow="filterShadow" hasRadius background="neutral0">
      <Flex justifyContent="space-between" padding={4} background="neutral100">
        <Typography variant="beta">Explorer View</Typography>
        <Flex gap={2}>
          <IconButton onClick={() => setZoom((z) => z + 0.5)} label="Zoom In">
            <Plus />
          </IconButton>
          <IconButton onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))} label="Zoom Out">
            <Minus />
          </IconButton>
          <Typography variant="epsilon">Zoom: {zoom.toFixed(1)}x</Typography>
        </Flex>
      </Flex>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          minWidth: '600px',
          height: '600px',
          minHeight: '600px',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: '#000',
          position: 'relative',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>
      <Box padding={2}>
        <Typography variant="pi" textColor="neutral600">
          Pan to explore. Map generates from backend.
        </Typography>
      </Box>
    </Box>
  );
};

export default ExplorerCanvas;
