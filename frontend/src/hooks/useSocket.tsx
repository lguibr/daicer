/**
 * Socket.io hook for real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { initSocket, disconnectSocket, isConnected, getSocket } from '../services/socket';
import type { Room, Player, Message, Creature } from '../types/shared';

/**
 * Socket state
 */
interface SocketState {
  connected: boolean;
  error: string | null;
  room: Room | null;
  players: Player[];
  messages: Message[];
  creatures: Creature[];
}

/**
 * Socket.io hook
 * @param roomId - Room ID to join
 * @returns Socket state and utilities
 */
export function useSocket(roomId?: string) {
  const [state, setState] = useState<SocketState>({
    connected: false,
    error: null,
    room: null,
    players: [],
    messages: [],
    creatures: [],
  });

  const updateState = useCallback((updates: Partial<SocketState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    const connect = async () => {
      try {
        await initSocket({
          onConnect: () => {
            updateState({ connected: true, error: null });
          },
          onDisconnect: () => {
            updateState({ connected: false });
          },
          onGameState: (data) => {
            updateState({
              room: data.room,
              players: data.players,
              messages: data.messages,
              creatures: data.creatures,
            });
          },
          onRoomUpdated: (data) => {
            // Handle room updates
            console.log('Room updated:', data);
          },
          onPlayerJoined: (data) => {
            console.log('Player joined:', data.userId);
          },
          onPlayerLeft: (data) => {
            console.log('Player left:', data.userId);
          },
          onTurnProcessing: () => {
            console.log('Turn processing...');
          },
          onTurnComplete: (data) => {
            updateState({
              messages: [...state.messages, ...data.messages],
            });
          },
          onError: (data) => {
            updateState({ error: data.message });
          },
        });
      } catch (error) {
        updateState({
          error: error instanceof Error ? error.message : 'Socket connection failed',
        });
      }
    };

    connect();

    return () => {
      disconnectSocket();
    };
  }, [updateState]);

  return {
    connected: state.connected,
    error: state.error,
    room: state.room,
    players: state.players,
    messages: state.messages,
    creatures: state.creatures,
    socket: getSocket(),
  };
}

