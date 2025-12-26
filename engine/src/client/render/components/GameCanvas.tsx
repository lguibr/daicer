import React, { useRef, useEffect, useState } from 'react';
import { WorldGenerator, WorldConfig, GameEvent, MoveEventPayload, EntityState } from '../../../core/voxel';

interface GameCanvasProps {
  worldConfig: WorldConfig;
  events: GameEvent[];
  playerId: string;
  width?: number;
  height?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ worldConfig, events, playerId, width = 800, height = 600 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [worldGen, setWorldGen] = useState<WorldGenerator | null>(null);
  const [entities, setEntities] = useState<Record<string, EntityState>>({});

  // 1. Initialize World Generator
  useEffect(() => {
    const gen = new WorldGenerator(worldConfig);
    setWorldGen(gen);
  }, [worldConfig]);

  // 2. Process Events
  useEffect(() => {
    const newEntities: Record<string, EntityState> = {};

    // Sort events by Turn/Timestamp? Assuming input is sorted for now.
    events.forEach((event) => {
      if (event.type === 'MOVE') {
        const payload = event.payload as MoveEventPayload;
        // Upsert entity
        if (!newEntities[payload.entityId]) {
          newEntities[payload.entityId] = {
            id: payload.entityId,
            type: 'player', // Defaulting for now
            position: payload.to,
            name: payload.entityId,
            stats: { hp: 10, maxHp: 10 },
          };
        } else {
          newEntities[payload.entityId].position = payload.to;
        }
      }
    });
    setEntities(newEntities);
  }, [events]);

  // 3. Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !worldGen) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Camera Center (Player or Center of World)
    const player = entities[playerId];
    const camX = player ? player.position.x : 0; // World Coords
    const camY = player ? player.position.y : 0;

    const TILE_SIZE = 32;
    const VIEW_W = Math.ceil(width / TILE_SIZE);
    const VIEW_H = Math.ceil(height / TILE_SIZE);

    const HALF_W = Math.floor(VIEW_W / 2);
    const HALF_H = Math.floor(VIEW_H / 2);

    // Render Tiles
    for (let dy = -HALF_H; dy <= HALF_H; dy++) {
      for (let dx = -HALF_W; dx <= HALF_W; dx++) {
        const wx = camX + dx;
        const wy = camY + dy;

        // Convert key world coords to Chunk coords
        const chunkSize = worldConfig.chunkSize || 32;
        const cx = Math.floor(wx / chunkSize);
        const cy = Math.floor(wy / chunkSize);

        const chunk = worldGen.getChunk(cx, cy);

        // Local Coords within chunk
        const lx = ((wx % chunkSize) + chunkSize) % chunkSize;
        const ly = ((wy % chunkSize) + chunkSize) % chunkSize;

        // Get Tile (Z=0 for simple demo)
        const z = 0;
        const tiles = chunk.tiles[z]; // Typically [x][y] or [y][x] depending on engine.
        // Engine types says tiles: Tile[][][]; // [z][y][x]? Let's check procgen.ts createTile usage.
        // Checked outline: createTile returns Tile.
        // Let's safe access.

        let color = '#000';
        if (tiles && tiles[lx] && tiles[lx][ly]) {
          const tile = tiles[lx][ly];
          // Simple Biome Colors
          switch (tile.biome) {
            case 'ocean':
              color = '#000080';
              break;
            case 'beach':
              color = '#F4A460';
              break;
            case 'plains':
              color = '#228B22';
              break;
            case 'forest':
              color = '#006400';
              break;
            case 'mountain':
              color = '#808080';
              break;
            case 'snowy_peaks':
              color = '#FFFafa';
              break;
            default:
              color = '#333';
          }
          if (tile.block === 'water') color = '#0000FF';
        }

        const screenX = (dx + HALF_W) * TILE_SIZE;
        const screenY = (dy + HALF_H) * TILE_SIZE;

        ctx.fillStyle = color;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Grid Lines
        ctx.strokeStyle = '#222';
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }

    // Render Entities
    Object.values(entities).forEach((ent) => {
      const dx = ent.position.x - camX;
      const dy = ent.position.y - camY;

      // Only draw if within view
      if (Math.abs(dx) <= HALF_W && Math.abs(dy) <= HALF_H) {
        const screenX = (dx + HALF_W) * TILE_SIZE;
        const screenY = (dy + HALF_H) * TILE_SIZE;

        ctx.fillStyle = ent.id === playerId ? 'white' : 'red';
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [worldGen, entities, width, height, playerId]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ border: '1px solid #444' }} />;
};
