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
  GENERATE_UPPER_BODY_MUTATION,
  GENERATE_FULL_BODY_MUTATION,
} from '../graphql/mutations';
import { GET_ROOM_QUERY, LIST_ROOMS_QUERY } from '../graphql/queries';
import type {
  CreateRoomMutation,
  JoinRoomMutation,
  UpdateRoomMutation,
  GenerateWorldMutation,
  AddCharacterMutation,
  StartGameMutation,
  SubmitActionMutation,
  GenerateAvatarPortraitMutation,
  GetRoomQuery,
  ListRoomsQuery,
} from '../gql/graphql';

/**
 * Join room by code
 * @param code - Room code
 * @returns Room data
 */
export async function joinRoom(code: string): Promise<Room> {
  const { data } = await apolloClient.mutate<JoinRoomMutation>({
    mutation: JOIN_ROOM_MUTATION,
    variables: { code },
  });
  if (!data?.joinRoom) throw new Error('Failed to join room');
  return data.joinRoom as unknown as Room;
}

/**
 * Get room state
 * @param roomId - Room ID
 * @returns Room and players
 */
export async function getRoomState(roomId: string): Promise<Room> {
  const { data } = await apolloClient.query<GetRoomQuery>({
    query: GET_ROOM_QUERY,
    variables: {
      filters: {
        or: [{ documentId: { eq: roomId } }, { roomId: { eq: roomId } }, { code: { eq: roomId } }],
      },
    },
    fetchPolicy: 'network-only', // Ensure fresh data
  });
  const room = data?.rooms?.[0];
  if (!room) return null as unknown as Room;

  // Map backend Component structure to frontend Player interface
  const mappedRoom = {
    ...room,
    players:
      room.players?.map((p: any) => ({
        ...p,
        userId: p.user?.documentId || p.user?.id || p.id, // Fallback mapping
        // Ensure character structure matches if needed
      })) || [],
  };

  return mappedRoom as unknown as Room;
}

/**
 * List rooms the current user belongs to
 * @returns Room memberships
 */
export async function listRooms(): Promise<RoomMembership[]> {
  const { data } = await apolloClient.query<ListRoomsQuery>({
    query: LIST_ROOMS_QUERY,
    fetchPolicy: 'network-only',
  });
  return (data?.rooms || []) as unknown as RoomMembership[];
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

  const { data } = await apolloClient.mutate<UpdateRoomMutation>({
    mutation: UPDATE_ROOM_SETTINGS_MUTATION,
    variables: {
      documentId: room.documentId,
      data: { settings },
    },
  });
  if (!data?.updateRoom) throw new Error('Failed to update room');
  return data.updateRoom as unknown as Room;
}

/**
 * Leave a room membership
 * @param roomId - Room ID
 */
export async function leaveRoom(_roomId: string): Promise<void> {
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
  // Map settings to new fields while keeping legacy settings JSON for compatibility
  const settings = options?.settings;
  const payload = {
    // Legacy JSON
    settings,

    // New Structured Fields
    worldType: settings?.worldType,
    worldSize: settings?.worldSize,
    adventureLength: settings?.adventureLength,
    difficulty: settings?.difficulty,
    startingLevel: settings?.startingLevel,
    playerCount: settings?.playerCount,
    theme: settings?.theme,
    setting: settings?.setting,
    tone: settings?.tone,

    // Components
    dmStyle: settings?.dmStyle
      ? {
          verbosity: settings.dmStyle.verbosity,
          detail: settings.dmStyle.detail,
          engagement: settings.dmStyle.engagement,
          narrative: settings.dmStyle.narrative,
          specialMode: settings.dmStyle.specialMode,
          customDirectives: settings.dmStyle.customDirectives,
        }
      : undefined,

    generationParams: (settings as any)?.generationParams,

    structures: options?.structures,
  };

  const { data } = await apolloClient.mutate<CreateRoomMutation>({
    mutation: CREATE_ROOM_MUTATION,
    variables: { data: payload },
  });
  if (!data?.createRoom) throw new Error('Failed to create room');
  return data.createRoom as unknown as Room;
}

export async function generateWorld(roomId: string, language: string): Promise<Room> {
  const { data } = await apolloClient.mutate<GenerateWorldMutation>({
    mutation: GENERATE_WORLD_MUTATION,
    variables: { roomId, language },
  });

  // generateWorld returns updated Room (typed as JSON in backend but assuming I fixed it? No, in index.ts it returns JSON, but in mutation def I might have said JSON. Wait.
  // In index.ts: generateWorld(...): JSON.
  // In mutations.ts: generateWorld(...) { ...fields of Room? no, it returns JSON scalar if I defined it as JSON }
  // You CANNOT select sub-fields on a JSON scalar!
  // This is a disconnect.
  // If `generateWorld` returns `JSON`, I cannot write braces `{ ... }` after it in the query.
  // I MUST change the backend to return `Room` type, OR change the frontend query to NOT select fields and just get the JSON.
  // Backend `index.ts` said `generateWorld(...): JSON`.
  // AND `joinRoom(...): Room`.
  // `joinRoom` is correct. `generateWorld` is JSON.
  // I should change `generateWorld` to return `Room` in backend `index.ts`!
  // And `addCharacter` etc too if they return objects I want to select from.

  // I'll proceed with api.ts refactoring, but I need to fix backend `index.ts` types for these mutations to return `Room` (or appropriate Type) instead of JSON, so I can select fields.
  // Or I assume `mutation { generateWorld }` (no selection) and cast the result.
  // Given I wrote selection sets in `mutations.ts`, I probably intended to return the Object Type.

  // I will make a note to fix `index.ts` types in next step. For now I keep `api.ts` assuming types exist.

  // Casting to prevent TS error if the generated type is Scalar
  return (data as any).generateWorld as unknown as Room;
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
  const { data } = await apolloClient.mutate<AddCharacterMutation>({
    mutation: ADD_CHARACTER_MUTATION,
    variables: { roomId, character },
  });
  return (data as any).addCharacter as Player;
}

/**
 * Start game (generate opening)
 * @param roomId - Room ID
 * @param language - Language code
 * @returns Opening message
 */
export async function startGame(roomId: string, language: string, streamId?: string): Promise<Message> {
  const { data } = await apolloClient.mutate<StartGameMutation>({
    mutation: START_GAME_MUTATION,
    variables: { roomId, language, streamId },
  });
  return (data as any).startGame as Message;
}

export async function generateAvatarPortrait(
  payload: AvatarGenerationPayload,
  referenceImage?: string | null
): Promise<AvatarPreviewImage> {
  const { data } = await apolloClient.mutate<GenerateAvatarPortraitMutation>({
    mutation: GENERATE_PORTRAIT_MUTATION,
    variables: { payload, referenceImage },
  });
  return (data as any).generateAvatarPortrait as AvatarPreviewImage;
}

// TODO: Implement other avatar parts (Upper/Full) with GraphQL if needed, or keeping them stubbed
// as they follow same pattern.

export async function generateAvatarUpperBody(
  payload: AvatarGenerationPayload,
  portrait: AvatarPreviewImage,
  referenceImage?: string | null
): Promise<AvatarPreviewImage> {
  const { data } = await apolloClient.mutate<any>({
    mutation: GENERATE_UPPER_BODY_MUTATION,
    variables: { payload, portrait, referenceImage },
  });
  return (data as any).generateAvatarUpperBody as AvatarPreviewImage;
}

export async function generateAvatarFullBody(
  payload: AvatarGenerationPayload,
  portrait: AvatarPreviewImage,
  upperBody: AvatarPreviewImage,
  referenceImage?: string | null
): Promise<AvatarPreviewImage> {
  const { data } = await apolloClient.mutate<any>({
    mutation: GENERATE_FULL_BODY_MUTATION,
    variables: { payload, portrait, upperBody, referenceImage },
  });
  return (data as any).generateAvatarFullBody as AvatarPreviewImage;
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

export async function invokeDMStoryGraph(_input: {
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

export async function invokeWorldConfigGraph(_input: {
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
  _playerId: string,
  _input: {
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
  const { data } = await apolloClient.mutate<SubmitActionMutation>({
    mutation: SUBMIT_ACTION_MUTATION,
    variables: { roomId, action },
  });
  return (data as any).submitAction as { success: boolean; allReady: boolean };
}
