import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CombatCharacter } from '../../types/combat';
import type { CharacterSheet, SkillDetail } from '@daicer/engine';

type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
type PortraitView = 'portrait' | 'upperBody' | 'fullBody';

interface CombatCharacterSheetProps {
  character: CombatCharacter;
  characterSheet?: CharacterSheet | null;
  onClose: () => void;
}

const ABILITY_LABELS: Array<{ key: AbilityKey; label: string; short: string }> = [
  { key: 'strength', label: 'Strength', short: 'STR' },
  { key: 'dexterity', label: 'Dexterity', short: 'DEX' },
  { key: 'constitution', label: 'Constitution', short: 'CON' },
  { key: 'intelligence', label: 'Intelligence', short: 'INT' },
  { key: 'wisdom', label: 'Wisdom', short: 'WIS' },
  { key: 'charisma', label: 'Charisma', short: 'CHA' },
];

// Portrait views (currently only single avatar supported)
// const PORTRAIT_ORDER: PortraitView[] = ['portrait', 'upperBody', 'fullBody'];
const PORTRAIT_LABELS: Record<PortraitView, string> = {
  portrait: 'Face',
  upperBody: 'Upper Body',
  fullBody: 'Full Body',
};

const sectionTitleClasses = 'text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold';

const proficiencyLabelMap: Record<SkillDetail['proficiency'], string> = {
  none: 'Untrained',
  trained: 'Trained',
  proficient: 'Proficient',
  expertise: 'Expertise',
};

const proficiencyStyleMap: Record<SkillDetail['proficiency'], string> = {
  none: 'border border-shadow-700 bg-shadow-900/60 text-shadow-300',
  trained: 'border border-midnight-400/50 bg-midnight-500/20 text-shadow-100',
  proficient: 'border border-aurora-400/60 bg-aurora-500/15 text-aurora-100',
  expertise: 'border border-nebula-400/60 bg-nebula-500/15 text-nebula-100',
};

const formatModifier = (score: number): string => {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

const formatSigned = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

const formatLabel = (value: string): string =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());

type InfoTileProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
};

function InfoTile({ label, value, hint }: InfoTileProps) {
  return (
    <div className="rounded-xl border border-shadow-800 bg-shadow-950/60 p-3">
      <p className="text-xs uppercase tracking-wide text-shadow-400">{label}</p>
      <p className="text-lg font-semibold text-shadow-50">{value}</p>
      {hint ? <p className="text-xs text-shadow-300 mt-1">{hint}</p> : null}
    </div>
  );
}

type ResourcePool = CharacterSheet['resourcePools'][number];

function ResourceTile({ pool }: { pool: ResourcePool }) {
  return (
    <div className="rounded-xl border border-shadow-700 bg-shadow-950/40 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-shadow-50">{pool.name}</span>
        <span className="text-sm font-semibold text-aurora-200">
          {pool.current}/{pool.max}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-shadow-400 gap-2">
        <span className="uppercase tracking-wide">{pool.refresh.replace(/-/g, ' ')}</span>
        {pool.description ? <span className="text-right">{pool.description}</span> : null}
      </div>
    </div>
  );
}

function SkillBadge({ skill }: { skill: SkillDetail }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-shadow-800 bg-shadow-950/50 px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-shadow-50">{skill.name}</p>
        <p className="text-xs text-shadow-400">{skill.ability}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-aurora-200">{formatModifier(skill.modifier)}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${proficiencyStyleMap[skill.proficiency]}`}>
          {proficiencyLabelMap[skill.proficiency]}
        </span>
      </div>
    </div>
  );
}

export function CombatCharacterSheet({ character, characterSheet, onClose }: CombatCharacterSheetProps) {
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

  const [portraitView, setPortraitView] = useState<PortraitView>('portrait');

  const availablePortraitViews = useMemo(() => {
    if (!characterSheet?.avatarAssets) return [];
    return ['portrait'] as PortraitView[]; // avatarAssets is single asset, not multiple views
  }, [characterSheet?.avatarAssets]);

  useEffect(() => {
    if (availablePortraitViews.length === 0) {
      setPortraitView('portrait');
      return;
    }
    setPortraitView((previous) =>
      availablePortraitViews.includes(previous) ? previous : (availablePortraitViews[0] ?? 'portrait')
    );
  }, [availablePortraitViews]);

  const portraitAsset = useMemo(() => {
    if (!characterSheet?.avatarAssets) return null;
    return characterSheet.avatarAssets.publicUrl ? characterSheet.avatarAssets : null;
  }, [characterSheet?.avatarAssets]);

  const canCyclePortrait = availablePortraitViews.length > 1;

  const nextPortraitLabel = useMemo(() => {
    if (!canCyclePortrait) return null;
    const currentIndex = availablePortraitViews.indexOf(portraitView);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % availablePortraitViews.length;
    const nextView = availablePortraitViews[nextIndex];
    return nextView ? PORTRAIT_LABELS[nextView] : null;
  }, [availablePortraitViews, canCyclePortrait, portraitView]);

  const handleCyclePortrait = () => {
    if (!canCyclePortrait) return;
    const currentIndex = availablePortraitViews.indexOf(portraitView);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % availablePortraitViews.length;
    const nextView = availablePortraitViews[nextIndex];
    if (nextView) {
      setPortraitView(nextView);
    }
  };

  const fallbackInitials = useMemo(() => {
    const sourceName = characterSheet?.name ?? character.name;
    return sourceName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? '')
      .join('');
  }, [characterSheet?.name, character.name]);

  const quickFacts = useMemo(
    () =>
      [
        { label: 'Team', value: character.isPlayer ? 'Player Character' : 'Enemy Combatant' },
        { label: 'Initiative', value: character.initiative },
        characterSheet
          ? { label: 'Class', value: `${characterSheet.characterClass} • Level ${characterSheet.level}` }
          : null,
        characterSheet ? { label: 'Race', value: characterSheet.race } : null,
        characterSheet ? { label: 'Alignment', value: characterSheet.alignment } : null,
        characterSheet ? { label: 'Background', value: characterSheet.background } : null,
        characterSheet?.backgroundDetails?.origin
          ? { label: 'Origin', value: characterSheet.backgroundDetails.origin }
          : null,
      ].filter((item): item is { label: string; value: string } | { label: string; value: number } => {
        if (!item) return false;
        if (item.value === null || item.value === undefined) return false;
        if (typeof item.value === 'string') {
          return item.value.trim().length > 0;
        }
        if (typeof item.value === 'number') {
          return true;
        }
        return false;
      }),
    [character.isPlayer, character.initiative, characterSheet]
  );

  const statusFlags = useMemo(
    () => [
      { label: 'Moved', value: character.hasMoved },
      { label: 'Acted', value: character.hasActed },
      { label: 'Reaction', value: character.hasReaction },
      { label: 'Bonus Action', value: character.hasBonusAction },
    ],
    [character.hasActed, character.hasBonusAction, character.hasMoved, character.hasReaction]
  );

  const sortedSkills = useMemo(() => {
    const skills = characterSheet?.skillDetails ?? [];
    return [...skills].sort((a, b) => a.name.localeCompare(b.name));
  }, [characterSheet?.skillDetails]);

  const expertises = characterSheet?.expertises ?? [];
  const talents = characterSheet?.talents ?? [];
  const resourcePools = characterSheet?.resourcePools ?? [];
  const advancementPoints = characterSheet?.advancementPoints ?? null;
  const spellcasting = characterSheet?.spellcasting ?? null;
  const spellSlots = spellcasting?.slots ?? [];
  const personality = characterSheet?.personality ?? null;
  const backgroundDetails = characterSheet?.backgroundDetails ?? null;
  const currency = characterSheet?.currency ?? null;
  const appearanceEntries = characterSheet?.appearance ? Object.entries(characterSheet.appearance) : [];
  const keyEvents = backgroundDetails?.keyEvents ?? [];
  const allies = backgroundDetails?.allies ?? [];
  const hasSpellcastingContent =
    !!spellcasting &&
    (spellcasting.class ||
      spellcasting.ability ||
      spellcasting.cantrips.length > 0 ||
      spellcasting.spellsKnown.length > 0 ||
      spellSlots.length > 0);

  const currencyDisplay = currency
    ? `CP ${currency.cp} • SP ${currency.sp} • EP ${currency.ep} • GP ${currency.gp} • PP ${currency.pp}`
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6">
      <div aria-hidden="true" className="absolute inset-0 bg-midnight-950/85 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-shadow-700 bg-midnight-200/95 shadow-2xl"
      >
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

        <div className="h-full overflow-y-auto px-6 py-6 space-y-6">
          <section className="grid gap-6 lg:grid-cols-[minmax(240px,320px)_1fr]">
            <div className="space-y-4 rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4">
              <button
                type="button"
                className={`group relative block overflow-hidden rounded-xl border border-shadow-700 bg-shadow-950/70 focus:outline-none ${
                  canCyclePortrait ? 'cursor-pointer' : 'cursor-default'
                }`}
                onClick={handleCyclePortrait}
                disabled={!canCyclePortrait}
              >
                {portraitAsset ? (
                  <img
                    src={portraitAsset.publicUrl}
                    alt={`${characterSheet?.name ?? character.name} ${PORTRAIT_LABELS[portraitView]}`}
                    className="h-72 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-72 w-full items-center justify-center bg-gradient-to-br from-shadow-900 via-midnight-800 to-shadow-900 text-5xl font-bold text-shadow-200">
                    {character.avatar ? character.avatar : fallbackInitials || '—'}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-shadow-950/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-shadow-100">
                  {portraitAsset ? PORTRAIT_LABELS[portraitView] : 'Portrait'}
                </div>
                {canCyclePortrait ? (
                  <div className="absolute top-3 right-3 rounded-full bg-shadow-900/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-shadow-100">
                    Tap to view {nextPortraitLabel}
                  </div>
                ) : null}
              </button>
              <div>
                <h3 className={`${sectionTitleClasses} mb-3`}>Profile</h3>
                <dl className="grid grid-cols-1 gap-2 text-sm">
                  {quickFacts.map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-baseline justify-between gap-4 rounded-lg border border-shadow-800 bg-shadow-950/50 px-3 py-2"
                    >
                      <dt className="text-xs uppercase tracking-wide text-shadow-400">{label}</dt>
                      <dd className="text-right font-semibold text-shadow-50">{value}</dd>
                    </div>
                  ))}
                  {quickFacts.length === 0 ? (
                    <p className="text-sm text-shadow-300">Profile details will appear when available.</p>
                  ) : null}
                </dl>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-3">
                <h3 className={sectionTitleClasses}>Combat Snapshot</h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <InfoTile
                    label="Hit Points"
                    value={`${character.hp}/${character.maxHp}`}
                    hint={character.tempHp > 0 ? `+${character.tempHp} temporary` : undefined}
                  />
                  <InfoTile label="Armor Class" value={character.armorClass} />
                  <InfoTile
                    label="Speed"
                    value={`${character.speed} ft`}
                    hint={`${character.movementRemaining} ft remaining`}
                  />
                  <InfoTile label="Reach" value={`${character.reach * 5} ft`} />
                  <InfoTile label="Proficiency" value={`+${character.proficiencyBonus}`} />
                  {character.deathSaves ? (
                    <InfoTile
                      label="Death Saves"
                      value={`${character.deathSaves.successes} success`}
                      hint={`${character.deathSaves.failures} failure`}
                    />
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-4">
                <div>
                  <h3 className={sectionTitleClasses}>Turn Economy</h3>
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
            </div>
          </section>

          <section className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4">
            <h3 className={`${sectionTitleClasses} mb-4`}>Ability Grid</h3>
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

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-4">
              <div>
                <h3 className={sectionTitleClasses}>Skills & Expertise</h3>
                {sortedSkills.length > 0 ? (
                  <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {sortedSkills.map((skill) => (
                      <SkillBadge key={skill.name} skill={skill} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-shadow-300">
                    Skills will populate once the character sheet is synced.
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Expertises</h4>
                {expertises.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {expertises.map((expertise) => (
                      <span
                        key={expertise}
                        className="rounded-full border border-nebula-400/50 bg-nebula-500/20 px-3 py-1 text-xs font-semibold text-nebula-100"
                      >
                        {expertise}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-shadow-300">No expertises recorded yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-4">
              <div>
                <h3 className={sectionTitleClasses}>Spellcasting</h3>
                {hasSpellcastingContent ? (
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoTile label="Class" value={spellcasting?.class || '—'} />
                      <InfoTile label="Casting Ability" value={spellcasting?.ability || '—'} />
                      <InfoTile label="Save DC" value={spellcasting?.saveDC ?? '—'} />
                      <InfoTile
                        label="Attack Bonus"
                        value={spellcasting ? formatSigned(spellcasting.attackBonus) : '—'}
                      />
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
                        <h4 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">
                          Spells Known
                        </h4>
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
                        <h4 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">
                          Spell Slots
                        </h4>
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
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-3">
              <h3 className={sectionTitleClasses}>Talents & Features</h3>
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
                <h3 className={sectionTitleClasses}>Resources & Progression</h3>
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
                  <h4 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">
                    Advancement Points
                  </h4>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <InfoTile label="Ability" value={advancementPoints.ability} />
                    <InfoTile label="Skill" value={advancementPoints.skill} />
                    <InfoTile label="Talent" value={advancementPoints.talent} />
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-3">
              <h3 className={sectionTitleClasses}>Equipment & Inventory</h3>
              <dl className="space-y-2 text-sm text-shadow-200">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-shadow-400">Equipment</dt>
                  <dd className="font-semibold text-shadow-50">{characterSheet?.equipmentDescription || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-shadow-400">Proficiencies & Languages</dt>
                  <dd className="font-semibold text-shadow-50">{characterSheet?.proficienciesAndLanguages || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-shadow-400">Features</dt>
                  <dd className="font-semibold text-shadow-50">{characterSheet?.features || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-shadow-400">Treasure</dt>
                  <dd className="font-semibold text-shadow-50">{characterSheet?.treasure || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-shadow-400">Currency</dt>
                  <dd className="font-semibold text-shadow-50">{currencyDisplay}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-3">
              <h3 className={sectionTitleClasses}>Appearance</h3>
              {appearanceEntries.length > 0 ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {appearanceEntries.map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs uppercase tracking-wide text-shadow-400">{formatLabel(key)}</dt>
                      <dd className="font-semibold text-shadow-50">{value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-shadow-300">Appearance details unavailable.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className={sectionTitleClasses}>Background</h3>
                <dl className="mt-3 space-y-2 text-sm text-shadow-200">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-shadow-400">Origin</dt>
                    <dd className="font-semibold text-shadow-50">{backgroundDetails?.origin || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-shadow-400">Upbringing</dt>
                    <dd className="font-semibold text-shadow-50">{backgroundDetails?.upbringing || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-shadow-400">Motivation</dt>
                    <dd className="font-semibold text-shadow-50">{backgroundDetails?.motivation || '—'}</dd>
                  </div>
                </dl>
                {keyEvents.length > 0 ? (
                  <div className="mt-3">
                    <h4 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Key Events</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-shadow-300">
                      {keyEvents.map((event) => (
                        <li key={event}>{event}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {allies.length > 0 ? (
                  <div className="mt-3">
                    <h4 className="text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold">Allies</h4>
                    <p className="mt-1 text-sm text-shadow-200">{allies.join(', ')}</p>
                  </div>
                ) : null}
              </div>
              <div>
                <h3 className={sectionTitleClasses}>Personality</h3>
                <dl className="mt-3 space-y-2 text-sm text-shadow-200">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-shadow-400">Traits</dt>
                    <dd className="font-semibold text-shadow-50">{personality?.traits || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-shadow-400">Ideals</dt>
                    <dd className="font-semibold text-shadow-50">{personality?.ideals || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-shadow-400">Bonds</dt>
                    <dd className="font-semibold text-shadow-50">{personality?.bonds || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-shadow-400">Flaws</dt>
                    <dd className="font-semibold text-shadow-50">{personality?.flaws || '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div>
              <h3 className={sectionTitleClasses}>Backstory</h3>
              <div className="mt-3 rounded-2xl border border-shadow-800 bg-shadow-950/50 p-4 text-sm leading-relaxed text-shadow-100">
                {characterSheet?.backstory && characterSheet.backstory.trim().length > 0
                  ? characterSheet.backstory
                  : 'No backstory has been recorded yet.'}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
