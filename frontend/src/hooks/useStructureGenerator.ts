/**
 * useStructureGenerator Hook
 * Manages structure generation state and parameters
 */

import { useState, useCallback } from 'react';
import type { StructurePlacementParams, Structure } from '@daicer/shared';
import { generateStructuresAsBiomes } from '@daicer/shared';

export function useStructureGenerator(initialSeed: string = 'structures') {
  const [seed, setSeed] = useState(initialSeed);
  const [mapSize, setMapSize] = useState(128);
  const [isGenerating, setIsGenerating] = useState(false);
  const [biomeGrids, setBiomeGrids] = useState<string[][][]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [generationTime, setGenerationTime] = useState<number>(0);

  const [params, setParams] = useState<StructurePlacementParams>({
    minDistance: 30,
    maxStructures: 20,
    generateRoads: true,
    roadMaterial: 'stone',
    wfcBlendEdges: false,
  });

  const generate = useCallback(async () => {
    setIsGenerating(true);
    const startTime = performance.now();

    try {
      const result = generateStructuresAsBiomes(mapSize, mapSize, seed, params);

      setBiomeGrids(result.biomeGrid);
      setStructures(result.structures);

      const endTime = performance.now();
      setGenerationTime(endTime - startTime);

      console.log(
        `[StructureGenerator] Generated ${result.structures.length} structures in ${(endTime - startTime).toFixed(2)}ms`
      );
    } catch (error) {
      console.error('[StructureGenerator] Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [mapSize, seed, params]);

  const updateParams = useCallback((updates: Partial<StructurePlacementParams>) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    seed,
    setSeed,
    mapSize,
    setMapSize,
    params,
    updateParams,
    biomeGrids,
    structures,
    isGenerating,
    generationTime,
    generate,
  };
}
