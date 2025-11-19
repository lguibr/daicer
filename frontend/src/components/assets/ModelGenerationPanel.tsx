/**
 * ModelGenerationPanel Component
 * Panel for generating 3D voxel models
 */

import { useState } from 'react';
import { Sparkles, Box } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import Textarea from '../ui/textarea';
import Label from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { generateModel, updateAsset } from '../../services/assetService';

interface ModelGenerationPanelProps {
  assetId: string;
  onSuccess?: (modelData: any) => void;
}

const ASSET_TYPES = [
  { value: 'Creature', label: 'Creature', icon: '🐉', description: 'Animals, monsters, fantasy creatures' },
  { value: 'Tree', label: 'Tree', icon: '🌳', description: 'Various tree types and plants' },
  { value: 'Terrain', label: 'Terrain', icon: '⛰️', description: 'Rocks, cliffs, natural features' },
  { value: 'Humanoid', label: 'Humanoid', icon: '🧍', description: 'Characters, people, NPCs' },
  { value: 'POI', label: 'POI', icon: '🏛️', description: 'Landmarks, structures, buildings' },
  { value: 'Object', label: 'Object', icon: '📦', description: 'Items, props, equipment' },
];

export function ModelGenerationPanel({ assetId, onSuccess }: ModelGenerationPanelProps) {
  const [assetType, setAssetType] = useState('Creature');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedType = ASSET_TYPES.find((t) => t.value === assetType);

  const handleGenerate = async () => {
    setError('');

    if (!name.trim() || !description.trim()) {
      setError('Name and description are required');
      return;
    }

    setLoading(true);

    try {
      const result = await generateModel(assetId, {
        assetType,
        name: name.trim(),
        description: description.trim(),
      });

      await updateAsset(assetId, {
        status: 'done',
        modelData: result,
      });

      onSuccess?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      await updateAsset(assetId, { status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
      <CardContent className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Generate 3D Model</h3>

        <div className="space-y-4">
          {/* Asset Type Selector */}
          <div>
            <Label htmlFor="assetType" className="text-shadow-200">
              Model Type *
            </Label>
            <Select value={assetType} onValueChange={setAssetType} disabled={loading}>
              <SelectTrigger className="mt-1 border-midnight-500 bg-midnight-800/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-midnight-500 bg-midnight-800">
                {ASSET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{type.icon}</span>
                      <div>
                        <div className="font-semibold">{type.label}</div>
                        <div className="text-xs text-shadow-400">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="mt-1 text-xs text-shadow-500">
                {selectedType.icon} {selectedType.description}
              </p>
            )}
          </div>

          {/* Model Name */}
          <div>
            <Label htmlFor="name" className="text-shadow-200">
              Model Name *
            </Label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                assetType === 'Creature'
                  ? 'Dragon'
                  : assetType === 'Tree'
                    ? 'Oak Tree'
                    : assetType === 'Terrain'
                      ? 'Rocky Cliff'
                      : assetType === 'Humanoid'
                        ? 'Knight'
                        : assetType === 'POI'
                          ? 'Ancient Tower'
                          : 'Treasure Chest'
              }
              className="mt-1 w-full rounded-md border border-midnight-500 bg-midnight-800/50 px-3 py-2 text-white placeholder:text-shadow-500"
              disabled={loading}
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
                assetType === 'Creature'
                  ? 'A fierce red dragon with large wings and sharp claws, breathing fire...'
                  : assetType === 'Tree'
                    ? 'A tall oak tree with a thick trunk and spreading branches with green leaves...'
                    : assetType === 'Terrain'
                      ? 'A jagged rocky cliff with sharp edges and gray stone texture...'
                      : assetType === 'Humanoid'
                        ? 'A medieval knight in shining silver armor with a sword and shield...'
                        : assetType === 'POI'
                          ? 'An ancient stone tower with crenellations and arrow slits...'
                          : 'A wooden treasure chest with metal bands and a lock...'
              }
              className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
              rows={5}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-shadow-500">
              Be specific about shapes, colors, and structure for best results
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            className="w-full bg-accent text-white hover:bg-accent/90"
            disabled={loading}
          >
            {loading ? (
              <>Generating Model...</>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate 3D Model
              </>
            )}
          </Button>

          {/* Info Box */}
          <div className="rounded-lg border border-aurora-500/30 bg-aurora-500/10 p-3 text-xs text-aurora-200">
            <div className="mb-1 flex items-center gap-2">
              <Box className="h-4 w-4" />
              <span className="font-semibold">Voxel Model Generation</span>
            </div>
            <p>
              Models are composed of primitive shapes (boxes, spheres, cylinders, cones, capsules) arranged to create
              the final 3D object. The AI will interpret your description into geometric parts.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
