/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Loader2, Search, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
import cn from '@/lib/utils';
import { gildedTokens } from '@/theme/gildedTokens';
import Input from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  EXPLORER_GET_CLASSES,
  EXPLORER_GET_DAMAGE_TYPES,
  EXPLORER_GET_EQUIPMENT,
  EXPLORER_GET_EQUIPMENT_CATEGORIES,
  EXPLORER_GET_FEATURES,
  EXPLORER_GET_LANGUAGES,
  EXPLORER_GET_MAGIC_ITEMS,
  EXPLORER_GET_MAGIC_SCHOOLS,
  EXPLORER_GET_MONSTERS,
  EXPLORER_GET_PROFICIENCIES,
  EXPLORER_GET_RACES,
  EXPLORER_GET_SPELLS,
  EXPLORER_GET_SUBCLASSES,
  EXPLORER_GET_TRAITS,
  EXPLORER_GET_WEAPON_PROPERTIES,
} from '@/models/rules/queries';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CATEGORY_CONFIG: Record<string, { query: any; dataKey: string }> = {
  classes: { query: EXPLORER_GET_CLASSES, dataKey: 'classes_connection' },
  'damage-types': { query: EXPLORER_GET_DAMAGE_TYPES, dataKey: 'damageTypes_connection' },
  equipment: { query: EXPLORER_GET_EQUIPMENT, dataKey: 'equipments_connection' },
  'equipment-categories': { query: EXPLORER_GET_EQUIPMENT_CATEGORIES, dataKey: 'equipmentCategories_connection' },
  features: { query: EXPLORER_GET_FEATURES, dataKey: 'features_connection' },
  languages: { query: EXPLORER_GET_LANGUAGES, dataKey: 'languages_connection' },
  'magic-items': { query: EXPLORER_GET_MAGIC_ITEMS, dataKey: 'magicItems_connection' },
  'magic-schools': { query: EXPLORER_GET_MAGIC_SCHOOLS, dataKey: 'magicSchools_connection' },
  monsters: { query: EXPLORER_GET_MONSTERS, dataKey: 'monsters_connection' },
  proficiencies: { query: EXPLORER_GET_PROFICIENCIES, dataKey: 'proficiencies_connection' },
  races: { query: EXPLORER_GET_RACES, dataKey: 'races_connection' },
  spells: { query: EXPLORER_GET_SPELLS, dataKey: 'spells_connection' },
  subclasses: { query: EXPLORER_GET_SUBCLASSES, dataKey: 'subclasses_connection' },
  traits: { query: EXPLORER_GET_TRAITS, dataKey: 'traits_connection' },
  'weapon-properties': { query: EXPLORER_GET_WEAPON_PROPERTIES, dataKey: 'weaponProperties_connection' },
};

interface RulesResourceListProps {
  category: string;
}

export function RulesResourceList({ category }: RulesResourceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const config = CATEGORY_CONFIG[category];

  // Heuristic for search filter based on typical fields
  const filters: Record<string, any> = {};
  if (searchTerm) {
    if (category === 'monsters' || category === 'classes' || category === 'races') {
      filters.name = { containsi: searchTerm };
    } else {
      // Generic name search
      filters.name = { containsi: searchTerm };
    }
  }

  const { data, loading, error } = useQuery(config?.query, {
    variables: {
      pagination: { page, pageSize: 12 },
      filters,
    },
    skip: !config,
  });

  if (!config) return <div className="text-red-400">Invalid Category</div>;
  if (error) return <div className="text-red-400">Error loading data: {error.message}</div>;

  const connection = data?.[config.dataKey as keyof typeof data] as any;
  const items = connection?.nodes || [];
  const pagination = connection?.pageInfo;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className={cn(gildedTokens.glassPanel, 'flex gap-4 items-center p-4')}>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aurora-500/50" />
          <Input
            placeholder={`Search ${category}...`}
            className={cn(gildedTokens.monoInput, 'pl-9')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset page on search
            }}
          />
        </div>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="icon"
          className="border-midnight-500 bg-midnight-800 text-aurora-200 hover:bg-midnight-700 hover:text-aurora-100"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item: any) => (
            <Card
              key={item.documentId || item.id}
              className={cn(
                gildedTokens.glassPanelInteractive,
                'group flex flex-col h-full overflow-hidden border-midnight-600/40 p-0'
              )}
              onClick={() => setSelectedItem(item)}
            >
              {item.image?.url ? (
                <div className="aspect-square w-full overflow-hidden bg-midnight-950 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/90 to-transparent opacity-60 z-10" />
                  <img
                    src={item.image.url}
                    alt={item.image.alternativeText || item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              ) : (
                <div className="aspect-square w-full bg-midnight-900/50 flex items-center justify-center text-midnight-700 relative">
                  <div className="absolute inset-0 border-b border-white/5" />
                  <ImageIcon className="h-16 w-16 opacity-20" />
                </div>
              )}
              <CardHeader className="p-5 relative z-20 -mt-12">
                <CardTitle className="text-xl font-display text-shadow-100 line-clamp-1 group-hover:text-aurora-300 transition-colors">
                  {item.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-sm font-sans text-shadow-300 text-aurora-100/70">
                  {item.description || item.subclass_flavor || item.note || 'No description available.'}
                  {/* Render specific fields based on category if needed */}
                  {category === 'monsters' && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <span className={cn(gildedTokens.inlineBadge, 'text-[10px] py-0.5 px-2')}>
                        CR {item.challenge_rating}
                      </span>
                      <span className={cn(gildedTokens.inlineBadge, 'text-[10px] py-0.5 px-2')}>{item.size}</span>
                      <span className={cn(gildedTokens.inlineBadge, 'text-[10px] py-0.5 px-2')}>{item.type}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && pagination && pagination.pageCount > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-slate-400 px-4">
            Page {page} of {pagination.pageCount}
          </span>
          <Button variant="outline" disabled={page >= pagination.pageCount} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent
          className={cn(
            gildedTokens.card,
            'max-w-4xl max-h-[90vh] overflow-y-auto bg-midnight-950/95 backdrop-blur-xl border-aurora-500/30 text-aurora-100'
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-3xl font-display text-gradient-gold">{selectedItem?.name}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {/* Left Column: Image & Stats */}
            <div className="space-y-6">
              <div className="rounded-lg overflow-hidden border border-aurora-500/20 shadow-2xl relative aspect-square bg-midnight-900">
                {selectedItem?.image?.url ? (
                  <img src={selectedItem.image.url} alt={selectedItem.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-midnight-800">
                    <ImageIcon className="h-24 w-24 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg pointer-events-none" />
              </div>

              {/* Dynamic Fields Compact */}
              <div className="grid grid-cols-2 gap-2">
                {selectedItem &&
                  Object.entries(selectedItem).map(([key, value]) => {
                    if (
                      [
                        '__typename',
                        'documentId',
                        'id',
                        'name',
                        'description',
                        'image',
                        'note',
                        'subclass_flavor',
                      ].includes(key)
                    )
                      return null;
                    if (typeof value === 'object') return null;
                    return (
                      <div
                        key={key}
                        className={cn(gildedTokens.glassPanel, 'p-3 rounded-xl border-midnight-600/50 flex flex-col')}
                      >
                        <span className="text-[10px] uppercase tracking-widest text-aurora-400/70 block mb-1">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium text-aurora-100 font-mono text-sm">{String(value)}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Column: Description */}
            <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:text-aurora-200 prose-p:text-shadow-300 prose-p:font-sans prose-strong:text-aurora-300">
              <div className="text-aurora-100/90 whitespace-pre-wrap leading-relaxed text-lg">
                {selectedItem?.description || selectedItem?.note || selectedItem?.subclass_flavor}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
