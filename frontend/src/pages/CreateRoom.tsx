import clsx from 'clsx';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, addCharacter, invokeDMStoryGraph, invokeWorldConfigGraph } from '../services/api';
import { auth } from '../services/firebase';
import { useI18n } from '../i18n';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { PrivateLayout } from '../components/layout';
import { WORLD_ARCHETYPES } from '../constants/worldArchetypes';
import DiscreteSlider, { type SliderMark } from '../components/forms/DiscreteSlider';
import MarkdownMessage from '../components/game/MarkdownMessage';
import { DiceLoader } from '../components/ui';
import { MapRenderer } from '../components/world/MapRenderer';
import { HistoryTimeline } from '../components/world/HistoryTimeline';
import ToolCallCard from '../components/chat/ToolCallCard';
import { CharacterCreationModal } from '../components/room/CharacterCreationModal';
import { WorldGenProgress, PeriodProgress } from '../components/world/WorldGenProgress';
import { useGraphStream } from '../hooks/useGraphStream';
import { useGraphProgress } from '../hooks/useGraphProgress';
import { SectionLoadingState } from '../components/graph/SectionLoadingState';
import type { ToolCall } from '../services/socket';
import type { Room, WorldSettings, WorldType } from '../types/shared';
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
  const [currentGroup, setCurrentGroup] = useState(0);
  const [completedGroups, setCompletedGroups] = useState<Set<number>>(new Set());
  const [generatedRoom, setGeneratedRoom] = useState<Room | null>(null);

  const [worldGeneration, setWorldGeneration] = useState<{
    status: 'idle' | 'generating' | 'done' | 'error';
  }>({ status: 'idle' });

  const [showCharacterModal, setShowCharacterModal] = useState(false);

  // NEW: Section graph outputs
  const [sectionOutputs, setSectionOutputs] = useState<{
    section1: any | null;
    section2: any | null;
  }>({
    section1: null,
    section2: null,
  });

  const [loadingSection, setLoadingSection] = useState<1 | 2 | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);

  // NEW: Graph progress hook for SSE
  const graphProgress = useGraphProgress(generatedRoom?.id || '', undefined);

  // Graph stream hook for world generation events
  const {
    addEvent: addGraphEvent,
    clearEvents: clearGraphEvents,
    currentPhase,
    progressPercentage,
    errorState,
    isRetrying,
  } = useGraphStream();

  const [streamEvents, setStreamEvents] = useState<
    Array<{
      type: string;
      tool?: string;
      args?: any;
      output?: any;
      name?: string;
      node?: string;
      phase?: string;
      progress?: number;
      step?: string;
      periodNumber?: number;
      totalPeriods?: number;
      yearRange?: string;
      periodName?: string;
      structuresAdded?: number;
      totalYears?: number;
      periodCount?: number;
      structureCount?: number;
      totalStructures?: number;
      totalRoads?: number;
      chunkX?: number;
      chunkY?: number;
      chunkZ?: number;
      completed?: number;
      total?: number;
      totalChunks?: number;
      narrative?: string;
    }>
  >([]);

  // Master preset states for simplified UX
  const [complexityPreset, setComplexityPreset] = useState<'simple' | 'moderate' | 'elaborate'>('simple');
  const [worldRichnessPreset, setWorldRichnessPreset] = useState<'minimal' | 'standard' | 'rich'>('minimal');

  const [worldGenSettings, setWorldGenSettings] = useState({
    historyDepth: 200,
    eraCount: 2,
    structureDensity: 2,
    structureTypes: [] as string[],
    enableRoads: true,
    roadQuality: 'medium' as 'trail' | 'path' | 'road' | 'highway' | 'medium',
    terrainComplexity: 1,
  });

  // Initialize from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('roomCreationDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.worldGenSettings) setWorldGenSettings(parsed.worldGenSettings);
        if (typeof parsed.currentGroup === 'number') setCurrentGroup(parsed.currentGroup);
        if (parsed.complexityPreset) setComplexityPreset(parsed.complexityPreset);
        if (parsed.worldRichnessPreset) setWorldRichnessPreset(parsed.worldRichnessPreset);
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }
  }, []);

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
    ...worldGenSettings,
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(
      'roomCreationDraft',
      JSON.stringify({
        settings,
        worldGenSettings,
        currentGroup,
        complexityPreset,
        worldRichnessPreset,
      })
    );
  }, [settings, worldGenSettings, currentGroup, complexityPreset, worldRichnessPreset]);

  // Validation functions
  const validateGroup = (groupIndex: number): boolean => {
    switch (groupIndex) {
      case 0: // DM & Scope
        return !!settings.theme && !!settings.tone && !!settings.setting;
      case 1: // World Config
        return settings.historyDepth !== undefined && (settings.structureDensity || 0) > 0;
      case 2: // Characters
        return settings.playerCount >= 1 && settings.startingLevel >= 1;
      case 3: // In-Room (all optional)
        return true;
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
    // Clear section outputs when going backwards
    if (currentGroup === 1 && generatedRoom) {
      setSectionOutputs((prev) => ({ ...prev, section2: null }));
    }
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

  // Master complexity preset handler
  const handleComplexityChange = (preset: 'simple' | 'moderate' | 'elaborate') => {
    setComplexityPreset(preset);

    const presets = {
      simple: {
        dmStyle: { verbosity: 1, detail: 1, engagement: 1, narrative: 1 },
        worldSize: 'small' as const,
        adventureLength: 'short' as const,
        difficulty: 'easy' as const,
      },
      moderate: {
        dmStyle: { verbosity: 3, detail: 3, engagement: 3, narrative: 3 },
        worldSize: 'medium' as const,
        adventureLength: 'medium' as const,
        difficulty: 'medium' as const,
      },
      elaborate: {
        dmStyle: { verbosity: 5, detail: 5, engagement: 5, narrative: 5 },
        worldSize: 'large' as const,
        adventureLength: 'long' as const,
        difficulty: 'challenging' as const,
      },
    };

    const config = presets[preset];
    setSettings((prev) => ({
      ...prev,
      dmStyle: { ...prev.dmStyle, ...config.dmStyle },
      worldSize: config.worldSize,
      adventureLength: config.adventureLength,
      difficulty: config.difficulty,
    }));
  };

  // Master world richness preset handler
  const handleWorldRichnessChange = (preset: 'minimal' | 'standard' | 'rich') => {
    setWorldRichnessPreset(preset);

    const presets = {
      minimal: {
        historyDepth: 200,
        eraCount: 2,
        structureDensity: 2,
        terrainComplexity: 1,
      },
      standard: {
        historyDepth: 500,
        eraCount: 5,
        structureDensity: 5,
        terrainComplexity: 3,
      },
      rich: {
        historyDepth: 1000,
        eraCount: 10,
        structureDensity: 10,
        terrainComplexity: 5,
      },
    };

    const config = presets[preset];
    setWorldGenSettings((prev) => ({
      ...prev,
      ...config,
    }));
  };

  // NEW: Section 1 Handler (DM Story) - Returns result for chaining
  const handleSection1Complete = async (room: Room) => {
    setLoadingSection(1);
    setSectionError(null);
    graphProgress.setCurrentSection(1);

    try {
      const result = await invokeDMStoryGraph({
        roomId: room.id,
        language,
        settings: {
          theme: settings.theme,
          tone: settings.tone,
          setting: settings.setting,
          worldBackground: settings.worldBackground,
          worldType: settings.worldType,
          dmStyle: {
            verbosity: settings.dmStyle.verbosity,
            detail: settings.dmStyle.detail,
            engagement: settings.dmStyle.engagement,
            narrative: settings.dmStyle.narrative,
            specialMode: settings.dmStyle.specialMode,
            customDirectives: settings.dmStyle.customDirectives || undefined,
          },
          worldSize: settings.worldSize,
          adventureLength: settings.adventureLength,
          difficulty: settings.difficulty,
          historyDepth: worldGenSettings.historyDepth,
          eraCount: worldGenSettings.eraCount,
        },
      });

      // No caching needed - data persists in Firestore
      setSectionOutputs((prev) => ({ ...prev, section1: result }));
      return result; // Return for handleGenerateWorld
    } catch (error) {
      setSectionError(error instanceof Error ? error.message : 'Section 1 generation failed');
      throw error; // Re-throw for handleGenerateWorld to catch
    } finally {
      setLoadingSection(null);
      graphProgress.setCurrentSection(null);
    }
  };

  // NEW: Section 2 Handler (World Config) - Accepts section1 result as param
  const handleSection2Complete = async (
    room: Room,
    section1Result: { historyPeriods: any[]; conditions: any[]; worldHistory: string }
  ) => {
    setLoadingSection(2);
    setSectionError(null);
    graphProgress.setCurrentSection(2);

    try {
      const result = await invokeWorldConfigGraph({
        roomId: room.id,
        settings: {
          // World config specific settings
          structureDensity: worldGenSettings.structureDensity,
          structureTypes: worldGenSettings.structureTypes,
          enableRoads: worldGenSettings.enableRoads,
          roadQuality: worldGenSettings.roadQuality === 'medium' ? 'road' : worldGenSettings.roadQuality,
          terrainComplexity: worldGenSettings.terrainComplexity,
          // Grid generation needs these from room settings
          theme: settings.theme,
          setting: settings.setting,
          tone: settings.tone,
          playerCount: settings.playerCount,
          adventureLength: settings.adventureLength,
          difficulty: settings.difficulty,
        },
        historyPeriods: section1Result.historyPeriods,
        conditions: section1Result.conditions,
        worldHistory: section1Result.worldHistory,
      });

      // No caching needed - data persists in Firestore
      setSectionOutputs((prev) => ({ ...prev, section2: result }));

      // Update generatedRoom with results
      setGeneratedRoom({
        ...room,
        worldDescription: result.worldDescription,
        structures: result.structures,
        roads: result.roads,
      });

      setWorldGeneration({ status: 'done' });
      return result; // Return for potential future use
    } catch (error) {
      setSectionError(error instanceof Error ? error.message : 'Section 2 generation failed');
      throw error; // Re-throw for handleGenerateWorld to catch
    } finally {
      setLoadingSection(null);
      graphProgress.setCurrentSection(null);
    }
  };

  const handleGenerateWorld = async () => {
    setWorldGeneration({ status: 'generating' });
    setStreamEvents([]); // Clear previous events
    clearGraphEvents(); // Clear graph stream events
    setError(null);

    try {
      // Step 1: Create room if it doesn't exist
      let room = generatedRoom;
      if (!room) {
        setLoading(true);
        const fullSettings = {
          ...settings,
          ...worldGenSettings,
          language,
        };
        room = await createRoom({ settings: fullSettings });
        setGeneratedRoom(room);
        setLoading(false);
      }

      // Navigate to opened room immediately after creation
      // World generation will continue in background
      navigate(`/room/${room.id}`);

      // Small delay to allow GameRoom page to mount and connect SSE before graphs start
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 2: Run Section 1 (DM Story - history generation)
      const section1Result = await handleSection1Complete(room);

      if (!section1Result) {
        throw new Error('Section 1 generation failed - no output');
      }

      // Step 3: Run Section 2 (World Config - structures, roads, terrain)
      await handleSection2Complete(room, section1Result);

      // Success - setWorldGeneration status is handled in handleSection2Complete
    } catch (err) {
      setWorldGeneration({ status: 'error' });
      setError(err instanceof Error ? err.message : 'World generation failed');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const isFinalGroup = currentGroup === WIZARD_GROUPS.length - 1;

    // Just advance to next group - don't invoke graphs yet
    if (!isFinalGroup) {
      goToNextGroup();
      return;
    }

    // Final group: either generate world or enter room
    if (generatedRoom && worldGeneration.status === 'done') {
      // World is ready - show character creation modal
      setShowCharacterModal(true);
    } else {
      // World not generated yet - trigger generation
      await handleGenerateWorld();
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

  const currentGroupId = WIZARD_GROUPS[currentGroup];
  const isFinalGroup = currentGroup === WIZARD_GROUPS.length - 1;

  const renderGroupContent = () => {
    switch (currentGroupId) {
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
          <section className="card space-y-8 p-8" data-testid="wizard-group-1">
            <div className="space-y-2">
              <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">
                DM Personality, Scope & Story
              </h2>
              <p className="text-sm text-shadow-300">Configure your AI Dungeon Master and campaign parameters</p>
            </div>

            {/* Master Complexity Slider */}
            <div>
              <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.3em] text-shadow-200">
                Campaign Complexity
              </h3>
              <DiscreteSlider
                id="complexity-slider"
                label="Overall Complexity (Master Control)"
                value={complexityPreset === 'simple' ? 0 : complexityPreset === 'moderate' ? 1 : 2}
                onChange={(index) => {
                  const preset = index === 0 ? 'simple' : index === 1 ? 'moderate' : 'elaborate';
                  handleComplexityChange(preset);
                }}
                marks={[
                  {
                    value: 0,
                    label: 'Simple',
                    description: 'Fast testing: 2 eras, small world, short adventure, easy difficulty',
                  },
                  {
                    value: 1,
                    label: 'Moderate',
                    description: 'Balanced: 5 eras, medium world, standard adventure, medium difficulty',
                  },
                  {
                    value: 2,
                    label: 'Elaborate',
                    description: 'Rich experience: 10 eras, large world, long adventure, challenging',
                  },
                ]}
                description="Sets all DM style and scope sliders below. Adjust individual sliders for fine-tuning."
              />
            </div>

            {/* DM Style Section - Individual Controls */}
            <div>
              <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.3em] text-shadow-200">
                DM Personality (Fine-Tune)
              </h3>
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
            </div>

            {/* Scope Section - Individual Controls */}
            <div>
              <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.3em] text-shadow-200">
                Campaign Scope (Fine-Tune)
              </h3>
              <div className="space-y-6">
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
            </div>

            {/* Story Section */}
            <div>
              <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.3em] text-shadow-200">Story Frame</h3>

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
                  <label
                    htmlFor="theme-input"
                    className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400"
                  >
                    Theme *
                  </label>
                  <input
                    id="theme-input"
                    type="text"
                    value={settings.theme}
                    onChange={(event) => updateSetting('theme', event.target.value)}
                    className="input-style w-full"
                    placeholder="High Fantasy"
                    data-testid="theme-input"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="tone-input"
                    className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400"
                  >
                    Tone *
                  </label>
                  <input
                    id="tone-input"
                    type="text"
                    value={settings.tone}
                    onChange={(event) => updateSetting('tone', event.target.value)}
                    className="input-style w-full"
                    placeholder="Heroic"
                    data-testid="tone-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="setting-input"
                  className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400"
                >
                  Primary Setting *
                </label>
                <input
                  id="setting-input"
                  type="text"
                  value={settings.setting}
                  onChange={(event) => updateSetting('setting', event.target.value)}
                  className="input-style w-full"
                  placeholder="Medieval Kingdom"
                  data-testid="setting-input"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="background-input"
                  className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400"
                >
                  World Background
                </label>
                <textarea
                  id="background-input"
                  value={settings.worldBackground}
                  onChange={(event) => updateSetting('worldBackground', event.target.value)}
                  className="input-style w-full min-h-[100px] resize-y"
                  placeholder="Additional lore and context..."
                />
              </div>
            </div>
          </section>
        );
      }

      case 'worldConfig': {
        return (
          <section className="card space-y-6 p-8" data-testid="wizard-group-2">
            <div className="space-y-2">
              <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">World Configuration</h2>
              <p className="text-sm text-shadow-300">Configure terrain, structures, and world history</p>
            </div>

            {/* Master World Richness Slider */}
            <div>
              <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.3em] text-shadow-200">
                World Richness
              </h3>
              <DiscreteSlider
                id="world-richness-slider"
                label="Overall World Complexity (Master Control)"
                value={worldRichnessPreset === 'minimal' ? 0 : worldRichnessPreset === 'standard' ? 1 : 2}
                onChange={(index) => {
                  const preset = index === 0 ? 'minimal' : index === 1 ? 'standard' : 'rich';
                  handleWorldRichnessChange(preset as 'minimal' | 'standard' | 'rich');
                }}
                marks={[
                  {
                    value: 0,
                    label: 'Minimal',
                    description: 'Fast generation: 2 eras, low density, simple terrain (~30s)',
                  },
                  {
                    value: 1,
                    label: 'Standard',
                    description: 'Balanced world: 5 eras, moderate density, varied terrain (~1-2min)',
                  },
                  {
                    value: 2,
                    label: 'Rich',
                    description: 'Deep history: 10 eras, high density, complex terrain (~2-3min)',
                  },
                ]}
                description="Sets all world generation sliders below. Adjust individual sliders for fine-tuning."
              />
            </div>

            {/* History Section - Individual Controls */}
            <div>
              <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.3em] text-shadow-200">
                World History (Fine-Tune)
              </h3>
              <div className="space-y-6">
                <DiscreteSlider
                  id="history-depth-slider"
                  label="History Depth"
                  value={worldGenSettings.historyDepth}
                  onChange={(value) => setWorldGenSettings({ ...worldGenSettings, historyDepth: value })}
                  marks={[
                    { value: 0, label: 'No History' },
                    { value: 200, label: '200 years' },
                    { value: 500, label: '500 years' },
                    { value: 1000, label: '1000 years' },
                    { value: 2000, label: '2000 years' },
                  ]}
                />
                <DiscreteSlider
                  id="era-count-slider"
                  label="Number of Eras"
                  value={worldGenSettings.eraCount}
                  onChange={(value) => setWorldGenSettings({ ...worldGenSettings, eraCount: value })}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 2, label: '2' },
                    { value: 3, label: '3' },
                    { value: 5, label: '5' },
                    { value: 7, label: '7' },
                    { value: 10, label: '10' },
                  ]}
                />
              </div>
            </div>

            {/* Structures Section - Individual Controls */}
            <div>
              <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.3em] text-shadow-200">
                Structures & Settlements (Fine-Tune)
              </h3>
              <div className="space-y-6">
                <DiscreteSlider
                  id="structure-density-slider"
                  label="Structure Density"
                  value={worldGenSettings.structureDensity}
                  onChange={(value) => setWorldGenSettings({ ...worldGenSettings, structureDensity: value })}
                  marks={[
                    { value: 1, label: 'Sparse' },
                    { value: 2, label: 'Low' },
                    { value: 5, label: 'Moderate' },
                    { value: 10, label: 'Dense' },
                    { value: 20, label: 'Very Dense' },
                  ]}
                />
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
                    Structure Types
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {['settlements', 'ruins', 'dungeons', 'temples', 'fortresses', 'towers'].map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-3 rounded-lg border border-midnight-500/60 bg-midnight-500/30 p-3 cursor-pointer hover:border-aurora-400/30 hover:bg-midnight-400/40 transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={worldGenSettings.structureTypes.includes(type)}
                          onChange={(e) => {
                            const types = e.target.checked
                              ? [...worldGenSettings.structureTypes, type]
                              : worldGenSettings.structureTypes.filter((t) => t !== type);
                            setWorldGenSettings({ ...worldGenSettings, structureTypes: types });
                          }}
                          className="rounded border-midnight-400 text-aurora-400 focus:ring-aurora-400"
                        />
                        <span className="text-sm text-shadow-100 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Terrain Section - Individual Controls */}
            <div>
              <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.3em] text-shadow-200">
                Terrain & Roads (Fine-Tune)
              </h3>
              <div className="space-y-6">
                <DiscreteSlider
                  id="terrain-complexity-slider"
                  label="Terrain Complexity"
                  value={worldGenSettings.terrainComplexity}
                  onChange={(value) => setWorldGenSettings({ ...worldGenSettings, terrainComplexity: value })}
                  marks={[
                    { value: 1, label: 'Simple' },
                    { value: 3, label: 'Moderate' },
                    { value: 5, label: 'Complex' },
                  ]}
                />
                <label className="flex items-center gap-3 rounded-lg border border-midnight-500/60 bg-midnight-500/30 p-4 cursor-pointer hover:border-aurora-400/30 hover:bg-midnight-400/40 transition-all">
                  <input
                    type="checkbox"
                    checked={worldGenSettings.enableRoads}
                    onChange={(e) => setWorldGenSettings({ ...worldGenSettings, enableRoads: e.target.checked })}
                    className="rounded border-midnight-400 text-aurora-400 focus:ring-aurora-400"
                  />
                  <div>
                    <span className="text-sm font-semibold text-shadow-100">Enable Roads</span>
                    <p className="text-xs text-shadow-400 mt-1">Generate road networks between settlements</p>
                  </div>
                </label>
              </div>
            </div>
          </section>
        );
      }

      case 'characters': {
        return (
          <section className="card space-y-6 p-8" data-testid="wizard-group-3">
            <div className="space-y-2">
              <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">Character Setup</h2>
              <p className="text-sm text-shadow-300">Configure default character creation parameters</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <DiscreteSlider
                id="party-size-slider"
                label="Party Size"
                value={settings.playerCount}
                onChange={(value) => updateSetting('playerCount', Math.max(1, Math.min(value, 8)))}
                marks={[
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                  { value: 5, label: '5' },
                  { value: 6, label: '6' },
                  { value: 7, label: '7' },
                  { value: 8, label: '8' },
                ]}
                description="Expected number of players"
              />
              <DiscreteSlider
                id="starting-level-slider"
                label="Starting Level"
                value={settings.startingLevel}
                onChange={(value) => updateSetting('startingLevel', Math.max(1, Math.min(value, 20)))}
                marks={[
                  { value: 1, label: '1' },
                  { value: 3, label: '3' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                  { value: 15, label: '15' },
                  { value: 20, label: '20' },
                ]}
                description="Character starting level"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="attribute-budget"
                className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400"
              >
                Attribute Point Budget
              </label>
              <input
                id="attribute-budget"
                type="number"
                min={15}
                max={40}
                value={settings.attributePointBudget}
                onChange={(e) => updateSetting('attributePointBudget', parseInt(e.target.value, 10))}
                className="input-style w-full"
              />
              <p className="text-xs text-shadow-500">Standard point-buy: 27 points</p>
            </div>
          </section>
        );
      }

      case 'inRoomConfig':
      default: {
        return (
          <section className="space-y-6" data-testid="wizard-group-4">
            <div className="card p-8">
              <div className="space-y-2 mb-6">
                <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">
                  In-Room Configuration
                </h2>
                <p className="text-sm text-shadow-300">Session settings and world preview</p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-shadow-400">
                  Additional session settings (safety tools, turn timers, etc.) can be configured after room creation.
                </p>
              </div>
            </div>

            {/* World Generation Section */}
            {!generatedRoom && (
              <div className="card p-8">
                <div className="text-center">
                  <p className="mb-6 text-shadow-300">
                    Room settings are ready. Create the room first, then generate the world preview.
                  </p>
                </div>
              </div>
            )}

            {generatedRoom && worldGeneration.status === 'idle' && (
              <div className="card p-8">
                <div className="space-y-4 text-center">
                  <h3 className="font-display text-base uppercase tracking-[0.3em] text-aurora-200">
                    Generate World Preview
                  </h3>
                  <p className="text-sm text-shadow-300">
                    Create a procedurally generated world based on your settings
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateWorld}
                    className="btn-primary mx-auto"
                    data-testid="generate-world-button"
                  >
                    <Sparkles className="mr-2 inline-block h-5 w-5" />
                    Generate World
                  </button>
                </div>
              </div>
            )}

            {worldGeneration.status === 'generating' && (
              <div className="space-y-6" data-testid="world-gen-progress">
                {/* New WorldGenProgress Component */}
                <WorldGenProgress
                  currentPhase={currentPhase}
                  progressPercentage={progressPercentage}
                  errorMessage={errorState?.error}
                  isRetrying={isRetrying}
                  retryCount={errorState?.retryCount}
                />

                {/* Period Progress (if in history phase) */}
                {currentPhase === 'history' &&
                  (() => {
                    const latestPeriod = streamEvents.filter((e) => e.type === 'period_progress').slice(-1)[0];
                    if (latestPeriod && latestPeriod.periodNumber && latestPeriod.totalPeriods) {
                      return (
                        <PeriodProgress
                          currentPeriod={latestPeriod.periodNumber}
                          totalPeriods={latestPeriod.totalPeriods}
                          periodName={latestPeriod.periodName}
                        />
                      );
                    }
                    return null;
                  })()}

                {/* Rich Event Stream (legacy events + tool calls) */}
                <div className="card p-8">
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {streamEvents.map((event, index) => {
                      // Filter out LangChain internal noise
                      const isNoise =
                        event.name === '  start  ' ||
                        event.name === '  return  ' ||
                        event.name === 'LangGraph' ||
                        (event.name || '').includes('ChannelWrite') ||
                        (event.name || '').includes('ChatGoogle') ||
                        event.name === 'generateStructured';

                      if (isNoise && event.type !== 'progress') {
                        return null;
                      }

                      // Tool calls
                      if (event.type === 'tool_call') {
                        const toolCall: ToolCall = {
                          id: `tool-${index}`,
                          toolName: event.tool || 'unknown',
                          parameters: event.args || {},
                          result: event.output,
                          timestamp: Date.now(),
                        };
                        return (
                          <ToolCallCard
                            key={index}
                            toolCall={toolCall}
                            status={event.output ? 'complete' : 'running'}
                          />
                        );
                      }

                      // Period generation start
                      if (event.type === 'period_start') {
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-aurora-500/40 bg-aurora-900/20 px-4 py-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-aurora-400">📜</span>
                              <span className="text-sm font-semibold text-aurora-200">
                                Creating Era {event.periodNumber} of {event.totalPeriods}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-shadow-400">Years {event.yearRange}</p>
                          </div>
                        );
                      }

                      // Period narrative text
                      if (event.type === 'period_text_complete') {
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-emerald-400">✓</span>
                              <span className="text-sm font-semibold text-emerald-200">
                                Era {event.periodNumber} — Narrative
                              </span>
                            </div>
                            <div className="max-h-32 overflow-y-auto rounded bg-midnight-950/50 p-3 text-xs leading-relaxed text-shadow-200">
                              {event.narrative}
                            </div>
                          </div>
                        );
                      }

                      // Period generation complete
                      if (event.type === 'period_complete') {
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400">✓</span>
                              <span className="text-sm font-semibold text-emerald-200">
                                Era {event.periodNumber} Complete
                              </span>
                            </div>
                            {(event.structuresAdded || 0) > 0 && (
                              <p className="mt-1 text-xs text-shadow-400">
                                🏰 Added {event.structuresAdded} structure{(event.structuresAdded || 0) > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        );
                      }

                      // History start
                      if (event.type === 'history_start') {
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-nebula-500/40 bg-nebula-900/20 px-4 py-3"
                          >
                            <span className="text-sm font-semibold text-nebula-200">
                              📚 Generating {event.totalYears} years of history...
                            </span>
                          </div>
                        );
                      }

                      // History complete
                      if (event.type === 'history_complete') {
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400">✓</span>
                              <span className="text-sm font-semibold text-emerald-200">World History Complete</span>
                            </div>
                            <p className="mt-1 text-xs text-shadow-400">
                              {event.periodCount} eras, {event.structureCount} structures
                            </p>
                          </div>
                        );
                      }

                      // Structures placed
                      if (event.type === 'structures_placed') {
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400">✓</span>
                              <span className="text-sm font-semibold text-emerald-200">
                                🏗️ Placed {event.totalStructures} structures on map
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Roads generated
                      if (event.type === 'roads_generated') {
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400">✓</span>
                              <span className="text-sm font-semibold text-emerald-200">
                                🛤️ Generated {event.totalRoads} road connections
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Chunk generated
                      if (event.type === 'chunk_generated') {
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-nebula-500/40 bg-nebula-900/20 px-4 py-2 text-xs"
                          >
                            <span className="text-nebula-300">
                              🗺️ Chunk ({event.chunkX}, {event.chunkY}, z={event.chunkZ}) — {event.completed}/
                              {event.total}
                            </span>
                          </div>
                        );
                      }

                      // All chunks complete
                      if (event.type === 'chunks_complete') {
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400">✓</span>
                              <span className="text-sm font-semibold text-emerald-200">
                                🗺️ Generated {event.totalChunks} map chunks
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Chain start / Node progress
                      if (event.type === 'chain_start' || event.type === 'progress') {
                        const nodeName = event.node || event.name || '';
                        const phase = event.phase || '';

                        if (!nodeName) return null;

                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-midnight-600/60 bg-midnight-800/40 px-4 py-2 text-xs"
                          >
                            <span className="text-shadow-400">→ </span>
                            <span className="font-semibold text-accent">{nodeName.replace(/_/g, ' ')}</span>
                            {phase && <span className="ml-2 text-shadow-500">({phase})</span>}
                          </div>
                        );
                      }

                      return null;
                    })}

                    {/* Dice loader at the bottom during active generation */}
                    {streamEvents.length > 0 && (
                      <div className="flex justify-center py-4">
                        <DiceLoader size="small" diceCount={3} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {worldGeneration.status === 'done' && generatedRoom && generatedRoom.worldDescription && (
              <div className="space-y-6" data-testid="world-preview">
                <div className="card p-8">
                  <div className="space-y-2 mb-6">
                    <h3 className="font-display text-base uppercase tracking-[0.3em] text-aurora-200">
                      World Description
                    </h3>
                  </div>
                  <div
                    className="rounded-lg border border-aurora-400/20 bg-midnight-900/70 p-6"
                    data-testid="world-description"
                  >
                    <MarkdownMessage content={generatedRoom.worldDescription} />
                  </div>
                </div>

                {generatedRoom.structures && generatedRoom.structures.length > 0 && (
                  <div className="card p-8">
                    <h3 className="mb-6 font-display text-base uppercase tracking-[0.3em] text-aurora-200">
                      World Map
                    </h3>
                    <div data-testid="world-map">
                      <MapRenderer
                        roomId={generatedRoom.id}
                        structures={generatedRoom.structures || []}
                        roads={generatedRoom.roads || []}
                      />
                    </div>
                  </div>
                )}

                {generatedRoom.worldHistory && (
                  <div className="card p-8">
                    <h3 className="mb-6 font-display text-base uppercase tracking-[0.3em] text-aurora-200">
                      World History
                    </h3>
                    <div data-testid="history-timeline">
                      <HistoryTimeline history={generatedRoom.worldHistory} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      }
    }
  };

  const getGroupLabel = (group: WizardGroup): string => {
    switch (group) {
      case 'dmAndScope':
        return 'DM & Scope';
      case 'worldConfig':
        return 'World Config';
      case 'characters':
        return 'Characters';
      case 'inRoomConfig':
        return 'Preview & Create';
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
              Configure your AI Dungeon Master and world in 4 simple steps
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
                    isFinalGroup && worldGeneration.status === 'done'
                      ? 'wizard-create-room-button'
                      : 'wizard-next-button'
                  }
                >
                  {isFinalGroup
                    ? generatedRoom && worldGeneration.status === 'done'
                      ? 'Enter Room'
                      : generatedRoom
                        ? 'Generate World First'
                        : loading
                          ? 'Creating...'
                          : 'Create Room'
                    : 'Next'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Section Loading Overlay */}
      {loadingSection && generatedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-950/95">
          <SectionLoadingState
            sectionNumber={loadingSection}
            sectionName={loadingSection === 1 ? 'Generating World History' : 'Generating World Configuration'}
            progress={graphProgress.progress}
            currentNode={graphProgress.currentNode || undefined}
            error={sectionError}
            onRetry={handleGenerateWorld}
          />
        </div>
      )}

      {/* Character Creation Modal */}
      {showCharacterModal && generatedRoom && (
        <CharacterCreationModal
          roomId={generatedRoom.id}
          onSubmit={handleCharacterSubmit}
          onCancel={() => setShowCharacterModal(false)}
        />
      )}
    </PrivateLayout>
  );
}
