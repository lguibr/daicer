import type { ReactNode } from 'react';
import type { EntitySheet, SkillDetail } from '@daicer/engine';
import { PROFICIENCY_LABEL_MAP, PROFICIENCY_STYLE_MAP, formatModifier } from '../utils';

type InfoTileProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
};

export function InfoTile({ label, value, hint }: InfoTileProps) {
  return (
    <div className="rounded-xl border border-shadow-800 bg-shadow-950/60 p-3">
      <p className="text-xs uppercase tracking-wide text-shadow-400">{label}</p>
      <p className="text-lg font-semibold text-shadow-50">{value}</p>
      {hint ? <p className="text-xs text-shadow-300 mt-1">{hint}</p> : null}
    </div>
  );
}

type ResourcePool = CharacterSheet['resources'][number];

export function ResourceTile({ pool }: { pool: ResourcePool }) {
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

export function SkillBadge({ skill }: { skill: SkillDetail }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-shadow-800 bg-shadow-950/50 px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-shadow-50">{skill.name}</p>
        <p className="text-xs text-shadow-400">{skill.ability}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-aurora-200">{formatModifier(skill.modifier)}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${PROFICIENCY_STYLE_MAP[skill.proficiency]}`}>
          {PROFICIENCY_LABEL_MAP[skill.proficiency]}
        </span>
      </div>
    </div>
  );
}
