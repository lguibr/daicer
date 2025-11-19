/**
 * MapTileDetails Component
 * Shows selected tile information in a compact card
 * Rule 21: Reuse shadcn components
 * Rule 27: All text via i18n
 */

import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface TileData {
  x: number;
  y: number;
  z?: number;
  biome?: string;
  elevation?: number;
  features?: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
  }>;
  entities?: Array<{
    id: string;
    name: string;
    type: 'player' | 'creature' | 'npc';
  }>;
}

interface MapTileDetailsProps {
  tile: TileData | null;
  onClose?: () => void;
}

export function MapTileDetails({ tile, onClose }: MapTileDetailsProps) {
  const { t } = useI18n();

  if (!tile) {
    return null;
  }

  return (
    <Card data-testid="map-tile-details" className="border-accent/30 bg-midnight-900/95 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white">{t('map.tileDetails')}</CardTitle>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-shadow-400 hover:text-white transition-colors"
              aria-label={t('common.close')}
            >
              ✕
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {/* Coordinates */}
        <div>
          <p className="text-shadow-400 text-xs mb-1">{t('map.coordinates')}</p>
          <p className="text-white font-mono">
            {tile.z !== undefined ? `${tile.x}, ${tile.y}, ${tile.z}` : `${tile.x}, ${tile.y}`}
          </p>
        </div>

        {/* Biome */}
        {tile.biome && (
          <div>
            <p className="text-shadow-400 text-xs mb-1">{t('map.biome')}</p>
            <p className="text-aurora-200 capitalize">{tile.biome.replace(/_/g, ' ')}</p>
          </div>
        )}

        {/* Elevation */}
        {tile.elevation !== undefined && (
          <div>
            <p className="text-shadow-400 text-xs mb-1">{t('map.elevation')}</p>
            <p className="text-white">{tile.elevation}</p>
          </div>
        )}

        {/* Features */}
        {tile.features && tile.features.length > 0 && (
          <div>
            <p className="text-shadow-400 text-xs mb-2">{t('map.features')}</p>
            <div className="space-y-2">
              {tile.features.map((feature) => (
                <div key={feature.id} className="rounded-lg bg-accent/10 border border-accent/20 p-2">
                  <p className="text-accent font-semibold text-xs">{feature.name}</p>
                  <p className="text-shadow-300 text-xs mt-1">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entities */}
        {tile.entities && tile.entities.length > 0 && (
          <div>
            <p className="text-shadow-400 text-xs mb-2">{t('map.entities')}</p>
            <div className="space-y-1">
              {tile.entities.map((entity) => (
                <div key={entity.id} className="flex items-center gap-2 text-xs">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      entity.type === 'player'
                        ? 'bg-aurora-500'
                        : entity.type === 'npc'
                          ? 'bg-nebula-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <span className="text-white">{entity.name}</span>
                  <span className="text-shadow-400">({entity.type})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!tile.biome &&
          (!tile.features || tile.features.length === 0) &&
          (!tile.entities || tile.entities.length === 0) && (
            <p className="text-shadow-400 text-xs text-center py-2">{t('map.noDataAvailable')}</p>
          )}
      </CardContent>
    </Card>
  );
}
