import { useEffect } from 'react';
import type { CombatCharacter } from '../../types/combat';

type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

interface CombatCharacterSheetProps {
  character: CombatCharacter;
  onClose: () => void;
}

const ABILITY_LABELS: Array<{ key: AbilityKey; label: string }> = [
  { key: 'strength', label: 'Strength' },
  { key: 'dexterity', label: 'Dexterity' },
  { key: 'constitution', label: 'Constitution' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'wisdom', label: 'Wisdom' },
  { key: 'charisma', label: 'Charisma' },
];

const formatModifier = (score: number): string => {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

export function CombatCharacterSheet({ character, onClose }: CombatCharacterSheetProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const statusFlags = [
    { label: 'Moved', value: character.hasMoved },
    { label: 'Acted', value: character.hasActed },
    { label: 'Reaction', value: character.hasReaction },
    { label: 'Bonus Action', value: character.hasBonusAction },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6">
      <div aria-hidden="true" className="absolute inset-0 bg-midnight-950/85 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 h-full w-full max-w-4xl overflow-hidden rounded-2xl border border-shadow-700 bg-midnight-200/95 shadow-2xl"
      >
        <header className="flex flex-col gap-3 border-b border-shadow-700 bg-midnight-500/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-shadow-50">{character.name}</h2>
            <p className="text-sm text-shadow-300">
              {character.isPlayer ? 'Player Character' : 'Enemy Combatant'} · Initiative {character.initiative}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-start rounded-full border border-shadow-600 bg-shadow-800 px-4 py-1 text-sm font-semibold text-shadow-200 transition hover:border-aurora-400/60 hover:text-shadow-50"
          >
            Close
          </button>
        </header>

        <div className="h-full overflow-y-auto px-6 py-6 space-y-6">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-2">
              <h3 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Vitals</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-shadow-400 text-xs uppercase">Hit Points</p>
                  <p className="text-shadow-50 font-semibold">
                    {character.hp}/{character.maxHp}
                    {character.tempHp > 0 && <span className="text-aurora-200"> (+{character.tempHp} temp)</span>}
                  </p>
                </div>
                <div>
                  <p className="text-shadow-400 text-xs uppercase">Armor Class</p>
                  <p className="text-shadow-50 font-semibold">{character.armorClass}</p>
                </div>
                <div>
                  <p className="text-shadow-400 text-xs uppercase">Speed</p>
                  <p className="text-shadow-50 font-semibold">
                    {character.speed} ft · {character.movementRemaining} ft left
                  </p>
                </div>
                <div>
                  <p className="text-shadow-400 text-xs uppercase">Reach</p>
                  <p className="text-shadow-50 font-semibold">{character.reach * 5} ft</p>
                </div>
                <div>
                  <p className="text-shadow-400 text-xs uppercase">Proficiency</p>
                  <p className="text-shadow-50 font-semibold">+{character.proficiencyBonus}</p>
                </div>
                {character.deathSaves && (
                  <div>
                    <p className="text-shadow-400 text-xs uppercase">Death Saves</p>
                    <p className="text-shadow-50 font-semibold">
                      {character.deathSaves.successes} success · {character.deathSaves.failures} failure
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-3">
              <h3 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Combat Status</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {statusFlags.map(({ label, value }) => (
                  <span
                    key={label}
                    className={`rounded-full px-3 py-1 border ${
                      value
                        ? 'border-aurora-400/60 bg-aurora-500/20 text-aurora-100'
                        : 'border-shadow-700 bg-shadow-800/60 text-shadow-300'
                    }`}
                  >
                    {value ? `✓ ${label}` : `✕ ${label}`}
                  </span>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Position</p>
                <p className="text-sm text-shadow-200">
                  Grid ({character.position.x}, {character.position.y})
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Conditions</p>
                {character.conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {character.conditions.map((condition) => (
                      <span
                        key={`${condition.type}-${condition.level ?? 0}`}
                        className="rounded-full border border-red-700 bg-red-900/50 px-3 py-1 text-xs text-red-200"
                      >
                        {condition.type}
                        {condition.level !== undefined ? ` ${condition.level}` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-shadow-300">No active conditions.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-shadow-700 bg-shadow-900/70 p-4">
            <h3 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold mb-3">Ability Scores</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ABILITY_LABELS.map(({ key, label }) => {
                const score = character[key];
                return (
                  <div key={label} className="rounded-lg border border-shadow-800 bg-shadow-950/50 p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-shadow-400">{label}</p>
                    <p className="text-2xl font-bold text-shadow-50">{score}</p>
                    <p className="text-xs text-shadow-300">{formatModifier(score)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-shadow-700 bg-shadow-900/70 p-4">
            <h3 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold mb-3">Battle Notes</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-shadow-400">Avatar Key</dt>
                <dd className="text-shadow-50 font-semibold">{character.avatar || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-shadow-400">Team</dt>
                <dd className="text-shadow-50 font-semibold">{character.isPlayer ? 'Players' : 'Enemies'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-shadow-400">Has Reaction</dt>
                <dd className="text-shadow-50 font-semibold">{character.hasReaction ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-shadow-400">Has Bonus Action</dt>
                <dd className="text-shadow-50 font-semibold">{character.hasBonusAction ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
