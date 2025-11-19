/**
 * Structures Assets Page - Building/Structure Components
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/toast';
import { PrivateLayout } from '../components/layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { CollectionCard } from '../components/assets/CollectionCard';
import { CreateCollectionModal } from '../components/assets/CreateCollectionModal';
import { CreateAssetModal } from '../components/assets/CreateAssetModal';
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
} from '../services/assetService';

export default function AssetsStructuresPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { collections, setCollections, assets, setAssets, isLoading, setLoading, setError } = useAssetsStore();

  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [creatingAssetForCollection, setCreatingAssetForCollection] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [viewingAsset, setViewingAsset] = useState<string | null>(null);
  const [movingAsset, setMovingAsset] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'collection' | 'asset'; id: string } | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

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
      const data = await getCollections('structures');
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

  const handleGenerateAsset = async (assetId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assets-gen/assets/${assetId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) throw new Error('Generation failed');

      toast({ title: 'Generation Started', description: 'Structure is being generated' });

      setTimeout(() => {
        if (selectedCollection) {
          loadAssets(selectedCollection);
        }
      }, 2000);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start generation', variant: 'destructive' });
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
            <h1 className="text-3xl font-bold text-white">Structure Assets</h1>
            <p className="text-shadow-300">Create building components and architectural elements</p>
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
                    Create your first collection to organize your structure assets
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
                    onCreateAsset={() => {
                      setCreatingAssetForCollection(collection.id);
                      setShowCreateAsset(true);
                    }}
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
                <p className="text-sm text-shadow-400">
                  {selectedCollectionData.mode && `Mode: ${selectedCollectionData.mode}`}
                  {selectedCollectionData.description && ` • ${selectedCollectionData.description}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setCreatingAssetForCollection(selectedCollection);
                    setShowCreateAsset(true);
                  }}
                  className="bg-accent text-white hover:bg-accent/90"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Asset
                </Button>
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
            </div>

            {/* Asset Grid */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Assets ({assets.length})</h3>
              {assets.length === 0 ? (
                <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
                  <CardContent className="p-12 text-center">
                    <p className="text-lg text-shadow-300">No assets in this collection</p>
                    <p className="mt-2 text-sm text-shadow-400">Click Create Asset above to add your first asset</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {assets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onView={() => setViewingAsset(asset.id)}
                      onGenerate={() => handleGenerateAsset(asset.id)}
                      onMove={() => setMovingAsset(asset.id)}
                      onDelete={() => setDeleteConfirm({ type: 'asset', id: asset.id })}
                      showGenerateButton
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
            assetType="structures"
            onClose={() => setShowCreateCollection(false)}
            onSuccess={() => {
              loadCollections();
              setShowCreateCollection(false);
            }}
          />
        )}

        {/* Create Asset Modal */}
        {showCreateAsset && creatingAssetForCollection && (
          <CreateAssetModal
            collectionId={creatingAssetForCollection}
            assetType="structures"
            onClose={() => {
              setShowCreateAsset(false);
              setCreatingAssetForCollection(null);
            }}
            onSuccess={() => {
              setShowCreateAsset(false);
              setCreatingAssetForCollection(null);
              if (selectedCollection) {
                loadAssets(selectedCollection);
              } else {
                loadCollections();
              }
            }}
            onGenerate={handleGenerateAsset}
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
