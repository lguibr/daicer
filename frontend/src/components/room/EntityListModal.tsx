import { useState } from 'react';
import { X, Plus, Search, Skull, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import Input from '../ui/input';
import Label from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import type { Creature, CharacterSheet } from '../../types/shared';
import { apiRequest } from '../../services/api';

interface EntityListModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatures: Creature[];
  players?: any[]; // Pass players if we want to show them too
  roomId: string;
}

export function EntityListModal({ isOpen, onClose, creatures, players = [], roomId }: EntityListModalProps) {
  const [selectedEntity, setSelectedEntity] = useState<Creature | any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCreature, setNewCreature] = useState({
    type: 'npc', // or 'monster'
    name: '',
    race: '',
    class: '',
    level: 1,
    monsterId: '',
    cr: 0.25,
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddCreature = async () => {
    try {
      setLoading(true);
      await apiRequest(`/api/game/${roomId}/creatures`, {
        method: 'POST',
        body: JSON.stringify(newCreature),
      });
      toast.success('Creature spawned!');
      setIsAdding(false);
      setNewCreature({ ...newCreature, name: '' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to spawn creature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl h-[80vh] bg-midnight-900 border border-midnight-700 rounded-xl shadow-2xl flex overflow-hidden">
        {/* Left Sidebar: List */}
        <div className="w-1/3 border-r border-midnight-700 flex flex-col bg-midnight-950/50">
          <div className="p-4 border-b border-midnight-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-aurora-100">Entities</h2>
            <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          <ScrollArea className="flex-1 p-2">
            {/* Players Section */}
            {players.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs uppercase tracking-wider text-midnight-400 font-bold mb-2 px-2">Players</h3>
                <div className="space-y-1">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedEntity(p);
                        setIsAdding(false);
                      }}
                      className={`p-2 rounded cursor-pointer flex items-center gap-2 hover:bg-midnight-800 ${selectedEntity?.id === p.id ? 'bg-midnight-800 border border-aurora-500/30' : ''}`}
                    >
                      <User className="w-4 h-4 text-aurora-400" />
                      <div className="overflow-hidden">
                        <div className="font-semibold text-sm truncate text-aurora-100">{p.character?.name}</div>
                        <div className="text-xs text-midnight-400 truncate">
                          {p.character?.race} {p.character?.characterClass}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Creatures Section */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-midnight-400 font-bold mb-2 px-2">
                Creatures & NPCs
              </h3>
              {creatures.length === 0 && <p className="text-xs text-midnight-500 px-2">No creatures active.</p>}
              <div className="space-y-1">
                {creatures.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedEntity(c);
                      setIsAdding(false);
                    }}
                    className={`p-2 rounded cursor-pointer flex items-center gap-2 hover:bg-midnight-800 ${selectedEntity?.id === c.id ? 'bg-midnight-800 border border-nebula-500/30' : ''}`}
                  >
                    <Skull className={`w-4 h-4 ${c.type === 'monster' ? 'text-red-400' : 'text-nebula-400'}`} />
                    <div className="overflow-hidden">
                      <div className="font-semibold text-sm truncate text-gray-200">{c.name}</div>
                      <div className="text-xs text-midnight-400 truncate">
                        HP: {c.hp}/{c.maxHp} | AC: {c.ac}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Content */}
        <div className="flex-1 flex flex-col bg-midnight-900 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-midnight-400 hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

          {isAdding ? (
            <div className="p-6 max-w-md mx-auto w-full">
              <h2 className="text-2xl font-bold mb-6 text-aurora-100">Spawn Creature</h2>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant={newCreature.type === 'npc' ? 'default' : 'outline'}
                    onClick={() => setNewCreature({ ...newCreature, type: 'npc' })}
                    className="flex-1"
                  >
                    NPC
                  </Button>
                  <Button
                    variant={newCreature.type === 'monster' ? 'default' : 'outline'}
                    onClick={() => setNewCreature({ ...newCreature, type: 'monster' })}
                    className="flex-1"
                  >
                    Monster
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newCreature.name}
                    onChange={(e) => setNewCreature({ ...newCreature, name: e.target.value })}
                    placeholder={newCreature.type === 'npc' ? 'Falric the Guard' : 'Goblin Skirmisher'}
                  />
                </div>

                {newCreature.type === 'npc' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Race</Label>
                        <Input
                          value={newCreature.race}
                          onChange={(e) => setNewCreature({ ...newCreature, race: e.target.value })}
                          placeholder="Human"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Class</Label>
                        <Input
                          value={newCreature.class}
                          onChange={(e) => setNewCreature({ ...newCreature, class: e.target.value })}
                          placeholder="Fighter"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Level</Label>
                      <Input
                        type="number"
                        value={newCreature.level}
                        onChange={(e) => setNewCreature({ ...newCreature, level: parseInt(e.target.value) })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Monster Filter (Type/Race)</Label>
                      <Input
                        value={newCreature.race}
                        onChange={(e) => setNewCreature({ ...newCreature, race: e.target.value })}
                        placeholder="e.g. Goblin, Undead"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Challenge Rating (approx)</Label>
                      <Input
                        type="number"
                        step="0.125"
                        value={newCreature.cr}
                        onChange={(e) => setNewCreature({ ...newCreature, cr: parseFloat(e.target.value) })}
                      />
                    </div>
                  </>
                )}

                <Button
                  className="w-full mt-6 bg-aurora-600 hover:bg-aurora-700"
                  onClick={handleAddCreature}
                  disabled={loading}
                >
                  {loading ? 'Summoning...' : 'Spawn Entity'}
                </Button>
              </div>
            </div>
          ) : selectedEntity ? (
            <div className="p-0 h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-midnight-700 bg-midnight-800/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-1">
                      {selectedEntity.name || selectedEntity.character?.name}
                    </h2>
                    <div className="flex gap-2 items-center text-midnight-300">
                      <Badge variant="outline" className="border-midnight-500 text-midnight-300">
                        {selectedEntity.character?.race || selectedEntity.sheet?.race}{' '}
                        {selectedEntity.character?.characterClass || selectedEntity.sheet?.characterClass}
                      </Badge>
                      <span>
                        Level{' '}
                        {selectedEntity.character?.level ||
                          selectedEntity.sheet?.level ||
                          selectedEntity.sheet?.challenge ||
                          1}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      HP: {selectedEntity.hp || selectedEntity.character?.hp}/
                      {selectedEntity.maxHp || selectedEntity.character?.maxHp}
                    </div>
                    <div className="text-sm text-midnight-400">
                      AC: {selectedEntity.ac || selectedEntity.character?.armorClass}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 p-6">
                <SheetView sheet={selectedEntity.sheet || selectedEntity.character} />
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-midnight-500 flex-col gap-4">
              <Search className="w-16 h-16 opacity-20" />
              <p>Select an entity to view their sheet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SheetView({ sheet }: { sheet: CharacterSheet }) {
  if (!sheet) return <div>No sheet data</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Stats */}
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-bold text-aurora-200 border-b border-aurora-500/20 mb-3 pb-1">Attributes</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(sheet.attributes).map(([attr, val]) => (
              <div key={attr} className="bg-midnight-950 p-2 rounded text-center border border-midnight-800">
                <div className="text-xs uppercase text-midnight-400 font-bold">{attr.substring(0, 3)}</div>
                <div className="text-xl font-bold text-white">{val}</div>
                <div className="text-xs text-midnight-300">
                  {Math.floor((val - 10) / 2) > 0 ? '+' : ''}
                  {Math.floor((val - 10) / 2)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-aurora-200 border-b border-aurora-500/20 mb-3 pb-1">Skills</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(sheet.skills).map(([skill, val]) => (
              <div key={skill} className="flex justify-between items-center text-midnight-200">
                <span>{skill}</span>
                <span className={val >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {val > 0 ? '+' : ''}
                  {val}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right Column: Actions & Features */}
      <div className="space-y-6">
        {sheet.attacks && sheet.attacks.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-red-300 border-b border-red-500/20 mb-3 pb-1">Attacks</h3>
            <div className="space-y-2">
              {sheet.attacks.map((atk, i) => (
                <div
                  key={i}
                  className="bg-midnight-950/50 p-3 rounded border border-midnight-800 flex justify-between items-center"
                >
                  <span className="font-bold text-white">{atk.name}</span>
                  <div className="text-sm">
                    <span className="text-aurora-300 font-mono mr-2">{atk.bonus} to hit</span>
                    <span className="text-midnight-300">{atk.damageType}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-lg font-bold text-aurora-200 border-b border-aurora-500/20 mb-3 pb-1">Features</h3>
          <div className="text-sm text-midnight-200 whitespace-pre-wrap leading-relaxed">
            {sheet.features || 'No features listed.'}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-aurora-200 border-b border-aurora-500/20 mb-3 pb-1">Personality</h3>
          <div className="text-sm italic text-midnight-300">{sheet.personality?.traits}</div>
        </section>
      </div>
    </div>
  );
}
