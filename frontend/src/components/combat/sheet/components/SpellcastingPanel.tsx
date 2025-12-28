import type { CharacterSheet } from '@daicer/engine';
import { SECTION_TITLE_CLASSES, formatSigned } from '../utils';
import { InfoTile } from './SharedComponents';

export function SpellcastingPanel({ characterSheet }: { characterSheet?: CharacterSheet | null }) {
  const spellcasting = characterSheet?.spellcasting ?? null;
  const spellSlots = spellcasting?.slots ?? [];
  const hasSpellcastingContent =
    !!spellcasting &&
    (spellcasting.class ||
      spellcasting.ability ||
      spellcasting.cantrips.length > 0 ||
      spellcasting.spellsKnown.length > 0 ||
      spellSlots.length > 0);

  return (
    <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-4">
      <div>
        <h3 className={SECTION_TITLE_CLASSES}>Spellcasting</h3>
        {hasSpellcastingContent ? (
          <div className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile label="Class" value={spellcasting?.class || '—'} />
              <InfoTile label="Casting Ability" value={spellcasting?.ability || '—'} />
              <InfoTile label="Save DC" value={spellcasting?.saveDC ?? '—'} />
              <InfoTile label="Attack Bonus" value={spellcasting ? formatSigned(spellcasting.attackBonus) : '—'} />
            </div>
            {spellcasting?.cantrips.length ? (
              <div>
                <h4 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Cantrips</h4>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-shadow-200">
                  {spellcasting.cantrips.map((spell) => (
                    <span
                      key={spell}
                      className="rounded-full border border-aurora-400/50 bg-aurora-500/15 px-3 py-1 font-semibold text-aurora-100"
                    >
                      {spell}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {spellcasting?.spellsKnown.length ? (
              <div>
                <h4 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Spells Known</h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm text-shadow-200">
                  {spellcasting.spellsKnown.map((spell) => (
                    <div key={spell} className="rounded-lg border border-shadow-800 bg-shadow-950/50 px-3 py-2">
                      {spell}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {spellSlots.length > 0 ? (
              <div>
                <h4 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Spell Slots</h4>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {spellSlots.map((slot) => (
                    <div
                      key={slot.level}
                      className="rounded-lg border border-shadow-800 bg-shadow-950/60 px-3 py-2 text-center text-xs font-semibold text-shadow-50"
                    >
                      <div className="uppercase tracking-wide text-shadow-300">Level {slot.level}</div>
                      <div className="mt-1 text-sm text-aurora-200">
                        {slot.expended}/{slot.total} used
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-shadow-300">This character has no active spellcasting features.</p>
        )}
      </div>
    </div>
  );
}
