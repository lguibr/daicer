import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorldGenerator } from '@/api/voxel-engine/services/world-generator-logic';
import gameEventFactory from '@/api/game-event/services/game-event';

// Mock Dependencies
const mockIsWalkable = vi.fn();
const mockGetChunk = vi.fn();

vi.mock('@/api/voxel-engine/services/world-generator-logic', () => ({
  WorldGenerator: vi.fn(function () {
    return { getChunk: mockGetChunk };
  }),
}));

vi.mock('@/api/voxel-engine/services/utils/physics', () => ({
  PhysicsEngine: vi.fn(function () {
    return { isWalkable: mockIsWalkable };
  }),
}));

describe('Game Event Service', () => {
  let strapi: any;
  let service: any;

  beforeEach(() => {
    vi.clearAllMocks();

    strapi = {
      log: {
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
      documents: vi.fn(),
    };

    service = gameEventFactory({ strapi });
  });

  describe('logEvent', () => {
    it('should throw if room not found', async () => {
      strapi.documents.mockReturnValue({
        findMany: vi.fn().mockResolvedValue([]),
      });

      await expect(service.logEvent('room-1', 'TEST', {})).rejects.toThrow('Room not found');
    });

    it('should create event with incremented turn number', async () => {
      const mockRoom = { documentId: 'doc-123' };
      const mockLastEvent = { turn_number: 5 };

      const findManyRoomMock = vi.fn().mockResolvedValue([mockRoom]);
      const findManyEventMock = vi.fn().mockResolvedValue([mockLastEvent]);
      const createEventMock = vi.fn().mockResolvedValue({ id: 99 });

      strapi.documents.mockImplementation((uid: string) => {
        if (uid === 'api::room.room') return { findMany: findManyRoomMock };
        if (uid === 'api::game-event.game-event')
          return {
            findMany: findManyEventMock,
            create: createEventMock,
          };
        return {};
      });

      await service.logEvent('room-public', 'MOVE', { x: 1 });

      const createCall = createEventMock.mock.calls[0][0];
      expect(createCall.data.turnNumber).toBe(6);
      expect(createCall.data.type).toBe('MOVE');
    });

    it('should start at turn 1 if no events', async () => {
      const mockRoom = { documentId: 'doc-123' };

      const findManyRoomMock = vi.fn().mockResolvedValue([mockRoom]);
      const findManyEventMock = vi.fn().mockResolvedValue([]);
      const createEventMock = vi.fn().mockResolvedValue({ id: 99 });

      strapi.documents.mockImplementation((uid: string) => {
        if (uid === 'api::room.room') return { findMany: findManyRoomMock };
        if (uid === 'api::game-event.game-event')
          return {
            findMany: findManyEventMock,
            create: createEventMock,
          };
        return {};
      });

      await service.logEvent('room-public', 'MOVE', { x: 1 });

      const createCall = createEventMock.mock.calls[0][0];
      expect(createCall.data.turnNumber).toBe(1);
    });
  });

  describe('validateMove', () => {
    it('fails closed when the room has no world identity', async () => {
      strapi.documents.mockReturnValue({ findOne: vi.fn().mockResolvedValue({ documentId: 'room', code: 'not-world', world: { seed: 's' } }) });
      await expect(service.validateMove('room', { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 })).rejects.toThrow('Room world is missing');
      expect(WorldGenerator).not.toHaveBeenCalled();
    });
    it('should return valid:false for invalid schema', async () => {
      const result = await service.validateMove('doc-1', { x: 'bad' } as any, { x: 1, y: 1, z: 0 });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid coordinates');
    });

    it('should return valid:false if blocked by entity', async () => {
      const mockRoomWithWorld = { documentId: 'doc-1', world: { documentId: 'world-doc', seed: 'abc', chunkSize: 32, seaLevel: 0 } };
      const mockEvents = [{ type: 'SPAWN_ENTITY', payload: { entityId: 'mob-1', position: { x: 10, y: 10, z: 0 } } }];

      const findOneRoomMock = vi.fn().mockResolvedValue(mockRoomWithWorld);
      const findManyEventMock = vi.fn().mockResolvedValue(mockEvents);

      strapi.documents.mockImplementation((uid: string) => {
        if (uid === 'api::room.room') return { findOne: findOneRoomMock };
        if (uid === 'api::game-event.game-event') return { findMany: findManyEventMock };
        return {};
      });

      mockIsWalkable.mockResolvedValue(true);

      const result = await service.validateMove('doc-1', { x: 0, y: 0, z: 0 }, { x: 10, y: 10, z: 0 });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Destination occupied');
    });

    it('should return valid:true if physics says yes and no collision', async () => {
      const mockRoomWithWorld = { documentId: 'doc-1', world: { documentId: 'world-doc', seed: 'abc', chunkSize: 32, seaLevel: 0 } };
      strapi.documents.mockImplementation((uid: string) => {
        if (uid === 'api::room.room') return { findOne: vi.fn().mockResolvedValue(mockRoomWithWorld) };
        if (uid === 'api::game-event.game-event') return { findMany: vi.fn().mockResolvedValue([]) };
        return {};
      });

      mockIsWalkable.mockResolvedValue(true);

      const result = await service.validateMove('doc-1', { x: 0, y: 0, z: 0 }, { x: 5, y: 5, z: 0 });

      expect(result.valid).toBe(true);
      expect(WorldGenerator).toHaveBeenCalledWith(expect.objectContaining({ seed: 'abc', chunkSize: 32, seaLevel: 0 }), 'world-doc');
    });

    it('should return valid:false if physics says no', async () => {
      const mockRoomWithWorld = { documentId: 'doc-1', world: { documentId: 'world-doc', seed: 'abc', chunkSize: 32, seaLevel: 0 } };
      strapi.documents.mockImplementation((uid: string) => {
        if (uid === 'api::room.room') return { findOne: vi.fn().mockResolvedValue(mockRoomWithWorld) };
        if (uid === 'api::game-event.game-event') return { findMany: vi.fn().mockResolvedValue([]) };
        return {};
      });

      mockIsWalkable.mockResolvedValue(false);

      const result = await service.validateMove('doc-1', { x: 0, y: 0, z: 0 }, { x: 5, y: 5, z: 0 });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Blocked by terrain');
    });
  });

  describe('getGameState', () => {
    it('should reconstruct state from events', async () => {
      const mockEvents = [
        { type: 'SPAWN_ENTITY', payload: { entityId: 'mob-1', position: { x: 10, y: 10, z: 0 } } },
        { type: 'MOVE', payload: { entityId: 'mob-1', from: { x: 10, y: 10, z: 0 }, to: { x: 11, y: 10, z: 0 } } },
        { type: 'UNKNOWN', payload: {} },
        { type: 'MOVE', payload: { bad: 'data' } },
      ];

      const mockRoom = {
        documentId: 'doc-1',
        entity_sheets: [{ documentId: 'hero-1', position: { x: 0, y: 0, z: 0 } }],
      };

      strapi.documents.mockImplementation((uid: string) => {
        if (uid === 'api::room.room') return { findOne: vi.fn().mockResolvedValue(mockRoom) };
        if (uid === 'api::game-event.game-event') return { findMany: vi.fn().mockResolvedValue(mockEvents) };
        return {};
      });

      const state = await service.getGameState('doc-1');

      expect(state.entities['hero-1']).toEqual({ x: 0, y: 0, z: 0 });
      expect(state.entities['mob-1']).toEqual({ x: 11, y: 10, z: 0 });
    });
  });

  describe('inspectTerrain', () => {
    it('should return terrain info', async () => {
      const mockRoomWithWorld = { documentId: 'doc-1', world: { documentId: 'world-doc', seed: 'abc', chunkSize: 32, seaLevel: 0 } };

      strapi.documents.mockReturnValue({
        findOne: vi.fn().mockResolvedValue(mockRoomWithWorld),
      });

      mockGetChunk.mockResolvedValue({
        tiles: {
          0: {
            5: {
              5: {
                biome: 'forest',
                block: 'grass',
              },
            },
          },
        },
      });

      const info = await service.inspectTerrain('doc-1', 5, 5, 1);
      expect(info).toBe('Terrain: forest (grass)');
    });

    it('should return void if no tile', async () => {
      const mockRoomWithWorld = { documentId: 'doc-1', world: { documentId: 'world-doc', seed: 'abc', chunkSize: 32, seaLevel: 0 } };
      strapi.documents.mockReturnValue({
        findOne: vi.fn().mockResolvedValue(mockRoomWithWorld),
      });

      mockGetChunk.mockResolvedValue(null);

      const info = await service.inspectTerrain('doc-1', 99, 99, 1);
      expect(info).toBe('Void at 99,99');
    });
  });
});
