/**
 * MoveAssetModal Component
 * Modal for moving an asset to another collection (with type validation)
 */

import { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { FormField } from '../ui/form-field';
import { Button } from '../ui/button';
import type { Collection, Asset } from '../../services/assetService';

interface MoveAssetModalProps {
  asset: Asset;
  currentCollections: Collection[];
  onClose: () => void;
  onSuccess: () => void;
}

export function MoveAssetModal({ asset, currentCollections, onClose, onSuccess }: MoveAssetModalProps) {
  const [targetCollectionId, setTargetCollectionId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter collections: only same type, exclude current
  const compatibleCollections = currentCollections.filter(
    (c) => c.assetType === asset.assetType && c.id !== asset.collectionId
  );

  useEffect(() => {
    if (compatibleCollections.length === 0) {
      setError(`No other ${asset.assetType} collections available`);
    }
  }, [compatibleCollections.length, asset.assetType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!targetCollectionId) {
      setError('Please select a target collection');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/assets-gen/${asset.id}/move`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(await getAuthHeaders()),
          },
          body: JSON.stringify({ targetCollectionId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to move asset');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move asset');
    } finally {
      setIsLoading(false);
    }
  };

  const currentCollection = currentCollections.find((c) => c.id === asset.collectionId);

  return (
    <Modal isOpen onClose={onClose} title="Move Asset">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <p className="text-sm text-shadow-300">
            Move <span className="font-semibold text-white">{asset.name}</span>
          </p>
          <p className="mt-1 text-xs text-shadow-400">
            From: <span className="text-accent">{currentCollection?.name}</span>
          </p>
        </div>

        <FormField label="Target Collection" htmlFor="target" required error={error}>
          <select
            id="target"
            value={targetCollectionId}
            onChange={(e) => setTargetCollectionId(e.target.value)}
            disabled={isLoading || compatibleCollections.length === 0}
            className="w-full rounded-md border border-midnight-500 bg-midnight-700 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select collection...</option>
            {compatibleCollections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name} ({collection.assetType.toUpperCase()})
              </option>
            ))}
          </select>
          {compatibleCollections.length === 0 && (
            <p className="mt-2 text-xs text-shadow-400">
              Create another {asset.assetType} collection to move this asset
            </p>
          )}
        </FormField>

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose} variant="ghost" disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !targetCollectionId || compatibleCollections.length === 0}>
            {isLoading ? 'Moving...' : 'Move'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { auth } = await import('../../services/firebase');
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
