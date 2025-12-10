import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';
import type { Room, Player } from '../../types/shared';
import useStreamingSocket from '../../hooks/useStreamingSocket';
import { processTurn, movePlayer } from '../../services/socket';
import { submitAction } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import GameplayChatArea from './GameplayChatArea';
import GameplayComposer from './GameplayComposer';
import { RoomTabs } from '../room/RoomTabs';
import { PlayerListTab } from '../room/PlayerListTab';
import { RoomSettingsTab } from '../room/RoomSettingsTab';
import { TerrainExplorer } from '../terrain/TerrainExplorer';
import { EntityListModal } from '../room/EntityListModal';
import { Button } from '../ui/button';

const EMPTY_GRID: any[] = [];

interface GameplayScreenProps {
  room: Room;
  players: Player[];
}

/**
 * Enhanced Gameplay screen with streaming support
 * @param props - Component props
 * @returns Gameplay UI with real-time streaming
 */
export default function GameplayScreen({ room, players }: GameplayScreenProps) {
  const { user } = useAuth();
  const socket = useStreamingSocket(room.id);
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [showEntityList, setShowEntityList] = useState(false);

  const hasPlayerAction = (playerAction: Player['action']) =>
    typeof playerAction === 'string' && playerAction.trim().length > 0;

  const currentPlayer = players.find((p) => p.userId === user?.uid);
  const hasSubmitted = currentPlayer ? hasPlayerAction(currentPlayer.action) : false;
  const allSubmitted = players.length > 0 && players.every((p) => hasPlayerAction(p.action));
  const submittedCount = players.filter((p) => hasPlayerAction(p.action)).length;
  const roomLanguage = room.settings?.language || 'en';
  const isDM = room.ownerId === user?.uid;

  const handleSubmitAction = async (action: string) => {
    if (!action.trim() || !room.id) return;

    try {
      setSubmitting(true);
      await submitAction(room.id, action);
    } catch (err) {
      console.error('Failed to submit action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessTurn = () => {
    if (room.id && !submitting) {
      setSubmitting(true);
      processTurn(room.id, roomLanguage);
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
              {allSubmitted ? 'Waiting for DM to process turn...' : 'Waiting for other players...'}
            </p>
          </div>
        ) : (
          <GameplayComposer
            roomId={room.id}
            userName={currentPlayer?.character.name || user?.displayName || 'Player'}
            onSubmit={handleSubmitAction}
            disabled={submitting || socket.isProcessing}
            placeholder={t('gameplay.actionPlaceholder')}
            isProcessing={socket.isProcessing}
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
            roomId={room.id}
            biomeGrid={EMPTY_GRID}
            roomSize={32}
            enableInfinite
            players={players}
            creatures={socket.creatures}
            structures={room.structures}
            onPlayerMove={isDM ? (x, y) => movePlayer(room.id, { x, y, z: 0 }) : undefined}
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
          roomId={room.id}
          chatContent={chatContent}
          mapContent={
            <TerrainExplorer
              roomId={room.id}
              biomeGrid={EMPTY_GRID}
              roomSize={32}
              enableInfinite
              players={players}
              creatures={socket.creatures}
              structures={room.structures}
              onPlayerMove={isDM ? (x, y) => movePlayer(room.id, { x, y, z: 0 }) : undefined}
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
        roomId={room.id}
      />
    </>
  );
}
