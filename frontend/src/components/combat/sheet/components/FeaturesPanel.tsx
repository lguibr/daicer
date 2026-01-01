import type { CharacterSheet } from '@daicer/engine';
import { SECTION_TITLE_CLASSES } from '../utils';

export function FeaturesPanel({ characterSheet }: { characterSheet?: CharacterSheet | null }) {
  // Features are now the primary list.
  const features = characterSheet?.features ?? [];

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-3">
        <h3 className={SECTION_TITLE_CLASSES}>Features & Traits</h3>
        {features.length > 0 ? (
          <div className="space-y-2">
            {features.map((feature, idx) => (
              <div
                key={`${feature.name}-${idx}`}
                className="rounded-xl border border-shadow-800 bg-shadow-950/40 p-3 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-shadow-50">{feature.name}</span>
                  {feature.usage && (
                    <span className="text-xs uppercase tracking-wide text-aurora-300">
                      {feature.usage.max} / {feature.usage.per}
                    </span>
                  )}
                </div>
                <p className="text-sm text-shadow-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-shadow-300">No features gathered yet.</p>
        )}
      </div>
    </section>
  );
}
