import { describe, it, expect } from 'vitest';
import {
  CharacterStateSchema,
  CharacterInputSchema,
  CharacterOutputSchema,
  type CharacterState,
  type CharacterInput,
  type CharacterOutput,
} from './character-state';

// Mock character used across all tests
const mockCharacter = {
  name: 'Thorin Ironfist',
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
  attributes: {
    Strength: 16,
    Dexterity: 14,
    Constitution: 15,
    Intelligence: 10,
    Wisdom: 12,
    Charisma: 8,
  },
  savingThrows: { fortitude: 4, reflex: 2, will: 1 },
  skills: { Athletics: 5, Intimidation: 1 },
  skillDetails: [],
  expertises: [],
  attacks: [{ name: 'Battleaxe', bonus: '+5', damageType: 'slashing' }],
  equipment: 'Chain mail, battleaxe, shield',
  currency: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
  proficienciesAndLanguages: 'Common, Dwarvish',
  features: 'Second Wind',
  talents: [],
  appearance: {
    age: '45',
    height: '4\'6"',
    weight: '180 lbs',
    eyes: 'Brown',
    skin: 'Ruddy',
    hair: 'Black beard',
    description: 'Stocky dwarf',
  },
  personality: {
    traits: 'Gruff but loyal',
    ideals: 'Honor',
    bonds: 'My clan',
    flaws: 'Stubborn',
  },
  backstory: 'Former soldier',
  backgroundDetails: {
    origin: 'Mountain halls',
    upbringing: 'Military family',
    motivation: 'Restore honor',
    keyEvents: ['Battle of Iron Peak'],
  },
  alliesAndOrganizations: 'Iron Guard',
  treasure: 'None',
  resourcePools: [],
  advancementPoints: { ability: 0, skill: 0, talent: 0 },
  spellcasting: {
    class: 'Fighter',
    ability: 'None',
    saveDC: 0,
    attackBonus: 0,
    cantrips: [],
    spellsKnown: [],
    slots: [],
  },
};

describe('CharacterStateSchema', () => {
  const baseValidState: CharacterState = {
    playerId: 'player-123',
    roomId: 'room-abc',
    character: mockCharacter,
    worldHistory: 'The ancient kingdom fell to darkness...',
    worldDescription: 'The kingdom sprawls across verdant hills...',
  };

  describe('Valid Inputs', () => {
    it('should accept valid per-player state', () => {
      const result = CharacterStateSchema.parse(baseValidState);
      expect(result.playerId).toBe('player-123');
      expect(result.roomId).toBe('room-abc');
      expect(result.character.name).toBe('Thorin Ironfist');
    });

    it('should accept optional spawnPoint', () => {
      const withSpawn: CharacterState = {
        ...baseValidState,
        spawnPoint: { x: 100, y: 200, z: 0 },
      };

      const result = CharacterStateSchema.parse(withSpawn);
      expect(result.spawnPoint).toEqual({ x: 100, y: 200, z: 0 });
    });

    it('should accept optional openingNarrative', () => {
      const withOpening: CharacterState = {
        ...baseValidState,
        openingNarrative: 'You stand at the edge of Hollowspire...',
      };

      const result = CharacterStateSchema.parse(withOpening);
      expect(result.openingNarrative).toBe('You stand at the edge of Hollowspire...');
    });

    it('should validate complete character sheet', () => {
      const result = CharacterStateSchema.parse(baseValidState);
      expect(result.character.level).toBe(1);
      expect(result.character.armorClass).toBe(16);
      expect(result.character.attributes.Strength).toBe(16);
    });
  });

  describe('Section 1 & 2 Dependency Validation', () => {
    it('should require worldHistory from Section 1', () => {
      expect(() => {
        CharacterStateSchema.parse({
          ...baseValidState,
          worldHistory: '',
        });
      }).toThrow('World history required from Section 1');
    });

    it('should require worldDescription from Section 2', () => {
      expect(() => {
        CharacterStateSchema.parse({
          ...baseValidState,
          worldDescription: '',
        });
      }).toThrow('World description required from Section 2');
    });

    it('should reject if worldHistory missing', () => {
      expect(() => {
        const { worldHistory, ...rest } = baseValidState;
        CharacterStateSchema.parse(rest);
      }).toThrow();
    });

    it('should reject if worldDescription missing', () => {
      expect(() => {
        const { worldDescription, ...rest } = baseValidState;
        CharacterStateSchema.parse(rest);
      }).toThrow();
    });
  });

  describe('Invalid Inputs', () => {
    it('should reject empty playerId', () => {
      expect(() => {
        CharacterStateSchema.parse({
          ...baseValidState,
          playerId: '',
        });
      }).toThrow('Player ID required');
    });

    it('should reject empty roomId', () => {
      expect(() => {
        CharacterStateSchema.parse({
          ...baseValidState,
          roomId: '',
        });
      }).toThrow('Room ID required');
    });

    it('should reject invalid character sheet', () => {
      expect(() => {
        CharacterStateSchema.parse({
          ...baseValidState,
          character: null, // Invalid: must be an object
        });
      }).toThrow();
    });
  });
});

describe('CharacterInputSchema', () => {
  it('should accept valid input with Section 1 & 2 dependencies', () => {
    const input: CharacterInput = {
      playerId: 'player-1',
      roomId: 'room-1',
      character: mockCharacter,
      worldHistory: 'The kingdom fell...',
      worldDescription: 'The land sprawls...',
    };

    const result = CharacterInputSchema.parse(input);
    expect(result.playerId).toBe('player-1');
    expect(result.worldHistory).toBe('The kingdom fell...');
    expect(result.worldDescription).toBe('The land sprawls...');
  });

  it('should not include output fields', () => {
    const input = {
      playerId: 'player-1',
      roomId: 'room-1',
      character: mockCharacter,
      worldHistory: 'History...',
      worldDescription: 'Description...',
      openingNarrative: 'Should be ignored', // Output field
    };

    const result = CharacterInputSchema.parse(input);
    expect(result).not.toHaveProperty('openingNarrative');
  });
});

describe('CharacterOutputSchema', () => {
  it('should require playerId, openingNarrative, and character', () => {
    const output: CharacterOutput = {
      playerId: 'player-1',
      openingNarrative: 'You stand at the gates...',
      character: mockCharacter,
    };

    const result = CharacterOutputSchema.parse(output);
    expect(result.playerId).toBe('player-1');
    expect(result.openingNarrative).toBe('You stand at the gates...');
    expect(result.character).toBeDefined();
  });

  it('should reject output missing openingNarrative', () => {
    expect(() => {
      CharacterOutputSchema.parse({
        playerId: 'player-1',
        character: mockCharacter,
      });
    }).toThrow();
  });

  it('should reject output missing character', () => {
    expect(() => {
      CharacterOutputSchema.parse({
        playerId: 'player-1',
        openingNarrative: 'Narrative...',
      });
    }).toThrow();
  });
});
