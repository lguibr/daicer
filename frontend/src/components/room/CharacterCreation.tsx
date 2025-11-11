import { useState, useMemo } from 'react';
import type { Room, Player, Attribute } from '../../types/shared';
import { addCharacter } from '../../services/api';
import { setReady } from '../../services/socket';
import useAuth from '../../hooks/useAuth';
import MarkdownMessage from '../game/MarkdownMessage';
import { useAlignments, useRaces, useClasses } from '../../hooks/useGameData';
import { Button } from '../ui/button';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import Input from '../ui/input';
import Label from '../ui/label';
import Textarea from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface CharacterCreationProps {
  room: Room;
  players: Player[];
}

const ATTRIBUTES: Attribute[] = [
  'Strength' as Attribute,
  'Dexterity' as Attribute,
  'Constitution' as Attribute,
  'Intelligence' as Attribute,
  'Wisdom' as Attribute,
  'Charisma' as Attribute,
];

// D&D 5e point-buy costs
const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

/**
 * Calculate point cost for an attribute score
 */
function getPointCost(score: number): number {
  return POINT_BUY_COSTS[score] || 0;
}

/**
 * Calculate total points used
 */
function calculateTotalPoints(attributes: Record<string, number>): number {
  return Object.values(attributes).reduce((sum, score) => sum + getPointCost(score), 0);
}

/**
 * Character creation component
 */
export default function CharacterCreation({ room, players }: CharacterCreationProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if all players are ready (game is starting)
  const allReady = players.length > 0 && players.every((p) => p.isReady);
  const isStarting = allReady && room.phase === 'CHARACTER_CREATION';

  // Fetch game data from API
  const { data: alignments, loading: alignmentsLoading } = useAlignments();
  const { data: races, loading: racesLoading } = useRaces();
  const { data: classes, loading: classesLoading } = useClasses();

  const dataLoading = alignmentsLoading || racesLoading || classesLoading;

  // Check if current user already has a character
  const userPlayer = players.find((p) => p.userId === user?.uid);
  const hasCharacter = !!userPlayer;

  const startingLevel = room.settings?.startingLevel || 1;
  const attributeBudget = room.settings?.attributePointBudget || 27;

  const [formData, setFormData] = useState({
    name: '',
    race: 'Human',
    characterClass: 'Fighter',
    background: '',
    alignment: 'Neutral Good',
    attributes: {
      Strength: 8,
      Dexterity: 8,
      Constitution: 8,
      Intelligence: 8,
      Wisdom: 8,
      Charisma: 8,
    },
    appearance: {
      age: '',
      height: '',
      weight: '',
      eyes: '',
      skin: '',
      hair: '',
      description: '',
    },
    personality: {
      traits: '',
      ideals: '',
      bonds: '',
      flaws: '',
    },
  });

  const pointsUsed = useMemo(() => calculateTotalPoints(formData.attributes), [formData.attributes]);
  const pointsRemaining = attributeBudget - pointsUsed;

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const adjustAttribute = (attr: Attribute, delta: number) => {
    const currentScore = formData.attributes[attr];
    const newScore = Math.max(8, Math.min(15, currentScore + delta));

    // Check if we have enough points
    const currentCost = getPointCost(currentScore);
    const newCost = getPointCost(newScore);
    const costDelta = newCost - currentCost;

    if (pointsRemaining - costDelta < 0 && delta > 0) {
      return; // Not enough points
    }

    setFormData((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: newScore },
    }));
  };

  const updateAppearance = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, [field]: value },
    }));
  };

  const updatePersonality = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personality: { ...prev.personality, [field]: value },
    }));
  };

  const loadTemplate = async (archetype: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game-data/character-templates/${archetype}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error('Failed to load template');
      }

      const template = result.data;
      setFormData({
        name: template.name,
        race: template.race,
        characterClass: template.characterClass,
        background: template.backstory,
        alignment: template.alignment,
        attributes: template.attributes,
        appearance: template.appearance,
        personality: template.personality,
      });
    } catch (err) {
      setError('Failed to load character template');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Character name is required');
      return;
    }

    if (!formData.background.trim() || formData.background.length < 50) {
      setError('Background story must be at least 50 characters and describe your character relationships');
      return;
    }

    if (pointsRemaining !== 0) {
      setError(`You must use all ${attributeBudget} attribute points (${pointsRemaining} remaining)`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const conModifier = Math.floor((formData.attributes.Constitution - 10) / 2);
      const dexModifier = Math.floor((formData.attributes.Dexterity - 10) / 2);
      const armorClass = 10 + dexModifier;
      const proficiencyBonus = 2;

      await addCharacter(room.id, {
        ...formData,
        level: startingLevel,
        xp: 0,
        hp: 10 + conModifier,
        maxHp: 10 + conModifier,
        temporaryHp: 0,
        hitDice: { total: startingLevel, current: startingLevel },
        deathSaves: { successes: 0, failures: 0 },
        armorClass,
        initiative: dexModifier,
        speed: 30,
        proficiencyBonus,
        inspiration: false,
        savingThrows: {
          fortitude: conModifier,
          reflex: dexModifier,
          will: Math.floor((formData.attributes.Wisdom - 10) / 2),
        },
        skills: {},
        baseAttackBonus: proficiencyBonus,
        attacks: [],
        equipment: '',
        currency: {
          cp: 0,
          sp: 0,
          ep: 0,
          gp: 0,
          pp: 0,
        },
        proficienciesAndLanguages: '',
        features: '',
        backstory: formData.background,
        alliesAndOrganizations: '',
        treasure: '',
        spellcasting: {
          class: '',
          ability: '',
          saveDC: 0,
          attackBonus: 0,
          cantrips: [],
          spellsKnown: [],
          slots: [],
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {(loading || dataLoading) && <LoadingOverlay message={loading ? 'Creating character...' : 'Loading data...'} />}
      {isStarting && <LoadingOverlay message="The adventure begins..." size="large" />}
      <div className="min-h-screen p-4 md:p-8 bg-zinc-900">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">The Stage Is Set</h1>
            <p className="text-zinc-400">Prepare your character for the journey ahead</p>
          </div>

          {/* Teamwork Guidance */}
          <div className="mb-6 p-4 bg-blue-950/50 border-2 border-blue-500/30 rounded-lg">
            <h3 className="text-lg font-bold text-blue-300 mb-2">🤝 Adventure Together</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              <strong>This is a team adventure!</strong> When writing your background, consider how your character knows
              or could connect with the other players in your party. Share common goals, past encounters, or
              complementary skills. Strong relationships make for better storytelling and more engaging gameplay!
            </p>
          </div>

          {/* World Description */}
          <div className="p-6 bg-zinc-800 rounded-lg border border-zinc-700 mb-8">
            <h2 className="text-xl font-bold text-blue-400 mb-3">World</h2>
            <div className="text-zinc-200 leading-relaxed prose-invert max-w-none">
              {room.worldDescription ? (
                <MarkdownMessage content={room.worldDescription} />
              ) : (
                <p className="italic text-zinc-500">Generating world description...</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Character Creation Form */}
            <div>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                {hasCharacter ? 'Your Character' : 'Create Your Character'}
              </h2>

              {hasCharacter ? (
                <div className="p-6 bg-zinc-800 rounded-lg border border-zinc-700 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-50 mb-2">{userPlayer?.character.name}</h3>
                    <p className="text-zinc-300 mb-2">
                      Level {userPlayer?.character.level} {userPlayer?.character.race}{' '}
                      {userPlayer?.character.characterClass}
                    </p>
                    <p className="text-zinc-500 text-xs">{userPlayer?.character.alignment}</p>
                  </div>

                  {userPlayer?.isReady ? (
                    <div>
                      <p className="text-green-400 font-semibold">✓ You are ready!</p>
                      <p className="text-zinc-500 text-sm mt-1">Waiting for other players...</p>
                      <Button onClick={() => setReady(room.id, false)} variant="secondary" className="mt-3 w-full">
                        Unready
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setReady(room.id, true)} className="w-full">
                      Ready Up!
                    </Button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 bg-zinc-800 rounded-lg border border-zinc-700 space-y-6">
                  {/* Quick Create Templates */}
                  <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-300 mb-3">⚡ Quick Create</h3>
                    <p className="text-xs text-zinc-400 mb-3">Load a pre-made character for quick testing</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <Button type="button" onClick={() => loadTemplate('fighter')} variant="secondary" size="sm">
                        Fighter
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('wizard')} variant="secondary" size="sm">
                        Wizard
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('rogue')} variant="secondary" size="sm">
                        Rogue
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('cleric')} variant="secondary" size="sm">
                        Cleric
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('ranger')} variant="secondary" size="sm">
                        Ranger
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('paladin')} variant="secondary" size="sm">
                        Paladin
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('barbarian')} variant="secondary" size="sm">
                        Barbarian
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('bard')} variant="secondary" size="sm">
                        Bard
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('monk')} variant="secondary" size="sm">
                        Monk
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('sorcerer')} variant="secondary" size="sm">
                        Sorcerer
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('druid')} variant="secondary" size="sm">
                        Druid
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('ranger_archer')} variant="secondary" size="sm">
                        Archer
                      </Button>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div>
                    <Label htmlFor="name">Character Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Enter your character's name"
                      className="w-full"
                    />
                  </div>

                  <div className="text-sm text-zinc-400 p-3 bg-zinc-900/50 rounded border border-zinc-700">
                    <strong>Starting Level:</strong> {startingLevel}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="race">Race *</Label>
                      <Select value={formData.race} onValueChange={(value) => updateField('race', value)}>
                        <SelectTrigger id="race">
                          <SelectValue placeholder="Select race" />
                        </SelectTrigger>
                        <SelectContent>
                          {races?.map((race) => (
                            <SelectItem key={race.id} value={race.name}>
                              {race.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class">Class *</Label>
                      <Select
                        value={formData.characterClass}
                        onValueChange={(value) => updateField('characterClass', value)}
                      >
                        <SelectTrigger id="class">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.name}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alignment">Alignment *</Label>
                    <Select value={formData.alignment} onValueChange={(value) => updateField('alignment', value)}>
                      <SelectTrigger id="alignment">
                        <SelectValue placeholder="Select alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {alignments?.map((alignment) => (
                          <SelectItem key={alignment.id} value={alignment.name}>
                            {alignment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Background Story */}
                  <div className="space-y-2">
                    <Label htmlFor="background">
                      Background Story * <span className="text-xs text-zinc-500">(min 50 characters)</span>
                    </Label>
                    <Textarea
                      id="background"
                      value={formData.background}
                      onChange={(e) => updateField('background', e.target.value)}
                      placeholder="Write your character's background story here. IMPORTANT: Include how you know or connect with the other party members. Do you share a common goal? Did you meet at a tavern? Are you childhood friends? Strong party bonds make for better adventures!"
                      rows={6}
                      className="w-full resize-none"
                    />
                    <p className="text-xs text-zinc-500">
                      {formData.background.length}
                      /50 characters
                      {formData.background.length >= 50 && <span className="text-green-500 ml-2">✓</span>}
                    </p>
                  </div>

                  {/* Attributes with Point Buy */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label>Attributes (Point Buy)</Label>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          pointsRemaining < 0
                            ? 'bg-red-900/50 text-red-400'
                            : pointsRemaining === 0
                              ? 'bg-green-900/50 text-green-400'
                              : 'bg-blue-900/50 text-blue-400'
                        }`}
                      >
                        {pointsRemaining === 0 ? '✓ Perfect!' : `${pointsRemaining} points left`}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ATTRIBUTES.map((attr) => {
                        const score = formData.attributes[attr];
                        const modifier = Math.floor((score - 10) / 2);
                        const cost = getPointCost(score);

                        return (
                          <div key={attr} className="bg-zinc-900 p-3 rounded-lg border border-zinc-700">
                            <div className="text-xs text-zinc-400 mb-2 font-semibold">{attr}</div>
                            <div className="flex items-center justify-between gap-2">
                              <Button
                                type="button"
                                onClick={() => adjustAttribute(attr, -1)}
                                disabled={score <= 8}
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                −
                              </Button>
                              <div className="text-center flex-1">
                                <div className="text-2xl font-bold text-zinc-50">{score}</div>
                                <div className="text-xs text-zinc-500">
                                  {modifier >= 0 ? '+' : ''}
                                  {modifier}
                                </div>
                              </div>
                              <Button
                                type="button"
                                onClick={() => adjustAttribute(attr, 1)}
                                disabled={score >= 15 || pointsRemaining <= 0}
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                +
                              </Button>
                            </div>
                            <div className="text-xs text-center text-zinc-600 mt-1">{cost} pts</div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      Range: 8-15 | Total Budget:
                      {attributeBudget} points
                    </p>
                  </div>

                  {/* Appearance (Optional) */}
                  <details className="border-t border-zinc-700 pt-4">
                    <summary className="text-sm font-medium text-zinc-400 mb-3 cursor-pointer hover:text-zinc-300">
                      Appearance (Optional) ▼
                    </summary>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      <Input
                        type="text"
                        value={formData.appearance.age}
                        onChange={(e) => updateAppearance('age', e.target.value)}
                        placeholder="Age"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.appearance.height}
                        onChange={(e) => updateAppearance('height', e.target.value)}
                        placeholder="Height"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.appearance.weight}
                        onChange={(e) => updateAppearance('weight', e.target.value)}
                        placeholder="Weight"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.appearance.eyes}
                        onChange={(e) => updateAppearance('eyes', e.target.value)}
                        placeholder="Eyes"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.appearance.skin}
                        onChange={(e) => updateAppearance('skin', e.target.value)}
                        placeholder="Skin"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.appearance.hair}
                        onChange={(e) => updateAppearance('hair', e.target.value)}
                        placeholder="Hair"
                        className="text-sm"
                      />
                    </div>
                    <Textarea
                      value={formData.appearance.description}
                      onChange={(e) => updateAppearance('description', e.target.value)}
                      placeholder="Physical description..."
                      rows={2}
                      className="mt-3 text-sm resize-none"
                    />
                  </details>

                  {/* Personality (Optional) */}
                  <details className="border-t border-zinc-700 pt-4">
                    <summary className="text-sm font-medium text-zinc-400 mb-3 cursor-pointer hover:text-zinc-300">
                      Personality (Optional) ▼
                    </summary>
                    <div className="space-y-2 mt-3">
                      <Input
                        type="text"
                        value={formData.personality.traits}
                        onChange={(e) => updatePersonality('traits', e.target.value)}
                        placeholder="Personality Traits"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.personality.ideals}
                        onChange={(e) => updatePersonality('ideals', e.target.value)}
                        placeholder="Ideals"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.personality.bonds}
                        onChange={(e) => updatePersonality('bonds', e.target.value)}
                        placeholder="Bonds"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.personality.flaws}
                        onChange={(e) => updatePersonality('flaws', e.target.value)}
                        placeholder="Flaws"
                        className="text-sm"
                      />
                    </div>
                  </details>

                  {error && (
                    <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  <Button type="submit" disabled={loading || dataLoading || pointsRemaining !== 0} className="w-full">
                    {(() => {
                      if (loading) return 'Creating...';
                      if (dataLoading) return 'Loading...';
                      return 'Create Character';
                    })()}
                  </Button>
                </form>
              )}
            </div>

            {/* Player List */}
            <div>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">Adventuring Party</h2>
              <div className="space-y-3">
                {players.length === 0 && (
                  <p className="text-zinc-500 text-center p-8">Waiting for players to create characters...</p>
                )}
                {players.map((player) => (
                  <div key={player.id} className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-zinc-50">{player.character.name}</h3>
                      {player.isReady && <span className="text-green-400 text-sm font-semibold">✓ Ready</span>}
                    </div>
                    <p className="text-zinc-300 text-sm">
                      Level {player.character.level} {player.character.race} {player.character.characterClass}
                    </p>
                    <p className="text-zinc-500 text-xs">{player.character.alignment}</p>
                    {player.character.backstory && (
                      <p className="text-zinc-400 text-xs mt-2 italic line-clamp-2">{player.character.backstory}</p>
                    )}
                  </div>
                ))}
              </div>

              {hasCharacter && (
                <div className="mt-6 p-4 bg-blue-950/30 border border-blue-500/40 rounded-lg">
                  <p className="text-blue-300 text-sm font-semibold">
                    {players.filter((p) => p.isReady).length} /{room.settings?.playerCount || players.length} players
                    ready
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">Game starts when all players are ready</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
