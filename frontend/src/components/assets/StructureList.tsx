import { Edit, Trash2, Building2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StructureThumbnail } from './StructurePreview';

interface Structure {
  id: string;
  name: string;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  type: 'settlement' | 'dungeon' | 'landmark' | 'ruin' | 'natural' | 'other';
  description?: string;
  significance: number;
  createdAt: number;
  updatedAt: number;
}

interface StructureListProps {
  structures: Structure[];
  onEdit: (structure: Structure) => void;
  onDelete: (id: string) => void;
}

const SIZE_LABELS_KEY = 'assets.structureBuilder.form.sizes';
const TYPE_LABELS_KEY = 'assets.structureBuilder.form.types';

const TYPE_ICONS: Record<Structure['type'], string> = {
  settlement: '🏰',
  dungeon: '🗝️',
  landmark: '🗿',
  ruin: '🏛️',
  natural: '🏔️',
  other: '📍',
};

export function StructureList({ structures, onEdit, onDelete }: StructureListProps) {
  const { t } = useI18n();

  if (structures.length === 0) {
    return (
      <div className="text-center p-12 border-2 border-dashed border-parchment-dark/30 dark:border-obsidian-light/30 rounded-lg">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-ink-tertiary dark:text-parchment-dark" />
        <p className="text-ink-secondary dark:text-parchment-medium">{t('assets.structureBuilder.empty')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {structures.map((structure) => (
        <Card key={structure.id} className="p-4 hover:shadow-lg transition-shadow">
          <div className="space-y-3">
            {/* 3D Preview */}
            <div className="flex justify-center">
              <StructureThumbnail structure={structure} />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{TYPE_ICONS[structure.type]}</span>
                <div>
                  <h3 className="font-serif font-bold text-lg text-ink-primary dark:text-parchment-light">
                    {structure.name}
                  </h3>
                  <p className="text-xs text-ink-tertiary dark:text-parchment-dark">
                    {t(`${TYPE_LABELS_KEY}.${structure.type}`)} • {t(`${SIZE_LABELS_KEY}.${structure.size}`)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(structure)}
                  className="h-8 w-8 p-0"
                  title={t('assets.structureBuilder.list.edit')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(structure.id)}
                  className="h-8 w-8 p-0 text-crimson-red hover:text-crimson-red"
                  title={t('assets.structureBuilder.list.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Description */}
            {structure.description && (
              <p className="text-sm text-ink-secondary dark:text-parchment-medium line-clamp-3">
                {structure.description}
              </p>
            )}

            {/* Significance */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-ink-tertiary dark:text-parchment-dark">
                  {t('assets.structureBuilder.list.significance')}
                </span>
                <span className="font-semibold text-ink-primary dark:text-parchment-light">
                  {structure.significance}/10
                </span>
              </div>
              <div className="w-full h-2 bg-parchment-medium/20 dark:bg-obsidian-light/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gilded-gold transition-all"
                  style={{ width: `${(structure.significance / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
