import clsx from 'clsx';
import type { Attribute } from '../../../types/models';
import Label from '../../ui/label';
import NumericStepper from '../../ui/NumericStepper';
import { useI18n } from '../../../i18n';
import { ATTRIBUTES } from './constants';
import { getPointCost, formatModifier } from './validation';

interface AttributesSectionProps {
  attributes: Record<Attribute, number>;
  pointsRemaining: number;
  attributeBudget: number;
  onAttributeChange: (attr: Attribute, value: number) => void;
}

export function AttributesSection({
  attributes,
  pointsRemaining,
  attributeBudget,
  onAttributeChange,
}: AttributesSectionProps) {
  const { t } = useI18n();

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <Label>{t('characterCreation.pointBuy.title')}</Label>
        <div
          className={`px-3 py-1 rounded-full text-sm font-bold ${
            pointsRemaining < 0
              ? 'bg-destructive/20 text-destructive-foreground'
              : pointsRemaining === 0
                ? 'bg-aurora-900/45 text-aurora-200'
                : 'bg-accent/20 text-accent'
          }`}
        >
          {pointsRemaining === 0
            ? t('characterCreation.pointBuy.perfect')
            : `${pointsRemaining} ${t('characterCreation.pointBuy.remainingSuffix')}`}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ATTRIBUTES.map((attr) => {
          const score = attributes?.[attr] ?? 10;
          const modifier = Math.floor((score - 10) / 2);
          const cost = getPointCost(score);
          const nextCost = score >= 15 ? cost : getPointCost(score + 1);
          const costDelta = score >= 15 ? Number.POSITIVE_INFINITY : nextCost - cost;
          const canIncrease = score < 15 && costDelta <= pointsRemaining;
          const effectiveMax = canIncrease ? 15 : score;

          return (
            <div key={attr} className="rounded-lg border border-midnight-600 bg-midnight-800/90 p-3 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-shadow-400">
                <span>{attr}</span>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[0.6rem] text-accent">
                  {cost} pts
                </span>
              </div>
              <NumericStepper
                value={score}
                min={8}
                max={effectiveMax}
                step={1}
                decreaseLabel={`Decrease ${attr}`}
                increaseLabel={`Increase ${attr}`}
                onChange={(nextScore) => onAttributeChange(attr, nextScore)}
                wrapperClassName="border border-midnight-700 bg-midnight-900/60 px-3 py-2"
                inputClassName="text-xl font-semibold text-shadow-50"
              />
              <div className="flex flex-col items-center gap-1">
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-shadow-500">
                  {t('characterCreation.pointBuy.modLabel')}
                </span>
                <span
                  className={clsx(
                    'text-2xl font-black tracking-wide',
                    modifier > 0 ? 'text-aurora-200' : modifier === 0 ? 'text-shadow-100' : 'text-red-300'
                  )}
                >
                  {formatModifier(modifier)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-shadow-500 mt-2">
        {t('characterCreation.pointBuy.rangePrefix')} 8-15 | {t('characterCreation.pointBuy.budgetPrefix')}
        {attributeBudget} {t('characterCreation.pointBuy.pointsLabel')}
      </p>
    </div>
  );
}
