import { describe, it, expect, vi, beforeEach } from 'vitest';
import actionEngineFactory from '@/api/game/services/action-engine';

const editVoxel = vi.hoisted(() => vi.fn());
vi.mock('@/api/voxel-engine/services/chunk-manager', () => ({ ChunkManager: { getInstance: () => ({ editVoxel }) } }));

// Mock dependencies
vi.mock('@daicer/engine/rules/spatial', () => ({
  findPath: vi.fn(),
}));
import { findPath } from '@daicer/engine/rules/spatial';

vi.mock('@daicer/engine/voxel/terrain-generator', () => ({
  TerrainGenerator: class {
    getTileAt() {
      return { isWalkable: true };
    }
  },
}));

// Mock Strapi
const mockFindOne = vi.fn();
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();

const mockInventoryService = {
  dropAll: vi.fn(),
  dropItem: vi.fn(() => ({ success: true })),
  pickupItem: vi.fn(() => ({ success: true })),
  dropItemAt: vi.fn(() => ({ success: true })),
};

const mockVoxelService = {
  editTerrain: vi.fn(),
};

const mockStrapi: any = {
  service: vi.fn((uid) => {
    if (uid === 'api::game.inventory-service') return mockInventoryService;
    if (uid === 'api::voxel-engine.voxel-engine') return mockVoxelService;
    // Self-reference
    if (uid === 'api::game.action-engine') return { handleModifyTerrain: vi.fn() };
    return {};
  }),
  documents: vi.fn(() => ({
    findOne: mockFindOne,
    findMany: mockFindMany,
    update: mockUpdate,
    create: mockCreate,
  })),
};

describe('Action Engine', () => {
  let engine: any;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = actionEngineFactory({ strapi: mockStrapi });
  });

  describe('dispatch', () => {
    it('should route MOVE command', async () => {
      const moveCmd = { type: 'MOVE', payload: { actorId: 'a1', targetPosition: { x: 10, y: 10, z: 0 } } };

      // Move logic needs findOne actor
      mockFindOne.mockResolvedValueOnce({
        documentId: 'a1',
        position: { x: 0, y: 0, z: 0 },
        speed: 30,
      });
      // findMany entities
      mockFindMany.mockResolvedValueOnce([]);

      // Path mock
      vi.mocked(findPath).mockReturnValueOnce([
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 10, z: 0 },
      ]);

      const results = await engine.dispatch('room-1', [moveCmd]);

      expect(results[0].success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled(); // Persist
    });

    it('should route ATTACK command', async () => {
      const attackCmd = { type: 'ATTACK', payload: { actorId: 'a1', targetId: 't1' } };

      // Actor
      mockFindOne.mockResolvedValueOnce({
        documentId: 'a1',
        computedActions: [{ id: 'sword', name: 'Sword', attackBonus: 5, damage: [{ diceCount: 1, diceValue: 6 }] }],
      });
      // Target
      mockFindOne.mockResolvedValueOnce({
        documentId: 't1',
        armorClass: 10,
        hp: 10,
      });

      const results = await engine.dispatch('room-1', [attackCmd]);
      expect(results[0].success).toBe(true);
    });

    it('should handle unknown command', async () => {
      const badCmd = { type: 'UNKNOWN', payload: {} };
      const results = await engine.dispatch('room-1', [badCmd]);
      expect(results[0].success).toBe(false);
      expect(results[0].message).toContain('Unknown command type');
    });
  });

  describe('resolveMove', () => {
    it('should fail if blocked', async () => {
      const cmd = { type: 'MOVE', payload: { actorId: 'a1', targetPosition: { x: 10, y: 10 } } };
      mockFindOne.mockResolvedValueOnce({ documentId: 'a1', position: { x: 0, y: 0 } });
      mockFindMany.mockResolvedValueOnce([]);

      // Path blocked
      vi.mocked(findPath).mockReturnValueOnce([]);

      const res = await engine.resolveMove(cmd, 'room-1');
      expect(res.success).toBe(false);
      expect(res.message).toContain('Path blocked');
    });
  });

  describe('resolveAttack', () => {
    it('should handle entity death', async () => {
      const cmd = { type: 'ATTACK', payload: { actorId: 'a1', targetId: 't1' } };

      mockFindOne.mockImplementation(({ documentId }) => {
        if (documentId === 'a1')
          return Promise.resolve({
            documentId: 'a1',
            computedActions: [{ id: 'sword', damage: [{ flatBonus: 100 }] }],
          });
        if (documentId === 't1')
          return Promise.resolve({
            documentId: 't1',
            armorClass: 0,
            hp: 10,
            type: 'monster',
            position: { x: 0, y: 0, z: 0 },
            room: { config: {} },
          });
        if (documentId === 'room-1') return Promise.resolve({ world: { documentId: 'world-doc', seed: 'seed', chunkSize: 32 } });
        return Promise.resolve(null);
      });

      // Force hit and high damage roll
      // d20 = floor(0.99 * 20) + 1 = 20 (Crit)
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const res = await engine.resolveAttack(cmd, 'room-1');
      if (!res.events.find((e: any) => e.type === 'ENTITY_DEATH')) {
        console.log('Result Events:', JSON.stringify(res.events, null, 2));
        console.log('Result Message:', res.message);
      }
      expect(res.success).toBe(true);
      // Check for Death event
      const deathEvent = res.events.find((e: any) => e.type === 'ENTITY_DEATH');
      expect(deathEvent).toBeDefined();

      // Check drop loot called
      expect(mockInventoryService.dropAll).toHaveBeenCalledWith('t1');
      expect(editVoxel).toHaveBeenCalledWith(expect.objectContaining({ worldId: 'world-doc', config: expect.objectContaining({ chunkSize: 32 }), chunkX: 0, chunkY: 0, voxelX: 0, voxelY: 0, voxelZ: 0, metadata: expect.objectContaining({ type: 'death_marker' }) }));
      editVoxel.mockClear();
      const prior = mockFindOne.getMockImplementation();
      mockFindOne.mockImplementation((args) => args.documentId === 'room-1' ? Promise.resolve({ world: null }) : prior(args));
      await engine.resolveAttack(cmd, 'room-1');
      expect(editVoxel).not.toHaveBeenCalled();
      vi.restoreAllMocks();
    });
  });

  describe('Other Commands', () => {
    it('should resolve DROP_ITEM', async () => {
      mockFindOne.mockResolvedValueOnce({ documentId: 'a1' });
      const res = await engine.resolveDropItem(
        { type: 'DROP_ITEM', payload: { actorId: 'a1', itemComponentId: 'i1' } },
        'room-1'
      );
      expect(res.success).toBe(true);
    });

    it('should resolve PICKUP_ITEM', async () => {
      const res = await engine.resolvePickupItem(
        { type: 'PICKUP_ITEM', payload: { actorId: 'a1', targetId: 'i1' } },
        'room-1'
      );
      expect(res.success).toBe(true);
    });

    it('should resolve THROW_ITEM', async () => {
      const res = await engine.resolveThrowItem(
        { type: 'THROW_ITEM', payload: { actorId: 'a1', itemComponentId: 'i1', targetPosition: { x: 0, y: 0, z: 0 } } },
        'room-1'
      );
      expect(res.success).toBe(true);
    });
  });
});
