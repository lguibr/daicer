import { MapService } from '@/services/map-service';
import { db } from '@/config/firebase';
import { generateGridChunk } from '@/services/world-gen/grid-chunk-generator';
import { getStructuresForChunk, stampStructureOnChunk } from '@/services/world-gen/structure-stamper';
import { EntityType } from '@daicer/shared/world/entity-schema';

// Mock dependencies
jest.mock('@/config/firebase', () => ({
  db: jest.fn(),
}));

jest.mock('@/services/world-gen/grid-chunk-generator', () => ({
  generateGridChunk: jest.fn(),
}));

jest.mock('@/services/world-gen/structure-stamper', () => ({
  getStructuresForChunk: jest.fn(),
  stampStructureOnChunk: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('MapService', () => {
  let mapService: MapService;
  let mockDb: any;
  let mockCollection: any;
  let mockDoc: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup Firestore mock chain
    // db() -> collection() -> doc() -> ...
    mockDoc = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      collection: jest.fn(),
      delete: jest.fn(),
    };
    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc),
      where: jest.fn().mockReturnThis(),
      get: jest.fn(),
      add: jest.fn(),
    };
    // Fix subcollections
    mockDoc.collection.mockReturnValue(mockCollection);

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };
    (db as jest.Mock).mockReturnValue(mockDb);

    // Get singleton instance (might need to handle if it's already created)
    // MapService is a singleton.
    mapService = MapService.getInstance();
  });

  describe('getMapConfig', () => {
    it('should return existing config if present', async () => {
      const mockConfig = { seed: 'test', globalWaterLevel: 0.5 };
      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({ mapConfig: mockConfig }),
      });

      const config = await mapService.getMapConfig('room-1');
      expect(config).toEqual(mockConfig);
      expect(mockDb.collection).toHaveBeenCalledWith('rooms');
      expect(mockCollection.doc).toHaveBeenCalledWith('room-1');
    });

    it('should initialize default config if missing', async () => {
      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({ code: 'room-code' }),
      });

      const config = await mapService.getMapConfig('room-1');

      expect(config).toBeDefined();
      expect(config.seed).toBe('room-code');
      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          mapConfig: expect.any(Object),
        })
      );
    });
  });

  describe('getChunk', () => {
    it('should return cached chunk if exists and valid', async () => {
      const mockChunk = { hasStructure: false };
      // Mock room fetch (lazy load in getChunk)
      // First call is chunkRef.get(), second is mapConfig (getMapConfig -> getRoom)
      // Actually mapService calls getMapConfig which calls roomRef.get()

      // Mocking is complex due to multiple fetches.
      // 1. chunkRef.get()
      // 2. getMapConfig() -> roomRef.get()
      // 3. roomRef.get() (for structures)

      // Let's simplify and make all docs return something useful
      mockDoc.get
        .mockResolvedValueOnce({ exists: true, data: () => mockChunk }) // Chunk
        .mockResolvedValueOnce({ exists: true, data: () => ({ mapConfig: { seed: 'test' } }) }) // Room Config
        .mockResolvedValue({ exists: true, data: () => ({ structures: [] }) }); // Room Structures (catch all)

      const chunk = await mapService.getChunk('room-1', 0, 0, 0);
      expect(chunk).toEqual(mockChunk);
    });

    it('should generate new chunk if missing', async () => {
      // 1. Chunk missing
      mockDoc.get.mockResolvedValueOnce({ exists: false });
      // 2. Room config
      mockDoc.get.mockResolvedValueOnce({ exists: true, data: () => ({ mapConfig: { seed: 'test' } }) });
      // 3. Room structures
      mockDoc.get.mockResolvedValueOnce({ exists: true, data: () => ({ structures: [] }) });

      const mockGeneratedChunk = { chunkX: 0, chunkY: 0, tiles: [] };
      (generateGridChunk as jest.Mock).mockReturnValue(mockGeneratedChunk);
      (getStructuresForChunk as jest.Mock).mockReturnValue([]);

      const chunk = await mapService.getChunk('room-1', 0, 0, 0);

      expect(generateGridChunk).toHaveBeenCalled();
      expect(mockDoc.set).toHaveBeenCalledWith(mockGeneratedChunk);
      expect(chunk).toEqual(mockGeneratedChunk);
    });
  });

  describe('getMapView', () => {
    it('should fetch chunks and entities', async () => {
      // This calls getChunk multiple times
      // And getEntitiesInArea

      // Spy on getChunk
      jest.spyOn(mapService, 'getChunk').mockResolvedValue({ chunkX: 0, chunkY: 0 } as any);

      // Mock entities query
      // db.collection().doc().collection('entities').where()...
      // It's a complex chain.
      // Let's rely on internal method mocking if possible or skip deep DB mocking for this high level test.

      // Let's just mock the entities call
      const mockEntities = [{ id: 'e1', x: 0, y: 0 }];
      // We can't easily spy on private/internal DB calls without complex mock setup.
      // But getEntitiesInArea is public? No, it's public.
      jest.spyOn(mapService, 'getEntitiesInArea').mockResolvedValue(mockEntities as any);

      const result = await mapService.getMapView('room-1', { x: 0, y: 0, z: 0 }, 1);

      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.entities).toEqual(mockEntities);
    });
  });
});
