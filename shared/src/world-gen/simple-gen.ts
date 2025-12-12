import { SimplexNoise, Alea } from './noise';
import { STRUCTURE_TEMPLATES, structureTileToBiome, type StructureFloor } from './structures';

export interface GenerationParams {
  // Structures
  structureMinDistance: number;
  maxStructures: number;
  generateRoads: boolean;

  // Elevation Noise
  elevationScale: number;
  elevationOctaves: number;
  elevationPersistence: number;

  // Moisture Noise
  moistureScale: number;
  moistureOctaves: number;
  moisturePersistence: number;

  // Cellular Automata (Caves)
  caveFillPercentage: number;
  caveIterations: number;
  caveBirthLimit: number;
  caveDeathLimit: number;

  // BSP Rooms
  bspSize: number;
  bspMinRoomSize: number;
  bspMaxRoomSize: number;

  // Poisson Disc (Features)
  featureMinDistance: number;
  featureAttempts: number;
}

export const DEFAULT_GENERATION_PARAMS: GenerationParams = {
  structureMinDistance: 30,
  maxStructures: 10,
  generateRoads: false,
  elevationScale: 0.02,
  elevationOctaves: 4,
  elevationPersistence: 0.5,
  moistureScale: 0.03,
  moistureOctaves: 3,
  moisturePersistence: 0.5,
  caveFillPercentage: 0.45,
  caveIterations: 5,
  caveBirthLimit: 4,
  caveDeathLimit: 3,
  bspSize: 64,
  bspMinRoomSize: 4,
  bspMaxRoomSize: 12,
  featureMinDistance: 20,
  featureAttempts: 30,
};

/**
 * Creates a deterministic chunk generator function.
 * This function encapsulates the entire biome generation logic using Simplex Noise and specific thresholds,
 * identical to the logic used in the Frontend Preview.
 */
export function createSimpleChunkGenerator(seed: string, params: GenerationParams) {
  return (worldX: number, worldY: number, width: number, height: number): string[][][] => {
    const noise = new SimplexNoise(seed);
    const structureSeed = `${seed}-structures`;

    // Cache structures that overlap this chunk
    // Note: We recalculate this per chunk to be stateless/pure, but it's deterministic.
    const structuresInChunk = new Map<
      string,
      { template: any; structureTiles: any; originX: number; originY: number }
    >();

    // STRUCTURE PRE-PLACEMENT: Find all structure origins that might affect this chunk
    // We scan a grid of "potential structure sites" around the requested chunk
    // The grid size isn't 1x1, it's defined by structureMinDistance.
    const searchRadius = Math.ceil(Math.max(20, params.structureMinDistance * 2) / params.structureMinDistance);

    const startGridY = Math.floor(worldY / params.structureMinDistance) - searchRadius;
    const endGridY = Math.floor((worldY + height) / params.structureMinDistance) + searchRadius;
    const startGridX = Math.floor(worldX / params.structureMinDistance) - searchRadius;
    const endGridX = Math.floor((worldX + width) / params.structureMinDistance) + searchRadius;

    for (let gridY = startGridY; gridY <= endGridY; gridY++) {
      for (let gridX = startGridX; gridX <= endGridX; gridX++) {
        // Use Alea PRNG to deterministically check if this grid cell has a structure
        const cellSeed = `${structureSeed}-${gridX}-${gridY}`;
        const rng = Alea(cellSeed);

        // Chance of structure based on maxStructures parameter
        // The frontend used: Math.min(params.maxStructures / 50, 0.3)
        const structureProbability = Math.min(params.maxStructures / 50, 0.3);

        if (rng() < structureProbability) {
          // This grid cell has a structure! Calculate its origin point
          const structureOriginX = gridX * params.structureMinDistance;
          const structureOriginY = gridY * params.structureMinDistance;

          // Pick structure type deterministically
          const typeSeed = `${seed}-struct-${gridX}-${gridY}`;
          const structRng = Alea(typeSeed);
          const roll = structRng();

          let structureType: 'house' | 'tower' | 'temple' | 'dungeon' | 'cave_entrance' | 'ancient_tree' = 'house';
          if (roll < 0.3) structureType = 'house';
          else if (roll < 0.45) structureType = 'tower';
          else if (roll < 0.6) structureType = 'temple';
          else if (roll < 0.75) structureType = 'dungeon';
          else if (roll < 0.85) structureType = 'cave_entrance';
          else structureType = 'ancient_tree';

          const template = STRUCTURE_TEMPLATES[structureType];
          if (template) {
            const material = template.defaultMaterial;
            // Structure generator needs a seed too
            const structureTiles = template.generator(material, typeSeed);

            structuresInChunk.set(`${gridX}-${gridY}`, {
              template,
              structureTiles,
              originX: structureOriginX,
              originY: structureOriginY,
            });
          }
        }
      }
    }

    const chunkBiomes: string[][][] = [];

    // Generate 7 floors (-3 to +3)
    // The frontend loop goes 0 to 7 (exclusive? no 0..6).
    // Original frontend: for (let floor = 0; floor < 7; floor++)
    for (let floor = 0; floor < 7; floor++) {
      const floorGrid: string[][] = [];

      for (let y = 0; y < height; y++) {
        const row: string[] = [];
        for (let x = 0; x < width; x++) {
          const globalX = worldX + x;
          const globalY = worldY + y;

          let tileSet = false;

          // Check if this tile is part of any cached structure
          for (const structure of structuresInChunk.values()) {
            const localX = globalX - structure.originX;
            const localY = globalY - structure.originY;

            // Map floor index 0..6 to structure floor -3..3
            // Assuming the structure generator expects -3..3 or similar?
            // Frontend: const floorLevel = (floor - 3) as StructureFloor;
            const floorLevel = (floor - 3) as StructureFloor;
            const floorTiles = structure.structureTiles[floorLevel];

            if (
              floorTiles &&
              localY >= 0 &&
              localY < floorTiles.length &&
              localX >= 0 &&
              localX < (floorTiles[localY]?.length || 0)
            ) {
              const tile = floorTiles[localY]?.[localX];
              if (tile && tile.tileType !== 'empty') {
                const biomeName = structureTileToBiome(
                  tile,
                  floorLevel,
                  false,
                  `struct-${structure.originX}-${structure.originY}`
                );
                row.push(biomeName);
                tileSet = true;
                break;
              }
            }
          }

          if (tileSet) continue;

          // No structure - generate terrain (surface only) or empty
          if (floor === 3) {
            // Surface terrain generation (floor index 3)
            const elev = noise.octaveNoise(
              globalX * params.elevationScale,
              globalY * params.elevationScale,
              params.elevationOctaves,
              params.elevationPersistence
            );
            const moist = noise.octaveNoise(
              globalX * params.moistureScale + 1000,
              globalY * params.moistureScale + 1000,
              params.moistureOctaves,
              params.moisturePersistence
            );

            let biome = 'plains';
            if (elev < -0.3) biome = 'ocean';
            else if (elev < -0.1) biome = 'beach';
            else if (elev < 0.1) {
              if (moist < -0.2) biome = 'desert';
              else if (moist < 0.2) biome = 'plains';
              else biome = 'swamp';
            } else if (elev < 0.4) {
              if (moist < -0.1) biome = 'savanna';
              else if (moist < 0.3) biome = 'forest';
              else biome = 'jungle';
            } else if (elev < 0.6) {
              biome = 'hills';
            } else {
              biome = 'mountains';
            }

            row.push(biome);
          } else {
            // Non-surface floors without structures are empty
            row.push('');
          }
        }
        floorGrid.push(row);
      }
      chunkBiomes.push(floorGrid);
    }

    return chunkBiomes;
  };
}
