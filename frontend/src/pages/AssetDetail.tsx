/**
 * AssetDetail Page
 * Full-page view for a single asset with edit capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, Copy, MoveRight, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { PrivateLayout } from '../components/layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { VoxelModelViewer } from '../components/assets/VoxelModelViewer';
import { StructureGridPreview } from '../components/assets/StructureGridPreview';
import { MoveAssetModal } from '../components/assets/MoveAssetModal';
import Input from '../components/ui/input';
import Textarea from '../components/ui/textarea';
import {
  getAsset,
  updateAsset,
  deleteAsset,
  getCollections,
  type Asset,
  type Collection,
} from '../services/assetService';

export default function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedPrompt, setEditedPrompt] = useState('');

  const [variationsCount, setVariationsCount] = useState(3);
  const [variationsModifier, setVariationsModifier] = useState('');
  const [isCreatingVariations, setIsCreatingVariations] = useState(false);

  const loadAsset = useCallback(async () => {
    if (!assetId) return;

    setIsLoading(true);
    try {
      const data = await getAsset(assetId);
      setAsset(data);
      setEditedName(data.name);
      setEditedDescription(data.description);
      setEditedPrompt(data.generationPrompt || '');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load asset', variant: 'destructive' });
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  }, [assetId, navigate, toast]);

  const loadCollections = useCallback(async () => {
    try {
      const data = await getCollections();
      setCollections(data);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }, []);

  useEffect(() => {
    if (assetId) {
      loadAsset();
      loadCollections();
    }
  }, [assetId, loadAsset, loadCollections]);

  const handleSave = async () => {
    if (!asset) return;

    setIsSaving(true);
    try {
      await updateAsset(asset.id, {
        name: editedName.trim(),
        description: editedDescription.trim(),
        generationPrompt: editedPrompt.trim() || undefined,
      });

      setAsset({
        ...asset,
        name: editedName.trim(),
        description: editedDescription.trim(),
        generationPrompt: editedPrompt.trim() || undefined,
      });

      setIsEditing(false);
      toast({ title: 'Saved', description: 'Asset updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update asset', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!asset) return;

    setIsSaving(true);
    try {
      // First save the updated prompt
      await updateAsset(asset.id, {
        generationPrompt: editedPrompt.trim(),
        status: 'pending',
      });

      // Then trigger generation
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assets-gen/assets/${asset.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Generation failed');

      toast({ title: 'Generation Started', description: 'Asset is being regenerated' });
      setTimeout(() => loadAsset(), 2000);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start generation', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateVariations = async () => {
    if (!asset) return;

    setIsCreatingVariations(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assets-gen/assets/${asset.id}/variations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: variationsCount,
          variationPrompt: variationsModifier.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create variations');

      const data = await response.json();
      toast({
        title: 'Variations Created',
        description: `Created ${data.data.assetIds.length} variation assets`,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create variations', variant: 'destructive' });
    } finally {
      setIsCreatingVariations(false);
    }
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-alert
    if (!asset || !confirm('Are you sure you want to delete this asset?')) return;

    setIsLoading(true);
    try {
      await deleteAsset(asset.id);
      toast({ title: 'Deleted', description: 'Asset deleted successfully' });
      navigate(-1);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete asset', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PrivateLayout showNavbar>
        <LoadingOverlay message="Loading asset..." />
      </PrivateLayout>
    );
  }

  if (!asset) {
    return (
      <PrivateLayout showNavbar>
        <div className="container mx-auto p-6">
          <p className="text-white">Asset not found</p>
        </div>
      </PrivateLayout>
    );
  }

  const collection = collections.find((c) => c.id === asset.collectionId);

  return (
    <PrivateLayout showNavbar>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center text-sm text-shadow-300 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">{asset.name}</h1>
          <p className="text-sm text-shadow-400">
            {collection?.name} • {asset.assetType.toUpperCase()} • Created{' '}
            {new Date(asset.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Preview */}
          <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Preview</h2>
              <div className="flex items-center justify-center rounded-lg bg-midnight-950/60 p-8">
                {asset.storageUrl ? (
                  <img
                    src={asset.storageUrl}
                    alt={asset.name}
                    className="max-h-[50vh] max-w-full rounded-lg object-contain"
                  />
                ) : asset.modelData ? (
                  <div className="space-y-4 w-full">
                    {/* 3D Voxel View */}
                    <div className="h-96 w-full">
                      <VoxelModelViewer modelData={asset.modelData} width={600} height={400} showGrid autoRotate />
                    </div>

                    {/* Grid Preview (for structures/maps) */}
                    {(asset.assetType === 'structures' || asset.assetType === 'map') && (
                      <StructureGridPreview
                        structureId={asset.id}
                        structureName={asset.name}
                        structureData={asset.modelData}
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-shadow-400">No preview available - Generate asset to see preview</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <div className="space-y-6">
            <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Asset Details</h2>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="ghost"
                      size="sm"
                      className="text-accent hover:text-accent/80"
                    >
                      Edit
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="asset-name"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wider text-shadow-400"
                    >
                      Name
                    </label>
                    <Input
                      id="asset-name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      disabled={!isEditing || isSaving}
                      className="border-midnight-500 bg-midnight-800/50 text-white"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="asset-description"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wider text-shadow-400"
                    >
                      Description
                    </label>
                    <Textarea
                      id="asset-description"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      disabled={!isEditing || isSaving}
                      className="border-midnight-500 bg-midnight-800/50 text-white"
                      rows={3}
                    />
                  </div>

                  {/* Generation Prompt */}
                  <div>
                    <label
                      htmlFor="asset-prompt"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wider text-shadow-400"
                    >
                      Generation Prompt
                    </label>
                    <Textarea
                      id="asset-prompt"
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      disabled={!isEditing || isSaving}
                      className="border-midnight-500 bg-midnight-800/50 text-white"
                      rows={2}
                      placeholder="AI generation prompt..."
                    />
                  </div>

                  {/* Save/Cancel Buttons */}
                  {isEditing && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedName(asset.name);
                          setEditedDescription(asset.description);
                          setEditedPrompt(asset.generationPrompt || '');
                        }}
                        variant="ghost"
                        className="flex-1 text-shadow-300 hover:text-white"
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        className="flex-1 bg-accent text-white hover:bg-accent/90"
                        disabled={isSaving}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  )}

                  {/* Regenerate Button */}
                  {asset.status === 'done' && isEditing && editedPrompt.trim() && (
                    <Button
                      onClick={handleRegenerate}
                      className="w-full bg-aurora/20 text-aurora-200 hover:bg-aurora/30"
                      disabled={isSaving}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Regenerate with New Prompt
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Variations Section */}
            {asset.status === 'done' && (
              <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-lg font-semibold text-white">Create Variations</h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="variations-count"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-shadow-400"
                      >
                        Number of Variations
                      </label>
                      <Input
                        id="variations-count"
                        type="number"
                        min={1}
                        max={8}
                        value={variationsCount}
                        onChange={(e) => setVariationsCount(parseInt(e.target.value, 10))}
                        className="border-midnight-500 bg-midnight-800/50 text-white"
                        disabled={isCreatingVariations}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="variations-modifier"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-shadow-400"
                      >
                        Variation Modifier (optional)
                      </label>
                      <Input
                        id="variations-modifier"
                        value={variationsModifier}
                        onChange={(e) => setVariationsModifier(e.target.value)}
                        placeholder="e.g., 'with blue eyes', 'at sunset'"
                        className="border-midnight-500 bg-midnight-800/50 text-white"
                        disabled={isCreatingVariations}
                      />
                    </div>
                    <Button
                      onClick={handleCreateVariations}
                      className="w-full bg-nebula/20 text-nebula-200 hover:bg-nebula/30"
                      disabled={isCreatingVariations}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {isCreatingVariations
                        ? 'Creating...'
                        : `Create ${variationsCount} Variation${variationsCount > 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Actions</h2>
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowMoveModal(true)}
                    variant="default"
                    className="w-full bg-midnight-600/60 text-shadow-200 hover:bg-midnight-500/60 hover:text-white"
                  >
                    <MoveRight className="mr-2 h-4 w-4" />
                    Move to Different Collection
                  </Button>
                  <Button onClick={handleDelete} variant="ghost" className="w-full text-shadow-300 hover:text-red-400">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Asset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Move Asset Modal */}
      {showMoveModal && asset && (
        <MoveAssetModal
          asset={asset}
          currentCollections={collections}
          onClose={() => setShowMoveModal(false)}
          onSuccess={() => {
            setShowMoveModal(false);
            loadAsset();
            toast({ title: 'Moved', description: 'Asset moved successfully' });
          }}
        />
      )}
    </PrivateLayout>
  );
}
