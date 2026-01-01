import type { CharacterSheet } from '@daicer/engine';
import { SECTION_TITLE_CLASSES } from '../utils';

export function SpellcastingPanel({ characterSheet }: { characterSheet?: CharacterSheet | null }) {
  // Placeholder until Spellcasting is properly re-implemented with new Schema
  if (!characterSheet) return null;

  return (
    <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-4">
      <div>
        <h3 className={SECTION_TITLE_CLASSES}>Spellcasting</h3>
        <p className="mt-3 text-sm text-shadow-300">Spellcasting module pending update Phase 5.2</p>
      </div>
    </div>
  );
}
