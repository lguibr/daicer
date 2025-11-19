/**
 * QuickCreateAsset Component
 * Inline form for instant asset generation with minimal clicks
 */

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import Textarea from '../ui/textarea';
import Label from '../ui/label';
import Input from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createAsset, generateImage, generateModel, updateAsset } from '../../services/assetService';

interface QuickCreateAssetProps {
  collectionId: string;
  assetType: '2d' | '3d';
  onSuccess?: (assetId: string) => void;
  onError?: (error: string) => void;
}

const VOXEL_TYPES = [
  { value: 'Creature', label: 'Creature', icon: '🐉' },
  { value: 'Tree', label: 'Tree', icon: '🌳' },
  { value: 'Terrain', label: 'Terrain', icon: '⛰️' },
  { value: 'Humanoid', label: 'Humanoid', icon: '🧍' },
  { value: 'POI', label: 'POI', icon: '🏛️' },
  { value: 'Object', label: 'Object', icon: '📦' },
];

export function QuickCreateAsset({ collectionId, assetType, onSuccess, onError }: QuickCreateAssetProps) {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [voxelType, setVoxelType] = useState('Creature');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!prompt.trim()) {
      setError('Prompt is required');
      return;
    }

    const assetName = name.trim() || prompt.substring(0, 50);

    setLoading(true);
    let assetId: string | null = null;

    try {
      // Step 1: Create the asset
      const createResult = await createAsset({
        collectionId,
        name: assetName,
        description: prompt.trim(),
        generationPrompt: prompt.trim(),
      });
      assetId = createResult.id;

      // Step 2: Generate immediately based on type
      if (assetType === '2d') {
        const imageResult = await generateImage(assetId, prompt.trim());
        await updateAsset(assetId, {
          status: 'done',
          storageUrl: imageResult.imageUrl,
        });
      } else if (assetType === '3d') {
        const modelResult = await generateModel(assetId, {
          assetType: voxelType,
          name: assetName,
          description: prompt.trim(),
        });
        await updateAsset(assetId, {
          status: 'done',
          modelData: modelResult,
        });
      }

      // Reset form
      setName('');
      setPrompt('');
      setVoxelType('Creature');

      onSuccess?.(assetId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMsg);
      onError?.(errorMsg);

      // Update asset status to error if it was created
      if (assetId) {
        await updateAsset(assetId, { status: 'error' }).catch(console.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-white">
            Quick Generate {assetType === '2d' ? 'Image' : '3D Model'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 3D Type Selector */}
          {assetType === '3d' && (
            <div>
              <Label htmlFor="voxelType" className="text-shadow-200">
                Model Type
              </Label>
              <Select value={voxelType} onValueChange={setVoxelType} disabled={loading}>
                <SelectTrigger className="mt-1 border-midnight-500 bg-midnight-800/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-midnight-500 bg-midnight-800">
                  {VOXEL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      <span>
                        {type.icon} {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Optional Name */}
          <div>
            <Label htmlFor="name" className="text-shadow-200">
              Name (optional)
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={assetType === '2d' ? 'Character Portrait' : 'Oak Tree'}
              className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
              disabled={loading}
            />
          </div>

          {/* Prompt */}
          <div>
            <Label htmlFor="prompt" className="text-shadow-200">
              Generation Prompt *
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                assetType === '2d'
                  ? 'A medieval knight in shining armor with a red cape...'
                  : 'A tall oak tree with spreading branches and green leaves...'
              }
              className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
              rows={4}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-shadow-500">
              {loading ? 'Generating...' : 'Press Ctrl+Enter to generate instantly'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
          )}

          {/* Generate Button */}
          <Button type="submit" className="w-full bg-accent text-white hover:bg-accent/90" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Now
              </>
            )}
          </Button>

          {/* Info */}
          <div className="rounded-lg border border-aurora-500/30 bg-aurora-500/10 p-3 text-xs text-aurora-200">
            💡 Asset will be created and generated in one step. Result appears in the grid below.
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
