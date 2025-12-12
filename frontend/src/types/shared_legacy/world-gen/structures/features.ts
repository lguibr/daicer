/**
 * Feature Zone Generation
 * Placement of loot, traps, decorations within structures
 */

import type { Structure, FeatureZone, StructureFloor } from './types';
import { Alea } from '../noise/alea';

/**
 * Generate feature zones for a structure based on its type and layout
 */
export function generateFeatureZones(structure: Structure, seed: string): FeatureZone[] {
  const rng = Alea(`${seed}_features`);
  const zones: FeatureZone[] = [];

  // Rules based on structure type
  switch (structure.type) {
    case 'house':
      zones.push(...generateHouseFeatures(structure, rng));
      break;
    case 'castle':
      zones.push(...generateCastleFeatures(structure, rng));
      break;
    case 'dungeon':
      zones.push(...generateDungeonFeatures(structure, rng));
      break;
    case 'temple':
      zones.push(...generateTempleFeatures(structure, rng));
      break;
    case 'tower':
      zones.push(...generateTowerFeatures(structure, rng));
      break;
    case 'cave_entrance':
      zones.push(...generateCaveFeatures(structure, rng));
      break;
    default:
      // No features for other structure types
      break;
  }

  return zones;
}

/**
 * House Features: furniture and decorations
 */
function generateHouseFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place furniture in corners
    for (let y = 0; y < floorTiles.length; y++) {
      const row = floorTiles[y];
      if (!row) continue;

      for (let x = 0; x < row.length; x++) {
        if (row[x]?.tileType === 'floor') {
          // Check if corner (walls on 2 adjacent sides)
          const hasWallLeft = x > 0 && row[x - 1]?.tileType === 'wall';
          const hasWallRight = x < row.length - 1 && row[x + 1]?.tileType === 'wall';

          const rowAbove = y > 0 ? floorTiles[y - 1] : undefined;
          const hasWallUp = rowAbove ? rowAbove[x]?.tileType === 'wall' : false;

          const rowBelow = y < floorTiles.length - 1 ? floorTiles[y + 1] : undefined;
          const hasWallDown = rowBelow ? rowBelow[x]?.tileType === 'wall' : false;

          if ((hasWallLeft || hasWallRight) && (hasWallUp || hasWallDown)) {
            if (rng() < 0.5) {
              zones.push({
                x: structure.worldX + x,
                y: structure.worldY + y,
                floor,
                featureType: 'furniture',
                radius: 1,
                density: 0.8,
              });
            }
          }
        }
      }
    }

    // Add lights (torches) along walls
    const numLights = Math.floor(rng() * 4) + 2;
    for (let l = 0; l < numLights; l++) {
      const attempts = 30;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);
        const row = floorTiles[y];

        if (row?.[x]?.tileType === 'floor') {
          // Check if adjacent to wall
          const hasWallLeft = x > 0 && row[x - 1]?.tileType === 'wall';
          const hasWallRight = x < row.length - 1 && row[x + 1]?.tileType === 'wall';

          const rowAbove = y > 0 ? floorTiles[y - 1] : undefined;
          const hasWallUp = rowAbove ? rowAbove[x]?.tileType === 'wall' : false;

          const rowBelow = y < floorTiles.length - 1 ? floorTiles[y + 1] : undefined;
          const hasWallDown = rowBelow ? rowBelow[x]?.tileType === 'wall' : false;

          const nearWall = hasWallLeft || hasWallRight || hasWallUp || hasWallDown;

          if (nearWall) {
            zones.push({
              x: structure.worldX + x,
              y: structure.worldY + y,
              floor,
              featureType: 'light',
              radius: 1,
              density: 1.0,
            });
            break;
          }
        }
      }
    }
  }

  return zones;
}

/**
 * Castle Features: loot rooms, decorations, lights
 */
function generateCastleFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place treasure/loot in isolated rooms (far from doors)
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
      // Place 1-2 loot zones per floor
      const numLoot = Math.floor(rng() * 2) + 1;
      for (let l = 0; l < numLoot; l++) {
        const posIndex = Math.floor(rng() * floorPositions.length);
        const pos = floorPositions[posIndex];
        if (pos) {
          zones.push({
            x: structure.worldX + pos.x,
            y: structure.worldY + pos.y,
            floor,
            featureType: 'loot',
            radius: 2,
            density: 0.6,
          });
        }
      }
    }

    // Place lights throughout
    const numLights = Math.floor(rng() * 6) + 4;
    for (let l = 0; l < numLights; l++) {
      const attempts = 30;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);

        if (floorTiles[y]?.[x]?.tileType === 'floor') {
          zones.push({
            x: structure.worldX + x,
            y: structure.worldY + y,
            floor,
            featureType: 'light',
            radius: 1,
            density: 1.0,
          });
          break;
        }
      }
    }

    // Place decorations
    const numDecorations = Math.floor(rng() * 5) + 3;
    for (let d = 0; d < numDecorations; d++) {
      if (floorPositions.length > 0) {
        const posIndex = Math.floor(rng() * floorPositions.length);
        const pos = floorPositions[posIndex];
        if (pos) {
          zones.push({
            x: structure.worldX + pos.x,
            y: structure.worldY + pos.y,
            floor,
            featureType: 'decoration',
            radius: 1,
            density: 0.7,
          });
        }
      }
    }
  }

  return zones;
}

/**
 * Dungeon Features: traps in corridors, loot in rooms
 */
function generateDungeonFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place traps in corridors (narrow passages)
    for (let y = 1; y < floorTiles.length - 1; y++) {
      const row = floorTiles[y];
      if (!row) continue;

      for (let x = 1; x < row.length - 1; x++) {
        if (row[x]?.tileType === 'floor') {
          // Count adjacent walls to detect corridors
          let wallCount = 0;
          if (row[x - 1]?.tileType === 'wall') wallCount++;
          if (row[x + 1]?.tileType === 'wall') wallCount++;

          const rowAbove = floorTiles[y - 1];
          if (rowAbove?.[x]?.tileType === 'wall') wallCount++;

          const rowBelow = floorTiles[y + 1];
          if (rowBelow?.[x]?.tileType === 'wall') wallCount++;

          // Corridor if 2 opposite walls
          if (wallCount === 2 && rng() < 0.2) {
            zones.push({
              x: structure.worldX + x,
              y: structure.worldY + y,
              floor,
              featureType: 'trap',
              radius: 1,
              density: 0.9,
            });
          }
        }
      }
    }

    // Place loot in open areas (rooms)
    const numLoot = Math.floor(rng() * 3) + 2;
    for (let l = 0; l < numLoot; l++) {
      const attempts = 50;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);
        const row = floorTiles[y];

        if (row?.[x]?.tileType === 'floor') {
          // Check if in open area (few adjacent walls)
          let wallCount = 0;
          if (row[x - 1]?.tileType === 'wall') wallCount++;
          if (row[x + 1]?.tileType === 'wall') wallCount++;

          const rowAbove = y > 0 ? floorTiles[y - 1] : undefined;
          if (rowAbove?.[x]?.tileType === 'wall') wallCount++;

          const rowBelow = y < floorTiles.length - 1 ? floorTiles[y + 1] : undefined;
          if (rowBelow?.[x]?.tileType === 'wall') wallCount++;

          if (wallCount <= 1) {
            zones.push({
              x: structure.worldX + x,
              y: structure.worldY + y,
              floor,
              featureType: 'loot',
              radius: 2,
              density: 0.7,
            });
            break;
          }
        }
      }
    }

    // Minimal lighting (dungeons are dark)
    const numLights = Math.floor(rng() * 2) + 1;
    for (let l = 0; l < numLights; l++) {
      const attempts = 30;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);

        if (floorTiles[y]?.[x]?.tileType === 'floor') {
          zones.push({
            x: structure.worldX + x,
            y: structure.worldY + y,
            floor,
            featureType: 'light',
            radius: 1,
            density: 0.5,
          });
          break;
        }
      }
    }
  }

  return zones;
}

/**
 * Temple Features: decorations and lights (no loot or traps)
 */
function generateTempleFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const surfaceFloor = 0 as StructureFloor;
  const floorTiles = structure.tiles[surfaceFloor];
  if (!floorTiles) return zones;

  // Abundant decorations
  const numDecorations = Math.floor(rng() * 10) + 5;
  for (let d = 0; d < numDecorations; d++) {
    const attempts = 50;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const firstRow = floorTiles[0];
      if (!firstRow) break;

      const x = Math.floor(rng() * firstRow.length);
      const y = Math.floor(rng() * floorTiles.length);

      if (floorTiles[y]?.[x]?.tileType === 'floor') {
        zones.push({
          x: structure.worldX + x,
          y: structure.worldY + y,
          floor: surfaceFloor,
          featureType: 'decoration',
          radius: 1,
          density: 0.8,
        });
        break;
      }
    }
  }

  // Abundant lights
  const numLights = Math.floor(rng() * 8) + 4;
  for (let l = 0; l < numLights; l++) {
    const attempts = 30;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const firstRow = floorTiles[0];
      if (!firstRow) break;

      const x = Math.floor(rng() * firstRow.length);
      const y = Math.floor(rng() * floorTiles.length);

      if (floorTiles[y]?.[x]?.tileType === 'floor') {
        zones.push({
          x: structure.worldX + x,
          y: structure.worldY + y,
          floor: surfaceFloor,
          featureType: 'light',
          radius: 1,
          density: 1.0,
        });
        break;
      }
    }
  }

  return zones;
}

/**
 * Tower Features: loot at top, lights on each floor
 */
function generateTowerFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place lights on each floor
    const numLights = Math.floor(rng() * 3) + 2;
    for (let l = 0; l < numLights; l++) {
      const attempts = 30;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);

        if (floorTiles[y]?.[x]?.tileType === 'floor') {
          zones.push({
            x: structure.worldX + x,
            y: structure.worldY + y,
            floor,
            featureType: 'light',
            radius: 1,
            density: 1.0,
          });
          break;
        }
      }
    }
  }

  // Major loot at the top floor
  const topFloor = Math.max(...floors) as StructureFloor;
  const topTiles = structure.tiles[topFloor];
  if (topTiles && topTiles.length > 0) {
    const firstRow = topTiles[0];
    if (firstRow) {
      const centerX = Math.floor(firstRow.length / 2);
      const centerY = Math.floor(topTiles.length / 2);

      if (topTiles[centerY]?.[centerX]?.tileType === 'floor') {
        zones.push({
          x: structure.worldX + centerX,
          y: structure.worldY + centerY,
          floor: topFloor,
          featureType: 'loot',
          radius: 3,
          density: 0.9,
        });
      }
    }
  }

  return zones;
}

/**
 * Cave Features: minimal features (natural cave)
 */
function generateCaveFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const surfaceFloor = 0 as StructureFloor;
  const floorTiles = structure.tiles[surfaceFloor];
  if (!floorTiles) return zones;

  // Sparse lighting (cave is dark)
  const numLights = Math.floor(rng() * 2) + 1;
  for (let l = 0; l < numLights; l++) {
    const attempts = 30;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const firstRow = floorTiles[0];
      if (!firstRow) break;

      const x = Math.floor(rng() * firstRow.length);
      const y = Math.floor(rng() * floorTiles.length);

      if (floorTiles[y]?.[x]?.tileType === 'floor') {
        zones.push({
          x: structure.worldX + x,
          y: structure.worldY + y,
          floor: surfaceFloor,
          featureType: 'light',
          radius: 1,
          density: 0.3,
        });
        break;
      }
    }
  }

  return zones;
}
