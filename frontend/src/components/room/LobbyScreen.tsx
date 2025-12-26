import React from 'react';
import { Users, Plus, CheckCircle, Crown, Shield } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import type { Room, Player } from '@daicer/engine';
import type { AvatarPreviewImage } from '../../types/assets';
import useAuth from '../../hooks/useAuth';

interface LobbyScreenProps {
  room: Room;
  players: Player[];
  onCreateCharacter: () => void;
  onReadyToggle: (isReady: boolean) => void;
  isOwner: boolean;
  onStartGame?: () => void;
}

export function LobbyScreen({
  room,
  players,
  onCreateCharacter,
  onReadyToggle,
  isOwner,
  onStartGame,
}: LobbyScreenProps) {
  const { user } = useAuth();
  // Use loose comparison as IDs might be string vs number, or documentId
  const currentPlayer = players.find((p) => p.userId === user?.uid || p.userId === user?.documentId);
  const hasCharacter = !!currentPlayer?.character;

  // Optimistic UI for ready state
  const [optimisticReady, setOptimisticReady] = React.useState<boolean | null>(null);
  const isReady = optimisticReady !== null ? optimisticReady : currentPlayer?.isReady || false;

  // Reset optimistic state when real state updates
  React.useEffect(() => {
    if (currentPlayer?.isReady === optimisticReady) {
      setOptimisticReady(null);
    }
  }, [currentPlayer?.isReady, optimisticReady]);

  const allReady = players.length > 0 && players.every((p) => (p.userId === user?.uid ? isReady : p.isReady));

  const renderAvatar = (player: Player) => {
    if (!player.avatarPreview?.portrait) {
      return (
        <div className="w-full h-full flex items-center justify-center text-midnight-400">
          <Users className="w-8 h-8" />
        </div>
      );
    }

    // Cast to local type to ensure we have access to all fields (publicUrl, etc)
    // The shared package type might be outdated
    const portrait = player.avatarPreview.portrait as unknown as AvatarPreviewImage;

    // Check for public URL first, then base64 data
    const src = portrait.publicUrl || (portrait.data ? `data:${portrait.mimeType};base64,${portrait.data}` : null);

    if (!src) {
      return (
        <div className="w-full h-full flex items-center justify-center text-midnight-400">
          <Users className="w-8 h-8" />
        </div>
      );
    }

    return <img src={src} alt={player.character?.name || 'Player'} className="w-full h-full object-cover" />;
  };

  return (
    <div className="min-h-screen p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="font-display text-4xl uppercase tracking-[0.35em] text-aurora-300">Lobby</h1>
        <p className="text-shadow-300 text-lg">Waiting for adventurers to gather...</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-midnight-800/50 border border-midnight-600">
          <span className="text-xs font-mono text-shadow-400">ROOM CODE:</span>
          <span className="text-lg font-bold text-accent tracking-widest">{room.code}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Players List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold uppercase tracking-widest text-shadow-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-aurora-400" />
              Adventurers ({players.length})
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {players.map((player) => {
              const isMe = player.userId === user?.uid;
              const playerHasChar = !!player.character;

              return (
                <Card
                  key={player.userId}
                  className={`p-4 border transition-all duration-300 ${
                    player.isReady ? 'border-green-500/30 bg-green-900/10' : 'border-midnight-600 bg-midnight-800/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-midnight-500 bg-midnight-900">
                        {renderAvatar(player)}
                      </div>
                      {player.isReady && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-midnight-950 rounded-full p-1">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-aurora-100 truncate">
                          {player.character?.name || 'Unknown Hero'}
                        </h3>
                        {(room.owner?.documentId === player.userId || room.ownerId === player.userId) && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      {playerHasChar ? (
                        <p className="text-xs text-shadow-400 truncate">
                          Level {player.character?.level} {player.character?.race} {player.character?.characterClass}
                        </p>
                      ) : (
                        <p className="text-xs text-shadow-500 italic">Creating character...</p>
                      )}
                      {isMe && (
                        <span className="inline-block mt-2 text-[10px] uppercase tracking-wider bg-accent/20 text-accent px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          <Card className="p-6 border-aurora-500/20 bg-midnight-800/60 backdrop-blur-sm sticky top-6">
            <h3 className="text-lg font-semibold uppercase tracking-widest text-aurora-300 mb-6">Your Status</h3>

            <div className="space-y-6">
              {!hasCharacter ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-midnight-700 flex items-center justify-center border-2 border-dashed border-midnight-500">
                    <Plus className="w-8 h-8 text-midnight-400" />
                  </div>
                  <div>
                    <p className="text-shadow-300 mb-4">You haven't created a character yet.</p>
                    <Button
                      onClick={onCreateCharacter}
                      className="w-full btn-primary py-6 text-lg group"
                      data-testid="lobby-create-char"
                    >
                      <Shield className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Create Character
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-midnight-900/50 border border-midnight-700">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-midnight-500">
                      {currentPlayer && renderAvatar(currentPlayer)}
                    </div>
                    <div>
                      <p className="font-bold text-aurora-200">{currentPlayer.character?.name}</p>
                      <p className="text-xs text-shadow-400">Ready to adventure</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCreateCharacter}
                      className="ml-auto text-xs text-shadow-500 hover:text-aurora-300"
                      data-testid="lobby-edit-char"
                    >
                      Edit
                    </Button>
                  </div>

                  <Button
                    onClick={() => {
                      const newState = !isReady;
                      setOptimisticReady(newState);
                      onReadyToggle(newState);
                    }}
                    className={`w-full py-6 text-lg transition-all duration-300 ${
                      isReady
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                        : 'bg-midnight-700 hover:bg-midnight-600 text-shadow-300'
                    }`}
                    data-testid="lobby-ready-toggle"
                  >
                    {isReady ? (
                      <>
                        <CheckCircle className="w-6 h-6 mr-2" />
                        Ready!
                      </>
                    ) : (
                      'Mark as Ready'
                    )}
                  </Button>
                </div>
              )}

              {isOwner && (
                <div className="pt-6 border-t border-midnight-600/50 space-y-3">
                  <p className="text-xs text-center text-shadow-500 mb-3 uppercase tracking-wider">
                    Game Master Controls
                  </p>

                  <Button
                    onClick={onStartGame}
                    disabled={!allReady || players.length === 0}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="lobby-start-game"
                  >
                    Start Adventure
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
