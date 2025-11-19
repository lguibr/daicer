import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Structure {
  id?: string;
  name: string;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  type: 'settlement' | 'dungeon' | 'landmark' | 'ruin' | 'natural' | 'other';
  description?: string;
  significance: number;
}

interface StructureFormProps {
  structure?: Structure;
  onSave: (structure: Omit<Structure, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export function StructureForm({ structure, onSave, onCancel }: StructureFormProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Omit<Structure, 'id'>>({
    name: structure?.name || '',
    size: structure?.size || 'medium',
    type: structure?.type || 'landmark',
    description: structure?.description || '',
    significance: structure?.significance || 5,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSave(formData);
    } catch (err) {
      console.error('Error saving structure:', err);
      setError(err instanceof Error ? err.message : t('assets.structureBuilder.failedSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-xl font-serif font-bold text-ink-primary dark:text-parchment-light mb-4">
          {structure ? t('assets.structureBuilder.form.titleEdit') : t('assets.structureBuilder.form.titleCreate')}
        </h3>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-ink-secondary dark:text-parchment-medium mb-1">
            {t('assets.structureBuilder.form.nameRequired')}
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('assets.structureBuilder.form.namePlaceholder')}
            required
            maxLength={100}
          />
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-semibold text-ink-secondary dark:text-parchment-medium mb-1">
            {t('assets.structureBuilder.form.sizeRequired')}
          </label>
          <select
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value as Structure['size'] })}
            className="w-full px-3 py-2 bg-parchment-light dark:bg-obsidian-dark border border-parchment-dark/30 dark:border-obsidian-light/30 rounded text-ink-primary dark:text-parchment-light focus:outline-none focus:ring-2 focus:ring-gilded-gold"
            required
          >
            <option value="tiny">{t('assets.structureBuilder.form.sizes.tiny')}</option>
            <option value="small">{t('assets.structureBuilder.form.sizes.small')}</option>
            <option value="medium">{t('assets.structureBuilder.form.sizes.medium')}</option>
            <option value="large">{t('assets.structureBuilder.form.sizes.large')}</option>
            <option value="huge">{t('assets.structureBuilder.form.sizes.huge')}</option>
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold text-ink-secondary dark:text-parchment-medium mb-1">
            {t('assets.structureBuilder.form.typeRequired')}
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Structure['type'] })}
            className="w-full px-3 py-2 bg-parchment-light dark:bg-obsidian-dark border border-parchment-dark/30 dark:border-obsidian-light/30 rounded text-ink-primary dark:text-parchment-light focus:outline-none focus:ring-2 focus:ring-gilded-gold"
            required
          >
            <option value="settlement">{t('assets.structureBuilder.form.types.settlement')}</option>
            <option value="dungeon">{t('assets.structureBuilder.form.types.dungeon')}</option>
            <option value="landmark">{t('assets.structureBuilder.form.types.landmark')}</option>
            <option value="ruin">{t('assets.structureBuilder.form.types.ruin')}</option>
            <option value="natural">{t('assets.structureBuilder.form.types.natural')}</option>
            <option value="other">{t('assets.structureBuilder.form.types.other')}</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-ink-secondary dark:text-parchment-medium mb-1">
            {t('assets.structureBuilder.form.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('assets.structureBuilder.form.descriptionPlaceholder')}
            rows={4}
            maxLength={1000}
            className="w-full px-3 py-2 bg-parchment-light dark:bg-obsidian-dark border border-parchment-dark/30 dark:border-obsidian-light/30 rounded text-ink-primary dark:text-parchment-light focus:outline-none focus:ring-2 focus:ring-gilded-gold resize-none"
          />
          <p className="text-xs text-ink-tertiary dark:text-parchment-dark mt-1">
            {t('assets.structureBuilder.form.charactersCount', { count: formData.description?.length || 0 })}
          </p>
        </div>

        {/* Significance */}
        <div>
          <label className="block text-sm font-semibold text-ink-secondary dark:text-parchment-medium mb-1">
            {t('assets.structureBuilder.form.significanceLabel', { value: formData.significance })}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.significance}
            onChange={(e) => setFormData({ ...formData, significance: parseInt(e.target.value, 10) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-ink-tertiary dark:text-parchment-dark mt-1">
            <span>{t('assets.structureBuilder.form.minorLabel')}</span>
            <span>{t('assets.structureBuilder.form.majorLabel')}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && <p className="text-sm text-crimson-red">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            {t('assets.structureBuilder.form.cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? t('assets.structureBuilder.form.saving')
              : structure
                ? t('assets.structureBuilder.form.update')
                : t('assets.structureBuilder.form.create')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
