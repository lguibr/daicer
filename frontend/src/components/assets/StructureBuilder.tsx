import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import useAuth from '@/hooks/useAuth';
import { StructureForm } from './StructureForm';
import { StructureList } from './StructureList';

interface Structure {
  id: string;
  name: string;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  type: 'settlement' | 'dungeon' | 'landmark' | 'ruin' | 'natural' | 'other';
  description?: string;
  significance: number;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export function StructureBuilder() {
  const { t } = useI18n();
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStructure, setEditingStructure] = useState<Structure | null>(null);
  const { user } = useAuth();

  // Fetch structures
  useEffect(() => {
    if (!user?.uid) return;

    const fetchStructures = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/structures/user/${user.uid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(t('assets.structureBuilder.failedLoad'));
        }

        const data = await response.json();
        setStructures(data.data || []);
      } catch (err) {
        console.error('Error fetching structures:', err);
        setError(err instanceof Error ? err.message : t('assets.structureBuilder.failedLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchStructures();
  }, [user, t]);

  // Create structure
  const handleCreate = async (structureData: Omit<Structure, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) return;

    const token = await user.getIdToken();
    const response = await fetch('/api/structures', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(structureData),
    });

    if (!response.ok) {
      throw new Error(t('assets.structureBuilder.failedSave'));
    }

    const data = await response.json();
    setStructures((prev) => [data.data, ...prev]);
    setShowForm(false);
  };

  // Update structure
  const handleUpdate = async (structureData: Omit<Structure, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid || !editingStructure) return;

    const token = await user.getIdToken();
    const response = await fetch(`/api/structures/${editingStructure.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(structureData),
    });

    if (!response.ok) {
      throw new Error(t('assets.structureBuilder.failedSave'));
    }

    const data = await response.json();
    setStructures((prev) => prev.map((s) => (s.id === editingStructure.id ? data.data : s)));
    setEditingStructure(null);
    setShowForm(false);
  };

  // Delete structure
  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    // eslint-disable-next-line no-alert
    if (!confirm(t('assets.structureBuilder.deleteConfirm'))) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/structures/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('assets.structureBuilder.failedDelete'));
      }

      setStructures((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Error deleting structure:', err);
      setError(err instanceof Error ? err.message : t('assets.structureBuilder.failedDelete'));
    }
  };

  // Edit structure
  const handleEdit = (structure: Structure) => {
    setEditingStructure(structure);
    setShowForm(true);
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingStructure(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gilded-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-crimson-red mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>{t('assets.structureBuilder.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-ink-primary dark:text-parchment-light">
            {t('assets.structureBuilder.title')}
          </h2>
          <p className="text-sm text-ink-secondary dark:text-parchment-medium mt-1">
            {t('assets.structureBuilder.subtitle')}
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('assets.structureBuilder.createNew')}
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <StructureForm
          structure={editingStructure || undefined}
          onSave={editingStructure ? handleUpdate : handleCreate}
          onCancel={handleCancel}
        />
      )}

      {/* List */}
      {!showForm && <StructureList structures={structures} onEdit={handleEdit} onDelete={handleDelete} />}
    </div>
  );
}
