/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';
import type { Room, Player } from '../../types/shared';
import useStreamingSocket from '../../hooks/useStreamingSocket';
import { processTurn, submitAction } from '../../services/api';
import { movePlayer } from '../../services/socket';
import useAuth from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
// eslint-disable-next-line import/no-unresolved
// import { auth } from '../../services/firebase';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import GameplayChatArea from './GameplayChatArea';
import GameplayComposer from './GameplayComposer';
import { RoomTabs } from '../room/RoomTabs';
import { PlayerListTab } from '../room/PlayerListTab';
import { RoomSettingsTab } from '../room/RoomSettingsTab';
import { TerrainExplorer } from '../terrain/TerrainExplorer';
import { EntityListModal } from '../room/EntityListModal';
import { Button } from '../ui/button';
import { useMutation } from '@apollo/client/react';
import { GenerateTerrainMutation, GenerateTerrainMutationVariables } from '../../gql/graphql';
import { GENERATE_TERRAIN_MUTATION } from '../../queries/terrain';

interface GameplayScreenProps {
  room: Room;
  players: Player[];
  onRefresh?: () => void;
}

/**
 * Enhanced Gameplay screen with streaming support
 * @param props - Component props
 * @returns Gameplay UI with real-time streaming
 */
export default function GameplayScreen({ room, players, onRefresh }: GameplayScreenProps) {
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
  // State for terrain grids
  const [terrainGrid, setTerrainGrid] = useState<any[]>([]);
  const [terrainGrid3D, setTerrainGrid3D] = useState<any[] | undefined>(undefined);

  const [generateTerrain] = useMutation<GenerateTerrainMutation, GenerateTerrainMutationVariables>(
    GENERATE_TERRAIN_MUTATION
  );

  // Load terrain grid from backend (same as TerrainGenerationScreen)
  useEffect(() => {
    const loadTerrain = async () => {
      // Only load if empty
      if (terrainGrid.length === 0) {
        try {
          const roomIdToUse = room.documentId || room.id;
          if (!roomIdToUse) return;

          console.log('[GameplayScreen] Fetching terrain grid via GraphQL:', roomIdToUse);

          const { data } = await generateTerrain({
            variables: { roomId: roomIdToUse },
          });

          // NEW: Handle Unified Chunk Response
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const payload = data?.generateTerrain as any;

          if (payload?.chunks) {
            // Unify chunks into a single 3D grid
            // For now, assume the first chunk OR merge them.
            // Since generateInitialMap returns 1 big chunk (64x64) or a few, we can handle it.
            // Simplified: We reconstruct a single large grid for GameplayScreen state.

            // 1. Determine bounds
            // For MVP simplicty, let's assume valid chunks start at 0?
            // Actually, let's just grab the first chunk if we did 1 big one.
            const chunks = payload.chunks; // typed as ChunkDTO[] theoretically
            console.log('[GameplayScreen] Loaded chunks:', chunks.length);

            // Merge chunks into a map or grid
            // We use a Map to store tiles by key "x,y,z" or just "x,y" for surface
            // But TerrainExplorer expects a 2D/3D array.

            // Find map dimensions
            let minX = Infinity,
              minY = Infinity,
              maxX = -Infinity,
              maxY = -Infinity;
            chunks.forEach((c: any) => {
              minX = Math.min(minX, c.worldOffsetX);
              minY = Math.min(minY, c.worldOffsetY);
              maxX = Math.max(maxX, c.worldOffsetX + c.size);
              maxY = Math.max(maxY, c.worldOffsetY + c.size);
            });

            const sizeX = maxX - minX;
            const sizeY = maxY - minY;
            const floorCount = 7;

            // Init 3D grid
            // [floor][y][x]
            const grid3D: any[][][] = Array(floorCount)
              .fill(null)
              .map(() =>
                Array(sizeY)
                  .fill(null)
                  .map(() => Array(sizeX).fill(null))
              );

            chunks.forEach((chunk: any) => {
              const { worldOffsetX, worldOffsetY, grid } = chunk;

              // grid is [floor][localY][localX]
              // Check if grid exists and has layers
              if (!grid || !Array.isArray(grid)) return;

              for (let f = 0; f < floorCount; f++) {
                const z = f - 3;
                if (!grid[f]) continue;

                grid[f].forEach((row: any[], ly: number) => {
                  if (!row) return;
                  row.forEach((tileRaw: any, lx: number) => {
                    // Skip if null/empty
                    if (!tileRaw) return;

                    const wx = worldOffsetX + lx;
                    const wy = worldOffsetY + ly;

                    // Map to array indices (relative to minX/Y)
                    const ax = wx - minX;
                    const ay = wy - minY;

                    // tileRaw is { b: string, t: string }
                    const biome = tileRaw.b;
                    const blockType = tileRaw.t;

                    if (ax >= 0 && ax < sizeX && ay >= 0 && ay < sizeY) {
                      // Check if layer exists before assigning (though it should from init)
                      if (grid3D[f] && grid3D[f][ay]) {
                        grid3D[f][ay][ax] = {
                          x: wx,
                          y: wy,
                          z,
                          biome,
                          blockType,
                        };
                      }
                    }
                  });
                });
              }
            });

            console.log(`[GameplayScreen] Processed 3D Grid: ${sizeX}x${sizeY} with offset ${minX},${minY}`);
            setTerrainGrid3D(grid3D);
            // Surface is index 3
            setTerrainGrid(grid3D[3] || []);
          } else if (data?.generateTerrain?.biomeMap?.grid) {
            // --- LEGACY FALLBACK (Keep for safety or remove if confident) ---
            const rawGrid = data.generateTerrain.biomeMap.grid as string[][][];
            console.warn('[GameplayScreen] Using Legacy Grid Format!');

            const converted3D = rawGrid.map((floor, zIndex) =>
              floor.map((row, y) =>
                row.map((biome, x) => ({
                  x: x,
                  y: y,
                  z: zIndex - 3,
                  biome: biome || '',
                  blockType: 'grass',
                }))
              )
            );

            const surfaceGrid = converted3D[3] || [];
            setTerrainGrid3D(converted3D);
            setTerrainGrid(surfaceGrid);
          } else {
            console.warn('[GameplayScreen] GraphQL response OK but no grid found??', data);
          }
        } catch (err) {
          console.warn('[GameplayScreen] Failed to load terrain grid:', err);
        }
      }
    };

    loadTerrain();
  }, [room, terrainGrid.length, generateTerrain]);

  const hasPlayerAction = (playerAction: Player['action']) =>
    typeof playerAction === 'string' && playerAction.trim().length > 0;

  // Merge positions from character sheets (Entity/Engine Authority) into Player objects
  const playersWithPositions = players.map((p) => {
    // Find the character sheet for this player
    // Strategy: Match by character ID if linked, or owner ID if available
    // room.character_sheets is populated via strapi
    const sheets = room.character_sheets;
    if (!sheets) return p;

    const sheet = sheets.find(
      (s: any) => (p.character && s.id === p.character.id) || (s.character && s.character.id === p.character?.id)
    );

    if (sheet && sheet.position) {
      return {
        ...p,
        position: sheet.position,
      };
    }
    return p;
  });

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

  const handleTileClick = (tile: { x: number; y: number; z: number }) => {
    // Append formatted coordinate reference to composer
    const ref = `[@ ${tile.x},${tile.y},${tile.z}]`;
    setComposerValue((prev) => {
      // Add space if needed
      const prefix = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
      return prev + prefix + ref;
    });
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

  return (
    <>
      {submitting && socket.isProcessing && <LoadingOverlay message={t('gameplay.processing')} />}

      {/* Desktop Split View (lg+) */}
      <div className="hidden h-full w-full lg:flex">
        {/* Left Panel: Chat (35%) */}
        <div className="w-[35%] min-w-[350px] border-r border-midnight-700 bg-midnight-900/95">{chatContent}</div>

        {/* Right Panel: Map (65%) */}
        <div className="relative flex-1 bg-black">
          <TerrainExplorer
            roomId={room.documentId || room.id}
            biomeGrid={terrainGrid}
            biomeGrid3D={terrainGrid3D}
            roomSize={32}
            enableInfinite
            players={playersWithPositions}
            creatures={socket.creatures}
            structures={room.structures as any}
            onPlayerMove={isDM ? (x, y) => movePlayer(room.documentId || room.id, { x, y, z: 0 }) : undefined}
            onTileClick={handleTileClick}
            currentUserId={user?.uid || user?.documentId}
          />

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
          mapContent={
            <TerrainExplorer
              roomId={room.documentId || room.id}
              biomeGrid={terrainGrid}
              biomeGrid3D={terrainGrid3D}
              roomSize={32}
              enableInfinite
              players={playersWithPositions}
              creatures={socket.creatures}
              structures={room.structures}
              onPlayerMove={isDM ? (x, y) => movePlayer(room.documentId || room.id, { x, y, z: 0 }) : undefined}
              onTileClick={handleTileClick}
            />
          }
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
