/**
 * CreateAssetModal Component
 * Modal form for creating new assets
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import Input from '../ui/input';
import Textarea from '../ui/textarea';
import Label from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { StructureGenerationForm, type StructureGenerationParams } from './StructureGenerationForm';
import { MapGenerationForm, type MapGenerationParams } from './MapGenerationForm';
import { createAsset } from '../../services/assetService';

interface CreateAssetModalProps {
  collectionId: string;
  assetType: '2d' | '3d' | 'map' | 'structures' | 'character-sheet';
  onClose: () => void;
  onSuccess: (assetId: string) => void;
  onGenerate?: (assetId: string) => Promise<void>;
}

const VOXEL_ASSET_TYPES = [
  { value: 'Creature', label: 'Creature', description: 'Animals, monsters, NPCs' },
  { value: 'Tree', label: 'Tree', description: 'Various tree types' },
  { value: 'Terrain', label: 'Terrain', description: 'Rocks, cliffs, natural features' },
  { value: 'Humanoid', label: 'Humanoid', description: 'Characters, people' },
  { value: 'POI', label: 'Point of Interest', description: 'Landmarks, structures' },
  { value: 'Object', label: 'Object', description: 'Items, props' },
] as const;

const ASSET_TYPE_LABELS: Record<CreateAssetModalProps['assetType'], string> = {
  '2d': '2D Image',
  '3d': '3D Voxel Model',
  map: 'World Map',
  structures: 'Structure',
  'character-sheet': 'Character Sheet',
};

export function CreateAssetModal({ collectionId, assetType, onClose, onSuccess, onGenerate }: CreateAssetModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [voxelType, setVoxelType] = useState('Creature');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Structures/maps use typed forms instead of text (not currently used)
  // const usesTypedForm = assetType === 'structures' || assetType === 'map';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Asset name is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);
    try {
      const result = await createAsset({
        collectionId,
        name: name.trim(),
        description: description.trim(),
        generationPrompt: generationPrompt.trim() || undefined,
      });

      // Auto-generate after creation if handler provided
      if (onGenerate) {
        await onGenerate(result.id);
      }

      onSuccess(result.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  const handleStructureSubmit = async (params: StructureGenerationParams) => {
    setLoading(true);
    setError('');
    try {
      const result = await createAsset({
        collectionId,
        name: params.name,
        description: `${params.structureType} structure: ${params.width}x${params.height} chunks, ${params.floors} floors`,
        generationPrompt: JSON.stringify(params), // Store params as JSON
      });

      // Auto-generate after creation if handler provided
      if (onGenerate) {
        await onGenerate(result.id);
      }

      onSuccess(result.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create structure');
    } finally {
      setLoading(false);
    }
  };

  const handleMapSubmit = async (params: MapGenerationParams) => {
    setLoading(true);
    setError('');
    try {
      const result = await createAsset({
        collectionId,
        name: params.name,
        description: `Procedural map: ${params.width}x${params.height} chunks`,
        generationPrompt: JSON.stringify(params), // Store params as JSON
      });

      // Auto-generate after creation if handler provided
      if (onGenerate) {
        await onGenerate(result.id);
      }

      onSuccess(result.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create map');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-900/90 p-4" onClick={onClose}>
      <Card
        className="relative w-full max-w-lg border-accent/30 bg-gradient-to-br from-midnight-900/95 via-midnight-800/95 to-midnight-700/95"
        onClick={(e) => e.stopPropagation()}
        data-testid="create-asset-modal"
      >
        <CardHeader className="border-b border-accent/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-white">Create Asset</CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-shadow-300 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* For structures/maps, use typed forms */}
          {assetType === 'structures' ? (
            <StructureGenerationForm onSubmit={handleStructureSubmit} loading={loading} />
          ) : assetType === 'map' ? (
            <MapGenerationForm onSubmit={handleMapSubmit} loading={loading} />
          ) : (
            /* For 2D/3D/character-sheet, use text-based form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Asset Type Badge */}
              <div className="rounded-lg border border-accent/20 bg-accent/10 p-3 text-center">
                <p className="text-sm text-accent">Creating {ASSET_TYPE_LABELS[assetType]} Asset</p>
              </div>

              {/* Voxel Type Selection (3D only) */}
              {assetType === '3d' && (
                <div>
                  <Label htmlFor="voxelType" className="text-shadow-200">
                    Model Type *
                  </Label>
                  <Select value={voxelType} onValueChange={setVoxelType} disabled={loading}>
                    <SelectTrigger className="mt-1 border-midnight-500 bg-midnight-800/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-midnight-500 bg-midnight-800">
                      {VOXEL_ASSET_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white">
                          <div>
                            <div className="font-semibold">{type.label}</div>
                            <div className="text-xs text-shadow-400">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Asset Name */}
              <div>
                <Label htmlFor="name" className="text-shadow-200">
                  Asset Name *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    assetType === '2d'
                      ? 'Character Portrait'
                      : assetType === '3d'
                        ? 'Oak Tree'
                        : assetType === 'character-sheet'
                          ? 'Fighter Character'
                          : 'Fantasy World'
                  }
                  className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
                  disabled={loading}
                  data-testid="asset-name-input"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-shadow-200">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    assetType === '2d'
                      ? 'A medieval knight in shining armor...'
                      : assetType === '3d'
                        ? 'A tall oak tree with spreading branches...'
                        : assetType === 'character-sheet'
                          ? 'A brave fighter with high strength...'
                          : 'A procedurally generated fantasy world...'
                  }
                  className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
                  rows={4}
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-shadow-500">
                  {assetType === '3d'
                    ? 'Describe the model structure and details for AI generation'
                    : assetType === 'character-sheet'
                      ? 'Describe character class, stats, and background'
                      : 'Describe what you want to generate'}
                </p>
              </div>

              {/* Generation Prompt (optional for 2D/3D) */}
              {(assetType === '2d' || assetType === '3d') && (
                <div>
                  <Label htmlFor="prompt" className="text-shadow-200">
                    Generation Prompt (optional)
                  </Label>
                  <Textarea
                    id="prompt"
                    value={generationPrompt}
                    onChange={(e) => setGenerationPrompt(e.target.value)}
                    placeholder="Additional instructions for generation..."
                    className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
                    rows={3}
                    disabled={loading}
                    data-testid="asset-prompt-input"
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Info Box */}
              <div className="rounded-lg border border-aurora-500/30 bg-aurora-500/10 p-3 text-xs text-aurora-200">
                {assetType === '2d' && '✨ AI generation will start automatically after creation'}
                {assetType === '3d' && '✨ Voxel model generation will start automatically after creation'}

                {assetType === 'character-sheet' && '✨ Character sheet will be generated automatically'}
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
                <Button
                  type="submit"
                  className="flex-1 bg-accent text-white hover:bg-accent/90"
                  disabled={loading}
                  data-testid="asset-submit-button"
                >
                  {loading ? 'Creating...' : 'Create Asset'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
