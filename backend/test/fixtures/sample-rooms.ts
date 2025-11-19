/**
 * Sample room fixtures for testing
 */

export const sampleRooms = [
  {
    id: 'room-fantasy-1',
    roomCode: 'FAN001',
    name: 'Epic Fantasy Adventure',
    phase: 'lobby',
    dmStyle: 'balanced',
    aiModel: 'gemini-2.0-flash-exp',
    adventureType: 'mixed',
    worldTheme: 'high-fantasy',
    playerIds: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'room-scifi-1',
    roomCode: 'SCI001',
    name: 'Space Opera Campaign',
    phase: 'character_creation',
    dmStyle: 'narrative',
    aiModel: 'gemini-2.0-flash-exp',
    adventureType: 'exploration',
    worldTheme: 'sci-fi',
    playerIds: ['player-1', 'player-2'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T01:00:00.000Z',
  },
  {
    id: 'room-horror-1',
    roomCode: 'HOR001',
    name: 'Gothic Horror',
    phase: 'gameplay',
    dmStyle: 'challenging',
    aiModel: 'gemini-2.0-flash-exp',
    adventureType: 'combat',
    worldTheme: 'dark-fantasy',
    playerIds: ['player-1', 'player-2', 'player-3'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T02:00:00.000Z',
  },
];
