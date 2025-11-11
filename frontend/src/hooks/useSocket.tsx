import { useState, useEffect, useCallback } from 'react';
import { initSocket, disconnectSocket, getSocket, type ToolCall } from '../services/socket';
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
  toolCalls: ToolCall[];
}

/**
 * Socket.io hook
 * @param roomId - Room ID to join
 * @returns Socket state and utilities
 */
export default function useSocket(roomId?: string) {
  const [state, setState] = useState<SocketState>({
    connected: false,
    error: null,
    room: null,
    players: [],
    messages: [],
    creatures: [],
    toolCalls: [],
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
            // Rejoin room if we have a roomId
            if (roomId) {
              const socket = getSocket();
              if (socket) {
                socket.emit('room:join', { roomId });
              }
            }
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
          onRoomUpdated: () => {
            // Room updated - state will refresh via game:state event
          },
          onPlayerJoined: () => {
            // Player joined - handled by player:created event
          },
          onPlayerLeft: () => {
            // Player left - remove from local state
            // Note: backend should emit updated game state
          },
          onPlayerCreated: (player) => {
            // Add new player to state
            setState((prev) => {
              const exists = prev.players.some((p) => p.id === player.id);
              if (exists) {
                return prev;
              }
              return {
                ...prev,
                players: [...prev.players, player],
              };
            });
          },
          onPlayerReadyUpdated: (data) => {
            // Update player ready status
            setState((prev) => ({
              ...prev,
              players: prev.players.map((p) => (p.userId === data.userId ? { ...p, isReady: data.isReady } : p)),
            }));
          },
          onPhaseChanged: (data) => {
            // Update room phase
            setState((prev) => ({
              ...prev,
              room: prev.room ? { ...prev.room, phase: data.phase as Room['phase'] } : null,
            }));
          },
          onTurnProcessing: () => {
            // Turn processing
          },
          onTurnComplete: () => {
            // Turn complete - messages will arrive via message:new events
          },
          onToolCalls: (toolCalls) => {
            // Add new tool calls to state
            setState((prev) => ({
              ...prev,
              toolCalls: [...prev.toolCalls, ...toolCalls],
            }));
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
  }, [updateState, roomId]);

  return {
    connected: state.connected,
    error: state.error,
    room: state.room,
    players: state.players,
    messages: state.messages,
    creatures: state.creatures,
    toolCalls: state.toolCalls,
    socket: getSocket(),
  };
}
