/**
 * Game room page - handles all phases: world gen, terrain, character creation, and gameplay
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getRoomState, startGame } from '../services/api';
import { joinRoom as joinSocketRoom, setReady } from '../services/socket';
import useSocket from '../hooks/useSocket';
import CharacterCreation from '../components/room/CharacterCreation';
import { LobbyScreen } from '../components/room/LobbyScreen';
import GameplayScreen from '../components/game/GameplayScreen';
import { CombatScreen } from '../components/game/CombatScreen';
import { DynamicLayout } from '../components/layout';
import { ToolNotificationContainer } from '../components/ui/ToolNotificationToast';
import { DiceLoader } from '../components/ui/dice-loader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import ToolCallCard from '../components/chat/ToolCallCard';

// import { auth } from '../services/firebase';
import useAuth from '../hooks/useAuth';
import { useLLMStream } from '../hooks/useLLMStream';
import type { ToolCall } from '../services/socket';
import { Room as SharedRoom, Player, GamePhase } from '@daicer/engine';

import { useI18n } from '../i18n';

/**
 * Game room page component
 * @returns Game room UI based on phase
 */
export default function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [room, setRoom] = useState<SharedRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentToolCalls, setRecentToolCalls] = useState<typeof socket.toolCalls>([]);

  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [hasAutoRedirected, setHasAutoRedirected] = useState(false);

  const socket = useSocket(roomId);

  // Listen to all streams in the room
  const streams = useLLMStream(undefined, socket.socket);
  // Find any active stream to display
  const activeStream = Object.values(streams).find((s) => s.status === 'active');

  // Auto-redirect to character creation if user has no character
  useEffect(() => {
    if (!loading && players.length > 0 && user?.uid) {
      // Only redirect if we are in the correct phase
      if (room?.phase === 'CHARACTER_CREATION' || room?.phase === 'SETUP') {
        const me = players.find((p) => p.userId === user.uid);
        if (me) {
          if (!me.character && !hasAutoRedirected) {
            setIsCreatingCharacter(true);
            setHasAutoRedirected(true);
          } else if (me.character && isCreatingCharacter) {
            // If we have a character but are in creation mode, exit creation mode
            // This handles the case where creation finishes
            setIsCreatingCharacter(false);
          }
        }
      }
    }
  }, [loading, players, user?.uid, hasAutoRedirected, room?.phase, isCreatingCharacter]);

  const [streamEvents, setStreamEvents] = useState<
    Array<{
      type: string;
      tool?: string;
      args?: Record<string, unknown>;
      output?: unknown;
      name?: string;
      node?: string;
      phase?: string;
      progress?: number;
      periodNumber?: number;
      totalPeriods?: number;
      narrative?: string;
      structuresAdded?: number;
      roadCount?: number;
      chunkCount?: number;
      content?: string;
      accumulated?: string;
      isStreaming?: boolean;
    }>
  >([]);

  // Handle new tool calls - show as toasts for most recent 3
  useEffect(() => {
    if (socket.toolCalls.length > recentToolCalls.length) {
      setRecentToolCalls(socket.toolCalls.slice(-3)); // Keep only last 3 for toasts
    }
  }, [socket.toolCalls, recentToolCalls.length]);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    const loadRoom = async () => {
      console.log('[GameRoom] Loading room:', roomId);
      try {
        const roomData = (await getRoomState(roomId)) as SharedRoom & { players: Player[] };
        console.log('[GameRoom] Loaded room data:', {
          id: roomData.id,
          phase: roomData.phase,
          players: roomData.players?.length,
        });
        setRoom(roomData);
        setPlayers(roomData.players || []);

        // Give socket time to initialize before joining
        setTimeout(() => {
          console.log('[GameRoom] Joining socket room...');
          // user (from useAuth) might be null initially, but we are in loadRoom.
          // loadRoom is called on mount. user might load async.
          // But useAuth runs on mount too.
          // We can try to use the user from closure if available, or get it from auth state.
          // Actually, 'user' is from useAuth, which is stateful.
          // Inside this closure 'user' might be stale? No, it's a dependency of useEffect?
          // useEffect dependency is `[roomId, navigate]`. `user` is missing!
          // If we add `user` to dependency, it re-runs when user loads.
          // Which is good!

          // But let's look at the joinSocketRoom call.
          // We need to pass user?.uid.
          // Since this is inside useEffect[roomId], 'user' is captured from render scope.
          // But if user loads LATER, this effect won't re-run.
          // So we might join as undefined, then never update?

          // Better: Separate useEffect for joining room when user/roomId changes?
          // Or just fix the call here and rely on user being loaded (since it's fast usually).
          // But useAuth has loading state.

          // Let's pass user?.uid if available.
          // But strict dependency rule suggests separating logic.

          // For now, I'll access the current value if possible, or trigger a re-join if user changes?
          // Existing code:
          joinSocketRoom(roomId, user?.uid);
        }, 100);
      } catch (err) {
        console.error('[GameRoom] Load failed:', err);
        setError(err instanceof Error ? err.message : t('gameRoom.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomId, navigate, user?.uid, t]);

  // Update state from socket
  useEffect(() => {
    if (socket.room) {
      console.log('[GameRoom] Socket room update:', socket.room.phase);
      setRoom(socket.room);

      // If room has generation events, restore them to streamEvents
      if (socket.room.generationEvents && streamEvents.length === 0 && socket.room.phase === 'SETUP') {
        setStreamEvents(socket.room.generationEvents);
      }
    }
    if (socket.players.length > 0) {
      setPlayers(socket.players);
    }
  }, [socket.room, socket.players, streamEvents.length]);

  // Monitor world generation if room is in SETUP phase
  // const isWorldGenerating = room && room.phase === 'SETUP' && !room.worldDescription;
  const isWorldGenerating = false; // SKIP INTRO: Always skip the streaming view
  const roomPhase = room?.phase;
  const hasWorldDescription = room?.worldDescription;

  useEffect(() => {
    // Only run if room is in SETUP phase and has no worldDescription
    if (!roomId || roomPhase !== 'SETUP' || hasWorldDescription) {
      return;
    }

    console.log('[GameRoom] Starting world generation SSE listeners');

    // Clear previous events once on mount
    setStreamEvents([]);

    let eventSource: EventSource | null = null;
    let currentSection = 1;
    let isCleanedUp = false;

    const connectToSSE = async () => {
      if (isCleanedUp) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';
      const token = localStorage.getItem('strapi_jwt');
      if (!token) return;

      // Start with Section 1 (dm-story)
      const endpoint = `${API_URL}/api/graph/dm-story/stream?roomId=${roomId}&token=${encodeURIComponent(token)}`;

      eventSource = new EventSource(endpoint, { withCredentials: true });

      // Listen for all event types and add to streamEvents
      const eventTypes = [
        'connected',
        'node_start',
        'node_complete',
        'period_start',
        'period_complete',
        'period_text_start',
        'period_text_complete',
        'world_lore_chunk',
        'node_error',
      ];

      eventTypes.forEach((type) => {
        eventSource?.addEventListener(type, (event) => {
          if (isCleanedUp) return;
          try {
            const data = JSON.parse(event.data);
            setStreamEvents((prev) => [...prev, { ...data, type }]);
          } catch (err) {
            console.warn('[SSE] Failed to parse event:', err);
          }
        });
      });

      // When Section 1 completes, switch to Section 2
      eventSource.addEventListener('node_complete', (event) => {
        if (isCleanedUp) return;
        try {
          const data = JSON.parse(event.data);
          if (data.node === 'synthesize_history' && currentSection === 1) {
            // Section 1 done, upgrade to Section 2
            currentSection = 2;

            // Close Section 1 stream
            eventSource?.close();

            // Connect to Section 2 stream
            setTimeout(async () => {
              if (isCleanedUp) return;
              const token2 = localStorage.getItem('strapi_jwt');
              const endpoint2 = `${API_URL}/api/graph/world-config/stream?roomId=${roomId}&token=${encodeURIComponent(token2 || '')}`;
              eventSource = new EventSource(endpoint2, { withCredentials: true });

              // Re-register listeners for Section 2
              eventTypes.forEach((type) => {
                eventSource?.addEventListener(type, (innerEvent) => {
                  if (isCleanedUp) return;
                  try {
                    const innerData = JSON.parse(innerEvent.data);
                    setStreamEvents((prev) => [...prev, { ...innerData, type }]);
                  } catch (err) {
                    console.warn('[SSE] Failed to parse event:', err);
                  }
                });
              });
            }, 500);
          }
        } catch (err) {
          console.warn('[SSE] Error handling node_complete:', err);
        }
      });
    };

    connectToSSE();

    return () => {
      isCleanedUp = true;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [roomId, roomPhase, hasWorldDescription]);

  // Show loading state only when initially loading or if there's an error
  if (loading || !room) {
    return (
      <DynamicLayout showNavbar={false} showLanguageSelector>
        <div className="flex min-h-screen items-center justify-center">
          {error ? (
            <Card className="max-w-md border-red-500/30 bg-midnight-800/95 p-8 text-center">
              <h2 className="mb-4 text-xl font-semibold text-red-400">{t('gameRoom.errors.title')}</h2>
              <p className="text-shadow-300">{error || t('gameRoom.errors.notFound')}</p>
              <Button onClick={() => navigate('/')} className="mt-6">
                {t('gameRoom.actions.returnToLobby')}
              </Button>
            </Card>
          ) : (
            <DiceLoader size="large" />
          )}
        </div>
      </DynamicLayout>
    );
  }

  // Phase-based rendering
  // PHASE 1: SETUP - World generation with streaming log
  if (isWorldGenerating) {
    return (
      <DynamicLayout showNavbar={false} showLanguageSelector>
        <div className="min-h-screen flex items-center justify-center p-6 bg-midnight-950">
          <div className="w-full max-w-4xl space-y-6">
            <div className="text-center space-y-4">
              <h1 className="font-display text-3xl uppercase tracking-[0.35em] text-aurora-300">
                {t('gameRoom.generating.title')}
              </h1>
              <p className="text-shadow-300">{t('gameRoom.generating.subtitle')}</p>
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-shadow-400 mb-4">
                {t('gameRoom.generating.logTitle')}
              </h3>
              <div className="max-h-[70vh] space-y-2 overflow-y-auto">
                {streamEvents.map((event, index) => {
                  // Filter out LangChain internal noise
                  const isNoise =
                    event.name === '  start  ' ||
                    event.name === '  return  ' ||
                    event.name === 'LangGraph' ||
                    (event.name || '').includes('ChannelWrite') ||
                    (event.name || '').includes('ChatGoogle') ||
                    event.name === 'generateStructured';

                  if (isNoise && event.type !== 'progress') {
                    return null;
                  }

                  // Tool calls
                  if (event.type === 'tool_call') {
                    const toolCall: ToolCall = {
                      id: `tool-${index}`,
                      toolName: event.tool || 'unknown',
                      parameters: event.args || {},
                      result: event.output,
                      timestamp: Date.now(),
                    };
                    return (
                      <ToolCallCard key={index} toolCall={toolCall} status={event.output ? 'complete' : 'running'} />
                    );
                  }

                  // Period events
                  if (event.type === 'period_start') {
                    return (
                      <div key={index} className="rounded-lg border border-aurora-500/40 bg-aurora-900/20 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-aurora-400">📜</span>
                          <span className="text-sm font-semibold text-aurora-200">
                            {t('gameRoom.stream.creatingEra', {
                              current: event.periodNumber ?? '?',
                              total: event.totalPeriods ?? '?',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Period narrative - complete
                  if (event.type === 'period_text_complete' && event.narrative) {
                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-nebula-500/40 bg-gradient-to-br from-nebula-900/30 via-midnight-900/50 to-midnight-950/70 p-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">📖</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-semibold text-nebula-200">
                                {t('gameRoom.stream.eraNarrative', { era: event.periodNumber ?? '?' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto rounded-lg bg-midnight-950/80 p-4 text-sm leading-relaxed text-shadow-200">
                          {event.narrative}
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      </DynamicLayout>
    );
  }

  // PHASE 3: CHARACTER_CREATION - Lobby and Character Creation
  // Also show this for SETUP phase to skip the streaming intro
  // PHASE 3: CHARACTER_CREATION - Lobby and Character Creation
  // Also show this for SETUP phase to skip the streaming intro
  if (
    room.phase === GamePhase.CHARACTER_CREATION ||
    room.phase === GamePhase.SETUP ||
    (room.phase as string) === 'lobby'
  ) {
    // If user has no character, default to creation mode (optional, can be just lobby)
    // But let's start in Lobby to see everyone

    // If user has no character, default to creation mode (optional, can be just lobby)
    // But let's start in Lobby to see everyone

    const handleReadyToggle = async (isReady: boolean) => {
      if (!room?.id) return;
      try {
        await setReady(room.documentId || room.roomId, isReady);
      } catch (err) {
        console.error('Failed to toggle ready:', err);
      }
    };

    const handleStartGame = async () => {
      if (!room) return;
      try {
        setLoading(true);
        const streamId = crypto.randomUUID();
        console.log('GameRoom DEBUG: Calling startGame...');
        await startGame(room.documentId || room.roomId, room.settings?.language || 'en', streamId);
        console.log('GameRoom DEBUG: startGame returned.');

        // Force refresh room state to ensure phase change is reflected immediately
        // This handles cases where socket event might be delayed or missed
        const updatedRoom = (await getRoomState(room.documentId || room.roomId)) as SharedRoom & { players: Player[] };
        console.log('GameRoom DEBUG: Refetched room phase:', updatedRoom.phase);
        setRoom(updatedRoom);
      } catch (err) {
        console.error('Failed to start game:', err);
        // Optional: show error toast
      } finally {
        setLoading(false);
      }
    };

    if (isCreatingCharacter) {
      return (
        <DynamicLayout showNavbar showLanguageSelector>
          <CharacterCreation
            room={room}
            players={players}
            onCharacterCreated={(player) => {
              setIsCreatingCharacter(false);
              if (player) {
                // Optimistic update using returned player (with correct ID)
                setPlayers((current) => {
                  const idx = current.findIndex((p) => p.userId === player.userId);
                  if (idx >= 0) {
                    const newPlayers = [...current];
                    newPlayers[idx] = player;
                    return newPlayers;
                  }
                  return [...current, player];
                });
              } else if (roomId) {
                // Fallback
                getRoomState(roomId).then((roomData) => {
                  const r = roomData as SharedRoom & { players: Player[] };
                  setRoom(r);
                  setPlayers(r.players || []);
                });
              }
            }}
          />
        </DynamicLayout>
      );
    }

    return (
      <DynamicLayout showNavbar showLanguageSelector>
        <LobbyScreen
          room={room}
          players={players}
          onCreateCharacter={() => setIsCreatingCharacter(true)}
          onReadyToggle={handleReadyToggle}
          isOwner={room.owner?.documentId === user?.documentId || room.ownerId === user?.uid}
          onStartGame={handleStartGame}
        />
      </DynamicLayout>
    );
  }

  // PHASE 4: COMBAT - Tactical combat grid
  if (room.phase === 'COMBAT') {
    return (
      <DynamicLayout showRoomInfo>
        <CombatScreen roomId={roomId!} />
        <ToolNotificationContainer toolCalls={recentToolCalls} onDismiss={() => {}} />
      </DynamicLayout>
    );
  }

  // PHASE 5: GAMEPLAY - Active gameplay with chat, turns, etc.
  return (
    <DynamicLayout showRoomInfo className="h-dvh overflow-hidden" mainClassName="min-h-0">
      <GameplayScreen
        room={room}
        players={players}
        onRefresh={() => {
          if (roomId) {
            getRoomState(roomId).then((roomData) => {
              setRoom(roomData as SharedRoom & { players: Player[] });
              setPlayers((roomData as SharedRoom & { players: Player[] }).players || []);
            });
          }
        }}
      />
      {activeStream && activeStream.status === 'active' && (
        <div className="fixed bottom-20 right-6 z-50 w-96 rounded-lg border border-aurora-500/30 bg-midnight-900/95 p-4 shadow-xl backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-aurora-300">{t('gameRoom.stream.title')}</h3>
            <span className="animate-pulse text-xs text-aurora-400">● {t('gameRoom.stream.live')}</span>
          </div>
          <div className="max-h-60 overflow-y-auto whitespace-pre-wrap text-sm text-aurora-100/90">
            {activeStream.content}
          </div>
        </div>
      )}
      <ToolNotificationContainer toolCalls={recentToolCalls} onDismiss={() => {}} />
    </DynamicLayout>
  );
}
