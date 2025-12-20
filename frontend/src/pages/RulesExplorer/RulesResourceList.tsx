/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
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
import { Loader2, Search, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
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
      <div className="flex gap-4 items-center bg-slate-900/50 p-4 rounded-lg border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={`Search ${category}...`}
            className="pl-9 bg-slate-950 border-slate-800"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset page on search
            }}
          />
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item: any) => (
            <Card
              key={item.documentId || item.id}
              className="bg-slate-900 border-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer group flex flex-col h-full"
              onClick={() => setSelectedItem(item)}
            >
              {item.image?.url ? (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-slate-950">
                  <img
                    src={item.image.url}
                    alt={item.image.alternativeText || item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-slate-950 flex items-center justify-center rounded-t-lg text-slate-800">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
              <CardHeader className="p-4">
                <CardTitle className="text-lg line-clamp-1 group-hover:text-indigo-400 transition-colors">
                  {item.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs">
                  {item.description || item.subclass_flavor || item.note || 'No description available.'}
                  {/* Render specific fields based on category if needed */}
                  {category === 'monsters' && (
                    <div className="mt-2 flex gap-2">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">
                        CR {item.challenge_rating}
                      </span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">{item.size}</span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">{item.type}</span>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-indigo-400">{selectedItem?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {selectedItem?.image?.url && (
              <div className="rounded-lg overflow-hidden border border-slate-800">
                <img src={selectedItem.image.url} alt={selectedItem.name} className="w-full h-64 object-cover" />
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              {/* Description */}
              <div className="text-slate-300 whitespace-pre-wrap">
                {selectedItem?.description || selectedItem?.note || selectedItem?.subclass_flavor}
              </div>

              {/* Dynamic Fields */}
              <div className="grid grid-cols-2 gap-4 mt-6">
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
                    if (typeof value === 'object') return null; // Skip complex objects for now
                    return (
                      <div key={key} className="bg-slate-950 p-3 rounded border border-slate-800">
                        <span className="text-xs uppercase text-slate-500 block mb-1">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-slate-200">{String(value)}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
