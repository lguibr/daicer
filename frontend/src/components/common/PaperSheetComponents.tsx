import type { SkillDetail } from '../../types/models';

// Paper Theme Styles
export const paperStyles = {
  sheet: 'bg-shadow-100 text-shadow-900 font-serif relative overflow-hidden shadow-2xl',
  texture:
    'absolute inset-0 opacity-10 pointer-events-none bg-[url("https://www.transparenttextures.com/patterns/aged-paper.png")]',
  header: 'font-display uppercase tracking-widest text-shadow-800 border-b-2 border-shadow-800/20 pb-1 mb-2',
  box: 'border-2 border-shadow-800/20 bg-shadow-50/50 p-2',
  label: 'font-display text-[10px] uppercase tracking-wider text-shadow-600 font-bold',
  value: 'font-display font-bold text-shadow-900',
  redInk: 'text-red-900/80',
};

export const formatModifier = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

interface StatBoxProps {
  label: string;
  value: string | number;
  subtext?: string;
  big?: boolean;
}

export function StatBox({ label, value, subtext, big = false }: StatBoxProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-shadow-800/30 bg-shadow-50/40 ${big ? 'p-3 aspect-square' : 'p-2'}`}
    >
      <span className={`${paperStyles.label} ${big ? 'text-xs' : ''}`}>{label}</span>
      <span className={`${paperStyles.value} ${big ? 'text-3xl' : 'text-xl'}`}>{value}</span>
      {subtext && <span className="text-[10px] italic text-shadow-500 font-serif mt-1">{subtext}</span>}
    </div>
  );
}

interface AttributeBoxProps {
  label: string;
  score: number;
}

export function AttributeBox({ label, score }: AttributeBoxProps) {
  const mod = Math.floor((score - 10) / 2);
  return (
    <div className="flex flex-col items-center">
      <div className="font-display font-bold text-sm text-shadow-700 uppercase tracking-widest mb-1">
        {label.slice(0, 3)}
      </div>
      <div className="relative flex flex-col items-center justify-center w-20 h-24 border-[3px] border-double border-shadow-800/40 bg-shadow-50/60 rounded-t-xl rounded-b-3xl shadow-sm">
        <span className="text-3xl font-bold font-display text-shadow-900">{formatModifier(mod)}</span>
        <div className="w-10 h-10 mt-1 flex items-center justify-center rounded-full border border-shadow-400 bg-white/50">
          <span className="text-sm font-semibold text-shadow-600">{score}</span>
        </div>
      </div>
    </div>
  );
}

interface SkillRowProps {
  skill: SkillDetail;
}

export function SkillRow({ skill }: SkillRowProps) {
  const isProficient = skill.proficiency !== 'none';
  return (
    <div
      className={`flex items-center justify-between py-1 border-b border-shadow-800/10 ${isProficient ? 'font-semibold bg-shadow-200/30' : ''} px-2`}
    >
      <div className="flex items-center gap-2">
        <span className="w-4 text-center text-[10px] text-shadow-800 font-bold">{isProficient ? '●' : '○'}</span>
        <span className="text-sm text-shadow-900">
          {skill.name} <span className="text-[10px] text-shadow-500 ml-1">({skill.ability.slice(0, 3)})</span>
        </span>
      </div>
      <span className="text-sm font-display text-shadow-900 font-semibold">{formatModifier(skill.modifier)}</span>
    </div>
  );
}

export function PaperBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      }}
    />
  );
}
