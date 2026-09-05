/**
 * ⚠️ DOCUMENTATION MANDATE: Update JSDoc & README with ANY change.
 * Keep documentation synchronized with code at all times.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Strapi Factory
vi.mock('@strapi/strapi', () => ({
  factories: {
    createCoreService: (uid: string, cfg: any) => cfg,
  },
}));

import turnPipelineFactory from '@/api/game/services/turn-pipeline';

describe('Turn Pipeline Service', () => {
  it.each(['startGame', 'submitAction', 'resolveTurn'])('routes %s through the authenticated durable lifecycle', async (method) => {
    const input = { requestId: 'request', roomId: 'room', turnNumber: 1 };
    const user = { documentId: 'viewer' };
    const operation = vi.fn().mockResolvedValue({ status: 'complete' });
    const strapi = { service: vi.fn(() => ({ [method]: operation })) };
    const pipeline = turnPipelineFactory({ strapi: strapi as any });
    expect(await pipeline[method](input, user)).toEqual({ status: 'complete' });
    expect(strapi.service).toHaveBeenCalledWith('api::game.turn-lifecycle');
    expect(operation).toHaveBeenCalledExactlyOnceWith(input, user);
  });

  let turnPipeline: any;
  let mockStrapi: any;
  let mockLockService: any;

  let mockActionEngine: any;
  let mockUpdateFn: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLockService = {
      acquire: vi.fn().mockResolvedValue(true),
      release: vi.fn().mockResolvedValue(true),
    };

    mockActionEngine = {
      dispatch: vi.fn().mockResolvedValue([
        {
          success: true,
          events: [{ type: 'TEST_EVENT', documentId: 'evt-1' }],
          stateDiff: {
            updates: [{ collection: 'api::entity-sheet.entity-sheet', documentId: 'e1', data: { hp: 5 } }],
            creates: [],
            deletes: [],
          },
        },
      ]),
    };

    const mockUpdate = vi.fn().mockResolvedValue({});
    const mockCreate = vi.fn((params) => ({ documentId: 'created-doc', ...params.data }));
    const mockFindMany = vi.fn().mockResolvedValue([]);

    mockUpdateFn = vi.fn().mockResolvedValue({});
    const mockQueryUpdate = vi.fn().mockReturnValue({ update: mockUpdateFn });

    mockStrapi = {
      log: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
      db: {
        transaction: vi.fn(async (cb) => {
          return await cb({}); // Execute callback immediately
        }),
        query: mockQueryUpdate,
      },
      service: vi.fn((uid) => {
        if (uid === 'api::game.lock-service') return mockLockService;
        if (uid === 'api::game.action-engine') return mockActionEngine;
        return null;
      }),
      documents: vi.fn(() => ({
        findMany: mockFindMany,
        create: mockCreate,
        update: mockUpdate,
      })),
    };

    turnPipeline = turnPipelineFactory({ strapi: mockStrapi });
  });

  // Helper to access mocks

  it('should lock room, dispatch actions (dryRun), persist results, and unlock', async () => {
    const inputs = [{ type: 'command', command: { type: 'MOVE', payload: {} } }];

    const result = await turnPipeline.processTurn('room-1', inputs);

    // 1. Lock check
    expect(mockLockService.acquire).toHaveBeenCalledWith('room-1', expect.stringContaining('pipeline-'));

    // 2. Action Dispatch (dryRun=true)
    expect(mockActionEngine.dispatch).toHaveBeenCalledWith('room-1', expect.any(Array), true);

    // 3. Persistence
    // Updates
    expect(mockUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({ where: { documentId: 'e1' }, data: { hp: 5 } })
    );
    // Events
    expect(mockStrapi.documents('api::game-event.game-event').create).toHaveBeenCalled();
    // Turn
    expect(mockStrapi.documents('api::turn.turn').create).toHaveBeenCalled();
    // TimeFrame
    expect(mockStrapi.documents('api::time-frame.time-frame').create).toHaveBeenCalled();

    // 4. Unlock
    expect(mockLockService.release).toHaveBeenCalled();

    expect(result.success).toBe(true);
  });

  it('should reject if room is locked', async () => {
    mockLockService.acquire.mockResolvedValue(false);

    await expect(turnPipeline.processTurn('room-1', [])).rejects.toThrow('Room is currently processing');

    expect(mockActionEngine.dispatch).not.toHaveBeenCalled();
  });
});
