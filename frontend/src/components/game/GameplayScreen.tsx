/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

import type { Room, Player, Creature } from '@daicer/engine';
// Let's verify compatibility.

import useStreamingSocket from '../../hooks/useStreamingSocket';
import { processTurn, submitAction } from '../../services/api';

import useAuth from '../../hooks/useAuth';
import { useI18n } from '../../i18n';

// import { auth } from '../../services/firebase';
import { LoadingOverlay } from '../ui/LoadingOverlay';

import { MapRenderer } from '../../features/debug/components/MapRenderer';
import { useChunkLoader } from '../../hooks/useChunkLoader';
import type { WorldConfig, Coordinates } from '../../features/debug/utils/types';

import GameplayChatArea from './GameplayChatArea';
import GameplayComposer from './GameplayComposer';
import { RoomTabs } from '../room/RoomTabs';
import { PlayerListTab } from '../room/PlayerListTab';
import { RoomSettingsTab } from '../room/RoomSettingsTab';
import { EntityListModal } from '../room/EntityListModal';
import { Button } from '../ui/button';

interface GameplayScreenProps {
  room: Room;
  players: Player[];
  creatures?: Creature[];
  onRefresh?: () => void;
}

/**
 * Enhanced Gameplay screen with streaming support
 * @param props - Component props
 * @returns Gameplay UI with real-time streaming
 */
export default function GameplayScreen({ room, players, creatures = [], onRefresh }: GameplayScreenProps) {
  const { user } = useAuth();

  // Memoize initial messages from room data to hydrate socket state immediately
  const initialMessages = useMemo(() => {
 
    const rawMessages = (room as any).messages || [];
    // Sort just in case backend query sort isn't perfect, though GQL usually handles it
    // return rawMessages.map...
    return rawMessages
      .slice()
 
      .sort((a: any, b: any) => Number(a.timestamp) - Number(b.timestamp))
 
      .map((msg: any) => ({
        id: msg.documentId,
        content: msg.content,
        text: msg.content, // Compat
        sender: msg.senderName,
        senderName: msg.senderName,
        senderType: msg.senderType,
        timestamp: Number(msg.timestamp),
        type: msg.senderType === 'dm' ? 'narration' : 'chat',
        turn: msg.turn
          ? {
              documentId: msg.turn.documentId,
              turnNumber: msg.turn.turnNumber,
            }
          : undefined,
      }));
  }, [room]);

  const socket = useStreamingSocket(room.id, initialMessages);
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [showEntityList, setShowEntityList] = useState(false);
  const [composerValue, setComposerValue] = useState('');

  const hasPlayerAction = (playerAction: Player['action']) =>
    typeof playerAction === 'string' && playerAction.trim().length > 0;

  const currentPlayer = players.find(
    (p) => p.userId === user?.uid || (user?.documentId && p.userId === user.documentId)
  );
  const hasSubmitted = currentPlayer ? hasPlayerAction(currentPlayer.action) : false;
  const allSubmitted = players.length > 0 && players.every((p) => hasPlayerAction(p.action));
  const submittedCount = players.filter((p) => hasPlayerAction(p.action)).length;
  const roomLanguage = room.settings?.language || 'en';
  const isDM = (!!room.owner?.documentId && room.owner.documentId === user?.documentId) || room.ownerId === user?.uid;

  useEffect(() => {
    console.log(
      '[GameplayScreen Debug] State Update:',
      JSON.stringify(
        {
 
          players: players.map((p) => ({ userId: p.userId, action: p.action, rawId: (p as any).id })),
          currentUserUid: user?.uid,
          currentUserDocId: user?.documentId,
          roomOwnerId: room.ownerId,
          roomOwnerDocId: room.owner?.documentId,
          currentPlayer: currentPlayer ? { userId: currentPlayer.userId } : 'NOT FOUND',
          isDM,
          hasSubmitted,
          allSubmitted,
          submittedCount,
        },
        null,
        2
      )
    );
  }, [players, user, currentPlayer, isDM, hasSubmitted, allSubmitted, submittedCount, room]);

  // Turn Data
  const { turnData } = room;
  const turnPhase = turnData?.phase || 'idle';

  const handleSubmitAction = async (action: string) => {
    // Strapi 5 uses documentId
    const roomId = room.documentId || room.id;
    if (!action.trim() || !roomId) return;

    try {
      setSubmitting(true);
      await submitAction(roomId as string, action);
      setComposerValue(''); // Clear input on success

      // Refresh room state to reflect the submitted action immediately
      onRefresh?.();
    } catch (err) {
      console.error('Failed to submit action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessTurn = () => {
    const roomId = room.documentId || room.id;
    if (roomId && !submitting) {
      setSubmitting(true);
      processTurn(roomId as string, roomLanguage);
    }
  };

  useEffect(() => {
    if (!socket.isProcessing) {
      setSubmitting(false);
    }
  }, [socket.isProcessing]);

  useEffect(() => {
    if (socket.error) {
      toast.error(socket.error);
    }
  }, [socket.error]);

  const navigate = useNavigate();

  const handleLeaveRoom = () => {
    navigate('/');
  };

  // Chat tab content
  const chatContent = (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex-shrink-0 border-b border-shadow-800/70 bg-midnight-400/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-shadow-50">{t('gameplay.feedTitle')}</h2>
            <p className="text-xs text-shadow-400">
              {t('gameplay.actionsSubmitted')}: {submittedCount} / {players.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden bg-midnight-950/30">
        <GameplayChatArea
          messages={socket.messages}
          streamingMessages={socket.streamingMessages}
          worldDescription={room.worldDescription}
          isProcessing={socket.isProcessing}
          presence={socket.presence}
 
          currentUserId={(currentPlayer as any)?.user?.documentId || user?.uid}
          currentUserCharacter={currentPlayer?.character}
        />
      </div>

      {/* Composer Area */}
      <div className="flex-shrink-0 border-t border-shadow-800/70 bg-midnight-300/85 p-3 backdrop-blur md:p-5">
        {/* Turn Status */}
        <div className="mb-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-shadow-400">
            {t('gameplay.actionsSubmitted')}: {submittedCount} / {players.length}
          </span>
          {!hasSubmitted && <span className="text-aurora-200 font-semibold">{t('gameplay.yourTurn')}</span>}
          {hasSubmitted && !allSubmitted && (
            <span className="text-nebula-200 font-semibold">{t('gameplay.waitingForOthers')}</span>
          )}
          {allSubmitted && isDM && (
            <span className="text-aurora-200 font-semibold animate-pulse">{t('gameplay.readyToProcess')}</span>
          )}
        </div>

        {/* Action Input or Process Button */}
        {hasSubmitted && allSubmitted && isDM ? (
          <button
            type="button"
            onClick={handleProcessTurn}
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-nebula-500 to-aurora-500 px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                {t('gameplay.processing')}
              </span>
            ) : (
              t('gameplay.processTurn')
            )}
          </button>
        ) : hasSubmitted ? (
          <div className="rounded-xl border border-midnight-600/60 bg-midnight-900/50 p-4 text-center">
            <p className="text-shadow-300">✓ {t('gameplay.actionSubmitted')}</p>
            <p className="mt-1 text-xs text-shadow-500">
              {turnPhase === 'processing'
                ? 'DM Brain is thinking...'
                : turnPhase === 'waiting_for_actions'
                  ? 'Phase: Waiting for Actions'
                  : allSubmitted
                    ? 'Waiting for DM to process turn...'
                    : 'Waiting for other players...'}
            </p>
          </div>
        ) : (
          <GameplayComposer
            roomId={room.documentId || room.id}
            userName={currentPlayer?.character?.name || user?.displayName || 'Player'}
            onSubmit={handleSubmitAction}
            disabled={submitting || socket.isProcessing}
            placeholder={t('gameplay.actionPlaceholder')}
            isProcessing={socket.isProcessing}
            value={composerValue}
            onChange={setComposerValue}
          />
        )}
      </div>
    </div>
  );

  // === Map State & Logic ===
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const [viewZ, setViewZ] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [cameraPosition, setCameraPosition] = useState<Coordinates>({ x: 0, y: 0, z: 0 });

  // Sync camera to player on mount/update if valid
  useEffect(() => {
    if (currentPlayer?.position) {
      setCameraPosition(currentPlayer.position as Coordinates);
      setViewZ(currentPlayer.position.z);
    }
  }, [currentPlayer?.position?.x, currentPlayer?.position?.y, currentPlayer?.position?.z]);

  // Resize Observer for Map Container
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [showEntityList]); // Re-measure if modal state changes potentially affecting layout

  // Config for ChunkLoader
  // Fallback to defaults if room config is missing
  const mapConfig: WorldConfig = useMemo(() => {
    const defaults: WorldConfig = {
      seed: 'default',
      chunkSize: 32,
      globalScale: 0.01,
      seaLevel: 0,
      elevationScale: 1,
      roughness: 0.5,
      detail: 4,
      moistureScale: 1,
      temperatureOffset: 0,
      structureChance: 0.1,
      structureSpacing: 10,
      structureSizeAvg: 10,
      roadDensity: 0.5,
      fogRadius: 10,
    };
    return { ...defaults, ...(room.config || {}) };
  }, [room.config]);

  const { getChunk } = useChunkLoader({ config: mapConfig });

  // Chunk Provider
  const chunkProvider = useMemo(
    () => ({
      getChunk: (x: number, y: number) => getChunk(x, y),
    }),
    [getChunk]
  );

  // Entities for Map
  const mapEntities = useMemo(() => {
    const playerEntities = players
      .filter((p) => p.position) // Only players with position
      .map((p) => ({
        id: p.userId,
        type: 'player' as const,
        name: p.character?.name || p.name,
        position: p.position!,
        color: p.userId === user?.uid ? '#10b981' : '#3b82f6', // Green for self, Blue for others
        visionRadius: 10, // Default
        exploredTiles: new Set<string>(), // Hydrate if available
      }));

    const creatureEntities = creatures.map((c) => ({
 
      id: (c as any).documentId || c.id,
      type: (c.type || 'monster') as 'monster' | 'npc', // Fallback
      name: c.name,
      position: c.position || { x: 0, y: 0, z: 0 },
      color: '#ef4444', // Red for monsters
      visionRadius: 0,
      exploredTiles: new Set<string>(),
    }));

    return [...playerEntities, ...creatureEntities];
  }, [players, creatures, user?.uid]);

  // Map Component
  const mapContent = (
    <div className="relative h-full w-full bg-black" ref={mapContainerRef}>
      {/* Map Controls Overlay */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex flex-col items-center rounded-lg bg-midnight-900/90 p-2 shadow-xl backdrop-blur">
          <button
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-midnight-700 text-shadow-200"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
          >
            +
          </button>
          <span className="text-xs font-mono text-shadow-400">{Math.round(zoom * 100)}%</span>
          <button
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-midnight-700 text-shadow-200"
            onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
          >
            -
          </button>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-midnight-900/90 p-2 shadow-xl backdrop-blur">
          {([-1, 0, 1] as const).map((z) => (
            <button
              key={z}
              onClick={() => setViewZ(z)}
              className={`flex h-8 w-8 items-center justify-center rounded text-xs font-bold transition-colors ${
                viewZ === z ? 'bg-aurora-500 text-midnight-950' : 'text-shadow-400 hover:bg-midnight-700'
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      <MapRenderer
        width={mapSize.w}
        height={mapSize.h}
        center={cameraPosition}
        viewZ={viewZ}
        scale={zoom}
        chunkProvider={chunkProvider}
        visibleTiles={new Set()} // TODO: Implement FOV
        exploredTiles={new Set()}
        entities={mapEntities}
        onTileClick={(col, row) => {
          // Submit Move Action
          handleSubmitAction(`MOVE:${col},${row},${viewZ}`);
        }}
        onTileHover={() => {}}
        onZoom={(delta, mouseX, mouseY) => {
          const SCALE_FACTOR = 0.1;
          const newZoom = Math.max(0.1, Math.min(5, zoom - delta * SCALE_FACTOR));
          const TILE_SIZE = 32 * zoom;
          // Zoom towards cursor
          const wx = cameraPosition.x + (mouseX - mapSize.w / 2) / TILE_SIZE;
          const wy = cameraPosition.y + (mouseY - mapSize.h / 2) / TILE_SIZE;

          const NEW_TILE_SIZE = 32 * newZoom;
          const newCenterX = wx - (mouseX - mapSize.w / 2) / NEW_TILE_SIZE;
          const newCenterY = wy - (mouseY - mapSize.h / 2) / NEW_TILE_SIZE;

          setZoom(newZoom);
          setCameraPosition({ ...cameraPosition, x: newCenterX, y: newCenterY });
        }}
        onPan={(dx, dy) => {
          const TILE_SIZE = 32 * zoom;
          setCameraPosition((prev) => ({
            ...prev,
            x: prev.x - dx / TILE_SIZE,
            y: prev.y - dy / TILE_SIZE,
          }));
        }}
      />
    </div>
  );

  return (
    <>
      {submitting && socket.isProcessing && <LoadingOverlay message={t('gameplay.processing')} />}

      {/* Desktop View (lg+) - Split Screen */}
      <div className="hidden h-full w-full lg:flex">
        {/* Left: Map (50%) */}
        <div className="h-full w-1/2 border-r border-midnight-700 bg-black relative">{mapContent}</div>

        {/* Right: Chat (50%) */}
        <div className="h-full w-1/2 relative bg-midnight-900/95">
          {chatContent}

          {/* Overlay Controls */}
          <div className="absolute right-4 top-4 flex gap-2">
            <Button size="icon" variant="secondary" onClick={() => setShowEntityList(true)} title="Entities & Sheets">
              <BookOpen className="w-4 h-4" />
            </Button>
            <RoomSettingsTab room={room} onLeave={handleLeaveRoom} asModal />
            <PlayerListTab players={players} currentUserId={user?.uid || ''} asModal />
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Tabs (< lg) */}
      <div className="h-full w-full lg:hidden">
        <RoomTabs
          roomId={room.documentId || room.id}
          chatContent={chatContent}
          mapContent={mapContent}
          playersContent={<PlayerListTab players={players} currentUserId={user?.uid || ''} />}
          settingsContent={<RoomSettingsTab room={room} onLeave={handleLeaveRoom} />}
        />
      </div>

      <EntityListModal
        isOpen={showEntityList}
        onClose={() => setShowEntityList(false)}
        creatures={socket.creatures}
        players={players}
        roomId={room.documentId || room.id}
      />
    </>
  );
}
