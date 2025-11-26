import { useState, useCallback, useMemo } from 'react';
import { SimplexNoise, Alea } from '@daicer/shared/world-gen/noise';
import { generateCaveCA } from '@daicer/shared/world-gen/cellular-automata';
import { generateBSPLayout } from '@daicer/shared/world-gen/bsp';
import { poissonDiskSampling2D } from '@daicer/shared/world-gen/voronoi';
import {
  generateStructureFootprints,
  stampDetailedStructures,
  STRUCTURE_TEMPLATES,
  structureTileToBiome,
  type Structure,
  type StructureFloor,
} from '@daicer/shared/world-gen/structures';

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

export interface GenerationStep {
  name: string;
  description: string;
  technicalDetail: string;
  deterministic: boolean;
  completed: boolean;
  timeTaken?: number;
}

export function useWorldGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Store both 2D surface grid and 3D multi-floor grid
  const [biomeGrid, setBiomeGrid] = useState<string[][]>([]);
  const [biomeGrid3D, setBiomeGrid3D] = useState<string[][][]>([]); // [floor][y][x], 7 floors
  const [structures, setStructures] = useState<any[]>([]);

  const [steps, setSteps] = useState<GenerationStep[]>([
    {
      name: '1. Structure Footprints (Phase 1)',
      description: 'Place reserved structure markers BEFORE terrain',
      technicalDetail: 'Uses Poisson disc sampling for placement. Reserves space for structures without details.',
      deterministic: true,
      completed: false,
    },
    {
      name: '2. Simplex Noise (Elevation)',
      description: 'Generate continuous elevation map using fractal noise',
      technicalDetail: 'Uses 4 octaves of Simplex Noise. Same seed = same terrain every time.',
      deterministic: true,
      completed: false,
    },
    {
      name: '3. Simplex Noise (Moisture)',
      description: 'Generate moisture/humidity map',
      technicalDetail: 'Uses 3 octaves, offset +100 to avoid correlation with elevation.',
      deterministic: true,
      completed: false,
    },
    {
      name: '4. Biome Assignment',
      description: 'Classify each tile into biome types',
      technicalDetail: 'Pure function: (elevation, moisture) → biome. Fully deterministic.',
      deterministic: true,
      completed: false,
    },
    {
      name: '5. Cellular Automata (Caves)',
      description: 'Generate organic cave systems (z=-1 layer)',
      technicalDetail: 'Iterative cellular automata for cave generation.',
      deterministic: true,
      completed: false,
    },
    {
      name: '6. BSP Room Layout',
      description: 'Partition space into non-overlapping rooms',
      technicalDetail: 'Recursively splits area by random ratio.',
      deterministic: true,
      completed: false,
    },
    {
      name: '7. Poisson Disc (Features)',
      description: 'Distribute points evenly for trees/rocks',
      technicalDetail: 'Places points with min distance constraint.',
      deterministic: true,
      completed: false,
    },
    {
      name: '8. Detailed Structures (Phase 2)',
      description: 'Stamp final structure layouts onto terrain',
      technicalDetail: 'Replaces reserved markers with detailed layouts (walls, doors, floors).',
      deterministic: true,
      completed: false,
    },
  ]);

  const markStepComplete = (stepIndex: number, timeTaken: number) => {
    setSteps((prev) => prev.map((s, i) => (i === stepIndex ? { ...s, completed: true, timeTaken } : s)));
    setProgress(((stepIndex + 1) / 8) * 100);
  };

  // Chunk generator function - generates biomes for any world coordinate
  const createChunkGenerator = useCallback(
    (seed: string, params: GenerationParams) =>
      (worldX: number, worldY: number, width: number, height: number): string[][][] => {
        const noise = new SimplexNoise(seed);
        const structureSeed = `${seed}-structures`;

        // Cache structures that overlap this chunk
        const structuresInChunk = new Map<
          string,
          { template: any; structureTiles: any; originX: number; originY: number }
        >();

        // STRUCTURE PRE-PLACEMENT: Find all structure origins that might affect this chunk
        const searchRadius = Math.ceil(Math.max(20, params.structureMinDistance * 2) / params.structureMinDistance);

        for (
          let gridY = Math.floor(worldY / params.structureMinDistance) - searchRadius;
          gridY <= Math.floor((worldY + height) / params.structureMinDistance) + searchRadius;
          gridY++
        ) {
          for (
            let gridX = Math.floor(worldX / params.structureMinDistance) - searchRadius;
            gridX <= Math.floor((worldX + width) / params.structureMinDistance) + searchRadius;
            gridX++
          ) {
            // Use Alea PRNG to deterministically check if this grid cell has a structure
            const cellSeed = `${structureSeed}-${gridX}-${gridY}`;
            const rng = Alea(cellSeed);

            // Chance of structure based on maxStructures parameter
            const structureProbability = Math.min(params.maxStructures / 50, 0.3);
            if (rng() < structureProbability) {
              // This grid cell has a structure! Calculate its origin point
              const structureOriginX = gridX * params.structureMinDistance;
              const structureOriginY = gridY * params.structureMinDistance;

              // Pick structure type deterministically
              const structureSeed = `${seed}-struct-${gridX}-${gridY}`;
              const structRng = Alea(structureSeed);
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
                const structureTiles = template.generator(material, structureSeed);

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
                // Surface terrain generation
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
                } else if (elev < 0.6) biome = 'hills';
                else biome = 'mountains';

                row.push(biome);
              } else {
                // Non-surface floors are empty
                row.push('');
              }
            }
            floorGrid.push(row);
          }
          chunkBiomes.push(floorGrid);
        }

        return chunkBiomes;
      },
    []
  );

  const generateWorld = useCallback(async (seed: string, mapSize: number, params: GenerationParams) => {
    setIsGenerating(true);
    setProgress(0);
    setSteps((prev) => prev.map((s) => ({ ...s, completed: false, timeTaken: undefined })));

    // CRITICAL: Single seed used for ALL algorithms
    const masterSeed = seed;
    console.log(`[WorldGen] Master seed: "${masterSeed}" - ALL algorithms will use this seed`);

    try {
      // Step 1: PHASE 1 - Structure Footprints (BEFORE terrain)
      await new Promise((resolve) => setTimeout(resolve, 50));
      let stepStart = performance.now();
      const structureResult = generateStructureFootprints(mapSize, mapSize, `${masterSeed}-structures`, {
        minDistance: params.structureMinDistance,
        maxStructures: params.maxStructures,
        generateRoads: params.generateRoads,
        roadMaterial: 'stone',
        wfcBlendEdges: false,
      });
      const reservedGrid = structureResult.biomeGrid;
      const detailedStructures = structureResult.detailedStructures || [];

      // Set 3D grid early so structure footprints are visible on all floors
      setBiomeGrid3D(reservedGrid);
      setBiomeGrid(reservedGrid[3]); // Surface layer

      markStepComplete(0, performance.now() - stepStart);

      // Step 2: Elevation noise
      await new Promise((resolve) => setTimeout(resolve, 50));
      stepStart = performance.now();
      const noise = new SimplexNoise(masterSeed); // Uses master seed
      const elevationMap: number[][] = [];

      for (let y = 0; y < mapSize; y++) {
        const elevRow: number[] = [];
        for (let x = 0; x < mapSize; x++) {
          const elevation = noise.octaveNoise(
            x * params.elevationScale,
            y * params.elevationScale,
            params.elevationOctaves,
            params.elevationPersistence
          );
          elevRow.push(elevation);
        }
        elevationMap.push(elevRow);
      }
      markStepComplete(1, performance.now() - stepStart);

      // Step 3: Moisture noise (same SimplexNoise instance, offset coordinates)
      await new Promise((resolve) => setTimeout(resolve, 50));
      stepStart = performance.now();
      const moistureMap: number[][] = [];

      for (let y = 0; y < mapSize; y++) {
        const moistRow: number[] = [];
        for (let x = 0; x < mapSize; x++) {
          const moisture = noise.octaveNoise(
            x * params.moistureScale + 1000,
            y * params.moistureScale + 1000,
            params.moistureOctaves,
            params.moisturePersistence
          );
          moistRow.push(moisture);
        }
        moistureMap.push(moistRow);
      }
      markStepComplete(2, performance.now() - stepStart);

      // Step 4: Biome classification (pure deterministic function, respects structure reserves)
      await new Promise((resolve) => setTimeout(resolve, 50));
      stepStart = performance.now();
      const terrainGrid: string[][][] = [];

      // Initialize 7 floors
      for (let f = 0; f < 7; f++) {
        const floorGrid: string[][] = [];
        for (let y = 0; y < mapSize; y++) {
          const row: string[] = [];
          for (let x = 0; x < mapSize; x++) {
            // Check if this tile has a structure reservation (check current floor)
            if (reservedGrid[f] && reservedGrid[f][y] && reservedGrid[f][y][x]) {
              // Keep structure reservation from Phase 1
              row.push(reservedGrid[f][y][x]);
            } else {
              // Generate biome based on elevation/moisture (only for surface floor)
              // Non-surface floors without structures are empty (will be black or sky)
              if (f === 3) {
                const elev = elevationMap[y][x];
                const moist = moistureMap[y][x];

                let biome = 'plains';

                if (elev < -0.3) {
                  biome = 'ocean';
                } else if (elev < -0.1) {
                  biome = 'beach';
                } else if (elev < 0.1) {
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
                // Non-surface floors without structures = empty
                row.push('');
              }
            }
          }
          floorGrid.push(row);
        }
        terrainGrid.push(floorGrid);
      }

      setBiomeGrid(terrainGrid[3]); // Show surface floor
      setBiomeGrid3D(terrainGrid); // Update 3D grid with terrain
      markStepComplete(3, performance.now() - stepStart);

      // Step 5: Cellular Automata caves (uses master seed)
      await new Promise((resolve) => setTimeout(resolve, 50));
      stepStart = performance.now();
      const caveGrid = generateCaveCA(
        mapSize,
        mapSize,
        `${masterSeed}-caves`, // Derived from master seed
        {
          fillPercentage: params.caveFillPercentage,
          iterations: params.caveIterations,
          birthLimit: params.caveBirthLimit,
          deathLimit: params.caveDeathLimit,
        }
      );
      markStepComplete(4, performance.now() - stepStart);

      // Step 6: BSP room layout (uses master seed)
      await new Promise((resolve) => setTimeout(resolve, 50));
      stepStart = performance.now();
      const rooms = generateBSPLayout(
        params.bspSize,
        params.bspSize,
        `${masterSeed}-bsp`, // Derived from master seed
        { minRoomSize: params.bspMinRoomSize, maxRoomSize: params.bspMaxRoomSize }
      );
      markStepComplete(5, performance.now() - stepStart);

      // Step 7: Poisson disc feature placement (uses master seed)
      await new Promise((resolve) => setTimeout(resolve, 50));
      stepStart = performance.now();
      const featurePoints = poissonDiskSampling2D(
        mapSize,
        mapSize,
        params.featureMinDistance,
        params.featureAttempts,
        `${masterSeed}-features` // Derived from master seed
      );
      markStepComplete(6, performance.now() - stepStart);

      // Step 8: PHASE 2 - Stamp Detailed Structures (AFTER terrain)
      await new Promise((resolve) => setTimeout(resolve, 50));
      stepStart = performance.now();
      const finalGrid = stampDetailedStructures(terrainGrid, detailedStructures, terrainGrid);
      setBiomeGrid(finalGrid[3]); // Surface layer (floor 0 at index 3)
      setBiomeGrid3D(finalGrid); // Full 3D grid for multi-floor exploration

      // Convert structures for visualization
      const newStructures: any[] = detailedStructures.map((s: Structure) => ({
        name: s.name,
        x: s.worldX,
        y: s.worldY,
        type: s.type,
        description: `${s.type} at ${s.worldX},${s.worldY}`,
      }));

      setStructures(newStructures);
      markStepComplete(7, performance.now() - stepStart);

      console.log(`[WorldGen] ✅ Complete pipeline finished with seed: "${masterSeed}"`);
    } catch (error) {
      console.error('[WorldGen] Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Convert string grids to GridTile objects for TerrainExplorer
  const grid = useMemo(() => biomeGrid.map(
      (row, y) =>
        row.map(
          (biome, x) =>
            ({
              x,
              y,
              z: 0,
              biome,
              blockType: 'grass',
            }) as any
        ) // Cast to any to avoid strict GridTile validation issues for now, or import GridTile
    ), [biomeGrid]);

  const grid3D = useMemo(() => biomeGrid3D.map((floorGrid, z) =>
      floorGrid.map((row, y) =>
        row.map(
          (biome, x) =>
            ({
              x,
              y,
              z: z - 3, // Map 0..6 to -3..3
              biome,
              blockType: 'grass',
            }) as any
        )
      )
    ), [biomeGrid3D]);

  return {
    isGenerating,
    progress,
    steps,
    biomeGrid,
    biomeGrid3D,
    grid, // New GridTile[][]
    grid3D, // New GridTile[][][]
    structures,
    generateWorld,
    createChunkGenerator,
  };
}
