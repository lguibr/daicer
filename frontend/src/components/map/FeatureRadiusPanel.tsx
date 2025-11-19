/**
 * FeatureRadiusPanel Component
 * Resizable sidebar showing features within a radius
 * Rule 21: Reuse Resizable Panel
 * Rule 27: All text via i18n
 */

import { useState, useCallback } from 'react';
import { Eye, EyeOff, MapPin } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface Feature {
  id: string;
  name: string;
  type: string;
  description: string;
  position: { x: number; y: number; z: number };
  isVisible: boolean;
  distance?: number;
}

interface FeatureRadiusPanelProps {
  center: { x: number; y: number; z?: number } | null;
  radius: number;
  onRadiusChange: (radius: number) => void;
  viewMode: 'player' | 'dm';
  onViewModeChange: (mode: 'player' | 'dm') => void;
  features: Feature[];
  onFeatureClick: (feature: Feature) => void;
  isLoading?: boolean;
}

export function FeatureRadiusPanel({
  center,
  radius,
  onRadiusChange,
  viewMode,
  onViewModeChange,
  features,
  onFeatureClick,
  isLoading = false,
}: FeatureRadiusPanelProps) {
  const { t } = useI18n();
  const [localRadius, setLocalRadius] = useState(radius);

  const handleRadiusChange = useCallback(
    (values: number[]) => {
      const newRadius = values[0];
      if (newRadius !== undefined) {
        setLocalRadius(newRadius);
        onRadiusChange(newRadius);
      }
    },
    [onRadiusChange]
  );

  const toggleViewMode = useCallback(() => {
    onViewModeChange(viewMode === 'player' ? 'dm' : 'player');
  }, [viewMode, onViewModeChange]);

  // Sort features by distance if available
  const sortedFeatures = [...features].sort((a, b) => {
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });

  // Filter by view mode in player mode, hide non-visible features
  const visibleFeatures = viewMode === 'player' ? sortedFeatures.filter((f) => f.isVisible) : sortedFeatures;

  return (
    <Card data-testid="feature-radius-panel" className="h-full border-accent/30 bg-midnight-900/95 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
          <span>{t('map.featuresNearby')}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleViewMode}
            className="h-7 px-2"
            data-testid="view-mode-toggle"
          >
            {viewMode === 'dm' ? (
              <>
                <Eye className="h-3 w-3 mr-1" />
                <span className="text-xs">{t('map.dmView')}</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                <span className="text-xs">{t('map.playerView')}</span>
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Center Info */}
        {center && (
          <div className="mb-4 p-2 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-shadow-400 text-xs mb-1">{t('map.centerPoint')}</p>
            <p className="text-white font-mono text-sm">
              {center.z !== undefined ? `${center.x}, ${center.y}, ${center.z}` : `${center.x}, ${center.y}`}
            </p>
          </div>
        )}

        {/* Radius Slider */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-shadow-400 text-xs">{t('map.radius')}</label>
            <span className="text-white font-mono text-sm">
              {localRadius} {t('map.tiles')}
            </span>
          </div>
          <input
            type="range"
            value={localRadius}
            onChange={(e) => handleRadiusChange([parseInt(e.target.value, 10)])}
            min={5}
            max={50}
            step={1}
            className="w-full h-2 bg-shadow-700 rounded-lg appearance-none cursor-pointer accent-accent"
            data-testid="radius-slider"
          />
        </div>

        {/* Feature Count */}
        <div className="mb-2 text-xs text-shadow-400">
          {isLoading ? t('map.loading') : t('map.featuresFound', { count: visibleFeatures.length })}
        </div>

        {/* Features List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
            </div>
          ) : visibleFeatures.length === 0 ? (
            <p className="text-shadow-400 text-xs text-center py-8">{t('map.noFeaturesInRadius')}</p>
          ) : (
            visibleFeatures.map((feature) => {
              const isOutOfRange = viewMode === 'player' && !feature.isVisible;

              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => onFeatureClick(feature)}
                  className={cn(
                    'w-full text-left rounded-lg border p-3 transition-all',
                    isOutOfRange
                      ? 'opacity-40 grayscale border-shadow-700/30 bg-shadow-900/20'
                      : 'border-accent/30 bg-accent/10 hover:bg-accent/20 hover:border-accent/50',
                    'focus:outline-none focus:ring-2 focus:ring-accent'
                  )}
                  data-testid={`feature-${feature.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={cn('text-sm font-semibold', isOutOfRange ? 'text-shadow-400' : 'text-accent')}>
                        {feature.name}
                      </p>
                      <p className="text-xs text-shadow-300 mt-1 capitalize">{feature.type.replace(/_/g, ' ')}</p>
                      {feature.description && (
                        <p className="text-xs text-shadow-400 mt-1 line-clamp-2">{feature.description}</p>
                      )}
                      {feature.distance !== undefined && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-shadow-400">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {feature.distance.toFixed(1)} {t('map.tiles')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
