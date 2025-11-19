/**
 * Character Setup Graph Integration Tests
 * Tests complete Section 3 graph execution (per-player)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createCharacterSetupGraph } from '../index';
import type { CharacterState } from '@daicer/shared/graph-states';
import { CharacterOutputSchema } from '@daicer/shared/graph-states';

// Mock services
jest.mock('@/services/llm');
jest.mock('@/services/equipment/equipmentService');

import { generateText } from '@/services/llm';
import { calculateStatModifiers } from '@/services/equipment/equipmentService';

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;
const mockCalculateStatModifiers = calculateStatModifiers as jest.MockedFunction<typeof calculateStatModifiers>;

describe('Character Setup Graph (Section 3) - Integration', () => {
  let graph: ReturnType<typeof createCharacterSetupGraph>;

  beforeEach(() => {
    graph = createCharacterSetupGraph();
    jest.clearAllMocks();
  });

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
    equipment: 'Chain mail, battleaxe',
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

  const baseInput: CharacterState = {
    playerId: 'player-1',
    roomId: 'room-abc',
    character: mockCharacter,
    worldHistory: 'The ancient kingdom fell...',
    worldDescription: 'The kingdom sprawls...',
  };

  it('should generate opening narrative for character', async () => {
    mockGenerateText.mockResolvedValue('You stand at the gates of Hollowspire...');

    const result = await graph.invoke(baseInput);

    expect(result.openingNarrative).toBe('You stand at the gates of Hollowspire...');
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
  });

  it('should produce valid CharacterOutput', async () => {
    mockGenerateText.mockResolvedValue('Opening narrative...');

    const result = await graph.invoke(baseInput);

    const output = {
      playerId: result.playerId,
      openingNarrative: result.openingNarrative!,
      character: result.character,
    };

    expect(() => CharacterOutputSchema.parse(output)).not.toThrow();
  });

  it('should skip equipment if old string format', async () => {
    mockGenerateText.mockResolvedValue('Opening...');

    const result = await graph.invoke(baseInput);

    expect(mockCalculateStatModifiers).not.toHaveBeenCalled();
    expect(result.character.equipment).toBe('Chain mail, battleaxe');
  });
});
