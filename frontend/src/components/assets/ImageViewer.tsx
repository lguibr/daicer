/**
 * ImageViewer Component
 * Modal for viewing full-size images with details
 */

import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import type { Asset } from '../../services/assetService';

interface ImageViewerProps {
  asset: Asset;
  onClose: () => void;
}

export function ImageViewer({ asset, onClose }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1.0);

  const handleDownload = () => {
    if (!asset.storageUrl) return;

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = asset.storageUrl;
    link.download = `${asset.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-900/95 p-4" onClick={onClose}>
      <Card
        className="relative h-full max-h-[90vh] w-full max-w-6xl overflow-hidden border-accent/30 bg-gradient-to-br from-midnight-900/95 via-midnight-800/95 to-midnight-700/95"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{asset.name}</h2>
              <p className="text-sm text-shadow-400">{asset.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <Button
                onClick={handleZoomOut}
                variant="ghost"
                size="sm"
                className="text-shadow-300 hover:text-white"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-shadow-400">{Math.round(zoom * 100)}%</span>
              <Button
                onClick={handleZoomIn}
                variant="ghost"
                size="sm"
                className="text-shadow-300 hover:text-white"
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                variant="ghost"
                size="sm"
                className="text-shadow-300 hover:text-white"
                disabled={!asset.storageUrl}
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* Close Button */}
              <Button onClick={onClose} variant="ghost" size="sm" className="text-shadow-300 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex h-[calc(100%-5rem)] flex-col p-0 md:flex-row">
          {/* Image Display */}
          <div className="flex flex-1 items-center justify-center overflow-auto bg-midnight-900/50 p-6">
            {asset.storageUrl ? (
              <img
                src={asset.storageUrl}
                alt={asset.name}
                className="max-h-full max-w-full rounded-lg shadow-2xl transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              />
            ) : (
              <div className="text-center text-shadow-400">
                <p className="text-lg">No image available</p>
                <p className="mt-2 text-sm">Generate an image to see it here</p>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="w-full border-t border-accent/20 bg-midnight-900/70 p-6 md:w-80 md:border-l md:border-t-0">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-shadow-300">Details</h3>

            <div className="space-y-3 text-sm">
              {/* Status */}
              <div>
                <span className="block text-xs text-shadow-500">Status</span>
                <div className="mt-1">
                  <span
                    className={`inline-block rounded-full border px-3 py-1 text-xs uppercase tracking-wider ${
                      asset.status === 'done'
                        ? 'border-green-500/60 bg-green-600/70 text-green-200'
                        : asset.status === 'loading'
                          ? 'border-aurora-500/60 bg-aurora-600/70 text-aurora-200'
                          : asset.status === 'error'
                            ? 'border-red-500/60 bg-red-600/70 text-red-200'
                            : 'border-shadow-500/60 bg-shadow-600/70 text-shadow-300'
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>
              </div>

              {/* Type */}
              <div>
                <span className="block text-xs text-shadow-500">Type</span>
                <div className="mt-1 text-white">{asset.assetType.toUpperCase()} Image</div>
              </div>

              {/* Created Date */}
              <div>
                <span className="block text-xs text-shadow-500">Created</span>
                <div className="mt-1 text-white">{new Date(asset.createdAt).toLocaleString()}</div>
              </div>

              {/* Generation Prompt */}
              {asset.generationPrompt && (
                <div>
                  <span className="block text-xs text-shadow-500">Prompt</span>
                  <div className="mt-1 rounded border border-midnight-500 bg-midnight-800/50 p-2 text-xs text-shadow-300">
                    {asset.generationPrompt}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <span className="block text-xs text-shadow-500">Description</span>
                <div className="mt-1 rounded border border-midnight-500 bg-midnight-800/50 p-2 text-xs text-shadow-300">
                  {asset.description}
                </div>
              </div>

              {/* Storage URL (for debugging) */}
              {asset.storageUrl && (
                <div>
                  <span className="block text-xs text-shadow-500">URL</span>
                  <div className="mt-1 overflow-hidden text-ellipsis rounded border border-midnight-500 bg-midnight-800/50 p-2 text-xs text-shadow-300">
                    {asset.storageUrl}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <Button
                onClick={handleDownload}
                className="w-full bg-accent/20 text-accent hover:bg-accent/30"
                disabled={!asset.storageUrl}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Image
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
