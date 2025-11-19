/**
 * AssetPreviewModal Component
 * Modal for quick preview of assets with navigation
 */

import { X, Download, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { VoxelModelViewer } from './VoxelModelViewer';
import type { Asset } from '../../services/assetService';

interface AssetPreviewModalProps {
  asset: Asset;
  allAssets?: Asset[];
  onClose: () => void;
  onDelete?: () => void;
  onOpenDetailPage?: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export function AssetPreviewModal({
  asset,
  allAssets = [],
  onClose,
  onDelete,
  onOpenDetailPage,
  onNavigate,
}: AssetPreviewModalProps) {
  const currentIndex = allAssets.findIndex((a) => a.id === asset.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allAssets.length - 1;

  const handleDownload = () => {
    if (!asset.storageUrl) return;

    const link = document.createElement('a');
    link.href = asset.storageUrl;
    link.download = `${asset.name}.png`;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-900/95 p-4 backdrop-blur-sm"
      onClick={onClose}
      data-testid="asset-preview-modal"
    >
      <Card
        className="relative w-full max-w-4xl border-accent/30 bg-gradient-to-br from-midnight-900/95 via-midnight-800/95 to-midnight-700/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg bg-midnight-900/80 p-2 text-shadow-300 transition-colors hover:bg-midnight-800 hover:text-white"
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </button>

        <CardContent className="p-6">
          {/* Preview Image/Model */}
          <div className="mb-6 flex items-center justify-center rounded-lg bg-midnight-950/60 p-8">
            {asset.storageUrl ? (
              <img
                src={asset.storageUrl}
                alt={asset.name}
                className="max-h-[60vh] max-w-full rounded-lg object-contain"
                data-testid="asset-preview-image"
              />
            ) : asset.modelData ? (
              <div className="h-[60vh] w-full">
                <VoxelModelViewer
                  modelData={asset.modelData}
                  width={800}
                  height={600}
                  showGrid
                  autoRotate
                  data-testid="asset-preview-model"
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center">
                <p className="text-shadow-400">No preview available</p>
              </div>
            )}
          </div>

          {/* Asset Info */}
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold text-white">{asset.name}</h2>
            {asset.description && <p className="text-sm text-shadow-300">{asset.description}</p>}
            {asset.generationPrompt && (
              <p className="text-xs text-shadow-500">
                <span className="font-semibold">Prompt:</span> {asset.generationPrompt}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {asset.storageUrl && (
              <Button
                onClick={handleDownload}
                variant="default"
                size="sm"
                className="bg-accent/20 text-accent hover:bg-accent/30"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
            {onOpenDetailPage && (
              <Button
                onClick={onOpenDetailPage}
                variant="default"
                size="sm"
                className="bg-nebula/20 text-nebula-200 hover:bg-nebula/30"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Full View
              </Button>
            )}
            {onDelete && (
              <Button onClick={onDelete} variant="ghost" size="sm" className="text-shadow-300 hover:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>

          {/* Navigation Controls */}
          {onNavigate && allAssets.length > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-midnight-600 pt-4">
              <Button
                onClick={() => onNavigate('prev')}
                disabled={!hasPrev}
                variant="ghost"
                size="sm"
                className="text-shadow-300 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="text-xs text-shadow-500">
                {currentIndex + 1} of {allAssets.length}
              </span>
              <Button
                onClick={() => onNavigate('next')}
                disabled={!hasNext}
                variant="ghost"
                size="sm"
                className="text-shadow-300 hover:text-white disabled:opacity-30"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
