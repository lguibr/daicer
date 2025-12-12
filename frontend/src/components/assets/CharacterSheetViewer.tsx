/**
 * CharacterSheetViewer Component
 * Read-only character sheet display with interactive zoomable portrait
 * Portrait cycles through: Portrait → Upper → Full → Portrait
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

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
  // Use characterData as form for accessing other fields
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
    // Handle both lowercase and Title Case keys, preferring lowercase
    const attrs = form.attributes || {};
    return attrs[key] ?? attrs[key.toLowerCase()] ?? 10;
  };

  const handlePortraitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => ((prev + 1) % 3) as ZoomLevel);
  };

  const currentUrl = zoomLevel === 0 ? portraitUrl : zoomLevel === 1 ? upperBodyUrl : fullBodyUrl;

  const currentStyle = {
    height: zoomLevel === 0 ? '300px' : zoomLevel === 1 ? '450px' : '600px',
  };

  // Processing proficiencies and features
  const prof = Array.isArray(form.proficienciesAndLanguages)
    ? form.proficienciesAndLanguages
    : form.proficienciesAndLanguages
      ? form.proficienciesAndLanguages.split(', ')
      : [];

  const features = Array.isArray(form.features) ? form.features : form.features ? form.features.split('\n') : [];

  // Skills processing
  const skillsList = Object.entries(form.skills || {});

  const proficiencyBonus = Math.ceil(1 + (level || 1) / 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-900/95 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-6xl border-accent/30 bg-gradient-to-br from-midnight-900/95 via-midnight-800/95 to-midnight-700/95 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-accent/30 bg-midnight-900/90 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-serif font-bold text-white mb-1">{name}</h1>
              <p className="text-lg text-shadow-300">
                {t('common.level', 'Level')} {level} {race} {characterClass}
              </p>
              <p className="text-sm text-shadow-400 italic">{alignment}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-shadow-300 hover:text-white">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Portrait */}
          <div className="lg:col-span-1">
            <div
              className="relative cursor-pointer group"
              onClick={handlePortraitClick}
              title={t('viewer.clickToZoom', 'Click to zoom portrait')}
            >
              <div
                className="overflow-hidden rounded-xl border-4 border-accent/50 hover:border-accent transition-all duration-300 hover:shadow-lg flex items-center justify-center bg-black"
                style={{ height: currentStyle?.height }}
              >
                <img
                  src={currentUrl}
                  alt={name}
                  className="max-w-full max-h-full object-contain transition-all duration-300"
                />
              </div>

              {/* Zoom indicator */}
              <div className="absolute bottom-2 right-2 bg-midnight-900/80 px-3 py-1 rounded-full text-xs text-shadow-300 border border-accent/30 opacity-0 group-hover:opacity-100 transition-opacity">
                {zoomLevel === 0 && `📷 ${t('viewer.portrait', 'Portrait')}`}
                {zoomLevel === 1 && `👤 ${t('viewer.upper', 'Upper')}`}
                {zoomLevel === 2 && `🧍 ${t('viewer.full', 'Full')}`}
              </div>

              {/* Click hint */}
              <div className="mt-2 text-center text-xs text-shadow-500 italic">
                {t('viewer.clickHint', 'Click portrait to cycle zoom')}
              </div>
            </div>

            {/* Background */}
            {form.background && (
              <Card className="mt-4 p-4 bg-midnight-800/50 border-accent/20">
                <h3 className="text-sm font-semibold text-accent mb-2">{t('character.background', 'Background')}</h3>
                <p className="text-sm text-shadow-300">{form.background}</p>
              </Card>
            )}
          </div>

          {/* Right Column: Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Core Stats */}
            <Card className="p-4 bg-midnight-800/50 border-accent/20">
              <h2 className="text-lg font-semibold text-accent mb-3">{t('viewer.coreStats', 'Core Stats')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-midnight-900/50 rounded-lg">
                  <div className="text-xs text-shadow-400 mb-1">{t('character.hp', 'HP')}</div>
                  <div className="text-2xl font-bold text-white">
                    {form.resourcePools?.find((p) => p.name === 'HP')?.current ?? 10}
                  </div>
                </div>
                <div className="text-center p-3 bg-midnight-900/50 rounded-lg">
                  <div className="text-xs text-shadow-400 mb-1">{t('character.ac', 'AC')}</div>
                  <div className="text-2xl font-bold text-white">
                    {10 + parseInt(getModifier(getAttr('dexterity')), 10)}
                  </div>
                </div>
                <div className="text-center p-3 bg-midnight-900/50 rounded-lg">
                  <div className="text-xs text-shadow-400 mb-1">{t('character.initiative', 'Initiative')}</div>
                  <div className="text-2xl font-bold text-white">{getModifier(getAttr('dexterity'))}</div>
                </div>
                <div className="text-center p-3 bg-midnight-900/50 rounded-lg">
                  <div className="text-xs text-shadow-400 mb-1">{t('character.speed', 'Speed')}</div>
                  <div className="text-2xl font-bold text-white">30 ft</div>
                </div>
              </div>
              <div className="mt-3 text-center p-2 bg-accent/10 rounded-lg">
                <span className="text-xs text-shadow-400">
                  {t('character.proficiencyBonus', 'Proficiency Bonus')}:{' '}
                </span>
                <span className="text-sm font-bold text-accent">+{proficiencyBonus}</span>
              </div>
            </Card>

            {/* Ability Scores */}
            <Card className="p-4 bg-midnight-800/50 border-accent/20">
              <h2 className="text-lg font-semibold text-accent mb-3">
                {t('character.abilityScores', 'Ability Scores')}
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { name: t('stats.str', 'STR'), key: 'strength' },
                  { name: t('stats.dex', 'DEX'), key: 'dexterity' },
                  { name: t('stats.con', 'CON'), key: 'constitution' },
                  { name: t('stats.int', 'INT'), key: 'intelligence' },
                  { name: t('stats.wis', 'WIS'), key: 'wisdom' },
                  { name: t('stats.cha', 'CHA'), key: 'charisma' },
                ].map(({ name: abbr, key }) => {
                  const score = getAttr(key);
                  return (
                    <div key={key} className="text-center p-3 bg-midnight-900/50 rounded-lg">
                      <div className="text-xs text-shadow-400 mb-1">{abbr}</div>
                      <div className="text-xl font-bold text-white">{score}</div>
                      <div className="text-sm text-accent">{getModifier(score)}</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Skills */}
            {skillsList.length > 0 && (
              <Card className="p-4 bg-midnight-800/50 border-accent/20">
                <h2 className="text-lg font-semibold text-accent mb-3">{t('character.skills', 'Skills')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {skillsList.map(([skill, bonus]) => (
                    <div key={skill} className="flex items-center gap-2 p-2 bg-midnight-900/50 rounded text-sm">
                      <span className="text-accent">★</span>
                      <span className="text-shadow-200 capitalize">{skill}</span>
                      <span className="text-shadow-400 ml-auto">{bonus > 0 ? `+${bonus}` : bonus}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Expertises */}
            {form.expertises && form.expertises.length > 0 && (
              <Card className="p-4 bg-midnight-800/50 border-accent/20">
                <h2 className="text-lg font-semibold text-accent mb-3">{t('character.expertises', 'Expertises')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {form.expertises.map((expertise: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-midnight-900/50 rounded text-sm">
                      <span className="text-accent">✦</span>
                      <span className="text-shadow-200 capitalize">{expertise}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Features & Traits Section */}
        <div className="px-6 pb-6">
          <Card className="p-4 bg-midnight-800/50 border-accent/20">
            <h2 className="text-lg font-semibold text-accent mb-3">
              {t('character.featuresTraits', 'Features & Traits')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Proficiencies & Languages */}
              {prof.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-shadow-200 mb-2">
                    {t('character.proficienciesLanguages', 'Proficiencies & Languages')}
                  </h3>
                  <div className="space-y-1">
                    {prof.map((item, idx) => (
                      <div key={idx} className="text-sm text-shadow-300 flex items-center gap-2">
                        <span className="text-accent">•</span>
                        <span className="capitalize">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {features.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-shadow-200 mb-2">{t('character.features', 'Features')}</h3>
                  <div className="space-y-1">
                    {features.map((feature, idx) => (
                      <div key={idx} className="text-sm text-shadow-300 flex items-center gap-2">
                        <span className="text-accent">•</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Equipment */}
            {form.equipment && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-shadow-200 mb-2">{t('character.equipment', 'Equipment')}</h3>
                <p className="text-sm text-shadow-300 whitespace-pre-wrap">{form.equipment}</p>
              </div>
            )}

            {/* Appearance & Personality */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.appearance && (
                <div>
                  <h3 className="text-sm font-semibold text-shadow-200 mb-2">
                    {t('character.appearance', 'Appearance')}
                  </h3>
                  <div className="text-xs text-shadow-300 space-y-1">
                    {form.appearance.age && (
                      <p>
                        <span className="text-accent">{t('character.age', 'Age')}:</span> {form.appearance.age}
                      </p>
                    )}
                    {form.appearance.height && (
                      <p>
                        <span className="text-accent">{t('character.height', 'Height')}:</span> {form.appearance.height}
                      </p>
                    )}
                    {form.appearance.weight && (
                      <p>
                        <span className="text-accent">{t('character.weight', 'Weight')}:</span> {form.appearance.weight}
                      </p>
                    )}
                    {form.appearance.eyes && (
                      <p>
                        <span className="text-accent">{t('character.eyes', 'Eyes')}:</span> {form.appearance.eyes}
                      </p>
                    )}
                    {form.appearance.skin && (
                      <p>
                        <span className="text-accent">{t('character.skin', 'Skin')}:</span> {form.appearance.skin}
                      </p>
                    )}
                    {form.appearance.hair && (
                      <p>
                        <span className="text-accent">{t('character.hair', 'Hair')}:</span> {form.appearance.hair}
                      </p>
                    )}
                    {form.appearance.description && <p className="mt-2">{form.appearance.description}</p>}
                  </div>
                </div>
              )}

              {form.personality && (
                <div>
                  <h3 className="text-sm font-semibold text-shadow-200 mb-2">
                    {t('character.personality', 'Personality')}
                  </h3>
                  <div className="text-xs text-shadow-300 space-y-2">
                    {form.personality.traits && (
                      <p>
                        <span className="text-accent">{t('character.traits', 'Traits')}:</span>{' '}
                        {form.personality.traits}
                      </p>
                    )}
                    {form.personality.ideals && (
                      <p>
                        <span className="text-accent">{t('character.ideals', 'Ideals')}:</span>{' '}
                        {form.personality.ideals}
                      </p>
                    )}
                    {form.personality.bonds && (
                      <p>
                        <span className="text-accent">{t('character.bonds', 'Bonds')}:</span> {form.personality.bonds}
                      </p>
                    )}
                    {form.personality.flaws && (
                      <p>
                        <span className="text-accent">{t('character.flaws', 'Flaws')}:</span> {form.personality.flaws}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}
