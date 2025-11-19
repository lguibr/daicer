/**
 * Mock implementations for testing
 * Provides mocks for LLM, LangGraph, Socket.IO, and external APIs
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AIMessage } from '@langchain/core/messages';

/**
 * Mock LLM (LangChain BaseChatModel)
 * Returns predictable responses for testing
 */
export class MockLLM {
  private responses: Map<string, any> = new Map();

  /**
   * Set a mock response for a specific prompt pattern
   */
  mockResponse(promptPattern: string | RegExp, response: any): void {
    const key = typeof promptPattern === 'string' ? promptPattern : promptPattern.source;
    this.responses.set(key, response);
  }

  /**
   * Mock invoke method (returns AIMessage)
   */
  async invoke(input: any): Promise<AIMessage> {
    const content = typeof input === 'string' ? input : JSON.stringify(input);

    // Try to match against registered responses
    for (const [pattern, response] of this.responses.entries()) {
      if (content.includes(pattern) || new RegExp(pattern).test(content)) {
        return {
          content: typeof response === 'string' ? response : JSON.stringify(response),
          additional_kwargs: {},
        } as AIMessage;
      }
    }

    // Default response
    return {
      content: 'Mock LLM response',
      additional_kwargs: {},
    } as AIMessage;
  }

  /**
   * Mock structured output
   */
  withStructuredOutput(schema: any): MockLLM {
    const self = this;
    return {
      ...this,
      async invoke(input: any): Promise<any> {
        const message = await self.invoke(input);
        const content = typeof message.content === 'string' ? message.content : '';

        // Try to parse as JSON, or return mock structured data
        try {
          return JSON.parse(content);
        } catch {
          // Return default structured output based on schema name
          if (schema.name?.includes('turn') || schema.name?.includes('Turn')) {
            return {
              overall_summary: 'The adventure continues.',
              player_perspectives: [{ playerId: 'player-1', message: 'You see something interesting.' }],
            };
          }

          if (schema.name?.includes('world') || schema.name?.includes('World')) {
            return {
              worldDescription: 'A vast fantasy world.',
              setting: 'High Fantasy',
              tone: 'Epic',
            };
          }

          return { mocked: true, content };
        }
      },
    } as any;
  }

  /**
   * Clear all mock responses
   */
  clear(): void {
    this.responses.clear();
  }
}

/**
 * Create a mock LLM instance
 */
export function createMockLLM(): MockLLM {
  return new MockLLM();
}

/**
 * Mock LangGraph invoke
 * Returns predictable state updates
 */
export function createMockGraphInvoke<T>(returnValue: T): jest.Mock<Promise<T>> {
  return jest.fn().mockResolvedValue(returnValue);
}

/**
 * Mock Socket.IO socket
 */
export interface MockSocket {
  id: string;
  rooms: Set<string>;
  emit: jest.Mock;
  on: jest.Mock;
  join: jest.Mock;
  leave: jest.Mock;
  to: jest.Mock;
  disconnect: jest.Mock;
  data: any;
}

/**
 * Create a mock Socket.IO socket
 */
export function createMockSocket(id = 'socket-123'): MockSocket {
  const rooms = new Set<string>();

  const mockSocket: MockSocket = {
    id,
    rooms,
    emit: jest.fn(),
    on: jest.fn(),
    join: jest.fn((room: string) => {
      rooms.add(room);
      return Promise.resolve();
    }),
    leave: jest.fn((room: string) => {
      rooms.delete(room);
      return Promise.resolve();
    }),
    to: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
    data: {},
  };

  return mockSocket;
}

/**
 * Mock Socket.IO server
 */
export interface MockSocketServer {
  emit: jest.Mock;
  to: jest.Mock;
  in: jest.Mock;
  sockets: {
    sockets: Map<string, MockSocket>;
  };
}

/**
 * Create a mock Socket.IO server
 */
export function createMockSocketServer(): MockSocketServer {
  const sockets = new Map<string, MockSocket>();

  const mockServer: MockSocketServer = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    sockets: {
      sockets,
    },
  };

  return mockServer;
}

/**
 * Mock Gemini API response
 */
export interface MockGeminiResponse {
  response: {
    text: () => string;
    candidates?: Array<{
      content: { parts: Array<{ text: string }> };
    }>;
  };
}

/**
 * Create a mock Gemini API client
 */
export function createMockGemini() {
  return {
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: () => 'Mock generated content',
        candidates: [
          {
            content: {
              parts: [{ text: 'Mock generated content' }],
            },
          },
        ],
      },
    } as MockGeminiResponse),
  };
}

/**
 * Mock Firestore document reference
 */
export function createMockDocRef(id: string, data: any = {}) {
  return {
    id,
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => data,
      id,
    }),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Mock Firestore collection reference
 */
export function createMockCollectionRef(documents: Array<{ id: string; data: any }> = []) {
  return {
    doc: jest.fn((id: string) => {
      const doc = documents.find((d) => d.id === id);
      return createMockDocRef(id, doc?.data);
    }),
    get: jest.fn().mockResolvedValue({
      docs: documents.map((doc) => ({
        id: doc.id,
        data: () => doc.data,
      })),
    }),
    add: jest.fn().mockResolvedValue(createMockDocRef('new-doc-id')),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };
}

/**
 * Mock dice roller
 * Always returns predictable results for testing
 */
export class MockDiceRoller {
  private results: number[] = [];
  private index = 0;

  /**
   * Set predetermined roll results
   */
  setResults(results: number[]): void {
    this.results = results;
    this.index = 0;
  }

  /**
   * Roll dice (returns next predetermined result)
   */
  roll(notation: string): { total: number; rolls: number[]; notation: string } {
    const result = this.results[this.index] ?? 10; // Default to 10 if no result set
    this.index = (this.index + 1) % Math.max(this.results.length, 1);

    return {
      total: result,
      rolls: [result],
      notation,
    };
  }

  /**
   * Reset to first result
   */
  reset(): void {
    this.index = 0;
  }
}

/**
 * Create a mock dice roller
 */
export function createMockDiceRoller(results: number[] = [10, 15, 8]): MockDiceRoller {
  const roller = new MockDiceRoller();
  roller.setResults(results);
  return roller;
}

/**
 * Mock fetch for HTTP requests
 */
export function createMockFetch(responses: Map<string, any> = new Map()): jest.Mock {
  return jest.fn((url: string, options?: any) => {
    const key = `${options?.method || 'GET'} ${url}`;
    const response = responses.get(key) || { data: 'mock response' };

    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => response,
      text: async () => JSON.stringify(response),
      headers: new Map(),
    });
  });
}

/**
 * Mock Express Request
 */
export function createMockRequest(overrides: any = {}): any {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    method: 'GET',
    path: '/',
    url: '/',
    ...overrides,
  };
}

/**
 * Mock Express Response
 */
export function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    locals: {},
  };
  return res;
}

/**
 * Mock Express Next Function
 */
export function createMockNext(): jest.Mock {
  return jest.fn();
}
