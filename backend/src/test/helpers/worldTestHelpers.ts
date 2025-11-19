/**
 * Test helpers for world, map, and structure testing
 */

import type { WorldGenerationParams } from '@/services/world-gen/worldGenService';
import type { StructureTemplate } from '@/services/world-gen/structures';
import { Server } from 'socket.io';
import { Socket as ClientSocket } from 'socket.io-client';

/**
 * Create mock world generation parameters with sensible defaults
 */
export function createMockWorldParams(overrides?: Partial<WorldGenerationParams>): WorldGenerationParams {
  return {
    seed: 'test-seed-12345',
    width: 256,
    height: 256,
    depth: 21,
    waterLevel: -0.5,
    mountainousness: 0.5,
    jaggedness: 0.5,
    temperature: 0,
    moisture: 0,
    continentalness: 0,
    erosion: 0,
    weirdness: 0,
    caveFrequency: 0,
    oreDistribution: {},
    ...overrides,
  };
}

/**
 * Create a minimal mock structure template
 */
export function createMockStructureTemplate(overrides?: Partial<StructureTemplate>): StructureTemplate {
  return {
    id: 'test-structure',
    name: 'Test Structure',
    width: 5,
    height: 5,
    depth: 3,
    blocks: [
      { x: 0, y: 0, z: 0, blockType: 'stone' },
      { x: 1, y: 0, z: 0, blockType: 'stone' },
      { x: 2, y: 0, z: 0, blockType: 'stone' },
      { x: 1, y: 1, z: 1, blockType: 'stone' },
    ],
    spawnRules: {
      biomes: ['plains', 'forest'],
      minDistance: 10,
      rarity: 0.5,
      onlyOnSurface: true,
    },
    variants: 3,
    ...overrides,
  };
}

/**
 * Mock socket client for testing socket handlers
 */
export interface MockSocketClient {
  emit: jest.Mock;
  on: jest.Mock;
  once: jest.Mock;
  off: jest.Mock;
  disconnect: jest.Mock;
}

export function mockSocketClient(): MockSocketClient {
  return {
    emit: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  };
}

/**
 * Wait for a socket event with timeout
 */
export function waitForSocketEvent<T = any>(socket: ClientSocket, event: string, timeout = 5000): Promise<T> {
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

/**
 * Wait for graph completion (polling)
 */
export async function waitForGraphCompletion(
  checkFn: () => Promise<boolean>,
  timeout = 30000,
  interval = 500
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const isComplete = await checkFn();
    if (isComplete) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('Graph completion timeout');
}

/**
 * Mock world data for Firestore
 */
export function createMockWorldData(overrides?: any) {
  return {
    id: 'test-world-id',
    name: 'Test World',
    width: 256,
    height: 256,
    depth: 21,
    seed: 'test-seed',
    parameters: createMockWorldParams(),
    createdAt: new Date(),
    createdBy: 'test-user-id',
    ...overrides,
  };
}

/**
 * Mock room data for Firestore
 */
export function createMockRoomData(overrides?: any) {
  return {
    id: 'test-room-id',
    code: 'ABC123',
    ownerId: 'test-user-id',
    phase: 'SETUP',
    settings: {
      theme: 'High Fantasy',
      adventureLength: 'medium',
      difficulty: 'medium',
      maxPlayers: 4,
      startingLevel: 1,
    },
    players: [],
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

/**
 * Mock graph state with world generation progress
 */
export function createMockGraphState(overrides?: any) {
  return {
    roomId: 'test-room-id',
    ownerId: 'test-user-id',
    code: 'ABC123',
    settings: {
      theme: 'High Fantasy',
      adventureLength: 'medium',
      difficulty: 'medium',
      maxPlayers: 4,
      startingLevel: 1,
    },
    players: [],
    messages: [],
    worldDescription: '',
    worldHistory: [],
    structures: [],
    roads: [],
    worldConditions: null,
    historyPeriods: [],
    streamEvents: [],
    worldGenProgress: {
      phase: 'init',
      currentPeriod: 0,
      totalPeriods: 0,
      retryCount: 0,
      lastError: null,
    },
    ...overrides,
  };
}

/**
 * Create mock chunk data
 */
export function createMockChunkData(chunkX: number, chunkY: number, chunkZ: number, tileCount = 10) {
  const tiles = [];
  for (let i = 0; i < tileCount; i++) {
    tiles.push({
      x: chunkX * 32 + (i % 32),
      y: chunkY * 32 + Math.floor(i / 32),
      z: 10,
      biome: 'plains',
      elevation: 10,
      blockType: 'grass',
      climate: {
        temperature: 0,
        moisture: 0,
        continentalness: 0,
        erosion: 0,
        weirdness: 0,
      },
      isCave: false,
      isOre: false,
      lightLevel: 15,
    });
  }

  return {
    chunkX,
    chunkY,
    chunkZ,
    tiles,
    biomes: new Set(['plains']),
  };
}

/**
 * Assert that world gen progress follows expected phase sequence
 */
export function assertWorldGenPhaseSequence(phases: string[]) {
  const expectedSequence = [
    'init',
    'conditions',
    'history_summary',
    'history_period',
    'structures',
    'roads',
    'terrain',
    'chunks',
    'lore',
    'complete',
  ];

  const foundPhases = new Set(phases);

  for (let i = 0; i < phases.length - 1; i++) {
    const currentIdx = expectedSequence.indexOf(phases[i]);
    const nextIdx = expectedSequence.indexOf(phases[i + 1]);

    if (currentIdx === -1 || nextIdx === -1) {
      throw new Error(`Unexpected phase in sequence: ${phases[i]} or ${phases[i + 1]}`);
    }

    if (phases[i] !== 'history_period' && currentIdx >= nextIdx) {
      throw new Error(`Phase sequence violation: ${phases[i]} should come before ${phases[i + 1]}`);
    }
  }
}

/**
 * Extract phase names from stream events
 */
export function extractPhasesFromStreamEvents(streamEvents: any[]): string[] {
  return streamEvents.filter((e) => e.type === 'world_gen_progress').map((e) => e.data.phase);
}

/**
 * Mock worker pool for chunk generation
 */
export function createMockWorkerPool() {
  return {
    run: jest.fn().mockImplementation(({ chunkX, chunkY, chunkZ }) => {
      return Promise.resolve(createMockChunkData(chunkX, chunkY, chunkZ));
    }),
    shutdown: jest.fn(),
    getStats: jest.fn().mockReturnValue({
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      activeWorkers: 0,
    }),
  };
}
