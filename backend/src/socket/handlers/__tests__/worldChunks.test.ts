/**
 * World Chunk Socket Handler Tests
 * Refactored to use async/await for reliability
 */

import { Server } from 'socket.io';
import { Socket as ClientSocket, io as ioc } from 'socket.io-client';
import { createServer } from 'http';
import { registerWorldChunkHandlers } from '../worldChunks';
import { getWorldMap } from '@/services/world-gen/worldGenService';
import { getWorkerPool } from '@/workers/workerPool';

// Mock dependencies
jest.mock('@/services/world-gen/worldGenService');
jest.mock('@/workers/workerPool', () => ({
  getWorkerPool: jest.fn(),
  initWorkerPool: jest.fn(),
  shutdownWorkerPool: jest.fn(),
}));
jest.mock('@/utils/logger');

/**
 * Helper to wait for a specific socket event with a timeout
 */
function waitForSocketEvent<T = any>(socket: ClientSocket, event: string, timeout = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

describe('World Chunk Socket Handlers', () => {
  let io: Server;
  let clientSocket: ClientSocket;
  let serverSocket: any;
  const TEST_USER_ID = 'test-user-123';
  const TEST_WORLD_ID = 'test-world-456';

  beforeAll(async () => {
    const httpServer = createServer();
    io = new Server(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        const port = (httpServer.address() as any).port;
        clientSocket = ioc(`http://localhost:${port}`, {
          transports: ['websocket'],
        });

        io.on('connection', (socket) => {
          serverSocket = socket;
          // Register handlers directly
          registerWorldChunkHandlers(socket, TEST_USER_ID);
        });

        clientSocket.on('connect', resolve);
      });
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('world:chunk:request', () => {
    it('should generate and return chunk data for valid request', async () => {
      const mockWorld = {
        id: TEST_WORLD_ID,
        name: 'Test World',
        createdBy: TEST_USER_ID,
        seed: 12345,
        parameters: {
          temperature: 0,
          moisture: 0,
          mountainousness: 1.0,
          jaggedness: 1.0,
          waterLevel: -0.1,
        },
      };

      const mockChunk = {
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
        tiles: [
          { x: 0, y: 0, z: 10, biome: 'plains', elevation: 10, blockType: 'grass' },
          { x: 1, y: 0, z: 11, biome: 'plains', elevation: 11, blockType: 'grass' },
        ],
        biomes: new Set(['plains']),
      };

      (getWorldMap as jest.Mock).mockResolvedValue(mockWorld);
      (getWorkerPool as jest.Mock).mockReturnValue({
        run: jest.fn().mockResolvedValue(mockChunk),
      });

      const responsePromise = waitForSocketEvent(clientSocket, 'world:chunk:data');

      clientSocket.emit('world:chunk:request', {
        worldId: TEST_WORLD_ID,
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
      });

      const data = await responsePromise;

      expect(data).toMatchObject({
        worldId: TEST_WORLD_ID,
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
      });
      expect(data.tiles).toHaveLength(2);
      expect(data.tiles[0]).toHaveProperty('biome', 'plains');
      expect(data.biomes).toContain('plains');
    });

    it('should reject request for non-existent world', async () => {
      (getWorldMap as jest.Mock).mockResolvedValue(null);

      const errorPromise = waitForSocketEvent(clientSocket, 'world:chunk:error');

      clientSocket.emit('world:chunk:request', {
        worldId: 'non-existent',
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
      });

      const data = await errorPromise;
      expect(data.error).toBe('World not found');
    });

    it('should reject request for unauthorized user', async () => {
      const mockWorld = {
        id: TEST_WORLD_ID,
        name: 'Test World',
        createdBy: 'different-user-789',
        seed: 12345,
        parameters: {},
      };

      (getWorldMap as jest.Mock).mockResolvedValue(mockWorld);

      const errorPromise = waitForSocketEvent(clientSocket, 'world:chunk:error');

      clientSocket.emit('world:chunk:request', {
        worldId: TEST_WORLD_ID,
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
      });

      const data = await errorPromise;
      expect(data.error).toBe('Access denied');
    });

    it('should reject request with invalid parameters', async () => {
      const errorPromise = waitForSocketEvent(clientSocket, 'world:chunk:error');

      clientSocket.emit('world:chunk:request', {
        worldId: TEST_WORLD_ID,
        chunkX: 'invalid',
        chunkY: 0,
        chunkZ: 0,
      });

      const data = await errorPromise;
      expect(data.error).toBe('Invalid request');
    });
  });

  describe('world:chunks:request (batch)', () => {
    it('should process multiple chunks in batch', async () => {
      const mockWorld = {
        id: TEST_WORLD_ID,
        name: 'Test World',
        createdBy: TEST_USER_ID,
        seed: 12345,
        parameters: {},
      };

      const mockChunk = (x: number, y: number) => ({
        chunkX: x,
        chunkY: y,
        chunkZ: 0,
        tiles: [{ x: x * 32, y: y * 32, z: 10, biome: 'plains', elevation: 10, blockType: 'grass' }],
        biomes: new Set(['plains']),
      });

      (getWorldMap as jest.Mock).mockResolvedValue(mockWorld);
      (getWorkerPool as jest.Mock).mockReturnValue({
        run: jest.fn().mockImplementation(({ chunkX, chunkY }) => Promise.resolve(mockChunk(chunkX, chunkY))),
      });

      const receivedChunks: any[] = [];

      clientSocket.on('world:chunk:data', (data) => {
        receivedChunks.push(data);
      });

      const completePromise = waitForSocketEvent(clientSocket, 'world:chunks:complete');

      clientSocket.emit('world:chunks:request', {
        worldId: TEST_WORLD_ID,
        chunks: [
          { chunkX: 0, chunkY: 0, chunkZ: 0 },
          { chunkX: 1, chunkY: 0, chunkZ: 0 },
          { chunkX: 0, chunkY: 1, chunkZ: 0 },
        ],
      });

      const data = await completePromise;

      expect(data.count).toBe(3);
      expect(receivedChunks.length).toBe(3);
      // Check that we received all 3 chunks (order doesn't matter)
      const coords = receivedChunks.map((c) => `${c.chunkX},${c.chunkY}`);
      expect(coords).toEqual(expect.arrayContaining(['0,0', '1,0', '0,1']));
    });

    it('should handle batch of 10 chunks', async () => {
      const mockWorld = {
        id: TEST_WORLD_ID,
        name: 'Test World',
        createdBy: TEST_USER_ID,
        seed: 12345,
        parameters: {},
      };

      const mockChunk = (x: number, y: number) => ({
        chunkX: x,
        chunkY: y,
        chunkZ: 0,
        tiles: [{ x: x * 32, y: y * 32, z: 10, biome: 'plains', elevation: 10, blockType: 'grass' }],
        biomes: new Set(['plains']),
      });

      (getWorldMap as jest.Mock).mockResolvedValue(mockWorld);
      (getWorkerPool as jest.Mock).mockReturnValue({
        run: jest.fn().mockImplementation(({ chunkX, chunkY }) => Promise.resolve(mockChunk(chunkX, chunkY))),
      });

      const chunks = Array.from({ length: 10 }, (_, i) => ({
        chunkX: i % 5,
        chunkY: Math.floor(i / 5),
        chunkZ: 0,
      }));

      const receivedChunks: any[] = [];
      clientSocket.on('world:chunk:data', (data) => {
        receivedChunks.push(data);
      });

      const completePromise = waitForSocketEvent(clientSocket, 'world:chunks:complete');

      clientSocket.emit('world:chunks:request', {
        worldId: TEST_WORLD_ID,
        chunks,
      });

      const data = await completePromise;
      expect(data.count).toBe(10);
      expect(receivedChunks.length).toBe(10);
    });

    it('should handle exactly 50 chunks (max limit)', async () => {
      const mockWorld = {
        id: TEST_WORLD_ID,
        name: 'Test World',
        createdBy: TEST_USER_ID,
        seed: 12345,
        parameters: {},
      };

      const mockChunk = (x: number, y: number) => ({
        chunkX: x,
        chunkY: y,
        chunkZ: 0,
        tiles: [{ x: x * 32, y: y * 32, z: 10, biome: 'plains', elevation: 10, blockType: 'grass' }],
        biomes: new Set(['plains']),
      });

      (getWorldMap as jest.Mock).mockResolvedValue(mockWorld);
      (getWorkerPool as jest.Mock).mockReturnValue({
        run: jest.fn().mockImplementation(({ chunkX, chunkY }) => Promise.resolve(mockChunk(chunkX, chunkY))),
      });

      const chunks = Array.from({ length: 50 }, (_, i) => ({
        chunkX: i % 10,
        chunkY: Math.floor(i / 10),
        chunkZ: 0,
      }));

      const receivedChunks: any[] = [];
      clientSocket.on('world:chunk:data', (data) => {
        receivedChunks.push(data);
      });

      const completePromise = waitForSocketEvent(clientSocket, 'world:chunks:complete');

      clientSocket.emit('world:chunks:request', {
        worldId: TEST_WORLD_ID,
        chunks,
      });

      const data = await completePromise;
      expect(data.count).toBe(50);
      expect(receivedChunks.length).toBe(50);
    });

    it('should reject batch exceeding 50 chunks', async () => {
      const chunks = Array.from({ length: 51 }, (_, i) => ({
        chunkX: i % 10,
        chunkY: Math.floor(i / 10),
        chunkZ: 0,
      }));

      const errorPromise = waitForSocketEvent(clientSocket, 'world:chunk:error');

      clientSocket.emit('world:chunks:request', {
        worldId: TEST_WORLD_ID,
        chunks,
      });

      const data = await errorPromise;
      expect(data.error).toBe('Invalid batch request');
      expect(data.message).toContain('51 chunks');
      expect(data.message).toContain('maximum 50');
    });

    it('should reject batch with invalid chunk coordinates', async () => {
      const errorPromise = waitForSocketEvent(clientSocket, 'world:chunk:error');

      clientSocket.emit('world:chunks:request', {
        worldId: TEST_WORLD_ID,
        chunks: [
          { chunkX: 'invalid', chunkY: 0, chunkZ: 0 },
          { chunkX: 1, chunkY: 0, chunkZ: 0 },
        ],
      });

      const data = await errorPromise;
      expect(data.error).toBe('Invalid batch request');
    });

    it('should process batch with 1 chunk', async () => {
      const mockWorld = {
        id: TEST_WORLD_ID,
        name: 'Test World',
        createdBy: TEST_USER_ID,
        seed: 12345,
        parameters: {},
      };

      const mockChunk = {
        chunkX: 5,
        chunkY: 5,
        chunkZ: 0,
        tiles: [{ x: 160, y: 160, z: 10, biome: 'forest', elevation: 10, blockType: 'grass' }],
        biomes: new Set(['forest']),
      };

      (getWorldMap as jest.Mock).mockResolvedValue(mockWorld);
      (getWorkerPool as jest.Mock).mockReturnValue({
        run: jest.fn().mockResolvedValue(mockChunk),
      });

      const receivedChunks: any[] = [];
      clientSocket.on('world:chunk:data', (data) => {
        receivedChunks.push(data);
      });

      const completePromise = waitForSocketEvent(clientSocket, 'world:chunks:complete');

      clientSocket.emit('world:chunks:request', {
        worldId: TEST_WORLD_ID,
        chunks: [{ chunkX: 5, chunkY: 5, chunkZ: 0 }],
      });

      const data = await completePromise;
      expect(data.count).toBe(1);
      expect(receivedChunks.length).toBe(1);
      expect(receivedChunks[0].chunkX).toBe(5);
    });

    it('should enforce access control for batch requests', async () => {
      const mockWorld = {
        id: TEST_WORLD_ID,
        name: 'Test World',
        createdBy: 'different-user',
        seed: 12345,
        parameters: {},
      };

      (getWorldMap as jest.Mock).mockResolvedValue(mockWorld);

      const errorPromise = waitForSocketEvent(clientSocket, 'world:chunk:error');

      clientSocket.emit('world:chunks:request', {
        worldId: TEST_WORLD_ID,
        chunks: [
          { chunkX: 0, chunkY: 0, chunkZ: 0 },
          { chunkX: 1, chunkY: 0, chunkZ: 0 },
        ],
      });

      const data = await errorPromise;
      expect(data.error).toBe('Access denied');
    });

    it('should return partial results if some chunks fail', async () => {
      const mockWorld = {
        id: TEST_WORLD_ID,
        name: 'Test World',
        createdBy: TEST_USER_ID,
        seed: 12345,
        parameters: {},
      };

      const mockChunk = (x: number, y: number) => ({
        chunkX: x,
        chunkY: y,
        chunkZ: 0,
        tiles: [{ x: x * 32, y: y * 32, z: 10, biome: 'plains', elevation: 10, blockType: 'grass' }],
        biomes: new Set(['plains']),
      });

      (getWorldMap as jest.Mock).mockResolvedValue(mockWorld);
      const workerRun = jest.fn().mockImplementation(({ chunkX, chunkY }) => {
        if (chunkX === 1 && chunkY === 1) {
          return Promise.reject(new Error('Chunk generation failed'));
        }
        return Promise.resolve(mockChunk(chunkX, chunkY));
      });
      (getWorkerPool as jest.Mock).mockReturnValue({ run: workerRun });

      const receivedChunks: any[] = [];
      clientSocket.on('world:chunk:data', (data) => {
        receivedChunks.push(data);
      });

      const completePromise = waitForSocketEvent(clientSocket, 'world:chunks:complete');

      clientSocket.emit('world:chunks:request', {
        worldId: TEST_WORLD_ID,
        chunks: [
          { chunkX: 0, chunkY: 0, chunkZ: 0 },
          { chunkX: 1, chunkY: 1, chunkZ: 0 },
          { chunkX: 2, chunkY: 0, chunkZ: 0 },
        ],
      });

      const data = await completePromise;
      expect(data.count).toBe(2);
      expect(data.failed).toBe(1);
      expect(receivedChunks.length).toBe(2);
    });
  });

  describe('Chunk compression (surface tiles)', () => {
    it('should compress 3D tiles to surface-only 2D tiles', async () => {
      const mockWorld = {
        id: TEST_WORLD_ID,
        name: 'Test World',
        createdBy: TEST_USER_ID,
        seed: 12345,
        parameters: {},
      };

      const mockChunk = {
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
        tiles: [
          { x: 0, y: 0, z: 5, biome: 'plains', elevation: 5, blockType: 'dirt' },
          { x: 0, y: 0, z: 10, biome: 'plains', elevation: 10, blockType: 'grass' },
          { x: 0, y: 0, z: 2, biome: 'plains', elevation: 2, blockType: 'stone' },
          { x: 1, y: 0, z: 8, biome: 'forest', elevation: 8, blockType: 'grass' },
        ],
        biomes: new Set(['plains', 'forest']),
      };

      (getWorldMap as jest.Mock).mockResolvedValue(mockWorld);
      (getWorkerPool as jest.Mock).mockReturnValue({
        run: jest.fn().mockResolvedValue(mockChunk),
      });

      const responsePromise = waitForSocketEvent(clientSocket, 'world:chunk:data');

      clientSocket.emit('world:chunk:request', {
        worldId: TEST_WORLD_ID,
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
      });

      const data = await responsePromise;

      expect(data.tiles.length).toBe(2);
      const tile00 = data.tiles.find((t: any) => t.x === 0 && t.y === 0);
      expect(tile00.z).toBe(10);
      const tile10 = data.tiles.find((t: any) => t.x === 1 && t.y === 0);
      expect(tile10.z).toBe(8);
    });

    it('should filter out air blocks from surface tiles', async () => {
      const mockWorld = {
        id: TEST_WORLD_ID,
        name: 'Test World',
        createdBy: TEST_USER_ID,
        seed: 12345,
        parameters: {},
      };

      const mockChunk = {
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
        tiles: [
          { x: 0, y: 0, z: 10, biome: 'plains', elevation: 10, blockType: 'grass' },
          { x: 0, y: 0, z: 11, biome: 'plains', elevation: 11, blockType: 'air' },
          { x: 0, y: 0, z: 12, biome: 'plains', elevation: 12, blockType: 'air' },
          { x: 1, y: 0, z: 5, biome: 'plains', elevation: 5, blockType: 'stone' },
        ],
        biomes: new Set(['plains']),
      };

      (getWorldMap as jest.Mock).mockResolvedValue(mockWorld);
      (getWorkerPool as jest.Mock).mockReturnValue({
        run: jest.fn().mockResolvedValue(mockChunk),
      });

      const responsePromise = waitForSocketEvent(clientSocket, 'world:chunk:data');

      clientSocket.emit('world:chunk:request', {
        worldId: TEST_WORLD_ID,
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
      });

      const data = await responsePromise;

      expect(data.tiles.length).toBe(2);
      expect(data.tiles.every((t: any) => t.blockType !== 'air' && t.z >= 5)).toBe(true);
    });

    it('should include biome set in compressed response', async () => {
      const mockWorld = {
        id: TEST_WORLD_ID,
        name: 'Test World',
        createdBy: TEST_USER_ID,
        seed: 12345,
        parameters: {},
      };

      const mockChunk = {
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
        tiles: [
          { x: 0, y: 0, z: 10, biome: 'plains', elevation: 10, blockType: 'grass' },
          { x: 1, y: 0, z: 11, biome: 'forest', elevation: 11, blockType: 'grass' },
          { x: 2, y: 0, z: 9, biome: 'desert', elevation: 9, blockType: 'sand' },
        ],
        biomes: new Set(['plains', 'forest', 'desert']),
      };

      (getWorldMap as jest.Mock).mockResolvedValue(mockWorld);
      (getWorkerPool as jest.Mock).mockReturnValue({
        run: jest.fn().mockResolvedValue(mockChunk),
      });

      const responsePromise = waitForSocketEvent(clientSocket, 'world:chunk:data');

      clientSocket.emit('world:chunk:request', {
        worldId: TEST_WORLD_ID,
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
      });

      const data = await responsePromise;

      expect(data.biomes).toContain('plains');
      expect(data.biomes).toContain('forest');
      expect(data.biomes).toContain('desert');
      expect(data.biomes.length).toBe(3);
    });
  });
});
