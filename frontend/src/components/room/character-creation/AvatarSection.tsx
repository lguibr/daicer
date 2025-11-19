import type { AvatarPreviewResponse } from '../../../types/assets';
import { Button } from '../../ui/button';
import Label from '../../ui/label';
import { DiceLoader } from '../../ui/dice-loader';
import { useI18n } from '../../../i18n';
import { previewPlaceholders } from './constants';

interface AvatarSectionProps {
  avatarPreview: Partial<AvatarPreviewResponse>;
  previewLoading: boolean;
  previewLoadState: Record<keyof AvatarPreviewResponse, boolean>;
  previewBusy: boolean;
  previewError: string | null;
  placeholderLoading: boolean;
  placeholderDimensions: Partial<Record<keyof AvatarPreviewResponse, { width: number; height: number }>>;
  onGeneratePreview: () => void;
}

export function AvatarSection({
  avatarPreview,
  previewLoading,
  previewLoadState,
  previewBusy,
  previewError,
  placeholderLoading,
  placeholderDimensions,
  onGeneratePreview,
}: AvatarSectionProps) {
  const { t } = useI18n();

  return (
    <div className="border-t border-midnight-600 pt-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label>{t('characterCreation.portraits.title')}</Label>
          <p className="text-xs text-shadow-500">{t('characterCreation.portraits.description')}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onGeneratePreview}
          disabled={previewLoading || placeholderLoading}
        >
          {previewLoading
            ? t('characterCreation.portraits.generating')
            : avatarPreview.portrait && avatarPreview.upperBody && avatarPreview.fullBody
              ? t('characterCreation.portraits.regenerate')
              : t('characterCreation.portraits.generate')}
        </Button>
      </div>
      {previewError && (
        <div className="rounded-lg border border-red-500 bg-red-900/40 p-3 text-sm text-red-200">{previewError}</div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {previewPlaceholders.map(({ key, src, labelKey }) => {
          const translatedLabel = t(labelKey);
          const isFullBody = key === 'fullBody';
          const asset = avatarPreview[key];
          const shouldShowSpinner = previewLoadState[key] || (!asset && previewBusy);
          const spinnerDiceCount = key === 'portrait' ? 1 : key === 'upperBody' ? 2 : 3;
          const baseFigureClasses =
            'rounded-xl border border-midnight-600 bg-midnight-800/70 flex flex-col items-center justify-center overflow-hidden p-6';
          const placeholderDims = placeholderDimensions[key];

          if (shouldShowSpinner) {
            return (
              <figure key={key} className={`${baseFigureClasses} w-full`}>
                <DiceLoader size="small" diceCount={spinnerDiceCount} />
              </figure>
            );
          }

          if (asset) {
            const aspectStyle =
              asset.width && asset.height ? { aspectRatio: `${asset.width} / ${asset.height}` } : undefined;

            return (
              <figure key={key} className={`${baseFigureClasses} w-full`} style={aspectStyle}>
                <img
                  src={`data:${asset.mimeType};base64,${asset.data}`}
                  alt={`${t('characterCreation.portraits.defaultName')} ${translatedLabel}`}
                  className={`w-full h-auto object-contain ${isFullBody ? 'bg-midnight-900' : ''}`}
                />
                <figcaption className="px-3 py-2 text-xs font-semibold text-shadow-300">{translatedLabel}</figcaption>
              </figure>
            );
          }

          return (
            <figure
              key={key}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-midnight-600 bg-midnight-800/40 p-6 text-center text-sm text-shadow-400"
              style={
                placeholderDims ? { aspectRatio: `${placeholderDims.width} / ${placeholderDims.height}` } : undefined
              }
            >
              <img src={src} alt={translatedLabel} className="w-full h-auto object-contain opacity-90" />
              <figcaption>
                {translatedLabel}
                <br />
                <span className="text-xs text-shadow-500">{t('characterCreation.portraits.generatePlaceholder')}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
