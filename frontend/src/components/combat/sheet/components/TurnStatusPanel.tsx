import { useMemo } from 'react';
import type { CombatCharacter } from '../../../../types/combat';
import { SECTION_TITLE_CLASSES } from '../utils';
import { InfoTile } from './SharedComponents';

export function TurnStatusPanel({ character }: { character: CombatCharacter }) {
  const statusFlags = useMemo(
    () => [
      { label: 'Moved', value: character.hasMoved },
      { label: 'Acted', value: character.hasActed },
      { label: 'Reaction', value: character.hasReaction },
      { label: 'Bonus Action', value: character.hasBonusAction },
    ],
    [character.hasActed, character.hasBonusAction, character.hasMoved, character.hasReaction]
  );

  return (
    <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-4">
      <div>
        <h3 className={SECTION_TITLE_CLASSES}>Turn Economy</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {statusFlags.map(({ label, value }) => (
            <div
              key={label}
              className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide ${
                value
                  ? 'border-aurora-400/60 bg-aurora-500/20 text-aurora-100'
                  : 'border-shadow-700 bg-shadow-900/60 text-shadow-300'
              }`}
            >
              {value ? `Ready ${label}` : `Spent ${label}`}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoTile
          label="Position"
          value={`(${character.position.x}, ${character.position.y})`}
          hint="Grid coordinates"
        />
        <InfoTile label="Avatar Key" value={character.avatar || '—'} />
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Conditions</h4>
        {character.conditions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {character.conditions.map((condition) => (
              <span
                key={`${condition.type}-${condition.level ?? 0}`}
                className="rounded-full border border-red-700/70 bg-red-900/40 px-3 py-1 text-xs font-semibold text-red-200"
              >
                {condition.type}
                {condition.level !== undefined ? ` ${condition.level}` : ''}
                {condition.duration ? ` (${condition.duration} turn)` : ''}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-shadow-300">No active conditions.</p>
        )}
      </div>
    </div>
  );
}
