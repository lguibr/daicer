import { describe, it, expect } from '@jest/globals';
import {
  WorldConfigStateSchema,
  WorldConfigInputSchema,
  WorldConfigOutputSchema,
  type WorldConfigState,
  type WorldConfigInput,
  type WorldConfigOutput,
} from './world-config-state';

describe('WorldConfigStateSchema', () => {
  const mockHistoryPeriods = [
    {
      periodNumber: 0,
      startYear: 0,
      endYear: 50,
      narrative: 'The first age...',
      structures: [],
      entropyEvents: [],
      conditions: [],
    },
  ];

  const mockConditions = [
    {
      type: 'World Condition' as const,
      key: 'Political Climate',
      values: ['Stable'],
      currentValue: 'Stable',
      description: '...',
      lastUpdatedTurn: 0,
    },
    {
      type: 'World Condition' as const,
      key: 'Wilderness',
      values: ['Calm'],
      currentValue: 'Calm',
      description: '...',
      lastUpdatedTurn: 0,
    },
    {
      type: 'World Condition' as const,
      key: 'Weather',
      values: ['Clear'],
      currentValue: 'Clear',
      description: '...',
      lastUpdatedTurn: 0,
    },
    {
      type: 'World Condition' as const,
      key: 'Magic',
      values: ['Normal'],
      currentValue: 'Normal',
      description: '...',
      lastUpdatedTurn: 0,
    },
    {
      type: 'World Condition' as const,
      key: 'Trade',
      values: ['Active'],
      currentValue: 'Active',
      description: '...',
      lastUpdatedTurn: 0,
    },
  ];

  const baseValidState: WorldConfigState = {
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
    worldHistory: 'The ancient kingdom...',
    structures: [],
    roads: [],
    generatedChunks: [],
  };

  describe('Valid Inputs', () => {
    it('should accept valid state with Section 1 dependencies', () => {
      const result = WorldConfigStateSchema.parse(baseValidState);
      expect(result.roomId).toBe('test-room');
      expect(result.historyPeriods).toHaveLength(1);
      expect(result.conditions).toHaveLength(5);
      expect(result.worldHistory).toBe('The ancient kingdom...');
    });

    it('should accept all structureDensity values (1-20)', () => {
      [1, 10, 20].forEach((density) => {
        const result = WorldConfigStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, structureDensity: density },
        });
        expect(result.settings.structureDensity).toBe(density);
      });
    });

    it('should accept all terrainComplexity values (1-5)', () => {
      [1, 3, 5].forEach((complexity) => {
        const result = WorldConfigStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, terrainComplexity: complexity },
        });
        expect(result.settings.terrainComplexity).toBe(complexity);
      });
    });

    it('should accept all roadQuality options', () => {
      const qualities = ['trail', 'path', 'road', 'highway'];
      qualities.forEach((quality) => {
        const result = WorldConfigStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, roadQuality: quality as any },
        });
        expect(result.settings.roadQuality).toBe(quality);
      });
    });

    it('should use default roadQuality = road', () => {
      const input = {
        ...baseValidState,
        settings: {
          structureDensity: 5,
          structureTypes: ['settlements'],
          enableRoads: true,
          terrainComplexity: 3,
        },
      };

      const result = WorldConfigStateSchema.parse(input);
      expect(result.settings.roadQuality).toBe('road');
    });

    it('should accept optional worldDescription', () => {
      const result = WorldConfigStateSchema.parse({
        ...baseValidState,
        worldDescription: 'The kingdom sprawls...',
      });
      expect(result.worldDescription).toBe('The kingdom sprawls...');
    });

    it('should accept multiple structure types', () => {
      const types = ['settlements', 'ruins', 'dungeons', 'temples', 'fortresses', 'towers'];
      const result = WorldConfigStateSchema.parse({
        ...baseValidState,
        settings: { ...baseValidState.settings, structureTypes: types },
      });
      expect(result.settings.structureTypes).toEqual(types);
    });
  });

  describe('Section 1 Dependency Validation', () => {
    it('should require historyPeriods to be non-empty', () => {
      expect(() => {
        WorldConfigStateSchema.parse({
          ...baseValidState,
          historyPeriods: [],
        });
      }).toThrow('Section 1 must complete first');
    });

    it('should require exactly 5 conditions', () => {
      expect(() => {
        WorldConfigStateSchema.parse({
          ...baseValidState,
          conditions: mockConditions.slice(0, 3), // Only 3 conditions
        });
      }).toThrow('Exactly 5 conditions required');
    });

    it('should reject empty worldHistory', () => {
      expect(() => {
        WorldConfigStateSchema.parse({
          ...baseValidState,
          worldHistory: '',
        });
      }).toThrow('World history required from Section 1');
    });

    it('should reject if historyPeriods missing', () => {
      expect(() => {
        const { historyPeriods, ...rest } = baseValidState;
        WorldConfigStateSchema.parse(rest);
      }).toThrow();
    });

    it('should reject if conditions missing', () => {
      expect(() => {
        const { conditions, ...rest } = baseValidState;
        WorldConfigStateSchema.parse(rest);
      }).toThrow();
    });

    it('should reject if worldHistory missing', () => {
      expect(() => {
        const { worldHistory, ...rest } = baseValidState;
        WorldConfigStateSchema.parse(rest);
      }).toThrow();
    });
  });

  describe('Invalid Inputs', () => {
    it('should reject structureDensity > 20', () => {
      expect(() => {
        WorldConfigStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, structureDensity: 21 },
        });
      }).toThrow();
    });

    it('should reject structureDensity < 1', () => {
      expect(() => {
        WorldConfigStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, structureDensity: 0 },
        });
      }).toThrow();
    });

    it('should reject terrainComplexity > 5', () => {
      expect(() => {
        WorldConfigStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, terrainComplexity: 6 },
        });
      }).toThrow();
    });

    it('should reject invalid roadQuality', () => {
      expect(() => {
        WorldConfigStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, roadQuality: 'invalid' },
        });
      }).toThrow();
    });
  });
});

describe('WorldConfigInputSchema', () => {
  it('should accept valid input with all Section 1 dependencies', () => {
    const input: WorldConfigInput = {
      roomId: 'test-room',
      settings: {
        structureDensity: 5,
        structureTypes: ['settlements', 'ruins'],
        enableRoads: true,
        roadQuality: 'road',
        terrainComplexity: 3,
      },
      historyPeriods: [
        {
          periodNumber: 0,
          startYear: 0,
          endYear: 50,
          narrative: '...',
          structures: [],
          entropyEvents: [],
          conditions: [],
        },
      ],
      conditions: [
        {
          type: 'World Condition' as const,
          key: 'Test1',
          values: [],
          currentValue: '',
          description: '',
          lastUpdatedTurn: 0,
        },
        {
          type: 'World Condition' as const,
          key: 'Test2',
          values: [],
          currentValue: '',
          description: '',
          lastUpdatedTurn: 0,
        },
        {
          type: 'World Condition' as const,
          key: 'Test3',
          values: [],
          currentValue: '',
          description: '',
          lastUpdatedTurn: 0,
        },
        {
          type: 'World Condition' as const,
          key: 'Test4',
          values: [],
          currentValue: '',
          description: '',
          lastUpdatedTurn: 0,
        },
        {
          type: 'World Condition' as const,
          key: 'Test5',
          values: [],
          currentValue: '',
          description: '',
          lastUpdatedTurn: 0,
        },
      ],
      worldHistory: 'Ancient kingdom...',
    };

    const result = WorldConfigInputSchema.parse(input);
    expect(result.historyPeriods).toBeDefined();
    expect(result.conditions).toHaveLength(5);
    expect(result.worldHistory).toBe('Ancient kingdom...');
  });

  it('should not include internal state fields', () => {
    const input = {
      roomId: 'test',
      settings: {
        structureDensity: 5,
        structureTypes: [],
        enableRoads: false,
        terrainComplexity: 1,
      },
      historyPeriods: [
        {
          periodNumber: 0,
          startYear: 0,
          endYear: 50,
          narrative: '',
          structures: [],
          entropyEvents: [],
          conditions: [],
        },
      ],
      conditions: Array(5).fill({
        type: 'World Condition',
        key: '',
        values: [],
        currentValue: '',
        description: '',
        lastUpdatedTurn: 0,
      }),
      worldHistory: 'History...',
      structures: [], // Should be ignored
      roads: [], // Should be ignored
    };

    const result = WorldConfigInputSchema.parse(input);
    expect(result).not.toHaveProperty('structures');
    expect(result).not.toHaveProperty('roads');
  });
});

describe('WorldConfigOutputSchema', () => {
  it('should require structures and worldDescription', () => {
    const output: WorldConfigOutput = {
      structures: [],
      roads: [],
      worldDescription: 'The kingdom sprawls...',
      generatedChunks: [],
      gridState: null,
    };

    const result = WorldConfigOutputSchema.parse(output);
    expect(result.structures).toBeDefined();
    expect(result.worldDescription).toBeDefined();
  });

  it('should reject output missing structures', () => {
    expect(() => {
      WorldConfigOutputSchema.parse({
        roads: [],
        worldDescription: 'Description...',
        generatedChunks: [],
        gridState: null,
      });
    }).toThrow();
  });

  it('should reject output missing worldDescription', () => {
    expect(() => {
      WorldConfigOutputSchema.parse({
        structures: [],
        roads: [],
        generatedChunks: [],
        gridState: null,
      });
    }).toThrow();
  });
});
