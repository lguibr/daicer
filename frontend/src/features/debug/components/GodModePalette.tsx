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
  onCommandSelect?: (cmd: { prefix: string; id: string; name: string; label: string }) => void;
}

export function GodModePalette(props: GodModePaletteProps) {
  const { onAction, onSearch, searchResults = [], isLoading = false } = props;
  const tools = [
    {
      label: 'Summon Monster',
      icon: <Skull className="w-4 h-4 mr-2" />,
      actionPrefix: 'summon_monster',
      placeholder: 'Search monsters...',
      type: 'monster',
    },
    {
      label: 'Summon Character',
      icon: <User className="w-4 h-4 mr-2" />,
      actionPrefix: 'summon_character',
      placeholder: 'Search characters...',
      type: 'character',
    },
    {
      label: 'Cast Spell',
      icon: <Sparkles className="w-4 h-4 mr-2" />,
      actionPrefix: 'cast_spell',
      placeholder: 'Search spells...',
      type: 'spell',
    },
    {
      label: 'Move Entity',
      icon: <MapPin className="w-4 h-4 mr-2" />,
      actionPrefix: 'move_entity',
      placeholder: 'Select entity...',
      type: 'character', // Reuse character/monster search or a room-entity-list logic
    },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-midnight-900/90 rounded-lg border border-midnight-700/50 backdrop-blur-sm">
      {tools.map((tool) => (
        <ToolDropdown
          key={tool.label}
          tool={tool}
          onAction={onAction}
          onSearch={onSearch}
          searchResults={searchResults}
          isLoading={isLoading}
          // @ts-ignore
          onCommandSelect={props.onCommandSelect}
        />
      ))}
    </div>
  );
}

function ToolDropdown(props: {
  tool: any;
  onAction: (a: string) => void;
  onSearch: (q: string, t: any) => void;
  searchResults: any[];
  isLoading: boolean;
  onCommandSelect?: (cmd: any) => void;
}) {
  const { tool, onAction, onSearch, searchResults, isLoading } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  // Trigger default search on open
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Fetch defaults
      onSearch('', tool.type);
      setSearchTerm('');
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-midnight-800 border-midnight-600 hover:bg-midnight-700 text-shadow-200"
        >
          {tool.icon}
          {tool.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 bg-midnight-900 border-midnight-700 max-h-[400px] flex flex-col"
        onInteractOutside={() => {
          // Optional: Prevent closing if interacting with something specific, but default is usually fine
        }}
      >
        <div className="p-2 border-b border-midnight-800 shrink-0">
          <Input
            autoFocus
            placeholder={tool.placeholder}
            className="h-9 bg-midnight-950 border-midnight-800 text-sm"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = e.target.value;
              setSearchTerm(val);
              onSearch(val, tool.type);
            }}
            // Prevent dropdown from capturing arrow keys for navigation immediately if we want to type
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[100px] p-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-xs text-midnight-400">
              <span className="animate-pulse">Loading...</span>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((result) => (
              <DropdownMenuItem
                key={result.id}
                onClick={() => {
                  // Check if parent provided structured handler
                  // Check if parent provided structured handler
                  // @ts-ignore
                  if (props.onCommandSelect) {
                    let prefix = '';
                    // Logic updated for strict tools:
                    // summon_monster(templateId=...)
                    // summon_character(templateId=...)
                    // cast_spell(id=...)

                    if (tool.actionPrefix === 'summon_monster') {
                      prefix = `summon_monster(templateId="${result.id}")`; // Use templateId
                    } else if (tool.actionPrefix === 'summon_character') {
                      prefix = `summon_character(templateId="${result.id}")`; // Use templateId
                    } else if (tool.actionPrefix === 'cast_spell') {
                      prefix = `cast_spell(id="${result.id}")`;
                    } else {
                      // move_entity or others usually take @Name or id.
                      // For move_entity we really want an active entity ID, not a template ID.
                      // But GodModePalette currently searches templates.
                      // For now, let's keep move_entity logic generic or user will fix later.
                      prefix = `${tool.actionPrefix} @${result.name}`;
                    }

                    // @ts-ignore
                    props.onCommandSelect({
                      prefix,
                      id: result.id,
                      name: result.name,
                      label: tool.label,
                    });
                    setIsOpen(false);
                    return;
                  }

                  // Fallback for legacy string action
                  if (tool.actionPrefix === 'summon_monster') {
                    onAction(`summon_monster(templateId="${result.id}")`);
                  } else if (tool.actionPrefix === 'summon_character') {
                    onAction(`summon_character(templateId="${result.id}")`);
                  } else if (tool.actionPrefix === 'cast_spell') {
                    onAction(`cast_spell(id="${result.id}")`);
                  } else {
                    onAction(`${tool.actionPrefix} @${result.name}`);
                  }
                  setIsOpen(false);
                }}
                className="flex flex-col items-start cursor-pointer py-2 px-2 hover:bg-midnight-800 focus:bg-midnight-800 rounded-md"
              >
                <div className="font-medium text-aurora-200 text-sm">{result.name}</div>
                {result.description && (
                  <div className="text-[10px] text-midnight-400 line-clamp-2 leading-tight">{result.description}</div>
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="text-xs text-midnight-500 p-4 text-center">
              {searchTerm ? 'No results found' : 'Start typing to search...'}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
