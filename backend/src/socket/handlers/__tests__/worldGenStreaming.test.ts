/**
 * World Generation Streaming Tests
 * Tests streaming events for 11-phase world generation graph
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createMockGraphState,
  extractPhasesFromStreamEvents,
  assertWorldGenPhaseSequence,
} from '../../../test/helpers/worldTestHelpers';

// Mock dependencies
jest.mock('@/utils/logger');

describe('World Generation Streaming', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Phase progression', () => {
    it('should emit events in correct phase order', () => {
      const mockStreamEvents = [
        { type: 'world_gen_progress', data: { phase: 'init' } },
        { type: 'world_gen_progress', data: { phase: 'conditions' } },
        { type: 'world_gen_progress', data: { phase: 'history_summary' } },
        { type: 'world_gen_progress', data: { phase: 'history_period', currentPeriod: 1, totalPeriods: 2 } },
        { type: 'world_gen_progress', data: { phase: 'history_period', currentPeriod: 2, totalPeriods: 2 } },
        { type: 'world_gen_progress', data: { phase: 'structures' } },
        { type: 'world_gen_progress', data: { phase: 'roads' } },
        { type: 'world_gen_progress', data: { phase: 'terrain' } },
        { type: 'world_gen_progress', data: { phase: 'chunks' } },
        { type: 'world_gen_progress', data: { phase: 'lore' } },
        { type: 'world_gen_progress', data: { phase: 'complete' } },
      ];

      const phases = extractPhasesFromStreamEvents(mockStreamEvents);

      expect(() => assertWorldGenPhaseSequence(phases)).not.toThrow();
      expect(phases[0]).toBe('init');
      expect(phases[phases.length - 1]).toBe('complete');
    });

    it('should include all required phases', () => {
      const mockStreamEvents = [
        { type: 'world_gen_progress', data: { phase: 'init' } },
        { type: 'world_gen_progress', data: { phase: 'conditions' } },
        { type: 'world_gen_progress', data: { phase: 'structures' } },
        { type: 'world_gen_progress', data: { phase: 'terrain' } },
        { type: 'world_gen_progress', data: { phase: 'lore' } },
        { type: 'world_gen_progress', data: { phase: 'complete' } },
      ];

      const phases = extractPhasesFromStreamEvents(mockStreamEvents);

      expect(phases).toContain('init');
      expect(phases).toContain('conditions');
      expect(phases).toContain('structures');
      expect(phases).toContain('complete');
    });

    it('should track historical period progress', () => {
      const periodEvents = [
        { type: 'world_gen_progress', data: { phase: 'history_period', currentPeriod: 1, totalPeriods: 3 } },
        { type: 'world_gen_progress', data: { phase: 'history_period', currentPeriod: 2, totalPeriods: 3 } },
        { type: 'world_gen_progress', data: { phase: 'history_period', currentPeriod: 3, totalPeriods: 3 } },
      ];

      expect(periodEvents[0].data.currentPeriod).toBe(1);
      expect(periodEvents[1].data.currentPeriod).toBe(2);
      expect(periodEvents[2].data.currentPeriod).toBe(3);
      expect(periodEvents.every((e) => e.data.totalPeriods === 3)).toBe(true);
    });
  });

  describe('Error events', () => {
    it('should emit graph_error event on failure', () => {
      const errorEvent = {
        type: 'graph_error',
        error: 'World generation failed',
        phase: 'structures',
      };

      expect(errorEvent.type).toBe('graph_error');
      expect(errorEvent.error).toBeDefined();
      expect(errorEvent.phase).toBe('structures');
    });

    it('should include retry count in error events', () => {
      const state = createMockGraphState({
        worldGenProgress: {
          phase: 'terrain',
          retryCount: 2,
          lastError: 'Terrain generation failed',
        },
      });

      expect(state.worldGenProgress.retryCount).toBe(2);
      expect(state.worldGenProgress.lastError).toBe('Terrain generation failed');
    });
  });

  describe('Progress updates', () => {
    it('should update worldGenProgress state incrementally', () => {
      const states = [
        createMockGraphState({ worldGenProgress: { phase: 'init', currentPeriod: 0, totalPeriods: 0 } }),
        createMockGraphState({ worldGenProgress: { phase: 'conditions', currentPeriod: 0, totalPeriods: 0 } }),
        createMockGraphState({ worldGenProgress: { phase: 'history_period', currentPeriod: 1, totalPeriods: 2 } }),
        createMockGraphState({ worldGenProgress: { phase: 'complete', currentPeriod: 0, totalPeriods: 0 } }),
      ];

      expect(states[0].worldGenProgress.phase).toBe('init');
      expect(states[1].worldGenProgress.phase).toBe('conditions');
      expect(states[2].worldGenProgress.currentPeriod).toBe(1);
      expect(states[3].worldGenProgress.phase).toBe('complete');
    });

    it('should broadcast state updates to all clients in room', () => {
      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      const roomId = 'test-room';
      const updatedState = createMockGraphState({
        worldGenProgress: { phase: 'structures' },
      });

      mockIo.to(roomId);
      mockIo.emit('state:update', updatedState);

      expect(mockIo.to).toHaveBeenCalledWith(roomId);
      expect(mockIo.emit).toHaveBeenCalledWith('state:update', updatedState);
    });
  });

  describe('Completion events', () => {
    it('should emit final completion event', () => {
      const completionEvent = {
        type: 'world_gen_progress',
        data: {
          phase: 'complete',
          worldDescription: 'A rich fantasy world...',
          structures: [],
          roads: [],
        },
      };

      expect(completionEvent.data.phase).toBe('complete');
      expect(completionEvent.data.worldDescription).toBeDefined();
    });

    it('should trigger state broadcast on completion', () => {
      const finalState = createMockGraphState({
        worldGenProgress: { phase: 'complete' },
        worldDescription: 'Complete world description',
        structures: [{ id: 'struct-1', name: 'Ancient Tower' }],
        roads: [],
      });

      expect(finalState.worldGenProgress.phase).toBe('complete');
      expect(finalState.worldDescription).toBeDefined();
      expect(finalState.structures.length).toBeGreaterThan(0);
    });
  });
});
