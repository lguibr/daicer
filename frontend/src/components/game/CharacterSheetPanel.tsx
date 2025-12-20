import { useEffect } from 'react';
import type { Player, SkillDetail, Talent, ResourcePool } from '../../types/shared';

interface CharacterSheetPanelProps {
  player: Player | null;
  onClose: () => void;
}

const formatModifier = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

const proficiencyLabelMap: Record<SkillDetail['proficiency'], string> = {
  none: 'Untrained',
  trained: 'Trained',
  proficient: 'Proficient',
  expertise: 'Expertise',
};

const proficiencyStyleMap: Record<SkillDetail['proficiency'], string> = {
  none: 'bg-midnight-800/40 text-shadow-400 border border-midnight-700',
  trained: 'bg-midnight-600/40 text-shadow-200 border border-midnight-500/40',
  proficient: 'bg-aurora-500/10 text-aurora-200 border border-aurora-500/30 shadow-[0_0_10px_rgba(211,143,31,0.1)]',
  expertise: 'bg-nebula-500/10 text-nebula-200 border border-nebula-500/30 shadow-[0_0_10px_rgba(122,73,217,0.1)]',
};

const sectionTitleClasses = 'text-sm uppercase tracking-wide text-shadow-400 font-semibold';

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div className="rounded-xl border border-midnight-700 bg-midnight-900/60 px-4 py-3 backdrop-blur-sm transition-all hover:border-aurora-500/30 hover:bg-midnight-800/60">
      <div className="text-[10px] uppercase tracking-[0.2em] text-shadow-400 font-bold">{label}</div>
      <div className="text-2xl font-bold text-shadow-50 font-display">{value}</div>
      {subtext && <div className="text-xs text-aurora-400/80 mt-1">{subtext}</div>}
    </div>
  );
}

function ResourceBadge({ pool }: { pool: ResourcePool }) {
  return (
    <div className="rounded-lg border border-shadow-700 bg-shadow-900/70 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-shadow-50">{pool.name}</span>
        <span className="text-sm text-aurora-200 font-semibold">
          {pool.current}/{pool.max}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-shadow-400">
        <span>{pool.refresh.replace('-', ' ')}</span>
        {pool.description && <span>{pool.description}</span>}
      </div>
    </div>
  );
}

function TalentCard({ talent }: { talent: Talent }) {
  return (
    <div className="rounded-lg border border-midnight-700 bg-midnight-900/60 p-4 transition-all hover:border-aurora-500/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base font-semibold text-shadow-50 font-display">{talent.name}</span>
        <span className="rounded-full bg-midnight-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-aurora-300 border border-midnight-600/50">
          {talent.category}
        </span>
      </div>
      <p className="text-sm text-shadow-300 leading-relaxed">{talent.description}</p>
    </div>
  );
}

export default function CharacterSheetPanel({ player, onClose }: CharacterSheetPanelProps) {
  useEffect(() => {
    if (!player) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose, player]);

  if (!player) return null;

  const { character } = player;

  if (!character) return null;

  const { attributes } = character;
  const skillDetails = character.skillDetails?.length ? character.skillDetails : undefined;
  const { avatarAssets } = character;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6">
      <button
        type="button"
        aria-label="Close character sheet"
        onClick={onClose}
        className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm focus:outline-none"
      />
      <div className="relative z-10 h-full w-full max-w-5xl">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-midnight-600 bg-midnight-950/95 shadow-2xl backdrop-blur-xl">
          <header className="flex flex-col gap-2 border-b border-midnight-700 bg-midnight-900/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-20 backdrop-blur-md">
            <div>
              <h2 className="text-3xl font-bold text-shadow-50 font-display tracking-wide">{character.name}</h2>
              <p className="text-sm text-shadow-300">
                {character.alignment} • {character.race} {character.characterClass} • Level {character.level}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="self-end rounded-full border border-shadow-600 bg-shadow-800 px-4 py-1 text-sm font-semibold text-shadow-200 transition hover:border-aurora-400/60 hover:text-shadow-50"
            >
              Close
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            {/* Avatars */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className={sectionTitleClasses}>Character Portraits</h3>
                {avatarAssets && (
                  <span className="text-xs text-shadow-400">Generated automatically for this character</span>
                )}
              </div>
              {avatarAssets ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <figure className="group relative overflow-hidden rounded-xl border border-shadow-700 bg-shadow-900/70">
                    <img
                      src={avatarAssets.publicUrl}
                      alt={`${character.name} Avatar`}
                      className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    <figcaption className="absolute bottom-2 left-2 rounded bg-shadow-900/80 px-3 py-1 text-xs font-semibold text-shadow-100 backdrop-blur">
                      Avatar
                    </figcaption>
                  </figure>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-shadow-600 bg-shadow-900/50 p-6 text-center text-sm text-shadow-300">
                  Portraits will generate automatically once this character sheet is saved.
                </div>
              )}
            </section>

            {/* Core stats */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4">
                <h3 className={sectionTitleClasses}>Vitals</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Hit Points" value={`${character.hp}/${character.maxHp}`} />
                  <StatCard label="Temporary HP" value={character.temporaryHp} />
                  <StatCard label="Armor Class" value={character.armorClass} />
                  <StatCard label="Initiative" value={formatModifier(character.initiative)} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className={sectionTitleClasses}>Combat Readiness</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Speed" value={`${character.speed} ft`} />
                  <StatCard label="Proficiency" value={`+${character.proficiencyBonus}`} />
                  <StatCard label="Base Attack Bonus" value={character.baseAttackBonus} />
                  <StatCard
                    label="Inspiration"
                    value={character.inspiration ? 'Yes' : 'No'}
                    subtext={
                      character.deathSaves
                        ? `Death Saves: ${character.deathSaves.successes}/${character.deathSaves.failures}`
                        : undefined
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className={sectionTitleClasses}>Saving Throws</h3>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Fortitude" value={formatModifier(character.savingThrows.fortitude)} />
                  <StatCard label="Reflex" value={formatModifier(character.savingThrows.reflex)} />
                  <StatCard label="Will" value={formatModifier(character.savingThrows.will)} />
                </div>
              </div>
            </section>

            {/* Attributes */}
            <section>
              <h3 className={`${sectionTitleClasses} mb-3`}>Attributes</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {(Object.entries(attributes) as Array<[keyof typeof attributes, number]>).map(([attr, score]) => (
                  <div key={attr} className="rounded-xl border border-shadow-700 bg-shadow-900/70 p-3 text-center">
                    <div className="text-xs uppercase tracking-wide text-shadow-400">{attr.slice(0, 3)}</div>
                    <div className="text-2xl font-bold text-shadow-50">{score}</div>
                    <div className="text-xs text-shadow-300">{formatModifier(Math.floor((score - 10) / 2))}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className={`${sectionTitleClasses} mb-3`}>Skills & Proficiencies</h3>
                <div className="space-y-2 rounded-xl border border-shadow-700 bg-shadow-900/60 p-3">
                  {(skillDetails ?? []).map((skill) => (
                    <div
                      key={skill.name}
                      className="flex items-center justify-between rounded-lg border border-shadow-800 bg-shadow-950/40 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-shadow-50">{skill.name}</p>
                        <p className="text-xs text-shadow-400">{skill.ability}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-aurora-200">{formatModifier(skill.modifier)}</span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${proficiencyStyleMap[skill.proficiency]}`}
                        >
                          {proficiencyLabelMap[skill.proficiency]}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!skillDetails && (
                    <p className="text-sm text-shadow-400">
                      Skills will update once the character sheet is fully generated.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className={`${sectionTitleClasses} mb-2`}>Expertises</h3>
                  {character.expertises.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {character.expertises.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-nebula-400/40 bg-nebula-500/15 px-3 py-1 text-xs font-semibold text-nebula-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-shadow-400">No expertises recorded yet.</p>
                  )}
                </div>

                <div>
                  <h3 className={`${sectionTitleClasses} mb-2`}>Talents & Features</h3>
                  {character.talents.length > 0 ? (
                    <div className="space-y-2">
                      {character.talents.map((talent) => (
                        <TalentCard key={`${talent.name}-${talent.category}`} talent={talent} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-shadow-400">Talents will appear as the character progresses.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Resources & Advancement */}
            <section className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className={`${sectionTitleClasses} mb-3`}>Resource Pools</h3>
                {character.resourcePools.length > 0 ? (
                  <div className="space-y-2">
                    {character.resourcePools.map((pool) => (
                      <ResourceBadge key={pool.name} pool={pool} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-shadow-400">No renewable resources available.</p>
                )}
              </div>
              <div>
                <h3 className={`${sectionTitleClasses} mb-3`}>Advancement Points</h3>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Ability" value={character.advancementPoints.ability} />
                  <StatCard label="Skill" value={character.advancementPoints.skill} />
                  <StatCard label="Talent" value={character.advancementPoints.talent} />
                </div>
              </div>
            </section>

            {/* Appearance & personality */}
            <section className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className={`${sectionTitleClasses} mb-3`}>Appearance</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(character.appearance).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs uppercase tracking-wide text-shadow-400">{key}</dt>
                      <dd className="font-semibold text-shadow-50">{value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h3 className={`${sectionTitleClasses} mb-3`}>Personality Profile</h3>
                <div className="space-y-2 rounded-xl border border-shadow-700 bg-shadow-900/70 p-3 text-sm text-shadow-200">
                  <p>
                    <span className="font-semibold text-shadow-50">Traits:</span> {character.personality.traits || '—'}
                  </p>
                  <p>
                    <span className="font-semibold text-shadow-50">Ideals:</span> {character.personality.ideals || '—'}
                  </p>
                  <p>
                    <span className="font-semibold text-shadow-50">Bonds:</span> {character.personality.bonds || '—'}
                  </p>
                  <p>
                    <span className="font-semibold text-shadow-50">Flaws:</span> {character.personality.flaws || '—'}
                  </p>
                </div>
              </div>
            </section>

            {/* Background */}
            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className={`${sectionTitleClasses} mb-3`}>Background Details</h3>
                  <div className="space-y-2 rounded-xl border border-shadow-700 bg-shadow-900/70 p-3 text-sm text-shadow-200">
                    <p>
                      <span className="font-semibold text-shadow-50">Origin:</span>{' '}
                      {character.backgroundDetails.origin || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-shadow-50">Upbringing:</span>{' '}
                      {character.backgroundDetails.upbringing || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-shadow-50">Motivation:</span>{' '}
                      {character.backgroundDetails.motivation || '—'}
                    </p>
                    {character.backgroundDetails.keyEvents.length > 0 && (
                      <div>
                        <span className="font-semibold text-shadow-50">Key Events:</span>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-shadow-300">
                          {character.backgroundDetails.keyEvents.map((event) => (
                            <li key={event}>{event}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {character.backgroundDetails.allies?.length ? (
                      <p>
                        <span className="font-semibold text-shadow-50">Allies:</span>{' '}
                        {character.backgroundDetails.allies.join(', ')}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <h3 className={`${sectionTitleClasses} mb-3`}>Equipment & Ledger</h3>
                  <div className="rounded-xl border border-shadow-700 bg-shadow-900/70 p-3 text-sm text-shadow-200 space-y-2">
                    <div>
                      <span className="font-semibold text-shadow-50">Equipment:</span>{' '}
                      {character.equipmentDescription || '—'}
                    </div>
                    <div>
                      <span className="font-semibold text-shadow-50">Proficiencies & Languages:</span>{' '}
                      {character.proficienciesAndLanguages || '—'}
                    </div>
                    <div>
                      <span className="font-semibold text-shadow-50">Features:</span> {character.features || '—'}
                    </div>
                    <div>
                      <span className="font-semibold text-shadow-50">Treasure:</span> {character.treasure || '—'}
                    </div>
                    <div>
                      <span className="font-semibold text-shadow-50">Currency:</span>{' '}
                      {`CP ${character.currency.cp} • SP ${character.currency.sp} • EP ${character.currency.ep} • GP ${character.currency.gp} • PP ${character.currency.pp}`}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`${sectionTitleClasses} mb-3`}>Backstory</h3>
                <div className="rounded-xl border border-shadow-700 bg-shadow-900/70 p-4 text-sm leading-relaxed text-shadow-100">
                  {character.backstory || 'No backstory has been recorded yet.'}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
