import { describe, it, expect } from 'vitest';
import {
  DMStoryStateSchema,
  DMStoryInputSchema,
  DMStoryOutputSchema,
  type DMStoryState,
  type DMStoryInput,
  type DMStoryOutput,
} from './dm-story-state';

describe('DMStoryStateSchema', () => {
  const baseValidState: DMStoryState = {
    roomId: 'test-room-123',
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

  describe('Valid Inputs', () => {
    it('should accept minimal required fields', () => {
      const result = DMStoryStateSchema.parse(baseValidState);
      expect(result.roomId).toBe('test-room-123');
      expect(result.language).toBe('en');
    });

    it('should accept all optional fields', () => {
      const withOptional: DMStoryState = {
        ...baseValidState,
        language: 'es',
        settings: {
          ...baseValidState.settings,
          worldBackground: 'Additional lore about the world',
          dmStyle: {
            ...baseValidState.settings.dmStyle,
            specialMode: 'Grimdark',
            customDirectives: 'Focus on political intrigue',
          },
        },
        worldHistory: 'The ancient kingdom fell...',
      };

      const result = DMStoryStateSchema.parse(withOptional);
      expect(result.language).toBe('es');
      expect(result.settings.worldBackground).toBe('Additional lore about the world');
      expect(result.settings.dmStyle.specialMode).toBe('Grimdark');
      expect(result.settings.dmStyle.customDirectives).toBe('Focus on political intrigue');
      expect(result.worldHistory).toBe('The ancient kingdom fell...');
    });

    it('should use default values for optional fields', () => {
      const minimal = {
        roomId: 'test',
        settings: {
          theme: 'Fantasy',
          tone: 'Heroic',
          setting: 'Medieval',
          worldType: 'terra' as const,
          dmStyle: {
            verbosity: 3,
            detail: 3,
            engagement: 3,
            narrative: 3,
            specialMode: null,
          },
          worldSize: 'medium' as const,
          adventureLength: 'medium' as const,
          difficulty: 'medium' as const,
          historyDepth: 0,
          eraCount: 1,
        },
      };

      const result = DMStoryStateSchema.parse(minimal);
      expect(result.language).toBe('en'); // Default
      expect(result.historyPeriods).toEqual([]); // Default
      expect(result.currentPeriod).toBe(0); // Default
      expect(result.totalPeriods).toBe(0); // Default
      expect(result.conditions).toEqual([]); // Default
    });

    it('should accept all language options', () => {
      ['en', 'es', 'pt-BR'].forEach((lang) => {
        const result = DMStoryStateSchema.parse({
          ...baseValidState,
          language: lang,
        });
        expect(result.language).toBe(lang);
      });
    });

    it('should accept all worldType options', () => {
      const types = ['terra', 'water', 'desert', 'ice', 'volcanic', 'forest', 'sky', 'underground'];
      types.forEach((type) => {
        const result = DMStoryStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, worldType: type as any },
        });
        expect(result.settings.worldType).toBe(type);
      });
    });

    it('should accept all DM special modes', () => {
      const modes = ['Classic', 'Courtly', 'Grimdark', 'Corsair', 'Shakespearean', 'Noir', 'Storybook', null];
      modes.forEach((mode) => {
        const result = DMStoryStateSchema.parse({
          ...baseValidState,
          settings: {
            ...baseValidState.settings,
            dmStyle: { ...baseValidState.settings.dmStyle, specialMode: mode as any },
          },
        });
        expect(result.settings.dmStyle.specialMode).toBe(mode);
      });
    });

    it('should accept historyDepth = 0 (no history)', () => {
      const result = DMStoryStateSchema.parse({
        ...baseValidState,
        settings: { ...baseValidState.settings, historyDepth: 0 },
      });
      expect(result.settings.historyDepth).toBe(0);
    });

    it('should accept historyDepth = 2000 (max)', () => {
      const result = DMStoryStateSchema.parse({
        ...baseValidState,
        settings: { ...baseValidState.settings, historyDepth: 2000 },
      });
      expect(result.settings.historyDepth).toBe(2000);
    });
  });

  describe('Invalid Inputs', () => {
    it('should reject empty roomId', () => {
      expect(() => {
        DMStoryStateSchema.parse({
          ...baseValidState,
          roomId: '',
        });
      }).toThrow('Room ID required');
    });

    it('should reject historyDepth > 2000', () => {
      expect(() => {
        DMStoryStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, historyDepth: 3000 },
        });
      }).toThrow();
    });

    it('should reject historyDepth < 0', () => {
      expect(() => {
        DMStoryStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, historyDepth: -1 },
        });
      }).toThrow();
    });

    it('should reject invalid language', () => {
      expect(() => {
        DMStoryStateSchema.parse({
          ...baseValidState,
          language: 'fr',
        });
      }).toThrow();
    });

    it('should reject empty theme', () => {
      expect(() => {
        DMStoryStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, theme: '' },
        });
      }).toThrow('Theme required');
    });

    it('should reject verbosity > 6', () => {
      expect(() => {
        DMStoryStateSchema.parse({
          ...baseValidState,
          settings: {
            ...baseValidState.settings,
            dmStyle: { ...baseValidState.settings.dmStyle, verbosity: 7 },
          },
        });
      }).toThrow();
    });

    it('should reject eraCount > 10', () => {
      expect(() => {
        DMStoryStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, eraCount: 11 },
        });
      }).toThrow();
    });

    it('should reject eraCount < 1', () => {
      expect(() => {
        DMStoryStateSchema.parse({
          ...baseValidState,
          settings: { ...baseValidState.settings, eraCount: 0 },
        });
      }).toThrow();
    });
  });
});

describe('DMStoryInputSchema', () => {
  it('should accept valid input with only required fields', () => {
    const input: DMStoryInput = {
      roomId: 'test-room',
      language: 'en',
      settings: {
        theme: 'High Fantasy',
        tone: 'Heroic',
        setting: 'Medieval',
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
    };

    const result = DMStoryInputSchema.parse(input);
    expect(result.roomId).toBe('test-room');
    expect(result.settings.theme).toBe('High Fantasy');
  });

  it('should not include internal state fields', () => {
    const input = {
      roomId: 'test',
      language: 'en',
      settings: {
        theme: 'Fantasy',
        tone: 'Heroic',
        setting: 'Medieval',
        worldType: 'terra',
        dmStyle: { verbosity: 3, detail: 3, engagement: 3, narrative: 3, specialMode: null },
        worldSize: 'medium',
        adventureLength: 'medium',
        difficulty: 'medium',
        historyDepth: 0,
        eraCount: 1,
      },
      historyPeriods: [], // Should be ignored by InputSchema
      currentPeriod: 5, // Should be ignored
    };

    const result = DMStoryInputSchema.parse(input);
    expect(result).not.toHaveProperty('historyPeriods');
    expect(result).not.toHaveProperty('currentPeriod');
  });
});

describe('DMStoryOutputSchema', () => {
  it('should require worldHistory, conditions, and historyPeriods', () => {
    const output: DMStoryOutput = {
      roomId: 'test-room',
      worldHistory: 'The ancient kingdom fell...',
      conditions: [
        {
          type: 'World Condition' as const,
          key: 'Test',
          values: [],
          currentValue: '',
          description: '',
          lastUpdatedTurn: 0,
        },
      ],
      historyPeriods: [],
    };

    const result = DMStoryOutputSchema.parse(output);
    expect(result.worldHistory).toBeDefined();
    expect(result.conditions).toBeDefined();
    expect(result.historyPeriods).toBeDefined();
  });

  it('should reject output missing worldHistory', () => {
    expect(() => {
      DMStoryOutputSchema.parse({
        roomId: 'test',
        conditions: [],
        historyPeriods: [],
      });
    }).toThrow();
  });

  it('should reject output with empty conditions array', () => {
    expect(() => {
      DMStoryOutputSchema.parse({
        roomId: 'test',
        worldHistory: 'History...',
        conditions: [],
        historyPeriods: [],
      });
    }).toThrow('Conditions must be generated');
  });

  it('should reject output missing historyPeriods', () => {
    expect(() => {
      DMStoryOutputSchema.parse({
        roomId: 'test',
        worldHistory: 'History...',
        conditions: [],
      });
    }).toThrow();
  });
});
