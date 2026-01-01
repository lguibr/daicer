import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
// import { useI18n } from '@/i18n';
import DiscreteSlider, { type SliderMark } from '@/components/forms/DiscreteSlider';
import {
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
import { useWizard } from '../context/WizardContext';

type ScaleLevel = number;

export default function DmSettingsPage() {
  const { settings, updateSetting, updateDMStyle } = useWizard();
  // const { language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  // Marks Memoization
  const verbosityMarks = useMemo<SliderMark[]>(
    () =>
      VERBOSITY_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: VERBOSITY_FALLBACK[key]?.label ?? '',
        description: VERBOSITY_FALLBACK[key]?.description ?? '',
      })),
    []
  );

  const detailMarks = useMemo<SliderMark[]>(
    () =>
      DETAIL_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: DETAIL_FALLBACK[key]?.label ?? '',
        description: DETAIL_FALLBACK[key]?.description ?? '',
      })),
    []
  );

  const engagementMarks = useMemo<SliderMark[]>(
    () =>
      ENGAGEMENT_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: ENGAGEMENT_FALLBACK[key]?.label ?? '',
        description: ENGAGEMENT_FALLBACK[key]?.description ?? '',
      })),
    []
  );

  const narrativeMarks = useMemo<SliderMark[]>(
    () =>
      NARRATIVE_MARK_KEYS.map(({ value, key }) => ({
        value,
        label: NARRATIVE_FALLBACK[key]?.label ?? '',
        description: NARRATIVE_FALLBACK[key]?.description ?? '',
      })),
    []
  );

  const specialModeOptions = useMemo(
    () =>
      SPECIAL_MODE_KEYS.map(({ id, key }) => ({
        id,
        label: SPECIAL_MODE_FALLBACK[key]?.label ?? key,
        description: SPECIAL_MODE_FALLBACK[key]?.description ?? '',
      })),
    []
  );

  const adventureLengthOptions = useMemo(
    () =>
      ADVENTURE_LENGTH_VALUES.map((value) => ({
        value,
        label: ADVENTURE_LENGTH_FALLBACK[value]?.label ?? '',
        detail: ADVENTURE_LENGTH_FALLBACK[value]?.detail ?? '',
        description: ADVENTURE_LENGTH_FALLBACK[value]?.description ?? '',
      })),
    []
  );

  const difficultyOptions = useMemo(
    () =>
      DIFFICULTY_VALUES.map((value) => ({
        value,
        label: DIFFICULTY_FALLBACK[value]?.label ?? '',
        detail: DIFFICULTY_FALLBACK[value]?.detail ?? '',
        description: DIFFICULTY_FALLBACK[value]?.description ?? '',
      })),
    []
  );

  const worldSizeOptions = useMemo(
    () =>
      WORLD_SIZE_VALUES.map((value) => ({
        value,
        label: WORLD_SIZE_FALLBACK[value]?.label ?? '',
        detail: WORLD_SIZE_FALLBACK[value]?.detail ?? '',
        description: WORLD_SIZE_FALLBACK[value]?.description ?? '',
      })),
    []
  );

  // Derived Indices
  const worldSizeIndex = Math.max(
    0,
    worldSizeOptions.findIndex((o) => o.value === settings.worldSize)
  );
  const adventureLengthIndex = Math.max(
    0,
    adventureLengthOptions.findIndex((o) => o.value === settings.adventureLength)
  );
  const difficultyIndex = Math.max(
    0,
    difficultyOptions.findIndex((o) => o.value === settings.difficulty)
  );

  const worldSizeMarks = useMemo<SliderMark[]>(
    () => worldSizeOptions.map((o, i) => ({ value: i, label: o.label, description: `${o.detail} — ${o.description}` })),
    [worldSizeOptions]
  );
  const adventureLengthMarks = useMemo<SliderMark[]>(
    () =>
      adventureLengthOptions.map((o, i) => ({
        value: i,
        label: o.label,
        description: `${o.detail} — ${o.description}`,
      })),
    [adventureLengthOptions]
  );
  const difficultyMarks = useMemo<SliderMark[]>(
    () =>
      difficultyOptions.map((o, i) => ({ value: i, label: o.label, description: `${o.detail} — ${o.description}` })),
    [difficultyOptions]
  );

  const isValid = !!settings.theme && !!settings.tone && !!settings.setting;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="card space-y-8 p-8 border border-midnight-700/50 bg-midnight-900/40 backdrop-blur-sm">
        <div className="space-y-2">
          <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">DM Personality & Style</h2>
          <p className="text-sm text-shadow-300">Configure your AI Dungeon Master's narration style</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DiscreteSlider
            label="Verbosity"
            value={settings.dmStyle.verbosity}
            onChange={(v) => updateDMStyle('verbosity', v as ScaleLevel)}
            marks={verbosityMarks}
            id="verbosity"
          />
          <DiscreteSlider
            label="Detail Level"
            value={settings.dmStyle.detail}
            onChange={(v) => updateDMStyle('detail', v as ScaleLevel)}
            marks={detailMarks}
            id="detail"
          />
          <DiscreteSlider
            label="Player Engagement"
            value={settings.dmStyle.engagement}
            onChange={(v) => updateDMStyle('engagement', v as ScaleLevel)}
            marks={engagementMarks}
            id="engagement"
          />
          <DiscreteSlider
            label="Narrative Control"
            value={settings.dmStyle.narrative}
            onChange={(v) => updateDMStyle('narrative', v as ScaleLevel)}
            marks={narrativeMarks}
            id="narrative"
          />
        </div>

        <div className="mt-6 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">Performance Mode</span>
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

      <section className="card space-y-8 p-8 border border-midnight-700/50 bg-midnight-900/40 backdrop-blur-sm">
        <div className="space-y-2">
          <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">Setting & Scope</h2>
          <p className="text-sm text-shadow-300">Define the theme and scale of the adventure</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="theme" className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
              Theme *
            </label>
            <input
              id="theme"
              type="text"
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="input-style w-full"
              placeholder="High Fantasy"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="tone" className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
              Tone *
            </label>
            <input
              id="tone"
              type="text"
              value={settings.tone}
              onChange={(e) => updateSetting('tone', e.target.value)}
              className="input-style w-full"
              placeholder="Heroic"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="setting" className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
            Primary Setting *
          </label>
          <input
            id="setting"
            type="text"
            value={settings.setting}
            onChange={(e) => updateSetting('setting', e.target.value)}
            className="input-style w-full"
            placeholder="Medieval Kingdom"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 pt-6">
          <DiscreteSlider
            id="world-size"
            label="World Size"
            value={worldSizeIndex}
            onChange={(i) => updateSetting('worldSize', worldSizeOptions[i]?.value || 'small')}
            marks={worldSizeMarks}
          />
          <DiscreteSlider
            id="length"
            label="Adventure Length"
            value={adventureLengthIndex}
            onChange={(i) => updateSetting('adventureLength', adventureLengthOptions[i]?.value || 'short')}
            marks={adventureLengthMarks}
          />
          <DiscreteSlider
            id="diff"
            label="Difficulty"
            value={difficultyIndex}
            onChange={(i) => updateSetting('difficulty', difficultyOptions[i]?.value || 'easy')}
            marks={difficultyMarks}
          />
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => navigate({ pathname: '/create/world-generation', search: location.search })}
          disabled={!isValid}
          className="btn-primary min-w-[170px]"
        >
          Next: World Config
        </button>
      </div>
    </div>
  );
}
