import { useState, useMemo } from 'react';
import type { WorldSettings, DMStyle } from '../types/shared';
import { useI18n } from '../i18n';
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
} from '../constants/dmStyleConfig';
import {
  ADVENTURE_LENGTH_VALUES,
  ADVENTURE_LENGTH_FALLBACK,
  DIFFICULTY_VALUES,
  DIFFICULTY_FALLBACK,
  WORLD_SIZE_VALUES,
  WORLD_SIZE_FALLBACK,
  PARTY_SIZE_VALUES,
  STARTING_LEVEL_VALUES,
} from '../constants/adventureConfig';
import type { SliderMark } from '../components/forms/DiscreteSlider';

export type WizardStepId = 'world' | 'story' | 'scope' | 'dm' | 'preview';

export const WIZARD_STEPS: WizardStepId[] = ['world', 'story', 'scope', 'dm', 'preview'];

const DEFAULT_WORLD_SETTINGS: WorldSettings = {
  worldType: 'terra',
  playerCount: 4,
  startingLevel: 3,
  attributePointBudget: 27,
  adventureLength: 'medium',
  worldSize: 'medium',
  difficulty: 'medium',
  tone: '',
  theme: '',
  setting: '',
  worldBackground: '',
  dmStyle: {
    verbosity: 3,
    detail: 3,
    engagement: 3,
    narrative: 3,
    customDirectives: '',
  },
  dmSystemPrompt: '',
  language: 'en',
};

export function useRoomWizard() {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<WorldSettings>(DEFAULT_WORLD_SETTINGS);
  const [archetype, setArchetype] = useState('mountain');
  const [worldDescription, setWorldDescription] = useState('');
  const [worldLoading, setWorldLoading] = useState(false);

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

  const updateSettings = (updates: Partial<WorldSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const updateDMStyle = (updates: Partial<DMStyle>) => {
    setSettings((prev) => ({
      ...prev,
      dmStyle: { ...(prev.dmStyle || DEFAULT_WORLD_SETTINGS.dmStyle), ...updates },
    }));
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  };

  return {
    currentStep,
    settings,
    archetype,
    worldDescription,
    worldLoading,
    verbosityMarks,
    detailMarks,
    engagementMarks,
    narrativeMarks,
    specialModeOptions,
    adventureLengthOptions,
    difficultyOptions,
    worldSizeOptions,
    partySizeValues: PARTY_SIZE_VALUES,
    startingLevelValues: STARTING_LEVEL_VALUES,
    setArchetype,
    setWorldDescription,
    setWorldLoading,
    updateSettings,
    updateDMStyle,
    nextStep,
    prevStep,
    goToStep,
  };
}
