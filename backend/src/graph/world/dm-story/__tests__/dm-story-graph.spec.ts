/**
 * DM Story Graph Integration Tests
 * Tests complete Section 1 graph execution
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createDMStoryGraph } from '../index';
import type { DMStoryState, DMStoryOutput } from '@daicer/shared/graph-states';
import { DMStoryInputSchema, DMStoryOutputSchema } from '@daicer/shared/graph-states';

// Mock LLM services
jest.mock('@/services/world-gen/historical-generator');
jest.mock('@/services/entropy/engine');

import { generateSinglePeriodTask, generateOverallSummaryTask } from '@/services/world-gen/historical-generator';
import { generateInitialConditions } from '@/services/entropy/engine';

const mockGeneratePeriod = generateSinglePeriodTask as jest.MockedFunction<typeof generateSinglePeriodTask>;
const mockGenerateSummary = generateOverallSummaryTask as jest.MockedFunction<typeof generateOverallSummaryTask>;
const mockGenerateConditions = generateInitialConditions as jest.MockedFunction<typeof generateInitialConditions>;

describe('DM Story Graph (Section 1) - Integration', () => {
  let graph: ReturnType<typeof createDMStoryGraph>;

  beforeEach(() => {
    graph = createDMStoryGraph();
    jest.clearAllMocks();
  });

  const baseInput: DMStoryState = {
    roomId: 'test-room',
    language: 'en',
    settings: {
      theme: 'High Fantasy',
      tone: 'Heroic',
      setting: 'Medieval Kingdom',
      worldType: 'terra',
      dmStyle: {
        verbosity: 3,
        detail: 3,
        engagement: 3,
        narrative: 3,
        specialMode: null,
      },
      worldSize: 'medium',
      adventureLength: 'medium',
      difficulty: 'medium',
      historyDepth: 500,
      eraCount: 3,
    },
    historyPeriods: [],
    currentPeriod: 0,
    totalPeriods: 0,
    conditions: [],
  };

  it('should generate 10 history periods for 500-year depth', async () => {
    // Mock conditions
    const mockConditions = Array(5)
      .fill(null)
      .map((_, i) => ({
        type: 'World Condition' as const,
        key: `Condition ${i}`,
        values: ['Value1', 'Value2'],
        currentValue: 'Value1',
        description: `Description ${i}`,
        lastUpdatedTurn: 0,
      }));
    mockGenerateConditions.mockReturnValue(mockConditions);

    // Mock period generation (10 times)
    mockGeneratePeriod.mockResolvedValue({
      periodNumber: 0,
      startYear: 0,
      endYear: 50,
      narrative: 'Period narrative...',
      structures: [],
      entropyEvents: [],
      conditions: [],
    });

    // Mock summary
    mockGenerateSummary.mockResolvedValue('Overall history summary...');

    const result = await graph.invoke(baseInput);

    // Assertions
    expect(result.historyPeriods).toHaveLength(10);
    expect(result.worldHistory).toBe('Overall history summary...');
    expect(result.conditions).toHaveLength(5);

    // Verify all nodes executed
    expect(mockGenerateConditions).toHaveBeenCalledTimes(1);
    expect(mockGeneratePeriod).toHaveBeenCalledTimes(10);
    expect(mockGenerateSummary).toHaveBeenCalledTimes(1);
  });

  it('should skip history generation when historyDepth = 0', async () => {
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
    mockGenerateConditions.mockReturnValue(mockConditions);

    const noHistoryInput: DMStoryState = {
      ...baseInput,
      settings: { ...baseInput.settings, historyDepth: 0 },
    };

    const result = await graph.invoke(noHistoryInput);

    expect(result.historyPeriods).toHaveLength(0);
    expect(result.worldHistory).toBeUndefined();
    expect(result.totalPeriods).toBe(0);

    // Only conditions node called (no periods, no summary)
    expect(mockGenerateConditions).toHaveBeenCalledTimes(1);
    expect(mockGeneratePeriod).not.toHaveBeenCalled();
    expect(mockGenerateSummary).not.toHaveBeenCalled();
  });

  it('should produce valid DMStoryOutput', async () => {
    const mockConditions = Array(5)
      .fill(null)
      .map((_, i) => ({
        type: 'World Condition' as const,
        key: `Condition ${i}`,
        values: ['A'],
        currentValue: 'A',
        description: 'Desc',
        lastUpdatedTurn: 0,
      }));
    mockGenerateConditions.mockReturnValue(mockConditions);

    mockGeneratePeriod.mockResolvedValue({
      periodNumber: 0,
      startYear: 0,
      endYear: 50,
      narrative: 'Period...',
      structures: [],
      entropyEvents: [],
      conditions: [],
    });

    mockGenerateSummary.mockResolvedValue('Summary...');

    const result = await graph.invoke(baseInput);

    // Validate against output schema
    const output: DMStoryOutput = {
      roomId: result.roomId,
      worldHistory: result.worldHistory!,
      conditions: result.conditions,
      historyPeriods: result.historyPeriods,
    };

    expect(() => DMStoryOutputSchema.parse(output)).not.toThrow();
  });

  it('should validate input against DMStoryInputSchema', () => {
    const input = {
      roomId: 'test',
      language: 'en' as const,
      settings: baseInput.settings,
    };

    expect(() => DMStoryInputSchema.parse(input)).not.toThrow();
  });
});
