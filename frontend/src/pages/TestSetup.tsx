/**
 * @file Test Setup Page (Dev Only)
 * @description Quick setup for testing game scenarios
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Swords, Flame, Puzzle, Ship, FlaskConical } from 'lucide-react';
import { createRoom, updateRoomSettings, addCharacter } from '../services/api';
import { setReady } from '../services/socket';
import { PrivateLayout } from '../components/layout';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import type { WorldSettings, CharacterSheet, Attribute } from '../types/shared';
import { useI18n } from '../i18n';

interface TestScenario {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  settings: Partial<WorldSettings>;
  worldDescription: string;
  presetCharacter: Partial<CharacterSheet>;
  creatures?: Array<{ name: string; hp: number; attackBonus: number; damage: string }>;
}

const useTestScenarios = () => {
  const { t } = useI18n();

  return [
    {
      id: '2-goblins',
      name: t('testSetup.scenarios.goblins.name'),
      icon: Swords,
      description: t('testSetup.scenarios.goblins.description'),
      settings: {
        worldType: 'forest',
        worldSize: 'small',
        theme: 'Forest Ambush',
        setting: 'Forest clearing',
        tone: 'Action-focused',
        dmStyle: {
          verbosity: 1,
          detail: 1,
          engagement: 1,
          narrative: 1,
          specialMode: null,
          customDirectives: '',
        },
        playerCount: 1,
        adventureLength: 'short',
        difficulty: 'easy',
        startingLevel: 3,
        attributePointBudget: 27,
        language: 'en',
      },
      worldDescription: t('testSetup.scenarios.goblins.worldDescription'),
      presetCharacter: {
        name: 'Test Fighter',
        race: 'Human',
        characterClass: 'Fighter',
        background: 'Soldier',
        alignment: 'Neutral Good',
        level: 3,
        attributes: {
          Strength: 16,
          Dexterity: 14,
          Constitution: 14,
          Intelligence: 10,
          Wisdom: 12,
          Charisma: 10,
        } as Record<Attribute, number>,
      },
      creatures: [
        { name: 'Goblin 1', hp: 7, attackBonus: 4, damage: '1d6+2' },
        { name: 'Goblin 2', hp: 7, attackBonus: 4, damage: '1d6+2' },
      ],
    },
    {
      id: 'dragon-boss',
      name: t('testSetup.scenarios.dragon.name'),
      icon: Flame,
      description: t('testSetup.scenarios.dragon.description'),
      settings: {
        worldType: 'volcanic',
        worldSize: 'medium',
        theme: 'Dragon Lair',
        setting: 'Volcanic mountain peak',
        tone: 'Epic and Dramatic',
        dmStyle: {
          verbosity: 5,
          detail: 5,
          engagement: 5,
          narrative: 5,
          specialMode: null,
          customDirectives: '',
        },
        playerCount: 1,
        adventureLength: 'medium',
        difficulty: 'challenging',
        startingLevel: 10,
        attributePointBudget: 27,
        language: 'en',
      },
      worldDescription: t('testSetup.scenarios.dragon.worldDescription'),
      presetCharacter: {
        name: 'Test Paladin',
        race: 'Dragonborn',
        characterClass: 'Paladin',
        background: 'Dragon Slayer',
        alignment: 'Lawful Good',
        level: 10,
        attributes: {
          Strength: 18,
          Dexterity: 10,
          Constitution: 16,
          Intelligence: 8,
          Wisdom: 14,
          Charisma: 16,
        } as Record<Attribute, number>,
      },
      creatures: [{ name: 'Infernius the Red', hp: 200, attackBonus: 14, damage: '2d10+7' }],
    },
    {
      id: 'puzzle-room',
      name: t('testSetup.scenarios.puzzle.name'),
      icon: Puzzle,
      description: t('testSetup.scenarios.puzzle.description'),
      settings: {
        worldType: 'underground',
        worldSize: 'small',
        theme: 'Ancient Puzzle',
        setting: 'Mysterious chamber',
        tone: 'Mysterious and Intriguing',
        dmStyle: {
          verbosity: 5,
          detail: 5,
          engagement: 5,
          narrative: 3,
          specialMode: null,
          customDirectives: '',
        },
        playerCount: 1,
        adventureLength: 'short',
        difficulty: 'medium',
        startingLevel: 5,
        attributePointBudget: 27,
        language: 'en',
      },
      worldDescription: t('testSetup.scenarios.puzzle.worldDescription'),
      presetCharacter: {
        name: 'Test Wizard',
        race: 'Gnome',
        characterClass: 'Wizard',
        background: 'Sage',
        alignment: 'Neutral',
        level: 5,
        attributes: {
          Strength: 8,
          Dexterity: 14,
          Constitution: 12,
          Intelligence: 18,
          Wisdom: 14,
          Charisma: 10,
        } as Record<Attribute, number>,
      },
    },
    {
      id: 'pirate-mode',
      name: t('testSetup.scenarios.pirate.name'),
      icon: Ship,
      description: t('testSetup.scenarios.pirate.description'),
      settings: {
        worldType: 'water',
        worldSize: 'large',
        theme: 'High Seas Piracy',
        setting: 'The Caribbean-like seas',
        tone: 'Swashbuckling and Fun',
        dmStyle: {
          verbosity: 3,
          detail: 3,
          engagement: 5,
          narrative: 1,
          specialMode: 'pirate',
          customDirectives: '',
        },
        playerCount: 1,
        adventureLength: 'medium',
        difficulty: 'medium',
        startingLevel: 5,
        attributePointBudget: 27,
        language: 'en',
      },
      worldDescription: t('testSetup.scenarios.pirate.worldDescription'),
      presetCharacter: {
        name: 'Captain Hook',
        race: 'Human',
        characterClass: 'Rogue',
        background: 'Pirate',
        alignment: 'Chaotic Neutral',
        level: 5,
        attributes: {
          Strength: 12,
          Dexterity: 18,
          Constitution: 14,
          Intelligence: 10,
          Wisdom: 12,
          Charisma: 14,
        } as Record<Attribute, number>,
      },
    },
  ] as TestScenario[];
};

export default function TestSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const handleQuickSetup = async (scenario: TestScenario) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create room
      const room = await createRoom();

      // 2. Update settings
      const fullSettings: WorldSettings = {
        worldType: 'terra',
        worldSize: 'medium',
        theme: '',
        setting: '',
        tone: '',
        worldBackground: '',
        dmStyle: {
          verbosity: 3,
          detail: 3,
          engagement: 3,
          narrative: 3,
          specialMode: null,
          customDirectives: '',
        },
        dmSystemPrompt: '',
        playerCount: 1,
        adventureLength: 'short',
        difficulty: 'easy',
        startingLevel: 1,
        attributePointBudget: 27,
        language: 'en',
        ...scenario.settings,
      };

      await updateRoomSettings(room.id, fullSettings);

      // 3. Add preset character
      const character: CharacterSheet = {
        name: 'Test Character',
        race: 'Human',
        characterClass: 'Fighter',
        background: 'Soldier',
        alignment: 'Neutral',
        level: 1,
        xp: 0,
        hp: 10,
        maxHp: 10,
        temporaryHp: 0,
        hitDice: { total: 1, current: 1 },
        deathSaves: { successes: 0, failures: 0 },
        armorClass: 15,
        initiative: 0,
        speed: 30,
        proficiencyBonus: 2,
        inspiration: false,
        attributes: {
          Strength: 14,
          Dexterity: 12,
          Constitution: 14,
          Intelligence: 10,
          Wisdom: 10,
          Charisma: 10,
        } as Record<Attribute, number>,
        savingThrows: { fortitude: 2, reflex: 1, will: 0 },
        skills: {},
        skillDetails: [],
        expertises: [],
        baseAttackBonus: 2,
        attacks: [{ name: 'Longsword', bonus: '+4', damageType: '1d8+2 slashing' }],
        equipment: [
          { item: 'Longsword', quantity: 1, slot: 'mainHand', isEquipped: true },
          { item: 'Shield', quantity: 1, slot: 'offHand', isEquipped: true },
          { item: 'Chainmail', quantity: 1, slot: 'armor', isEquipped: true },
        ],
        equipmentDescription: 'Longsword, shield, chainmail',
        currency: { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 },
        proficienciesAndLanguages: 'Common, martial weapons',
        features: 'Fighting Style, Second Wind',
        talents: [],
        appearance: {
          age: '25',
          height: '5\'10"',
          weight: '180 lbs',
          eyes: 'Brown',
          skin: 'Tan',
          hair: 'Black',
          description: 'A capable warrior',
        },
        personality: {
          traits: 'Brave and loyal',
          ideals: 'Honor',
          bonds: 'Protects the innocent',
          flaws: 'Stubborn',
        },
        backstory: 'A test character for quick game testing',
        backgroundDetails: {
          origin: '',
          upbringing: '',
          motivation: '',
          keyEvents: [],
          allies: [],
        },
        alliesAndOrganizations: 'None',
        treasure: 'Standard gear',
        resourcePools: [],
        advancementPoints: {
          ability: 0,
          skill: 0,
          talent: 0,
        },
        spellcasting: {
          class: '',
          ability: '',
          saveDC: 0,
          attackBonus: 0,
          cantrips: [],
          spellsKnown: [],
          slots: [],
        },
        ...scenario.presetCharacter,
      };

      await addCharacter(room.id, character);

      // 4. Auto-ready
      await setReady(room.id, true);

      // 5. Navigate to room
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test scenario');
    } finally {
      setLoading(false);
    }
  };

  // Only show in dev mode
  const isDev = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;

  const scenarios = useTestScenarios();

  if (!isDev) {
    navigate('/');
    return null;
  }

  return (
    <PrivateLayout showRoomInfo={false}>
      {loading && <LoadingOverlay message="Setting up test scenario..." />}
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 space-y-2">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-8 w-8 text-aurora-300" aria-hidden />
              <h1 className="font-display text-3xl uppercase tracking-[0.35em] text-aurora-300">
                {t('dev.testMode.title')}
              </h1>
            </div>
            <p className="text-sm text-shadow-200">{t('dev.testMode.description')}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/combat-demo')}
                className="inline-flex items-center gap-2 rounded-lg border border-aurora-500/60 bg-aurora-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-aurora-200 transition hover:bg-aurora-500/30"
              >
                🎯 {t('lobby.cards.demo.action')}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => handleQuickSetup(scenario)}
                disabled={loading}
                className="p-6 bg-midnight-400/50 hover:bg-midnight-400/70 border-2 border-shadow-700 hover:border-aurora-400 rounded-xl transition-all text-left disabled:opacity-50"
              >
                <div className="mb-3 flex items-center gap-4">
                  <scenario.icon className="h-10 w-10 text-aurora-300" aria-hidden />
                  <div>
                    <h3 className="text-xl font-bold text-aurora-300">{scenario.name}</h3>
                    <p className="text-sm text-shadow-400">{scenario.description}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-shadow-300">
                  <div className="flex gap-2">
                    <span className="text-shadow-500">{t('dev.testMode.worldLabel')}:</span>
                    <span>{scenario.settings.theme}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-shadow-500">{t('dev.testMode.dmStyleLabel')}:</span>
                    <span className="text-shadow-200">
                      Verbosity L{(scenario.settings.dmStyle?.verbosity ?? 0) + 1} · Engagement L
                      {(scenario.settings.dmStyle?.engagement ?? 0) + 1} · Mode{' '}
                      {scenario.settings.dmStyle?.specialMode || 'Neutral'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-shadow-500">{t('dev.testMode.characterLabel')}:</span>
                    <span>
                      Lvl {scenario.settings.startingLevel} {scenario.presetCharacter.characterClass}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-shadow-700 hover:bg-shadow-600 text-shadow-100 rounded-lg transition-colors"
            >
              {t('dev.testMode.back')}
            </button>
          </div>
        </div>
      </div>
    </PrivateLayout>
  );
}
