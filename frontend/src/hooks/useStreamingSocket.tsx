import { useState, useEffect, useCallback } from 'react';
import { initSocket, disconnectSocket, getSocket, type ToolCall, type PresenceData } from '../services/socket';
import type { Room, Player, Message, Creature } from '../types/models';
import { GamePhase } from '../types/models';

/**
 * Socket state with streaming support
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
  streamingMessages: Map<string, string>; // messageId -> accumulated content
  presence: PresenceData[];
  sseHealthWarning: boolean; // True if SSE stream is stale
  lastSSEEvent: number; // Timestamp of last SSE event
}

/**
 * Enhanced Socket.io hook with streaming and presence support
 * @param roomId - Room ID to join
 * @returns Socket state and utilities
 */
export default function useStreamingSocket(roomId?: string, initialMessages?: Message[]) {
  const [state, setState] = useState<SocketState>({
    connected: false,
    error: null,
    room: null,
    players: [],
    messages: initialMessages || [],
    creatures: [],
    toolCalls: [],
    isProcessing: false,
    streamingMessages: new Map(),
    presence: [],
    sseHealthWarning: false,
    lastSSEEvent: Date.now(),
  });

  const updateState = useCallback((updates: Partial<SocketState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // ... (keep stream callbacks) ...

  const updateStreamingMessage = useCallback((messageId: string, content: string) => {
    setState((prev) => {
      const newMap = new Map(prev.streamingMessages);
      newMap.set(messageId, content);
      return { ...prev, streamingMessages: newMap };
    });
  }, []);

  const clearStreamingMessage = useCallback((messageId: string) => {
    setState((prev) => {
      const newMap = new Map(prev.streamingMessages);
      newMap.delete(messageId);
      return { ...prev, streamingMessages: newMap };
    });
  }, []);

  // Check SSE health every 5 seconds
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      setState((prev) => {
        const timeSinceLastEvent = Date.now() - prev.lastSSEEvent;
        const isStale = timeSinceLastEvent > 15000; // 15s threshold

        // Only show warning if processing and stale
        if (prev.isProcessing && isStale && !prev.sseHealthWarning) {
          console.warn('[SSE Health] No events for 15s during processing');
          return { ...prev, sseHealthWarning: true };
        }

        // Clear warning if events resume
        if (!isStale && prev.sseHealthWarning) {
          return { ...prev, sseHealthWarning: false };
        }

        return prev;
      });
    }, 5000);

    return () => clearInterval(healthCheckInterval);
  }, []);

  // Update lastSSEEvent timestamp on any event
  const recordSSEEvent = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastSSEEvent: Date.now(),
      sseHealthWarning: false,
    }));
  }, []);

  useEffect(() => {
    const connect = async () => {
      const socket = getSocket();
      // Force room join if already connected (e.g. reused socket from Lobby)
      if (socket?.connected && roomId) {
        console.log('[useStreamingSocket] Socket already connected, joining room:', roomId);
        socket.emit('room:join', { roomId });
        // Also ensure state is synced
        updateState({ connected: true, error: null });
      }

      try {
        await initSocket({
          onConnect: () => {
            updateState({ connected: true, error: null });
            recordSSEEvent();
            // Rejoin room if we have a roomId
            if (roomId) {
              const s = getSocket();
              if (s) {
                s.emit('room:join', { roomId });
              }
            }
          },
          onDisconnect: () => {
            updateState({ connected: false });
          },
          onGameState: (data) => {
            recordSSEEvent();
            // Map incoming messages to ensure content/text compat
            const mappedMessages: Message[] = ((data.messages as unknown[]) || []).map((m) => {
              const msg = m as Record<string, unknown>;
              return {
                id: (msg.id as string) || `msg-${Date.now()}-${Math.random()}`,
                timestamp: (msg.timestamp as number) || Date.now(),
                content: (msg.content as string) || (msg.text as string) || '',
                sender: (msg.sender as string) || (msg.senderName as string) || 'Unknown',
                text: (msg.content as string) || (msg.text as string) || '',
              };
            });

            updateState({
              room: data.room,
              players: data.players,
              messages: mappedMessages,
              creatures: data.creatures,
              isProcessing: false,
            });
          },
          onRoomUpdated: (data) => {
            recordSSEEvent();
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
            // Add new player to state
            setState((prev) => {
              const exists = prev.players.some((p) => p.id === data.player.id);
              if (exists) {
                return prev;
              }
              return {
                ...prev,
                players: [...prev.players, data.player],
              };
            });
          },
          onPlayerReadyUpdated: (data) => {
            // Update player ready status
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
                messages: [...prev.messages, { ...message, text: message.text || (message as any).content || '' }],
              };
            });
          },
          onGameStart: (data) => {
            console.log('[Socket] Game started:', data);

            // Create the initial message object
            const initialMessage: Message = {
              id: `game-start-${Date.now()}`,
              sender: 'DM',
              text: data.text,
              timestamp: data.timestamp,
            };

            setState((prev) => ({
              ...prev,
              room: prev.room ? { ...prev.room, phase: GamePhase.GAMEPLAY } : null,
              messages: [...prev.messages, initialMessage],
              isProcessing: false,
            }));
          },
          // Streaming event handlers
          onStreamStart: (data) => {
            console.log('[Streaming] Stream started:', data);
            recordSSEEvent();
            updateStreamingMessage(data.messageId, '');
          },
          onStreamChunk: (data) => {
            recordSSEEvent();
            updateStreamingMessage(data.messageId, data.accumulated);
          },
          onStreamEnd: (data) => {
            console.log('[Streaming] Stream ended:', data);
            recordSSEEvent();
            // Add complete message to messages array
            setState((prev) => {
              // Check if message already exists
              const exists = prev.messages.some((msg) => msg.id === data.messageId);
              if (exists) {
                // Update existing message with full text
                return {
                  ...prev,
                  messages: prev.messages.map((msg) =>
                    msg.id === data.messageId ? { ...msg, text: data.fullText } : msg
                  ),
                };
              }

              // Add new message
              return {
                ...prev,
                messages: [
                  ...prev.messages,
                  {
                    id: data.messageId,
                    sender: 'DM',
                    text: data.fullText,
                    timestamp: data.timestamp,
                  },
                ],
              };
            });

            // Clear streaming state
            clearStreamingMessage(data.messageId);
          },
          onStreamError: (data) => {
            console.error('[Streaming] Stream error:', data);
            updateState({ error: `Streaming failed: ${data.error}` });
            if (data.messageId) {
              clearStreamingMessage(data.messageId);
            }
          },
          onStreamAborted: (data) => {
            console.log('[Streaming] Stream aborted:', data);
            clearStreamingMessage(data.messageId);
          },
          // Presence event handlers
          onPresenceUpdate: (data) => {
            if (data.roomId === roomId) {
              updateState({ presence: data.presence });
            }
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
  }, [updateState, roomId, updateStreamingMessage, clearStreamingMessage, recordSSEEvent]);

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
    streamingMessages: state.streamingMessages,
    presence: state.presence,
    sseHealthWarning: state.sseHealthWarning,
  };
}
