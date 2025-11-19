/**
 * Graph Sections API Integration Tests
 * Tests all 3 section graph endpoints
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import type { Response } from 'express';
import graphSectionsRouter from '../graph-sections';
import { authenticate } from '@/middleware/auth';
import { errorHandler } from '@/middleware/error';

// Mock dependencies
jest.mock('@/graph/world/dm-story');
jest.mock('@/graph/world/world-config');
jest.mock('@/graph/character/setup');
jest.mock('@/services/firestore');
jest.mock('@/middleware/auth');

import { createDMStoryGraph } from '@/graph/world/dm-story';
import { createWorldConfigGraph } from '@/graph/world/world-config';
import { createCharacterSetupGraph } from '@/graph/character/setup';
import { getRoom } from '@/services/firestore';

const mockCreateDMStoryGraph = createDMStoryGraph as jest.MockedFunction<typeof createDMStoryGraph>;
const mockCreateWorldConfigGraph = createWorldConfigGraph as jest.MockedFunction<typeof createWorldConfigGraph>;
const mockCreateCharacterSetupGraph = createCharacterSetupGraph as jest.MockedFunction<
  typeof createCharacterSetupGraph
>;
const mockGetRoom = getRoom as jest.MockedFunction<typeof getRoom>;
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/api/graph', graphSectionsRouter);
app.use(errorHandler);

describe('POST /api/graph/dm-story', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth middleware to attach user
    mockAuthenticate.mockImplementation((req: any, _res: Response, next) => {
      req.user = { uid: 'test-user', email: 'test@example.com', name: 'Test User', role: 'free' };
      next();
    });
  });

  const validInput = {
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
  };

  it('should return 200 with valid DMStoryOutput', async () => {
    mockGetRoom.mockResolvedValue({
      id: 'test-room',
      ownerId: 'test-user',
    } as any);

    const mockResult = {
      roomId: 'test-room',
      worldHistory: 'The ancient kingdom fell...',
      conditions: [
        {
          type: 'World Condition',
          key: 'Political Climate',
          values: [],
          currentValue: '',
          description: '',
          lastUpdatedTurn: 0,
        },
      ],
      historyPeriods: [],
      currentPeriod: 10,
      totalPeriods: 10,
    };

    const mockGraph = {
      invoke: jest.fn().mockResolvedValue(mockResult),
    };

    mockCreateDMStoryGraph.mockReturnValue(mockGraph as any);

    const response = await request(app).post('/api/graph/dm-story').send(validInput).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('worldHistory');
    expect(response.body.data).toHaveProperty('conditions');
    expect(response.body.data).toHaveProperty('historyPeriods');
  });

  it('should return 400 for invalid input (missing theme)', async () => {
    const invalidInput = {
      roomId: 'test-room',
      settings: {
        // Missing theme
        tone: 'Heroic',
      },
    };

    const response = await request(app).post('/api/graph/dm-story').send(invalidInput).expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details).toBeDefined();
  });

  it('should return 403 if user is not room owner', async () => {
    mockGetRoom.mockResolvedValue({
      id: 'test-room',
      ownerId: 'different-user', // Not the authenticated user
    } as any);

    const response = await request(app).post('/api/graph/dm-story').send(validInput).expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('owner');
  });

  it('should return 404 if room not found', async () => {
    mockGetRoom.mockResolvedValue(null as any);

    const response = await request(app).post('/api/graph/dm-story').send(validInput).expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Room not found');
  });
});

describe('POST /api/graph/world-config', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticate.mockImplementation((req: any, _res: Response, next) => {
      req.user = { uid: 'test-user', email: 'test@example.com', name: 'Test User', role: 'free' };
      next();
    });
  });

  const validInput = {
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
        narrative: 'Period narrative...',
        structures: [],
        entropyEvents: [],
        conditions: [],
      },
    ],
    conditions: Array(5)
      .fill(null)
      .map((_, i) => ({
        type: 'World Condition',
        key: `Condition ${i}`,
        values: [],
        currentValue: '',
        description: '',
        lastUpdatedTurn: 0,
      })),
    worldHistory: 'Ancient kingdom...',
  };

  it('should return 200 with valid WorldConfigOutput', async () => {
    mockGetRoom.mockResolvedValue({
      id: 'test-room',
      ownerId: 'test-user',
    } as any);

    const mockResult = {
      roomId: 'test-room',
      structures: [],
      roads: [],
      worldDescription: 'The kingdom sprawls...',
      generatedChunks: [],
      gridState: null,
      terrainMap: null,
    };

    const mockGraph = {
      invoke: jest.fn().mockResolvedValue(mockResult),
    };

    mockCreateWorldConfigGraph.mockReturnValue(mockGraph as any);

    const response = await request(app).post('/api/graph/world-config').send(validInput).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('worldDescription');
    expect(response.body.data).toHaveProperty('structures');
  });

  it('should return 400 if Section 1 dependencies missing', async () => {
    const invalidInput = {
      roomId: 'test-room',
      settings: validInput.settings,
      // Missing: historyPeriods, conditions, worldHistory
    };

    const response = await request(app).post('/api/graph/world-config').send(invalidInput).expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Validation failed');
  });

  it('should return 400 if historyPeriods empty', async () => {
    const invalidInput = {
      ...validInput,
      historyPeriods: [], // Empty array
    };

    const response = await request(app).post('/api/graph/world-config').send(invalidInput).expect(400);

    expect(response.body.success).toBe(false);
  });
});

describe('POST /api/graph/character/:playerId', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticate.mockImplementation((req: any, _res: Response, next) => {
      req.user = { uid: 'test-user', email: 'test@example.com', name: 'Test User', role: 'free' };
      next();
    });
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
    equipment: 'Chain mail',
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

  const validInput = {
    roomId: 'test-room',
    character: mockCharacter,
    worldHistory: 'The kingdom fell...',
    worldDescription: 'The land sprawls...',
  };

  it('should return 200 with valid CharacterOutput', async () => {
    mockGetRoom.mockResolvedValue({
      id: 'test-room',
      ownerId: 'test-user',
    } as any);

    const mockResult = {
      playerId: 'player-1',
      openingNarrative: 'You stand at the gates...',
      character: mockCharacter,
    };

    const mockGraph = {
      invoke: jest.fn().mockResolvedValue(mockResult),
    };

    mockCreateCharacterSetupGraph.mockReturnValue(mockGraph as any);

    const response = await request(app).post('/api/graph/character/player-1').send(validInput).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('openingNarrative');
    expect(response.body.data).toHaveProperty('character');
    expect(response.body.data.playerId).toBe('player-1');
  });

  it('should return 400 if Section 1/2 dependencies missing', async () => {
    const invalidInput = {
      roomId: 'test-room',
      character: mockCharacter,
      // Missing: worldHistory, worldDescription
    };

    const response = await request(app).post('/api/graph/character/player-1').send(invalidInput).expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should extract playerId from URL params', async () => {
    mockGetRoom.mockResolvedValue({
      id: 'test-room',
      ownerId: 'test-user',
    } as any);

    const mockGraph = {
      invoke: jest.fn().mockResolvedValue({
        playerId: 'player-abc',
        openingNarrative: 'Opening...',
        character: mockCharacter,
      }),
    };

    mockCreateCharacterSetupGraph.mockReturnValue(mockGraph as any);

    await request(app).post('/api/graph/character/player-abc').send(validInput).expect(200);

    // Verify graph was invoked with playerId from URL
    expect(mockGraph.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: 'player-abc',
      })
    );
  });
});
