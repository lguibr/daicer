import { useState } from 'react';
import { MapPin, Skull, User, Sparkles, Hand, Dice5 } from 'lucide-react';
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  entities?: any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeEntity?: any;
}

export function GodModePalette(props: GodModePaletteProps) {
  const { onAction, onSearch, searchResults = [], isLoading = false, entities = [], activeEntity } = props;
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
      placeholder: 'Search templates...',
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
      placeholder: 'Select active entity...',
      type: 'room_entity',
    },
    {
      label: 'Interact',
      icon: <Hand className="w-4 h-4 mr-2" />,
      actionPrefix: 'interact_object',
      placeholder: 'Object ID...',
      type: 'none',
    },

    {
      label: 'Roll Save',
      icon: <Dice5 className="w-4 h-4 mr-2" />,
      actionPrefix: 'roll_save',
      placeholder: 'Stat...',
      type: 'none',
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
          entities={entities}
          activeEntity={activeEntity}
          onCommandSelect={props.onCommandSelect}
        />
      ))}
    </div>
  );
}

function ToolDropdown(props: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool: any;
  onAction: (a: string) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSearch: (q: string, t: any) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchResults: any[];
  isLoading: boolean;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCommandSelect?: (cmd: any) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  entities?: any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeEntity?: any;
}) {
  const { tool, onAction, onSearch, searchResults, isLoading, entities = [], activeEntity } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  // Trigger default search on open
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      if (tool.type === 'room_entity') {
        // Local filter, no API call
      } else {
        // Fetch defaults
        onSearch('', tool.type);
      }
      setSearchTerm('');
    }
  };

  // Determine items to display
  let items = searchResults;
  if (tool.type === 'room_entity') {
    items = entities
      .filter((e) => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.includes(searchTerm))
      .map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        description: `${e.type} at ${e.position.x},${e.position.y},${e.position.z}`,
      }));
  }

  // Override isLoading for local
  const showLoading = tool.type === 'room_entity' ? false : isLoading;

  if (tool.type === 'none') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-midnight-800 border-midnight-600 hover:bg-midnight-700 text-shadow-200"
        onClick={() => {
          // Direct action trigger
          const prefix = tool.actionPrefix;
          if (props.onCommandSelect) {
            props.onCommandSelect({
              prefix,
              id: 'manual', // No ID
              name: tool.label, // Use Label as Name
              label: tool.label,
            });
          } else {
            onAction(prefix);
          }
        }}
      >
        {tool.icon}
        {tool.label}
      </Button>
    );
  }

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
          {showLoading ? (
            <div className="flex items-center justify-center p-4 text-xs text-midnight-400">
              <span className="animate-pulse">Loading...</span>
            </div>
          ) : items && items.length > 0 ? (
            items.map((result) => (
              <DropdownMenuItem
                key={result.id}
                onClick={() => {
                  // Check if parent provided structured handler
                  // Check if parent provided structured handler
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
                      const caster = activeEntity ? activeEntity.id : 'DM';
                      prefix = `cast_spell(spellId="${result.id}", casterId="${caster}")`;
                    } else {
                      // move_entity or others usually take @Name or id.
                      // For move_entity we really want an active entity ID, not a template ID.
                      // But GodModePalette currently searches templates.
                      // For now, let's keep move_entity logic generic or user will fix later.
                      prefix = `${tool.actionPrefix} @${result.name}`;
                    }

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
                    const caster = activeEntity ? activeEntity.id : 'DM';
                    onAction(`cast_spell(spellId="${result.id}", casterId="${caster}")`);
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
