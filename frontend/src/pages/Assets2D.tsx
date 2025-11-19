/**
 * 2D Assets Page - Image Generation
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Upload, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/toast';
import { PrivateLayout } from '../components/layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { CollectionCard } from '../components/assets/CollectionCard';
import { CreateCollectionModal } from '../components/assets/CreateCollectionModal';
import { AssetCard } from '../components/assets/AssetCard';
import { AssetPreviewModal } from '../components/assets/AssetPreviewModal';
import { MoveAssetModal } from '../components/assets/MoveAssetModal';
import { useAssetsStore } from '../state/assetsStore';
import { auth } from '../services/firebase';
import {
  getCollections,
  getCollectionAssets,
  deleteCollection,
  deleteAsset,
  updateCollection,
  createAsset,
  getAsset,
} from '../services/assetService';
import Textarea from '../components/ui/textarea';
import Label from '../components/ui/label';

export default function Assets2DPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { collections, setCollections, assets, setAssets, isLoading, setLoading, setError } = useAssetsStore();

  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [viewingAsset, setViewingAsset] = useState<string | null>(null);
  const [movingAsset, setMovingAsset] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'collection' | 'asset'; id: string } | null>(null);
  
  // Inline form state
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, []);

  // Load assets when collection is selected
  useEffect(() => {
    if (selectedCollection) {
      loadAssets(selectedCollection);
    } else {
      setAssets([]);
    }
  }, [selectedCollection]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await getCollections('2d');
      setCollections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async (collectionId: string) => {
    setLoading(true);
    try {
      const data = await getCollectionAssets(collectionId);
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleRenameCollection = async (collectionId: string, newName: string) => {
    try {
      await updateCollection(collectionId, { name: newName });
      await loadCollections();
      toast({ title: 'Renamed', description: 'Collection renamed successfully' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to rename collection', variant: 'destructive' });
      throw err;
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    setLoading(true);
    try {
      await deleteCollection(collectionId);
      setCollections(collections.filter((c) => c.id !== collectionId));
      if (selectedCollection === collectionId) {
        setSelectedCollection(null);
        setAssets([]);
      }
      setDeleteConfirm(null);
      toast({ title: 'Deleted', description: 'Collection deleted successfully' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete collection';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    setLoading(true);
    try {
      await deleteAsset(assetId);
      setAssets(assets.filter((a) => a.id !== assetId));
      setDeleteConfirm(null);
      toast({ title: 'Deleted', description: 'Asset deleted successfully' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset');
      toast({ title: 'Error', description: 'Failed to delete asset', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate2D = async () => {
    if (!selectedCollection || !prompt.trim()) {
      toast({ title: 'Error', description: 'Please enter a prompt', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Step 1: Create asset
      const assetName = prompt.substring(0, 50) || 'Generated Asset';
      const createResult = await createAsset({
        collectionId: selectedCollection,
        name: assetName,
        description: prompt.trim(),
        generationPrompt: prompt.trim(),
      });

      const assetId = createResult.id;

      // Step 2: Generate immediately
      if (imageFile) {
        // Use variation endpoint with image
        const formData = new FormData();
        formData.append('baseImage', imageFile);
        formData.append('masterDescription', prompt.trim());
        formData.append('variationDescription', prompt.trim());

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/assets-gen/assets/${assetId}/generate-variation`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) throw new Error('Generation failed');
      } else {
        // Use text-to-image endpoint
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/assets-gen/assets/${assetId}/generate-image`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ prompt: prompt.trim() }),
          }
        );

        if (!response.ok) throw new Error('Generation failed');
      }

      toast({ title: 'Generation Started', description: 'Asset is being generated' });
      
      // Immediately reload assets to show the new asset in the grid
      if (selectedCollection) {
        await loadAssets(selectedCollection);
      }

      // Clear form
      setPrompt('');
      setImageFile(null);

      // Poll for asset status until done or error
      const pollAssetStatus = async () => {
        const maxAttempts = 60; // 60 attempts = 5 minutes max (5s intervals)
        let attempts = 0;

        const checkStatus = async (): Promise<void> => {
          if (attempts >= maxAttempts) {
            toast({
              title: 'Timeout',
              description: 'Generation is taking longer than expected. Please refresh the page.',
              variant: 'destructive',
            });
            if (selectedCollection) {
              loadAssets(selectedCollection);
            }
            return;
          }

          try {
            const asset = await getAsset(assetId);
            if (asset.status === 'done' || asset.status === 'error') {
              // Reload assets to show updated status
              if (selectedCollection) {
                loadAssets(selectedCollection);
              }
              if (asset.status === 'done') {
                toast({
                  title: 'Generation Complete',
                  description: '2D image generated successfully!',
                });
              } else {
                toast({
                  title: 'Generation Failed',
                  description: 'The asset generation encountered an error.',
                  variant: 'destructive',
                });
              }
              return;
            }

            // Still loading, check again in 5 seconds
            attempts++;
            setTimeout(checkStatus, 5000);
          } catch (error) {
            // If polling fails, just reload assets
            if (selectedCollection) {
              loadAssets(selectedCollection);
            }
          }
        };

        // Start polling after 2 seconds
        setTimeout(checkStatus, 2000);
      };

      pollAssetStatus();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start generation',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const selectedCollectionData = collections.find((c) => c.id === selectedCollection);
  const assetCount = (id: string) => assets.filter((a) => a.collectionId === id).length;
  const viewingAssetData = assets.find((a) => a.id === viewingAsset);

  return (
    <PrivateLayout showNavbar>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/assets" className="mb-2 inline-flex items-center text-sm text-shadow-300 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assets
            </Link>
            <h1 className="text-3xl font-bold text-white">2D Image Assets</h1>
            <p className="text-shadow-300">Generate character sprites and image variations</p>
          </div>
          {!selectedCollection && (
            <Button
              onClick={() => setShowCreateCollection(true)}
              className="bg-accent text-white hover:bg-accent/90"
              data-testid="create-collection-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          )}
        </div>

        {/* Loading Overlay */}
        {isLoading && <LoadingOverlay />}

        {/* Collection View */}
        {!selectedCollection && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-white">Your Collections</h2>
            {collections.length === 0 ? (
              <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
                <CardContent className="p-12 text-center">
                  <p className="text-lg text-shadow-300">No collections created yet</p>
                  <p className="mt-2 text-sm text-shadow-400">
                    Create your first collection to organize your 2D assets
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    assetCount={assetCount(collection.id)}
                    onView={() => setSelectedCollection(collection.id)}
                    onRename={(newName) => handleRenameCollection(collection.id, newName)}
                    onDelete={() => setDeleteConfirm({ type: 'collection', id: collection.id })}
                    onCreateAsset={() => setSelectedCollection(collection.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Asset View */}
        {selectedCollection && selectedCollectionData && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">{selectedCollectionData.name}</h2>
                {selectedCollectionData.description && (
                  <p className="text-sm text-shadow-400">{selectedCollectionData.description}</p>
                )}
              </div>
              <Button
                onClick={() => {
                  setSelectedCollection(null);
                  setAssets([]);
                }}
                variant="ghost"
                size="sm"
                className="text-shadow-300 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Collections
              </Button>
            </div>

            {/* Inline Generation Form */}
            <Card className="mb-6 border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Generate 2D Asset</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGenerate2D();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="prompt" className="text-shadow-200">
                      Prompt *
                    </Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="A magical forest with glowing mushrooms and fireflies..."
                      className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
                      rows={3}
                      disabled={generating}
                      data-testid="asset-prompt-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="imageFile" className="text-shadow-200">
                      Base Image (optional)
                    </Label>
                    <div className="mt-1">
                      <label
                        htmlFor="imageFile"
                        className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-midnight-500 bg-midnight-800/50 p-4 transition-colors hover:border-accent/50"
                      >
                        <div className="text-center">
                          <Upload className="mx-auto mb-2 h-6 w-6 text-shadow-600" />
                          <p className="text-sm text-white">
                            {imageFile ? imageFile.name : 'Click to upload image (optional)'}
                          </p>
                          <p className="mt-1 text-xs text-shadow-500">PNG, JPG up to 10MB</p>
                        </div>
                        <input
                          id="imageFile"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                          className="hidden"
                          disabled={generating}
                        />
                      </label>
                      {imageFile && (
                        <Button
                          type="button"
                          onClick={() => setImageFile(null)}
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-xs text-shadow-400 hover:text-red-400"
                        >
                          Remove image
                        </Button>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-accent text-white hover:bg-accent/90"
                    disabled={generating || !prompt.trim()}
                    data-testid="generate-asset-button"
                  >
                    {generating ? (
                      'Generating...'
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Asset
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Asset Grid */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Assets ({assets.length})</h3>
              {assets.length === 0 ? (
                <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
                  <CardContent className="p-12 text-center">
                    <p className="text-lg text-shadow-300">No assets in this collection</p>
                    <p className="mt-2 text-sm text-shadow-400">Generate your first asset using the form above</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {assets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onView={() => setViewingAsset(asset.id)}
                      onMove={() => setMovingAsset(asset.id)}
                      onDelete={() => setDeleteConfirm({ type: 'asset', id: asset.id })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Collection Modal */}
        {showCreateCollection && (
          <CreateCollectionModal
            assetType="2d"
            onClose={() => setShowCreateCollection(false)}
            onSuccess={() => {
              loadCollections();
              setShowCreateCollection(false);
            }}
          />
        )}

        {/* Asset Preview Modal */}
        {viewingAsset && viewingAssetData && (
          <AssetPreviewModal
            asset={viewingAssetData}
            allAssets={assets}
            onClose={() => setViewingAsset(null)}
            onDelete={() => setDeleteConfirm({ type: 'asset', id: viewingAsset })}
            onOpenDetailPage={() => navigate(`/assets/${viewingAsset}`)}
            onNavigate={(direction) => {
              const currentIndex = assets.findIndex((a) => a.id === viewingAsset);
              const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
              const nextAsset = assets[nextIndex];
              if (nextAsset) {
                setViewingAsset(nextAsset.id);
              }
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-900/90 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <Card
              className="w-full max-w-md border-accent/30 bg-gradient-to-br from-midnight-900/95 via-midnight-800/95 to-midnight-700/95"
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Delete {deleteConfirm.type === 'collection' ? 'Collection' : 'Asset'}?
                </h3>
                <p className="mb-6 text-sm text-shadow-300">
                  This will permanently delete the {deleteConfirm.type} and all associated data. This action cannot be
                  undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setDeleteConfirm(null)}
                    variant="ghost"
                    className="flex-1 text-shadow-300 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (deleteConfirm.type === 'collection') {
                        handleDeleteCollection(deleteConfirm.id);
                      } else {
                        handleDeleteAsset(deleteConfirm.id);
                      }
                    }}
                    className="flex-1 bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Move Asset Modal */}
        {movingAsset && (
          <MoveAssetModal
            asset={assets.find((a) => a.id === movingAsset)!}
            currentCollections={collections}
            onClose={() => setMovingAsset(null)}
            onSuccess={() => {
              loadAssets(selectedCollection!);
              setMovingAsset(null);
              toast({ title: 'Moved', description: 'Asset moved successfully' });
            }}
          />
        )}
      </div>
    </PrivateLayout>
  );
}
