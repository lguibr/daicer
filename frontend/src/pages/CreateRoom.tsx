import clsx from 'clsx';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Mountain, Waves, Sun, Snowflake, Flame, Trees, Cloud, Gem, Sparkles } from 'lucide-react';
import { createRoom, updateRoomSettings, generateWorld } from '../services/api';
import { useI18n } from '../i18n';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { PrivateLayout } from '../components/layout';
import { WORLD_ARCHETYPES, type ArchetypeSigil } from '../constants/worldArchetypes';
import DiscreteSlider, { type SliderMark } from '../components/forms/DiscreteSlider';
import type {
  AdventureLength,
  Difficulty,
  DMPerformanceMode,
  DMStyle,
  ScaleLevel,
  WorldSettings,
  WorldType,
  WorldSize,
} from '../types/shared';

const ARCHETYPE_SIGILS: Record<ArchetypeSigil, LucideIcon> = {
  mountain: Mountain,
  tide: Waves,
  dune: Sun,
  frost: Snowflake,
  ember: Flame,
  grove: Trees,
  sky: Cloud,
  abyss: Gem,
  custom: Sparkles,
};

const VERBOSITY_MARKS: SliderMark[] = [
  { value: 0, label: 'Whisper', description: 'Compact phrases; battle reports without flourish.' },
  { value: 1, label: 'Terse', description: 'Brief narration with essential sensory beats only.' },
  { value: 2, label: 'Measured', description: 'Balanced cadence, short paragraphs anchoring scenes.' },
  { value: 3, label: 'Storied', description: 'Narrative flow with hooks and periodic embellishment.' },
  { value: 4, label: 'Lyrical', description: 'Rich language with artful metaphors and cadence.' },
  { value: 5, label: 'Epic', description: 'Layered description, foreshadowing, and heroic gravitas.' },
  { value: 6, label: 'Operatic', description: 'Grandiloquent delivery worthy of bardic sagas.' },
];

const DETAIL_MARKS: SliderMark[] = [
  { value: 0, label: 'Minimal', description: 'Rule-first clarity; bare essential context.' },
  { value: 1, label: 'Lean', description: 'Highlights key props and obstacles, nothing more.' },
  { value: 2, label: 'Focused', description: 'Mix of mechanical stakes and vivid landmarks.' },
  { value: 3, label: 'Balanced', description: 'Equal parts mechanics, atmosphere, and sensory tone.' },
  { value: 4, label: 'Textured', description: 'Layered description of sights, sounds, and culture.' },
  { value: 5, label: 'Immersive', description: 'Every scene painted with historical and emotional nuance.' },
  { value: 6, label: 'Cinematic', description: 'Panoramic detail, symbolism, and lingering imagery.' },
];

const ENGAGEMENT_MARKS: SliderMark[] = [
  { value: 0, label: 'Observer', description: 'Relays outcomes; minimal questions to players.' },
  { value: 1, label: 'Facilitator', description: 'Invites input at decision beats only.' },
  { value: 2, label: 'Guide', description: 'Regular prompts for intentions and reflections.' },
  { value: 3, label: 'Collaborator', description: 'Co-creates moments, encourages party banter.' },
  { value: 4, label: 'Instigator', description: 'Seeds dilemmas, cliff-hangers, and rivalries.' },
  { value: 5, label: 'Provocateur', description: 'Pushes dramatic tension, spotlight rotation, character arcs.' },
  { value: 6, label: 'Immersive', description: 'LARP-like involvement, in-character dialogue, dramatic pacing.' },
];

const NARRATIVE_MARKS: SliderMark[] = [
  { value: 0, label: 'Player', description: 'Sandbox freedom; react to initiatives more than drive them.' },
  { value: 1, label: 'Explorer', description: 'Loose threads seeded, players weave them together.' },
  { value: 2, label: 'Hybrid', description: 'Blend of branching choices with gentle nudges.' },
  { value: 3, label: 'Balanced', description: 'Story arcs with equal agency and plotted beats.' },
  { value: 4, label: 'Guided', description: 'Clear arcs, recurring NPC agendas, purposeful scenes.' },
  { value: 5, label: 'Plotted', description: 'Strong episodic structure with planned twists.' },
  { value: 6, label: 'Authored', description: 'Epic saga with foreshadowed climaxes and dramatic framing.' },
];

const SPECIAL_MODE_OPTIONS: Array<{ id: DMPerformanceMode | null; label: string; description: string }> = [
  { id: null, label: 'Classic', description: 'Neutral narrator with modern tabletop etiquette.' },
  { id: 'courtly', label: 'Courtly', description: 'Highborn formality, heraldic compliments, etiquette cues.' },
  { id: 'grimdark', label: 'Grimdark', description: 'Harsh imagery, moral ambiguity, fatalistic tone.' },
  { id: 'pirate', label: 'Corsair', description: 'Swashbuckling slang, sea shanty flavor, audacious bravado.' },
  { id: 'shakespearean', label: 'Shakespearean', description: 'Elizabethan cadence, poetic turns, dramatic beats.' },
  { id: 'noir', label: 'Noir', description: 'Hardboiled monologue, moody metaphors, smoky intrigue.' },
  { id: 'storybook', label: 'Storybook', description: 'Fairytale cadence, moral lessons, whimsical wonder.' },
];

const ADVENTURE_LENGTH_OPTIONS: Array<{
  value: AdventureLength;
  label: string;
  detail: string;
  description: string;
}> = [
  { value: 'flash', label: 'Flash', detail: '~1 session', description: 'Tightly scoped mission or prologue.' },
  { value: 'short', label: 'Short', detail: '2-3 sessions', description: 'Mini-arc with a singular objective.' },
  { value: 'medium', label: 'Standard', detail: '4-6 sessions', description: 'Season-length arc with side beats.' },
  { value: 'long', label: 'Long', detail: '8-12 sessions', description: 'Sprawling campaign with layered threats.' },
  { value: 'epic', label: 'Epic', detail: '12-18 sessions', description: 'World-shaping saga with multiple acts.' },
  { value: 'legendary', label: 'Legendary', detail: '20+ sessions', description: 'Generation-spanning chronicle.' },
];

const DIFFICULTY_OPTIONS: Array<{
  value: Difficulty;
  label: string;
  detail: string;
  description: string;
}> = [
  {
    value: 'storyteller',
    label: 'Storyteller',
    detail: 'Fail-forward',
    description: 'Conflict favors narrative beats.',
  },
  { value: 'easy', label: 'Relaxed', detail: 'Gentle stakes', description: 'Encounters rarely lethal; heroic tone.' },
  { value: 'medium', label: 'Standard', detail: 'Balanced risk', description: 'Tactical depth with fair danger.' },
  {
    value: 'challenging',
    label: 'Challenging',
    detail: 'Earned victories',
    description: 'Frequent pressure, limited rests.',
  },
  { value: 'gritty', label: 'Gritty', detail: 'Hard choices', description: 'Attrition matters; wounds linger.' },
  { value: 'deadly', label: 'Deadly', detail: 'High stakes', description: 'Relentless peril; failure has weight.' },
];

const WORLD_SIZE_OPTIONS: Array<{
  value: WorldSize;
  label: string;
  detail: string;
  description: string;
}> = [
  { value: 'intimate', label: 'Intimate', detail: 'Local', description: 'One village, one dungeon, personal stakes.' },
  { value: 'small', label: 'Small', detail: 'Province', description: 'A handful of regions with linked politics.' },
  {
    value: 'medium',
    label: 'Medium',
    detail: 'Kingdom',
    description: 'Nation-spanning travel with distinct cultures.',
  },
  { value: 'large', label: 'Large', detail: 'Continent', description: 'Multiple kingdoms and diverse climates.' },
  { value: 'vast', label: 'Vast', detail: 'World', description: 'Globe-trotting saga with planar whispers.' },
  { value: 'epic', label: 'Mythic', detail: 'Planes', description: 'Interplanar odyssey with cosmic stakes.' },
];

const WORLD_SIZE_MARKS: SliderMark[] = WORLD_SIZE_OPTIONS.map((option, index) => ({
  value: index,
  label: option.label,
  description: `${option.detail} — ${option.description}`,
}));

const ADVENTURE_LENGTH_MARKS: SliderMark[] = ADVENTURE_LENGTH_OPTIONS.map((option, index) => ({
  value: index,
  label: option.label,
  description: `${option.detail} — ${option.description}`,
}));

const DIFFICULTY_MARKS: SliderMark[] = DIFFICULTY_OPTIONS.map((option, index) => ({
  value: index,
  label: option.label,
  description: `${option.detail} — ${option.description}`,
}));

const PARTY_SIZE_MARKS: SliderMark[] = Array.from({ length: 8 }, (_, index) => {
  const value = index + 1;
  return {
    value,
    label: String(value),
    description: value === 4 ? 'Classic balanced party size.' : undefined,
  };
});

const STARTING_LEVEL_MARKS: SliderMark[] = Array.from({ length: 20 }, (_, index) => {
  const value = index + 1;
  const isMilestone = value === 1 || value === 20 || value % 5 === 0;
  return {
    value,
    label: String(value),
    description: isMilestone
      ? value === 1
        ? 'Heroic origin.'
        : value === 20
          ? 'Legendary tier play.'
          : `Milestone level ${value}.`
      : undefined,
  };
});

type WizardStepId = 'world' | 'story' | 'scope' | 'dm' | 'preview';

const WIZARD_STEPS: Array<{ id: WizardStepId; label: string }> = [
  { id: 'world', label: 'World Archetype' },
  { id: 'story', label: 'Storyframe' },
  { id: 'scope', label: 'Scope & Stakes' },
  { id: 'dm', label: 'DM Personality Suite' },
  { id: 'preview', label: 'Prompt Preview' },
];

function findDescription<T extends { value: string; description: string }>(collection: T[], value: string): string {
  return collection.find((item) => item.value === value)?.description ?? '';
}

function findDetail<T extends { value: string; detail: string }>(collection: T[], value: string): string {
  return collection.find((item) => item.value === value)?.detail ?? '';
}

function getMarkSummary(marks: SliderMark[], level: ScaleLevel): string {
  return marks.find((mark) => mark.value === level)?.description ?? '';
}

function buildSystemPrompt(settings: WorldSettings): string {
  const adventureDescriptor = findDescription(ADVENTURE_LENGTH_OPTIONS, settings.adventureLength);
  const difficultyDescriptor = findDescription(DIFFICULTY_OPTIONS, settings.difficulty);
  const worldScaleDescriptor = findDescription(WORLD_SIZE_OPTIONS, settings.worldSize);
  const specialMode = SPECIAL_MODE_OPTIONS.find((option) => option.id === settings.dmStyle.specialMode);

  const promptSections: string[] = [
    'You are an AI Dungeon Master forged for dramatic, medieval fantasy tabletop adventures.',
    `Campaign Theme: ${settings.theme}`,
    `Primary Setting: ${settings.setting}`,
    `Tone: ${settings.tone}`,
    `World Scale: ${worldScaleDescriptor} (${findDetail(WORLD_SIZE_OPTIONS, settings.worldSize)})`,
    `Party Size: ${settings.playerCount} adventurers | Adventure Length: ${adventureDescriptor}`,
    `Difficulty Target: ${difficultyDescriptor}`,
  ];

  if (settings.worldBackground.trim()) {
    promptSections.push('World Background Notes:', settings.worldBackground.trim());
  }

  promptSections.push(
    'Narration Directives:',
    `- Verbosity Level ${settings.dmStyle.verbosity + 1}: ${getMarkSummary(VERBOSITY_MARKS, settings.dmStyle.verbosity)}`,
    `- Descriptive Detail Level ${settings.dmStyle.detail + 1}: ${getMarkSummary(DETAIL_MARKS, settings.dmStyle.detail)}`,
    `- Player Engagement Level ${settings.dmStyle.engagement + 1}: ${getMarkSummary(ENGAGEMENT_MARKS, settings.dmStyle.engagement)}`,
    `- Narrative Guidance Level ${settings.dmStyle.narrative + 1}: ${getMarkSummary(NARRATIVE_MARKS, settings.dmStyle.narrative)}`
  );

  if (specialMode && specialMode.id) {
    promptSections.push(`Performance Mode: ${specialMode.label} — ${specialMode.description}`);
  }

  if (settings.dmStyle.customDirectives.trim()) {
    promptSections.push('Custom DM Directives:', settings.dmStyle.customDirectives.trim());
  }

  promptSections.push(
    'Prime Directives:',
    '- Uphold teamwork, spotlight sharing, and player agency.',
    '- Respect rules of the d20 system while bending them when drama demands.',
    '- Surface previous lore, NPC motives, and lingering threads when relevant.'
  );

  return promptSections.join('\n');
}

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const defaultArchetype = WORLD_ARCHETYPES.terra;
  const [settings, setSettings] = useState<WorldSettings>({
    worldType: 'terra',
    worldSize: 'medium',
    theme: defaultArchetype.theme,
    setting: defaultArchetype.setting,
    tone: defaultArchetype.tone,
    worldBackground: defaultArchetype.background ?? '',
    dmStyle: {
      verbosity: 3,
      detail: 3,
      engagement: 3,
      narrative: 3,
      specialMode: null,
      customDirectives: '',
    },
    dmSystemPrompt: '',
    playerCount: 4,
    adventureLength: 'medium',
    difficulty: 'medium',
    startingLevel: 1,
    attributePointBudget: 27,
    language,
  });

  const totalSteps = WIZARD_STEPS.length;
  const currentStepId = WIZARD_STEPS[Math.min(currentStep, totalSteps - 1)]?.id ?? 'world';
  const isFinalStep = currentStep === totalSteps - 1;

  const goToStep = (index: number) => {
    setCurrentStep(() => Math.max(0, Math.min(index, totalSteps - 1)));
  };

  const goToNextStep = () => goToStep(currentStep + 1);
  const goToPreviousStep = () => goToStep(currentStep - 1);

  const systemPrompt = useMemo(() => buildSystemPrompt(settings), [settings]);

  useEffect(() => {
    setSettings((prev) => (prev.language === language ? prev : { ...prev, language }));
  }, [language]);

  useEffect(() => {
    setSettings((prev) => (prev.dmSystemPrompt === systemPrompt ? prev : { ...prev, dmSystemPrompt: systemPrompt }));
  }, [systemPrompt]);

  const updateSetting = <K extends keyof WorldSettings>(key: K, value: WorldSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleArchetypeChange = (newType: WorldType) => {
    const archetype = WORLD_ARCHETYPES[newType];
    setSettings((prev) => ({
      ...prev,
      worldType: newType,
      theme: archetype.theme,
      setting: archetype.setting,
      tone: archetype.tone,
      worldBackground: archetype.background ?? prev.worldBackground,
    }));
  };

  const updateDMStyle = <K extends keyof DMStyle>(key: K, value: DMStyle[K]) => {
    setSettings((prev) => ({
      ...prev,
      dmStyle: { ...prev.dmStyle, [key]: value },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isFinalStep) {
      goToNextStep();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const room = await createRoom();
      const updatedSettings = { ...settings, language, dmSystemPrompt: systemPrompt };
      await updateRoomSettings(room.id, updatedSettings);
      await generateWorld(room.id, language);
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'world': {
        return (
          <section className="card space-y-6 p-8">
            <div className="space-y-2">
              <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">World Archetype</h2>
              <p className="text-sm text-shadow-300">
                Select the foundational archetype to seed the realm&apos;s tone, mood, and lore baseline.
              </p>
            </div>
            <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(Object.keys(WORLD_ARCHETYPES) as WorldType[]).map((type) => {
                const archetype = WORLD_ARCHETYPES[type];
                const isActive = settings.worldType === type;
                const Sigil = ARCHETYPE_SIGILS[archetype.sigil];

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleArchetypeChange(type)}
                    className={clsx(
                      'group flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border px-5 py-6 text-left transition-all duration-200',
                      isActive
                        ? 'border-aurora-500/60 bg-aurora-500/15 shadow-[0_20px_35px_rgba(211,143,31,0.25)]'
                        : 'border-midnight-500/60 bg-midnight-500/30 hover:border-aurora-400/40 hover:bg-midnight-400/40'
                    )}
                    title={archetype.description}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {Sigil ? <Sigil className="h-6 w-6 text-aurora-300" aria-hidden /> : null}
                        <span className="font-semibold uppercase tracking-[0.3em] text-shadow-300">{type}</span>
                      </div>
                      <span className="rounded-full border border-midnight-400/50 bg-midnight-500/60 px-2 py-1 text-[0.6rem] text-shadow-200">
                        {archetype.mood ?? 'Atmosphere'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs uppercase tracking-[0.35em] text-shadow-500">
                      <span>{archetype.theme}</span>
                      <span>{archetype.tone}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-shadow-100 transition-colors duration-200 group-hover:text-shadow-50">
                      {archetype.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        );
      }
      case 'story': {
        return (
          <section className="card space-y-6 p-8">
            <div className="space-y-2">
              <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">Storyframe</h2>
              <p className="text-sm text-shadow-300">
                Define the campaign&apos;s high-level creative pillars. These shape how the AI frames scenes and lore.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="theme-input"
                  className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400"
                >
                  Theme
                </label>
                <input
                  id="theme-input"
                  type="text"
                  value={settings.theme}
                  onChange={(event) => updateSetting('theme', event.target.value)}
                  className="input-style w-full"
                  placeholder="High fantasy intrigue"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="tone-input"
                  className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400"
                >
                  Tone
                </label>
                <input
                  id="tone-input"
                  type="text"
                  value={settings.tone}
                  onChange={(event) => updateSetting('tone', event.target.value)}
                  className="input-style w-full"
                  placeholder="Somber gothic heroism"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="setting-input"
                className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400"
              >
                Primary Setting
              </label>
              <input
                id="setting-input"
                type="text"
                value={settings.setting}
                onChange={(event) => updateSetting('setting', event.target.value)}
                className="input-style w-full"
                placeholder="Hollowspire Citadel"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="background-input"
                className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400"
              >
                Background Lore
              </label>
              <textarea
                id="background-input"
                value={settings.worldBackground}
                onChange={(event) => updateSetting('worldBackground', event.target.value)}
                className="input-style w-full min-h-[140px] resize-y"
                placeholder="Write the cadence of the realm: ancestral wars, looming prophecies, factions at play..."
              />
            </div>
          </section>
        );
      }
      case 'scope': {
        const worldSizeIndex = Math.max(
          0,
          WORLD_SIZE_OPTIONS.findIndex((option) => option.value === settings.worldSize)
        );
        const adventureLengthIndex = Math.max(
          0,
          ADVENTURE_LENGTH_OPTIONS.findIndex((option) => option.value === settings.adventureLength)
        );
        const difficultyIndex = Math.max(
          0,
          DIFFICULTY_OPTIONS.findIndex((option) => option.value === settings.difficulty)
        );

        return (
          <section className="card space-y-8 p-8">
            <div className="space-y-2">
              <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">Scope & Stakes</h2>
              <p className="text-sm text-shadow-300">
                Calibrate the campaign&apos;s breadth, pacing, and challenge using linear sliders.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <DiscreteSlider
                id="player-count-slider"
                label="Party Size"
                value={settings.playerCount}
                onChange={(next) => updateSetting('playerCount', Math.max(1, Math.min(next, 8)))}
                marks={PARTY_SIZE_MARKS}
                description="Number of active adventurers."
              />
              <DiscreteSlider
                id="starting-level-slider"
                label="Starting Level"
                value={settings.startingLevel}
                onChange={(next) => updateSetting('startingLevel', Math.max(1, Math.min(next, 20)))}
                marks={STARTING_LEVEL_MARKS}
                description="Entry tier for character sheets."
              />
            </div>

            <DiscreteSlider
              id="world-size-slider"
              label="World Scale"
              value={worldSizeIndex}
              onChange={(index) => {
                const clampedIndex = Math.max(0, Math.min(index, WORLD_SIZE_OPTIONS.length - 1));
                const option = WORLD_SIZE_OPTIONS[clampedIndex] ?? WORLD_SIZE_OPTIONS[0];
                if (!option) {
                  return;
                }
                updateSetting('worldSize', option.value);
              }}
              marks={WORLD_SIZE_MARKS}
            />

            <DiscreteSlider
              id="adventure-length-slider"
              label="Adventure Length"
              value={adventureLengthIndex}
              onChange={(index) => {
                const clampedIndex = Math.max(0, Math.min(index, ADVENTURE_LENGTH_OPTIONS.length - 1));
                const option = ADVENTURE_LENGTH_OPTIONS[clampedIndex] ?? ADVENTURE_LENGTH_OPTIONS[0];
                if (!option) {
                  return;
                }
                updateSetting('adventureLength', option.value);
              }}
              marks={ADVENTURE_LENGTH_MARKS}
            />

            <DiscreteSlider
              id="difficulty-slider"
              label="Difficulty Target"
              value={difficultyIndex}
              onChange={(index) => {
                const clampedIndex = Math.max(0, Math.min(index, DIFFICULTY_OPTIONS.length - 1));
                const option = DIFFICULTY_OPTIONS[clampedIndex] ?? DIFFICULTY_OPTIONS[0];
                if (!option) {
                  return;
                }
                updateSetting('difficulty', option.value);
              }}
              marks={DIFFICULTY_MARKS}
            />
          </section>
        );
      }
      case 'dm': {
        return (
          <section className="card space-y-6 p-8">
            <div className="space-y-2">
              <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">DM Personality Suite</h2>
              <p className="text-sm text-shadow-300">
                Tune the Dungeon Master&apos;s cadence, narrative weight, and player engagement. Each slider maps
                directly to the system prompt.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <DiscreteSlider
                id="verbosity-slider"
                label="Verbosity"
                value={settings.dmStyle.verbosity}
                onChange={(value) => updateDMStyle('verbosity', value as ScaleLevel)}
                marks={VERBOSITY_MARKS}
              />
              <DiscreteSlider
                id="detail-slider"
                label="Descriptive Detail"
                value={settings.dmStyle.detail}
                onChange={(value) => updateDMStyle('detail', value as ScaleLevel)}
                marks={DETAIL_MARKS}
              />
              <DiscreteSlider
                id="engagement-slider"
                label="Player Engagement"
                value={settings.dmStyle.engagement}
                onChange={(value) => updateDMStyle('engagement', value as ScaleLevel)}
                marks={ENGAGEMENT_MARKS}
              />
              <DiscreteSlider
                id="narrative-slider"
                label="Narrative Guidance"
                value={settings.dmStyle.narrative}
                onChange={(value) => updateDMStyle('narrative', value as ScaleLevel)}
                marks={NARRATIVE_MARKS}
              />
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
                Performance Mode
              </span>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SPECIAL_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => updateDMStyle('specialMode', option.id)}
                    className={clsx(
                      'rounded-lg border px-4 py-3 text-left text-sm transition-all duration-200',
                      settings.dmStyle.specialMode === option.id
                        ? 'border-accent/40 bg-gradient-to-br from-accent/15 via-aurora-500/20 to-midnight-700/40 shadow-[0_20px_40px_rgba(122,73,217,0.25)]'
                        : 'border-midnight-500/60 bg-midnight-500/30 hover:border-accent/30 hover:bg-midnight-400/40'
                    )}
                  >
                    <p className="font-semibold text-accent">{option.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-shadow-200">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="dm-directives"
                className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400"
              >
                Custom Directives
              </label>
              <textarea
                id="dm-directives"
                value={settings.dmStyle.customDirectives}
                onChange={(event) => updateDMStyle('customDirectives', event.target.value)}
                className="input-style w-full min-h-[100px] resize-y"
                placeholder="List bespoke instructions or table rules the DM must honor."
              />
            </div>
          </section>
        );
      }
      case 'preview':
      default: {
        return (
          <section className="card space-y-6 p-8">
            <div className="space-y-2">
              <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">
                System Prompt Preview
              </h2>
              <p className="text-xs uppercase tracking-[0.4em] text-shadow-500">
                This is the exact instruction block sent to the Dungeon Master agent.
              </p>
            </div>
            <pre className="max-h-96 overflow-auto rounded-lg border border-midnight-500/60 bg-midnight-400/40 p-6 text-sm leading-relaxed text-shadow-100">
              {systemPrompt}
            </pre>
          </section>
        );
      }
    }
  };

  return (
    <PrivateLayout showNavbar={false}>
      {loading && <LoadingOverlay message={t('worldSettings.creating')} />}
      <div className="relative mx-auto min-h-screen max-w-6xl px-6 py-16 sm:px-10 lg:px-12">
        <div className="space-y-10">
          <header className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.45em] text-shadow-500">Forge Your Campaign</p>
            <h1 className="font-display text-3xl uppercase tracking-[0.4em] text-aurora-300 sm:text-4xl">
              {t('worldSettings.title')}
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-shadow-300">
              Shape the realm, calibrate the Dungeon Master, and preview the exact system prompt that will drive your
              table&apos;s legend.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="rounded-2xl border border-midnight-500/60 bg-midnight-500/30 p-5 sm:p-6">
              <nav aria-label="Create adventure steps" className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.4em] text-shadow-400">Creation Steps</span>
                  <span className="text-xs uppercase tracking-[0.35em] text-shadow-300">
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                </div>
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {WIZARD_STEPS.map((step, index) => {
                    const status =
                      index === currentStep ? 'current' : index < currentStep ? 'complete' : ('upcoming' as const);
                    return (
                      <li key={step.id}>
                        <button
                          type="button"
                          onClick={() => goToStep(index)}
                          className={clsx(
                            'flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition-all duration-200',
                            status === 'current' &&
                              'border-accent/60 bg-gradient-to-br from-accent/15 via-nebula-500/25 to-midnight-700/40 text-accent',
                            status === 'complete' &&
                              'border-aurora-500/60 bg-aurora-500/10 text-aurora-200 hover:border-aurora-400/70',
                            status === 'upcoming' &&
                              'border-midnight-500/60 bg-midnight-500/20 text-shadow-400 hover:border-midnight-400/60 hover:text-shadow-200'
                          )}
                        >
                          <span
                            className={clsx(
                              'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.35em]',
                              status === 'current'
                                ? 'border-accent/60 bg-accent/20 text-accent'
                                : status === 'complete'
                                  ? 'border-aurora-400/60 bg-aurora-400/20 text-aurora-100'
                                  : 'border-midnight-500/60 bg-midnight-500/30 text-shadow-300'
                            )}
                          >
                            {index + 1}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.35em]">{step.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>

            {renderStepContent()}

            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-900/40 p-4 text-sm text-red-200">{error}</div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate('/lobby')}
                disabled={loading}
                className="btn-secondary sm:flex-none sm:self-start"
              >
                {t('worldSettings.cancel')}
              </button>
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    disabled={loading}
                    className="btn-secondary sm:min-w-[150px]"
                  >
                    Previous Step
                  </button>
                )}
                <button type="submit" disabled={loading} className="btn-primary sm:min-w-[170px]">
                  {isFinalStep ? (loading ? t('worldSettings.creating') : t('worldSettings.create')) : 'Next Step'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PrivateLayout>
  );
}
