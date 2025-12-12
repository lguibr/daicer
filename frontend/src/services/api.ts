/**
 * API client for backend GraphQL endpoints
 */

import { apolloClient } from '../lib/apollo';
import type {
  Room,
  WorldSettings,
  Player,
  Message,
  RoomMembership,
  Structure,
  Road,
  HistoricalPeriod,
  WorldCondition,
  CharacterSheet,
} from '../types/shared';
import type { AvatarGenerationPayload, AvatarPreviewImage, AvatarPreviewResponse } from '../types/assets';
import {
  CREATE_ROOM_MUTATION,
  JOIN_ROOM_MUTATION,
  UPDATE_ROOM_SETTINGS_MUTATION,
  GENERATE_WORLD_MUTATION,
  ADD_CHARACTER_MUTATION,
  START_GAME_MUTATION,
  SUBMIT_ACTION_MUTATION,
  GENERATE_PORTRAIT_MUTATION,
} from '../graphql/mutations';
import { GET_ROOM_QUERY, LIST_ROOMS_QUERY } from '../graphql/queries';

/**
 * Join room by code
 * @param code - Room code
 * @returns Room data
 */
export async function joinRoom(code: string): Promise<Room> {
  const { data } = await apolloClient.mutate({
    mutation: JOIN_ROOM_MUTATION,
    variables: { code },
  });
  return (data as any).joinRoom;
}

/**
 * Get room state
 * @param roomId - Room ID
 * @returns Room and players
 */
export async function getRoomState(roomId: string): Promise<Room> {
  const { data } = await apolloClient.query({
    query: GET_ROOM_QUERY,
    variables: { filters: { roomId: { eq: roomId } } },
    fetchPolicy: 'network-only', // Ensure fresh data
  });
  return (data as any).rooms[0] || null;
}

/**
 * List rooms the current user belongs to
 * @returns Room memberships
 */
export async function listRooms(): Promise<RoomMembership[]> {
  const { data } = await apolloClient.query({
    query: LIST_ROOMS_QUERY,
    fetchPolicy: 'network-only',
  });
  // Map fields if necessary, currently assuming exact match or partial
  return (data as any).rooms;
}

/**
 * Update room settings
 * @param roomId - Room ID
 * @param settings - World settings
 * @returns Updated room
 */
export async function updateRoomSettings(roomId: string, settings: WorldSettings): Promise<Room> {
  // Use documentId if possible, but we might only have roomId.
  // We first need to find the documentId for the room to update it via standard mutation
  // OR we use a custom mutation if we made one.
  // Standard `updateRoom` requires `documentId`.

  // Fetch room first to get documentId
  const room = await getRoomState(roomId);
  if (!room || !room.documentId) throw new Error('Room not found');

  const { data } = await apolloClient.mutate({
    mutation: UPDATE_ROOM_SETTINGS_MUTATION,
    variables: {
      documentId: room.documentId,
      data: { settings },
    },
  });
  return (data as any).updateRoom;
}

/**
 * Leave a room membership
 * @param roomId - Room ID
 */
export async function leaveRoom(roomId: string): Promise<void> {
  // Not implemented in GraphQL backend plan yet.
  // Leaving as no-op or TODO since 'leaveRoom' was deleting membership.
  // Membership in Strapi might be a relation removal.
  // For now, removing this functionality or marking TODO as it wasn't in my immediate backend plan.
  console.warn('leaveRoom not fully implemented in GraphQL migration yet');
}

/**
 * Create new room
 */
export async function createRoom(options?: { settings?: WorldSettings; structures?: unknown[] }): Promise<Room> {
  const { data } = await apolloClient.mutate({
    mutation: CREATE_ROOM_MUTATION,
    variables: { data: options || {} },
  });
  return (data as any).createRoom;
}

export async function generateWorld(roomId: string, language: string): Promise<Room> {
  const { data } = await apolloClient.mutate({
    mutation: GENERATE_WORLD_MUTATION,
    variables: { roomId, language },
  });

  // generateWorld returns updated Room
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any).generateWorld as Room;
}

/**
 * Add character to room
 * @param roomId - Room ID
 * @param character - Character data
 * @returns Created player
 */
export type CreateCharacterPayload = Partial<Player['character']> & {
  avatarPreview?: AvatarPreviewResponse;
};

export async function addCharacter(roomId: string, character: CreateCharacterPayload): Promise<Player> {
  const { data } = await apolloClient.mutate({
    mutation: ADD_CHARACTER_MUTATION,
    variables: { roomId, character },
  });
  return (data as any).addCharacter;
}

/**
 * Start game (generate opening)
 * @param roomId - Room ID
 * @param language - Language code
 * @returns Opening message
 */
export async function startGame(roomId: string, language: string, streamId?: string): Promise<Message> {
  const { data } = await apolloClient.mutate({
    mutation: START_GAME_MUTATION,
    variables: { roomId, language, streamId },
  });
  return (data as any).startGame;
}

export async function generateAvatarPortrait(
  payload: AvatarGenerationPayload,
  referenceImage?: string | null
): Promise<AvatarPreviewImage> {
  const { data } = await apolloClient.mutate({
    mutation: GENERATE_PORTRAIT_MUTATION,
    variables: { payload, referenceImage },
  });
  return (data as any).generateAvatarPortrait;
}

// TODO: Implement other avatar parts (Upper/Full) with GraphQL if needed, or keeping them stubbed
// as they follow same pattern.

export async function generateAvatarUpperBody(
  payload: AvatarGenerationPayload,
  portrait: AvatarPreviewImage,
  referenceImage?: string | null
): Promise<AvatarPreviewImage> {
  // Stub or implement similar to portrait
  throw new Error('Not implemented in GraphQL yet');
}

export async function generateAvatarFullBody(
  payload: AvatarGenerationPayload,
  portrait: AvatarPreviewImage,
  upperBody: AvatarPreviewImage,
  referenceImage?: string | null
): Promise<AvatarPreviewImage> {
  // Stub or implement similar to portrait
  throw new Error('Not implemented in GraphQL yet');
}

/**
 * Section Graph APIs
 */

interface DMStorySettings {
  theme: string;
  tone: string;
  setting: string;
  historyDepth: number;
  [key: string]: unknown;
}

export async function invokeDMStoryGraph(input: {
  roomId: string;
  streamId?: string;
  language?: 'en' | 'es' | 'pt-BR';
  settings: DMStorySettings;
}): Promise<{
  roomId: string;
  worldHistory: string;
  conditions: WorldCondition[];
  historyPeriods: HistoricalPeriod[];
}> {
  // TODO: Migrate to GraphQL
  throw new Error('Not implemented in GraphQL yet');
}

/**
 * Invoke World Config Graph (Section 2)
 */
interface WorldConfigSettings {
  structureDensity: number;
  enableRoads: boolean;
  [key: string]: unknown;
}

export async function invokeWorldConfigGraph(input: {
  roomId: string;
  settings: WorldConfigSettings & {
    seed?: string;
    generationParams?: unknown;
  };
}): Promise<{
  structures: Structure[];
  roads: Road[];
  generatedChunks: unknown[];
  gridState?: unknown;
  terrainMap?: unknown;
}> {
  // TODO: Migrate to GraphQL
  throw new Error('Not implemented in GraphQL yet');
}

export async function invokeCharacterSetupGraph(
  playerId: string,
  input: {
    roomId: string;
    character: CharacterSheet;
    worldHistory: string;
    worldDescription: string;
    spawnPoint?: { x: number; y: number; z: number };
  }
): Promise<{
  playerId: string;
  openingNarrative: string;
  character: CharacterSheet;
}> {
  // TODO: Migrate to GraphQL
  throw new Error('Not implemented in GraphQL yet');
}

/**
 * Submit player action
 * @param roomId - Room ID
 * @param action - Action text
 * @returns Success status
 */
export async function submitAction(roomId: string, action: string): Promise<{ success: boolean; allReady: boolean }> {
  const { data } = await apolloClient.mutate({
    mutation: SUBMIT_ACTION_MUTATION,
    variables: { roomId, action },
  });
  return (data as any).submitAction;
}
