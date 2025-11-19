/**
 * RenameCollectionModal Component
 * Modal for renaming an existing collection
 */

import { useState } from 'react';
import { Modal } from '../ui/modal';
import { FormField } from '../ui/form-field';
import { Button } from '../ui/button';
import Input from '../ui/input';

interface RenameCollectionModalProps {
  collectionId: string;
  currentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RenameCollectionModal({ collectionId, currentName, onClose, onSuccess }: RenameCollectionModalProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }

    if (name === currentName) {
      onClose();
      return;
    }

    setIsLoading(true);

    try {
      const { updateCollection } = await import('../../services/assetService');
      await updateCollection(collectionId, { name: name.trim() });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename collection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Rename Collection">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Collection Name" htmlFor="name" required error={error}>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter collection name"
            disabled={isLoading}
            autoFocus
          />
        </FormField>

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose} variant="ghost" disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !name.trim()}>
            {isLoading ? 'Renaming...' : 'Rename'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
