import { Users, Hash, Zap, User } from 'lucide-react';
import type { Room, Player } from '../../types/shared';
import { useI18n } from '../../i18n';

interface RoomInfoBarProps {
  room: Room;
  players: Player[];
}

/**
 * Room information bar displayed below navbar
 * Shows room code, phase, player count, and character count
 */
export default function RoomInfoBar({ room, players }: RoomInfoBarProps) {
  const { t } = useI18n();

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'SETUP':
        return t('navbar.phase.setup');
      case 'CHARACTER_CREATION':
        return t('navbar.phase.characterCreation');
      case 'GAMEPLAY':
        return t('navbar.phase.gameplay');
      case 'COMBAT':
        return t('navbar.phase.combat');
      default:
        return phase;
    }
  };

  const characterCount = players.filter((p) => p.character?.name).length;

  return (
    <div className="border-b border-midnight-500/70 bg-midnight-400/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-4 py-3 sm:gap-6">
          {/* Room Code */}
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-shadow-400" aria-hidden="true" />
            <span className="text-xs text-shadow-300 sm:text-sm">{t('navbar.labels.room')}:</span>
            <span className="rounded border border-aurora-400/40 bg-midnight-500/50 px-2.5 py-1 font-mono text-sm font-bold text-aurora-200 sm:px-3 sm:text-base">
              {room.code}
            </span>
          </div>

          {/* Phase */}
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-nebula-400" aria-hidden="true" />
            <span className="text-xs text-shadow-300 sm:text-sm">{t('navbar.labels.phase')}:</span>
            <span className="font-semibold text-nebula-200">{getPhaseLabel(room.phase)}</span>
          </div>

          {/* Player Count */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-aurora-400" aria-hidden="true" />
            <span className="text-xs text-shadow-300 sm:text-sm">{t('navbar.labels.players')}:</span>
            <span className="font-semibold text-aurora-200">{players.length}</span>
          </div>

          {/* Character Count */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span className="text-xs text-shadow-300 sm:text-sm">{t('roomInfo.characters')}:</span>
            <span className="font-semibold text-amber-200">{characterCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
