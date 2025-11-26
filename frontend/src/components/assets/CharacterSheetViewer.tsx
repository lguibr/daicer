/**
 * CharacterSheetViewer Component
 * Read-only character sheet display with interactive zoomable portrait
 * Portrait cycles through: Portrait → Upper → Full → Portrait
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { CharacterSheetAsset } from '../room/character-creation/characterSheetAsset';

interface CharacterSheetViewerProps {
  characterData: CharacterSheetAsset;
  onClose: () => void;
}

type ZoomLevel = 0 | 1 | 2; // 0 = portrait, 1 = upper, 2 = full

export function CharacterSheetViewer({ characterData, onClose }: CharacterSheetViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(0);

  const { summary, form, avatarPreview } = characterData;
  const { name, race, characterClass, level, alignment } = summary;

  // Get URL for current zoom level
  const getAvatarUrl = (level: ZoomLevel): string => {
    if (!avatarPreview) return '/default-avatar.png';

    // Helper to get URL from preview image object
    const getUrl = (img?: { publicUrl?: string; data?: string; mimeType?: string }) => {
      if (img?.publicUrl) return img.publicUrl;
      if (img?.data) return `data:${img.mimeType || 'image/png'};base64,${img.data}`;
      return null;
    };

    const portrait = getUrl(avatarPreview.portrait);
    const upper = getUrl(avatarPreview.upperBody);
    const full = getUrl(avatarPreview.fullBody);

    // Return specific level or fallback
    if (level === 0) return portrait || upper || full || '/default-avatar.png';
    if (level === 1) return upper || full || portrait || '/default-avatar.png';
    if (level === 2) return full || upper || portrait || '/default-avatar.png';

    return '/default-avatar.png';
  };

  const currentUrl = getAvatarUrl(zoomLevel);

  // Cycle through zoom levels
  const handlePortraitClick = () => {
    setZoomLevel((prev) => ((prev + 1) % 3) as ZoomLevel);
  };

  // Zoom level styles - now just controlling height/container, not transforming the image
  const zoomStyles = [
    { height: '300px' }, // Portrait
    { height: '400px' }, // Upper
    { height: '500px' }, // Full
  ];

  const currentStyle = zoomStyles[zoomLevel] || zoomStyles[0];

  // Calculate ability modifiers
  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  // Get attributes (using the Record<Attribute, number> type)
  const attributes = form.attributes || {};
  const getAttr = (key: string) => (attributes as Record<string, number>)[key] ?? 10;

  const proficiencyBonus = Math.ceil(level / 4) + 1;

  // Get skills as array of entries
  const skills = form.skills ? Object.entries(form.skills).filter(([_, value]) => value > 0) : [];

  // Get proficiencies and languages as arrays
  const prof =
    form.proficienciesAndLanguages
      ?.split(',')
      .map((p) => p.trim())
      .filter(Boolean) || [];
  const features = form.features?.split('\n').filter(Boolean) || [];

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
                Level {level} {race} {characterClass}
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
            <div className="relative cursor-pointer group" onClick={handlePortraitClick} title="Click to zoom portrait">
              <div
                className="overflow-hidden rounded-xl border-4 border-accent/50 hover:border-accent transition-all duration-300 hover:shadow-lg flex items-center justify-center bg-black"
                style={{ height: currentStyle.height }}
              >
                <img
                  src={currentUrl}
                  alt={name}
                  className="max-w-full max-h-full object-contain transition-all duration-300"
                />
              </div>

              {/* Zoom indicator */}
              <div className="absolute bottom-2 right-2 bg-midnight-900/80 px-3 py-1 rounded-full text-xs text-shadow-300 border border-accent/30 opacity-0 group-hover:opacity-100 transition-opacity">
                {zoomLevel === 0 && '📷 Portrait'}
                {zoomLevel === 1 && '👤 Upper'}
                {zoomLevel === 2 && '🧍 Full'}
              </div>

              {/* Click hint */}
              <div className="mt-2 text-center text-xs text-shadow-500 italic">Click portrait to cycle zoom</div>
            </div>

            {/* Background */}
            {form.background && (
              <Card className="mt-4 p-4 bg-midnight-800/50 border-accent/20">
                <h3 className="text-sm font-semibold text-accent mb-2">Background</h3>
                <p className="text-sm text-shadow-300">{form.background}</p>
              </Card>
            )}
          </div>

          {/* Right Column: Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Core Stats */}
            <Card className="p-4 bg-midnight-800/50 border-accent/20">
              <h2 className="text-lg font-semibold text-accent mb-3">Core Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-midnight-900/50 rounded-lg">
                  <div className="text-xs text-shadow-400 mb-1">HP</div>
                  <div className="text-2xl font-bold text-white">
                    {form.resourcePools?.find((p) => p.name === 'HP')?.current ?? 10}
                  </div>
                </div>
                <div className="text-center p-3 bg-midnight-900/50 rounded-lg">
                  <div className="text-xs text-shadow-400 mb-1">AC</div>
                  <div className="text-2xl font-bold text-white">{10 + getModifier(getAttr('dexterity'))}</div>
                </div>
                <div className="text-center p-3 bg-midnight-900/50 rounded-lg">
                  <div className="text-xs text-shadow-400 mb-1">Initiative</div>
                  <div className="text-2xl font-bold text-white">{getModifier(getAttr('dexterity'))}</div>
                </div>
                <div className="text-center p-3 bg-midnight-900/50 rounded-lg">
                  <div className="text-xs text-shadow-400 mb-1">Speed</div>
                  <div className="text-2xl font-bold text-white">30 ft</div>
                </div>
              </div>
              <div className="mt-3 text-center p-2 bg-accent/10 rounded-lg">
                <span className="text-xs text-shadow-400">Proficiency Bonus: </span>
                <span className="text-sm font-bold text-accent">+{proficiencyBonus}</span>
              </div>
            </Card>

            {/* Ability Scores */}
            <Card className="p-4 bg-midnight-800/50 border-accent/20">
              <h2 className="text-lg font-semibold text-accent mb-3">Ability Scores</h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { name: 'STR', key: 'strength' },
                  { name: 'DEX', key: 'dexterity' },
                  { name: 'CON', key: 'constitution' },
                  { name: 'INT', key: 'intelligence' },
                  { name: 'WIS', key: 'wisdom' },
                  { name: 'CHA', key: 'charisma' },
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
            {skills.length > 0 && (
              <Card className="p-4 bg-midnight-800/50 border-accent/20">
                <h2 className="text-lg font-semibold text-accent mb-3">Skills</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {skills.map(([skill, bonus]) => (
                    <div key={skill} className="flex items-center gap-2 p-2 bg-midnight-900/50 rounded text-sm">
                      <span className="text-accent">★</span>
                      <span className="text-shadow-200 capitalize">{skill}</span>
                      <span className="text-shadow-400 ml-auto">+{bonus}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Expertises */}
            {form.expertises && form.expertises.length > 0 && (
              <Card className="p-4 bg-midnight-800/50 border-accent/20">
                <h2 className="text-lg font-semibold text-accent mb-3">Expertises</h2>
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
            <h2 className="text-lg font-semibold text-accent mb-3">Features & Traits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Proficiencies & Languages */}
              {prof.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-shadow-200 mb-2">Proficiencies & Languages</h3>
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
                  <h3 className="text-sm font-semibold text-shadow-200 mb-2">Features</h3>
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
                <h3 className="text-sm font-semibold text-shadow-200 mb-2">Equipment</h3>
                <p className="text-sm text-shadow-300 whitespace-pre-wrap">{form.equipment}</p>
              </div>
            )}

            {/* Appearance & Personality */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.appearance && (
                <div>
                  <h3 className="text-sm font-semibold text-shadow-200 mb-2">Appearance</h3>
                  <div className="text-xs text-shadow-300 space-y-1">
                    {form.appearance.age && (
                      <p>
                        <span className="text-accent">Age:</span> {form.appearance.age}
                      </p>
                    )}
                    {form.appearance.height && (
                      <p>
                        <span className="text-accent">Height:</span> {form.appearance.height}
                      </p>
                    )}
                    {form.appearance.weight && (
                      <p>
                        <span className="text-accent">Weight:</span> {form.appearance.weight}
                      </p>
                    )}
                    {form.appearance.eyes && (
                      <p>
                        <span className="text-accent">Eyes:</span> {form.appearance.eyes}
                      </p>
                    )}
                    {form.appearance.skin && (
                      <p>
                        <span className="text-accent">Skin:</span> {form.appearance.skin}
                      </p>
                    )}
                    {form.appearance.hair && (
                      <p>
                        <span className="text-accent">Hair:</span> {form.appearance.hair}
                      </p>
                    )}
                    {form.appearance.description && <p className="mt-2">{form.appearance.description}</p>}
                  </div>
                </div>
              )}

              {form.personality && (
                <div>
                  <h3 className="text-sm font-semibold text-shadow-200 mb-2">Personality</h3>
                  <div className="text-xs text-shadow-300 space-y-2">
                    {form.personality.traits && (
                      <p>
                        <span className="text-accent">Traits:</span> {form.personality.traits}
                      </p>
                    )}
                    {form.personality.ideals && (
                      <p>
                        <span className="text-accent">Ideals:</span> {form.personality.ideals}
                      </p>
                    )}
                    {form.personality.bonds && (
                      <p>
                        <span className="text-accent">Bonds:</span> {form.personality.bonds}
                      </p>
                    )}
                    {form.personality.flaws && (
                      <p>
                        <span className="text-accent">Flaws:</span> {form.personality.flaws}
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
