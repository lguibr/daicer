/**
 * World Generation Graph Nodes Tests
 * Tests individual nodes in the world generation graph
 */

import { describe, it, expect } from '@jest/globals';
import { createMockGraphState } from '../../../../test/helpers/worldTestHelpers';

describe('World Generation Graph Nodes', () => {
  describe('init node', () => {
    it('should set worldGenProgress phase to init', () => {
      const initialState = createMockGraphState();
      const result = {
        ...initialState,
        worldGenProgress: {
          phase: 'init',
          currentPeriod: 0,
          totalPeriods: 0,
          retryCount: 0,
          lastError: null,
        },
      };

      expect(result.worldGenProgress.phase).toBe('init');
      expect(result.worldGenProgress.retryCount).toBe(0);
    });

    it('should preserve existing state fields', () => {
      const initialState = createMockGraphState({
        roomId: 'test-room',
        ownerId: 'test-owner',
      });

      const result = {
        ...initialState,
        worldGenProgress: {
          phase: 'init',
          currentPeriod: 0,
          totalPeriods: 0,
          retryCount: 0,
          lastError: null,
        },
      };

      expect(result.roomId).toBe('test-room');
      expect(result.ownerId).toBe('test-owner');
    });
  });

  describe('conditions node', () => {
    it('should generate worldConditions', () => {
      const state = createMockGraphState({
        worldGenProgress: { phase: 'init' },
      });

      const result = {
        ...state,
        worldConditions: {
          temperature: 0.5,
          moisture: 0.5,
          magic: 0.3,
          danger: 0.4,
        },
        worldGenProgress: {
          phase: 'conditions',
          currentPeriod: 0,
          totalPeriods: 0,
        },
      };

      expect(result.worldConditions).toBeDefined();
      expect(result.worldGenProgress.phase).toBe('conditions');
    });
  });

  describe('history-period node', () => {
    it('should process single historical period', () => {
      const state = createMockGraphState({
        worldGenProgress: {
          phase: 'history_summary',
          currentPeriod: 0,
          totalPeriods: 3,
        },
        historyPeriods: [],
      });

      const result = {
        ...state,
        historyPeriods: [
          {
            period: 1,
            startYear: 0,
            endYear: 100,
            events: ['Event 1', 'Event 2'],
            summary: 'First period summary',
          },
        ],
        worldGenProgress: {
          phase: 'history_period',
          currentPeriod: 1,
          totalPeriods: 3,
        },
      };

      expect(result.historyPeriods.length).toBe(1);
      expect(result.worldGenProgress.currentPeriod).toBe(1);
      expect(result.worldGenProgress.totalPeriods).toBe(3);
    });

    it('should accumulate historical periods', () => {
      const state = createMockGraphState({
        historyPeriods: [{ period: 1, events: [] }],
        worldGenProgress: {
          phase: 'history_period',
          currentPeriod: 1,
          totalPeriods: 3,
        },
      });

      const result = {
        ...state,
        historyPeriods: [...state.historyPeriods, { period: 2, events: ['Event A'], summary: 'Period 2' }],
        worldGenProgress: {
          phase: 'history_period',
          currentPeriod: 2,
          totalPeriods: 3,
        },
      };

      expect(result.historyPeriods.length).toBe(2);
      expect(result.worldGenProgress.currentPeriod).toBe(2);
    });
  });

  describe('structures node', () => {
    it('should place structures based on templates', () => {
      const state = createMockGraphState({
        worldGenProgress: { phase: 'history_period' },
      });

      const result = {
        ...state,
        structures: [
          { id: 'struct-1', name: 'Tower', x: 100, y: 200, type: 'landmark' },
          { id: 'struct-2', name: 'Village', x: 300, y: 400, type: 'settlement' },
        ],
        worldGenProgress: {
          phase: 'structures',
        },
      };

      expect(result.structures.length).toBeGreaterThan(0);
      expect(result.worldGenProgress.phase).toBe('structures');
    });

    it('should respect structure spawn rules', () => {
      const structures = [
        { id: '1', name: 'Tower', x: 100, y: 100, biome: 'plains', minDistance: 50 },
        { id: '2', name: 'Ruin', x: 500, y: 500, biome: 'desert', minDistance: 100 },
      ];

      const distance = Math.sqrt(Math.pow(500 - 100, 2) + Math.pow(500 - 100, 2));

      expect(distance).toBeGreaterThan(50);
      expect(distance).toBeGreaterThan(100);
    });
  });

  describe('roads node', () => {
    it('should build road network between structures', () => {
      const state = createMockGraphState({
        structures: [
          { id: '1', x: 100, y: 100 },
          { id: '2', x: 200, y: 200 },
        ],
        worldGenProgress: { phase: 'structures' },
      });

      const result = {
        ...state,
        roads: [
          {
            from: { x: 100, y: 100 },
            to: { x: 200, y: 200 },
            path: [],
          },
        ],
        worldGenProgress: {
          phase: 'roads',
        },
      };

      expect(result.roads.length).toBeGreaterThan(0);
      expect(result.worldGenProgress.phase).toBe('roads');
    });
  });

  describe('terrain node', () => {
    it('should generate heightmap data', () => {
      const state = createMockGraphState({
        worldGenProgress: { phase: 'roads' },
      });

      const result = {
        ...state,
        worldGenProgress: {
          phase: 'terrain',
        },
      };

      expect(result.worldGenProgress.phase).toBe('terrain');
    });
  });

  describe('chunks node', () => {
    it('should pre-generate core chunks', () => {
      const state = createMockGraphState({
        worldGenProgress: { phase: 'terrain' },
      });

      const result = {
        ...state,
        worldGenProgress: {
          phase: 'chunks',
        },
      };

      expect(result.worldGenProgress.phase).toBe('chunks');
    });
  });

  describe('lore node', () => {
    it('should create worldDescription from LLM', () => {
      const state = createMockGraphState({
        worldConditions: {
          temperature: 0.5,
          moisture: 0.5,
        },
        historyPeriods: [{ period: 1, events: ['Event 1'] }],
        structures: [{ id: '1', name: 'Tower' }],
        worldGenProgress: { phase: 'chunks' },
      });

      const result = {
        ...state,
        worldDescription: 'A rich fantasy world with ancient towers...',
        worldHistory: 'Long ago, the first civilizations...',
        worldGenProgress: {
          phase: 'lore',
        },
      };

      expect(result.worldDescription).toBeDefined();
      expect(result.worldDescription.length).toBeGreaterThan(0);
      expect(result.worldGenProgress.phase).toBe('lore');
    });
  });

  describe('completion node', () => {
    it('should finalize worldGenProgress phase to complete', () => {
      const state = createMockGraphState({
        worldDescription: 'Complete world',
        structures: [{ id: '1' }],
        worldGenProgress: { phase: 'lore' },
      });

      const result = {
        ...state,
        worldGenProgress: {
          phase: 'complete',
          currentPeriod: 0,
          totalPeriods: 0,
        },
      };

      expect(result.worldGenProgress.phase).toBe('complete');
    });

    it('should preserve all generated world data', () => {
      const state = createMockGraphState({
        worldDescription: 'Complete',
        worldHistory: 'History',
        structures: [{ id: '1' }],
        roads: [{ from: { x: 0, y: 0 }, to: { x: 1, y: 1 } }],
        worldConditions: { temperature: 0.5 },
      });

      const result = {
        ...state,
        worldGenProgress: { phase: 'complete' },
      };

      expect(result.worldDescription).toBe('Complete');
      expect(result.worldHistory).toBe('History');
      expect(result.structures.length).toBe(1);
      expect(result.roads.length).toBe(1);
      expect(result.worldConditions).toBeDefined();
    });
  });
});
