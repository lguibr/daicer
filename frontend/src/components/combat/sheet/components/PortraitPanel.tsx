import { useMemo, useState } from 'react';
import type { CharacterSheet } from '@daicer/engine';
import type { CombatCharacter } from '../../../../types/combat';
import { PORTRAIT_LABELS, type PortraitView, SECTION_TITLE_CLASSES } from '../utils';

interface PortraitPanelProps {
  character: CombatCharacter;
  characterSheet?: CharacterSheet | null;
}

export function PortraitPanel({ character, characterSheet }: PortraitPanelProps) {
  const [internalView, setInternalView] = useState<PortraitView>('portrait');

  const availablePortraitViews = useMemo(() => {
    if (!characterSheet?.avatarAssets) return [];
    return ['portrait'] as PortraitView[]; // avatarAssets is single asset, not multiple views
  }, [characterSheet]);

  // Derived state: ensure current view is valid
  const portraitView = availablePortraitViews.includes(internalView)
    ? internalView
    : (availablePortraitViews[0] ?? 'portrait');

  const portraitAsset = useMemo(() => {
    if (!characterSheet?.avatarAssets) return null;
    return characterSheet.avatarAssets.publicUrl ? characterSheet.avatarAssets : null;
  }, [characterSheet]);

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
      setInternalView(nextView);
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

  return (
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
        <h3 className={`${SECTION_TITLE_CLASSES} mb-3`}>Profile</h3>
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
  );
}
