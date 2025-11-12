import { useEffect, useMemo, useState } from 'react';
import { PrivateLayout } from '../components/layout';
import { SpellEffectOverlay } from '../components/combat/SpellEffectOverlay';
import type { SpellData, GridPosition, SpellEffectShape } from '../types/spells';
import type { CombatState, CombatCharacter } from '../types/combat';
import { getAllSpells } from '../services/spells';
import {
  previewSpellScenario,
  castSpellScenario,
  type SpellScenarioCharacter,
  type SpellTargetInput,
  type SpellPreviewResponse,
  type SpellCastResponse,
  type SpellScenarioRequest,
  type SpellDirectionInput,
} from '../services/combatSpells';

type PlacementMode = 'target' | 'ogre' | 'ally' | 'caster';

type OverlayCharacterDisplay = {
  id: string;
  position: GridPosition;
  icon?: string;
  role?: 'ally' | 'enemy' | 'caster' | 'neutral';
};

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  casterId: string;
  characters: SpellScenarioCharacter[];
  obstacles: GridPosition[];
  grid: {
    width: number;
    height: number;
  };
  defaultTarget?: SpellTargetInput;
}

const BASE_CASTER: SpellScenarioCharacter = {
  id: 'caster-1',
  name: 'Aelar Stormweaver',
  isPlayer: true,
  hp: 32,
  maxHp: 32,
  tempHp: 0,
  armorClass: 15,
  initiative: 0,
  avatar: '🧙',
  position: { x: 4, y: 6 },
  strength: 8,
  dexterity: 14,
  constitution: 12,
  intelligence: 18,
  wisdom: 14,
  charisma: 12,
  proficiencyBonus: 3,
  speed: 6,
  reach: 1,
  hasMoved: false,
  hasActed: false,
  hasReaction: true,
  hasBonusAction: true,
  movementRemaining: 6,
  conditions: [],
};

const ALLY_GUARD: SpellScenarioCharacter = {
  id: 'ally-guardian',
  name: 'Tamsin the Shield',
  isPlayer: true,
  hp: 38,
  maxHp: 38,
  armorClass: 18,
  initiative: 0,
  avatar: '🛡️',
  position: { x: 7, y: 6 },
  strength: 18,
  dexterity: 12,
  constitution: 16,
  intelligence: 10,
  wisdom: 12,
  charisma: 11,
  proficiencyBonus: 3,
  speed: 6,
  reach: 1,
  hasMoved: false,
  hasActed: false,
  hasReaction: true,
  hasBonusAction: true,
  movementRemaining: 6,
  conditions: [],
};

const ENEMY_BRUTE: SpellScenarioCharacter = {
  id: 'enemy-brute',
  name: 'Ogre Brute',
  isPlayer: false,
  hp: 45,
  maxHp: 45,
  armorClass: 11,
  initiative: 0,
  avatar: '💀',
  position: { x: 12, y: 6 },
  strength: 19,
  dexterity: 8,
  constitution: 16,
  intelligence: 7,
  wisdom: 9,
  charisma: 7,
  proficiencyBonus: 2,
  speed: 8,
  reach: 1,
  hasMoved: false,
  hasActed: false,
  hasReaction: true,
  hasBonusAction: true,
  movementRemaining: 8,
  conditions: [],
};

const ENEMY_ARCHER: SpellScenarioCharacter = {
  id: 'enemy-archer',
  name: 'Hobgoblin Archer',
  isPlayer: false,
  hp: 22,
  maxHp: 22,
  armorClass: 13,
  initiative: 0,
  avatar: '🏹',
  position: { x: 13, y: 4 },
  strength: 10,
  dexterity: 16,
  constitution: 12,
  intelligence: 10,
  wisdom: 11,
  charisma: 9,
  proficiencyBonus: 2,
  speed: 6,
  reach: 1,
  hasMoved: false,
  hasActed: false,
  hasReaction: true,
  hasBonusAction: true,
  movementRemaining: 6,
  conditions: [],
};

const ENEMY_SCOUT: SpellScenarioCharacter = {
  id: 'enemy-scout',
  name: 'Goblin Scout',
  isPlayer: false,
  hp: 16,
  maxHp: 16,
  armorClass: 15,
  initiative: 0,
  avatar: '🗡️',
  position: { x: 9, y: 5 },
  strength: 8,
  dexterity: 16,
  constitution: 10,
  intelligence: 10,
  wisdom: 8,
  charisma: 8,
  proficiencyBonus: 2,
  speed: 8,
  reach: 1,
  hasMoved: false,
  hasActed: false,
  hasReaction: true,
  hasBonusAction: true,
  movementRemaining: 8,
  conditions: [],
};

const OBSTACLE_BLOCKERS: GridPosition[] = [
  { x: 8, y: 5 },
  { x: 8, y: 6 },
  { x: 8, y: 7 },
  { x: 9, y: 5 },
  { x: 9, y: 6 },
  { x: 9, y: 7 },
];

const OBSTACLE_RUINS: GridPosition[] = [
  { x: 10, y: 4 },
  { x: 11, y: 4 },
  { x: 11, y: 5 },
  { x: 11, y: 6 },
  { x: 10, y: 7 },
];

const OBSTACLE_PILLARS: GridPosition[] = [
  { x: 6, y: 4 },
  { x: 6, y: 8 },
  { x: 12, y: 5 },
  { x: 12, y: 7 },
];

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'open-field',
    name: 'Open Field',
    description: 'Straight line of sight with a single enemy. Ideal for testing range and distance.',
    casterId: BASE_CASTER.id,
    characters: [BASE_CASTER, { ...ENEMY_BRUTE, position: { x: 13, y: 6 } }],
    obstacles: [],
    grid: { width: 18, height: 12 },
    defaultTarget: { type: 'point', x: 13, y: 6 },
  },
  {
    id: 'bottleneck',
    name: 'Bottleneck Corridor',
    description: 'Enemy forces are holding a narrow hallway, perfect for cones and lines.',
    casterId: BASE_CASTER.id,
    characters: [
      { ...BASE_CASTER, position: { x: 4, y: 6 } },
      { ...ENEMY_SCOUT, position: { x: 10, y: 6 } },
      { ...ENEMY_ARCHER, position: { x: 12, y: 6 } },
    ],
    obstacles: OBSTACLE_BLOCKERS,
    grid: { width: 18, height: 12 },
    defaultTarget: { type: 'direction', direction: 6 },
  },
  {
    id: 'friendly-line',
    name: 'Friendly Front Line',
    description: 'An ally is close to the enemy. Check friendly fire risks before casting.',
    casterId: BASE_CASTER.id,
    characters: [
      { ...BASE_CASTER, position: { x: 5, y: 6 } },
      { ...ALLY_GUARD, position: { x: 7, y: 6 } },
      { ...ENEMY_BRUTE, position: { x: 11, y: 6 } },
      { ...ENEMY_ARCHER, position: { x: 13, y: 5 } },
    ],
    obstacles: OBSTACLE_PILLARS,
    grid: { width: 18, height: 12 },
    defaultTarget: { type: 'point', x: 11, y: 6 },
  },
  {
    id: 'ruined-square',
    name: 'Ruined Plaza',
    description: 'Scattered ruins break line of sight. Perfect for testing range, LOS, and indirect targeting.',
    casterId: BASE_CASTER.id,
    characters: [
      { ...BASE_CASTER, position: { x: 5, y: 8 } },
      { ...ENEMY_BRUTE, position: { x: 12, y: 6 } },
      { ...ENEMY_ARCHER, position: { x: 14, y: 5 } },
      { ...ENEMY_SCOUT, position: { x: 10, y: 8 } },
    ],
    obstacles: OBSTACLE_RUINS,
    grid: { width: 20, height: 12 },
    defaultTarget: { type: 'point', x: 12, y: 6 },
  },
  {
    id: 'ambush',
    name: 'Ambush Crossfire',
    description: 'Enemies surrounding the caster with partial cover and allies in range.',
    casterId: BASE_CASTER.id,
    characters: [
      { ...BASE_CASTER, position: { x: 8, y: 6 } },
      { ...ALLY_GUARD, position: { x: 7, y: 7 } },
      { ...ENEMY_SCOUT, position: { x: 9, y: 4 } },
      { ...ENEMY_ARCHER, position: { x: 12, y: 8 } },
      { ...ENEMY_BRUTE, position: { x: 11, y: 6 } },
    ],
    obstacles: [
      { x: 10, y: 5 },
      { x: 10, y: 6 },
      { x: 10, y: 7 },
      { x: 6, y: 5 },
      { x: 12, y: 7 },
    ],
    grid: { width: 18, height: 12 },
    defaultTarget: { type: 'direction', direction: 6 },
  },
];

const DIRECTION_MATRIX: SpellDirectionInput[][] = [
  [7, 8, 9],
  [4, 5, 6],
  [1, 2, 3],
];

const OGRE_PLACEMENT_ID = 'enemy-ogre-test';
const ALLY_PLACEMENT_ID = 'ally-test';

const PLACED_OGRE_TEMPLATE: SpellScenarioCharacter = {
  id: OGRE_PLACEMENT_ID,
  name: 'Bruised Ogre',
  isPlayer: false,
  hp: 45,
  maxHp: 90,
  armorClass: 12,
  position: { x: 12, y: 6 },
  avatar: '🪓',
  strength: 19,
  dexterity: 9,
  constitution: 17,
  intelligence: 7,
  wisdom: 9,
  charisma: 7,
  proficiencyBonus: 2,
  speed: 8,
  reach: 2,
  movementRemaining: 8,
  hasActed: false,
  hasBonusAction: true,
  hasMoved: false,
  hasReaction: true,
  conditions: [],
};

const PLACED_ALLY_TEMPLATE: SpellScenarioCharacter = {
  id: ALLY_PLACEMENT_ID,
  name: 'Wounded Cleric',
  isPlayer: true,
  hp: 11,
  maxHp: 24,
  armorClass: 14,
  position: { x: 6, y: 6 },
  avatar: '💖',
  strength: 10,
  dexterity: 12,
  constitution: 12,
  intelligence: 11,
  wisdom: 16,
  charisma: 13,
  proficiencyBonus: 3,
  speed: 6,
  reach: 1,
  movementRemaining: 6,
  hasActed: false,
  hasBonusAction: true,
  hasMoved: false,
  hasReaction: true,
  conditions: [],
};

function isDirectionalShape(shape: SpellEffectShape): boolean {
  return shape === 'cone' || shape === 'line' || shape === 'projectile_straight';
}

function getEffectColor(spell: SpellData | undefined): string {
  if (!spell) return 'rgba(255, 100, 100, 0.3)';
  const schoolColors: Record<string, string> = {
    evocation: 'rgba(255, 120, 80, 0.5)',
    abjuration: 'rgba(120, 180, 255, 0.45)',
    conjuration: 'rgba(160, 120, 255, 0.45)',
    enchantment: 'rgba(255, 135, 200, 0.45)',
    illusion: 'rgba(200, 160, 255, 0.4)',
    necromancy: 'rgba(120, 255, 120, 0.45)',
    transmutation: 'rgba(255, 210, 120, 0.45)',
    divination: 'rgba(200, 200, 255, 0.4)',
  };
  return schoolColors[spell.school] ?? 'rgba(255, 100, 100, 0.3)';
}

function buildScenarioRequest(
  spell: SpellData,
  scenario: DemoScenario,
  characters: SpellScenarioCharacter[],
  targetDirection: SpellDirectionInput,
  targetX: number,
  targetY: number,
  allowFriendlyFire: boolean
): SpellScenarioRequest {
  const target: SpellTargetInput = isDirectionalShape(spell.effectShape)
    ? { type: 'direction', direction: targetDirection }
    : { type: 'point', x: targetX, y: targetY };

  return {
    spellId: spell.id,
    casterId: scenario.casterId,
    grid: scenario.grid,
    characters,
    obstacles: scenario.obstacles,
    target,
    confirmFriendlyFire: allowFriendlyFire,
  };
}

export default function SpellbookDemoPage() {
  const [spells, setSpells] = useState<SpellData[]>([]);
  const [selectedSpellId, setSelectedSpellId] = useState<string>('');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DEMO_SCENARIOS[0]?.id ?? '');
  const [targetDirection, setTargetDirection] = useState<SpellDirectionInput>(6);
  const [targetX, setTargetX] = useState<number>(12);
  const [targetY, setTargetY] = useState<number>(6);
  const [allowFriendlyFire, setAllowFriendlyFire] = useState(false);
  const [scenarioCharacters, setScenarioCharacters] = useState<SpellScenarioCharacter[]>(
    DEMO_SCENARIOS[0]?.characters.map((character) => ({ ...character })) ?? []
  );
  const [placementMode, setPlacementMode] = useState<PlacementMode>('target');

  const [previewData, setPreviewData] = useState<SpellPreviewResponse | null>(null);
  const [castData, setCastData] = useState<SpellCastResponse | null>(null);
  const [currentState, setCurrentState] = useState<CombatState | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingCast, setLoadingCast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedFriendlyFire, setBlockedFriendlyFire] = useState(false);

  const selectedSpell = useMemo(() => spells.find((spell) => spell.id === selectedSpellId), [spells, selectedSpellId]);

  const selectedScenario = useMemo(
    () => DEMO_SCENARIOS.find((scenario) => scenario.id === selectedScenarioId) ?? DEMO_SCENARIOS[0],
    [selectedScenarioId]
  );

  useEffect(() => {
    if (selectedScenario) {
      setScenarioCharacters(selectedScenario.characters.map((character) => ({ ...character })));
    }
  }, [selectedScenario]);

  useEffect(() => {
    const allSpells = getAllSpells();
    setSpells(allSpells);
    const [firstSpell] = allSpells;
    if (firstSpell) {
      setSelectedSpellId(firstSpell.id);
    }
  }, []);

  useEffect(() => {
    const defaultTarget = selectedScenario?.defaultTarget;
    if (defaultTarget?.type === 'direction' && defaultTarget.direction) {
      setTargetDirection(defaultTarget.direction as SpellDirectionInput);
    }
    if (defaultTarget?.type === 'point') {
      setTargetX((prev) => defaultTarget.x ?? prev);
      setTargetY((prev) => defaultTarget.y ?? prev);
    }
    setPreviewData(null);
    setCastData(null);
    setCurrentState(null);
    setError(null);
    setBlockedFriendlyFire(false);
    setPlacementMode('target');
  }, [selectedScenario]);

  useEffect(() => {
    if (selectedSpell && !isDirectionalShape(selectedSpell.effectShape)) {
      const pointTarget = selectedScenario?.defaultTarget;
      if (pointTarget?.type === 'point') {
        setTargetX((prev) => pointTarget.x ?? prev);
        setTargetY((prev) => pointTarget.y ?? prev);
      }
    }

    setCastData(null);
    setBlockedFriendlyFire(false);
  }, [selectedScenario, selectedSpell]);

  const casterCharacter = useMemo(() => {
    if (!selectedScenario) return undefined;
    return scenarioCharacters.find((character) => character.id === selectedScenario.casterId);
  }, [scenarioCharacters, selectedScenario]);

  const handlePreview = async () => {
    if (!selectedSpell || !selectedScenario) return;
    setLoadingPreview(true);
    setError(null);
    setBlockedFriendlyFire(false);

    try {
      const request = buildScenarioRequest(
        selectedSpell,
        selectedScenario,
        scenarioCharacters,
        targetDirection,
        targetX,
        targetY,
        allowFriendlyFire
      );
      const response = await previewSpellScenario(request);
      setPreviewData(response);
      setCurrentState(response.combatState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview spell');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCast = async () => {
    if (!selectedSpell || !selectedScenario) return;
    setLoadingCast(true);
    setError(null);

    try {
      const request = buildScenarioRequest(
        selectedSpell,
        selectedScenario,
        scenarioCharacters,
        targetDirection,
        targetX,
        targetY,
        allowFriendlyFire
      );
      const response = await castSpellScenario(request);

      if (response.blocked) {
        setBlockedFriendlyFire(true);
        setCastData(null);
        setPreviewData({
          combatState: response.combatState,
          preview: response.preview,
        });
        setCurrentState(response.combatState);
        return;
      }

      setCastData(response);
      setBlockedFriendlyFire(false);
      setPreviewData({
        combatState: response.combatState,
        preview: response.preview ?? previewData?.preview ?? null,
      });
      setCurrentState(response.combatState);
      setScenarioCharacters(
        response.combatState.characters.map((character) => ({
          id: character.id,
          name: character.name,
          hp: character.hp,
          maxHp: character.maxHp,
          tempHp: character.tempHp,
          armorClass: character.armorClass,
          position: character.position,
          avatar: character.avatar,
          isPlayer: character.isPlayer,
          strength: character.strength,
          dexterity: character.dexterity,
          constitution: character.constitution,
          intelligence: character.intelligence,
          wisdom: character.wisdom,
          charisma: character.charisma,
          proficiencyBonus: character.proficiencyBonus,
          speed: character.speed,
          reach: character.reach,
          hasMoved: character.hasMoved,
          hasActed: character.hasActed,
          hasReaction: character.hasReaction,
          hasBonusAction: character.hasBonusAction,
          movementRemaining: character.movementRemaining,
          conditions: character.conditions,
          deathSaves: character.deathSaves,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve spell scenario');
    } finally {
      setLoadingCast(false);
    }
  };

  const overlayPreview = previewData?.preview ?? castData?.preview ?? null;
  const effectColor = getEffectColor(selectedSpell);

  type DisplayCharacter = CombatCharacter | SpellScenarioCharacter;
  const livingCharacters: DisplayCharacter[] = currentState?.characters ?? scenarioCharacters;

  const resetPreviewState = () => {
    setPreviewData(null);
    setCastData(null);
    setCurrentState(null);
    setBlockedFriendlyFire(false);
  };

  const setCharacterAtPosition = (template: SpellScenarioCharacter, position: GridPosition) => {
    setScenarioCharacters((prev) => {
      const existingIndex = prev.findIndex((character) => character.id === template.id);
      if (existingIndex >= 0) {
        return prev.map((character, index) => (index === existingIndex ? { ...character, position } : character));
      }
      return [
        ...prev,
        {
          ...template,
          position,
        },
      ];
    });
    resetPreviewState();
  };

  const moveCharacterPosition = (characterId: string, position: GridPosition) => {
    if (!characterId) return;
    setScenarioCharacters((prev) => {
      const index = prev.findIndex((character) => character.id === characterId);
      if (index >= 0) {
        return prev.map((character, idx) => (idx === index ? { ...character, position } : character));
      }

      const fallback = selectedScenario?.characters.find((character) => character.id === characterId);
      if (!fallback) {
        return prev;
      }

      return [
        ...prev,
        {
          ...fallback,
          position,
        },
      ];
    });
    resetPreviewState();
  };

  const clearPlacedCharacter = (id: string) => {
    setScenarioCharacters((prev) => prev.filter((character) => character.id !== id));
    resetPreviewState();
    setPlacementMode('target');
  };

  const clampDirectionComponent = (value: number) => (value > 0 ? 1 : value < 0 ? -1 : 0);

  const computeDirection = (casterPos: GridPosition, targetPos: GridPosition): SpellDirectionInput => {
    const dx = clampDirectionComponent(targetPos.x - casterPos.x);
    const dy = clampDirectionComponent(targetPos.y - casterPos.y);
    const key = `${dx},${dy}`;
    const mapping: Record<string, SpellDirectionInput> = {
      '-1,1': 1,
      '0,1': 2,
      '1,1': 3,
      '-1,0': 4,
      '0,0': 5,
      '1,0': 6,
      '-1,-1': 7,
      '0,-1': 8,
      '1,-1': 9,
    };
    return mapping[key] ?? 5;
  };

  const handleGridSquareClick = (position: GridPosition) => {
    if (!selectedSpell) return;

    if (placementMode === 'ogre') {
      setCharacterAtPosition(PLACED_OGRE_TEMPLATE, position);
      return;
    }

    if (placementMode === 'ally') {
      setCharacterAtPosition(PLACED_ALLY_TEMPLATE, position);
      return;
    }

    if (placementMode === 'caster') {
      moveCharacterPosition(selectedScenario?.casterId ?? '', position);
      return;
    }

    if (placementMode === 'target') {
      if (isDirectionalShape(selectedSpell.effectShape) && casterCharacter) {
        const direction = computeDirection(casterCharacter.position, position);
        setTargetDirection(direction);
      } else {
        setTargetX(position.x);
        setTargetY(position.y);
      }
      resetPreviewState();
    }
  };

  const overlayCharacters: OverlayCharacterDisplay[] = livingCharacters.map((character) => {
    const isPlayer = 'isPlayer' in character ? character.isPlayer : false;
    const icon = 'avatar' in character && character.avatar ? character.avatar : isPlayer ? '🛡️' : '💀';
    const role: OverlayCharacterDisplay['role'] =
      character.id === selectedScenario?.casterId ? 'caster' : isPlayer ? 'ally' : 'enemy';
    return {
      id: character.id,
      position: character.position,
      icon,
      role,
    };
  });

  const resetTargetToDefault = () => {
    const defaultTarget = selectedScenario?.defaultTarget;
    if (defaultTarget?.type === 'direction' && defaultTarget.direction) {
      setTargetDirection(defaultTarget.direction as SpellDirectionInput);
    }
    if (defaultTarget?.type === 'point') {
      setTargetX(defaultTarget.x ?? casterCharacter?.position.x ?? 0);
      setTargetY(defaultTarget.y ?? casterCharacter?.position.y ?? 0);
    }
    if (!defaultTarget && casterCharacter) {
      setTargetX(casterCharacter.position.x);
      setTargetY(casterCharacter.position.y);
    }
    resetPreviewState();
    setPlacementMode('target');
  };

  const resetCasterPosition = () => {
    const casterId = selectedScenario?.casterId;
    if (!casterId) {
      return;
    }

    const baseCaster = selectedScenario?.characters.find((character) => character.id === casterId);
    if (!baseCaster) {
      return;
    }

    moveCharacterPosition(casterId, baseCaster.position);
    setPlacementMode('target');
  };

  return (
    <PrivateLayout showRoomInfo={false}>
      <div className="min-h-screen bg-midnight-900 py-12 px-6 sm:px-10 lg:px-12 text-shadow-50">
        <div className="max-w-7xl mx-auto space-y-10">
          <header className="space-y-3">
            <div className="flex items-center gap-3 text-aurora-300">
              <span className="text-3xl">📚</span>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-[0.35em]">Spellbook Visualizer</h1>
                <p className="text-sm text-shadow-300">
                  Preview spell geometries, measure ranges, and simulate casting with deterministic combat rolls.
                </p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="space-y-6">
              <div className="bg-midnight-300/60 border border-shadow-800 rounded-lg p-5 space-y-5">
                <div>
                  <label
                    htmlFor="spell-select"
                    className="block text-sm font-semibold uppercase tracking-widest text-shadow-200"
                  >
                    Spell
                  </label>
                  <select
                    id="spell-select"
                    value={selectedSpellId}
                    onChange={(e) => setSelectedSpellId(e.target.value)}
                    className="mt-2 w-full bg-shadow-900 border border-shadow-700 text-shadow-50 px-3 py-2 rounded-lg"
                  >
                    {spells.map((spell) => (
                      <option key={spell.id} value={spell.id}>
                        {spell.name} (Lvl {spell.level}) — {spell.effectShape}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="scenario-select"
                    className="block text-sm font-semibold uppercase tracking-widest text-shadow-200"
                  >
                    Scenario
                  </label>
                  <select
                    id="scenario-select"
                    value={selectedScenarioId}
                    onChange={(e) => setSelectedScenarioId(e.target.value)}
                    className="mt-2 w-full bg-shadow-900 border border-shadow-700 text-shadow-50 px-3 py-2 rounded-lg"
                  >
                    {DEMO_SCENARIOS.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-shadow-300">{selectedScenario?.description}</p>
                </div>

                {selectedSpell && isDirectionalShape(selectedSpell.effectShape) ? (
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-shadow-200">
                      Direction (numpad)
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2 w-40">
                      {DIRECTION_MATRIX.flat().map((dir) => (
                        <button
                          key={dir}
                          type="button"
                          onClick={() => setTargetDirection(dir)}
                          className={`px-3 py-2 rounded text-sm font-semibold transition ${
                            targetDirection === dir
                              ? 'bg-aurora-400 text-midnight-950'
                              : dir === 5
                                ? 'bg-shadow-800 text-shadow-50'
                                : 'bg-shadow-900 text-shadow-200 hover:bg-shadow-800'
                          }`}
                        >
                          {dir}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-shadow-300">
                    Click the grid to set the spell target. Use the placement controls near the grid to drop allies or
                    enemies.
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <input
                    id="allow-friendly-fire"
                    type="checkbox"
                    checked={allowFriendlyFire}
                    onChange={(e) => setAllowFriendlyFire(e.target.checked)}
                    className="h-4 w-4 accent-aurora-400"
                  />
                  <label htmlFor="allow-friendly-fire" className="text-sm text-shadow-200">
                    Allow friendly fire when casting (override warnings)
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={loadingPreview}
                    className="flex-1 px-4 py-2 rounded bg-aurora-400 text-midnight-950 font-semibold hover:bg-aurora-300 transition disabled:opacity-60"
                  >
                    {loadingPreview ? 'Previewing...' : 'Preview Spell'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCast}
                    disabled={loadingCast}
                    className="flex-1 px-4 py-2 rounded bg-aurora-200 text-midnight-950 font-semibold hover:bg-aurora-100 transition disabled:opacity-60"
                  >
                    {loadingCast ? 'Casting...' : 'Cast Spell'}
                  </button>
                </div>

                {error && <div className="text-red-300 text-sm">{error}</div>}
                {blockedFriendlyFire && (
                  <div className="text-amber-300 text-sm">
                    Casting was blocked due to friendly fire risk. Enable the friendly fire checkbox to proceed.
                  </div>
                )}
              </div>

              <div className="bg-midnight-300/60 border border-shadow-800 rounded-lg p-5 space-y-4">
                <h2 className="text-lg font-semibold text-aurora-300 uppercase tracking-widest">Spell Details</h2>
                {selectedSpell ? (
                  <div className="space-y-2 text-sm text-shadow-100">
                    <div className="flex flex-wrap gap-4">
                      <span>
                        <strong>Level:</strong> {selectedSpell.level}
                      </span>
                      <span>
                        <strong>School:</strong> {selectedSpell.school}
                      </span>
                      <span>
                        <strong>Range:</strong> {selectedSpell.range}
                      </span>
                      <span>
                        <strong>Shape:</strong> {selectedSpell.effectShape}
                      </span>
                    </div>
                    <p className="text-shadow-200 leading-relaxed">{selectedSpell.description}</p>
                    {selectedSpell.higherLevels && (
                      <p className="text-shadow-300 italic pt-2">
                        <strong>At Higher Levels:</strong> {selectedSpell.higherLevels}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-shadow-300 text-sm">Select a spell to view details.</p>
                )}
              </div>

              <div className="bg-midnight-300/60 border border-shadow-800 rounded-lg p-5 space-y-4">
                <h3 className="text-lg font-semibold text-aurora-300 uppercase tracking-widest">Participants</h3>
                <div className="space-y-3 text-sm text-shadow-100">
                  {livingCharacters.map((character) => {
                    const isPlayer = 'isPlayer' in character ? character.isPlayer : false;
                    const avatarIcon =
                      'avatar' in character && character.avatar ? character.avatar : isPlayer ? '🛡️' : '💀';
                    return (
                      <div
                        key={character.id}
                        className="flex items-center justify-between bg-shadow-900/60 border border-shadow-800 px-3 py-2 rounded"
                      >
                        <div>
                          <div className="font-semibold">
                            {avatarIcon ? `${avatarIcon} ` : ''}
                            {character.name}
                          </div>
                          <div className="text-xs text-shadow-300">
                            HP {character.hp}/{character.maxHp} · AC {character.armorClass} · Pos (
                            {character.position.x}, {character.position.y})
                          </div>
                        </div>
                        <div className="text-xs uppercase tracking-widest">{isPlayer ? 'Ally' : 'Enemy'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="bg-midnight-300/60 border border-shadow-800 rounded-lg p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-shadow-300">Placement</span>
                    {(['target', 'ogre', 'ally', 'caster'] as PlacementMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPlacementMode(mode)}
                        className={`px-3 py-2 rounded text-xs font-semibold uppercase tracking-[0.25em] transition ${
                          placementMode === mode
                            ? 'bg-aurora-400 text-midnight-950'
                            : 'bg-shadow-900 text-shadow-200 hover:bg-shadow-800'
                        }`}
                      >
                        {mode === 'target'
                          ? 'Set Target'
                          : mode === 'ogre'
                            ? 'Place Enemy'
                            : mode === 'ally'
                              ? 'Place Ally'
                              : 'Place Self'}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={resetTargetToDefault}
                      className="rounded bg-shadow-900 px-3 py-2 border border-shadow-700 hover:bg-shadow-800 transition"
                    >
                      Clear Target
                    </button>
                    <button
                      type="button"
                      onClick={() => clearPlacedCharacter(OGRE_PLACEMENT_ID)}
                      className="rounded bg-shadow-900 px-3 py-2 border border-shadow-700 hover:bg-shadow-800 transition"
                    >
                      Clear Enemy
                    </button>
                    <button
                      type="button"
                      onClick={() => clearPlacedCharacter(ALLY_PLACEMENT_ID)}
                      className="rounded bg-shadow-900 px-3 py-2 border border-shadow-700 hover:bg-shadow-800 transition"
                    >
                      Clear Ally
                    </button>
                    <button
                      type="button"
                      onClick={() => resetCasterPosition()}
                      className="rounded bg-shadow-900 px-3 py-2 border border-shadow-700 hover:bg-shadow-800 transition"
                    >
                      Reset Self
                    </button>
                  </div>
                </div>
                <p className="text-xs text-shadow-400">
                  Active mode: <span className="font-semibold text-shadow-200">{placementMode}</span>. Click the grid to{' '}
                  {placementMode === 'target'
                    ? 'update the spell target'
                    : placementMode === 'ogre'
                      ? 'drop the test ogre (half HP remaining)'
                      : placementMode === 'ally'
                        ? 'drop the wounded ally (half HP)'
                        : 'move the caster to a new square'}
                  .
                </p>
                <div className="h-[420px] bg-shadow-900 rounded-md border border-shadow-700 p-4">
                  {selectedScenario && selectedSpell && (
                    <SpellEffectOverlay
                      gridWidth={selectedScenario.grid.width}
                      gridHeight={selectedScenario.grid.height}
                      casterPosition={
                        currentState?.characters.find((char) => char.id === selectedScenario.casterId)?.position ??
                        casterCharacter?.position ?? { x: 0, y: 0 }
                      }
                      targetPosition={
                        !isDirectionalShape(selectedSpell.effectShape) ? { x: targetX, y: targetY } : undefined
                      }
                      affectedSquares={overlayPreview?.affectedSquares ?? []}
                      pathSquares={
                        isDirectionalShape(selectedSpell.effectShape) ? (overlayPreview?.affectedSquares ?? []) : []
                      }
                      highlightSquares={scenarioCharacters
                        .filter((char) => !char.isPlayer)
                        .map((char) => char.position)}
                      obstacles={selectedScenario.obstacles}
                      characters={overlayCharacters}
                      onSquareClick={handleGridSquareClick}
                      effectShape={selectedSpell.effectShape}
                      effectColor={effectColor}
                      squaresLabel={
                        overlayPreview ? `${overlayPreview.affectedSquares.length} affected squares` : 'No data'
                      }
                      summary={{
                        friendlyFireRisk: overlayPreview?.friendlyFireRisk,
                        requiresLineOfSight: overlayPreview?.requiresLineOfSight,
                        lineOfSightBlocked: overlayPreview?.lineOfSightBlocked,
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="bg-midnight-300/60 border border-shadow-800 rounded-lg p-5 space-y-4">
                <h3 className="text-lg font-semibold text-aurora-300 uppercase tracking-widest">Casting Outcome</h3>
                {castData?.resolution ? (
                  <div className="space-y-3">
                    <p className="text-sm text-shadow-100">{castData.resolution.summary}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-shadow-200">
                      <div>
                        <h4 className="font-semibold text-shadow-50 uppercase tracking-widest mb-2">Attack Rolls</h4>
                        <div className="space-y-1">
                          {castData.resolution.attackRolls.map((roll) => (
                            <div key={roll.id} className="bg-shadow-900/60 border border-shadow-700 rounded px-2 py-1">
                              {roll.description}: <strong>{roll.finalResult}</strong>
                            </div>
                          ))}
                          {castData.resolution.attackRolls.length === 0 && <p>No attack rolls.</p>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-shadow-50 uppercase tracking-widest mb-2">Saving Throws</h4>
                        <div className="space-y-1">
                          {castData.resolution.savingThrows.map((roll) => (
                            <div key={roll.id} className="bg-shadow-900/60 border border-shadow-700 rounded px-2 py-1">
                              {roll.description}: <strong>{roll.finalResult}</strong>
                            </div>
                          ))}
                          {castData.resolution.savingThrows.length === 0 && <p>No saving throws.</p>}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-shadow-50 uppercase tracking-widest mb-2">Damage Rolls</h4>
                        <div className="space-y-1">
                          {castData.resolution.damageRolls.map((roll) => (
                            <div key={roll.id} className="bg-shadow-900/60 border border-shadow-700 rounded px-2 py-1">
                              {roll.description}: <strong>{roll.finalResult}</strong>
                            </div>
                          ))}
                          {castData.resolution.damageRolls.length === 0 && <p>No damage dealt.</p>}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-shadow-300">
                      {castData.resolution.friendlyFireOccurred
                        ? '⚠️ Allies were caught in the spell.'
                        : 'Allies avoided the effect.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-shadow-300">
                    Cast the spell to view deterministic attack, save, and damage rolls.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </PrivateLayout>
  );
}
