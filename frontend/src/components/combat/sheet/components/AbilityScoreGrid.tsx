import type { CombatCharacter } from '../../../../types/combat';
import { ABILITY_LABELS, SECTION_TITLE_CLASSES, formatModifier } from '../utils';

export function AbilityScoreGrid({ character }: { character: CombatCharacter }) {
  return (
    <section className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4">
      <h3 className={`${SECTION_TITLE_CLASSES} mb-4`}>Ability Grid</h3>
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {ABILITY_LABELS.map(({ key, label, short }) => {
          const score = character[key];
          return (
            <div
              key={label}
              className="rounded-xl border border-shadow-800 bg-gradient-to-br from-shadow-950/60 to-midnight-800/50 p-3 text-center"
            >
              <p className="text-xs uppercase tracking-wide text-shadow-400">{short}</p>
              <p className="text-3xl font-bold text-shadow-50">{score}</p>
              <p className="text-xs text-shadow-300">
                {formatModifier(score)} · {label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
