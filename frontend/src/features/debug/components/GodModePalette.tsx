import { useState } from 'react';
import { MapPin, Skull, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Input from '@/components/ui/input';

interface GodModePaletteProps {
  onAction: (action: string) => void;
  onSearch: (query: string, type: 'monster' | 'spell' | 'character') => void;
  searchResults?: { id: string; name: string; type: string; description?: string }[];
  isLoading?: boolean;
}

export function GodModePalette({ onAction, onSearch, searchResults = [], isLoading = false }: GodModePaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Example predefined lists - in a real implementation these would come from the hook
  const tools = [
    {
      label: 'Summon Monster',
      icon: <Skull className="w-4 h-4 mr-2" />,
      actionPrefix: 'summon_entity',
      placeholder: 'Search monsters...',
    },
    {
      label: 'Summon Character',
      icon: <User className="w-4 h-4 mr-2" />,
      actionPrefix: 'summon_entity',
      placeholder: 'Search characters...',
    },
    {
      label: 'Cast Spell',
      icon: <Sparkles className="w-4 h-4 mr-2" />,
      actionPrefix: 'cast_spell',
      placeholder: 'Search spells...',
    },
    {
      label: 'Move Entity',
      icon: <MapPin className="w-4 h-4 mr-2" />,
      actionPrefix: 'move_entity',
      placeholder: 'Select entity...',
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-midnight-900/90 rounded-lg border border-midnight-700/50 backdrop-blur-sm">
      {tools.map((tool) => (
        <DropdownMenu key={tool.label}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-midnight-800 border-midnight-600 hover:bg-midnight-700">
              {tool.icon}
              {tool.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-midnight-900 border-midnight-700">
            <div className="p-2">
              <Input
                placeholder={tool.placeholder}
                className="h-8 bg-midnight-950 border-midnight-800"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  onSearch(e.target.value, 'monster');
                }}
              />
            </div>
            {/* Results */}
            {isOpen && (
              <div className="max-h-60 overflow-y-auto mt-2 space-y-1">
                {isLoading ? (
                  <div className="text-xs text-midnight-400 p-2">Searching...</div>
                ) : searchResults && searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <DropdownMenuItem
                      key={result.id}
                      onClick={() => {
                        // Construct precise tool call
                        if (tool.actionPrefix === 'summon_entity') {
                          onAction(`summon_entity(id="${result.id}")`); // Use ID!
                        } else if (tool.actionPrefix === 'cast_spell') {
                          onAction(`cast_spell(id="${result.id}")`);
                        } else {
                          onAction(`${tool.actionPrefix} @${result.name}`); // Fallback
                        }
                        setIsOpen(false);
                      }}
                      className="flex flex-col items-start cursor-pointer"
                    >
                      <span className="font-medium">{result.name}</span>
                      {result.description && <span className="text-xs text-midnight-400">{result.description}</span>}
                    </DropdownMenuItem>
                  ))
                ) : (
                  searchTerm && <div className="text-xs text-midnight-500 p-2">No results found</div>
                )}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}
