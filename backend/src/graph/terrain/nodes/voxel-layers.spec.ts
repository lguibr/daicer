/**
 * Unit tests for voxel layers node
 */

import { voxelLayersNode } from './voxel-layers';
import type { TerrainGenerationState } from '../state';

describe('voxelLayersNode', () => {
  const mockBiomeMap = {
    width: 1024,
    height: 1024,
    seed: 'test-room-id',
    grid: Array(1024)
      .fill(null)
      .map(() => Array(1024).fill('plains')),
  };

  const baseState: TerrainGenerationState = {
    roomId: 'test-room-id',
    structures: [],
    roads: [],
    worldHistory: 'Test world history',
    settings: {
      gridWidth: 1024,
      gridHeight: 1024,
      gridDepth: 3,
      roomSize: 32,
    },
    biomeMap: mockBiomeMap,
  };

  it('should throw error if biomeMap is missing', async () => {
    const stateWithoutBiome = { ...baseState, biomeMap: undefined };
    await expect(voxelLayersNode(stateWithoutBiome)).rejects.toThrow('Biome map required for voxel generation');
  });

  it('should generate voxel grid with correct dimensions', async () => {
    const result = await voxelLayersNode(baseState);

    expect(result.voxelGrid).toBeDefined();
    expect(result.voxelGrid.width).toBe(1024);
    expect(result.voxelGrid.height).toBe(1024);
    expect(result.voxelGrid.depth).toBe(3);
    expect(result.voxelGrid.roomSize).toBe(32);
  });

  it('should calculate room grid correctly', async () => {
    const result = await voxelLayersNode(baseState);

    // 1024 / 32 = 32 rooms wide/high
    expect(result.voxelGrid.roomsWide).toBe(32);
    expect(result.voxelGrid.roomsHigh).toBe(32);
  });

  it('should map structure at (256, 256) to room (8, 8) with roomSize=32', async () => {
    const stateWithStructure: TerrainGenerationState = {
      ...baseState,
      structures: [
        {
          name: 'Test Settlement',
          type: 'settlement',
          x: 256,
          y: 256,
          description: 'A test settlement',
        },
      ],
    };

    const result = await voxelLayersNode(stateWithStructure);

    const roomKey = '8,8';
    expect(result.voxelGrid.occupiedRooms[roomKey]).toBeDefined();
    expect(result.voxelGrid.occupiedRooms[roomKey].name).toBe('Test Settlement');
    expect(result.voxelGrid.occupiedRooms[roomKey].roomX).toBe(8);
    expect(result.voxelGrid.occupiedRooms[roomKey].roomY).toBe(8);
  });

  it('should handle multiple structures in different rooms', async () => {
    const stateWithMultipleStructures: TerrainGenerationState = {
      ...baseState,
      structures: [
        { name: 'Settlement A', type: 'settlement', x: 64, y: 64, description: 'First' },
        { name: 'Settlement B', type: 'settlement', x: 128, y: 128, description: 'Second' },
        { name: 'Settlement C', type: 'settlement', x: 512, y: 512, description: 'Third' },
      ],
    };

    const result = await voxelLayersNode(stateWithMultipleStructures);

    // Structure A at (64, 64) -> room (2, 2)
    expect(result.voxelGrid.occupiedRooms['2,2']).toBeDefined();
    expect(result.voxelGrid.occupiedRooms['2,2'].name).toBe('Settlement A');

    // Structure B at (128, 128) -> room (4, 4)
    expect(result.voxelGrid.occupiedRooms['4,4']).toBeDefined();
    expect(result.voxelGrid.occupiedRooms['4,4'].name).toBe('Settlement B');

    // Structure C at (512, 512) -> room (16, 16)
    expect(result.voxelGrid.occupiedRooms['16,16']).toBeDefined();
    expect(result.voxelGrid.occupiedRooms['16,16'].name).toBe('Settlement C');
  });

  it('should preserve all structure metadata in occupiedRooms', async () => {
    const stateWithStructure: TerrainGenerationState = {
      ...baseState,
      structures: [
        {
          name: 'Oakhaven Stead',
          type: 'settlement',
          x: 256,
          y: 256,
          description: 'A peaceful farming village',
          population: 500,
        },
      ],
    };

    const result = await voxelLayersNode(stateWithStructure);

    const occupiedRoom = result.voxelGrid.occupiedRooms['8,8'];
    expect(occupiedRoom.name).toBe('Oakhaven Stead');
    expect(occupiedRoom.type).toBe('settlement');
    expect(occupiedRoom.description).toBe('A peaceful farming village');
    expect(occupiedRoom.population).toBe(500);
    expect(occupiedRoom.x).toBe(256);
    expect(occupiedRoom.y).toBe(256);
  });

  it('should handle edge case structure at grid boundary', async () => {
    const stateWithBoundaryStructure: TerrainGenerationState = {
      ...baseState,
      structures: [{ name: 'Edge Structure', type: 'landmark', x: 1023, y: 1023, description: 'At edge' }],
    };

    const result = await voxelLayersNode(stateWithBoundaryStructure);

    // 1023 / 32 = 31.96875 -> floor(31)
    const roomKey = '31,31';
    expect(result.voxelGrid.occupiedRooms[roomKey]).toBeDefined();
    expect(result.voxelGrid.occupiedRooms[roomKey].name).toBe('Edge Structure');
  });

  it('should handle structure at origin (0, 0)', async () => {
    const stateWithOriginStructure: TerrainGenerationState = {
      ...baseState,
      structures: [{ name: 'Origin Structure', type: 'landmark', x: 0, y: 0, description: 'At 0,0' }],
    };

    const result = await voxelLayersNode(stateWithOriginStructure);

    const roomKey = '0,0';
    expect(result.voxelGrid.occupiedRooms[roomKey]).toBeDefined();
    expect(result.voxelGrid.occupiedRooms[roomKey].name).toBe('Origin Structure');
  });

  it('should create empty layers array (generated on-demand)', async () => {
    const result = await voxelLayersNode(baseState);

    expect(result.voxelGrid.layers).toEqual([]);
  });
});
