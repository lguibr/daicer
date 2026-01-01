import type { EntitySheet } from '@daicer/engine';
import type { CombatCharacter } from '../../../../types/combat';

interface HeaderProps {
  character: CombatCharacter;
  characterSheet?: EntitySheet | null;
  onClose: () => void;
}

export function CombatSheetHeader({ character, characterSheet, onClose }: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-shadow-700 bg-midnight-500/40 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-shadow-50">{characterSheet?.name ?? character.name}</h2>
        <p className="text-sm text-shadow-300">
          {characterSheet
            ? `${characterSheet.race} ${characterSheet.characterClass} • Level ${characterSheet.level}`
            : character.isPlayer
              ? 'Player Character'
              : 'Enemy Combatant'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-aurora-400/60 bg-aurora-500/20 px-3 py-1 text-xs font-semibold text-aurora-100">
          Initiative {character.initiative}
        </span>
        <span className="rounded-full border border-shadow-700 bg-shadow-900/60 px-3 py-1 text-xs font-semibold text-shadow-200">
          {character.isPlayer ? 'Players' : 'Enemies'}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-shadow-600 bg-shadow-800 px-4 py-1 text-sm font-semibold text-shadow-200 transition hover:border-aurora-400/60 hover:text-shadow-50"
        >
          Close
        </button>
      </div>
    </header>
  );
}
