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

import { createSimpleChunkGenerator, DEFAULT_GENERATION_PARAMS, type GenerationParams } from '@daicer/shared/world-gen';

export { DEFAULT_GENERATION_PARAMS, type GenerationParams };

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

  // Chunk generator wrapper using Shared Logic
  const createChunkGenerator = useCallback(
    (seed: string, params: GenerationParams) =>
      // Use the shared generator function
      createSimpleChunkGenerator(seed, params),
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
  const grid = useMemo(
    () =>
      biomeGrid.map(
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
      ),
    [biomeGrid]
  );

  const grid3D = useMemo(
    () =>
      biomeGrid3D.map((floorGrid, z) =>
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
      ),
    [biomeGrid3D]
  );

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
