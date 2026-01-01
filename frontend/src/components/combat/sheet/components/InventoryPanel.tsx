import type { CharacterSheet } from '@daicer/engine';
import { SECTION_TITLE_CLASSES } from '../utils';

export function InventoryPanel({ characterSheet }: { characterSheet?: CharacterSheet | null }) {
  const currency = characterSheet?.currency ?? null;
  const currencyDisplay = currency
    ? `CP ${currency.cp} • SP ${currency.sp} • EP ${currency.ep} • GP ${currency.gp} • PP ${currency.pp}`
    : '—';

  return (
    <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-3">
      <h3 className={SECTION_TITLE_CLASSES}>Equipment & Inventory</h3>
      <dl className="space-y-2 text-sm text-shadow-200">
        <div>
          <dt className="text-xs uppercase tracking-wide text-shadow-400">Equipment</dt>
          <dd className="font-semibold text-shadow-50">
            {characterSheet?.equipment && characterSheet.equipment.length > 0
              ? `${characterSheet.equipment.length} items`
              : 'Empty'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-shadow-400">Features</dt>
          <dd className="font-semibold text-shadow-50">
            {characterSheet?.features && characterSheet.features.length > 0
              ? `${characterSheet.features.length} features`
              : 'None'}
          </dd>
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
  );
}
