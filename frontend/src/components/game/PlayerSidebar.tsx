/**
 * Player sidebar showing party and creatures
 */

import React from 'react';
import type { Room, Player, Creature } from '../../types/shared';

interface PlayerSidebarProps {
  room: Room;
  players: Player[];
  creatures: Creature[];
}

/**
 * Player sidebar component
 * @param props - Component props
 * @returns Sidebar UI
 */
export function PlayerSidebar({ room, players, creatures }: PlayerSidebarProps) {
  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="h-full overflow-y-auto bg-midnight-300/70 p-4 space-y-6 border-l border-shadow-800/60">
      {/* Players */}
      <div>
        <h2 className="text-lg font-bold text-aurora-300 mb-3">Party</h2>
        <div className="space-y-3">
          {players.map((player) => {
            const char = player.character;
            const hasAction = player.action !== null && player.action !== '';

            return (
              <div
                key={player.id}
                className={`p-3 rounded-lg transition-all ${
                  hasAction
                    ? 'bg-aurora-500/12 ring-1 ring-aurora-300/50'
                    : 'bg-shadow-900/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-shadow-50 text-sm">{char.name}</h3>
                  {hasAction && <span className="text-aurora-300 text-xs">✓</span>}
                </div>

                <p className="text-xs text-shadow-300 mb-2">
                  {char.race} {char.characterClass} Lvl {char.level}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="bg-shadow-900/70 p-1.5 rounded border border-shadow-700">
                    <p className="text-aurora-300 font-bold text-sm">
                      {char.hp}/{char.maxHp}
                    </p>
                    <p className="text-shadow-500 text-xs">HP</p>
                  </div>
                  <div className="bg-shadow-900/70 p-1.5 rounded border border-shadow-700">
                    <p className="font-bold text-sm text-shadow-100">{char.armorClass}</p>
                    <p className="text-shadow-500 text-xs">AC</p>
                  </div>
                  <div className="bg-shadow-900/70 p-1.5 rounded border border-shadow-700">
                    <p className="font-bold text-sm text-shadow-100">{getModifier(char.attributes.Dexterity)}</p>
                    <p className="text-shadow-500 text-xs">Init</p>
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
          <h2 className="text-lg font-bold text-nebula-300 mb-3">Creatures</h2>
          <div className="space-y-2">
            {creatures.map((creature) => (
              <div
                key={creature.name}
                className="p-3 bg-shadow-900/70 border border-nebula-400/30 rounded-lg"
              >
                <h3 className="font-bold text-nebula-200 text-sm">{creature.name}</h3>
                <p className="text-sm text-shadow-200">
                  HP: {creature.hp}/{creature.maxHp}
                </p>
                <p className="text-xs text-shadow-500">
                  ATK: +{creature.attackBonus} | DMG: {creature.damage}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

