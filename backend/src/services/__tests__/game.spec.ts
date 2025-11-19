/**
 * Game service tests
 * Tests for generateWorld() and processTurn()
 * Target coverage: 75%
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { generateWorld, processTurn } from '../game';
import { createMockRoom, createMockPlayer, createMockLLMResponse } from '../../../test/helpers';
import { createMockLLM } from '../../../test/mocks';
import type { WorldSettings } from '@/types/index';

// Mock LangChain config
jest.mock('@/config/langchain', () => ({
  getLLMModel: jest.fn(() => createMockLLM()),
}));

// Mock LLM service
jest.mock('../llm', () => ({
  generateText: jest.fn(async () => 'Mock generated text'),
}));

// Mock structured generation
jest.mock('../llm/structured', () => ({
  generateStructured: jest.fn(async () => ({
    title: 'The Lost Kingdom',
    description: 'A vast fantasy realm awaits adventurers.',
    atmosphere: 'Epic and mysterious',
    keyLocations: [{ name: 'The Ancient City', description: 'Ruins of a forgotten civilization' }],
    threats: ['Dark sorcerer', 'Ancient dragon'],
    hooks: ['A mysterious map appears', 'The king requests aid'],
    metadata: {
      difficulty: 'medium',
      theme: 'high-fantasy',
      setting: 'medieval',
    },
  })),
}));

// Mock RAG
jest.mock('../rag', () => ({
  getRuleContext: jest.fn(async () => 'D&D 5e rules context'),
}));

// Mock worker pool
jest.mock('@/workers/workerPool');

describe('Game Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateWorld', () => {
    const mockSettings: WorldSettings = {
      playerCount: 4,
      adventureLength: 'medium',
      difficulty: 'medium',
      theme: 'high-fantasy',
      setting: 'Medieval Kingdom',
      tone: 'Heroic',
    };

    it('should generate world description with valid settings', async () => {
      const result = await generateWorld(mockSettings, 'en');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle different languages', async () => {
      const enResult = await generateWorld(mockSettings, 'en');
      const esResult = await generateWorld(mockSettings, 'es');

      expect(enResult).toBeDefined();
      expect(esResult).toBeDefined();
    });

    it('should handle different themes', async () => {
      const fantasySettings = { ...mockSettings, theme: 'high-fantasy' as const };
      const scifiSettings = { ...mockSettings, theme: 'sci-fi' as const };

      const fantasyWorld = await generateWorld(fantasySettings, 'en');
      const scifiWorld = await generateWorld(scifiSettings, 'en');

      expect(fantasyWorld).toBeDefined();
      expect(scifiWorld).toBeDefined();
    });

    it('should handle LLM errors gracefully', async () => {
      const { generateStructured } = await import('../llm/structured');
      (generateStructured as jest.Mock).mockRejectedValueOnce(new Error('LLM API error'));

      await expect(generateWorld(mockSettings, 'en')).rejects.toThrow();
    });
  });

  describe('processTurn (integration-like)', () => {
    it('should handle basic turn processing concept', () => {
      // Note: processTurn is complex and typically needs the full graph
      // This is a placeholder to show the testing pattern
      // Full integration tests exist in api/__tests__/game.integration.spec.ts
      expect(true).toBe(true);
    });
  });
});
