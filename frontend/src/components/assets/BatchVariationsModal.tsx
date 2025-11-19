/**
 * BatchVariationsModal Component
 * Modal for generating multiple variations from a base asset
 */

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import Input from '../ui/input';
import Textarea from '../ui/textarea';
import Label from '../ui/label';
import type { Asset } from '../../services/assetService';

interface BatchVariationsModalProps {
  baseAsset: Asset;
  onClose: () => void;
  onSuccess?: (assetIds: string[]) => void;
  onGenerate: (count: number, modifier: string) => Promise<void>;
}

export function BatchVariationsModal({ baseAsset, onClose, onSuccess, onGenerate }: BatchVariationsModalProps) {
  const [count, setCount] = useState(4);
  const [modifier, setModifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProgress(0);

    if (count < 2 || count > 8) {
      setError('Count must be between 2 and 8');
      return;
    }

    setLoading(true);

    try {
      await onGenerate(count, modifier.trim());
      onClose();
      onSuccess?.([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate variations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-900/90 p-4" onClick={onClose}>
      <Card
        className="relative w-full max-w-2xl border-accent/30 bg-gradient-to-br from-midnight-900/95 via-midnight-800/95 to-midnight-700/95"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-accent/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <Sparkles className="h-5 w-5 text-accent" />
              Generate Variations
            </CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-shadow-300 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Base Asset Preview */}
          <div className="mb-6 rounded-lg border border-accent/20 bg-accent/5 p-4">
            <div className="flex gap-4">
              {baseAsset.storageUrl && (
                <img src={baseAsset.storageUrl} alt={baseAsset.name} className="h-24 w-24 rounded-lg object-cover" />
              )}
              <div>
                <h4 className="mb-1 text-sm font-semibold text-white">Base Asset</h4>
                <p className="text-lg font-bold text-accent">{baseAsset.name}</p>
                <p className="text-xs text-shadow-400 line-clamp-2">{baseAsset.description}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Variation Count */}
            <div>
              <Label htmlFor="count" className="text-shadow-200">
                Number of Variations *
              </Label>
              <Input
                id="count"
                type="number"
                min={2}
                max={8}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value, 10) || 2)}
                className="mt-1 border-midnight-500 bg-midnight-800/50 text-white"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-shadow-500">Generate 2-8 variations (recommended: 4)</p>
            </div>

            {/* Style Modifier */}
            <div>
              <Label htmlFor="modifier" className="text-shadow-200">
                Style Modifier (optional)
              </Label>
              <Textarea
                id="modifier"
                value={modifier}
                onChange={(e) => setModifier(e.target.value)}
                placeholder="e.g., 'in different colors', 'with different poses', 'at different angles'..."
                className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
                rows={3}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-shadow-500">
                Optional: Add a style modifier to guide the variations. Leave blank for automatic variations.
              </p>
            </div>

            {/* Progress Bar */}
            {loading && progress > 0 && (
              <div className="rounded-lg border border-accent/30 bg-accent/10 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-accent">
                  <span>Generating variations...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-midnight-700">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-nebula transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
            )}

            {/* Info Box */}
            <div className="rounded-lg border border-aurora-500/30 bg-aurora-500/10 p-3 text-xs text-aurora-200">
              💡 Each variation will use the base prompt with slight modifications. All variations will be created
              simultaneously and added to the current collection.
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="ghost"
                className="flex-1 text-shadow-300 hover:text-white"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-accent text-white hover:bg-accent/90" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate {count} Variations
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
