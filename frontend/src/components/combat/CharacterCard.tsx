/**
 * @file frontend/src/components/combat/CharacterCard.tsx
 * @description Character Card Component - Displays character stats and combat status
 * @note Update README.md in this directory when modifying component behavior or props
 */

import type { CombatCharacter } from '../../types/combat';

interface CharacterCardProps {
  character: CombatCharacter;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function CharacterCard({ character, isActive, isSelected, onClick }: CharacterCardProps) {
  const hpPercentage = (character.hp / character.maxHp) * 100;
  const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

  const getAbilityModifier = (score: number): number => Math.floor((score - 10) / 2);

  const formatModifier = (modifier: number): string => (modifier >= 0 ? `+${modifier}` : `${modifier}`);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`
        p-3 rounded-lg border transition-all cursor-pointer
        ${isActive ? 'border-nebula-400 bg-nebula-900/20' : 'border-shadow-700 bg-midnight-300'}
        ${isSelected ? 'ring-2 ring-aurora-400' : ''}
        ${character.hp <= 0 ? 'opacity-50 grayscale' : ''}
        hover:bg-shadow-800/50
      `}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              character.isPlayer ? 'bg-aurora-500 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {character.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-shadow-50">{character.name}</div>
            <div className="text-xs text-shadow-400">Init: {character.initiative}</div>
          </div>
        </div>
        {isActive && <div className="text-xs font-bold text-nebula-300 px-2 py-1 bg-nebula-900/50 rounded">ACTIVE</div>}
      </div>

      {/* HP Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-shadow-300 mb-1">
          <span>HP</span>
          <span>
            {character.hp}/{character.maxHp}
          </span>
        </div>
        <div className="w-full bg-shadow-800 rounded-full h-2">
          <div
            className={`${hpColor} h-2 rounded-full transition-all`}
            style={{ width: `${Math.max(0, hpPercentage)}%` }}
          />
        </div>
        {character.tempHp > 0 && <div className="text-xs text-blue-300 mt-1">+{character.tempHp} temp HP</div>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1 text-xs mb-2">
        <div className="text-center p-1 bg-shadow-800/50 rounded">
          <div className="text-shadow-400">AC</div>
          <div className="font-bold text-shadow-100">{character.armorClass}</div>
        </div>
        <div className="text-center p-1 bg-shadow-800/50 rounded">
          <div className="text-shadow-400">Speed</div>
          <div className="font-bold text-shadow-100">{character.speed} ft</div>
        </div>
        <div className="text-center p-1 bg-shadow-800/50 rounded">
          <div className="text-shadow-400">Reach</div>
          <div className="font-bold text-shadow-100">{character.reach * 5} ft</div>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="grid grid-cols-6 gap-1 text-xs mb-2">
        {[
          { name: 'STR', score: character.strength },
          { name: 'DEX', score: character.dexterity },
          { name: 'CON', score: character.constitution },
          { name: 'INT', score: character.intelligence },
          { name: 'WIS', score: character.wisdom },
          { name: 'CHA', score: character.charisma },
        ].map(({ name, score }) => (
          <div key={name} className="text-center p-1 bg-shadow-800/30 rounded">
            <div className="text-shadow-500 text-[10px]">{name}</div>
            <div className="font-bold text-shadow-200">{formatModifier(getAbilityModifier(score))}</div>
          </div>
        ))}
      </div>

      {/* Turn Status */}
      {isActive && (
        <div className="flex gap-1 text-xs">
          <div
            className={`px-2 py-1 rounded ${character.hasMoved ? 'bg-shadow-700 text-shadow-400' : 'bg-green-900/50 text-green-300'}`}
          >
            {character.hasMoved ? '✓ Moved' : 'Can Move'}
          </div>
          <div
            className={`px-2 py-1 rounded ${character.hasActed ? 'bg-shadow-700 text-shadow-400' : 'bg-green-900/50 text-green-300'}`}
          >
            {character.hasActed ? '✓ Acted' : 'Can Act'}
          </div>
        </div>
      )}

      {/* Conditions */}
      {character.conditions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {character.conditions.map((condition) => (
            <div
              key={`${condition.type}-${condition.level || 0}`}
              className="text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded border border-red-700"
            >
              {condition.type}
              {condition.level !== undefined && ` ${condition.level}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
