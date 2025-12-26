import { useState, useEffect, useCallback, useRef } from 'react';
import { initSocket, disconnectSocket, getSocket, type ToolCall } from '../services/socket';
import type { Room, Player, Message, Creature } from '@daicer/engine';

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
  isProcessing: boolean;
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
    isProcessing: false,
  });

  const updateState = useCallback((updates: Partial<SocketState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Debounce room join to prevent duplicate logs on reconnect
  const lastJoinTimestampRef = useRef<number>(0);
  const REJOIN_DEBOUNCE_MS = 5000; // 5 second debounce

  useEffect(() => {
    const connect = async () => {
      try {
        await initSocket({
          onConnect: () => {
            updateState({ connected: true, error: null });
            // Rejoin room if we have a roomId (with debounce)
            if (roomId) {
              const socket = getSocket();
              const now = Date.now();
              const timeSinceLastJoin = now - lastJoinTimestampRef.current;

              // Only rejoin if enough time has passed (prevents duplicate logs)
              if (socket && timeSinceLastJoin > REJOIN_DEBOUNCE_MS) {
                socket.emit('room:join', { roomId });
                lastJoinTimestampRef.current = now;
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              messages: (data.messages || []).map((msg: any) => ({
                ...msg,
                content: msg.content || msg.text || '',
                text: msg.text || msg.content || '',
              })) as Message[],
              creatures: data.creatures,
              isProcessing: false,
            });
          },
          onRoomUpdated: (data) => {
            if (!data) {
              return;
            }

            if (data.type === 'player_action') {
              setState((prev) => {
                const targetPlayer = prev.players.find((p) => p.userId === data.userId);
                const updatedPlayers = prev.players.map((player) =>
                  player.userId === data.userId
                    ? { ...player, action: data.action === undefined ? player.action : data.action }
                    : player
                );

                if (!data.action || !targetPlayer) {
                  return { ...prev, players: updatedPlayers };
                }

                const senderName = targetPlayer.character?.name || targetPlayer.name || 'Player';

                return {
                  ...prev,
                  players: updatedPlayers,
                  messages: [
                    ...prev.messages,
                    {
                      id: `player-action-${data.userId}-${Date.now()}`,
                      sender: senderName,
                      text: data.action,
                      content: data.action,
                      timestamp: Date.now(),
                    },
                  ],
                };
              });
            }
          },
          onPlayerJoined: () => {
            // Player joined - handled by player:created event
          },
          onPlayerLeft: () => {
            // Player left - remove from local state
            // Note: backend should emit updated game state
          },
          onPlayerCreated: (data) => {
            // Add or update player in state
            setState((prev) => {
              const exists = prev.players.some((p) => p.id === data.player.id);
              if (exists) {
                // Update existing player with new character data
                return {
                  ...prev,
                  players: prev.players.map((p) => (p.id === data.player.id ? data.player : p)),
                };
              }
              // Add new player
              return {
                ...prev,
                players: [...prev.players, data.player],
              };
            });
          },
          onPlayerReadyUpdated: (data) => {
            // Update player ready status
            console.log('🔔 Received player:ready_updated:', data);
            setState((prev) => ({
              ...prev,
              players: prev.players.map((p) => (p.id === data.userId ? { ...p, isReady: data.isReady } : p)),
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
            setState((prev) => ({
              ...prev,
              isProcessing: true,
            }));
          },
          onTurnComplete: () => {
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              players: prev.players.map((player) => ({
                ...player,
                action: null,
              })),
            }));
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
          onMessageNew: (message) => {
            setState((prev) => {
              const exists = prev.messages.some((msg) => msg.id === message.id);
              if (exists) {
                return prev;
              }

              return {
                ...prev,
                messages: [...prev.messages, message],
              };
            });
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
    isProcessing: state.isProcessing,
  };
}
