import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Response } from 'express';
import type { AuthRequest } from '@/middleware/auth';
import type { CharacterSheet, Room, Player, RoomMembership } from '@/types/index';
import { GamePhase } from '@/types/index';
import { NEW_CHARACTER_TEMPLATE } from '@/constants';
import { listRoomsHandler, leaveRoomMembershipHandler } from '@/api/rooms';
import {
  getRoomMembershipsForUser,
  getRoom,
  getPlayer,
  removePlayer,
  getPlayers,
  markRoomInactive,
} from '@/services/firestore';

jest.mock('@/services/firestore');

const mockedGetRoomMembershipsForUser = getRoomMembershipsForUser as jest.MockedFunction<
  typeof getRoomMembershipsForUser
>;
const mockedGetRoom = getRoom as jest.MockedFunction<typeof getRoom>;
const mockedGetPlayer = getPlayer as jest.MockedFunction<typeof getPlayer>;
const mockedRemovePlayer = removePlayer as jest.MockedFunction<typeof removePlayer>;
const mockedGetPlayers = getPlayers as jest.MockedFunction<typeof getPlayers>;
const mockedMarkRoomInactive = markRoomInactive as jest.MockedFunction<typeof markRoomInactive>;

describe('Rooms API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (overrides: Partial<AuthRequest> = {}): AuthRequest =>
    ({
      params: {},
      query: {},
      body: {},
      headers: {},
      user: {
        uid: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
      },
      ...overrides,
    }) as AuthRequest;

  const createResponse = () => {
    const res: Partial<Response> & { body?: unknown; statusCode?: number } = {
      statusCode: 200,
    };
    res.status = function status(code: number) {
      res.statusCode = code;
      return this as Response;
    };
    res.json = function json(payload: unknown) {
      res.body = payload;
      return this as Response;
    };
    return res as Response & { body?: unknown; statusCode?: number };
  };

  const stubCharacter = structuredClone(NEW_CHARACTER_TEMPLATE) as CharacterSheet;

  describe('GET /api/rooms', () => {
    it('returns memberships for authenticated user', async () => {
      const membership: RoomMembership = {
        room: {
          id: 'room-1',
          code: 'ABC123',
          ownerId: 'owner-1',
          settings: null,
          worldDescription: 'A narrated world',
          phase: GamePhase.SETUP,
          createdAt: 1,
          updatedAt: 2,
        },
        isOwner: false,
        player: {
          id: 'user-123',
          userId: 'user-123',
          name: 'Ada Lovelace',
          character: structuredClone(stubCharacter),
          action: null,
          isReady: false,
          joinedAt: 42,
        },
      };

      mockedGetRoomMembershipsForUser.mockResolvedValue([membership]);

      const req = createRequest();
      const res = createResponse();

      await listRoomsHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ success: true, data: [membership] });
      expect(mockedGetRoomMembershipsForUser).toHaveBeenCalledWith('user-123');
    });
  });

  describe('DELETE /api/rooms/:roomId/membership', () => {
    const baseRoom: Room = {
      id: 'room-2',
      code: 'XYZ789',
      ownerId: 'owner-2',
      settings: null,
      worldDescription: '',
      phase: GamePhase.GAMEPLAY,
      createdAt: 10,
      updatedAt: 20,
    };

    it('removes player membership and marks room inactive when last player leaves', async () => {
      const player: Player = {
        id: 'user-123',
        userId: 'user-123',
        name: 'Player One',
        character: structuredClone(stubCharacter),
        action: null,
        isReady: false,
        joinedAt: Date.now(),
      };

      mockedGetRoom.mockResolvedValue(baseRoom);
      mockedGetPlayer.mockResolvedValue(player);
      mockedRemovePlayer.mockResolvedValue();
      mockedGetPlayers.mockResolvedValue([]);
      mockedMarkRoomInactive.mockResolvedValue();

      const req = createRequest({ params: { roomId: baseRoom.id } });
      const res = createResponse();
      const next = jest.fn();

      await leaveRoomMembershipHandler(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ success: true, data: null });
      expect(mockedGetRoom).toHaveBeenCalledWith(baseRoom.id);
      expect(mockedGetPlayer).toHaveBeenCalledWith(baseRoom.id, 'user-123');
      expect(mockedRemovePlayer).toHaveBeenCalledWith(baseRoom.id, player.id);
      expect(mockedGetPlayers).toHaveBeenCalledWith(baseRoom.id);
      expect(mockedMarkRoomInactive).toHaveBeenCalledWith(baseRoom.id);
    });

    it('allows owners to leave without removing the room', async () => {
      const ownerRoom: Room = { ...baseRoom, ownerId: 'user-123' };

      mockedGetRoom.mockResolvedValue(ownerRoom);
      mockedGetPlayer.mockResolvedValue(null);
      mockedRemovePlayer.mockResolvedValue();
      mockedGetPlayers.mockResolvedValue([]);
      mockedMarkRoomInactive.mockResolvedValue();

      const req = createRequest({ params: { roomId: ownerRoom.id } });
      const res = createResponse();
      const next = jest.fn();

      await leaveRoomMembershipHandler(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ success: true, data: null });
      expect(mockedRemovePlayer).not.toHaveBeenCalled();
      expect(mockedMarkRoomInactive).not.toHaveBeenCalled();
    });

    it('returns 403 when user is not part of the room', async () => {
      mockedGetRoom.mockResolvedValue(baseRoom);
      mockedGetPlayer.mockResolvedValue(null);

      const req = createRequest({ params: { roomId: baseRoom.id } });
      const res = createResponse();
      const next = jest.fn();

      await expect(leaveRoomMembershipHandler(req, res, next)).rejects.toMatchObject({
        statusCode: 403,
        message: 'You are not a member of this room',
      });
    });
  });
});
