/**
 * MapLoader Component
 * Shows chunk loading progress with animation
 * Rule 27: All text via i18n
 */

import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';

interface MapLoaderProps {
  current: number;
  total: number;
  message?: string;
}

export function MapLoader({ current, total, message }: MapLoaderProps) {
  const { t } = useI18n();
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div
      data-testid="map-loader"
      className="absolute inset-0 flex items-center justify-center bg-midnight-900/90 backdrop-blur-sm z-50"
    >
      <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-midnight-800/95 border border-accent/30 shadow-2xl">
        {/* Spinner */}
        <Loader2 className="h-8 w-8 text-accent animate-spin" />

        {/* Message */}
        <p className="text-white font-semibold text-lg">{message || t('map.generatingTerrain')}</p>

        {/* Progress Bar */}
        {total > 0 && (
          <div className="w-64">
            <div className="flex justify-between text-xs text-shadow-400 mb-2">
              <span>{t('map.chunks')}</span>
              <span>
                {current} / {total}
              </span>
            </div>
            <div className="h-2 bg-shadow-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-aurora-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-shadow-400 mt-2 text-center">{progress.toFixed(0)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
