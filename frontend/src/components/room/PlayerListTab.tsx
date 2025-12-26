/**
 * PlayerListTab Component
 * Shows player list with character gating overlay
 */

import { Users } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import type { Player } from '../../types/models';

interface PlayerListTabProps {
  players: Player[];
  currentUserId: string;
  asModal?: boolean;
}

export function PlayerListTab({ players, currentUserId, asModal = false }: PlayerListTabProps) {
  const currentPlayer = players.find((p) => p.userId === currentUserId);
  const hasCharacter = !!currentPlayer?.character;

  const content = (
    <div className={asModal ? 'space-y-3' : 'h-full overflow-y-auto p-6'}>
      {!asModal && <h2 className="mb-4 text-xl font-semibold text-white">Players ({players.length})</h2>}

      {!hasCharacter ? (
        <div className="relative h-full">
          {/* Grayed-out player list */}
          <div className="pointer-events-none space-y-3 opacity-30">
            {players.map((p) => (
              <Card key={p.id} className="border-midnight-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-midnight-700" />
                    <div>
                      <p className="font-semibold text-white">{p.character?.name || 'No character'}</p>
                      <p className="text-xs text-shadow-400">
                        {p.character?.characterClass || 'Not created'} • Level {p.character?.level || 1}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-midnight-950/80 backdrop-blur-sm">
            <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/95 via-midnight-800/95 to-midnight-700/95">
              <CardContent className="p-8 text-center">
                <h3 className="mb-2 text-xl font-bold text-white">Create Your Character First</h3>
                <p className="text-shadow-300">You must create a character before viewing other players</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {players.map((p) => (
            <Card
              key={p.id}
              className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60 transition-all hover:border-accent/50"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-nebula/30 text-xl font-bold text-white">
                    {p.character?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{p.character?.name || 'Unknown'}</p>
                    <p className="text-sm text-shadow-400">
                      {p.character?.race} {p.character?.characterClass} • Level {p.character?.level || 1}
                    </p>
                  </div>
                  {p.isReady && (
                    <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
                      Ready
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (asModal) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-midnight-600 bg-midnight-900/80 backdrop-blur hover:bg-midnight-800"
          >
            <Users className="h-5 w-5 text-shadow-300" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-midnight-700 bg-midnight-950/95 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Players ({players.length})</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}
