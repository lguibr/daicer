/**
 * CreateCollectionModal Component
 * Modal form for creating new asset collections
 */

import { useState } from 'react';
import { Modal } from '../ui/modal';
import { FormField } from '../ui/form-field';
import { Button } from '../ui/button';
import Input from '../ui/input';
import Textarea from '../ui/textarea';
import { createCollection } from '../../services/assetService';

interface CreateCollectionModalProps {
  assetType: '2d' | '3d' | 'map' | 'structures' | 'character-sheet';
  onClose: () => void;
  onSuccess: (collectionId: string) => void;
}

const PRESET_COLORS = [
  '#7a49d9', // accent
  '#b78e21', // aurora
  '#4c6ef5', // nebula
  '#e03131', // red
  '#2b8a3e', // green
  '#f59f00', // orange
  '#7048e8', // purple
  '#1098ad', // cyan
];

const GENERATION_MODES = [
  { value: 'text-to-image', label: 'Text to Image', description: 'Generate images from text prompts' },
  { value: 'variations', label: 'Variations', description: 'Create variations from a base image' },
  { value: 'batch-transform', label: 'Batch Transform', description: 'Transform multiple images at once' },
  { value: 'batch-create', label: 'Batch Create', description: 'Create multiple assets with similar prompts' },
] as const;

const ASSET_TYPE_LABELS: Record<CreateCollectionModalProps['assetType'], string> = {
  '2d': '2D Images',
  '3d': '3D Models',
  map: 'World Maps',
  structures: 'Structures',
  'character-sheet': 'Character Sheets',
};

export function CreateCollectionModal({ assetType, onClose, onSuccess }: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<string>('text-to-image');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }

    setLoading(true);
    try {
      const result = await createCollection({
        name: name.trim(),
        assetType,
        mode: assetType === '2d' || assetType === '3d' ? mode : undefined,
        description: description.trim() || undefined,
        color,
      });
      onSuccess(result.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Create ${ASSET_TYPE_LABELS[assetType]} Collection`}
      data-testid="create-collection-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Collection Name */}
        <FormField label="Collection Name" htmlFor="name" required>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Assets"
            className="border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
            disabled={loading}
            data-testid="collection-name-input"
          />
        </FormField>

        {/* Generation Mode - Only for image collections (2d/3d) */}
        {(assetType === '2d' || assetType === '3d') && (
          <FormField label="Generation Mode" htmlFor="mode" required>
            <select
              id="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="input-style w-full border-midnight-500 bg-midnight-800/50 text-white"
              disabled={loading}
              data-testid="collection-mode-select"
            >
              {GENERATION_MODES.map((modeOption) => (
                <option key={modeOption.value} value={modeOption.value}>
                  {modeOption.label} — {modeOption.description}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-shadow-400">Mode cannot be changed after creation</p>
          </FormField>
        )}

        {/* Description */}
        <FormField label="Description" htmlFor="description">
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this collection..."
            className="border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
            rows={3}
            disabled={loading}
          />
        </FormField>

        {/* Color Picker */}
        <FormField label="Color">
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                onClick={() => setColor(presetColor)}
                className={`h-10 w-10 rounded-lg transition-all duration-200 ${
                  color === presetColor
                    ? 'scale-110 ring-2 ring-accent ring-offset-2 ring-offset-midnight-900'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: presetColor }}
                disabled={loading}
                title={`Select ${presetColor}`}
              />
            ))}
          </div>
        </FormField>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
        )}

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
            data-testid="collection-submit-button"
          >
            {loading ? 'Creating...' : 'Create Collection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
