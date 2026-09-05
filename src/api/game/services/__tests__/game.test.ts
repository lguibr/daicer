/* eslint-disable */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import gameServiceFactory from '@/api/game/services/game';

// Mock Strapi Services
const mockWorldGen = { generateWorld: vi.fn() };
const mockTurnProcessing = { processTurn: vi.fn(), submitAction: vi.fn(), executeDeterministicTurn: vi.fn() };
const mockEntityLifecycle = {
  generateEntityOpening: vi.fn(),
  generateMainOpening: vi.fn(),
  onboardPlayer: vi.fn(),
  createSnapshot: vi.fn(),
};
const mockVoxelEngine = { getChunk: vi.fn() };

const mockFindOne = vi.fn();
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();
const mockLogInfo = vi.fn();
const mockLogWarn = vi.fn();
const mockLogError = vi.fn();

const mockStrapi: any = {
  service: vi.fn((uid) => {
    switch (uid) {
      case 'api::game.world-generation':
        return mockWorldGen;
      case 'api::game.turn-processing':
        return mockTurnProcessing;
      case 'api::game.entity-lifecycle':
        return mockEntityLifecycle;
      case 'api::voxel-engine.voxel-engine':
        return mockVoxelEngine;
      default:
        return {};
    }
  }),
  documents: vi.fn(() => ({
    findOne: mockFindOne,
    findMany: mockFindMany,
    update: mockUpdate,
    create: mockCreate,
  })),
  log: {
    info: mockLogInfo,
    warn: mockLogWarn,
    error: mockLogError,
  },
};

describe('Game Service', () => {
  let service: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = gameServiceFactory({ strapi: mockStrapi });
  });

  describe('Delegation Methods', () => {
    it('generateWorld delegates to world-generation', async () => {
      await service.generateWorld({}, 'en');
      expect(mockWorldGen.generateWorld).toHaveBeenCalled();
    });

    it('processTurn delegates to turn-processing', async () => {
      await service.processTurn('r1', 'desc', [], [], []);
      expect(mockTurnProcessing.processTurn).toHaveBeenCalled();
    });

    it('processTurn fetches chunk if settings provided', async () => {
      // Mock players to have position for chunk calc
      const players = [{ position: { x: 32, y: 32 } }];
      mockVoxelEngine.getChunk.mockResolvedValue('chunk-data');
      await service.processTurn('r1', 'desc', [], players, [], 'en', { biome: 'plains' });
      expect(mockVoxelEngine.getChunk).toHaveBeenCalledWith(1, 1, { biome: 'plains' });
      expect(mockTurnProcessing.processTurn).toHaveBeenCalledWith(
        'r1',
        'desc',
        [],
        players,
        'en',
        { biome: 'plains' },
        undefined,
        undefined,
        undefined,
        'chunk-data'
      );
    });

    it.each(['addPlayerEntity', 'addCharacter'])('%s delegates to canonical onboarding', async (method) => {
      const character = { documentId: 'blueprint-1' };
      const user = { id: 7 };
      const sheet = { documentId: 'sheet-1' };
      mockEntityLifecycle.onboardPlayer.mockResolvedValueOnce(sheet);
      await expect(service[method]('r1', character, user)).resolves.toBe(sheet);
      expect(mockEntityLifecycle.onboardPlayer).toHaveBeenCalledExactlyOnceWith('r1', character, user);
    });

    it('submitAction delegates to turn-processing', async () => {
      await service.submitAction('r1', 'cmd', {});
      expect(mockTurnProcessing.submitAction).toHaveBeenCalled();
    });
  });

  describe('spawnCreature', () => {
    it('should create a creature and update the room', async () => {
      const roomData = { documentId: 'r1', creatures: [] };
      mockFindOne.mockResolvedValue(roomData);

      await service.spawnCreature('r1', { name: 'Goblin', hp: 5 });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 'r1',
          data: expect.objectContaining({
            creatures: expect.arrayContaining([expect.objectContaining({ name: 'Goblin', hp: 5 })]),
          }),
        })
      );
    });
  });

  describe('togglePlayerReady', () => {
    it('should update player ready status', async () => {
      const roomData = {
        documentId: 'r1',
        players: [{ user: { documentId: 'u1' }, isReady: false }],
      };
      mockFindMany.mockResolvedValue([roomData]);

      await service.togglePlayerReady('r1', 'u1', true);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 'r1',
          data: expect.objectContaining({
            players: expect.arrayContaining([expect.objectContaining({ isReady: true })]),
          }),
        })
      );
    });

    it('should throw if player not found', async () => {
      mockFindMany.mockResolvedValue([{ documentId: 'r1', players: [] }]); // No players
      await expect(service.togglePlayerReady('r1', 'u1', true)).rejects.toThrow('User is not a player');
    });
  });

  describe('startGame', () => {
    const roomData = {
      documentId: 'r1',
      world: { description: 'World Desc' },
      dmSettings: {},
      players: [
        { user: { documentId: 'u1' }, isReady: true, documentId: 'p1', characterSheet: { documentId: 'sheet1' } },
      ],
      entity_sheets: [{ documentId: 'sheet1', name: 'Hero' }],
    };

    it('should fail if players are not ready', async () => {
      mockFindMany.mockResolvedValue([{ ...roomData, players: [{ isReady: false, name: 'Lazy' }] }]);
      await expect(service.startGame('r1')).rejects.toThrow('The following players are not ready: Lazy');
    });

    it('should orchestration game start flow', async () => {
      mockFindMany.mockResolvedValue([roomData]);
      // Mock room reload with sheets for snapshot
      mockFindOne.mockResolvedValue({ ...roomData, entity_sheets: [] });

      mockEntityLifecycle.generateMainOpening.mockResolvedValue('Main Opening Text');
      mockEntityLifecycle.generateEntityOpening.mockResolvedValue('Private Opening Text');
      mockEntityLifecycle.createSnapshot.mockReturnValue([]);
      mockCreate.mockImplementation((args) => ({ documentId: 'turn0' })); // for Turn and Message creation

      const result = await service.startGame('r1');

      expect(result.success).toBe(true);
      expect(mockEntityLifecycle.generateMainOpening).toHaveBeenCalled();
      expect(mockEntityLifecycle.generateEntityOpening).toHaveBeenCalled();
      // Check Turn 0 Creation
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ turnNumber: 0, narrative: 'Game Start' }),
        })
      );
      // Check Message Creation
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ content: 'Main Opening Text' }),
        })
      );
      // Check Private Message Creation
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ content: 'Private Opening Text', recipient: 'u1' }),
        })
      );
      // Check Room Active Status
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: true, phase: 'game' }),
        })
      );
    });
  });

  describe('Hardening Edge Cases', () => {
    it('processTurn: should proceed even if chunk fetch fails', async () => {
      mockVoxelEngine.getChunk.mockRejectedValue(new Error('Chunk Error'));
      // Should not throw
      await service.processTurn('r1', 'desc', [], [{ position: { x: 0, y: 0 } }], [], 'en', { biome: 'plains' });
      expect(mockLogWarn).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch chunk'), expect.anything());
      expect(mockTurnProcessing.processTurn).toHaveBeenCalled();
    });

    it('startGame: should fail if room not found', async () => {
      mockFindMany.mockResolvedValue([]);
      await expect(service.startGame('invalid-room')).rejects.toThrow('Room not found');
    });

    it('startGame: should fail if no players in room', async () => {
      mockFindMany.mockResolvedValue([{ documentId: 'r1', players: [] }]);
      await expect(service.startGame('r1')).rejects.toThrow('Cannot start game with no players');
    });

    it('startGame: should skip private opening if character sheet invalid', async () => {
      const roomData = {
        documentId: 'r1',
        players: [{ user: 'u1', isReady: true, characterSheet: null }],
        world: { description: 'W' },
        dmSettings: {},
      };
      mockFindMany.mockResolvedValue([roomData]);
      mockFindOne.mockResolvedValue(roomData);
      mockCreate.mockResolvedValue({ documentId: 't1' });
      mockEntityLifecycle.createSnapshot.mockReturnValue([]);

      await service.startGame('r1');

      // Should verify that generateEntityOpening was NOT called (or called 0 times)
      expect(mockEntityLifecycle.generateEntityOpening).not.toHaveBeenCalled();
    });

    it('spawnCreature: should throw if room not found', async () => {
      mockFindOne.mockResolvedValue(null);
      await expect(service.spawnCreature('invalid', {})).rejects.toThrow('Room not found');
    });

    it('spawnCreature: should use default HP if not provided', async () => {
      mockFindOne.mockResolvedValue({ documentId: 'r1', creatures: [] });
      await service.spawnCreature('r1', { name: 'Blob' });
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creatures: expect.arrayContaining([expect.objectContaining({ name: 'Blob', hp: 10, maxHp: 10 })]),
          }),
        })
      );
    });
  });
});
