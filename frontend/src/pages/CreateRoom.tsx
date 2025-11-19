import clsx from 'clsx';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';

import { CharacterCreationModal } from '../components/room/CharacterCreationModal';
import DiscreteSlider, { type SliderMark } from '../components/forms/DiscreteSlider';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import PrivateLayout from '../components/layout/PrivateLayout';
import { createRoom, addCharacter } from '../services/api';
import { WorldPreview } from '../components/create-room/WorldPreview';
import { DEFAULT_GENERATION_PARAMS, type GenerationParams } from '../hooks/useWorldGeneration';
import type { Room, WorldSettings, WorldType, DMStyle, ScaleLevel, DMPerformanceMode } from '../types/shared';
import { WORLD_ARCHETYPES } from '../constants/worldArchetypes';
import {
  ARCHETYPE_SIGILS,
  WIZARD_GROUPS,
  type WizardGroup,
  VERBOSITY_MARK_KEYS,
  VERBOSITY_FALLBACK,
  DETAIL_MARK_KEYS,
  DETAIL_FALLBACK,
  ENGAGEMENT_MARK_KEYS,
  ENGAGEMENT_FALLBACK,
  NARRATIVE_MARK_KEYS,
  NARRATIVE_FALLBACK,
  SPECIAL_MODE_KEYS,
  SPECIAL_MODE_FALLBACK,
  ADVENTURE_LENGTH_VALUES,
  ADVENTURE_LENGTH_FALLBACK,
  DIFFICULTY_VALUES,
  DIFFICULTY_FALLBACK,
  WORLD_SIZE_VALUES,
  WORLD_SIZE_FALLBACK,
} from './create-room/constants';

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [currentGroup, setCurrentGroup] = useState(0);
  const [completedGroups, setCompletedGroups] = useState<Set<number>>(new Set());

  const [generatedRoom, setGeneratedRoom] = useState<Room | null>(null);
  const [showCharacterModal, setShowCharacterModal] = useState(false);

  // Terrain generation state
  const [seed, setSeed] = useState<string>('daicer-world');
  const [generationParams, setGenerationParams] = useState<GenerationParams>(DEFAULT_GENERATION_PARAMS);

  const verbosityMarks = useMemo<SliderMark[]>(
    () =>
      VERBOSITY_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: (() => {
          const labelKey = `createWizard.marks.verbosity.${key}.label`;
          const translated = t(labelKey);
          return translated === labelKey ? VERBOSITY_FALLBACK[key].label : translated;
        })(),
        description: (() => {
          const descriptionKey = `createWizard.marks.verbosity.${key}.description`;
          const translated = t(descriptionKey);
          return translated === descriptionKey ? VERBOSITY_FALLBACK[key].description : translated;
        })(),
      })),
    [t]
  );

  const detailMarks = useMemo<SliderMark[]>(
    () =>
      DETAIL_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: (() => {
          const labelKey = `createWizard.marks.detail.${key}.label`;
          const translated = t(labelKey);
          return translated === labelKey ? DETAIL_FALLBACK[key].label : translated;
        })(),
        description: (() => {
          const descriptionKey = `createWizard.marks.detail.${key}.description`;
          const translated = t(descriptionKey);
          return translated === descriptionKey ? DETAIL_FALLBACK[key].description : translated;
        })(),
      })),
    [t]
  );

  const engagementMarks = useMemo<SliderMark[]>(
    () =>
      ENGAGEMENT_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: (() => {
          const labelKey = `createWizard.marks.engagement.${key}.label`;
          const translated = t(labelKey);
          return translated === labelKey ? ENGAGEMENT_FALLBACK[key].label : translated;
        })(),
        description: (() => {
          const descriptionKey = `createWizard.marks.engagement.${key}.description`;
          const translated = t(descriptionKey);
          return translated === descriptionKey ? ENGAGEMENT_FALLBACK[key].description : translated;
        })(),
      })),
    [t]
  );

  const narrativeMarks = useMemo<SliderMark[]>(
    () =>
      NARRATIVE_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: (() => {
          const labelKey = `createWizard.marks.narrative.${key}.label`;
          const translated = t(labelKey);
          return translated === labelKey ? NARRATIVE_FALLBACK[key].label : translated;
        })(),
        description: (() => {
          const descriptionKey = `createWizard.marks.narrative.${key}.description`;
          const translated = t(descriptionKey);
          return translated === descriptionKey ? NARRATIVE_FALLBACK[key].description : translated;
        })(),
      })),
    [t]
  );

  const specialModeOptions = useMemo(
    () =>
      SPECIAL_MODE_KEYS.map(({ id, key }) => ({
        id,
        label: (() => {
          const labelKey = `createWizard.specialModes.${key}.label`;
          const translated = t(labelKey);
          return translated === labelKey ? (SPECIAL_MODE_FALLBACK[key]?.label ?? key) : translated;
        })(),
        description: (() => {
          const descriptionKey = `createWizard.specialModes.${key}.description`;
          const translated = t(descriptionKey);
          return translated === descriptionKey ? (SPECIAL_MODE_FALLBACK[key]?.description ?? '') : translated;
        })(),
      })),
    [t]
  );

  const adventureLengthOptions = useMemo(
    () =>
      ADVENTURE_LENGTH_VALUES.map((value) => ({
        value,
        label: (() => {
          const labelKey = `createWizard.adventureLength.${value}.label`;
          const translated = t(labelKey);
          return translated === labelKey ? ADVENTURE_LENGTH_FALLBACK[value].label : translated;
        })(),
        detail: (() => {
          const detailKey = `createWizard.adventureLength.${value}.detail`;
          const translated = t(detailKey);
          return translated === detailKey ? ADVENTURE_LENGTH_FALLBACK[value].detail : translated;
        })(),
        description: (() => {
          const descriptionKey = `createWizard.adventureLength.${value}.description`;
          const translated = t(descriptionKey);
          return translated === descriptionKey ? ADVENTURE_LENGTH_FALLBACK[value].description : translated;
        })(),
      })),
    [t]
  );

  const difficultyOptions = useMemo(
    () =>
      DIFFICULTY_VALUES.map((value) => ({
        value,
        label: (() => {
          const labelKey = `createWizard.difficulty.${value}.label`;
          const translated = t(labelKey);
          return translated === labelKey ? DIFFICULTY_FALLBACK[value].label : translated;
        })(),
        detail: (() => {
          const detailKey = `createWizard.difficulty.${value}.detail`;
          const translated = t(detailKey);
          return translated === detailKey ? DIFFICULTY_FALLBACK[value].detail : translated;
        })(),
        description: (() => {
          const descriptionKey = `createWizard.difficulty.${value}.description`;
          const translated = t(descriptionKey);
          return translated === descriptionKey ? DIFFICULTY_FALLBACK[value].description : translated;
        })(),
      })),
    [t]
  );

  const worldSizeOptions = useMemo(
    () =>
      WORLD_SIZE_VALUES.map((value) => ({
        value,
        label: (() => {
          const labelKey = `createWizard.worldSize.${value}.label`;
          const translated = t(labelKey);
          return translated === labelKey ? WORLD_SIZE_FALLBACK[value].label : translated;
        })(),
        detail: (() => {
          const detailKey = `createWizard.worldSize.${value}.detail`;
          const translated = t(detailKey);
          return translated === detailKey ? WORLD_SIZE_FALLBACK[value].detail : translated;
        })(),
        description: (() => {
          const descriptionKey = `createWizard.worldSize.${value}.description`;
          const translated = t(descriptionKey);
          return translated === descriptionKey ? WORLD_SIZE_FALLBACK[value].description : translated;
        })(),
      })),
    [t]
  );

  const worldSizeMarks = useMemo<SliderMark[]>(
    () =>
      worldSizeOptions.map((option, index) => ({
        value: index,
        label: option.label,
        description: `${option.detail} — ${option.description}`,
      })),
    [worldSizeOptions]
  );

  const adventureLengthMarks = useMemo<SliderMark[]>(
    () =>
      adventureLengthOptions.map((option, index) => ({
        value: index,
        label: option.label,
        description: `${option.detail} — ${option.description}`,
      })),
    [adventureLengthOptions]
  );

  const difficultyMarks = useMemo<SliderMark[]>(
    () =>
      difficultyOptions.map((option, index) => ({
        value: index,
        label: option.label,
        description: `${option.detail} — ${option.description}`,
      })),
    [difficultyOptions]
  );

  const defaultArchetype = WORLD_ARCHETYPES.terra;
  const getArchetypeDefaults = (type: WorldType) => {
    const archetype = WORLD_ARCHETYPES[type];
    const key = archetype.translationKey;
    const resolve = (suffix: string, fallbackValue: string) => {
      const translated = t(`${key}.${suffix}`);
      return translated === `${key}.${suffix}` ? fallbackValue : translated;
    };

    return {
      theme: resolve('theme', archetype.theme),
      setting: resolve('setting', archetype.setting),
      tone: resolve('tone', archetype.tone),
      background: resolve('background', archetype.background ?? ''),
    };
  };

  const defaultArchetypeDefaults = getArchetypeDefaults(defaultArchetype.type);

  const [settings, setSettings] = useState<WorldSettings>({
    worldType: 'terra',
    worldSize: 'small',
    theme: defaultArchetypeDefaults.theme,
    setting: defaultArchetypeDefaults.setting,
    tone: defaultArchetypeDefaults.tone,
    worldBackground: defaultArchetypeDefaults.background,
    dmStyle: {
      verbosity: 1,
      detail: 1,
      engagement: 1,
      narrative: 1,
      specialMode: null,
      customDirectives: '',
    },
    dmSystemPrompt: '',
    playerCount: 4,
    adventureLength: 'short',
    difficulty: 'easy',
    startingLevel: 1,
    attributePointBudget: 27,
    language,
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(
      'roomCreationDraft',
      JSON.stringify({
        settings,
        currentGroup,
      })
    );
  }, [settings, currentGroup]);

  // Validation functions
  const validateGroup = (groupIndex: number): boolean => {
    const groupName = WIZARD_GROUPS[groupIndex];
    switch (groupName) {
      case 'dmAndScope':
        return !!settings.theme && !!settings.tone && !!settings.setting;
      case 'terrainBuilder':
        return true; // Always valid as it has defaults
      default:
        return false;
    }
  };

  const canNavigateToGroup = (targetGroup: number): boolean => {
    // Can always go back
    if (targetGroup < currentGroup) return true;

    // Can only advance if current group is complete
    if (targetGroup === currentGroup + 1) {
      return validateGroup(currentGroup);
    }

    // Can't skip ahead
    return false;
  };

  const goToGroup = (index: number) => {
    if (canNavigateToGroup(index)) {
      setCurrentGroup(index);
      if (validateGroup(currentGroup)) {
        setCompletedGroups(new Set([...completedGroups, currentGroup]));
      }
    }
  };

  const goToNextGroup = () => {
    if (validateGroup(currentGroup)) {
      setCompletedGroups(new Set([...completedGroups, currentGroup]));
      setCurrentGroup(Math.min(currentGroup + 1, WIZARD_GROUPS.length - 1));
    } else {
      setError('Please complete all required fields before continuing');
    }
  };

  const goToPreviousGroup = () => {
    setCurrentGroup(Math.max(0, currentGroup - 1));
    setError(null);
  };

  const updateSetting = <K extends keyof WorldSettings>(key: K, value: WorldSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleArchetypeChange = (newType: WorldType) => {
    const defaults = getArchetypeDefaults(newType);
    setSettings((prev) => ({
      ...prev,
      worldType: newType,
      theme: defaults.theme,
      setting: defaults.setting,
      tone: defaults.tone,
      worldBackground: defaults.background || prev.worldBackground,
    }));
  };

  const updateDMStyle = <K extends keyof DMStyle>(key: K, value: DMStyle[K]) => {
    setSettings((prev) => ({
      ...prev,
      dmStyle: { ...prev.dmStyle, [key]: value },
    }));
  };

  const handleParamsChange = React.useCallback((params: GenerationParams, newSeed: string) => {
    setGenerationParams(params);
    setSeed(newSeed);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const isFinalGroup = currentGroup === WIZARD_GROUPS.length - 1;

    if (!isFinalGroup) {
      goToNextGroup();
      return;
    }

    // Final group: Create Room
    setLoading(true);
    setError(null);

    try {
      // Create room with settings AND generation params
      // We'll pass the seed and generation params as part of the settings object
      // assuming the backend will store them in the room settings
      const room = await createRoom({
        settings: {
          ...settings,
          // @ts-ignore - Adding these properties dynamically if not in type
          seed,
          generationParams
        }
      });

      setGeneratedRoom(room);
      setShowCharacterModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSubmit = async (character: any) => {
    if (!generatedRoom) return;

    setLoading(true);
    try {
      await addCharacter(generatedRoom.id, character);
      navigate(`/room/${generatedRoom.id}`);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const renderGroupContent = () => {
    switch (WIZARD_GROUPS[currentGroup]) {
      case 'dmAndScope': {
        const worldSizeIndex = Math.max(
          0,
          worldSizeOptions.findIndex((option) => option.value === settings.worldSize)
        );
        const adventureLengthIndex = Math.max(
          0,
          adventureLengthOptions.findIndex((option) => option.value === settings.adventureLength)
        );
        const difficultyIndex = Math.max(
          0,
          difficultyOptions.findIndex((option) => option.value === settings.difficulty)
        );

        return (
          <div className="space-y-8">
            {/* Section 1: DM Style & Personality */}
            <section className="card space-y-8 p-8" data-testid="wizard-group-dm">
              <div className="space-y-2">
                <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">
                  DM Personality & Style
                </h2>
                <p className="text-sm text-shadow-300">Configure your AI Dungeon Master's narration style</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <DiscreteSlider
                  id="verbosity-slider"
                  label="Verbosity"
                  value={settings.dmStyle.verbosity}
                  onChange={(value) => updateDMStyle('verbosity', value as ScaleLevel)}
                  marks={verbosityMarks}
                />
                <DiscreteSlider
                  id="detail-slider"
                  label="Detail Level"
                  value={settings.dmStyle.detail}
                  onChange={(value) => updateDMStyle('detail', value as ScaleLevel)}
                  marks={detailMarks}
                />
                <DiscreteSlider
                  id="engagement-slider"
                  label="Player Engagement"
                  value={settings.dmStyle.engagement}
                  onChange={(value) => updateDMStyle('engagement', value as ScaleLevel)}
                  marks={engagementMarks}
                />
                <DiscreteSlider
                  id="narrative-slider"
                  label="Narrative Control"
                  value={settings.dmStyle.narrative}
                  onChange={(value) => updateDMStyle('narrative', value as ScaleLevel)}
                  marks={narrativeMarks}
                />
              </div>

              {/* Special Mode */}
              <div className="mt-6 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
                  Performance Mode
                </span>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {specialModeOptions.map((option) => (
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
            </section>

            {/* Section 2: Scope & Characters */}
            <section className="card space-y-8 p-8" data-testid="wizard-group-scope">
              <div className="space-y-2">
                <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">
                  Campaign Scope & Characters
                </h2>
                <p className="text-sm text-shadow-300">Set the scale of your adventure and party details</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <DiscreteSlider
                  id="world-size-slider"
                  label="World Size"
                  value={worldSizeIndex}
                  onChange={(index) => {
                    const option = worldSizeOptions[index];
                    if (option) updateSetting('worldSize', option.value);
                  }}
                  marks={worldSizeMarks}
                />
                <DiscreteSlider
                  id="adventure-length-slider"
                  label="Adventure Length"
                  value={adventureLengthIndex}
                  onChange={(index) => {
                    const option = adventureLengthOptions[index];
                    if (option) updateSetting('adventureLength', option.value);
                  }}
                  marks={adventureLengthMarks}
                />
                <DiscreteSlider
                  id="difficulty-slider"
                  label="Difficulty"
                  value={difficultyIndex}
                  onChange={(index) => {
                    const option = difficultyOptions[index];
                    if (option) updateSetting('difficulty', option.value);
                  }}
                  marks={difficultyMarks}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-midnight-500/50">
                <DiscreteSlider
                  id="party-size-slider"
                  label="Party Size"
                  value={settings.playerCount}
                  onChange={(value) => updateSetting('playerCount', Math.max(1, Math.min(value, 8)))}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 4, label: '4' },
                    { value: 8, label: '8' },
                  ]}
                />
                <DiscreteSlider
                  id="starting-level-slider"
                  label="Starting Level"
                  value={settings.startingLevel}
                  onChange={(value) => updateSetting('startingLevel', Math.max(1, Math.min(value, 20)))}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                  ]}
                />
              </div>
            </section>

            {/* Section 3: Story Frame */}
            <section className="card space-y-8 p-8" data-testid="wizard-group-story">
              <div className="space-y-2">
                <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">Story Frame</h2>
                <p className="text-sm text-shadow-300">Choose the genre and setting for your world</p>
              </div>

              {/* World Archetype Selector */}
              <div className="mb-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                        'flex flex-col gap-2 overflow-hidden rounded-xl border px-4 py-3 text-left transition-all duration-200',
                        isActive
                          ? 'border-aurora-500/60 bg-aurora-500/15 shadow-[0_20px_35px_rgba(211,143,31,0.25)]'
                          : 'border-midnight-500/60 bg-midnight-500/30 hover:border-aurora-400/40 hover:bg-midnight-400/40'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {Sigil && <Sigil className="h-5 w-5 text-aurora-300" aria-hidden />}
                        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-shadow-300">
                          {archetype.type}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Theme, Tone, Setting inputs */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="theme-input" className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
                    Theme *
                  </label>
                  <input
                    id="theme-input"
                    type="text"
                    value={settings.theme}
                    onChange={(event) => updateSetting('theme', event.target.value)}
                    className="input-style w-full"
                    placeholder="High Fantasy"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tone-input" className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
                    Tone *
                  </label>
                  <input
                    id="tone-input"
                    type="text"
                    value={settings.tone}
                    onChange={(event) => updateSetting('tone', event.target.value)}
                    className="input-style w-full"
                    placeholder="Heroic"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="setting-input" className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
                  Primary Setting *
                </label>
                <input
                  id="setting-input"
                  type="text"
                  value={settings.setting}
                  onChange={(event) => updateSetting('setting', event.target.value)}
                  className="input-style w-full"
                  placeholder="Medieval Kingdom"
                />
              </div>
            </section>
          </div>
        );
      }

      case 'terrainBuilder': {
        return (
          <section className="space-y-6" data-testid="wizard-group-terrain">
            <div className="card p-8">
              <div className="space-y-2 mb-6">
                <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">
                  Terrain Builder
                </h2>
                <p className="text-sm text-shadow-300">Design your world's geography and structures</p>
              </div>

              <WorldPreview
                initialSeed={seed}
                onParamsChange={handleParamsChange}
              />
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  const getGroupLabel = (group: WizardGroup): string => {
    switch (group) {
      case 'dmAndScope':
        return 'DM & Scope';
      case 'terrainBuilder':
        return 'Terrain Builder';
      default:
        return group;
    }
  };

  return (
    <PrivateLayout showNavbar={false}>
      {loading && <LoadingOverlay message="Creating room..." />}
      <div className="relative mx-auto min-h-screen max-w-6xl px-6 py-16 sm:px-10 lg:px-12">
        <div className="space-y-10">
          <header className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.45em] text-shadow-500">Room Creation Wizard</p>
            <h1 className="font-display text-3xl uppercase tracking-[0.4em] text-aurora-300 sm:text-4xl">
              Create Your Campaign
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-shadow-300">
              Configure your AI Dungeon Master and world in {WIZARD_GROUPS.length} simple steps
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Progress Navigation */}
            <div className="rounded-2xl border border-midnight-500/60 bg-midnight-500/30 p-5 sm:p-6">
              <nav aria-label="Wizard steps" className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.4em] text-shadow-400">
                    Step {currentGroup + 1} of {WIZARD_GROUPS.length}
                  </span>
                </div>
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {WIZARD_GROUPS.map((groupId, index) => {
                    const status =
                      index === currentGroup ? 'current' : completedGroups.has(index) ? 'complete' : 'upcoming';
                    const canClick = canNavigateToGroup(index);

                    return (
                      <li key={groupId}>
                        <button
                          type="button"
                          onClick={() => goToGroup(index)}
                          disabled={!canClick}
                          className={clsx(
                            'flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition-all duration-200',
                            status === 'current' &&
                            'border-accent/60 bg-gradient-to-br from-accent/15 via-nebula-500/25 to-midnight-700/40 text-accent',
                            status === 'complete' &&
                            'border-aurora-500/60 bg-aurora-500/10 text-aurora-200 hover:border-aurora-400/70 cursor-pointer',
                            status === 'upcoming' &&
                            'border-midnight-500/60 bg-midnight-500/20 text-shadow-400 cursor-not-allowed opacity-60'
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
                          <span className="text-xs font-semibold uppercase tracking-[0.35em]">
                            {getGroupLabel(groupId)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>

            {renderGroupContent()}

            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-900/40 p-4 text-sm text-red-200">{error}</div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={loading}
                className="btn-secondary sm:flex-none sm:self-start"
              >
                Cancel
              </button>
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end">
                {currentGroup > 0 && (
                  <button
                    type="button"
                    onClick={goToPreviousGroup}
                    disabled={loading}
                    className="btn-secondary sm:min-w-[150px]"
                    data-testid="wizard-previous-button"
                  >
                    Previous
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || !validateGroup(currentGroup)}
                  className="btn-primary sm:min-w-[170px]"
                  data-testid={
                    currentGroup === WIZARD_GROUPS.length - 1
                      ? 'wizard-create-room-button'
                      : 'wizard-next-button'
                  }
                >
                  {currentGroup === WIZARD_GROUPS.length - 1
                    ? loading
                      ? 'Creating...'
                      : 'Create Room'
                    : 'Next'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Character Creation Modal */}
      {showCharacterModal && generatedRoom && (
        <CharacterCreationModal
          onSubmit={handleCharacterSubmit}
          onCancel={() => setShowCharacterModal(false)}
        />
      )}
    </PrivateLayout>
  );
}
