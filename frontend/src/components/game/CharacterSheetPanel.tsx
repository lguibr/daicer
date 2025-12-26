import { useEffect } from 'react';
import type { Player } from '@daicer/engine';
import {
  PaperBackground,
  StatBox,
  AttributeBox,
  SkillRow,
  paperStyles,
  formatModifier,
} from '../common/PaperSheetComponents';

interface CharacterSheetPanelProps {
  player: Player | null;
  onClose: () => void;
}

// CharacterSheetPanel
export default function CharacterSheetPanel({ player, onClose }: CharacterSheetPanelProps) {
  useEffect(() => {
    if (!player) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, player]);

  if (!player?.character) return null;
  const { character } = player;
  const { attributes } = character;
  const skillDetails = character.skillDetails ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-[1000px] min-h-[90vh] bg-[#fdfbf7] shadow-2xl overflow-hidden rounded-sm flex flex-col md:flex-row">
        {/* Paper Texture Overlay */}
        <PaperBackground />

        {/* Close Button */}
        <button
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
            {(Object.entries(attributes) as Array<[keyof typeof attributes, number]>).map(([attr, score]) => (
              <AttributeBox key={attr} label={attr} score={score} />
            ))}
          </div>

          <div className="h-px w-full bg-shadow-800/20 my-2" />

          {/* Skills */}
          <div className="flex-1">
            <h3 className={paperStyles.header}>Skills</h3>
            <div className="flex flex-col text-sm">
              {skillDetails.map((skill) => (
                <SkillRow key={skill.name} skill={skill} />
              ))}
              {skillDetails.length === 0 && (
                <p className="italic text-shadow-500 text-sm p-2">Skills not generated yet.</p>
              )}
            </div>
          </div>

          {/* Proficiencies */}
          <div className="mt-auto">
            <h3 className={paperStyles.header}>Proficiencies</h3>
            <p className="text-sm leading-relaxed text-shadow-800">{character.proficienciesAndLanguages || '—'}</p>
          </div>
        </div>

        {/* RIGHT COLUMN: Header, Avatar, Combat, Features */}
        <div className="w-full md:w-2/3 p-8 flex flex-col gap-6 relative z-10 bg-[#fdfbf7]">
          {/* Header */}
          <header className="flex flex-col border-b-4 border-double border-shadow-800/30 pb-4">
            <div className="flex justify-between items-end mb-2">
              <h1 className="text-5xl font-display font-bold text-shadow-900 tracking-wider capitalize">
                {character.name}
              </h1>
              <div className="text-right">
                <span className="font-display font-bold text-2xl text-shadow-800">Level {character.level}</span>
              </div>
            </div>
            <div className="flex gap-4 text-lg font-serif italic text-shadow-700">
              <span>
                {character.race} {character.characterClass}
              </span>
              <span>•</span>
              <span>{character.alignment}</span>
              <span>•</span>
              <span>{character.backgroundDetails.origin || character.background}</span>
            </div>
          </header>

          {/* Top Section: Avatar & Vitals */}
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="w-full sm:w-48 h-64 shrink-0 relative group">
              <div className="absolute inset-0 border-4 border-shadow-800/40 rotate-1 rounded-sm bg-shadow-200" />
              <div className="absolute inset-0 border-4 border-shadow-800/40 -rotate-1 rounded-sm bg-gray-200 overflow-hidden">
                {character.avatarAssets?.publicUrl ? (
                  <img
                    src={character.avatarAssets.publicUrl}
                    alt={character.name}
                    className="w-full h-full object-cover sepia-[0.2]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-shadow-200 text-shadow-400 font-display text-xs">
                    NO IMAGE
                  </div>
                )}
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="flex-1 grid grid-cols-3 gap-3 self-start">
              {/* AC, Init, Speed */}
              <StatBox label="Armor Class" value={character.armorClass} big />
              <StatBox label="Initiative" value={formatModifier(character.initiative)} big />
              <StatBox label="Speed" value={`${character.speed} ft`} big />

              {/* HP - Spans full width */}
              <div className="col-span-3 border-2 border-shadow-800/30 bg-shadow-50/40 p-3 flex justify-between items-center rounded-sm">
                <div className="flex flex-col">
                  <span className={paperStyles.label}>Current Hit Points</span>
                  <span className="text-4xl font-display font-bold text-shadow-900">{character.hp}</span>
                </div>
                <div className="flex flex-col items-end text-shadow-500">
                  <span className="text-xs uppercase tracking-wider">Max HP</span>
                  <span className="text-xl font-display font-bold">{character.maxHp}</span>
                </div>
              </div>

              <div className="col-span-1">
                <StatBox label="Prof. Bonus" value={`+${character.proficiencyBonus}`} />
              </div>
              <div className="col-span-2">
                <StatBox label="Hit Dice" value={`1d${character.hp > 10 ? '10' : '8'}`} />
                {/* Simplified Hit Dice logic or get from class if available later */}
              </div>
            </div>
          </div>

          {/* Attacks/Actions could go here */}

          {/* Features & Traits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <div className="flex flex-col gap-4">
              <div className="border-2 border-shadow-800/20 p-4 h-full bg-shadow-50/20 rounded-sm">
                <h3 className={paperStyles.header}>Features & Traits</h3>
                <div className="text-sm font-serif leading-relaxed whitespace-pre-line text-shadow-900">
                  {Array.isArray(character.features) ? character.features.join('\n') : character.features || 'None'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="border-2 border-shadow-800/20 p-4 h-full bg-shadow-50/20 rounded-sm">
                <h3 className={paperStyles.header}>Equipment</h3>
                <div className="text-sm font-serif leading-relaxed whitespace-pre-line text-shadow-900">
                  {character.equipmentDescription || 'None'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer: Personality/Backstory snippet */}
          <div className="border-t-2 border-shadow-800/10 pt-4 flex gap-4 text-xs italic text-shadow-600">
            <div className="flex-1">
              <strong>Personality:</strong> {character.personality.traits}
            </div>
            <div className="flex-1">
              <strong>Ideals:</strong> {character.personality.ideals}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
