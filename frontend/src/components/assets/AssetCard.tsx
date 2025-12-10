/**
 * AssetCard Component
 * Displays an asset with thumbnail, status, and actions
 */

import { Eye, Trash2, MoveRight, Copy } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import { VoxelModelViewer } from './VoxelModelViewer';
import type { Asset } from '../../services/assetService';

interface AssetCardProps {
  asset: Asset;
  onView?: () => void;
  onMove?: () => void;
  onDelete: () => void;
  onCreateVariations?: () => void;
  onGenerate?: () => void;
  showGenerateButton?: boolean;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    className: 'bg-shadow-600/70 text-shadow-300 border-shadow-500/60',
  },
  loading: {
    label: 'Generating',
    className: 'bg-aurora-600/70 text-aurora-200 border-aurora-500/60',
  },
  done: {
    label: 'Ready',
    className: 'bg-green-600/70 text-green-200 border-green-500/60',
  },
  error: {
    label: 'Error',
    className: 'bg-red-600/70 text-red-200 border-red-500/60',
  },
} as const;

const ASSET_TYPE_ICONS: Record<Asset['assetType'], string> = {
  '2d': '🖼️',
  '3d': '📦',
  map: '🗺️',
  structures: '🏰',
  'character-sheet': '📜',
};

export function AssetCard({
  asset,
  onView,
  onMove,
  onDelete,
  onCreateVariations,
  onGenerate,
  showGenerateButton,
}: AssetCardProps) {
  const statusConfig = STATUS_CONFIG[asset.status] || STATUS_CONFIG.pending;
  const canView = asset.status === 'done' && onView;
  const canCreateVariations = asset.status === 'done' && onCreateVariations;

  return (
    <Card
      className="group relative border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60 transition-all duration-200 hover:border-accent/50 hover:shadow-[0_12px_30px_rgba(122,73,217,0.25)]"
      data-testid={`asset-card-${asset.id}`}
    >
      {asset.status === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-midnight-900/80 backdrop-blur-sm">
          <LoadingOverlay />
        </div>
      )}

      <CardContent className="p-4">
        {/* Thumbnail/Preview Area */}
        <div
          className="group/preview relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-midnight-900/60 cursor-pointer"
          onClick={canView ? onView : undefined}
        >
          {asset.storageUrl ? (
            <>
              <img
                src={asset.storageUrl}
                alt={asset.name}
                className="h-full w-full object-cover transition-transform group-hover/preview:scale-105"
              />
              {/* Hover overlay for quick view */}
              {canView && (
                <div className="absolute inset-0 flex items-center justify-center bg-midnight-900/80 opacity-0 backdrop-blur-sm transition-opacity group-hover/preview:opacity-100">
                  <Eye className="h-8 w-8 text-white" />
                </div>
              )}
            </>
          ) : asset.modelData ? (
            <div className="h-full w-full">
              <VoxelModelViewer modelData={asset.modelData} width={200} height={200} showGrid={false} autoRotate />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-6xl">{ASSET_TYPE_ICONS[asset.assetType]}</div>
            </div>
          )}
        </div>

        {/* Asset Info */}
        <div className="mb-3">
          <h4 className="mb-1 text-sm font-semibold text-white line-clamp-1">{asset.name}</h4>
          {asset.description && <p className="text-xs text-shadow-400 line-clamp-2">{asset.description}</p>}
        </div>

        {/* Status Badge */}
        <div className="mb-3">
          <span
            className={`inline-block rounded-full border px-3 py-1 text-xs uppercase tracking-wider ${statusConfig.className}`}
            data-testid={`asset-card-${asset.id}-status-${asset.status}`}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Created Date */}
        <p className="mb-3 text-xs text-shadow-500">
          Created{' '}
          {asset.createdAt instanceof Date
            ? asset.createdAt.toLocaleDateString()
            : new Date(asset.createdAt).toLocaleDateString() || 'Unknown date'}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          {canCreateVariations && (
            <Button
              onClick={onCreateVariations}
              className="flex-1 bg-nebula/20 text-nebula-200 hover:bg-nebula/30"
              size="sm"
            >
              <Copy className="mr-2 h-4 w-4" />
              Variations
            </Button>
          )}
          {canView && (
            <Button
              onClick={onView}
              variant="default"
              size="sm"
              className="bg-accent/20 text-accent hover:bg-accent/30"
              data-testid={`asset-card-${asset.id}-view-button`}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {showGenerateButton && onGenerate && (
            <Button
              onClick={onGenerate}
              variant="default"
              size="sm"
              className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
              title="Generate"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {showGenerateButton && onGenerate && (
            <Button
              onClick={onGenerate}
              variant="default"
              size="sm"
              className="bg-accent/20 text-accent hover:bg-accent/30"
              title="Generate Structure"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onMove && (
            <Button onClick={onMove} variant="ghost" size="sm" className="text-shadow-300 hover:text-accent">
              <MoveRight className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={onDelete} variant="ghost" size="sm" className="text-shadow-300 hover:text-red-400">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Error Message */}
        {asset.status === 'error' && (
          <div className="mt-3 rounded border border-red-500/50 bg-red-500/10 p-2 text-xs text-red-400">
            Generation failed. Try again.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
