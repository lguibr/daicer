import { useEffect, useState } from 'react';
import type { Player, CharacterSheet, ActionDefinition, EntityFeature } from '@daicer/engine';
import { Swords, Sparkles, Scroll, Shield } from 'lucide-react';
import {
  PaperBackground,
  StatBox,
  AttributeBox,
  SkillRow,
  paperStyles,
  formatModifier,
} from '../common/PaperSheetComponents';
import cn from '../../lib/utils';

interface CharacterSheetPanelProps {
  player: Player | null;
  onClose: () => void;
}

// Helper Action Card
function ActionCard({ action }: { action: ActionDefinition }) {
  const isSpell = action.type === 'spell';
  const isMelee = action.type === 'melee_attack';

  return (
    <div className="flex flex-col gap-1 p-3 border border-shadow-800/20 bg-shadow-50/50 rounded-sm hover:bg-shadow-100/50 transition-colors cursor-pointer group">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isMelee && <Swords className="w-4 h-4 text-red-700" />}
          {isSpell && <Sparkles className="w-4 h-4 text-purple-700" />}
          {!isMelee && !isSpell && <Shield className="w-4 h-4 text-blue-700" />}
          <span className="font-display font-bold text-shadow-900 group-hover:text-red-900">{action.name}</span>
        </div>
        <div className="text-xs font-serif italic text-shadow-600">{action.type}</div>
      </div>

      <div className="text-sm font-serif text-shadow-800">
        <div className="flex gap-3">
          {'toHit' in action && action.toHit !== undefined && <span className="font-bold">+{action.toHit} to Hit</span>}
          {'damage' in action && action.damage && action.damage.length > 0 && (
            <span>{action.damage.map((d) => `${d.dice}+${d.bonus} ${d.type}`).join(', ')}</span>
          )}
          {'save' in action && action.save && (
            <span>
              DC {action.save.dc} {action.save.stat} Save
            </span>
          )}
        </div>
      </div>

      {/* Description tooltip or expandable could go here, for now simpler */}
      <p className="text-xs text-shadow-600/80 leading-tight line-clamp-2">{action.description}</p>
    </div>
  );
}

// Helper Feature Item
function FeatureItem({ feature }: { feature: EntityFeature }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-display font-bold text-shadow-800 text-sm">{feature.name}</span>
        {feature.usage && (
          <span className="text-xs text-shadow-500 bg-shadow-200/50 px-1 rounded">
            {feature.usage.max} / {feature.usage.per}
          </span>
        )}
      </div>
      <p className="text-xs font-serif leading-relaxed text-shadow-700">{feature.description}</p>
    </div>
  );
}

export default function CharacterSheetPanel({ player, onClose }: CharacterSheetPanelProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'spells'>('main');

  useEffect(() => {
    if (!player) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, player]);

  if (!player?.character) return null;
  const character = player.character as CharacterSheet;
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
            <p className="text-sm leading-relaxed text-shadow-800">No data</p>
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
              <span>{character.background}</span>
            </div>

            {/* Tab Switcher (Simple) */}
            <div className="flex gap-4 mt-4 border-b border-shadow-800/10">
              <button
                onClick={() => setActiveTab('main')}
                className={cn(
                  'px-4 py-2 font-display font-bold text-sm uppercase tracking-wide border-b-2 transition-colors',
                  activeTab === 'main'
                    ? 'border-red-800 text-red-900'
                    : 'border-transparent text-shadow-500 hover:text-shadow-800'
                )}
              >
                Main Sheet
              </button>
              <button
                onClick={() => setActiveTab('spells')}
                className={cn(
                  'px-4 py-2 font-display font-bold text-sm uppercase tracking-wide border-b-2 transition-colors',
                  activeTab === 'spells'
                    ? 'border-purple-800 text-purple-900'
                    : 'border-transparent text-shadow-500 hover:text-shadow-800'
                )}
              >
                Spellbook
              </button>
            </div>
          </header>

          {activeTab === 'main' && (
            <>
              {/* Top Section: Avatar & Vitals */}
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar */}
                <div className="w-full sm:w-32 h-48 shrink-0 relative group self-center sm:self-start">
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
                <div className="flex-1 grid grid-cols-4 gap-3 self-start">
                  <div className="col-span-1">
                    <StatBox label="AC" value={character.armorClass} big />
                  </div>
                  <div className="col-span-1">
                    <StatBox label="Init" value={formatModifier(character.initiative)} big />
                  </div>
                  <div className="col-span-1">
                    <StatBox
                      label="Speed"
                      value={
                        typeof character.speed === 'number'
                          ? character.speed
                          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (character.speed as any)?.walk || 30
                      }
                      big
                    />
                  </div>
                  <div className="col-span-1">
                    <StatBox label="Prof" value={`+${character.proficiencyBonus}`} big />
                  </div>

                  {/* HP - Spans full width */}
                  <div className="col-span-4 border-2 border-shadow-800/30 bg-shadow-50/40 p-3 flex justify-between items-center rounded-sm">
                    <div className="flex flex-col">
                      <span className={paperStyles.label}>Current Hit Points</span>
                      <span className="text-4xl font-display font-bold text-shadow-900">{character.hp}</span>
                    </div>
                    <div className="flex flex-col items-end text-shadow-500">
                      <span className="text-xs uppercase tracking-wider">Max HP</span>
                      <span className="text-xl font-display font-bold">{character.maxHp}</span>
                    </div>
                  </div>

                  {/* Hit Dice */}
                  <div className="col-span-2">
                    <div className="bg-shadow-50/40 border border-shadow-800/20 p-2 rounded text-center">
                      <span className="text-xs uppercase text-shadow-500 block">Hit Dice</span>
                      <span className="font-display font-bold text-lg text-shadow-800">
                        {character.hitDice?.current ?? 1} / {character.hitDice?.total ?? character.level}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions & Attacks */}
              <div className="flex flex-col gap-2">
                <h3 className={paperStyles.header}>Actions & Attacks</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Structured Actions from Phase 1 */}
                  {character.structuredActions &&
                    character.structuredActions.map((action, i) => <ActionCard key={i} action={action} />)}
                </div>
              </div>

              {/* Features & Traits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <div className="flex flex-col gap-4">
                  <div className="border-2 border-shadow-800/20 p-4 h-full bg-shadow-50/20 rounded-sm">
                    <h3 className={paperStyles.header}>Features & Traits</h3>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-shadow-300">
                      {Array.isArray(character.features) && character.features.length > 0 ? (
                        (character.features as EntityFeature[]).map((f, i) => <FeatureItem key={i} feature={f} />)
                      ) : (
                        // String or Empty
                        <div className="text-sm font-serif leading-relaxed whitespace-pre-line text-shadow-900">
                          {typeof character.features === 'string' ? character.features : 'None'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="border-2 border-shadow-800/20 p-4 h-full bg-shadow-50/20 rounded-sm">
                    <h3 className={paperStyles.header}>Equipment</h3>
                    <div className="text-sm font-serif leading-relaxed whitespace-pre-line text-shadow-900">
                      {character.equipment && character.equipment.length > 0
                        ? `${character.equipment.length} items (See Spellbook tab for eventual full inventory)`
                        : 'No equipment'}
                    </div>
                    {/* Render Inventory items if needed here */}
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
            </>
          )}

          {activeTab === 'spells' && (
            <div className="flex flex-col items-center justify-center h-full text-shadow-400">
              <Scroll className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-2xl font-display font-bold text-shadow-300">Spellbook</h3>
              <p className="italic">Spell management coming in Phase 5.2</p>
              {/* Reuse SpellSummaryPanel here later */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
