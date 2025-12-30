import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { WorldSettings, DMStyle, ScaleLevel } from '@daicer/engine';
import { useI18n } from '@/i18n';
import DiscreteSlider, { type SliderMark } from '@/components/forms/DiscreteSlider';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { WorldConfigForm } from '@/features/debug/components/WorldConfigForm';
import {
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
} from '@/pages/create-room/constants';
import type { WorldConfig } from '@/features/debug/utils/types';
import { WorldPreview } from './WorldPreview';

interface CampaignWizardProps {
  initialSettings?: Partial<WorldSettings>;
  onSubmit: (settings: WorldSettings) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function CampaignWizard({
  initialSettings,
  onSubmit,
  onCancel,
  submitLabel = 'Forging World',
  isSubmitting = false,
}: CampaignWizardProps) {
  const { t, language } = useI18n();
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [currentGroup, setCurrentGroup] = useState(0);
  const [completedGroups, setCompletedGroups] = useState<Set<number>>(new Set());

  // Slider Marks Memoization (Identical to previous)
  const verbosityMarks = useMemo<SliderMark[]>(
    () =>
      VERBOSITY_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: VERBOSITY_FALLBACK[key]?.label ?? '',
        description: VERBOSITY_FALLBACK[key]?.description ?? '',
      })),
    [t]
  );

  const detailMarks = useMemo<SliderMark[]>(
    () =>
      DETAIL_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: DETAIL_FALLBACK[key]?.label ?? '',
        description: DETAIL_FALLBACK[key]?.description ?? '',
      })),
    [t]
  );

  const engagementMarks = useMemo<SliderMark[]>(
    () =>
      ENGAGEMENT_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: ENGAGEMENT_FALLBACK[key]?.label ?? '',
        description: ENGAGEMENT_FALLBACK[key]?.description ?? '',
      })),
    [t]
  );

  const narrativeMarks = useMemo<SliderMark[]>(
    () =>
      NARRATIVE_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: NARRATIVE_FALLBACK[key]?.label ?? '',
        description: NARRATIVE_FALLBACK[key]?.description ?? '',
      })),
    [t]
  );

  const specialModeOptions = useMemo(
    () =>
      SPECIAL_MODE_KEYS.map(({ id, key }) => ({
        id,
        label: SPECIAL_MODE_FALLBACK[key]?.label ?? key,
        description: SPECIAL_MODE_FALLBACK[key]?.description ?? '',
      })),
    [t]
  );

  const adventureLengthOptions = useMemo(
    () =>
      ADVENTURE_LENGTH_VALUES.map((value) => ({
        value,
        label: ADVENTURE_LENGTH_FALLBACK[value]?.label ?? '',
        detail: ADVENTURE_LENGTH_FALLBACK[value]?.detail ?? '',
        description: ADVENTURE_LENGTH_FALLBACK[value]?.description ?? '',
      })),
    [t]
  );

  const difficultyOptions = useMemo(
    () =>
      DIFFICULTY_VALUES.map((value) => ({
        value,
        label: DIFFICULTY_FALLBACK[value]?.label ?? '',
        detail: DIFFICULTY_FALLBACK[value]?.detail ?? '',
        description: DIFFICULTY_FALLBACK[value]?.description ?? '',
      })),
    [t]
  );

  const worldSizeOptions = useMemo(
    () =>
      WORLD_SIZE_VALUES.map((value) => ({
        value,
        label: WORLD_SIZE_FALLBACK[value]?.label ?? '',
        detail: WORLD_SIZE_FALLBACK[value]?.detail ?? '',
        description: WORLD_SIZE_FALLBACK[value]?.description ?? '',
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

  // Initial State
  const [settings, setSettings] = useState<WorldSettings>({
    seed: `daicer-${Math.random().toString(36).substring(7)}`,
    worldType: 'terra',
    worldSize: 'small',
    theme: 'High Fantasy',
    setting: 'Medieval Kingdom',
    tone: 'Heroic',
    worldBackground: '',
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
    generationParams: {
      globalScale: initialSettings?.generationParams?.globalScale ?? 0.01,
      seaLevel: initialSettings?.generationParams?.seaLevel ?? 0,
      elevationScale: initialSettings?.generationParams?.elevationScale ?? 1,
      roughness: initialSettings?.generationParams?.roughness ?? 0.5,
      detail: initialSettings?.generationParams?.detail ?? 4,
      moistureScale: initialSettings?.generationParams?.moistureScale ?? 1,
      temperatureOffset: initialSettings?.generationParams?.temperatureOffset ?? 0,
      structureChance: initialSettings?.generationParams?.structureChance ?? 0.1,
      structureSpacing: initialSettings?.generationParams?.structureSpacing ?? 10,
      structureSizeAvg: initialSettings?.generationParams?.structureSizeAvg ?? 10,
      roadDensity: initialSettings?.generationParams?.roadDensity ?? 0.5,
      fogRadius: initialSettings?.generationParams?.fogRadius ?? 10,
    },
    ...initialSettings,
  });

  const validateGroup = (groupIndex: number): boolean => {
    const groupName = WIZARD_GROUPS[groupIndex];
    switch (groupName) {
      case 'dmSettings':
        return !!settings.theme && !!settings.tone && !!settings.setting;
      case 'worldConfig':
        return true; // Config always has defaults
      default:
        return false;
    }
  };

  const canNavigateToGroup = (targetGroup: number): boolean => {
    if (targetGroup < currentGroup) return true;
    if (targetGroup === currentGroup + 1) return validateGroup(currentGroup);
    return false;
  };

  const goToGroup = (index: number) => {
    if (canNavigateToGroup(index)) {
      setCurrentGroup(index);
      if (validateGroup(currentGroup)) setCompletedGroups(new Set([...completedGroups, currentGroup]));
    }
  };

  const goToNextGroup = () => {
    if (validateGroup(currentGroup)) {
      setCompletedGroups(new Set([...completedGroups, currentGroup]));
      setCurrentGroup(Math.min(currentGroup + 1, WIZARD_GROUPS.length - 1));
    } else {
      setError(t('createWizard.errors.incomplete'));
    }
  };

  const goToPreviousGroup = () => {
    setCurrentGroup(Math.max(0, currentGroup - 1));
    setError(null);
  };

  const updateSetting = <K extends keyof WorldSettings>(key: K, value: WorldSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateDMStyle = <K extends keyof DMStyle>(key: K, value: DMStyle[K]) => {
    setSettings((prev) => ({
      ...prev,
      dmStyle: { ...prev.dmStyle, [key]: value },
    }));
  };

  // WorldConfigForm Handler
  const handleWorldConfigChange = (newConfig: WorldConfig) => {
    // Merge WorldConfig back into WorldSettings (treating flattened structure)
    setSettings((prev) => ({
      ...prev,
      generationParams: {
        ...prev.generationParams,
        ...newConfig,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const isFinalGroup = currentGroup === WIZARD_GROUPS.length - 1;

    if (!isFinalGroup) {
      goToNextGroup();
      return;
    }

    try {
      await onSubmit(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detailed error');
    }
  };

  const renderGroupContent = () => {
    switch (WIZARD_GROUPS[currentGroup]) {
      case 'dmSettings': {
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
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Section 1: DM Style & Personality */}
            <section
              className="card space-y-8 p-8 border border-midnight-700/50 bg-midnight-900/40 backdrop-blur-sm"
              data-testid="wizard-group-dm"
            >
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

            {/* Theme, Tone, Setting inputs */}
            <section className="card space-y-8 p-8 border border-midnight-700/50 bg-midnight-900/40 backdrop-blur-sm">
              <div className="space-y-2">
                <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">Setting & Scope</h2>
                <p className="text-sm text-shadow-300">Define the theme and scale of the adventure</p>
              </div>

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
                />
              </div>

              {/* Scope Sliders */}
              <div className="grid gap-6 md:grid-cols-2 pt-6">
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
          </div>
        );
      }
      case 'worldConfig': {
        // Flatten settings to match WorldConfig shape if possible
        // WorldConfig expects: seed, globalScale, etc.
        // WorldSettings has these merged in.
        const config: WorldConfig = {
          seed: settings.seed || 'default-seed',
          chunkSize: settings.generationParams?.chunkSize ?? 32,
          // Map WorldSettings arbitrary keys to WorldConfig known keys
          globalScale: settings.generationParams?.globalScale ?? 0.01,
          seaLevel: settings.generationParams?.seaLevel ?? 0,
          elevationScale: settings.generationParams?.elevationScale ?? 1,
          roughness: settings.generationParams?.roughness ?? 0.5,
          detail: settings.generationParams?.detail ?? 4,
          moistureScale: settings.generationParams?.moistureScale ?? 1,
          temperatureOffset: settings.generationParams?.temperatureOffset ?? 0,
          structureChance: settings.generationParams?.structureChance ?? 0.1,
          structureSpacing: settings.generationParams?.structureSpacing ?? 10,
          structureSizeAvg: settings.generationParams?.structureSizeAvg ?? 10,
          roadDensity: settings.generationParams?.roadDensity ?? 0.5,
          fogRadius: settings.generationParams?.fogRadius ?? 10,
        };

        return (
          <div className="animate-in fade-in duration-500 h-full flex flex-col">
            <div className="space-y-2 mb-6 text-center">
              <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">World Configuration</h2>
              <p className="text-sm text-shadow-300">Fine-tune the physical parameters of the world generation</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
              {/* Visual Preview (Left/Top on mobile) - Taking more space for impact */}
              <div className="lg:col-span-8 order-2 lg:order-1 h-[400px] lg:h-auto min-h-0 bg-midnight-950/30 rounded-2xl border border-midnight-700/50 backdrop-blur-sm p-1 shadow-2xl relative">
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <WorldPreview config={config} />
                </div>
              </div>

              {/* Controls (Right/Bottom) */}
              <div className="lg:col-span-4 order-1 lg:order-2 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-midnight-700 scrollbar-track-transparent">
                <section className="card p-6 border border-midnight-700/50 bg-midnight-900/40 backdrop-blur-sm h-full">
                  <WorldConfigForm
                    config={config}
                    isActive
                    onConfigChange={handleWorldConfigChange}
                    onRegenerate={() => {
                      handleWorldConfigChange({
                        ...config,
                        seed: Math.random().toString(36).substr(2, 6),
                      });
                    }}
                  />
                </section>
              </div>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const getGroupLabel = (group: WizardGroup): string => {
    switch (group) {
      case 'dmSettings':
        return 'DM & Scope';
      case 'worldConfig':
        return 'World Config';
      default:
        return group;
    }
  };

  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.45em] text-shadow-500">Room Creation Wizard</p>
        <h1 className="font-display text-3xl uppercase tracking-[0.4em] text-aurora-300 sm:text-4xl">
          Create Your Campaign
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-shadow-300">Configure your AI Dungeon Master and world</p>
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
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-secondary sm:flex-none sm:self-start"
          >
            Cancel
          </button>
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end">
            {currentGroup > 0 && (
              <button
                type="button"
                onClick={goToPreviousGroup}
                disabled={isSubmitting}
                className="btn-secondary sm:min-w-[150px]"
              >
                Previous
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !validateGroup(currentGroup)}
              className="btn-primary sm:min-w-[170px]"
            >
              {currentGroup === WIZARD_GROUPS.length - 1 ? (isSubmitting ? submitLabel : 'Next') : 'Next'}
            </button>
          </div>
        </div>
      </form>
      {isSubmitting && <LoadingOverlay message="Forging World..." />}
    </div>
  );
}
