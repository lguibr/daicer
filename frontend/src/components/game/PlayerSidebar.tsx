import { useI18n } from '../../i18n';
import type { Player, Creature } from '@daicer/engine';

interface PlayerSidebarProps {
  players: Player[];
  creatures: Creature[];
  onSelectPlayer?: (player: Player) => void;
}

/**
 * Player sidebar component
 * @param props - Component props
 * @returns Sidebar UI
 */
export default function PlayerSidebar({ players, creatures, onSelectPlayer }: PlayerSidebarProps) {
  const { t } = useI18n();
  const hasPlayerAction = (playerAction: Player['action']) =>
    typeof playerAction === 'string' && playerAction.trim().length > 0;
  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="h-full overflow-y-auto bg-midnight-300/70 p-4 space-y-6 border-l border-shadow-800/60">
      {/* Players */}
      <div>
        <h2 className="text-lg font-bold text-aurora-300 mb-3">{t('gameplay.partyHeading')}</h2>
        <div className="space-y-3">
          {players.map((player) => {
            const char = player.character;
            if (!char) return null; // Skip if no character

            const hasAction = hasPlayerAction(player.action);

            return (
              <div
                key={player.id}
                className={`p-3 rounded-lg transition-all ${
                  hasAction ? 'bg-aurora-500/12 ring-1 ring-aurora-300/50' : 'bg-shadow-900/70'
                }`}
              >
                <div className="mb-2 flex items-center gap-3">
                  {char.avatarAssets?.publicUrl ? (
                    <img
                      src={char.avatarAssets.publicUrl}
                      alt={`${char.name} portrait`}
                      className="h-10 w-10 flex-shrink-0 rounded-full border border-shadow-600 object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 flex-shrink-0 rounded-full border border-dashed border-shadow-700 bg-shadow-900/80 text-center text-xs text-shadow-400 flex items-center justify-center">
                      {(char.name || '?')
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-shadow-50 text-sm">{char.name}</h3>
                      {hasAction && <span className="text-aurora-300 text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-shadow-300">
                      {char.race} {char.characterClass} Lvl {char.level}
                    </p>
                  </div>
                </div>

                {onSelectPlayer && (
                  <button
                    type="button"
                    onClick={() => onSelectPlayer(player)}
                    className="mb-3 w-full rounded-lg border border-shadow-700 bg-shadow-900/70 px-3 py-1 text-xs font-semibold text-shadow-200 transition hover:border-aurora-300/60 hover:text-shadow-50"
                  >
                    {t('gameplay.viewSheet')}
                  </button>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="bg-shadow-900/70 p-1.5 rounded border border-shadow-700">
                    <p className="text-aurora-300 font-bold text-sm">
                      {char.hp}/{char.maxHp}
                    </p>
                    <p className="text-shadow-500 text-xs">{t('common.hp')}</p>
                  </div>
                  <div className="bg-shadow-900/70 p-1.5 rounded border border-shadow-700">
                    <p className="font-bold text-sm text-shadow-100">{char.armorClass}</p>
                    <p className="text-shadow-500 text-xs">{t('common.ac')}</p>
                  </div>
                  <div className="bg-shadow-900/70 p-1.5 rounded border border-shadow-700">
                    <p className="font-bold text-sm text-shadow-100">{getModifier(char.attributes.Dexterity)}</p>
                    <p className="text-shadow-500 text-xs">{t('common.init')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Creatures */}
      {creatures.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-nebula-300 mb-3">{t('gameplay.creaturesHeading')}</h2>
          <div className="space-y-2">
            {creatures.map((creature) => (
              <div key={creature.name} className="p-3 bg-shadow-900/70 border border-nebula-400/30 rounded-lg">
                <h3 className="font-bold text-nebula-200 text-sm">{creature.name}</h3>
                <p className="text-sm text-shadow-200">
                  {t('common.hp')}: {creature.hp}/{creature.maxHp}
                </p>
                <p className="text-xs text-shadow-500">
                  {t('common.attack')}: +{creature.attackBonus} | {t('common.damage')}: {creature.damage}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
