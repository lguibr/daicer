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
    <div className="h-screen overflow-y-auto bg-slate-800 p-4 space-y-6">
      {/* Room Info */}
      <div className="pb-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-cyan-400 mb-1">Room</h2>
        <p className="text-slate-400 text-sm">Code: <span className="font-mono text-cyan-500">{room.code}</span></p>
      </div>

      {/* Players */}
      <div>
        <h2 className="text-lg font-bold text-cyan-400 mb-3">Party</h2>
        <div className="space-y-3">
          {players.map((player) => {
            const char = player.character;
            const hasAction = player.action !== null && player.action !== '';

            return (
              <div
                key={player.id}
                className={`p-3 rounded-lg ${
                  hasAction ? 'bg-green-900/30 ring-1 ring-green-500' : 'bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-white">{char.name}</h3>
                  {hasAction && <span className="text-green-400 text-xs">✓</span>}
                </div>

                <p className="text-xs text-slate-300 mb-2">
                  {char.race} {char.characterClass} Lvl {char.level}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="bg-slate-800/50 p-1 rounded">
                    <p className="text-red-400 font-bold">
                      {char.hp}/{char.maxHp}
                    </p>
                    <p className="text-slate-500">HP</p>
                  </div>
                  <div className="bg-slate-800/50 p-1 rounded">
                    <p className="font-bold">{char.armorClass}</p>
                    <p className="text-slate-500">AC</p>
                  </div>
                  <div className="bg-slate-800/50 p-1 rounded">
                    <p className="font-bold">{getModifier(char.attributes.Dexterity)}</p>
                    <p className="text-slate-500">Init</p>
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
          <h2 className="text-lg font-bold text-red-400 mb-3">Creatures</h2>
          <div className="space-y-2">
            {creatures.map((creature) => (
              <div key={creature.name} className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <h3 className="font-bold text-red-300">{creature.name}</h3>
                <p className="text-sm text-slate-300">
                  HP: {creature.hp}/{creature.maxHp}
                </p>
                <p className="text-xs text-slate-400">ATK: +{creature.attackBonus} | DMG: {creature.damage}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

