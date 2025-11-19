import Input from '../../ui/input';
import { useI18n } from '../../../i18n';

interface PersonalitySectionProps {
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  onPersonalityChange: (field: string, value: string) => void;
}

export function PersonalitySection({ personality, onPersonalityChange }: PersonalitySectionProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <Input
        type="text"
        value={personality.traits}
        onChange={(e) => onPersonalityChange('traits', e.target.value)}
        placeholder={t('characterCreation.personality.traitsPlaceholder')}
        className="text-sm"
      />
      <Input
        type="text"
        value={personality.ideals}
        onChange={(e) => onPersonalityChange('ideals', e.target.value)}
        placeholder={t('characterCreation.personality.idealsPlaceholder')}
        className="text-sm"
      />
      <Input
        type="text"
        value={personality.bonds}
        onChange={(e) => onPersonalityChange('bonds', e.target.value)}
        placeholder={t('characterCreation.personality.bondsPlaceholder')}
        className="text-sm"
      />
      <Input
        type="text"
        value={personality.flaws}
        onChange={(e) => onPersonalityChange('flaws', e.target.value)}
        placeholder={t('characterCreation.personality.flawsPlaceholder')}
        className="text-sm"
      />
    </div>
  );
}
