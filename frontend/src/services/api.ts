/**
 * API client for backend HTTP endpoints
 */

import { auth } from './firebase';
import type { Room, WorldSettings, Player, Message } from '../types/shared';

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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
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
 * @returns Created room
 */
export async function createRoom(): Promise<Room> {
  return apiRequest<Room>('/api/rooms', {
    method: 'POST',
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
export async function addCharacter(roomId: string, character: Partial<Player['character']>): Promise<Player> {
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
