import type { CharacterSheet } from '@daicer/engine';
import { SECTION_TITLE_CLASSES } from '../utils';
import { ResourceTile, InfoTile } from './SharedComponents';

export function FeaturesPanel({ characterSheet }: { characterSheet?: CharacterSheet | null }) {
  const talents = characterSheet?.talents ?? [];
  const resourcePools = characterSheet?.resourcePools ?? [];
  const advancementPoints = characterSheet?.advancementPoints ?? null;

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-3">
        <h3 className={SECTION_TITLE_CLASSES}>Talents & Features</h3>
        {talents.length > 0 ? (
          <div className="space-y-2">
            {talents.map((talent) => (
              <div
                key={`${talent.name}-${talent.category}`}
                className="rounded-xl border border-shadow-800 bg-shadow-950/40 p-3 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-shadow-50">{talent.name}</span>
                  <span className="text-xs uppercase tracking-wide text-aurora-300">{talent.category}</span>
                </div>
                <p className="text-sm text-shadow-300 leading-relaxed">{talent.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-shadow-300">Talents will appear as the character progresses.</p>
        )}
      </div>

      <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-4">
        <div>
          <h3 className={SECTION_TITLE_CLASSES}>Resources & Progression</h3>
          {resourcePools.length > 0 ? (
            <div className="mt-3 space-y-2">
              {resourcePools.map((pool) => (
                <ResourceTile key={pool.name} pool={pool} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-shadow-300">No renewable resources tracked.</p>
          )}
        </div>
        {advancementPoints ? (
          <div>
            <h4 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Advancement Points</h4>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <InfoTile label="Ability" value={advancementPoints.ability} />
              <InfoTile label="Skill" value={advancementPoints.skill} />
              <InfoTile label="Talent" value={advancementPoints.talent} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
