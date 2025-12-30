import { useState } from 'react';

interface AgentToolPaletteProps {
  roomId: string;
}

type ToolDefinition = {
  name: string;
  label: string;
  fields: { name: string; type: 'text' | 'number' | 'json'; label: string; placeholder?: string }[];
};

const TOOLS: ToolDefinition[] = [
  {
    name: 'perform_attack',
    label: 'Perform Attack',
    fields: [
      { name: 'attackerId', type: 'text', label: 'Attacker ID' },
      { name: 'targetId', type: 'text', label: 'Target ID' },
      { name: 'actionName', type: 'text', label: 'Action/Weapon', placeholder: 'Longsword' },
    ],
  },
  {
    name: 'move_entity',
    label: 'Move Entity',
    fields: [
      { name: 'entityId', type: 'text', label: 'Entity ID' },
      { name: 'path', type: 'json', label: 'Path JSON', placeholder: '[{"x":0,"y":0,"z":0}]' },
    ],
  },
  {
    name: 'spawn_entity',
    label: 'Spawn Entity',
    fields: [
      { name: 'blueprintId', type: 'text', label: 'Blueprint ID' },
      { name: 'type', type: 'text', label: 'Type (monster/npc)' },
      { name: 'position', type: 'json', label: 'Position JSON', placeholder: '{"x":0,"y":0,"z":0}' },
    ],
  },
  {
    name: 'roll_save',
    label: 'Roll Save',
    fields: [
      { name: 'entityId', type: 'text', label: 'Entity ID' },
      { name: 'stat', type: 'text', label: 'Stat', placeholder: 'dexterity' },
      { name: 'difficultyClass', type: 'number', label: 'DC' },
    ],
  },
];

export function AgentToolPalette({ roomId }: AgentToolPaletteProps) {
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

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:1337'}/api/agent/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // TODO: Add auth
        },
        body: JSON.stringify({
          roomId,
          toolName: selectedTool.name,
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
            {field.type === 'json' ? (
              <textarea
                className="bg-black/50 border border-midnight-700 rounded p-1 h-16 font-mono text-[10px]"
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              />
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                className="bg-black/50 border border-midnight-700 rounded p-1"
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              />
            )}
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
