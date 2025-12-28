import type { CharacterSheet } from '@daicer/engine';
import { SECTION_TITLE_CLASSES, formatLabel } from '../utils';

export function AppearancePanel({ characterSheet }: { characterSheet?: CharacterSheet | null }) {
  const appearanceEntries = characterSheet?.appearance ? Object.entries(characterSheet.appearance) : [];

  return (
    <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-3">
      <h3 className={SECTION_TITLE_CLASSES}>Appearance</h3>
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
  );
}
