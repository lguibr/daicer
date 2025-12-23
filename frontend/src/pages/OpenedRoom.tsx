/**
 * Pre-game lobby page - shows world generation, then players create characters and ready up before gameplay
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getRoomState } from '../services/api';
import { joinRoom as joinSocketRoom } from '../services/socket';
import useSocket from '../hooks/useSocket';
import CharacterCreation from '../components/room/CharacterCreation';
import { PrivateLayout } from '../components/layout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { DiceLoader } from '../components/ui/dice-loader';

import ToolCallCard from '../components/chat/ToolCallCard';
// eslint-disable-next-line import/no-unresolved
import { auth } from '../services/firebase';
// import { useI18n } from '../i18n';

import type { Room, Player } from '../types/shared';

import type { ToolCall } from '../services/socket';

/**
 * Opened room page component - pre-game lobby
 */
export default function OpenedRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  // const { t } = useI18n(); // Unused but might be needed later

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socket = useSocket(roomId);

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

  // Load initial room state
  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    const loadRoom = async () => {
      try {
        const data = await getRoomState(roomId);
        setRoom(data);
        setPlayers((data as Room & { players: Player[] }).players || []);

        // Join socket room
        setTimeout(() => {
          joinSocketRoom(roomId);
        }, 100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomId, navigate]);

  // Update state from socket
  useEffect(() => {
    if (socket.room) {
      setRoom(socket.room);

      // If room has generation events, restore them to streamEvents
      if (socket.room.generationEvents && streamEvents.length === 0) {
        setStreamEvents(socket.room.generationEvents);
      }

      // Auto-navigate to gameplay when room phase changes to GAMEPLAY
      if (socket.room.phase === 'GAMEPLAY') {
        navigate(`/room/${roomId}`);
      }
    }
    if (socket.players.length > 0) {
      setPlayers(socket.players);
    }
  }, [socket.room, socket.players, roomId, navigate]);

  // Monitor world generation if room is in SETUP phase
  const isWorldGenerating = room && room.phase === 'SETUP' && !room.worldDescription;
  const roomPhase = room?.phase;
  const hasWorldDescription = room?.worldDescription;

  useEffect(() => {
    // Only run if room is in SETUP phase and has no worldDescription
    if (!roomId || roomPhase !== 'SETUP' || hasWorldDescription) {
      return;
    }

    console.log('[OpenedRoom] Starting world generation SSE listeners');

    // Clear previous events once on mount
    setStreamEvents([]);

    let eventSource: EventSource | null = null;
    let currentSection = 1;
    let isCleanedUp = false;

    const connectToSSE = async () => {
      if (isCleanedUp) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

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
              const token2 = await user.getIdToken();
              const endpoint2 = `${API_URL}/api/graph/world-config/stream?roomId=${roomId}&token=${encodeURIComponent(token2)}`;
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

  if (loading) {
    return (
      <PrivateLayout showRoomInfo={false}>
        <div className="flex min-h-screen items-center justify-center">
          <DiceLoader size="large" />
        </div>
      </PrivateLayout>
    );
  }

  if (error || !room) {
    return (
      <PrivateLayout showRoomInfo={false}>
        <div className="flex min-h-screen items-center justify-center">
          <Card className="max-w-md border-red-500/30 bg-midnight-800/95 p-8 text-center">
            <h2 className="mb-4 text-xl font-semibold text-red-400">Error</h2>
            <p className="text-shadow-300">{error || 'Room not found'}</p>
            <Button onClick={() => navigate('/')} className="mt-6">
              Return to Lobby
            </Button>
          </Card>
        </div>
      </PrivateLayout>
    );
  }

  // const allReady = players.length > 0 && players.every((p) => p.character && p.isReady); // Unused

  // If world is generating, show generation log screen
  if (isWorldGenerating) {
    return (
      <PrivateLayout showRoomInfo={false}>
        <div className="min-h-screen flex items-center justify-center p-6 bg-midnight-950">
          <div className="w-full max-w-4xl space-y-6">
            {/* World Generation Title */}
            <div className="text-center space-y-4">
              <h1 className="font-display text-3xl uppercase tracking-[0.35em] text-aurora-300">Generating World</h1>
              <p className="text-shadow-300">Creating the history and lore of your realm...</p>
            </div>

            {/* Detailed Event Stream */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-shadow-400 mb-4">Generation Log</h3>
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
                            Creating Era {event.periodNumber} of {event.totalPeriods}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Period narrative - streaming or complete
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
                                Era {event.periodNumber} Narrative
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
      </PrivateLayout>
    );
  }

  // Show the full character creation component with all steps, avatars, etc.
  return (
    <PrivateLayout showRoomInfo={false}>
      <CharacterCreation room={room} players={players} />
    </PrivateLayout>
  );
}
