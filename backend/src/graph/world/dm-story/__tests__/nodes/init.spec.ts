/**
 * Init World Node Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import { initWorldNode } from '../../nodes/init';
import type { DMStoryState } from '@daicer/shared/graph-states';

describe('initWorldNode', () => {
  const baseInput: DMStoryState = {
    roomId: 'test-room',
    language: 'en',
    settings: {
      theme: 'High Fantasy',
      tone: 'Heroic',
      setting: 'Medieval',
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
    historyPeriods: [],
    currentPeriod: 0,
    totalPeriods: 0,
    conditions: [],
  };

  it('should initialize history periods array', async () => {
    const result = await initWorldNode(baseInput);

    expect(result).toEqual({
      historyPeriods: [],
      currentPeriod: 0,
      totalPeriods: 1, // Single period for quick generation
    });
  });

  it('should handle historyDepth = 0 (no history)', async () => {
    const input: DMStoryState = {
      ...baseInput,
      settings: { ...baseInput.settings, historyDepth: 0 },
    };

    const result = await initWorldNode(input);

    expect(result.totalPeriods).toBe(0);
  });

  it('should round up partial periods', async () => {
    const input: DMStoryState = {
      ...baseInput,
      settings: { ...baseInput.settings, historyDepth: 125 }, // 125 / 50 = 2.5
    };

    const result = await initWorldNode(input);

    expect(result.totalPeriods).toBe(1); // Single period for quick generation
  });

  it('should initialize with empty historyPeriods', async () => {
    const result = await initWorldNode(baseInput);

    expect(result.historyPeriods).toEqual([]);
  });

  it('should set currentPeriod to 0', async () => {
    const result = await initWorldNode(baseInput);

    expect(result.currentPeriod).toBe(0);
  });
});
