import { useMemo } from 'react';
import type { EntitySheet } from '@daicer/engine';
import { SECTION_TITLE_CLASSES } from '../utils';
import { SkillBadge } from './SharedComponents';

export function SkillsPanel({ characterSheet }: { characterSheet?: EntitySheet | null }) {
  const sortedSkills = useMemo(() => {
    const skills = characterSheet?.skillDetails ?? [];
    return [...skills].sort((a, b) => a.name.localeCompare(b.name));
  }, [characterSheet?.skillDetails]);

  const expertises = characterSheet?.expertises ?? [];

  return (
    <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-4">
      <div>
        <h3 className={SECTION_TITLE_CLASSES}>Skills & Expertise</h3>
        {sortedSkills.length > 0 ? (
          <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {sortedSkills.map((skill) => (
              <SkillBadge key={skill.name} skill={skill} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-shadow-300">Skills will populate once the character sheet is synced.</p>
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
  );
}
