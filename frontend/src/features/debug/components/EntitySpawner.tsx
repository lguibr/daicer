import { useQuery } from '@apollo/client/react';
import { Loader2, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { LIST_CHARACTERS_QUERY, LIST_MONSTERS_QUERY } from '@/graphql/queries';
import type { ListCharactersQuery, ListMonstersQuery } from '@/gql/graphql';

interface EntitySpawnerProps {
  onSelectEntity: (type: 'character' | 'monster', entity: any) => void;
  selectedEntity: { type: 'character' | 'monster'; id: string } | null;
}

export function EntitySpawner({ onSelectEntity, selectedEntity }: EntitySpawnerProps) {
  const { data: charData, loading: charLoading } = useQuery<ListCharactersQuery>(LIST_CHARACTERS_QUERY);
  const { data: monsterData, loading: monsterLoading } = useQuery<ListMonstersQuery>(LIST_MONSTERS_QUERY);

  const characters = charData?.characters || [];
  const monsters = monsterData?.monsters || [];

  return (
    <div className="flex flex-col h-full bg-background border-l">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-2">Spawner</h3>
        <p className="text-xs text-muted-foreground">Select an entity to place on the map.</p>
      </div>

      <Tabs defaultValue="monsters" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="monsters" className="flex-1">
              Monsters
            </TabsTrigger>
            <TabsTrigger value="characters" className="flex-1">
              Characters
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monsters" className="flex-1 min-h-0 flex flex-col p-4 pb-0">
          {monsterLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Command className="border rounded-md h-full flex flex-col">
              <CommandInput placeholder="Search monsters..." className="bg-transparent" />
              <CommandList className="max-h-[500px] overflow-y-auto">
                <CommandEmpty>No monsters found.</CommandEmpty>
                <CommandGroup heading="Monsters">
                  {monsters.map((m) =>
                    m ? (
                      <CommandItem
                        key={m.documentId}
                        value={`${m.name} ${m.type}`}
                        onSelect={() => onSelectEntity('monster', { ...m, id: m.documentId })}
                        className="flex justify-between items-center cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span>{m.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {m.type} (CR {m.challenge_rating})
                          </span>
                        </div>
                        {selectedEntity?.id === m.documentId && <Check className="h-4 w-4 text-green-500" />}
                      </CommandItem>
                    ) : null
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </TabsContent>

        <TabsContent value="characters" className="flex-1 min-h-0 flex flex-col p-4 pb-0">
          {charLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Command className="border rounded-md h-full flex flex-col">
              <CommandInput placeholder="Search characters..." className="bg-transparent" />
              <CommandList className="max-h-[500px] overflow-y-auto">
                <CommandEmpty>No characters found.</CommandEmpty>
                <CommandGroup heading="Characters">
                  {characters.map((c) =>
                    c ? (
                      <CommandItem
                        key={c.documentId}
                        value={`${c.name} ${c.race?.name} ${c.class?.name}`}
                        onSelect={() => onSelectEntity('character', { ...c, id: c.documentId })}
                        className="flex justify-between items-center cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span>{c.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {c.race?.name} {c.class?.name}
                          </span>
                        </div>
                        {selectedEntity?.id === c.documentId && <Check className="h-4 w-4 text-green-500" />}
                      </CommandItem>
                    ) : null
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
