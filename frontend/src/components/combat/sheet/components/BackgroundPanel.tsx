import type { EntitySheet } from '@daicer/engine';
import { SECTION_TITLE_CLASSES } from '../utils';

export function BackgroundPanel({ characterSheet }: { characterSheet?: EntitySheet | null }) {
  const backgroundDetails = characterSheet?.backgroundDetails ?? null;
  const keyEvents = backgroundDetails?.keyEvents ?? [];
  const allies = backgroundDetails?.allies ?? [];
  const personality = characterSheet?.personality ?? null;

  return (
    <section className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className={SECTION_TITLE_CLASSES}>Background</h3>
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
          <h3 className={SECTION_TITLE_CLASSES}>Personality</h3>
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
        <h3 className={SECTION_TITLE_CLASSES}>Backstory</h3>
        <div className="mt-3 rounded-2xl border border-shadow-800 bg-shadow-950/50 p-4 text-sm leading-relaxed text-shadow-100">
          {characterSheet?.backstory && characterSheet.backstory.trim().length > 0
            ? characterSheet.backstory
            : 'No backstory has been recorded yet.'}
        </div>
      </div>
    </section>
  );
}
