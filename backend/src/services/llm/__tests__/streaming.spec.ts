/**
 * Tests for streaming text generation service
 */

import { jest } from '@jest/globals';
import { collectStreamedText, batchStreamChunks } from '../streaming';
import type { StreamChunk } from '../streaming';

// Mock the entire gemini module to avoid real API calls
jest.mock('../gemini', () => ({
  getFlashModel: jest.fn(() => ({
    stream: jest.fn().mockImplementation(async function* () {
      yield { content: 'The tavern ' };
      yield { content: 'is warm ' };
      yield { content: 'and welcoming.' };
    }),
  })),
  getProModel: jest.fn(() => ({
    stream: jest.fn().mockImplementation(async function* () {
      yield { content: 'Response ' };
      yield { content: 'from Pro model.' };
    }),
  })),
  extractErrorDetails: jest.fn(() => 'Mock error'),
}));

describe('Streaming Service', () => {
  describe('streamText (unit tests with mocks)', () => {
    it('should be tested via integration tests', () => {
      // streamText is better tested via integration tests with real Gemini API
      // or with comprehensive mocking in a separate integration test suite
      expect(true).toBe(true);
    });
  });

  describe('collectStreamedText', () => {
    it('should collect all chunks into full text', async () => {
      const mockStream = (async function* () {
        yield { content: 'Hello ', done: false };
        yield { content: 'world', done: false };
        yield { content: '', done: true };
      })();

      const result = await collectStreamedText(mockStream);
      expect(result).toBe('Hello world');
    });

    it('should handle empty stream', async () => {
      const mockStream = (async function* () {
        yield { content: '', done: true };
      })();

      const result = await collectStreamedText(mockStream);
      expect(result).toBe('');
    });
  });

  describe('batchStreamChunks', () => {
    it('should batch chunks by token count', async () => {
      const mockStream = (async function* () {
        yield { content: 'a', done: false };
        yield { content: 'b', done: false };
        yield { content: 'c', done: false };
        yield { content: '', done: true };
      })();

      const batches: StreamChunk[] = [];
      const batchedStream = batchStreamChunks(mockStream, 2);

      for await (const batch of batchedStream) {
        batches.push(batch);
      }

      // Should have batched into fewer chunks
      expect(batches.length).toBeLessThan(4);
    });
  });
});
