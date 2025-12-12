/**
 * NPC Spawn Point Generation
 * Rules-based placement of NPCs within structures
 */

import type { Structure, NPCSpawnPoint, StructureFloor } from './types';
import { Alea } from '../noise/alea';

/**
 * Generate NPC spawn points for a structure based on its type and layout
 */
export function generateNPCSpawnPoints(structure: Structure, seed: string): NPCSpawnPoint[] {
  const rng = Alea(`${seed}_npcs`);
  const spawnPoints: NPCSpawnPoint[] = [];

  // Rules based on structure type
  switch (structure.type) {
    case 'house':
      spawnPoints.push(...generateHouseNPCs(structure, rng));
      break;
    case 'castle':
      spawnPoints.push(...generateCastleNPCs(structure, rng));
      break;
    case 'dungeon':
      spawnPoints.push(...generateDungeonNPCs(structure, rng));
      break;
    case 'temple':
      spawnPoints.push(...generateTempleNPCs(structure, rng));
      break;
    case 'tower':
      spawnPoints.push(...generateTowerNPCs(structure, rng));
      break;
    case 'cave_entrance':
      spawnPoints.push(...generateCaveNPCs(structure, rng));
      break;
    default:
      // No NPCs for other structure types
      break;
  }

  return spawnPoints;
}

/**
 * House NPCs: villagers inside
 */
function generateHouseNPCs(structure: Structure, rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  // Place 1-2 villagers in the house
  const numNPCs = Math.floor(rng() * 2) + 1;

  for (let i = 0; i < numNPCs; i++) {
    const floorIndex = Math.floor(rng() * floors.length);
    const floor = floors[floorIndex];
    if (floor === undefined) continue;

    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Find floor tiles (not doors, walls)
    const floorPositions: { x: number; y: number }[] = [];
    for (let y = 0; y < floorTiles.length; y++) {
      const row = floorTiles[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        if (row[x]?.tileType === 'floor') {
          floorPositions.push({ x, y });
        }
      }
    }

    if (floorPositions.length > 0) {
      const posIndex = Math.floor(rng() * floorPositions.length);
      const pos = floorPositions[posIndex];
      if (!pos) continue;

      points.push({
        x: structure.worldX + pos.x,
        y: structure.worldY + pos.y,
        floor,
        npcType: 'villager',
        spawnChance: 0.8,
      });
    }
  }

  return points;
}

/**
 * Castle NPCs: guards near doors and key areas
 */
function generateCastleNPCs(structure: Structure, _rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place guards near doors
    for (let y = 0; y < floorTiles.length; y++) {
      const row = floorTiles[y];
      if (!row) continue;

      for (let x = 0; x < row.length; x++) {
        if (row[x]?.tileType === 'door') {
          // Place guard adjacent to door
          const guardPositions = [
            { x: x - 1, y },
            { x: x + 1, y },
            { x, y: y - 1 },
            { x, y: y + 1 },
          ];

          for (const gPos of guardPositions) {
            if (
              gPos.x >= 0 &&
              gPos.x < row.length &&
              gPos.y >= 0 &&
              gPos.y < floorTiles.length &&
              floorTiles[gPos.y]?.[gPos.x]?.tileType === 'floor'
            ) {
              points.push({
                x: structure.worldX + gPos.x,
                y: structure.worldY + gPos.y,
                floor,
                npcType: 'guard',
                spawnChance: 0.6,
              });
              break; // Only one guard per door
            }
          }
        }
      }
    }
  }

  // Add a boss in the top floor
  const topFloor = Math.max(...floors) as StructureFloor;
  const topTiles = structure.tiles[topFloor];
  if (topTiles && topTiles.length > 0) {
    const firstRow = topTiles[0];
    if (firstRow) {
      // Find center-ish floor tile
      const centerX = Math.floor(firstRow.length / 2);
      const centerY = Math.floor(topTiles.length / 2);
      if (topTiles[centerY]?.[centerX]?.tileType === 'floor') {
        points.push({
          x: structure.worldX + centerX,
          y: structure.worldY + centerY,
          floor: topFloor,
          npcType: 'boss',
          spawnChance: 1.0,
        });
      }
    }
  }

  return points;
}

/**
 * Dungeon NPCs: monsters scattered throughout
 */
function generateDungeonNPCs(structure: Structure, rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Count floor tiles
    let floorTileCount = 0;
    for (let y = 0; y < floorTiles.length; y++) {
      const row = floorTiles[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        if (row[x]?.tileType === 'floor') {
          floorTileCount++;
        }
      }
    }

    // Place monsters: ~1 per 20 floor tiles
    const numMonsters = Math.max(1, Math.floor(floorTileCount / 20));
    for (let m = 0; m < numMonsters; m++) {
      const attempts = 50;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);

        if (floorTiles[y]?.[x]?.tileType === 'floor') {
          points.push({
            x: structure.worldX + x,
            y: structure.worldY + y,
            floor,
            npcType: 'monster',
            spawnChance: 0.7,
          });
          break;
        }
      }
    }
  }

  // Add a boss on the deepest floor
  const deepestFloor = Math.min(...floors) as StructureFloor;
  const deepTiles = structure.tiles[deepestFloor];
  if (deepTiles && deepTiles.length > 0) {
    const firstRow = deepTiles[0];
    if (firstRow) {
      // Find a far corner
      const corners = [
        { x: 0, y: 0 },
        { x: firstRow.length - 1, y: 0 },
        { x: 0, y: deepTiles.length - 1 },
        { x: firstRow.length - 1, y: deepTiles.length - 1 },
      ];

      for (const corner of corners) {
        if (deepTiles[corner.y]?.[corner.x]?.tileType === 'floor') {
          points.push({
            x: structure.worldX + corner.x,
            y: structure.worldY + corner.y,
            floor: deepestFloor,
            npcType: 'boss',
            spawnChance: 1.0,
          });
          break;
        }
      }
    }
  }

  return points;
}

/**
 * Temple NPCs: merchants and villagers
 */
function generateTempleNPCs(structure: Structure, rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const surfaceFloor = 0 as StructureFloor;
  const floorTiles = structure.tiles[surfaceFloor];
  if (!floorTiles) return points;

  // Place 1-2 merchants in the temple
  const numMerchants = Math.floor(rng() * 2) + 1;

  for (let i = 0; i < numMerchants; i++) {
    const attempts = 50;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const firstRow = floorTiles[0];
      if (!firstRow) break;

      const x = Math.floor(rng() * firstRow.length);
      const y = Math.floor(rng() * floorTiles.length);

      if (floorTiles[y]?.[x]?.tileType === 'floor') {
        points.push({
          x: structure.worldX + x,
          y: structure.worldY + y,
          floor: surfaceFloor,
          npcType: 'merchant',
          spawnChance: 0.9,
        });
        break;
      }
    }
  }

  return points;
}

/**
 * Tower NPCs: guards on each floor, boss at top
 */
function generateTowerNPCs(structure: Structure, rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place 1-2 guards per floor
    const numGuards = Math.floor(rng() * 2) + 1;
    for (let g = 0; g < numGuards; g++) {
      const attempts = 30;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);

        if (floorTiles[y]?.[x]?.tileType === 'floor') {
          points.push({
            x: structure.worldX + x,
            y: structure.worldY + y,
            floor,
            npcType: 'guard',
            spawnChance: 0.7,
          });
          break;
        }
      }
    }
  }

  // Boss at the top
  const topFloor = Math.max(...floors) as StructureFloor;
  const topTiles = structure.tiles[topFloor];
  if (topTiles && topTiles.length > 0) {
    const firstRow = topTiles[0];
    if (firstRow) {
      const centerX = Math.floor(firstRow.length / 2);
      const centerY = Math.floor(topTiles.length / 2);
      if (topTiles[centerY]?.[centerX]?.tileType === 'floor') {
        points.push({
          x: structure.worldX + centerX,
          y: structure.worldY + centerY,
          floor: topFloor,
          npcType: 'boss',
          spawnChance: 1.0,
        });
      }
    }
  }

  return points;
}

/**
 * Cave NPCs: monsters near the entrance
 */
function generateCaveNPCs(structure: Structure, rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const surfaceFloor = 0 as StructureFloor;
  const floorTiles = structure.tiles[surfaceFloor];
  if (!floorTiles) return points;

  // Place 2-4 monsters
  const numMonsters = Math.floor(rng() * 3) + 2;

  for (let m = 0; m < numMonsters; m++) {
    const attempts = 50;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const firstRow = floorTiles[0];
      if (!firstRow) break;

      const x = Math.floor(rng() * firstRow.length);
      const y = Math.floor(rng() * floorTiles.length);

      if (floorTiles[y]?.[x]?.tileType === 'floor') {
        points.push({
          x: structure.worldX + x,
          y: structure.worldY + y,
          floor: surfaceFloor,
          npcType: 'monster',
          spawnChance: 0.8,
        });
        break;
      }
    }
  }

  return points;
}
