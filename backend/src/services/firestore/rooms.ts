/* eslint-disable no-continue */
import { getDb } from '@/config/firebase';
import type { Room, WorldSettings, RoomMembership, Player } from '@/types/index';
import { GamePhase } from '@/types/index';
import { generateRoomCode } from '@/utils/room-code';
import { logger } from '@/utils/logger';

const db = () => getDb();

// ============================================================================
// Cache Layer for Active Game Sessions
// ============================================================================

interface RoomCacheEntry {
  room: Room;
  timestamp: number;
}

const ROOM_CACHE_TTL = 30000; // 30 seconds for active game rooms
const roomCache = new Map<string, RoomCacheEntry>();

function getCachedRoom(roomId: string): Room | null {
  const entry = roomCache.get(roomId);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > ROOM_CACHE_TTL) {
    roomCache.delete(roomId);
    return null;
  }

  return entry.room;
}

function setCachedRoom(roomId: string, room: Room): void {
  roomCache.set(roomId, { room, timestamp: Date.now() });
}

function invalidateRoomCache(roomId: string): void {
  roomCache.delete(roomId);
}

// ============================================================================
// Room Operations
// ============================================================================

export async function createRoom(ownerId: string, settings?: WorldSettings, structures?: any[]): Promise<Room> {
  const code = generateRoomCode();
  const roomRef = db().collection('rooms').doc();

  const room: Room = {
    id: roomRef.id,
    code,
    ownerId,
    phase: GamePhase.SETUP,
    worldDescription: '',
    characterCreationLocked: true, // Lock by default, owner must approve
    settings: settings || null,
    structures: structures || [],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await roomRef.set(room);

  // Create owner as a player in the room
  const ownerPlayer: Player = {
    id: ownerId,
    userId: ownerId,
    character: null,
    action: null,
    isReady: false,
    isOnline: true,
    joinedAt: Date.now(),
  };

  await db().collection('rooms').doc(room.id).collection('players').doc(ownerId).set(ownerPlayer);

  logger.info(`Room created: ${room.id} with code ${code}`);
  return room;
}

export async function findRoomByCode(code: string): Promise<Room | null> {
  const snapshot = await db()
    .collection('rooms')
    .where('code', '==', code)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  if (!doc) {
    return null;
  }

  return doc.data() as Room;
}

export async function getRoom(roomId: string): Promise<Room | null> {
  // Check cache first
  const cached = getCachedRoom(roomId);
  if (cached) {
    return cached;
  }

  // Fetch from Firestore
  const doc = await db().collection('rooms').doc(roomId).get();

  if (!doc.exists) {
    return null;
  }

  const room = doc.data() as Room;
  // Cache for active game sessions
  setCachedRoom(roomId, room);
  return room;
}

export async function updateRoomSettings(roomId: string, settings: WorldSettings): Promise<Room> {
  const roomRef = db().collection('rooms').doc(roomId);

  await roomRef.update({
    settings,
    updatedAt: Date.now(),
  });

  // Invalidate cache since room was updated
  invalidateRoomCache(roomId);

  const updated = await roomRef.get();
  const room = updated.data() as Room;
  setCachedRoom(roomId, room);
  return room;
}

export async function updateRoomWorld(
  roomId: string,
  worldData: {
    worldDescription: string;
    worldHistory?: any;
    structures?: any[];
    roads?: any[];
    worldConditions?: any[];
  },
  phase: GamePhase
): Promise<Room> {
  const roomRef = db().collection('rooms').doc(roomId);

  // Build update data, filtering out undefined values
  const updateData: Partial<Room> = {
    worldDescription: worldData.worldDescription,
    phase,
    updatedAt: Date.now(),
  };

  // Only add optional fields if they're defined
  if (worldData.worldHistory !== undefined) {
    updateData.worldHistory = worldData.worldHistory;
  }
  if (worldData.structures !== undefined) {
    updateData.structures = worldData.structures;
  }
  if (worldData.roads !== undefined) {
    updateData.roads = worldData.roads;
  }
  if (worldData.worldConditions !== undefined) {
    updateData.worldConditions = worldData.worldConditions;
  }

  await roomRef.update(updateData);

  // Invalidate cache since room was updated
  invalidateRoomCache(roomId);

  const updatedDoc = await roomRef.get();
  const room = updatedDoc.data() as Room;
  setCachedRoom(roomId, room);
  return room;
}

export async function deleteRoom(roomId: string): Promise<void> {
  const batch = db().batch();

  batch.delete(db().collection('rooms').doc(roomId));

  const playersSnapshot = await db().collection('rooms').doc(roomId).collection('players').get();
  playersSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  const messagesSnapshot = await db().collection('rooms').doc(roomId).collection('messages').get();
  messagesSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  // Invalidate cache
  invalidateRoomCache(roomId);

  logger.info(`Room deleted: ${roomId}`);
}

export async function getRoomMembershipsForUser(userId: string): Promise<RoomMembership[]> {
  const playersSnapshot = await db().collectionGroup('players').where('userId', '==', userId).get();

  if (playersSnapshot.empty) {
    return [];
  }

  const roomIds = Array.from(new Set(playersSnapshot.docs.map((doc) => doc.ref.parent.parent?.id).filter(Boolean)));

  const memberships: RoomMembership[] = [];

  for (const roomId of roomIds) {
    if (!roomId) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const roomDoc = await db().collection('rooms').doc(roomId).get();
    const roomData = roomDoc.data() as Room;
    const playerDoc = playersSnapshot.docs.find((doc) => doc.ref.parent.parent?.id === roomId);
    const playerData = playerDoc?.data();

    // eslint-disable-next-line no-continue
    if (!roomDoc.exists || roomData.isActive === false || !playerDoc) {
      continue;
    }

    const room: Room = {
      ...roomData,
      id: roomDoc.id,
    };

    memberships.push({
      room,
      roomId: room.id,
      isOwner: room.ownerId === userId,
      player: playerData as Player,
      updatedAt: room.updatedAt,
    });
  }

  return memberships.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function markRoomInactive(roomId: string): Promise<void> {
  await db().collection('rooms').doc(roomId).update({
    isActive: false,
    updatedAt: Date.now(),
  });

  // Invalidate cache
  invalidateRoomCache(roomId);

  logger.info(`Room marked inactive: ${roomId}`);
}

/**
 * Clear room cache (for testing or manual cache management)
 */
export function clearRoomCache(): void {
  roomCache.clear();
  logger.info('Room cache cleared');
}
