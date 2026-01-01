import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useEntitySearch } from '@/hooks/useEntitySearch';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TOOLS, ToolDefinition, ToolField } from '@/features/debug/utils/tool-definitions';

interface ChatActionToolbarProps {
  onCommandSelect: (cmd: { prefix: string; id: string; name: string; label: string }) => void;
  activeEntity?: { id: string; name: string };
  activeLocation?: { x: number; y: number; z: number; label: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roomEntities?: any[];
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export function ChatActionToolbar({
  onCommandSelect,
  activeEntity,
  activeLocation,
  roomEntities = [],
  disabled,
  orientation = 'horizontal',
}: ChatActionToolbarProps) {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  // Form State: Record<FieldName, Value>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Search State
  const [activeSearchField, setActiveSearchField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { search, results, loading } = useEntitySearch();

  const selectedTool = TOOLS.find((t) => t.id === selectedToolId);

  // Auto-fill activeLocation into Position fields OR individual x,y,z fields
  useEffect(() => {
    if (selectedTool && activeLocation) {
      setFormData((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: Record<string, any> = { ...prev };

        // 1. JSON Position Field
        const posField = selectedTool.fields.find((f) => f.type === 'position');
        if (posField) {
          updates[posField.name] = JSON.stringify({ x: activeLocation.x, y: activeLocation.y, z: activeLocation.z });
        }

        // 2. Individual Coordinate Fields
        // Check if tool has x, y, and z fields
        const hasX = selectedTool.fields.some((f) => f.name === 'x');
        const hasY = selectedTool.fields.some((f) => f.name === 'y');
        const hasZ = selectedTool.fields.some((f) => f.name === 'z');

        if (hasX) updates['x'] = activeLocation.x.toString();
        if (hasY) updates['y'] = activeLocation.y.toString();
        if (hasZ) updates['z'] = activeLocation.z.toString();

        // 3. Path Field (Move Tool)
        // If tool has a 'path' field, we assume it's for movement and set a single step path to the target.
        const pathField = selectedTool.fields.find((f) => f.name === 'path' && f.type === 'json');
        if (pathField) {
          // We create a single-step path to the clicked location
          updates[pathField.name] = JSON.stringify([{ x: activeLocation.x, y: activeLocation.y, z: activeLocation.z }]);
        }

        return updates;
      });
    }
  }, [activeLocation, selectedTool]);

  // Auto-fill activeEntity into relevant fields or override defaults
  useEffect(() => {
    if (selectedTool && activeEntity) {
      // If the field is room_entity and we have an activeEntity, fill it?
      // Heuristic: If there is a field named 'attackerId', 'casterId', 'actorId', 'entityId'
      // and it is empty, fill it.
      const actorFields = ['attackerId', 'casterId', 'actorId', 'entityId'];
      const fieldToFill = selectedTool.fields.find((f) => actorFields.includes(f.name));

      if (fieldToFill) {
        setFormData((prev) => {
          if (!prev[fieldToFill.name]) {
            return { ...prev, [fieldToFill.name]: activeEntity.id };
          }
          return prev;
        });
      }
    }
  }, [activeEntity, selectedTool]);

  // Trigger search when activeSearchField changes or query changes
  useEffect(() => {
    if (activeSearchField && selectedTool) {
      const field = selectedTool.fields.find((f) => f.name === activeSearchField);
      if (field?.type === 'entity_search') {
        let type = field.searchType || 'monster';

        // Handle Dependent Search Types (e.g. spawn type -> monster vs character)
        if (field.dependency) {
          const dependentValue = formData[field.dependency.field];
          if (dependentValue && field.dependency.map[dependentValue]) {
            type = field.dependency.map[dependentValue];
          }
        }

        search(searchQuery, type);
      }
    }
  }, [searchQuery, activeSearchField, selectedTool, search, formData]);

  const handleToolClick = (tool: ToolDefinition) => {
    if (selectedToolId === tool.id) {
      setSelectedToolId(null);
      setFormData({});
      setActiveSearchField(null);
    } else {
      setSelectedToolId(tool.id);
      setFormData({});
      setActiveSearchField(null);
    }
  };

  const handleExecute = () => {
    if (!selectedTool) return;

    const args = selectedTool.fields
      .map((field) => {
        const rawVal = formData[field.name];
        if (rawVal === undefined || rawVal === '') return null; // Skip empty optional

        // Formatting
        if (field.type === 'number') {
          return `${field.name}=${rawVal}`;
        } else if (field.type === 'json' || field.type === 'position') {
          return `${field.name}='${rawVal}'`;
        } else {
          // Text, Select, Entity Search (returns ID), Room Entity (returns ID)
          return `${field.name}="${rawVal}"`;
        }
      })
      .filter(Boolean)
      .join(', ');

    const fullCommand = `${selectedTool.actionPrefix}(${args})`;

    onCommandSelect({
      prefix: fullCommand,
      id: 'manual',
      name: selectedTool.label,
      label: selectedTool.label,
    });
  };

  const renderField = (field: ToolField) => {
    const val = formData[field.name] || '';

    // 1. Room Entity Dropdown (Local Instances)
    if (field.type === 'room_entity') {
      return (
        <select
          className="w-full h-8 bg-black/40 border border-midnight-700 rounded text-xs text-aurora-100 px-2"
          value={val}
          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
        >
          <option value="">Select Entity...</option>
          {roomEntities?.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name || entity.id} ({entity.type})
            </option>
          ))}
        </select>
      );
    }

    // 2. Library Search (Monsters, Spells, Characters)
    if (field.type === 'entity_search') {
      const isSearching = activeSearchField === field.name;

      return (
        <div className="relative z-20">
          <div className="relative">
            <Input
              placeholder={field.placeholder || `Search ${field.label}...`}
              value={isSearching ? searchQuery : val}
              onFocus={() => {
                setActiveSearchField(field.name);
                setSearchQuery(val);
                if (val) setSearchQuery('');
              }}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 bg-black/40 border-midnight-700 text-xs text-aurora-100 placeholder:text-midnight-500 focus-visible:ring-aurora-500/50"
            />
            {loading && isSearching && (
              <div className="absolute right-2 top-2 w-3 h-3 border-2 border-t-transparent border-aurora-500 rounded-full animate-spin" />
            )}
          </div>

          {isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-midnight-900 border border-midnight-700 rounded-md shadow-xl z-50 max-h-48 overflow-y-auto">
              {results.length > 0 ? (
                results.map((res) => (
                  <button
                    key={res.id}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-aurora-500/20 hover:text-white text-aurora-200 flex flex-col"
                    onClick={() => {
                      setFormData({ ...formData, [field.name]: res.id });
                      setActiveSearchField(null);
                      setSearchQuery('');
                    }}
                  >
                    <span className="font-bold">{res.name}</span>
                    <span className="text-[10px] opacity-60">{res.type}</span>
                  </button>
                ))
              ) : (
                <div className="p-2 text-xs text-midnight-500 text-center">
                  {searchQuery ? 'No results' : 'Type to search...'}
                </div>
              )}
              <button
                className="w-full text-center py-1 text-[10px] text-red-400 hover:bg-red-500/10 border-t border-midnight-800"
                onClick={() => setActiveSearchField(null)}
              >
                Close
              </button>
            </div>
          )}
          {!isSearching && val && (
            <div className="text-[10px] text-green-400 mt-0.5 truncate flex justify-between items-center group">
              <span>Selected: {val}</span>
              <X
                className="w-3 h-3 cursor-pointer opacity-0 group-hover:opacity-100 text-red-400"
                onClick={() => setFormData({ ...formData, [field.name]: '' })}
              />
            </div>
          )}
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <select
          className="w-full h-8 bg-black/40 border border-midnight-700 rounded text-xs text-aurora-100 px-2"
          value={val}
          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'json' || field.type === 'position') {
      return (
        <textarea
          className="w-full h-12 bg-black/40 border border-midnight-700 rounded text-[10px] font-mono p-2 text-aurora-200"
          placeholder={field.placeholder || (field.type === 'position' ? '{"x":0,"y":0,"z":0}' : '{}')}
          value={val}
          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
        />
      );
    }

    return (
      <Input
        type={field.type === 'number' ? 'number' : 'text'}
        placeholder={field.placeholder}
        value={val}
        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
        className="h-8 bg-black/40 border-midnight-700 text-xs text-aurora-100"
      />
    );
  };

  return (
    <div className={cn('flex gap-2 w-full', orientation === 'vertical' ? 'flex-col h-full' : 'flex-col')}>
      <div
        className={cn(
          'flex gap-1 p-1 py-1 no-scrollbar shrink-0',
          orientation === 'horizontal'
            ? 'items-center overflow-x-auto mask-gradient-x'
            : 'flex-col overflow-y-auto max-h-[40%] border-b border-midnight-800'
        )}
      >
        {TOOLS.map((tool) => (
          <Button
            key={tool.id}
            variant={selectedToolId === tool.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleToolClick(tool)}
            disabled={disabled}
            className={cn(
              'text-xs font-medium transition-all gap-2 shrink-0 border border-transparent justify-start px-3',
              orientation === 'horizontal' ? 'h-8' : 'h-9 w-full',
              selectedToolId === tool.id
                ? 'bg-aurora-600 text-white shadow-lg shadow-aurora-900/20 border-aurora-500/50'
                : 'text-aurora-200 hover:text-white hover:bg-midnight-800'
            )}
          >
            {tool.icon}
            <span className="truncate">{tool.label}</span>
          </Button>
        ))}
      </div>

      {selectedTool ? (
        <div className="flex-1 flex flex-col min-h-0 bg-midnight-900/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-midnight-800 flex items-center justify-between shrink-0 bg-black/20">
            <div className="flex items-center gap-2 text-aurora-400 font-bold text-xs uppercase">
              {selectedTool.icon}
              {selectedTool.label}
            </div>
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3 pb-4">
              {selectedTool.description && (
                <p className="text-[10px] text-midnight-400 italic mb-2">{selectedTool.description}</p>
              )}

              {selectedTool.fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-aurora-500/80 tracking-wider">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-midnight-800 bg-black/20 shrink-0">
            <Button
              className="w-full bg-aurora-600 hover:bg-aurora-500 text-white font-bold tracking-wider shadow-lg shadow-aurora-500/20"
              onClick={handleExecute}
            >
              EXECUTE
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-midnight-600 text-xs italic">
          Select a tool to configure
        </div>
      )}
    </div>
  );
}
