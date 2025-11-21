/**
 * API client for backend HTTP endpoints
 */

import { auth } from './firebase';
import type { Room, WorldSettings, Player, Message, RoomMembership, Structure, Road, HistoricalPeriod, WorldCondition, CharacterSheet } from '../types/shared';
import type { AvatarGenerationPayload, AvatarPreviewImage, AvatarPreviewResponse } from '../types/assets';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}

/**
 * Get auth token for requests
 * @returns ID token or null
 */
async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  return user.getIdToken();
}

/**
 * Make authenticated API request
 * @param endpoint - API endpoint
 * @param options - Fetch options
 * @returns Response data
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data.data!;
}

/**
 * Create new room
 * @param options - Optional room creation options
 * @returns Created room
 */
export async function createRoom(options?: { settings?: WorldSettings }): Promise<Room> {
  return apiRequest<Room>('/api/rooms', {
    method: 'POST',
    body: options ? JSON.stringify(options) : undefined,
  });
}

/**
 * Join room by code
 * @param code - Room code
 * @returns Room data
 */
export async function joinRoom(code: string): Promise<Room> {
  return apiRequest<Room>(`/api/rooms/${code}/join`, {
    method: 'POST',
  });
}

/**
 * Get room state
 * @param roomId - Room ID
 * @returns Room and players
 */
export async function getRoomState(roomId: string): Promise<{ room: Room; players: Player[] }> {
  return apiRequest<{ room: Room; players: Player[] }>(`/api/rooms/${roomId}`);
}

/**
 * List rooms the current user belongs to
 * @returns Room memberships
 */
export async function listRooms(): Promise<RoomMembership[]> {
  return apiRequest<RoomMembership[]>('/api/rooms');
}

/**
 * Update room settings
 * @param roomId - Room ID
 * @param settings - World settings
 * @returns Updated room
 */
export async function updateRoomSettings(roomId: string, settings: WorldSettings): Promise<Room> {
  return apiRequest<Room>(`/api/rooms/${roomId}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

/**
 * Leave a room membership
 * @param roomId - Room ID
 */
export async function leaveRoom(roomId: string): Promise<void> {
  await apiRequest<null>(`/api/rooms/${roomId}/membership`, {
    method: 'DELETE',
  });
}

/**
 * Generate world description
 * @param roomId - Room ID
 * @param language - Language code
 * @returns Updated room with world description
 */
export async function generateWorld(roomId: string, language: string): Promise<Room> {
  return apiRequest<Room>(`/api/game/${roomId}/world`, {
    method: 'POST',
    body: JSON.stringify({ language }),
  });
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
  return apiRequest<Player>(`/api/game/${roomId}/character`, {
    method: 'POST',
    body: JSON.stringify(character),
  });
}

/**
 * Start game (generate opening)
 * @param roomId - Room ID
 * @param language - Language code
 * @returns Opening message
 */
export async function startGame(roomId: string, language: string): Promise<Message> {
  return apiRequest<Message>(`/api/game/${roomId}/start`, {
    method: 'POST',
    body: JSON.stringify({ language }),
  });
}

export async function generateAvatarPortrait(
  payload: AvatarGenerationPayload,
  referenceImage?: string | null
): Promise<AvatarPreviewImage> {
  return apiRequest<AvatarPreviewImage>('/api/assets/avatar/preview/portrait', {
    method: 'POST',
    body: JSON.stringify({ ...payload, referenceImage }),
  });
}

export async function generateAvatarUpperBody(
  payload: AvatarGenerationPayload,
  portrait: AvatarPreviewImage,
  referenceImage?: string | null
): Promise<AvatarPreviewImage> {
  return apiRequest<AvatarPreviewImage>('/api/assets/avatar/preview/upper', {
    method: 'POST',
    body: JSON.stringify({ payload, portrait, referenceImage }),
  });
}

export async function generateAvatarFullBody(
  payload: AvatarGenerationPayload,
  portrait: AvatarPreviewImage,
  upperBody: AvatarPreviewImage,
  referenceImage?: string | null
): Promise<AvatarPreviewImage> {
  return apiRequest<AvatarPreviewImage>('/api/assets/avatar/preview/full', {
    method: 'POST',
    body: JSON.stringify({ payload, portrait, upperBody, referenceImage }),
  });
}

/**
 * Section Graph APIs (NEW - Phase 3)
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
  language?: 'en' | 'es' | 'pt-BR';
  settings: DMStorySettings;
}): Promise<{
  roomId: string;
  worldHistory: string;
  conditions: WorldCondition[];
  historyPeriods: HistoricalPeriod[];
}> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(`${API_URL}/api/graph/dm-story`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'DM Story generation failed');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Invoke World Config Graph (Section 2)
 * Generates physical world (structures, roads, terrain, chunks)
 * Requires Section 1 output (historyPeriods, conditions, worldHistory)
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
    generationParams?: any;
  };
}): Promise<{
  structures: Structure[];
  roads: Road[];
  generatedChunks: unknown[];
  gridState?: unknown;
  terrainMap?: unknown;
}> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(`${API_URL}/api/graph/world-config`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'World Config generation failed');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Invoke DM Story Graph (Section 1)
 * Generates world history, conditions, and narrative seed
 */

/**
 * Invoke World Config Graph (Section 2)
 */

/**
 * Invoke Character Setup Graph (Section 3)
 * Generates character opening narrative and applies equipment bonuses
 * Per-player invocation
 */
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
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(`${API_URL}/api/graph/character/${playerId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Character Setup generation failed');
  }

  const result = await response.json();
  return result.data;
}
