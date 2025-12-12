import { describe, it, expect } from 'vitest';
import { mergeSectionOutputs, validateSection1Dependencies, validateSection2Dependencies } from './mergers';
import type { DMStoryOutput } from './dm-story-state';
import type { WorldConfigOutput } from './world-config-state';
import type { CharacterOutput } from './character-state';

describe('validateSection1Dependencies', () => {
  const validSection1Data = {
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
    conditions: Array(5).fill({
      type: 'World Condition',
      key: '',
      values: [],
      currentValue: '',
      description: '',
      lastUpdatedTurn: 0,
    }),
    worldHistory: 'Ancient kingdom...',
  };

  it('should pass with valid Section 1 output', () => {
    expect(() => {
      validateSection1Dependencies(validSection1Data);
    }).not.toThrow();
  });

  it('should throw if historyPeriods missing', () => {
    const { historyPeriods, ...rest } = validSection1Data;
    expect(() => {
      validateSection1Dependencies(rest);
    }).toThrow('Missing historyPeriods from Section 1');
  });

  it('should throw if historyPeriods empty', () => {
    expect(() => {
      validateSection1Dependencies({ ...validSection1Data, historyPeriods: [] });
    }).toThrow('Missing historyPeriods from Section 1');
  });

  it('should throw if conditions missing', () => {
    const { conditions, ...rest } = validSection1Data;
    expect(() => {
      validateSection1Dependencies(rest);
    }).toThrow('Missing or invalid conditions from Section 1');
  });

  it('should throw if conditions count !== 5', () => {
    expect(() => {
      validateSection1Dependencies({ ...validSection1Data, conditions: [] });
    }).toThrow('Missing or invalid conditions from Section 1');
  });

  it('should throw if worldHistory missing', () => {
    const { worldHistory, ...rest } = validSection1Data;
    expect(() => {
      validateSection1Dependencies(rest);
    }).toThrow('Missing worldHistory from Section 1');
  });

  it('should throw if worldHistory empty', () => {
    expect(() => {
      validateSection1Dependencies({ ...validSection1Data, worldHistory: '' });
    }).toThrow('Missing worldHistory from Section 1');
  });

  it('should throw if worldHistory only whitespace', () => {
    expect(() => {
      validateSection1Dependencies({ ...validSection1Data, worldHistory: '   ' });
    }).toThrow('Missing worldHistory from Section 1');
  });
});

describe('validateSection2Dependencies', () => {
  const validSection2Data = {
    worldDescription: 'The kingdom sprawls...',
  };

  it('should pass with valid Section 2 output', () => {
    expect(() => {
      validateSection2Dependencies(validSection2Data);
    }).not.toThrow();
  });

  it('should throw if worldDescription missing', () => {
    expect(() => {
      validateSection2Dependencies({});
    }).toThrow('Missing worldDescription from Section 2');
  });

  it('should throw if worldDescription empty', () => {
    expect(() => {
      validateSection2Dependencies({ worldDescription: '' });
    }).toThrow('Missing worldDescription from Section 2');
  });

  it('should throw if worldDescription only whitespace', () => {
    expect(() => {
      validateSection2Dependencies({ worldDescription: '   ' });
    }).toThrow('Missing worldDescription from Section 2');
  });
});

describe('mergeSectionOutputs', () => {
  const mockConditions = [
    {
      type: 'World Condition' as const,
      key: 'Political',
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

  const mockCharacter = {
    name: 'Thorin',
    race: 'Dwarf',
    characterClass: 'Fighter',
    background: 'Soldier',
    alignment: 'Lawful Good',
    level: 1,
    xp: 0,
    hp: 12,
    maxHp: 12,
    temporaryHp: 0,
    hitDice: { total: 1, current: 1 },
    deathSaves: { successes: 0, failures: 0 },
    armorClass: 16,
    initiative: 2,
    speed: 25,
    proficiencyBonus: 2,
    inspiration: false,
    baseAttackBonus: 3,
    attributes: { Strength: 16, Dexterity: 14, Constitution: 15, Intelligence: 10, Wisdom: 12, Charisma: 8 },
    savingThrows: { fortitude: 4, reflex: 2, will: 1 },
    skills: {},
    skillDetails: [],
    expertises: [],
    attacks: [],
    equipment: '',
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    proficienciesAndLanguages: '',
    features: '',
    talents: [],
    appearance: { age: '', height: '', weight: '', eyes: '', skin: '', hair: '', description: '' },
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    backstory: '',
    backgroundDetails: { origin: '', upbringing: '', motivation: '', keyEvents: [] },
    alliesAndOrganizations: '',
    treasure: '',
    resourcePools: [],
    advancementPoints: { ability: 0, skill: 0, talent: 0 },
    spellcasting: { class: '', ability: '', saveDC: 0, attackBonus: 0, cantrips: [], spellsKnown: [], slots: [] },
  };

  const section1: DMStoryOutput = {
    roomId: 'test-room',
    worldHistory: 'The ancient kingdom...',
    conditions: mockConditions,
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
  };

  const section2: WorldConfigOutput = {
    structures: [],
    roads: [],
    worldDescription: 'The kingdom sprawls...',
    generatedChunks: [],
    gridState: null,
  };

  describe('Valid Merges', () => {
    it('should merge with zero players (valid)', () => {
      const merged = mergeSectionOutputs(section1, section2, []);

      expect(merged.roomId).toBe('test-room');
      expect(merged.players).toHaveLength(0);
      expect(merged.worldHistory).toBe('The ancient kingdom...');
      expect(merged.worldDescription).toBe('The kingdom sprawls...');
    });

    it('should merge with one player', () => {
      const character1: CharacterOutput = {
        playerId: 'player-1',
        openingNarrative: 'You stand...',
        character: mockCharacter,
      };

      const merged = mergeSectionOutputs(section1, section2, [character1]);

      expect(merged.players).toHaveLength(1);
      expect(merged.players[0].id).toBe('player-1');
      expect(merged.players[0].name).toBe('Thorin');
      expect(merged.players[0].openingNarrative).toBe('You stand...');
      expect(merged.players[0].isReady).toBe(false);
      expect(merged.players[0].action).toBeNull();
    });

    it('should merge with 10 players (valid)', () => {
      const tenPlayers: CharacterOutput[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          playerId: `player-${i}`,
          openingNarrative: `Opening ${i}`,
          character: { ...mockCharacter, name: `Character ${i}` },
        }));

      const merged = mergeSectionOutputs(section1, section2, tenPlayers);

      expect(merged.players).toHaveLength(10);
      expect(merged.players[0].id).toBe('player-0');
      expect(merged.players[9].id).toBe('player-9');
    });

    it('should preserve all Section 1 fields', () => {
      const merged = mergeSectionOutputs(section1, section2, []);

      expect(merged.worldHistory).toBe(section1.worldHistory);
      expect(merged.worldConditions).toStrictEqual(section1.conditions);
      expect(merged.historyPeriods).toStrictEqual(section1.historyPeriods);
    });

    it('should preserve all Section 2 fields', () => {
      const merged = mergeSectionOutputs(section1, section2, []);

      expect(merged.worldDescription).toBe(section2.worldDescription);
      expect(merged.structures).toStrictEqual(section2.structures);
      expect(merged.roads).toStrictEqual(section2.roads);
      expect(merged.generatedChunks).toStrictEqual(section2.generatedChunks);
      expect(merged.gridState).toStrictEqual(section2.gridState);
    });

    it('should set joinedAt with unique timestamps', () => {
      const twoPlayers: CharacterOutput[] = [
        { playerId: 'p1', openingNarrative: 'O1', character: mockCharacter },
        { playerId: 'p2', openingNarrative: 'O2', character: mockCharacter },
      ];

      const merged = mergeSectionOutputs(section1, section2, twoPlayers);

      expect(merged.players[0].joinedAt).toBeLessThan(merged.players[1].joinedAt);
    });
  });

  describe('Section 1 Validation Errors', () => {
    it('should throw if Section 1 worldHistory missing', () => {
      const invalidSection1 = { ...section1, worldHistory: undefined } as any;

      expect(() => {
        mergeSectionOutputs(invalidSection1, section2, []);
      }).toThrow();
    });

    it('should throw if Section 1 worldHistory empty', () => {
      const invalidSection1 = { ...section1, worldHistory: '' } as any;

      expect(() => {
        mergeSectionOutputs(invalidSection1, section2, []);
      }).toThrow();
    });

    it('should throw if Section 1 conditions missing', () => {
      const invalidSection1 = { ...section1, conditions: undefined } as any;

      expect(() => {
        mergeSectionOutputs(invalidSection1, section2, []);
      }).toThrow();
    });

    it('should throw if Section 1 historyPeriods missing', () => {
      const invalidSection1 = { ...section1, historyPeriods: undefined } as any;

      expect(() => {
        mergeSectionOutputs(invalidSection1, section2, []);
      }).toThrow();
    });
  });

  describe('Section 2 Validation Errors', () => {
    it('should throw if Section 2 structures missing', () => {
      const invalidSection2 = { ...section2, structures: undefined } as any;

      expect(() => {
        mergeSectionOutputs(section1, invalidSection2, []);
      }).toThrow();
    });

    it('should throw if Section 2 structures not array', () => {
      const invalidSection2 = { ...section2, structures: 'not-an-array' } as any;

      expect(() => {
        mergeSectionOutputs(section1, invalidSection2, []);
      }).toThrow();
    });

    it('should throw if Section 2 worldDescription missing', () => {
      const invalidSection2 = { ...section2, worldDescription: undefined } as any;

      expect(() => {
        mergeSectionOutputs(section1, invalidSection2, []);
      }).toThrow();
    });

    it('should throw if Section 2 worldDescription empty', () => {
      const invalidSection2 = { ...section2, worldDescription: '' } as any;

      expect(() => {
        mergeSectionOutputs(section1, invalidSection2, []);
      }).toThrow();
    });
  });

  describe('Section 3 Validation Errors', () => {
    it('should throw if character missing playerId', () => {
      const invalidCharacter = {
        openingNarrative: 'Opening...',
        character: mockCharacter,
      } as any;

      expect(() => {
        mergeSectionOutputs(section1, section2, [invalidCharacter]);
      }).toThrow();
    });

    it('should throw if character missing openingNarrative', () => {
      const invalidCharacter = {
        playerId: 'player-1',
        character: mockCharacter,
      } as any;

      expect(() => {
        mergeSectionOutputs(section1, section2, [invalidCharacter]);
      }).toThrow();
    });

    it('should throw if character missing character field', () => {
      const invalidCharacter = {
        playerId: 'player-1',
        openingNarrative: 'Opening...',
      } as any;

      expect(() => {
        mergeSectionOutputs(section1, section2, [invalidCharacter]);
      }).toThrow();
    });

    it('should throw descriptive error with character index on validation failure', () => {
      const invalidCharacter = {
        playerId: 'p1',
        // Missing openingNarrative
        character: mockCharacter,
      } as any;

      expect(() => {
        mergeSectionOutputs(section1, section2, [invalidCharacter]);
      }).toThrow(/Character 0 validation failed/);
    });
  });

  describe('Duplicate Player ID Detection', () => {
    it('should throw if duplicate player IDs found', () => {
      const player1: CharacterOutput = {
        playerId: 'duplicate-id',
        openingNarrative: 'Opening 1',
        character: mockCharacter,
      };

      const player2: CharacterOutput = {
        playerId: 'duplicate-id', // Same ID!
        openingNarrative: 'Opening 2',
        character: mockCharacter,
      };

      expect(() => {
        mergeSectionOutputs(section1, section2, [player1, player2]);
      }).toThrow('Duplicate player ID found: duplicate-id');
    });

    it('should allow same player ID if only one instance', () => {
      const player: CharacterOutput = {
        playerId: 'unique-id',
        openingNarrative: 'Opening',
        character: mockCharacter,
      };

      const merged = mergeSectionOutputs(section1, section2, [player]);
      expect(merged.players).toHaveLength(1);
    });

    it('should detect duplicates in large player arrays', () => {
      const players: CharacterOutput[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          playerId: i === 3 ? 'player-0' : `player-${i}`, // Index 3 duplicates index 0
          openingNarrative: `Opening ${i}`,
          character: mockCharacter,
        }));

      expect(() => {
        mergeSectionOutputs(section1, section2, players);
      }).toThrow('Duplicate player ID found: player-0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle Section 2 with optional terrainMap undefined', () => {
      const section2NoTerrain: WorldConfigOutput = {
        ...section2,
        terrainMap: undefined,
      };

      const merged = mergeSectionOutputs(section1, section2NoTerrain, []);
      expect(merged.terrainMap).toBeUndefined();
    });

    it('should handle Section 2 with optional gridState undefined', () => {
      const section2NoGrid: WorldConfigOutput = {
        ...section2,
        gridState: undefined,
      };

      const merged = mergeSectionOutputs(section1, section2NoGrid, []);
      expect(merged.gridState).toBeUndefined();
    });

    it('should handle empty structures array', () => {
      const merged = mergeSectionOutputs(section1, section2, []);
      expect(merged.structures).toEqual([]);
    });

    it('should handle empty roads array', () => {
      const merged = mergeSectionOutputs(section1, section2, []);
      expect(merged.roads).toEqual([]);
    });

    it('should handle empty generatedChunks array', () => {
      const merged = mergeSectionOutputs(section1, section2, []);
      expect(merged.generatedChunks).toEqual([]);
    });
  });

  describe('Output Structure', () => {
    it('should produce merged state with all required fields', () => {
      const character: CharacterOutput = {
        playerId: 'p1',
        openingNarrative: 'You stand...',
        character: mockCharacter,
      };

      const merged = mergeSectionOutputs(section1, section2, [character]);

      // Check all top-level fields exist
      expect(merged).toHaveProperty('roomId');
      expect(merged).toHaveProperty('worldHistory');
      expect(merged).toHaveProperty('worldConditions');
      expect(merged).toHaveProperty('historyPeriods');
      expect(merged).toHaveProperty('worldDescription');
      expect(merged).toHaveProperty('structures');
      expect(merged).toHaveProperty('roads');
      expect(merged).toHaveProperty('generatedChunks');
      expect(merged).toHaveProperty('players');
    });

    it('should set default player fields correctly', () => {
      const character: CharacterOutput = {
        playerId: 'p1',
        openingNarrative: 'Opening',
        character: mockCharacter,
      };

      const merged = mergeSectionOutputs(section1, section2, [character]);
      const player = merged.players[0];

      expect(player.isReady).toBe(false);
      expect(player.action).toBeNull();
      expect(player.joinedAt).toBeGreaterThan(0);
    });

    it('should use playerId for both id and userId', () => {
      const character: CharacterOutput = {
        playerId: 'player-abc',
        openingNarrative: 'Opening',
        character: mockCharacter,
      };

      const merged = mergeSectionOutputs(section1, section2, [character]);
      const player = merged.players[0];

      expect(player.id).toBe('player-abc');
      expect(player.userId).toBe('player-abc');
    });

    it('should extract character name to player.name', () => {
      const character: CharacterOutput = {
        playerId: 'p1',
        openingNarrative: 'Opening',
        character: { ...mockCharacter, name: 'Gandalf' },
      };

      const merged = mergeSectionOutputs(section1, section2, [character]);
      expect(merged.players[0].name).toBe('Gandalf');
    });
  });

  describe('roomId Consistency', () => {
    it('should use Section 1 roomId', () => {
      const merged = mergeSectionOutputs(section1, section2, []);
      expect(merged.roomId).toBe('test-room');
    });

    it('should work when all sections have same roomId', () => {
      const character: CharacterOutput = {
        playerId: 'p1',
        openingNarrative: 'Opening',
        character: mockCharacter,
      };

      const merged = mergeSectionOutputs(section1, section2, [character]);
      expect(merged.roomId).toBe('test-room');
    });
  });
});
