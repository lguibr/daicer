import Textarea from '../../ui/textarea';
import { SliderWithMarks } from '../../ui/SliderWithMarks';
import { useI18n } from '../../../i18n';
import {
  EYE_COLOR_OPTIONS,
  SKIN_TONE_OPTIONS,
  HAIR_STYLE_OPTIONS,
  DEFAULT_APPEARANCE_AGE,
  DEFAULT_APPEARANCE_HEIGHT,
  DEFAULT_APPEARANCE_WEIGHT,
} from './constants';
import { parseAppearanceNumber } from './validation';
import { OptionPill } from './OptionPill';

interface AppearanceSectionProps {
  appearance: {
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    description: string;
    gender?: string;
  };
  onAppearanceChange: (field: string, value: string) => void;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other'];

export function AppearanceSection({ appearance, onAppearanceChange }: AppearanceSectionProps) {
  const { t } = useI18n();

  const ageValue = parseAppearanceNumber(appearance.age, DEFAULT_APPEARANCE_AGE);
  const heightValue = parseAppearanceNumber(appearance.height, DEFAULT_APPEARANCE_HEIGHT);
  const weightValue = parseAppearanceNumber(appearance.weight, DEFAULT_APPEARANCE_WEIGHT);

  // Convert feet to cm for display (1 ft = 30.48 cm)
  const heightCm = Math.round(heightValue * 30.48);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-midnight-600 bg-midnight-800/70 p-4">
          <SliderWithMarks
            label={t('characterCreation.appearance.age')}
            value={ageValue}
            onChange={(value) => onAppearanceChange('age', String(value))}
            min={10}
            max={120}
            step={1}
            showValue
            showTooltip={false}
          />
        </div>
        <div className="rounded-lg border border-midnight-600 bg-midnight-800/70 p-4">
          <SliderWithMarks
            label={`${t('characterCreation.appearance.height')} (cm)`}
            value={heightCm}
            onChange={(value) => {
              // Convert cm back to feet for storage
              const feet = value / 30.48;
              onAppearanceChange('height', String(feet));
            }}
            min={120} // ~4ft
            max={220} // ~7.2ft
            step={1}
            showValue
            showTooltip={false}
          />
        </div>
        <div className="rounded-lg border border-midnight-600 bg-midnight-800/70 p-4">
          <SliderWithMarks
            label={t('characterCreation.appearance.weight')}
            value={weightValue}
            onChange={(value) => onAppearanceChange('weight', String(value))}
            min={40}
            max={200}
            step={1}
            showValue
            showTooltip={false}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
            Gender
          </span>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((option) => (
              <OptionPill
                key={option}
                label={option}
                selected={appearance.gender === option}
                onSelect={() => onAppearanceChange('gender', option)}
              />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
            {t('characterCreation.appearance.eyes')}
          </span>
          <div className="flex flex-wrap gap-2">
            {EYE_COLOR_OPTIONS.map((option) => (
              <OptionPill
                key={option}
                label={option}
                selected={appearance.eyes === option}
                onSelect={() => onAppearanceChange('eyes', option)}
              />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
            {t('characterCreation.appearance.skin')}
          </span>
          <div className="flex flex-wrap gap-2">
            {SKIN_TONE_OPTIONS.map((option) => (
              <OptionPill
                key={option}
                label={option}
                selected={appearance.skin === option}
                onSelect={() => onAppearanceChange('skin', option)}
              />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-400">
            {t('characterCreation.appearance.hair')}
          </span>
          <div className="flex flex-wrap gap-2">
            {HAIR_STYLE_OPTIONS.map((option) => (
              <OptionPill
                key={option}
                label={option}
                selected={appearance.hair === option}
                onSelect={() => onAppearanceChange('hair', option)}
              />
            ))}
          </div>
        </div>
      </div>

      <Textarea
        value={appearance.description}
        onChange={(event) => onAppearanceChange('description', event.target.value)}
        placeholder={t('characterCreation.appearance.descriptionPlaceholder')}
        rows={3}
        className="text-sm resize-none"
      />
    </div>
  );
}
