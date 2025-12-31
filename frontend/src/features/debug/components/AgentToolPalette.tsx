import { useState } from 'react';

interface AgentToolPaletteProps {
  roomId: string;
  entities?: { id: string; name: string }[];
}

type ToolDefinition = {
  name: string;
  label: string;
  fields: {
    name: string;
    type: 'text' | 'number' | 'json' | 'select';
    label: string;
    placeholder?: string;
    optionsSource?: 'entities'; // For dynamic population
    options?: string[]; // Static options
  }[];
};

const TOOLS: ToolDefinition[] = [
  {
    name: 'perform_attack',
    label: 'Perform Attack',
    fields: [
      { name: 'attackerId', type: 'select', label: 'Attacker', optionsSource: 'entities' },
      { name: 'targetId', type: 'select', label: 'Target', optionsSource: 'entities' },
      { name: 'actionName', type: 'text', label: 'Action/Weapon', placeholder: 'Longsword' },
    ],
  },
  {
    name: 'cast_spell',
    label: 'Cast Spell',
    fields: [
      { name: 'casterId', type: 'select', label: 'Caster', optionsSource: 'entities' },
      { name: 'spellId', type: 'text', label: 'Spell Name', placeholder: 'Fireball' },
      { name: 'targetId', type: 'select', label: 'Target (Optional)', optionsSource: 'entities' },
      { name: 'targetPosition', type: 'json', label: 'Target Pos (AoE)', placeholder: '{"x":0,"y":0,"z":0}' },
    ],
  },
  {
    name: 'interact_object',
    label: 'Interact Object',
    fields: [
      { name: 'actorId', type: 'select', label: 'Actor', optionsSource: 'entities' },
      { name: 'targetObjectId', type: 'text', label: 'Object ID' },
      {
        name: 'interactionType',
        type: 'select',
        label: 'Type',
        options: ['open', 'close', 'lock', 'unlock', 'toggle', 'loot'],
      },
    ],
  },
  {
    name: 'move_entity',
    label: 'Move Entity',
    fields: [
      { name: 'entityId', type: 'select', label: 'Entity', optionsSource: 'entities' },
      { name: 'path', type: 'json', label: 'Path JSON', placeholder: '[{"x":0,"y":0,"z":0}]' },
    ],
  },
  {
    name: 'spawn_entity',
    label: 'Spawn Entity',
    fields: [
      { name: 'blueprintId', type: 'text', label: 'Blueprint ID/Name' },
      { name: 'type', type: 'select', label: 'Type', options: ['monster', 'npc', 'player'] },
      { name: 'position', type: 'json', label: 'Position JSON', placeholder: '{"x":0,"y":0,"z":0}' },
    ],
  },
  {
    name: 'rolling_save', // Using registered name 'roll_save' in backend
    label: 'Roll Save',
    fields: [
      { name: 'entityId', type: 'select', label: 'Entity', optionsSource: 'entities' },
      {
        name: 'stat',
        type: 'select',
        label: 'Stat',
        options: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
      },
      { name: 'difficultyClass', type: 'number', label: 'DC' },
    ],
  },
  {
    name: 'modify_terrain',
    label: 'Modify Terrain',
    fields: [
      { name: 'roomId', type: 'text', label: 'Room ID' }, // Can auto-fill?
      {
        name: 'operations',
        type: 'json',
        label: 'Operations JSON',
        placeholder: '[{"position":{"x":0,"y":0,"z":0},"action":"place","blockType":"stone"}]',
      },
    ],
  },
  {
    name: 'long_rest',
    label: 'Long Rest',
    fields: [
      { name: 'targetIds', type: 'json', label: 'Target IDs [ ]', placeholder: '["id1", "id2"]' },
      { name: 'timeRequired', type: 'number', label: 'Hours', placeholder: '8' },
    ],
  },
];

export function AgentToolPalette({ roomId, entities = [] }: AgentToolPaletteProps) {
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | undefined>(TOOLS[0]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!selectedTool) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Parse JSON fields
      const payload: any = {};

      for (const field of selectedTool.fields) {
        const val = formData[field.name];

        // Auto-fill roomId if needed?
        // Backend handles context usually.

        if (field.type === 'json') {
          try {
            payload[field.name] = val ? JSON.parse(val) : field.placeholder ? JSON.parse(field.placeholder) : {};
          } catch (e) {
            throw new Error(`Invalid JSON for ${field.name}`);
          }
        } else if (field.type === 'number') {
          payload[field.name] = Number(val);
        } else {
          payload[field.name] = val;
        }
      }

      // Hack for rolling_save -> roll_save
      const toolName = selectedTool.name === 'rolling_save' ? 'roll_save' : selectedTool.name;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:1337'}/api/agent/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // TODO
        },
        body: JSON.stringify({
          roomId,
          toolName,
          payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Execution failed');

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFieldInput = (field: ToolDefinition['fields'][0]) => {
    if (field.type === 'select') {
      let options: { value: string; label: string }[] = [];

      if (field.optionsSource === 'entities') {
        options = [
          { value: '', label: 'Select Entity...' },
          ...entities.map((e) => ({ value: e.id, label: `${e.name} (${e.id})` })),
        ];
      } else if (field.options) {
        options = [{ value: '', label: 'Select...' }, ...field.options.map((o) => ({ value: o, label: o }))];
      }

      return (
        <select
          className="bg-black/50 border border-midnight-700 rounded p-1 text-[10px]"
          value={formData[field.name] || ''}
          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'json') {
      return (
        <textarea
          className="bg-black/50 border border-midnight-700 rounded p-1 h-16 font-mono text-[10px]"
          placeholder={field.placeholder}
          value={formData[field.name] || ''}
          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
        />
      );
    }

    return (
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        className="bg-black/50 border border-midnight-700 rounded p-1"
        placeholder={field.placeholder}
        value={formData[field.name] || ''}
        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
      />
    );
  };

  if (!selectedTool) return <div>No tools available</div>;

  return (
    <div className="flex flex-col h-full bg-midnight-950 text-white font-mono text-xs">
      {/* TOOL SELECTOR */}
      <div className="p-2 border-b border-midnight-800">
        <select
          className="w-full bg-midnight-900 border border-midnight-700 rounded p-1"
          value={selectedTool.name}
          onChange={(e) => {
            const t = TOOLS.find((x) => x.name === e.target.value);
            if (t) {
              setSelectedTool(t);
              setFormData({});
              setResult(null);
            }
          }}
        >
          {TOOLS.map((t) => (
            <option key={t.name} value={t.name}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* FORM AREA */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {selectedTool.fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1">
            <label className="text-aurora-300 font-bold">{field.label}</label>
            {renderFieldInput(field)}
          </div>
        ))}

        <button
          className="w-full bg-aurora-500 hover:bg-aurora-400 text-midnight-950 font-bold py-2 rounded shadow-lg shadow-aurora-500/20 disabled:opacity-50"
          onClick={handleExecute}
          disabled={loading}
        >
          {loading ? 'EXECUTING...' : `EXECUTE ${selectedTool.name}`}
        </button>
      </div>

      {/* RESULT LOG */}
      <div className="h-1/3 border-t border-midnight-800 bg-black p-2 overflow-y-auto">
        <div className="text-[10px] uppercase text-aurora-300 mb-1">Last Result</div>
        {error && <div className="text-red-500">{error}</div>}
        {result && (
          <pre className="text-[10px] text-green-400 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
