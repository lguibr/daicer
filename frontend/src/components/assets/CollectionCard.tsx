/**
 * CollectionCard Component
 * Displays an asset collection with inline name edit, count, and actions
 */

import { useState } from 'react';
import { Trash2, FolderOpen, Check, X, Plus } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import Input from '../ui/input';
import type { Collection } from '../../services/assetService';

interface CollectionCardProps {
  collection: Collection;
  assetCount?: number;
  onView: () => void;
  onRename?: (newName: string) => Promise<void>;
  onDelete: () => void;
  onCreateAsset: () => void;
  onFilterByColor?: () => void;
}

export function CollectionCard({
  collection,
  assetCount = 0,
  onView,
  onRename,
  onDelete,
  onCreateAsset,
  onFilterByColor,
}: CollectionCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(collection.name);
  const [isSaving, setIsSaving] = useState(false);

  const colorClass = collection.color || '#7a49d9';

  const handleSaveName = async () => {
    if (!onRename || !editedName.trim() || editedName === collection.name) {
      setIsEditingName(false);
      setEditedName(collection.name);
      return;
    }

    setIsSaving(true);
    try {
      await onRename(editedName.trim());
      setIsEditingName(false);
    } catch (error) {
      setEditedName(collection.name);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName(collection.name);
  };

  return (
    <Card
      className="group border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60 transition-all duration-200 hover:border-accent/50 hover:shadow-[0_12px_30px_rgba(122,73,217,0.25)]"
      data-testid={`collection-card-${collection.id}`}
    >
      <CardContent className="p-6">
        {/* Color Badge */}
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onFilterByColor}
            className={`h-12 w-12 rounded-lg shadow-lg transition-transform duration-200 group-hover:scale-110 ${onFilterByColor ? 'cursor-pointer hover:ring-2 hover:ring-accent' : 'cursor-default'}`}
            style={{ backgroundColor: colorClass }}
            title={onFilterByColor ? 'Filter by this color' : undefined}
            disabled={!onFilterByColor}
          />
          <div className="flex-1">
            {/* Inline Name Edit */}
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-8 border-accent bg-midnight-800 text-sm text-white"
                  disabled={isSaving}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button
                  onClick={handleSaveName}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-green-400 hover:text-green-300"
                  disabled={isSaving}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onRename && setIsEditingName(true)}
                className={`text-lg font-semibold text-white text-left ${onRename ? 'cursor-pointer hover:text-accent transition-colors' : 'cursor-default'}`}
                disabled={!onRename}
              >
                {collection.name}
              </button>
            )}
            <p className="text-xs text-shadow-400" data-testid="collection-card-asset-count">
              {collection.assetType.toUpperCase()} • {assetCount} asset{assetCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Description */}
        {collection.description && (
          <p className="mb-4 text-sm text-shadow-300 line-clamp-2">{collection.description}</p>
        )}

        {/* Mode Badge */}
        {collection.mode && (
          <div className="mb-4">
            <span className="inline-block rounded-full border border-midnight-500/60 bg-midnight-600/70 px-3 py-1 text-xs uppercase tracking-wider text-shadow-400">
              {collection.mode.replace('-', ' ')}
            </span>
          </div>
        )}

        {/* Created Date */}
        <p className="mb-4 text-xs text-shadow-500">Created {new Date(collection.createdAt).toLocaleDateString()}</p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={onCreateAsset}
            className="w-full bg-accent/20 text-accent hover:bg-accent/30"
            size="sm"
            data-testid="collection-card-create-asset-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Asset
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={onView}
              variant="default"
              size="sm"
              className="flex-1 bg-midnight-600/60 text-shadow-200 hover:bg-midnight-500/60 hover:text-white"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              View Assets
            </Button>
            <Button onClick={onDelete} variant="ghost" size="sm" className="text-shadow-300 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
