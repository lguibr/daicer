/**
 * Firestore database operations
 */

import { getDb } from '@/config/firebase';
import type { Room, Player, Message, Creature, User, WorldSettings, GamePhase, CharacterSheet } from '@/types/index';
import { generateRoomCode } from '@/utils/room-code';
import { logger } from '@/utils/logger';

const db = () => getDb();

/**
 * Create a new user profile
 * @param userId - User ID
 * @param email - User email
 * @param displayName - Display name
 * @param photoURL - Profile photo URL
 * @returns Created user
 */
export async function createUser(userId: string, email: string, displayName: string, photoURL: string): Promise<User> {
  const user: User = {
    id: userId,
    email,
    displayName,
    photoURL,
    createdAt: Date.now(),
  };

  await db().collection('users').doc(userId).set(user);
  logger.info(`User created: ${userId}`);
  return user;
}

/**
 * Get user by ID
 * @param userId - User ID
 * @returns User or null
 */
export async function getUser(userId: string): Promise<User | null> {
  const doc = await db().collection('users').doc(userId).get();
  return doc.exists ? (doc.data() as User) : null;
}

/**
 * Create a new game room
 * @param ownerId - Room owner user ID
 * @returns Created room
 */
export async function createRoom(ownerId: string): Promise<Room> {
  const code = generateRoomCode();
  const roomRef = db().collection('rooms').doc();

  const room: Room = {
    id: roomRef.id,
    code,
    ownerId,
    settings: null,
    worldDescription: '',
    phase: 'SETUP' as GamePhase,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await roomRef.set(room);
  logger.info(`Room created: ${room.id} with code ${code}`);
  return room;
}

/**
 * Find room by code
 * @param code - Room code
 * @returns Room or null
 */
export async function findRoomByCode(code: string): Promise<Room | null> {
  const snapshot = await db().collection('rooms').where('code', '==', code).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  if (!doc) {
    return null;
  }

  return doc.data() as Room;
}

/**
 * Get room by ID
 * @param roomId - Room ID
 * @returns Room or null
 */
export async function getRoom(roomId: string): Promise<Room | null> {
  const doc = await db().collection('rooms').doc(roomId).get();
  return doc.exists ? (doc.data() as Room) : null;
}

/**
 * Update room settings
 * @param roomId - Room ID
 * @param settings - World settings
 * @returns Updated room
 */
export async function updateRoomSettings(roomId: string, settings: WorldSettings): Promise<Room> {
  await db().collection('rooms').doc(roomId).update({
    settings,
    updatedAt: Date.now(),
  });

  return (await getRoom(roomId))!;
}

/**
 * Update room world description and phase
 * @param roomId - Room ID
 * @param worldDescription - Generated world description
 * @param phase - New game phase
 * @returns Updated room
 */
export async function updateRoomWorld(roomId: string, worldDescription: string, phase: GamePhase): Promise<Room> {
  await db().collection('rooms').doc(roomId).update({
    worldDescription,
    phase,
    updatedAt: Date.now(),
  });

  return (await getRoom(roomId))!;
}

/**
 * Delete a room and all subcollections
 * @param roomId - Room ID
 */
export async function deleteRoom(roomId: string): Promise<void> {
  const roomRef = db().collection('rooms').doc(roomId);

  // Delete all subcollections
  const collections = ['players', 'messages', 'creatures'];
  await Promise.all(
    collections.map(async (col) => {
      const snapshot = await roomRef.collection(col).get();
      const batch = db().batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    })
  );

  // Delete room document
  await roomRef.delete();
  logger.info(`Room deleted: ${roomId}`);
}

/**
 * Add player to room
 * @param roomId - Room ID
 * @param player - Player data
 */
export async function addPlayer(roomId: string, player: Player): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('players').doc(player.id).set(player);

  logger.info(`Player ${player.id} joined room ${roomId}`);
}

/**
 * Get all players in room
 * @param roomId - Room ID
 * @returns Array of players
 */
export async function getPlayers(roomId: string): Promise<Player[]> {
  const snapshot = await db().collection('rooms').doc(roomId).collection('players').get();

  return snapshot.docs.map((doc) => doc.data() as Player);
}

/**
 * Get single player in room
 * @param roomId - Room ID
 * @param playerId - Player ID
 * @returns Player or null
 */
export async function getPlayer(roomId: string, playerId: string): Promise<Player | null> {
  const doc = await db().collection('rooms').doc(roomId).collection('players').doc(playerId).get();
  return doc.exists ? (doc.data() as Player) : null;
}

/**
 * Update player action
 * @param roomId - Room ID
 * @param playerId - Player ID
 * @param action - Player action
 */
export async function updatePlayerAction(roomId: string, playerId: string, action: string): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('players').doc(playerId).update({ action });
}

/**
 * Set player ready state
 * @param roomId - Room ID
 * @param playerId - Player ID
 * @param isReady - Ready state
 */
export async function setPlayerReady(roomId: string, playerId: string, isReady: boolean): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('players').doc(playerId).update({ isReady });
  logger.info(`Player ${playerId} ready state: ${isReady}`);
}

/**
 * Update player character sheet
 * @param roomId - Room ID
 * @param playerId - Player ID
 * @param character - Updated character sheet
 * @returns Updated player
 */
export async function updatePlayerCharacter(
  roomId: string,
  playerId: string,
  character: CharacterSheet
): Promise<Player> {
  const playerRef = db().collection('rooms').doc(roomId).collection('players').doc(playerId);
  await playerRef.update({
    character,
    name: character.name,
    updatedAt: Date.now(),
  });

  const updated = await playerRef.get();
  if (!updated.exists) {
    throw new Error(`Player ${playerId} not found in room ${roomId} after update`);
  }

  return updated.data() as Player;
}

/**
 * Check if all players are ready
 * @param roomId - Room ID
 * @returns True if all players ready
 */
export async function areAllPlayersReady(roomId: string): Promise<boolean> {
  const players = await getPlayers(roomId);
  return players.length > 0 && players.every((p) => p.isReady);
}

/**
 * Remove player from room
 * @param roomId - Room ID
 * @param playerId - Player ID
 */
export async function removePlayer(roomId: string, playerId: string): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('players').doc(playerId).delete();

  logger.info(`Player ${playerId} left room ${roomId}`);
}

/**
 * Add message to room
 * @param roomId - Room ID
 * @param message - Message data
 */
export async function addMessage(roomId: string, message: Message): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('messages').doc(message.id).set(message);
}

/**
 * Get room messages
 * @param roomId - Room ID
 * @param limit - Max messages to return
 * @returns Array of messages
 */
export async function getMessages(roomId: string, limit = 100): Promise<Message[]> {
  const snapshot = await db()
    .collection('rooms')
    .doc(roomId)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as Message);
}

/**
 * Add creature to room
 * @param roomId - Room ID
 * @param creature - Creature data
 */
export async function addCreature(roomId: string, creature: Creature): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('creatures').doc(creature.name).set(creature);
}

/**
 * Get all creatures in room
 * @param roomId - Room ID
 * @returns Array of creatures
 */
export async function getCreatures(roomId: string): Promise<Creature[]> {
  const snapshot = await db().collection('rooms').doc(roomId).collection('creatures').get();

  return snapshot.docs.map((doc) => doc.data() as Creature);
}

/**
 * Update creature HP
 * @param roomId - Room ID
 * @param creatureName - Creature name
 * @param hp - New HP value
 */
export async function updateCreatureHp(roomId: string, creatureName: string, hp: number): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('creatures').doc(creatureName).update({ hp });
}
