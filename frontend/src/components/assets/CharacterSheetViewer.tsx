import { useState } from 'react';
import { useI18n } from '../../i18n';
import { PaperBackground, StatBox, AttributeBox, paperStyles } from '../common/PaperSheetComponents';

// Define minimal interface to avoid dependency issues if shared types are tricky to locate
interface CharacterSheetMinimal {
  name: string;
  race: string;
  characterClass: string;
  level: number;
  alignment: string;
  background: string;
  attributes: Record<string, number>;
  resourcePools: Array<{ name: string; current: number; max: number }>;
  skills: Record<string, number>;
  expertises: string[];
  proficienciesAndLanguages: string | string[]; // Can be string or array
  features: string | string[]; // Can be string or array
  equipment: string;
  appearance: {
    age?: string;
    height?: string;
    weight?: string;
    eyes?: string;
    skin?: string;
    hair?: string;
    description?: string;
  };
  personality: {
    traits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
  };
  avatarAssets?: {
    portraitUrl?: string;
    upperBodyUrl?: string;
    fullBodyUrl?: string;
  } | null;
}

interface CharacterSheetViewerProps {
  characterData: CharacterSheetMinimal;
  onClose: () => void;
}

type ZoomLevel = 0 | 1 | 2;

export function CharacterSheetViewer({ characterData, onClose }: CharacterSheetViewerProps) {
  const { t } = useI18n();
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(0);

  const { name, level, race, characterClass, alignment, avatarAssets } = characterData;
  const form = characterData;

  // Portrait logic
  const portraitUrl = avatarAssets?.portraitUrl || 'https://via.placeholder.com/300x300?text=No+Portrait';
  const upperBodyUrl = avatarAssets?.upperBodyUrl || portraitUrl;
  const fullBodyUrl = avatarAssets?.fullBodyUrl || upperBodyUrl;

  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const getAttr = (key: string) => {
    const attrs = form.attributes || {};
    return attrs[key] ?? attrs[key.toLowerCase()] ?? 10;
  };

  const handlePortraitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => ((prev + 1) % 3) as ZoomLevel);
  };

  const currentUrl = zoomLevel === 0 ? portraitUrl : zoomLevel === 1 ? upperBodyUrl : fullBodyUrl;

  const prof = Array.isArray(form.proficienciesAndLanguages)
    ? form.proficienciesAndLanguages
    : form.proficienciesAndLanguages
      ? form.proficienciesAndLanguages.split(', ')
      : [];

  const features = Array.isArray(form.features) ? form.features : form.features ? form.features.split('\n') : [];

  const skillsList = Object.entries(form.skills || {});
  const proficiencyBonus = Math.ceil(1 + (level || 1) / 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[1000px] min-h-[90vh] bg-[#fdfbf7] shadow-2xl overflow-hidden rounded-sm flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <PaperBackground />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-shadow-800 hover:text-red-800 transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* LEFT COLUMN: Stats & Skills */}
        <div className="w-full md:w-1/3 bg-[#f5f0e6] border-r-2 border-shadow-800/10 p-6 flex flex-col gap-6 relative z-10">
          {/* Attributes */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-4 justify-items-center">
            {[
              { label: 'Strength', key: 'strength' },
              { label: 'Dexterity', key: 'dexterity' },
              { label: 'Constitution', key: 'constitution' },
              { label: 'Intelligence', key: 'intelligence' },
              { label: 'Wisdom', key: 'wisdom' },
              { label: 'Charisma', key: 'charisma' },
            ].map((attr) => (
              <AttributeBox key={attr.key} label={attr.label} score={getAttr(attr.key)} />
            ))}
          </div>

          <div className="h-px w-full bg-shadow-800/20 my-2" />

          {/* Skills */}
          {skillsList.length > 0 && (
            <div className="flex-1">
              <h3 className={paperStyles.header}>{t('character.skills', 'Skills')}</h3>
              <div className="flex flex-col text-sm space-y-1">
                {skillsList.map(([skill, bonus]) => (
                  <div
                    key={skill}
                    className="flex justify-between items-center border-b border-shadow-800/10 py-1 px-1"
                  >
                    <span className="text-shadow-900 capitalize">{skill}</span>
                    <span className="font-display font-bold text-shadow-900">{bonus >= 0 ? `+${bonus}` : bonus}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expertises */}
          {form.expertises && form.expertises.length > 0 && (
            <div className="mt-4">
              <h3 className={paperStyles.header}>{t('character.expertises', 'Expertises')}</h3>
              <div className="flex flex-wrap gap-2">
                {form.expertises.map((exp, idx) => (
                  <span
                    key={idx}
                    className="text-xs text-shadow-800 bg-shadow-200/50 px-2 py-1 rounded-sm border border-shadow-800/20"
                  >
                    ★ {exp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full md:w-2/3 p-8 flex flex-col gap-6 relative z-10 bg-[#fdfbf7]">
          {/* Header */}
          <header className="flex flex-col border-b-4 border-double border-shadow-800/30 pb-4">
            <div className="flex justify-between items-end mb-2">
              <h1 className="text-5xl font-display font-bold text-shadow-900 tracking-wider capitalize">{name}</h1>
              <div className="text-right">
                <span className="font-display font-bold text-2xl text-shadow-800">Level {level}</span>
              </div>
            </div>
            <div className="flex gap-4 text-lg font-serif italic text-shadow-700">
              <span>
                {race} {characterClass}
              </span>
              <span>•</span>
              <span>{alignment}</span>
              <span>•</span>
              <span>{form.background}</span>
            </div>
          </header>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Portrait */}
            <div
              className="w-full sm:w-48 h-64 shrink-0 relative group cursor-pointer"
              onClick={handlePortraitClick}
              title={t('viewer.clickToZoom', 'Click to zoom')}
            >
              <div className="absolute inset-0 border-4 border-shadow-800/40 rotate-1 rounded-sm bg-shadow-200" />
              <div className="absolute inset-0 border-4 border-shadow-800/40 -rotate-1 rounded-sm bg-gray-200 overflow-hidden">
                <img src={currentUrl} alt={name} className="w-full h-full object-cover sepia-[0.2]" />
              </div>
              {/* Zoom Hint */}
              <div className="absolute bottom-2 right-2 text-[10px] bg-shadow-100/80 px-1 border border-shadow-800/20 opacity-0 group-hover:opacity-100 transition-opacity">
                {zoomLevel === 0 ? 'Portrait' : zoomLevel === 1 ? 'Upper' : 'Full'}
              </div>
            </div>

            {/* Vitals */}
            <div className="flex-1 grid grid-cols-3 gap-3 self-start">
              <div className="col-span-1">
                <StatBox label="Armor Class" value={10 + parseInt(getModifier(getAttr('dexterity')), 10)} big />
              </div>
              <div className="col-span-1">
                <StatBox label="Initiative" value={getModifier(getAttr('dexterity'))} big />
              </div>
              <div className="col-span-1">
                <StatBox label="Speed" value="30 ft" big />
              </div>

              <div className="col-span-3 border-2 border-shadow-800/30 bg-shadow-50/40 p-3 flex justify-between items-center rounded-sm">
                <div className="flex flex-col">
                  <span className={paperStyles.label}>Hit Points</span>
                  <span className="text-4xl font-display font-bold text-shadow-900">
                    {form.resourcePools?.find((p) => p.name === 'HP')?.current ?? 10}
                  </span>
                </div>
                <div className="flex flex-col items-end text-shadow-500">
                  <span className="text-xs uppercase tracking-wider">Max HP</span>
                  <span className="text-xl font-display font-bold">
                    {form.resourcePools?.find((p) => p.name === 'HP')?.max ?? 10}
                  </span>
                </div>
              </div>

              <div className="col-span-1">
                <StatBox label="Prof. Bonus" value={`+${proficiencyBonus}`} />
              </div>
            </div>
          </div>

          {/* Features & Proficiencies (Languages) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <div className="flex flex-col gap-4">
              <div className="border-2 border-shadow-800/20 p-4 h-full bg-shadow-50/20 rounded-sm">
                <h3 className={paperStyles.header}>{t('character.features', 'Features')}</h3>
                <div className="text-sm font-serif leading-relaxed text-shadow-900 whitespace-pre-line">
                  {features.length > 0 ? features.join('\n') : '—'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Proficiencies */}
              <div className="border-2 border-shadow-800/20 p-4 bg-shadow-50/20 rounded-sm">
                <h3 className={paperStyles.header}>{t('character.proficienciesLanguages', 'Proficiencies')}</h3>
                <div className="text-sm font-serif leading-relaxed text-shadow-900">
                  {prof.length > 0 ? prof.join(', ') : '—'}
                </div>
              </div>

              {/* Equipment */}
              <div className="border-2 border-shadow-800/20 p-4 bg-shadow-50/20 rounded-sm flex-1">
                <h3 className={paperStyles.header}>{t('character.equipment', 'Equipment')}</h3>
                <div className="text-sm font-serif leading-relaxed text-shadow-900 whitespace-pre-line">
                  {form.equipment || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer: Personality */}
          {form.personality && (
            <div className="border-t-2 border-shadow-800/10 pt-4 flex gap-4 text-xs italic text-shadow-600">
              {form.personality.traits && (
                <div className="flex-1">
                  <strong>{t('character.traits', 'Traits')}:</strong> {form.personality.traits}
                </div>
              )}
              {form.personality.ideals && (
                <div className="flex-1">
                  <strong>{t('character.ideals', 'Ideals')}:</strong> {form.personality.ideals}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
