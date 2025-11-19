/**
 * World Config Graph Integration Tests
 * Tests complete Section 2 graph execution
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createWorldConfigGraph } from '../index';
import type { WorldConfigState } from '@daicer/shared/graph-states';
import { WorldConfigOutputSchema } from '@daicer/shared/graph-states';

// Mock services
jest.mock('@/services/world-gen/structure-placer');
jest.mock('@/services/world-gen/structure-materializer');
jest.mock('@/services/world-gen/road-generator');
jest.mock('@/services/world-gen/world-collapse');
jest.mock('@/services/world-gen/chunk-pre-generator');
jest.mock('@/services/llm');
jest.mock('@/graph/grid-generation-graph');

import { placeStructuresOnGrid } from '@/services/world-gen/structure-placer';
import { generateRoads } from '@/services/world-gen/road-generator';
import { generateText } from '@/services/llm';

const mockPlaceStructures = placeStructuresOnGrid as jest.MockedFunction<typeof placeStructuresOnGrid>;
const mockGenerateRoads = generateRoads as jest.MockedFunction<typeof generateRoads>;
const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;

describe('World Config Graph (Section 2) - Integration', () => {
  let graph: ReturnType<typeof createWorldConfigGraph>;

  beforeEach(() => {
    graph = createWorldConfigGraph();
    jest.clearAllMocks();
  });

  const mockHistoryPeriods = [
    {
      periodNumber: 0,
      startYear: 0,
      endYear: 50,
      narrative: '...',
      structures: [
        {
          id: 'struct-1',
          name: 'Castle',
          x: 256,
          y: 256,
          size: 'medium' as const,
          description: '...',
          era: 0,
          type: 'settlement' as const,
          significance: 8,
          relativePosition: 'central',
        },
      ],
      entropyEvents: [],
      conditions: [],
    },
  ];

  const mockConditions = Array(5)
    .fill(null)
    .map((_, i) => ({
      type: 'World Condition' as const,
      key: `Condition ${i}`,
      values: [],
      currentValue: '',
      description: '',
      lastUpdatedTurn: 0,
    }));

  const baseInput: WorldConfigState = {
    roomId: 'test-room',
    settings: {
      structureDensity: 5,
      structureTypes: ['settlements', 'ruins'],
      enableRoads: true,
      roadQuality: 'road',
      terrainComplexity: 3,
    },
    historyPeriods: mockHistoryPeriods,
    conditions: mockConditions,
    worldHistory: 'Ancient kingdom...',
    structures: [],
    roads: [],
    generatedChunks: [],
  };

  it('should execute all 7 nodes with roads enabled', async () => {
    mockPlaceStructures.mockReturnValue([mockHistoryPeriods[0].structures[0]]);
    mockGenerateRoads.mockReturnValue([]);
    mockGenerateText.mockResolvedValue('World description...');

    const result = await graph.invoke(baseInput);

    expect(result.structures).toBeDefined();
    expect(result.worldDescription).toBeDefined();
  });

  it('should skip roads if enableRoads = false', async () => {
    mockPlaceStructures.mockReturnValue([mockHistoryPeriods[0].structures[0]]);
    mockGenerateText.mockResolvedValue('World description...');

    const noRoadsInput: WorldConfigState = {
      ...baseInput,
      settings: { ...baseInput.settings, enableRoads: false },
    };

    const result = await graph.invoke(noRoadsInput);

    expect(mockGenerateRoads).not.toHaveBeenCalled();
    expect(result.worldDescription).toBeDefined();
  });

  it('should produce valid WorldConfigOutput', async () => {
    mockPlaceStructures.mockReturnValue([]);
    mockGenerateText.mockResolvedValue('Description...');

    const result = await graph.invoke(baseInput);

    const output = {
      structures: result.structures,
      roads: result.roads,
      worldDescription: result.worldDescription!,
      generatedChunks: result.generatedChunks,
      gridState: result.gridState,
      terrainMap: result.terrainMap,
    };

    expect(() => WorldConfigOutputSchema.parse(output)).not.toThrow();
  });
});
